"""
Slack Chat Feedback Simulation — standalone script.

Generates mock Slack chat data, simulates sentiment analysis,
filtering, prioritization, and produces heatmap-ready output.
No external API calls needed. Replace the filter/analyze functions
with real Colab API calls when the tunnel is available.
"""

import json
import re
import os
from collections import defaultdict
from datetime import datetime, timezone

# ---------- Mock Slack Data ----------

MOCK_CHATS = {
    "conversations": [
        {
            "conversation_id": "conv_001",
            "type": "dm",
            "members": ["jane.doe", "mike.chen"],
            "messages": [
                {"user": "jane.doe", "text": "hey mike, want to grab lunch later?", "timestamp": "2026-09-20T12:30:00Z"},
                {"user": "mike.chen", "text": "sure, Thai place?", "timestamp": "2026-09-20T12:31:00Z"},
                {"user": "jane.doe", "text": "yes please!", "timestamp": "2026-09-20T12:32:00Z"}
            ]
        },
        {
            "conversation_id": "conv_002",
            "type": "group",
            "members": ["alice.kim", "bob.smith", "carol.jones"],
            "messages": [
                {"user": "alice.kim", "text": "the new deadline for the Q4 report is moved up to Friday", "timestamp": "2026-09-21T09:00:00Z"},
                {"user": "bob.smith", "text": "thats really tight, we need more headcount", "timestamp": "2026-09-21T09:05:00Z"},
                {"user": "carol.jones", "text": "im already working 60 hour weeks and this is burnout territory", "timestamp": "2026-09-21T09:10:00Z"}
            ]
        },
        {
            "conversation_id": "conv_003",
            "type": "group",
            "members": ["dave.wilson", "erin.park", "frank.liu"],
            "messages": [
                {"user": "dave.wilson", "text": "the office renovation starts next week", "timestamp": "2026-09-22T14:00:00Z"},
                {"user": "erin.park", "text": "great, my desk will be near the window finally", "timestamp": "2026-09-22T14:05:00Z"},
                {"user": "frank.liu", "text": "any idea when the printer gets moved", "timestamp": "2026-09-22T14:10:00Z"},
                {"user": "dave.wilson", "text": "probably thursday", "timestamp": "2026-09-22T14:15:00Z"}
            ]
        },
        {
            "conversation_id": "conv_004",
            "type": "dm",
            "members": ["grace.tan", "henry.zhao"],
            "messages": [
                {"user": "grace.tan", "text": "there was a conduct issue in the sales department last night", "timestamp": "2026-09-23T08:00:00Z"},
                {"user": "henry.zhao", "text": "what happened exactly", "timestamp": "2026-09-23T08:02:00Z"},
                {"user": "grace.tan", "text": "a client reported inappropriate behavior from a senior rep, HR needs to investigate", "timestamp": "2026-09-23T08:05:00Z"}
            ]
        },
        {
            "conversation_id": "conv_005",
            "type": "group",
            "members": ["iris.moore", "jack.thompson", "karen.lee"],
            "messages": [
                {"user": "iris.moore", "text": "the team celebration is on thursday at 5pm", "timestamp": "2026-09-24T16:00:00Z"},
                {"user": "jack.thompson", "text": "celebration for what", "timestamp": "2026-09-24T16:02:00Z"},
                {"user": "karen.lee", "text": "we hit our quarterly target, everyone did amazing work", "timestamp": "2026-09-24T16:05:00Z"}
            ]
        }
    ]
}

# ---------- Simulated Sentiment & Filter ----------

WORK_KEYWORDS = [
    "deadline", "report", "headcount", "burnout", "conduct", "inappropriate",
    "hr", "investigate", "issue", "client", "rep", "sales department",
    "target", "quarterly", "renovation", "printer", "office"
]

POSITIVE_WORDS = ["great", "amazing", "celebration", "wonderful", "good", "best", "awesome"]
NEGATIVE_WORDS = ["tight", "burnout", "territory", "issue", "inappropriate", "reported", "concern"]

CRITICAL_KEYWORDS = ["burnout", "conduct", "inappropriate", "hr", "investigate", "reported"]


def classify_sentiment(text):
    text_lower = text.lower()
    if any(w in text_lower for w in CRITICAL_KEYWORDS):
        return "critical"
    neg_count = sum(1 for w in NEGATIVE_WORDS if w in text_lower)
    pos_count = sum(1 for w in POSITIVE_WORDS if w in text_lower)
    if neg_count > pos_count:
        return "negative"
    if pos_count > neg_count:
        return "positive"
    return "neutral"


