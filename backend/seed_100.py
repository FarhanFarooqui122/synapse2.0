"""
Insert 100 synthetic feedback entries for better dashboard visualization.
Usage (from backend/ directory):
    python seed_100.py
"""
import random
import sqlite3
import sys
from datetime import datetime, timedelta

sys.path.insert(0, ".")
from database import init_db, get_db

SENTIMENTS = ["positive", "neutral", "negative"]
THEMES = [
    "Workload", "Management", "Compensation", "Work Culture", "Career Growth",
    "Recognition", "Communication", "Work-Life Balance", "Technology",
    "Benefits", "Team Collaboration", "Other"
]
EMOTIONS = [
    "Satisfied", "Neutral", "Frustrated", "Concerned", "Motivated",
    "Stressed", "Disappointed", "Appreciative"
]
PRIORITIES = ["low", "medium", "high"]
DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Operations", "HR", "Finance", "Support", "Product"]
SOURCES = ["text", "voice"]
CATEGORIES = list(THEMES)

FEEDBACK_TEMPLATES = {
    "positive": [
        "The team culture here is genuinely supportive and collaborative.",
        "My manager advocates for us and makes sure we have what we need.",
        "Recent process improvements have made our workflow much smoother.",
        "I feel valued and recognized for my contributions.",
        "The flexible work policy has greatly improved my work-life balance.",
        "Great mentorship opportunities within the department.",
        "Compensation review was fair and transparent this year.",
        "New tools have significantly boosted our productivity.",
        "Leadership communicates vision clearly and involves us in decisions.",
        "Strong sense of psychological safety on my team.",
    ],
    "neutral": [
        "Things are okay, nothing particularly good or bad to report.",
        "Standard workload this quarter, manageable but busy.",
        "Processes are functional but could use some modernization.",
        "Communication is adequate, though sometimes delayed.",
        "Career path exists but progression criteria could be clearer.",
        "Benefits package is standard for the industry.",
        "Team meetings are informative but could be shorter.",
        "Office environment is fine, nothing remarkable.",
        "Onboarding was thorough but a bit lengthy.",
        "Performance review process is structured but predictable.",
    ],
    "negative": [
        "Consistently working late without recognition or support.",
        "Unrealistic deadlines set without team input.",
        "Lack of communication from leadership on strategic changes.",
        "Compensation hasn't kept pace with market rates.",
        "No clear career progression path for individual contributors.",
        "Frequent context switching kills productivity.",
        "Technical debt is slowing us down significantly.",
        "Burnout is becoming normalized on the team.",
        "Decisions are made top-down without consulting affected teams.",
        "Inadequate staffing for current project load.",
    ]
}

def generate_feedback(n=100):
    """Generate n synthetic feedback entries."""
    feedback = []
    for _ in range(n):
        sentiment = random.choices(SENTIMENTS, weights=[0.25, 0.35, 0.40])[0]
        text = random.choice(FEEDBACK_TEMPLATES[sentiment])
        # Add some variation
        text += f" {random.choice(['', 'This has been ongoing for months.', 'Hoping for improvement soon.', 'Need leadership to address this.'])}"
        
        source = random.choices(SOURCES, weights=[0.8, 0.2])[0]
        category = random.choice(CATEGORIES)
        department = random.choice(DEPARTMENTS)
        anonymous = random.choice([True, False])
        name = None if anonymous else f"Employee_{random.randint(100, 999)}"
        theme = random.choice(THEMES)
        emotion = random.choice(EMOTIONS)
        priority = random.choices(PRIORITIES, weights=[0.4, 0.4, 0.2])[0]
        
        # Random date within last 90 days
        days_ago = random.randint(0, 90)
        hours_ago = random.randint(0, 23)
        created = (datetime.now() - timedelta(days=days_ago, hours=hours_ago)).strftime("%Y-%m-%d %H:%M:%S")
        
        feedback.append((text, source, category, department, int(anonymous), name,
                         sentiment, theme, emotion, priority, created))
    return feedback

def main():
    init_db()
    with get_db() as conn:
        existing = conn.execute("SELECT COUNT(*) AS n FROM feedback").fetchone()["n"]
        if existing > 0:
            print(f"Feedback table already has {existing} rows. Adding 100 more...")
        
        rows = generate_feedback(100)
        conn.executemany(
            "INSERT INTO feedback (text, source, category, department, anonymous, "
            "employee_name, sentiment, theme, emotion, priority, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rows,
        )
        conn.commit()
        print(f"Inserted {len(rows)} synthetic feedback rows. Total: {existing + len(rows)}")

if __name__ == "__main__":
    main()