from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List
from loguru import logger

class NewsSentiment(BaseModel):
    ticker: str
    overall_sentiment: str          # positive, negative, neutral
    sentiment_score: float = Field(..., ge=-1.0, le=1.0)
    confidence: float = Field(..., ge=0, le=1)
    key_phrases: List[str]

class SentimentAnalyzer:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

    def analyze(self, news_text: str, ticker: str) -> NewsSentiment:
        prompt = f"""
        Analyze the sentiment of the following news regarding {ticker}.
        Return only valid JSON with:
        - overall_sentiment (positive/negative/neutral)
        - sentiment_score (-1.0 to 1.0)
        - confidence (0.0 to 1.0)
        - key_phrases (list of 3-5 important phrases)

        News: {news_text[:10000]}
        """

        try:
            response = self.llm.invoke(prompt)
            # Simple parsing (in production use structured output parser)
            import json
            result = json.loads(response.content)
            result["ticker"] = ticker
            return NewsSentiment(**result)
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return NewsSentiment(
                ticker=ticker,t5jjrym,
                overall_sentiment="neutral",
                sentiment_score=0.0,
                confidence=0.4,
                key_phrases=["Analysis error"]
            ) 