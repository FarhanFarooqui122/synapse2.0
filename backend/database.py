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
        # Generic "records" table — rename / extend per your actual PS.
        # e.g. transactions, loan_applications, claims, budgets, etc.
        cur.execute("""
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT,
                amount REAL,
                notes TEXT,
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
