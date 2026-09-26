import os
import time
import base64
import json
import requests
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
LAST_CHECK_FILE = 'last_check.json'


def get_gmail_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)


def get_last_check_time():
    if os.path.exists(LAST_CHECK_FILE):
        with open(LAST_CHECK_FILE, 'r') as f:
            return json.load(f)['timestamp']
    # First run: only look at emails from right now onward
    return int(time.time())


def save_last_check_time(ts):
    with open(LAST_CHECK_FILE, 'w') as f:
        json.dump({'timestamp': ts}, f)


def get_new_messages(service, after_timestamp):
    # Gmail search query: after:<unix_timestamp>
    query = f'after:{after_timestamp}'
    results = service.users().messages().list(userId='me', q=query).execute()
    return results.get('messages', [])


def get_message_content(service, msg_id):
    msg = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
    headers = msg['payload']['headers']
    sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '(no subject)')
    body = extract_body(msg['payload'])
    attachments = extract_attachments(service, msg_id, msg['payload'])
    return {'sender': sender, 'subject': subject, 'body': body, 'attachments': attachments}


def extract_body(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8')
    else:
        data = payload['body'].get('data')
        if data:
            return base64.urlsafe_b64decode(data).decode('utf-8')
    return ''


def extract_attachments(service, msg_id, payload):
    attachments = []
    for part in payload.get('parts', []):
        if part.get('filename'):
            att_id = part['body'].get('attachmentId')
            if att_id:
                att = service.users().messages().attachments().get(
                    userId='me', messageId=msg_id, id=att_id
                ).execute()
                file_data = base64.urlsafe_b64decode(att['data'])
                attachments.append({
                    'filename': part['filename'],
                    'mimeType': part['mimeType'],
                    'data': file_data
                })
    return attachments


def process_new_feedback():
    service = get_gmail_service()
    last_check = get_last_check_time()
    current_time = int(time.time())

    messages = get_new_messages(service, last_check)

    for m in messages:
        content = get_message_content(service, m['id'])
        print(f"New feedback from {content['sender']}: {content['subject']}")

        try:
            payload = {
                "text": f"Subject: {content['subject']}\n\n{content['body']}",
                "source": "email",
                "anonymous": False,
                "employee_name": content['sender']
            }
            res = requests.post("http://localhost:8000/api/feedback", json=payload)
            res.raise_for_status()
            print("Successfully posted to backend.")
        except Exception as e:
            print(f"Error posting to backend: {e}")

    save_last_check_time(current_time)


if __name__ == '__main__':
    while True:
        process_new_feedback()
        time.sleep(30)