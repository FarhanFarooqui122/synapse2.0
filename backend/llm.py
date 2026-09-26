"""
LLM provider abstraction for the MVP.

- Default: Google Gemini free tier (no new dependencies — plain HTTPS via
  urllib to the Generative Language REST API).
- Fallback: Anthropic (uses the `anthropic` SDK already in requirements.txt).
- Groq (OpenAI-compatible API) via OPENCODE_ZEN_* env vars.

The API key NEVER leaves the backend. The provider is chosen with the
LLM_PROVIDER env var; keys come from env vars only.

    LLM_PROVIDER=gemini          # or: anthropic, groq
    GEMINI_API_KEY=...
    GEMINI_MODEL=gemini-3.5-flash   # optional override
    ANTHROPIC_API_KEY=...
    ANTHROPIC_MODEL=...             # optional override
    OPENCODE_ZEN_API_KEY=...        # Groq API key
    OPENCODE_ZEN_BASE_URL=...       # Groq base URL (default: https://api.groq.com/openai/v1)
    OPENCODE_ZEN_MODEL=...          # Groq model (default: qwen/qwen3.8-27b)
"""
import json
import logging
import os
import urllib.request
import urllib.error

logger = logging.getLogger("insighthr.llm")

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)

# Default model: cheap, fast, free-tier eligible. Override with GEMINI_MODEL
# if your key/tier needs a different one (e.g. gemini-3.5-flash-latest).
DEFAULT_GEMINI_MODEL = "gemini-3.5-flash"

DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"


class LLMConfigError(RuntimeError):
    """Raised when the provider/key is missing or invalid (user-fixable)."""


def get_provider() -> str:
    return os.getenv("LLM_PROVIDER", "groq").strip().lower() or "groq"


def _extract_json(text: str) -> dict:
    """Pull a JSON object out of model output, tolerating fences/prose."""
    cleaned = text.strip()
    for prefix in ("```json", "```"):
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
        if cleaned.endswith("```"):
            cleaned = cleaned[: -len("```")]
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    # Last resort: first '{' ... last '}'
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(cleaned[start: end + 1])
    raise ValueError("Model did not return valid JSON.")


def _gemini_complete(system_prompt: str, user_text: str, max_tokens: int) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise LLMConfigError(
            "GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env "
            "and add your free Gemini key (https://aistudio.google.com/apikey)."
        )
    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip() or DEFAULT_GEMINI_MODEL
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": user_text}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": max_tokens,
            "responseMimeType": "application/json",
        },
    }
    req = urllib.request.Request(
        f"{GEMINI_API_URL.format(model=model)}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        if e.code in (400, 403, 404):
            raise LLMConfigError(
                f"Gemini API rejected the request (HTTP {e.code}). "
                f"Check GEMINI_API_KEY and GEMINI_MODEL "
                f"(current: '{model}'). Details: {detail}"
            )
        raise RuntimeError(f"Gemini API error (HTTP {e.code}): {detail}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Could not reach Gemini API: {e.reason}")
    try:
        parts = body["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts)
    except (KeyError, IndexError, TypeError):
        # e.g. safety block / empty candidates — don't leak the whole body
        logger.error("Unexpected Gemini response shape: %s", str(body)[:300])
        raise RuntimeError("Gemini returned an unexpected response. Try again.")


def _anthropic_complete(system_prompt: str, user_text: str, max_tokens: int) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise LLMConfigError(
            "ANTHROPIC_API_KEY is not set. Set LLM_PROVIDER=gemini with a free "
            "GEMINI_API_KEY, or add your Anthropic key to backend/.env."
        )
    try:
        import anthropic
    except ImportError:
        raise RuntimeError(
            "The 'anthropic' package is not installed. Run: pip install -r requirements.txt"
        )
    model = (
        os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-latest").strip()
        or "claude-3-5-haiku-latest"
    )
    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_text}],
        )
    except Exception as e:
        msg = str(e)
        if "401" in msg or "authentication" in msg.lower() or "api key" in msg.lower():
            raise LLMConfigError(f"Anthropic rejected the API key: {msg[:200]}")
        raise RuntimeError(f"Anthropic API error: {msg[:300]}")
    return "".join(
        block.text for block in response.content if getattr(block, "type", "") == "text"
    )


def _groq_complete(system_prompt: str, user_text: str, max_tokens: int) -> str:
    api_key = os.getenv("OPENCODE_ZEN_API_KEY", "").strip()
    if not api_key:
        raise LLMConfigError(
            "OPENCODE_ZEN_API_KEY is not set. Add your Groq key to backend/.env "
            "(get one free at https://console.groq.com/keys)."
        )
    base_url = os.getenv("OPENCODE_ZEN_BASE_URL", DEFAULT_GROQ_BASE_URL).strip() or DEFAULT_GROQ_BASE_URL
    model = os.getenv("OPENCODE_ZEN_MODEL", DEFAULT_GROQ_MODEL).strip() or DEFAULT_GROQ_MODEL
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        "temperature": 0.2,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
    }
    req = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        if e.code in (400, 401, 403, 404):
            raise LLMConfigError(
                f"Groq API rejected the request (HTTP {e.code}). "
                f"Check OPENCODE_ZEN_API_KEY and OPENCODE_ZEN_MODEL "
                f"(current: '{model}'). Details: {detail}"
            )
        raise RuntimeError(f"Groq API error (HTTP {e.code}): {detail}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Could not reach Groq API: {e.reason}")
    try:
        return body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        logger.error("Unexpected Groq response shape: %s", str(body)[:300])
        raise RuntimeError("Groq returned an unexpected response. Try again.")


