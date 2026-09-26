"""
Colab-hosted ML model client.

Calls the RoBERTa sentiment classifier and BART-MNLI zero-shot classifier
running on Google Colab behind a FastAPI app tunneled through ngrok.

Endpoints:
- POST {COLAB_API_URL}/analyze — body {"text": "..."} — returns {"sentiment": ..., "category": ..., "urgency": ...}
- POST {COLAB_API_URL}/filter — body {"text": "..."} — returns which of ["work-related concern", "casual conversation"] the text matched

Reads COLAB_API_URL from environment variables only. Handles timeouts and
connection failures gracefully.
"""

import os
import requests

COLAB_API_URL = os.getenv("COLAB_API_URL", "")

TIMEOUT = 15


def filter_message(text):
    if not COLAB_API_URL:
        return {"error": "COLAB_API_URL not set"}
    try:
        resp = requests.post(
            f"{COLAB_API_URL}/filter",
            json={"text": text},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        return {"error": "Request timed out"}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection failed — Colab tunnel may be down"}
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


def analyze_message(text):
    if not COLAB_API_URL:
        return {"error": "COLAB_API_URL not set"}
    try:
        resp = requests.post(
            f"{COLAB_API_URL}/analyze",
            json={"text": text},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        return {"error": "Request timed out"}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection failed — Colab tunnel may be down"}
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
