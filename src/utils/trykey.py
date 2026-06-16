import requests
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# ==================== API Keys from .env ====================
KEYS = {
    "Google AI Studio (Gemini)": os.getenv("GEMINI_API_KEY"),
    "Groq Cloud": os.getenv("GROQ_API_KEY"),
    "GitHub Models": os.getenv("GITHUB_API_KEY"),
    "OpenRouter": os.getenv("OPENROUTER_API_KEY"),
    "NVIDIA Build (NIM)": os.getenv("NVIDIA_API_KEY"),
    "DeepSeek": os.getenv("DEEPSEEK_API_KEY"),
    "OpenAI": os.getenv("OPENAI_API_KEY"),
    "Grok (xAI)": os.getenv("GROK_API_KEY"),
}

# ==================== Test Function ====================

def test_api(name: str, url: str, headers: dict, payload: dict, timeout=8):
    """Generic test function"""
    key = KEYS.get(name)

    if not key or key.strip() == "":
        print(f"⏭️  {name}: No key provided in .env")
        return False

    try:
        r = requests.post(url, json=payload, headers=headers, timeout=timeout)

        if r.status_code == 200:
            print(f"✅ {name} is working")
            return True
        elif r.status_code in (401, 403):
            print(f"❌ {name}: Invalid or expired key")
        elif r.status_code == 429:
            print(f"⚠️  {name}: Rate limited")
        else:
            print(f"❌ {name}: Failed (HTTP {r.status_code})")
        return False

    except requests.exceptions.Timeout:
        print(f"❌ {name}: Timeout")
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
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


# ==================== Run All Tests ====================

print("--- Starting API Key Checks from .env ---\n")

testers = {
    "Google AI Studio (Gemini)": test_google_ai_studio,
    "Groq Cloud": test_groq,
    "GitHub Models": test_github_models,
    "OpenRouter": test_openrouter,
    "NVIDIA Build (NIM)": test_nvidia,
    "DeepSeek": test_deepseek,
    "OpenAI": test_openai,
    "Grok (xAI)": test_grok,
}

for provider, test_func in testers.items():
    test_func()

print("\n--- All checks completed ---")