def complete_json(system_prompt: str, user_text: str, max_tokens: int = 1024) -> dict:
    """Call the configured provider and return the parsed JSON object."""
    provider = get_provider()
    if provider == "anthropic":
        raw = _anthropic_complete(system_prompt, user_text, max_tokens)
    elif provider == "gemini":
        raw = _gemini_complete(system_prompt, user_text, max_tokens)
    elif provider == "groq":
        raw = _groq_complete(system_prompt, user_text, max_tokens)
    else:
        raise LLMConfigError(
            f"Unknown LLM_PROVIDER='{provider}'. Use 'gemini', 'anthropic', or 'groq'."
        )
    try:
        return _extract_json(raw)
    except (ValueError, json.JSONDecodeError):
        logger.error("Model returned non-JSON output: %s", raw[:300])
        raise RuntimeError("Model did not return valid JSON. Try again.")


# ---------- Task prompts ----------

# Controlled vocabularies — the model must pick from these so the dashboard
# stays consistent. Anything off-list is coerced to the fallback.
THEMES = [
    "Workload", "Management", "Compensation", "Work Culture", "Career Growth",
    "Recognition", "Communication", "Work-Life Balance", "Technology",
    "Benefits", "Team Collaboration", "Other",
]
EMOTIONS = [
    "Satisfied", "Neutral", "Frustrated", "Concerned", "Motivated",
    "Stressed", "Disappointed", "Appreciative",
]


def _match_vocab(value: str, vocab: list, fallback: str) -> str:
    """Case-insensitive match against a controlled vocabulary."""
    cleaned = (value or "").strip().lower()
    for item in vocab:
        if item.lower() == cleaned:
            return item
    return fallback


SINGLE_ANALYSIS_SYSTEM = """You are an HR analyst reading ONE employee feedback entry.
Think about: what is the employee actually saying? Is it positive, neutral or
negative? Which organizational topic does it relate to? What emotion is being
expressed? How urgent is it for HR?

Respond with ONLY a valid JSON object (no markdown, no preamble) in exactly this shape:
{"sentiment": "positive|neutral|negative", "theme": "<one of: Workload, Management, Compensation, Work Culture, Career Growth, Recognition, Communication, Work-Life Balance, Technology, Benefits, Team Collaboration, Other>", "emotion": "<one of: Satisfied, Neutral, Frustrated, Concerned, Motivated, Stressed, Disappointed, Appreciative>", "priority": "low|medium|high"}

Guidelines: choose the theme that best fits what was said (the employee's own
tag is only a hint — never force an unrelated category). priority=high only
for urgent or serious negative issues (e.g. burnout, unfair treatment, intent
to leave); low for positive notes, suggestions or trivial remarks; medium
otherwise."""


def analyze_single_feedback(
    text: str, category: str | None = None, is_complaint: bool = False
) -> dict | None:
    """Analyze one feedback entry. Returns None on any failure (non-blocking).

    Only text + category (+ complaint flag) are ever sent — never identity.
    """
    hint = f" The employee tagged it as category: {category}." if category else ""
    complaint_ctx = (
        " This is an explicit COMPLAINT the employee wants HR to investigate: "
        "weigh severity, urgency, the area affected and whether immediate HR "
        "attention may be appropriate — but never invent facts (no affected "
        "headcounts, dates or names unless stated)."
        if is_complaint else ""
    )
    try:
        out = complete_json(
            SINGLE_ANALYSIS_SYSTEM,
            f"Feedback:{hint}{complaint_ctx}\n{text[:1500]}",
            max_tokens=256,
        )
        sentiment = str(out.get("sentiment", "")).lower()
        priority = str(out.get("priority", "")).lower()
        return {
            "sentiment": sentiment if sentiment in ("positive", "neutral", "negative") else None,
            "theme": _match_vocab(str(out.get("theme", "")), THEMES, "Other"),
            "emotion": _match_vocab(str(out.get("emotion", "")), EMOTIONS, "Neutral"),
            "priority": priority if priority in ("low", "medium", "high") else None,
        }
    except Exception as e:
        logger.warning("Per-feedback AI analysis failed, storing without AI fields: %s", e)
        return None


