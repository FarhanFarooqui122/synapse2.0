"""
Tiny SQLite helper — zero setup, file-based DB.
Good enough for a hackathon MVP. Swap for Postgres later if you need to.
"""
import re
import sqlite3
from contextlib import contextmanager

DB_PATH = "hackathon.db"

# Columns that must exist on the feedback table (name -> SQLite type).
# init_db creates them fresh; migrate_db adds any missing ones to an
# existing dev database so no data is lost.
REQUIRED_COLUMNS = {
    "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
    "text": "TEXT NOT NULL",
    "source": "TEXT DEFAULT 'text'",       # 'text' or 'voice'
    "category": "TEXT",                     # e.g. Workload, Management, ...
    "department": "TEXT",                   # e.g. Engineering, Sales, HR, Other
    "anonymous": "INTEGER DEFAULT 1",       # 1 = anonymous, 0 = named
    "employee_name": "TEXT",                # only set if anonymous = 0
    "sentiment": "TEXT",                    # positive | neutral | negative (AI)
    "theme": "TEXT",                      # AI-detected theme
    "emotion": "TEXT",                    # AI-detected dominant emotion
    "priority": "TEXT",                   # low | medium | high (AI)
    "feedback_type": "TEXT DEFAULT 'feedback'",  # 'feedback' or 'complaint'
    "status": "TEXT DEFAULT 'open'",      # open | investigating | resolved
    "resolution_note": "TEXT",            # HR update shown to the employee
    "resolved_at": "TEXT",                # timestamp when marked resolved
    "tracking_id": "TEXT",                # e.g. CMP-XXXXXXXX (complaints only)
    "updated_at": "TEXT DEFAULT CURRENT_TIMESTAMP",  # bumped on HR status change
    "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",
}


def init_db():
    with get_db() as conn:
        cur = conn.cursor()
        cols_sql = ",\n                ".join(
            f"{name} {ctype}" for name, ctype in REQUIRED_COLUMNS.items()
        )
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS feedback (
                {cols_sql}
            )
        """)
        conn.commit()
    migrate_db()


def migrate_db():
    """Add any missing columns to an existing feedback table (dev-safe)."""
    with get_db() as conn:
        existing = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(feedback)").fetchall()
        }
        for name, ctype in REQUIRED_COLUMNS.items():
            if name not in existing and name != "id":
                # ALTER TABLE can only add constant defaults — drop
                # non-constant ones like CURRENT_TIMESTAMP (NULL is fine;
                # readers already tolerate it).
                simple_type = ctype.split()[0]
                default = ""
                if "DEFAULT" in ctype:
                    expr = ctype.split("DEFAULT", 1)[1].strip()
                    if re.fullmatch(r"'[^']*'|\"[^\"]*\"|-?\d+(\.\d+)?", expr):
                        default = f"DEFAULT {expr}"
                conn.execute(
                    f"ALTER TABLE feedback ADD COLUMN {name} {simple_type} {default}".strip()
                )
        conn.commit()


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
