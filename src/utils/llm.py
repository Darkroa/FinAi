"""
FinAi Multi-LLM Router
Intelligently routes across 9 cloud LLM providers with local fallback.
All providers use the OpenAI-compatible ChatOpenAI interface.
Priority: Grok → OpenAI → Groq → DeepSeek → Google → GitHub → OpenRouter → NVIDIA → Local
"""
import os
from loguru import logger

# ── Provider registry ─────────────────────────────────────────────────────────
# Each entry: (name, env_var, model_id, base_url | None)
# base_url=None  → use official OpenAI endpoint (no override needed)
# base_url="..." → OpenAI-compatible third-party endpoint

_PROVIDERS = [
    (
        "grok",
        "GROK_API_KEY",
        "grok-3-fast",
        "https://api.x.ai/v1",
    ),
    (
        "openai",
        "OPENAI_API_KEY",
        "gpt-4o-mini",
        None,
    ),
    (
        "groq",
        "GROQ_API_KEY",
        "llama-3.3-70b-versatile",
        "https://api.groq.com/openai/v1",
    ),
    (
        "deepseek",
        "DEEPSEEK_API_KEY",
        "deepseek-chat",
        "https://api.deepseek.com/v1",
    ),
    (
        "google",
        "GOOGLE_API_KEY",
        "gemini-2.0-flash",
        "https://generativelanguage.googleapis.com/v1beta/openai/",
    ),
    (
        "github",
        "GITHUB_TOKEN",
        "gpt-4o-mini",
        "https://models.inference.ai.azure.com",
    ),
    (
        "openrouter",
        "OPENROUTER_API_KEY",
        "meta-llama/llama-3.1-8b-instruct:free",
        "https://openrouter.ai/api/v1",
    ),
    (
        "nvidia",
        "NVIDIA_API_KEY",
        "meta/llama-3.1-8b-instruct",
        "https://integrate.api.nvidia.com/v1",
    ),
]


def _available_providers() -> list[tuple[str, str, str, str | None]]:
    """Return only providers that have an API key set in the environment."""
    return [
        (name, key, model, base_url)
        for name, key, model, base_url in _PROVIDERS
        if os.getenv(key)
    ]


def get_llm(model: str | None = None, temperature: float = 0.6, **kwargs):
    """
    Return the best available LangChain LLM.

    Routing logic:
    1. If `model` is a provider name (e.g. "grok", "groq", "openai"), use that
       provider if its key exists, otherwise fall through the priority chain.
    2. Walk the priority chain and return the first provider whose key is set.
    3. If no cloud keys are present, return the FinAi Local Intelligence Engine.
    """
    from langchain_openai import ChatOpenAI

    available = _available_providers()

    # Log which providers are live on first call
    if available:
        names = ", ".join(n for n, *_ in available)
        logger.info(f"FinAi LLM router — available providers: [{names}]")
    else:
        logger.warning("FinAi LLM router — no API keys found → Local Intelligence Engine")

    # If caller requested a specific provider, try it first
    if model and model in {n for n, *_ in _PROVIDERS}:
        for name, env_key, model_id, base_url in _PROVIDERS:
            if name == model:
                api_key = os.getenv(env_key)
                if api_key:
                    return _build_llm(ChatOpenAI, name, api_key, model_id, base_url, temperature, kwargs)
                else:
                    logger.warning(f"Requested provider '{model}' has no key → falling through chain")
                break

    # Walk priority chain
    for name, env_key, model_id, base_url in _PROVIDERS:
        api_key = os.getenv(env_key)
        if api_key:
            return _build_llm(ChatOpenAI, name, api_key, model_id, base_url, temperature, kwargs)

    # Final fallback — local rule-based engine
    logger.warning("No LLM API keys configured → FinAi Local Intelligence Engine")
    from src.utils.local_llm import LocalAI
    return LocalAI()


def _build_llm(ChatOpenAI, name: str, api_key: str, model_id: str, base_url: str | None,
               temperature: float, kwargs: dict):
    """Construct a ChatOpenAI instance for any OpenAI-compatible endpoint."""
    logger.info(f"FinAi LLM → using [{name.upper()}] ({model_id})")
    params = dict(
        model=model_id,
        temperature=temperature,
        api_key=api_key,
        **kwargs,
    )
    if base_url:
        params["base_url"] = base_url
    return ChatOpenAI(**params)


def get_active_provider() -> str:
    """Return the name of the first available provider (for display/logging)."""
    available = _available_providers()
    return available[0][0].upper() if available else "LOCAL"


def list_providers() -> list[dict]:
    """Return all providers with their availability status (no keys exposed)."""
    return [
        {
            "name": name,
            "model": model,
            "available": bool(os.getenv(env_key)),
        }
        for name, env_key, model, _ in _PROVIDERS
    ]
