# Synapse 1.0 — FinTech Hackathon Boilerplate

A working full-stack starter so you're not scaffolding from zero when the
problem statement drops. Stack: **React (Vite) + FastAPI + SQLite + Anthropic API**.

## What's already working

- React frontend with a dashboard chart, a form to add records, and an AI panel
- FastAPI backend with CRUD endpoints (`/api/records`) and one AI endpoint (`/api/analyze`)
- SQLite DB — zero setup, just a file
- CORS already configured between frontend (port 5173) and backend (port 8000)
- One flexible AI endpoint pre-wired for 4 tasks: general Q&A, transaction
  categorization, fraud risk check, and credit/loan risk scoring — pick
  whichever matches your PS, or add a new one in `TASK_PROMPTS` in `main.py`

## Setup (do this BEFORE the hackathon)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # then paste your Anthropic API key into .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — you should see the dashboard, and
http://localhost:8000/api/health should return `{"status": "ok"}`.

**Do this tonight, not on the day.** `npm install` and `pip install` need
internet and can be slow on shared venue wifi.

## On the day: how to pivot fast once you get the PS

This boilerplate assumes a generic "records" concept (title, category,
amount, notes). Map your actual PS onto it:

| If your PS is about...        | Rename "records" to...     | Use AI task...     |
|--------------------------------|-----------------------------|---------------------|
| Personal finance / budgeting  | expenses, budgets           | `categorize`        |
| Fraud detection                | transactions                | `fraud_check`       |
| Credit scoring / loans         | applications                | `risk_score`        |
| Financial literacy tools       | lessons, quizzes            | `general`           |
| Payments / UPI                 | payments                    | `fraud_check`       |
| Insurance-tech                 | claims                      | `risk_score`        |

To pivot:
1. In `backend/database.py`, adjust the `records` table columns if needed
   (add/remove fields — keep it minimal, you don't need a perfect schema).
2. In `backend/main.py`, tweak or add a `TASK_PROMPTS` entry so the AI
   endpoint's system prompt matches your PS exactly.
3. In `frontend/src/App.jsx`, update the chart aggregation logic and labels.
4. Everything else (CRUD, chart rendering, AI panel UI) stays as-is.

This should take 15-20 minutes, leaving the rest of the 8 hours for the
actual problem logic and polish.

## Team role suggestion (3 people)

- **Lead:** architecture decisions, integration, owns the pitch
- **Member 2:** backend/API/AI logic
- **Member 3:** frontend/UI + data viz/polish

## Notes

- `hackathon.db` (SQLite file) is created automatically on first backend run.
- Don't commit your real `.env` — only `.env.example` is meant to be shared.
- Swap `recharts` bar chart for line/pie chart if your data suits it better
  (recharts supports both, same import pattern).
