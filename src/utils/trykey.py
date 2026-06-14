import requests

# ==================== PUT YOUR API KEYS HERE ====================
KEYS = {
    "Google AI Studio (Gemini)": "YOUR_KEY_HERE",
    "Groq Cloud": "YOUR_KEY_HERE",
    "GitHub Models": "YOUR_KEY_HERE",
    "OpenRouter": "YOUR_KEY_HERE",
    "NVIDIA Build (NIM)": "YOUR_KEY_HERE",
    "DeepSeek": "YOUR_KEY_HERE",
    "OpenAI": "h    ",
    "Grok (xAI)": "hhhh",
}

def test_api(name: str, url: str, headers: dict, payload: dict, timeout=8):
    """Generic test function"""
    if not url or "YOUR_KEY" in str(headers.get("Authorization", "")) or "YOUR_KEY" in str(headers.get("x-goog-api-key", "")):
        print(f"❌ {name}: No valid key provided")
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

def test_google_ai_studio(key):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    headers = {"x-goog-api-key": key, "Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": "ping"}]}]}
    return test_api("Google AI Studio (Gemini)", url, headers, payload)


def test_groq(key):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("Groq Cloud", url, headers, payload)


def test_github_models(key):
    url = "https://models.github.ai/inference/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "ping"}]}
    return test_api("GitHub Models", url, headers, payload)


def test_openrouter(key):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "openrouter/auto", "messages": [{"role": "user", "content": "ping"}]}
    return test_api("OpenRouter", url, headers, payload)


def test_nvidia(key):
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "meta/llama-3.3-70b-instruct", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("NVIDIA Build (NIM)", url, headers, payload)


def test_deepseek(key):
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "deepseek-chat", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("DeepSeek", url, headers, payload)


def test_openai(key):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("OpenAI", url, headers, payload)


def test_grok(key):
    url = "https://api.x.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "grok-3", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
    return test_api("Grok (xAI)", url, headers, payload)


# ==================== Run All Tests ====================

print("--- Starting API Key Checks ---\n")

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
    key = KEYS.get(provider)
    test_func(key)

print("\n--- All checks completed ---")