def classify_category(text):
    text_lower = text.lower()
    if any(w in text_lower for w in CRITICAL_KEYWORDS):
        return "workplace-conduct" if "conduct" in text_lower or "inappropriate" in text_lower else "burnout" if "burnout" in text_lower else "hr-concern"
    if "deadline" in text_lower or "report" in text_lower or "headcount" in text_lower:
        return "workload"
    if "renovation" in text_lower or "office" in text_lower or "printer" in text_lower:
        return "facilities"
    if "celebration" in text_lower or "target" in text_lower or "quarterly" in text_lower:
        return "milestone"
    return "casual"


def classify_urgency(text, sentiment):
    text_lower = text.lower()
    if sentiment == "critical":
        return 4
    if any(w in text_lower for w in ["burnout", "conduct", "inappropriate", "investigate", "hr", "reported"]):
        return 4
    if any(w in text_lower for w in ["tight", "deadline", "headcount"]):
        return 3
    if any(w in text_lower for w in ["celebration", "target"]):
        return 2
    return 1


def is_work_related(text):
    text_lower = text.lower()
    return any(w in text_lower for w in WORK_KEYWORDS)


def filter_message(text):
    if is_work_related(text):
        return {"category": "work-related concern"}
    return {"category": "casual conversation"}


def analyze_message(text):
    sentiment = classify_sentiment(text)
    category = classify_category(text)
    urgency = classify_urgency(text, sentiment)
    return {"sentiment": sentiment, "category": category, "urgency": urgency}


# ---------- Pipeline ----------

def run_simulation():
    conversations = MOCK_CHATS["conversations"]
    team_data = defaultdict(lambda: {"message_count": 0, "urgency_scores": [], "category": None, "sentiments": [], "priority": 0})

    for conv in conversations:
        conv_id = conv["conversation_id"]
        conv_type = conv["type"]
        team = "Unassigned/Direct" if conv_type == "dm" else conv_id

        for msg in conv.get("messages", []):
            text = msg["text"]
            filter_result = filter_message(text)
            if filter_result["category"] != "work-related concern":
                continue

            analysis = analyze_message(text)

            team_data[team]["message_count"] += 1
            team_data[team]["urgency_scores"].append(analysis["urgency"])
            team_data[team]["sentiments"].append(analysis["sentiment"])
            team_data[team]["category"] = analysis["category"]

            # Priority: highest urgency * sentiment weight
            sentiment_weight = {"critical": 1.0, "negative": 0.8, "neutral": 0.5, "positive": 0.3}
            team_data[team]["priority"] = max(
                team_data[team]["priority"],
                analysis["urgency"] * sentiment_weight.get(analysis["sentiment"], 0.5)
            )

    # Build aggregated output
    results = []
    for team, data in team_data.items():
        avg_urgency = round(sum(data["urgency_scores"]) / len(data["urgency_scores"]), 2) if data["urgency_scores"] else 0.0
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0, "critical": 0}
        for s in data["sentiments"]:
            sentiment_counts[s] += 1

        priority_label = "P1" if data["priority"] >= 3.0 else "P2" if data["priority"] >= 2.0 else "P3" if data["priority"] >= 1.0 else "P4"

        results.append({
            "team": team,
            "category": data["category"] or "general",
            "message_count": data["message_count"],
            "avg_urgency_score": avg_urgency,
            "sentiment_breakdown": sentiment_counts,
            "priority": priority_label,
            "priority_score": data["priority"]
        })

    # Sort by urgency descending for heatmap
    results.sort(key=lambda x: x["avg_urgency_score"], reverse=True)
    return results


def build_heatmap_data(results):
    """Format data for heatmap visualization — teams as rows, dimensions as columns."""
    heatmap = []
    for r in results:
        heatmap.append({
            "team": r["team"],
            "urgency": r["avg_urgency_score"],
            "message_count": r["message_count"],
            "priority_score": r["priority_score"],
            "sentiment_negative": r["sentiment_breakdown"]["negative"] + r["sentiment_breakdown"]["critical"],
            "sentiment_positive": r["sentiment_breakdown"]["positive"],
            "sentiment_neutral": r["sentiment_breakdown"]["neutral"],
            "category": r["category"]
        })
    return heatmap


def main():
    results = run_simulation()
    heatmap = build_heatmap_data(results)

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "summary": {
            "total_conversations": len(MOCK_CHATS["conversations"]),
            "total_messages_analyzed": sum(
                sum(1 for m in conv["messages"] if is_work_related(m["text"]))
                for conv in MOCK_CHATS["conversations"]
            ),
            "teams_with_feedback": len(results)
        },
        "team_feedback": results,
        "heatmap_data": heatmap
    }

    # Write to JSON file
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "simulation_output.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(json.dumps(output, indent=2))
    return output


if __name__ == "__main__":
    main()
