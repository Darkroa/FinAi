import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

try:
    import requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

RECEIVER_EMAIL = os.getenv("TEST_RECEIVER_EMAIL", "tomiwakhalifa@gmail.com")

SMTP_PROVIDERS = [
    {
        "name": "Gmail",
        "server": "smtp.gmail.com",
        "port": 587,
        "user": os.getenv("GMAIL_USER", "khalifatomiwa@gmail.com"),
        "password": os.getenv("GMAIL_APP_PASSWORD", "cjninslrbxmsvgwt"),
    },
    {
        "name": "Outlook / Hotmail",
        "server": "smtp.office365.com",
        "port": 587,
        "user": os.getenv("OUTLOOK_USER", ""),
        "password": os.getenv("OUTLOOK_PASSWORD", ""),
    },
]

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM", "onboarding@resend.dev")


def _build_message(sender: str, subject: str, body: str) -> MIMEMultipart:
    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = RECEIVER_EMAIL
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    return msg


def _try_smtp(provider: dict, subject: str, body: str) -> bool:
    user = provider["user"]
    password = provider["password"]
    if not user or not password:
        print(f"  ⚠️  [{provider['name']}] credentials not set — skipping.")
        return False

    msg = _build_message(user, subject, body)
    try:
        print(f"  Connecting to {provider['server']}:{provider['port']} ...")
        server = smtplib.SMTP(provider["server"], provider["port"], timeout=10)
        server.starttls()
        server.login(user, password)
        server.sendmail(user, [RECEIVER_EMAIL], msg.as_string())
        server.quit()
        print(f"  ✅ [{provider['name']}] Email sent successfully.")
        return True
    except Exception as e:
        print(f"  ❌ [{provider['name']}] Failed: {e}")
        return False


def _try_resend(subject: str, body: str) -> bool:
    if not _HAS_REQUESTS:
        print("  ⚠️  [Resend] 'requests' library not installed — skipping.")
        return False
    if not RESEND_API_KEY:
        print("  ⚠️  [Resend] RESEND_API_KEY not set — skipping.")
        return False

    try:
        print("  Calling Resend API ...")
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": RESEND_FROM,
                "to": [RECEIVER_EMAIL],
                "subject": subject,
                "text": body,
            },
            timeout=10,
        )
        if resp.status_code in (200, 201):
            print(f"  ✅ [Resend] Email sent successfully (id={resp.json().get('id')}).")
            return True
        else:
            print(f"  ❌ [Resend] API error {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"  ❌ [Resend] Failed: {e}")
        return False


def send_test_email():
    subject = "FinAi Project — Test Email"
    body = "It's working! Your email connection is successfully configured."

    print(f"\n📧 Sending test email to {RECEIVER_EMAIL} ...\n")

    for provider in SMTP_PROVIDERS:
        print(f"[Trying {provider['name']} SMTP]")
        if _try_smtp(provider, subject, body):
            return

    print("[Trying Resend API]")
    if _try_resend(subject, body):
        return

    print("\n❌ All providers failed. Check your credentials / env vars.")


if __name__ == "__main__":
    send_test_email()