def summarize_single_feedback(
    text: str, category: str | None = None, is_complaint: bool = False
) -> dict:
    """On-demand, per-item AI summary + suggested action for the HR detail
    view. Unlike analyze_single_feedback (which runs automatically at submit
    time and swallows errors), this is triggered explicitly by an HR click,
    so failures are raised, not hidden, and the caller shows a real error.
    """
    hint = f" The employee tagged it as category: {category}." if category else ""
    complaint_ctx = " This is an explicit COMPLAINT." if is_complaint else ""
    out = complete_json(
        SINGLE_SUMMARY_SYSTEM,
        f"Feedback:{hint}{complaint_ctx}\n{text[:1500]}",
        max_tokens=300,
    )
    return {
        "summary": str(out.get("summary", "")).strip(),
        "suggested_action": str(out.get("suggested_action", "")).strip(),
    }


SINGLE_SUMMARY_SYSTEM = """You are an HR analyst reading ONE piece of employee
feedback. Write a short, specific summary for an HR manager, and one concrete
action they could take in response.

Respond with ONLY a valid JSON object (no markdown, no preamble) in exactly this shape:
{"summary": "2-3 sentence plain-language summary of what the employee is saying and why it matters", "suggested_action": "one concrete, specific action HR could take next"}

Rules:
- Base the summary only on what is actually said — never invent facts, names,
  headcounts or dates that are not in the text.
- If this is tagged as a COMPLAINT, weigh severity/urgency appropriately in
  the suggested action.
- Keep the summary under 60 words and the suggested action under 25 words.
- Avoid generic filler like "improve communication" — be as concrete as the
  feedback allows (e.g. "Schedule a 1:1 with the reporting manager this week"
  rather than "address management issues")."""


INSIGHTS_SYSTEM = """You are an HR organizational analyst. You will receive a batch of
employee feedback entries. Read them as signals about what is happening
across the organization — not as isolated texts to classify.

Respond with ONLY a valid JSON object (no markdown fences, no preamble) in exactly this shape:
{
  "summary": "Detailed 4-6 sentence executive summary including: total feedback count, sentiment breakdown with percentages (e.g., 'Out of 8 entries: 25% positive, 62% neutral, 12% negative'), key themes, top concerns, and priority actions needed.",
  "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
  "themes": [{"name": "theme name", "count": 0, "description": "what employees are saying about this theme"}],
  "concerns": [{"title": "short title", "severity": "high|medium|low", "description": "why this worries employees", "evidence_count": 0}],
  "actionable_insights": [{"title": "short title", "description": "concrete action HR can take", "priority": "high|medium|low"}]
}
Rules:
- sentiment counts must sum to the number of feedback entries given.
- Entries tagged [COMPLAINT] are explicit requests for HR action: weigh them
  more heavily in concerns and recommendations, but never invent facts about them.
- themes: 3-6 recurring topics, count = how many entries relate to each.
- concerns: 2-4 real problems ranked by frequency AND seriousness; evidence_count = supporting entries.
- actionable_insights: 2-4 concrete things HR could realistically do next (e.g. "Conduct a workload review with teams reporting repeated deadline pressure"), NOT generic statements like "improve satisfaction".
- Keep every string under 25 words EXCEPT summary which can be longer."""


def _coerce_int(v, default=0) -> int:
    try:
        n = int(v)
        return n if n >= 0 else default
    except (TypeError, ValueError):
        return default


def sanitize_insights(data: dict, entry_count: int) -> dict:
    """Guarantee the dashboard schema even if the model drifts."""
    if not isinstance(data, dict):
        data = {}
    sentiment = data.get("sentiment") or data.get("sentiment_breakdown") or {}
    pos = _coerce_int(sentiment.get("positive"))
    neu = _coerce_int(sentiment.get("neutral"))
    neg = _coerce_int(sentiment.get("negative"))
    total = pos + neu + neg
    if entry_count > 0 and total != entry_count:
        # Scale to the entry count so charts stay consistent.
        total = total or 1
        pos, neu, neg = (
            round(pos / total * entry_count),
            round(neu / total * entry_count),
            0,
        )
        neg = max(0, entry_count - pos - neu)

    def _clean_list(items, fields):
        clean = []
        if isinstance(items, list):
            for it in items[:6]:
                if isinstance(it, str):
                    it = {"name": it, "title": it}
                if isinstance(it, dict):
                    clean.append({f: str(it.get(f, ""))[:200] for f in fields})
        return clean

    themes = _clean_list(data.get("themes"), ("name", "count", "description"))
    for t in themes:
        t["count"] = _coerce_int(t.get("count"))
    concerns = _clean_list(
        data.get("concerns"), ("title", "severity", "description", "evidence_count")
    )
    for c in concerns:
        if c.get("severity") not in ("high", "medium", "low"):
            c["severity"] = "medium"
        c["evidence_count"] = _coerce_int(c.get("evidence_count"))
    insights = _clean_list(
        data.get("actionable_insights"), ("title", "description", "priority")
    )
    for i in insights:
        if i.get("priority") not in ("high", "medium", "low"):
            i["priority"] = "medium"

    return {
        "summary": str(data.get("summary", "No summary available."))[:600],
        "sentiment": {"positive": pos, "neutral": neu, "negative": neg},
        "themes": themes,
        "concerns": concerns,
        "actionable_insights": insights,
    }
