# Session Changes — InsightHR (AI-Powered Employee Feedback & Insights)

All work in this session was done incrementally on the existing
`synapse-boilerplate` MVP. No redesign, no new infrastructure
(no auth, Postgres, vectors, LangChain, Whisper, Redis, etc.).

Stack: React 18 (Vite) + FastAPI + SQLite (raw sqlite3) + Gemini (free tier) / Anthropic fallback.

---

## Phase 1 — MVP: end-to-end feedback → AI → HR dashboard

### Backend

- **`backend/llm.py` (NEW)** — provider abstraction. Gemini free tier by default
  (stdlib `urllib` REST to `v1beta …:generateContent`, zero new dependencies),
  Anthropic SDK as fallback. Provider via `LLM_PROVIDER`; keys from env only,
  never sent to frontend. Clear `LLMConfigError` messages when keys are missing
  (surfaced as HTTP 503, not obscure 500s). Includes JSON extraction tolerant
  of fences/prose, `analyze_single_feedback()` (non-blocking, returns `None`
  on failure), `sanitize_insights()` (guarantees dashboard schema, coerces
  sentiment counts to entry count), and both system prompts.
- **`backend/main.py`** — feedback CRUD now persists `category`, validates
  (non-empty, ≤5000 chars, `source` whitelist), strips `employee_name`
  server-side for anonymous posts, runs per-feedback AI (never fails the
  submit; `ai_analyzed` flag in response). `POST /api/insights` sends a
  **bounded** batch (≤50 entries, ≤500 chars each), returns sanitized
  `{summary, sentiment, themes[], concerns[], actionable_insights[]}`;
  503 on missing key, 502 on provider errors. CORS origins via `FRONTEND_ORIGIN`.
- **`backend/database.py`** — added `category`, `theme`, `emotion`, `priority`
  columns; migration-safe `migrate_db()` (`PRAGMA table_info` + `ALTER TABLE`,
  constant-defaults only).
