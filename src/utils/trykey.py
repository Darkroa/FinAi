import requests
from dotenv import load_dotenv
import os

# Load .env file (won't override keys already in os.environ — i.e. Replit Secrets)
load_dotenv(override=False)

# ==================== API Keys ====================
# Reads from Replit Secrets first, falls back to .env file
KEYS = {
    "Google AI Studio (Gemini)": os.getenv("GEMINI_API_KEY"),
    "Groq Cloud":                 os.getenv("GROQ_API_KEY"),
    "GitHub Models":              os.getenv("GITHUB_API_KEY"),
    "OpenRouter":                 os.getenv("OPENROUTER_API_KEY"),
    "NVIDIA Build (NIM)":         os.getenv("NVIDIA_API_KEY"),
    "DeepSeek":                   os.getenv("DEEPSEEK_API_KEY"),
    "OpenAI":                     os.getenv("OPENAI_API_KEY"),
    "Grok (xAI)":                 os.getenv("GROK_API_KEY"),
    "Alpaca":                     os.getenv("ALPACA_API_KEY"),
    "CoinGecko":                  os.getenv("COINGECKO_API_KEY"),
    "Telegram Bot":               os.getenv("TELEGRAM_BOT_TOKEN"),
}

# ==================== Supabase Env ====================
SUPABASE_VARS = {
    "SUPABASE_URL":    os.getenv("SUPABASE_URL", "").strip(),
    "SUPABASE_KEY":    os.getenv("SUPABASE_KEY", "").strip(),
    "SUPABASE_DB_URL": os.getenv("SUPABASE_DB_URL", "").strip(),
}


# ==================== Test Function ====================

def test_api(name: str, url: str, headers: dict, payload: dict, timeout=8):
    key = KEYS.get(name)
    if not key or key.strip() == "":
        print(f"⏭️  {name}: No key in env / Replit Secrets")
        return False
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=timeout)
        if r.status_code == 200:
            print(f"✅ {name}: OK")
            return True
        elif r.status_code in (401, 403):
            print(f"❌ {name}: Invalid or expired key (HTTP {r.status_code})")
        elif r.status_code == 429:
            print(f"⚠️  {name}: Rate limited")
        else:
            print(f"❌ {name}: Failed (HTTP {r.status_code})")
        return False
    except requests.exceptions.Timeout:
        print(f"⏱  {name}: Timeout")
    except Exception as e:
        print(f"❌ {name}: Error — {e}")
    return False


# ==================== Individual Tests ====================

def test_google_ai_studio():
    key = KEYS.get("Google AI Studio (Gemini)")
    if not key: return False
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {"x-goog-api-key": key, "Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": "ping"}]}]}
    return test_api("Google AI Studio (Gemini)", url, headers, payload)


def test_groq():
    key = KEYS.get("Groq Cloud")
    if not key: return False
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("Groq Cloud", url, headers, payload)


def test_github_models():
    key = KEYS.get("GitHub Models")
    if not key: return False
    url = "https://models.github.ai/inference/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "ping"}]}
    return test_api("GitHub Models", url, headers, payload)


def test_openrouter():
    key = KEYS.get("OpenRouter")
    if not key: return False
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "openrouter/auto", "messages": [{"role": "user", "content": "ping"}]}
    return test_api("OpenRouter", url, headers, payload)


def test_nvidia():
    key = KEYS.get("NVIDIA Build (NIM)")
    if not key: return False
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "meta/llama-3.3-70b-instruct", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("NVIDIA Build (NIM)", url, headers, payload)


def test_deepseek():
    key = KEYS.get("DeepSeek")
    if not key: return False
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "deepseek-chat", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("DeepSeek", url, headers, payload)


def test_openai():
    key = KEYS.get("OpenAI")
    if not key: return False
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("OpenAI", url, headers, payload)


def test_grok():
    key = KEYS.get("Grok (xAI)")
    if not key: return False
    url = "https://api.x.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "grok-3", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("Grok (xAI)", url, headers, payload)


