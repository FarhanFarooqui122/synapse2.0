"""
InsightHR — AI-Powered Employee Feedback & Insights — FastAPI backend.

Flow:
1. Employees submit feedback (text, or voice transcribed client-side).
2. Each submission gets lightweight per-feedback AI analysis
   (sentiment / theme / emotion / priority) — non-blocking, never fails the submit.
3. POST /api/insights analyzes a bounded batch via the configured LLM
   (Gemini free tier by default, Anthropic optional) and returns structured
   JSON the dashboard renders.
4. Frontend dashboard reads GET /api/feedback + POST /api/insights.

Run with:  uvicorn main:app --reload --port 8000
"""
import logging
import os
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from database import init_db, get_db
from llm import (
    INSIGHTS_SYSTEM,
    LLMConfigError,
    analyze_single_feedback,
    complete_json,
    get_provider,
    sanitize_insights,
)
from simulation import run_simulation, build_heatmap_data

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("insighthr")

MAX_FEEDBACK_LENGTH = 5000
MAX_INSIGHT_ENTRIES = 50   # never send more than this many rows to the LLM
MAX_ENTRY_CHARS = 500      # truncate each entry so the prompt stays bounded

VALID_FEEDBACK_TYPES = ("feedback", "complaint")
VALID_STATUSES = ("open", "investigating", "resolved")

# CSPRNG alphabet without ambiguous chars (no 0/O, 1/I/L)
_TRACKING_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def _new_tracking_id() -> str:
    return "CMP-" + "".join(secrets.choice(_TRACKING_ALPHABET) for _ in range(8))


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

app = FastAPI(title="InsightHR API")

origins = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ---------- Schemas ----------

class FeedbackIn(BaseModel):
    text: str
    source: Optional[str] = "text"          # "text" or "voice"
    category: Optional[str] = None
    department: Optional[str] = None
    anonymous: Optional[bool] = True
    employee_name: Optional[str] = None     # ignored if anonymous is True
    feedback_type: Optional[str] = "feedback"  # "feedback" or "complaint"


class StatusUpdate(BaseModel):
    status: str                             # open | investigating | resolved
    resolution_note: Optional[str] = None   # required when resolving


def _public_row(row) -> dict:
    """Serialize a DB row; never leak a name for anonymous feedback.

    Never includes tracking_id — it is a bearer secret returned only once,
    in the POST /api/feedback response for complaints.
    """
    anonymous = bool(row["anonymous"])
    return {
        "id": row["id"],
        "text": row["text"],
        "source": row["source"] or "text",
        "category": row["category"],
        "department": row["department"],
        "anonymous": anonymous,
        "employee_name": None if anonymous else row["employee_name"],
        "sentiment": row["sentiment"],
        "theme": row["theme"],
        "emotion": row["emotion"],
        "priority": row["priority"],
        "feedback_type": row["feedback_type"] or "feedback",
        "status": row["status"] or "open",
        "resolution_note": row["resolution_note"],
        "resolved_at": row["resolved_at"],
        "updated_at": row["updated_at"],
        "created_at": row["created_at"],
    }


# ---------- Health ----------

@app.get("/api/health")
def health():
    return {"status": "ok", "llm_provider": get_provider()}


# ---------- Background AI analysis ----------
async def _analyze_and_update(feedback_id: int, text: str, category: str | None, is_complaint: bool):
    """Run AI analysis in background and update the feedback record."""
    ai = analyze_single_feedback(text, category, is_complaint=is_complaint)
    if ai:
        with get_db() as conn:
            conn.execute(
                "UPDATE feedback SET sentiment = ?, theme = ?, emotion = ?, priority = ? WHERE id = ?",
                (ai.get("sentiment"), ai.get("theme"), ai.get("emotion"), ai.get("priority"), feedback_id),
            )
            conn.commit()


# ---------- CRUD: feedback ----------

@app.get("/api/feedback")
def list_feedback():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM feedback ORDER BY id DESC").fetchall()
        return [_public_row(r) for r in rows]


@app.post("/api/feedback")
async def create_feedback(feedback: FeedbackIn, background_tasks: BackgroundTasks):
    text = (feedback.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Feedback text is required.")
    if len(text) > MAX_FEEDBACK_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Feedback is too long (max {MAX_FEEDBACK_LENGTH} characters).",
        )
    source = (feedback.source or "text").strip().lower()
    if source not in ("text", "voice"):
        source = "text"
    category = (feedback.category or "").strip()[:60] or None
    department = (feedback.department or "").strip()[:60] or None
    anonymous = bool(feedback.anonymous)
    # Never store a name if the employee chose anonymous — enforce
    # server-side, don't just trust the frontend to hide it.
    name = None if anonymous else ((feedback.employee_name or "").strip()[:80] or None)
    feedback_type = (feedback.feedback_type or "feedback").strip().lower()
    if feedback_type not in VALID_FEEDBACK_TYPES:
        feedback_type = "feedback"
    is_complaint = feedback_type == "complaint"

    # Anonymous complaints get an unguessable tracking ID so the employee
    # can check status later without any identity link. Generated for every
    # complaint, but only shown to the submitter in the POST response.
    tracking_id = _new_tracking_id() if is_complaint else None

    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO feedback "
            "(text, source, category, department, anonymous, employee_name, "
            " sentiment, theme, emotion, priority, feedback_type, status, tracking_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)",
            (
                text, source, category, department, int(anonymous), name,
                None, None, None, None,  # AI fields filled in background
                feedback_type, tracking_id,
            ),
        )
        conn.commit()
        feedback_id = cur.lastrowid
        row = conn.execute(
            "SELECT * FROM feedback WHERE id = ?", (feedback_id,)
        ).fetchone()
        result = _public_row(row)
        result["ai_analyzed"] = False
        if tracking_id:
            result["tracking_id"] = tracking_id

    # Run AI analysis in background (non-blocking)
    background_tasks.add_task(_analyze_and_update, feedback_id, text, category, is_complaint)

    return result


