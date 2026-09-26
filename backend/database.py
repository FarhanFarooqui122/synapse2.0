"""
Tiny SQLite helper — zero setup, file-based DB.
Good enough for an 8-hour hackathon. Swap for Postgres later if you need to.
"""
import sqlite3
from contextlib import contextmanager

DB_PATH = "hackathon.db"


def init_db():
    with get_db() as conn:
        cur = conn.cursor()
        # Employee feedback entries — text or voice-transcribed.
        cur.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                source TEXT DEFAULT 'text',      -- 'text' or 'voice'
                department TEXT,                 -- e.g. Engineering, Sales, HR, Other
                anonymous INTEGER DEFAULT 1,      -- 1 = anonymous, 0 = named
                employee_name TEXT,               -- only set if anonymous = 0
                sentiment TEXT,                   -- filled in after analysis
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
