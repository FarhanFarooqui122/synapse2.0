# AGENTS.md

Context and standing instructions for AI coding agents (e.g. OpenCode) working in this repo.

## Project

Synapse1.0 — an AI-powered employee feedback system. It collects feedback (currently via manual text/voice input) and gives HR a dashboard with themes, concerns, and urgency levels. Repo has backend/ and frontend/ folders — verify their frameworks/conventions before writing new code, and match existing style (naming, structure, language idioms) rather than introducing new patterns.

## Current task: add two feedback sources

We're extending the system so feedback also flows in automatically from employee chat messages, instead of requiring manual typing. This has two parts:

### 1. Colab-hosted model client

Two ML models (a RoBERTa sentiment classifier and a BART-MNLI zero-shot classifier) run on Google Colab behind a FastAPI app tunneled through ngrok. They are NOT to be reimplemented locally — always call them over HTTP.

Endpoints:
- POST {COLAB_API_URL}/analyze — body {"text": "..."} — returns {"sentiment": ..., "category": ..., "urgency": ...}
- POST {COLAB_API_URL}/filter — body {"text": "..."} — returns which of ["work-related concern", "casual conversation"] the text matched

Build a client module (location matching repo conventions, likely under backend/) exposing filter_message(text) and analyze_message(text). Read COLAB_API_URL from environment variables only — never hardcode it. Handle timeouts and connection failures gracefully (the Colab tunnel is not always up).

### 2. Mock Slack-style chat feedback source

We don't have a real Slack integration yet, so simulate one:
- Generate data/mock_slack_chats.json with realistic fictional employee chat data: a mix of 1:1 DMs and group channel conversations, at least 4 conversations total, mostly casual/logistics messages plus a handful of clearly work-related feedback messages varying in tone (mildly negative, positive, and at least one higher-urgency concern such as burnout or a workplace conduct issue). Keep it obviously fictional.
- Structure:
  { "conversations": [ { "conversation_id": "...", "type": "dm" | "group", "members": ["..."], "messages": [ {"user": "...", "text": "...", "timestamp": "..."} ] } ] }
- Write a loader that reads this file and returns a flat list of {conversation_id, type, user, text, timestamp}. Keep its signature generic — a future real Slack API puller should be a drop-in replacement for this one module, nothing downstream should need to change.

### 3. Pipeline wiring

A sync process should: load chat messages -> filter_message() each -> for ones matching "work-related concern", run analyze_message() -> aggregate results by conversation_id/team. DM-sourced results (no team) get tagged "Unassigned/Direct". Write aggregated output into whatever store the existing dashboard already reads from, matching its current schema.

## Hard rules (always follow, every task)

- Never expose raw per-employee message text or usernames in dashboard-facing output. Only aggregated, anonymized results (counts, themes, urgency levels grouped by team) should reach the dashboard.
- Never commit secrets. COLAB_API_URL and any tokens go in .env, which must stay gitignored. Add new required variables to .env.example with placeholder values, not real ones.
- Before writing code for a new feature, briefly summarize the relevant existing code/conventions back to the user first.
- Before pushing to master, show the diff or a summary of changed files.
- If the existing dashboard's data format or storage layer is unclear, ask rather than guessing.
