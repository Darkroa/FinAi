from pydantic import BaseModel, Field
from typing import List
from loguru import logger
from langchain_openai import ChatOpenAI
from datetime import datetime

class PriceForecast(BaseModel):
    ticker: str
    short_term_target: float
    medium_term_target: float
    short_term_confidence: float
    medium_term_confidence: float
    forecasted_date_short: str
    forecasted_date_medium: str
    rationale: str

class Forecaster:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

    def forecast(self, 
                 ticker: str, 
                 current_price: float, 
                 sentiment_score: float,
                 impact_score: int,
                 technical_breakout: bool = False) -> PriceForecast:
        
        prompt = f"""
        You are an expert price forecaster.
        Current price of {ticker}: ${current_price:.2f}
        Sentiment score: {sentiment_score:.2f}
        Impact score: {impact_score}/10
        Technical breakout detected: {technical_breakout}

        Provide realistic price targets:
        - Short-term target (next 1-5 trading days)
        - Medium-term target (next 2-6 weeks)

        Return only valid JSON.
        """

        try:
            response = self.llm.invoke(prompt)
            import json
            result = json.loads(response.content)
            result["ticker"] = ticker
            return PriceForecast(**result)
        except Exception as e:
            logger.error(f"Forecasting failed: {e}")
            return PriceForecast(
                ticker=ticker,
                short_term_target=current_price * 1.02,
                medium_term_target=current_price * 1.08,
                short_term_confidence=0.5,
                medium_term_confidence=0.45,
                forecasted_date_short=datetime.now().strftime("%Y-%m-%d"),
                forecasted_date_medium=(datetime.now().replace(day=datetime.now().day + 21)).strftime("%Y-%m-%d"),
                rationale="Fallback forecast due to error"
            )