- **`backend/.env.example`** — `LLM_PROVIDER`, `GEMINI_API_KEY`,
  `GEMINI_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `FRONTEND_ORIGIN`.

### Frontend (existing CSS/components/routing reused)

- **`src/api.js`** — `VITE_API_BASE` override; added `updateStatus`,
  `complaintStatus` (Phase 3).
- **`src/pages/Employee.jsx`** — success screen ONLY on real API success;
  submitting state + inline server errors; remembers non-anonymous identity
  in `localStorage` for My Feedback.
- **`src/components/employee/FeedbackForm.jsx`** — submitting/error states,
  header-toggle sync, department selectable for anonymous too, feedback-type
  selector (Phase 3), complaint-aware privacy copy.
- **`src/components/employee/VoiceRecorder.jsx`** — explicit notice when
  browser speech recognition is unavailable (no more silent failure).
- **`src/pages/Dashboard.jsx`** — fully wired to `GET /api/feedback` +
  `POST /api/insights`: real KPIs, AI summary, sentiment trend from real
  dates, theme/emotion aggregation, concerns, insights, real Recent Feedback,
  working CSV export, date-range filter, loading/error/empty/analyzing states,
  Generate AI Insights button.
- **Dashboard components** — `RecentFeedback` (real row shape, type badges,
  "Anonymous Employee", *Pending analysis* placeholders),
  `SentimentTrend` + `TopConcerns` (real-data props, clean limited-data
  states, **no mock fallbacks**), `PriorityIssueCard` (optional stats),
  `ComplaintCard` (NEW, Phase 3).
- **`src/index.css`** — only additive styles (form errors, state cards,
  pending labels, type badges, tracking ID, complaint/my-feedback blocks);
  KPI grid extended to 6 columns.

---

## Phase 2 — Demo-polish pass

- **Gemini default model → `gemini-3.5-flash`** (`llm.py`, `.env.example`):
  verified via current Google docs that `gemini-1.5-flash` / `2.0-flash` are
  shut down. REST endpoint + `responseMimeType: application/json` confirmed
  still valid; HTTP 404 (unknown model) now yields an actionable config error
  naming the current `GEMINI_MODEL`.
- **Controlled AI vocabularies** — 12 themes, 8 emotions, strict
  sentiment/priority sets; off-list output coerced (`Other`/`Neutral`);
  employee category treated as hint-only.
- **Better prompts** — HR-analyst framing for single analysis; batch prompt
  requires counted themes, severity-ranked concerns with `evidence_count`,
  and concrete HR actions (anti-generic guidance).
- **Mock purge** — live Dashboard/Employee paths import zero `MOCK_*` data
  (only the standalone Analysis demo page and `CATEGORIES`/`DEPARTMENTS`
  constants remain).
- **`backend/seed.py` (NEW)** — 18 fictional feedback rows across 45 days,
  idempotent, `--reset`, `--raw` (NULL AI labels). Default ships sample AI
  labels so the dashboard renders fully before a live key is configured.
- **`README.md`** — pivot banner + 6-step Demo Setup section.

---

## Phase 3 — Complaints: HR action + employee updates

### Database (`backend/database.py`)

New migration-safe columns: `feedback_type` (`feedback`|`complaint`,
default `feedback`), `status` (`open`|`investigating`|`resolved`, default
`open`), `resolution_note`, `resolved_at`, `tracking_id`, `updated_at`.
Also fixed `migrate_db` to skip non-constant defaults (`CURRENT_TIMESTAMP`
crashes `ALTER TABLE`).

### Backend (`backend/main.py`, `backend/llm.py`)

- `POST /api/feedback` accepts `feedback_type`; complaints get an
  unguessable `CMP-XXXXXXXX` tracking ID (CSPRNG), returned **only** in the
  POST response — never in list output.
- `PATCH /api/feedback/{id}/status` — validates status, requires a
  resolution note when resolving, sets/clears `resolved_at`, bumps
  `updated_at`.
- `GET /api/complaints/status/{tracking_id}` — returns only
  `{feedback_type, status, resolution_note, text, submitted_at, updated_at}`;
  unknown IDs → identical 404 (no enumeration, no identity/department leak).
- AI is complaint-aware (severity/urgency guidance, no invented facts);
  batch lines tagged `[COMPLAINT, status=…]`. Verified: **no employee name
  ever reaches any LLM prompt** (tested by capturing prompts).
- No separate notifications table — `status` + `resolution_note` +
  `updated_at` are the in-app update mechanism (deliberate simplification).

### Frontend

- **Feedback form** — General Feedback / Complaint selector; anonymous
  complaint copy promises a tracking ID; non-anonymous copy states name +
  department visible to HR.
- **`SubmissionSuccess`** — three variants: normal feedback; anonymous
  complaint (lock icon + tracking ID + link); named complaint (points to
  My Feedback).
- **`src/pages/MyFeedback.jsx` (NEW) + `/my-feedback` route** — anonymous
  tracking-ID lookup and name-based "my submissions" with Status / HR update
  / Updated date. Anonymous rows can never appear (no stored name).
  Enabled in header nav + sidebar.
- **HR dashboard** — Open Complaints KPI; Active Complaints section with
  inline status dropdown + note editor (saves via PATCH, updates in place);
  type badges (⚠ Complaint / Feedback), status, "Anonymous Employee" in
  Recent Feedback; CSV export includes new fields.

---

## Tests performed (all passing)

- MVP: 11/11 API checks (create/anon/named/voice, empty + overlong 400s,
  SQLite round-trip, no name leak, missing-key 503, sanitizer coercion).
- Polish: 16/16 (vocab coercion, `evidence_count`, seed insert + idempotency,
  controlled AI fields, empty-400, missing-key 503).
- Complaints: 22/22 scenarios A–D (anon lifecycle incl. reopen, validation
  400s, named flow, normal-feedback isolation, DB/API/LLM privacy, ID
  uniqueness) + legacy-DB migration test.
- `npm run build` succeeds after every frontend change.

## How to run

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # set GEMINI_API_KEY (free: https://aistudio.google.com/apikey)
uvicorn main:app --reload --port 8000
python seed.py          # optional demo data
# new terminal:
cd frontend && npm install && npm run dev   # http://localhost:5173
```

## Known limitations

- No live-LLM call was possible in this environment (no key); AI paths are
  stub-tested — do one keyed run before demoing (`GEMINI_MODEL` is env-tunable).
- No auth/RBAC, no server-side audio STT (browser transcription only),
  no rate-limiting on the tracking-ID endpoint, no note history (latest note only).
- Seed labels are illustrative sample data, not model output.
- `backend/fraud_model.py` is dead FinTech leftover — do not import it.