@app.delete("/api/feedback/{feedback_id}")
def delete_feedback(feedback_id: int):
    with get_db() as conn:
        cur = conn.execute("DELETE FROM feedback WHERE id = ?", (feedback_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Feedback not found")
        return {"deleted": feedback_id}


@app.patch("/api/feedback/{feedback_id}/status")
def update_status(feedback_id: int, update: StatusUpdate):
    """HR action: move a complaint/feedback through open → investigating → resolved."""
    status = (update.status or "").strip().lower()
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Use one of: {', '.join(VALID_STATUSES)}.",
        )
    note = (update.resolution_note or "").strip()[:1000] or None
    if status == "resolved" and not note:
        raise HTTPException(
            status_code=400,
            detail="A resolution note is required when marking as resolved.",
        )
    resolved_at = _now_iso() if status == "resolved" else None
    with get_db() as conn:
        cur = conn.execute(
            "UPDATE feedback SET status = ?, resolution_note = ?, "
            "resolved_at = ?, updated_at = CURRENT_TIMESTAMP "
            "WHERE id = ?",
            (status, note, resolved_at, feedback_id),
        )
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Feedback not found")
        row = conn.execute(
            "SELECT * FROM feedback WHERE id = ?", (feedback_id,)
        ).fetchone()
        return _public_row(row)


@app.get("/api/complaints/status/{tracking_id}")
def complaint_status(tracking_id: str):
    """Anonymous status lookup. Returns ONLY what the complainant may see —
    no identity, no department, no internal data. Invalid IDs get a plain
    404 so IDs can't be enumerated."""
    tid = (tracking_id or "").strip().upper()
    if not tid:
        raise HTTPException(status_code=404, detail="Complaint not found")
    with get_db() as conn:
        row = conn.execute(
            "SELECT text, feedback_type, status, resolution_note, "
            "created_at, updated_at FROM feedback WHERE tracking_id = ?",
            (tid,),
        ).fetchone()
    if row is None or (row["feedback_type"] or "feedback") != "complaint":
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {
        "feedback_type": "complaint",
        "status": row["status"] or "open",
        "resolution_note": row["resolution_note"],
        "text": row["text"],
        "submitted_at": row["created_at"],
        "updated_at": row["updated_at"] or row["created_at"],
    }


# ---------- AI insights endpoint ----------
# Sends a BOUNDED batch of feedback entries to the configured LLM and asks
# for structured JSON back: summary, sentiment distribution, themes,
# concerns, actionable insights. This is what the dashboard renders.

@app.post("/api/insights")
def generate_insights():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, text, category, feedback_type, status FROM feedback "
            "ORDER BY id DESC LIMIT ?",
            (MAX_INSIGHT_ENTRIES,),
        ).fetchall()

    if not rows:
        raise HTTPException(status_code=400, detail="No feedback submitted yet")

    lines = []
    for r in rows:
        snippet = (r["text"] or "").strip().replace("\n", " ")[:MAX_ENTRY_CHARS]
        tag = f" [{r['category']}]" if r["category"] else ""
        if (r["feedback_type"] or "feedback") == "complaint":
            tag += f" [COMPLAINT, status={r['status'] or 'open'}]"
        lines.append(f"-{tag} {snippet}")
    feedback_list = "\n".join(lines)

    try:
        insights = complete_json(
            INSIGHTS_SYSTEM,
            f"Analyze these {len(rows)} employee feedback entries:\n{feedback_list}",
            max_tokens=1024,
        )
        return sanitize_insights(insights, len(rows))
    except LLMConfigError as e:
        # 503 (not 500): the server is fine, it just needs a key.
        raise HTTPException(status_code=503, detail=str(e))
    except (RuntimeError, ValueError) as e:
        raise HTTPException(status_code=502, detail=str(e)[:300])
    except Exception:
        logger.exception("Unexpected insights failure")
        raise HTTPException(status_code=500, detail="AI analysis failed. Try again.")


# ---------- Slack Chat Feedback ----------

@app.get("/api/slack-feedback")
def slack_feedback():
    results = run_simulation()
    heatmap = build_heatmap_data(results)
    return {"team_feedback": results, "heatmap_data": heatmap}