def test_alpaca():
    key = KEYS.get("Alpaca")
    secret = os.getenv("ALPACA_SECRET_KEY")
    if not key or not secret:
        print("⏭️  Alpaca: No key in env / Replit Secrets")
        return False
    url = "https://paper-api.alpaca.markets/v2/account"
    headers = {"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret}
    try:
        r = requests.get(url, headers=headers, timeout=8)
        if r.status_code == 200:
            print("✅ Alpaca: OK")
            return True
        elif r.status_code in (401, 403):
            print(f"❌ Alpaca: Invalid key (HTTP {r.status_code})")
        else:
            print(f"❌ Alpaca: Failed (HTTP {r.status_code})")
        return False
    except Exception as e:
        print(f"❌ Alpaca: Error — {e}")
        return False


def test_coingecko():
    key = KEYS.get("CoinGecko")
    if not key:
        print("⏭️  CoinGecko: No key in env (public endpoint will still work)")
        return False
    url = f"https://api.coingecko.com/api/v3/ping"
    headers = {"x-cg-demo-api-key": key}
    try:
        r = requests.get(url, headers=headers, timeout=8)
        if r.status_code == 200:
            print("✅ CoinGecko: OK")
            return True
        print(f"❌ CoinGecko: Failed (HTTP {r.status_code})")
        return False
    except Exception as e:
        print(f"❌ CoinGecko: Error — {e}")
        return False


def test_telegram():
    token = KEYS.get("Telegram Bot")
    if not token:
        print("⏭️  Telegram Bot: No token in env / Replit Secrets")
        return False
    url = f"https://api.telegram.org/bot{token}/getMe"
    try:
        r = requests.get(url, timeout=8)
        if r.status_code == 200:
            data = r.json().get("result", {})
            print(f"✅ Telegram Bot: OK (@{data.get('username', '?')})")
            return True
        print(f"❌ Telegram Bot: Failed (HTTP {r.status_code})")
        return False
    except Exception as e:
        print(f"❌ Telegram Bot: Error — {e}")
        return False


# ==================== Supabase Env Check ====================

def test_supabase_env():
    """Check Supabase environment variables are present (does NOT test connectivity)."""
    url = SUPABASE_VARS["SUPABASE_URL"]
    key = SUPABASE_VARS["SUPABASE_KEY"]
    db_url = SUPABASE_VARS["SUPABASE_DB_URL"]

    url_ok  = bool(url  and not url.startswith("https://your-project"))
    key_ok  = bool(key  and not key.startswith("your-service"))
    db_ok   = bool(db_url and not db_url.startswith("postgresql://postgres.your"))

    print(f"   {'✅ set' if url_ok  else '❌ missing'}  SUPABASE_URL")
    print(f"   {'✅ set' if key_ok  else '❌ missing'}  SUPABASE_KEY")
    print(f"   {'✅ set' if db_ok   else '❌ missing'}  SUPABASE_DB_URL")

    if url_ok and key_ok:
        print("✅ Supabase: env vars present")
    else:
        print("⏭️  Supabase: not configured (app will use fallback DATABASE_URL)")
    return url_ok and key_ok


# ==================== DB Connection Check ====================

def test_db_connection():
    """
    Verify the active database (Supabase or fallback) is reachable via SQLAlchemy.
    Self-contained — reads env vars directly so it works when the script is run
    standalone (python src/utils/trykey.py) without the src package on sys.path.
    Run AFTER AI checks — as the last connectivity check.
    """
    try:
        from sqlalchemy import create_engine, text
        import time

        supabase_db_url = SUPABASE_VARS["SUPABASE_DB_URL"]
        fallback_url    = os.getenv("DATABASE_URL", "").strip()

        if supabase_db_url:
            db_url = supabase_db_url
            source = "Supabase PostgreSQL (SUPABASE_DB_URL)"
        elif fallback_url:
            db_url = fallback_url
            source = "Fallback DATABASE_URL"
        else:
            print("❌ Database: no DATABASE_URL or SUPABASE_DB_URL set")
            return False

        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 8, "sslmode": "require"},
        )
        t0 = time.time()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency = round((time.time() - t0) * 1000)
        print(f"✅ Database ({source}): connected  [{latency} ms]")
        engine.dispose()
        return True
    except Exception as e:
        print(f"❌ Database: connection failed — {e}")
        return False


# ==================== Run All Tests ====================
# Guarded so this only runs when executed directly:
#   python src/utils/trykey.py
# NOT when the server imports this module.

if __name__ == "__main__":
    print("=" * 50)
    print(" API Key Checker — reading from Replit Secrets / .env")
    print("=" * 50)

    # ── Supabase env vars ─────────────────────────────────
    print("\n🔐 Supabase environment:")
    test_supabase_env()

    # ── AI / service keys present? ────────────────────────
    print("\n📋 AI & service keys found in environment:")
    for name, val in KEYS.items():
        status = "✅ set" if val and val.strip() else "❌ missing"
        print(f"   {status}  {name}")

    # ── Live connectivity tests ───────────────────────────
    testers = {
        "Google AI Studio (Gemini)": test_google_ai_studio,
        "Groq Cloud":                test_groq,
        "GitHub Models":             test_github_models,
        "OpenRouter":                test_openrouter,
        "NVIDIA Build (NIM)":        test_nvidia,
        "DeepSeek":                  test_deepseek,
        "OpenAI":                    test_openai,
        "Grok (xAI)":               test_grok,
        "Alpaca":                    test_alpaca,
        "CoinGecko":                 test_coingecko,
        "Telegram Bot":              test_telegram,
    }

    print("\n🔍 Testing API connectivity:\n")
    for provider, test_func in testers.items():
        test_func()

    # ── DB connection (runs last) ─────────────────────────
    print("\n🗄️  Testing database connection:\n")
    test_db_connection()

    print("\n" + "=" * 50)
    print(" All checks completed")
    print("=" * 50)
