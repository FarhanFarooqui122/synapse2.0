"""
Synapse 1.0 — AI-Powered Employee Feedback & Insights — FastAPI backend.

Flow:
1. Employees submit feedback (text, or voice transcribed client-side).
2. POST /api/insights sends all feedback to Claude and gets back structured
   themes / concerns / summary / sentiment breakdown as JSON.
3. Frontend dashboard renders that JSON.

Run with:  uvicorn main:app --reload --port 8000
"""
import json
import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic

from database import init_db, get_db

load_dotenv()

app = FastAPI(title="Synapse 1.0 Hackathon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

init_db()


# ---------- Schemas ----------

class FeedbackIn(BaseModel):
    text: str
    source: Optional[str] = "text"        # "text" or "voice"
    department: Optional[str] = None
    anonymous: Optional[bool] = True
    employee_name: Optional[str] = None   # ignored if anonymous is True


# ---------- Health ----------

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------- CRUD: feedback ----------

@app.get("/api/feedback")
def list_feedback():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM feedback ORDER BY id DESC").fetchall()
        return [dict(r) for r in rows]


@app.post("/api/feedback")
def create_feedback(feedback: FeedbackIn):
    # Never store a name if the employee chose anonymous — enforce server-side,
    # don't just trust the frontend to hide it.
    name = None if feedback.anonymous else feedback.employee_name
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO feedback (text, source, department, anonymous, employee_name) "
            "VALUES (?, ?, ?, ?, ?)",
            (feedback.text, feedback.source, feedback.department, int(feedback.anonymous), name),
        )
        conn.commit()
        return {
            "id": cur.lastrowid,
            "text": feedback.text,
            "source": feedback.source,
            "department": feedback.department,
            "anonymous": feedback.anonymous,
            "employee_name": name,
        }


@app.delete("/api/feedback/{feedback_id}")
def delete_feedback(feedback_id: int):
    with get_db() as conn:
        cur = conn.execute("DELETE FROM feedback WHERE id = ?", (feedback_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Feedback not found")
        return {"deleted": feedback_id}


# ---------- AI insights endpoint ----------
# Sends every feedback entry to Claude in one batch and asks for
# structured JSON back: themes, concerns, a summary, and a sentiment
# breakdown. This is what the dashboard renders.

INSIGHTS_SYSTEM_PROMPT = """You are an HR analytics assistant. You will be given
a list of employee feedback entries. Analyze them and respond with ONLY a
valid JSON object (no markdown fences, no preamble) in exactly this shape:

{
  "summary": "2-3 sentence overall summary",
  "themes": ["theme 1", "theme 2", "theme 3"],
  "concerns": ["concern 1", "concern 2"],
  "actionable_insights": ["insight 1", "insight 2"],
  "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0}
}

sentiment_breakdown counts should sum to the number of feedback entries given.
Keep each list item short (under 12 words). Respond with ONLY the JSON object."""


@app.post("/api/insights")
def generate_insights():
    with get_db() as conn:
        rows = conn.execute("SELECT text FROM feedback ORDER BY id DESC").fetchall()

    if not rows:
        raise HTTPException(status_code=400, detail="No feedback submitted yet")

    feedback_list = "\n".join(f"- {r['text']}" for r in rows)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=INSIGHTS_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": feedback_list}],
        )
        text_out = "".join(
            block.text for block in response.content if block.type == "text"
        )
        # Strip accidental markdown fences just in case
        cleaned = text_out.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        insights = json.loads(cleaned)
        return insights
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Model did not return valid JSON. Try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
