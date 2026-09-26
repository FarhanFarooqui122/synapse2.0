"""
Loader for mock Slack-style chat feedback data.

Reads a JSON file with the structure:
{ "conversations": [ { "conversation_id": "...", "type": "dm" | "group", "members": [...], "messages": [ {"user": "...", "text": "...", "timestamp": "..."} ] } ] }

Returns a flat list of {conversation_id, type, user, text, timestamp}.
Designed to be swappable with a real Slack API puller — nothing downstream
needs to change.
"""

import json
import os

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "mock_slack_chats.json")


def load_chat_messages(filepath=None):
    path = filepath or DATA_PATH
    with open(path, "r") as f:
        data = json.load(f)

    results = []
    for conv in data.get("conversations", []):
        conversation_id = conv["conversation_id"]
        conv_type = conv["type"]
        for msg in conv.get("messages", []):
            results.append({
                "conversation_id": conversation_id,
                "type": conv_type,
                "user": msg["user"],
                "text": msg["text"],
                "timestamp": msg["timestamp"],
            })
    return results
