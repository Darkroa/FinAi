import os
from langchain_openai import ChatOpenAI
from loguru import logger

def get_llm(model: str = "grok", temperature: float = 0.6, **kwargs):
    """
    Grok as core LLM. GPT as automatic fallback.
    """
    if model == "grok":
        grok_key = os.getenv("GROK_API_KEY")
        if grok_key:
            return ChatOpenAI(
                model="grok-4-1-fast",           # Fast & capable Grok model (March 2026)
                temperature=temperature,
                api_key=grok_key,
                base_url="https://api.x.ai/v1",
                **kwargs
            )
        else:
            logger.warning("GROK_API_KEY not found → falling back to GPT")
            return get_llm("gpt", temperature, **kwargs)

    # GPT Fallback
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=temperature,
        api_key=os.getenv("OPENAI_API_KEY"),
        **kwargs
    )