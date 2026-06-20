import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

try:
    import requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

# ── Credentials from env vars (matching local.env / app config) ───────────────
SMTP_HOST     = os.getenv("SMTP_HOST",     "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL  = os.getenv("SMTP_USER",     "")
SENDER_PASSWORD = os.getenv("SMTP_PASSWORD", "")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM    = os.getenv("RESEND_FROM",    "FinAi <onboarding@resend.dev>")

RECEIVER_EMAIL = os.getenv("TEST_RECEIVER_EMAIL", "tomiwakhalifa@gmail.com")

SUBJECT = "FinAi Project — Test Email"
BODY    = "It's working! Your email connection is successfully configured."


def _try_smtp() -> bool:
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("  ⚠️  [SMTP] SMTP_USER or SMTP_PASSWORD not set — skipping.")
        return False
    try:
        msg = MIMEMultipart()
        msg["From"]    = SENDER_EMAIL
        msg["To"]      = RECEIVER_EMAIL
        msg["Subject"] = SUBJECT
        msg.attach(MIMEText(BODY, "plain"))

        print(f"  Connecting to {SMTP_HOST}:{SMTP_PORT} ...")
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, [RECEIVER_EMAIL], msg.as_string())
        server.quit()
        print("  ✅ [SMTP] Email sent successfully.")
        return True
    except Exception as e:
        print(f"  ❌ [SMTP] Failed: {e}")
        return False


def _try_resend() -> bool:
    if not RESEND_API_KEY:
        print("  ⚠️  [Resend] RESEND_API_KEY not set — skipping.")
        return False
    if not _HAS_REQUESTS:
        print("  ⚠️  [Resend] 'requests' library not installed — skipping.")
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
                "to":   [RECEIVER_EMAIL],
                "subject": SUBJECT,
                "text": BODY,
            },
            timeout=10,
        )
        if resp.status_code in (200, 201):
            print(f"  ✅ [Resend] Email sent (id={resp.json().get('id')}).")
            return True
        else:
            print(f"  ❌ [Resend] API error {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"  ❌ [Resend] Failed: {e}")
        return False


def send_test_email():
    print(f"\n📧 Sending test email to {RECEIVER_EMAIL} ...\n")

    smtp_ok   = False
    resend_ok = False

    print("[SMTP]")
    smtp_ok = _try_smtp()

    print("\n[Resend]")
    resend_ok = _try_resend()

    print()
    if smtp_ok and resend_ok:
        print("🎉 Both SMTP and Resend delivered the email.")
    elif smtp_ok or resend_ok:
        which = "SMTP" if smtp_ok else "Resend"
        print(f"✅ Email delivered via {which}.")
    else:
        print("❌ All providers failed. Set SMTP_USER / SMTP_PASSWORD and/or RESEND_API_KEY.")


if __name__ == "__main__":
    send_test_email()
