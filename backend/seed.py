"""
Seed the SQLite DB with realistic *fictional* demo feedback.

Usage (from the backend/ directory):
    python seed.py            # insert demo rows (skips if data already exists)
    python seed.py --reset    # delete all feedback, then insert demo rows
    python seed.py --raw      # insert without sample AI labels (all NULL)

The default inserts rows WITH plausible AI labels (sentiment/theme/emotion/
priority) so the dashboard — KPIs, trend, emotions, recent feedback — looks
complete even before a live LLM key is configured. These labels are clearly
sample data, not real analysis. Batch "Generate AI Insights" always calls the
live LLM.
"""
import argparse
import random
import sqlite3
import sys
from datetime import datetime, timedelta

sys.path.insert(0, ".")
from database import init_db, get_db  # noqa: E402

SEED = [
    # (text, source, category, department, anonymous, name, sentiment, theme, emotion, priority, days_ago)
    ("I've been working until 11 PM almost every day. There is too much work and our team is understaffed.",
     "voice", "Workload", "Engineering", True, None, "negative", "Workload", "Stressed", "high", 1),
    ("Overtime has become the norm rather than the exception on my team.",
     "text", "Workload", "Engineering", True, None, "negative", "Workload", "Frustrated", "high", 2),
    ("Deadlines keep getting moved up without any discussion about scope. It feels unrealistic.",
     "text", "Workload", "Operations", False, "Demo User", "negative", "Workload", "Frustrated", "high", 4),
    ("We're consistently short-staffed during peak periods and it's affecting morale.",
     "text", "Workload", "Sales", True, None, "negative", "Workload", "Concerned", "medium", 9),
    ("The workload has been manageable this month, which is a nice change.",
     "text", "Workload", "Marketing", True, None, "positive", "Workload", "Satisfied", "low", 15),
    ("My manager rarely shares updates from leadership meetings with the team.",
     "text", "Management", "Engineering", True, None, "negative", "Communication", "Disappointed", "medium", 3),
    ("Really appreciate how supportive my manager has been through a tough project.",
     "text", "Management", "HR", False, "Demo User", "positive", "Management", "Appreciative", "low", 6),
    ("Salaries here feel below market rate compared to similar roles elsewhere.",
     "voice", "Compensation", "Engineering", True, None, "negative", "Compensation", "Concerned", "medium", 5),
    ("I was surprised there was no raise this year despite strong performance reviews.",
     "text", "Compensation", "Sales", True, None, "negative", "Compensation", "Disappointed", "medium", 12),
    ("It is hard to disconnect after hours — messages keep coming in late at night.",
     "text", "Work-Life Balance", "Marketing", True, None, "negative", "Work-Life Balance", "Stressed", "medium", 7),
    ("Flexible hours have made a real difference for my family situation.",
     "text", "Work-Life Balance", "Operations", True, None, "positive", "Work-Life Balance", "Satisfied", "low", 20),
    ("Really appreciate how supportive my teammates are, we genuinely look out for each other.",
     "text", "Culture", "Engineering", True, None, "positive", "Team Collaboration", "Appreciative", "low", 10),
    ("There is a lack of transparency around decisions that affect the whole team.",
     "text", "Culture", "Operations", True, None, "negative", "Communication", "Concerned", "medium", 14),
    ("I don't see a clear path for promotion in my current role.",
     "text", "Career Growth", "Marketing", False, "Demo User", "neutral", "Career Growth", "Concerned", "medium", 18),
    ("Would love more mentorship opportunities or a clearer growth ladder.",
     "text", "Career Growth", "Engineering", True, None, "neutral", "Career Growth", "Neutral", "low", 25),
    ("Nobody acknowledged the extra effort the support team put in during the outage.",
     "text", "Culture", "Operations", True, None, "negative", "Recognition", "Disappointed", "medium", 30),
    ("The new ticketing tool crashes daily and slows down the whole team.",
     "voice", "Facilities", "Operations", True, None, "negative", "Technology", "Frustrated", "medium", 35),
    ("The recent town-hall finally explained the roadmap clearly. More of that, please.",
     "text", "General", "Sales", True, None, "positive", "Communication", "Motivated", "low", 45),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed demo employee feedback.")
    parser.add_argument("--reset", action="store_true", help="Delete all feedback first.")
    parser.add_argument("--raw", action="store_true", help="Insert without sample AI labels.")
    args = parser.parse_args()

    init_db()
    with get_db() as conn:
        if args.reset:
            conn.execute("DELETE FROM feedback")
            conn.commit()
            print("Cleared existing feedback.")
        existing = conn.execute("SELECT COUNT(*) AS n FROM feedback").fetchone()["n"]
        if existing and not args.reset:
            print(f"Feedback table already has {existing} rows — nothing to do. Use --reset to reseed.")
            return

        now = datetime.now()
        rows = []
        for (text, source, category, dept, anon, name, sent, theme, emo, prio, days) in SEED:
            created = (now - timedelta(days=days, hours=random.randint(0, 8))).strftime("%Y-%m-%d %H:%M:%S")
            rows.append((text, source, category, dept, int(anon), name,
                         None if args.raw else sent,
                         None if args.raw else theme,
                         None if args.raw else emo,
                         None if args.raw else prio,
                         created))
        conn.executemany(
            "INSERT INTO feedback (text, source, category, department, anonymous, "
            "employee_name, sentiment, theme, emotion, priority, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rows,
        )
        conn.commit()
        print(f"Inserted {len(rows)} demo feedback rows (labels={'sample' if not args.raw else 'none'}).")


if __name__ == "__main__":
    main()
