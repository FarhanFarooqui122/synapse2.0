"""
Synapse 1.0 hackathon boilerplate — FastAPI backend.

Comes with:
- CORS already configured for the Vite frontend
- SQLite CRUD for a generic "records" table (rename to fit your PS:
  transactions, applications, claims, budgets, whatever)
- One AI endpoint wired to the Anthropic API, ready to repurpose for
  classification / scoring / extraction / summarization — whatever
  your FinTech problem statement needs

Run with:  uvicorn main:app --reload --port 8000
"""
import os
from typing import Optional
from collections import defaultdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()
import anthropic

from database import init_db, get_db
from slack_loader import load_chat_messages
from colab_client import filter_message, analyze_message

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

class RecordIn(BaseModel):
    title: str
    category: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None


class AnalyzeRequest(BaseModel):
    text: str
    task: Optional[str] = "general"


class SyncTrigger(BaseModel):
    pass


# ---------- Health ----------

@app.get("/api/health")
def health():
    return {"status": "ok"}


def _urgency_to_score(urgency):
    mapping = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    if isinstance(urgency, (int, float)):
        return float(urgency)
    return mapping.get(str(urgency).lower(), 0)


def run_sync_pipeline():
    messages = load_chat_messages()
    team_data = defaultdict(lambda: {"message_count": 0, "urgency_scores": [], "category": None})

    for msg in messages:
        filter_result = filter_message(msg["text"])
        if filter_result.get("error") or filter_result.get("category") != "work-related concern":
            continue

        analysis = analyze_message(msg["text"])
        if analysis.get("error"):
            continue

        team = "Unassigned/Direct" if msg["type"] == "dm" else msg["conversation_id"]
        category = analysis.get("category", "general")
        urgency_score = _urgency_to_score(analysis.get("urgency", 0))

        team_data[team]["message_count"] += 1
        team_data[team]["urgency_scores"].append(urgency_score)
        team_data[team]["category"] = category

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM team_feedback")
        for team, data in team_data.items():
            avg_urgency = sum(data["urgency_scores"]) / len(data["urgency_scores"]) if data["urgency_scores"] else 0.0
            cur.execute(
                "INSERT INTO team_feedback (team, category, message_count, avg_urgency_score, last_updated) VALUES (?, ?, ?, ?, datetime('now'))",
                (team, data["category"], data["message_count"], round(avg_urgency, 2)),
            )
        conn.commit()

    return [dict(r) for r in cur.execute("SELECT * FROM team_feedback").fetchall()]


# ---------- CRUD: records ----------
# Rename "records" conceptually to match your PS. The table stays generic
# (title/category/amount/notes) so it fits transactions, loan applications,
# insurance claims, budget items, etc. without a schema rewrite mid-hackathon.

@app.get("/api/records")
def list_records():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM records ORDER BY id DESC").fetchall()
        return [dict(r) for r in rows]


@app.post("/api/records")
def create_record(record: RecordIn):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO records (title, category, amount, notes) VALUES (?, ?, ?, ?)",
            (record.title, record.category, record.amount, record.notes),
        )
        conn.commit()
        return {"id": cur.lastrowid, **record.dict()}


@app.delete("/api/records/{record_id}")
def delete_record(record_id: int):
    with get_db() as conn:
        cur = conn.execute("DELETE FROM records WHERE id = ?", (record_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"deleted": record_id}


# ---------- AI endpoint ----------
# One flexible endpoint you can steer with a different system prompt
# depending on what the spin-the-wheel PS turns out to be.

TASK_PROMPTS = {
    "general": "You are a helpful financial assistant. Respond concisely.",
    "categorize": (
        "You categorize financial transactions. Given a transaction description, "
        "respond with ONLY one category word: Food, Travel, Bills, Shopping, "
        "Entertainment, Health, Income, or Other."
    ),
    "fraud_check": (
        "You are a fraud-detection assistant. Given a transaction description, "
        "respond with a risk verdict: LOW, MEDIUM, or HIGH, followed by a one "
        "sentence reason."
    ),
    "risk_score": (
        "You assess credit/loan risk. Given the applicant info provided, respond "
        "with a risk score from 0-100 (0=safest) and a one sentence justification."
    ),
}


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    system_prompt = TASK_PROMPTS.get(req.task, TASK_PROMPTS["general"])
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": req.text}],
        )
        text_out = "".join(
            block.text for block in response.content if block.type == "text"
        )
        return {"result": text_out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Team Feedback Sync & API ----------

@app.post("/api/sync-chats")
def sync_chats():
    results = run_sync_pipeline()
    return {"synced": len(results), "team_feedback": results}


@app.get("/api/team-feedback")
def get_team_feedback():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM team_feedback ORDER BY avg_urgency_score DESC").fetchall()
        return [dict(r) for r in rows]
