import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict
from loguru import logger
from sqlalchemy.orm import Session

# DB
from src.database.models import TrendAnalysis
from src.database.session import SessionLocal

class TrendlineAnalyzer:
    def __init__(self, length: int = 14, mult: float = 1.0, calc_method: str = 'Atr'):
        self.length = length
        self.mult = mult
        self.calc_method = calc_method

    def calculate_slope(self, df: pd.DataFrame) -> pd.Series:
        src = df['close']
        if self.calc_method == 'Atr':
            tr = np.maximum(df['high'] - df['low'],
                            np.maximum(abs(df['high'] - df['close'].shift()),
                                       abs(df['low'] - df['close'].shift())))
            return tr.rolling(self.length).mean() / self.length * self.mult
        elif self.calc_method == 'Stdev':
            return src.rolling(self.length).std() / self.length * self.mult
        else:
            x = np.arange(len(df))
            y = src
            slope = ((self.length * (x * y).rolling(self.length).sum() - x.rolling(self.length).sum() * y.rolling(self.length).sum()) /
                     (self.length * (x**2).rolling(self.length).sum() - (x.rolling(self.length).sum())**2))
            return np.abs(slope) * self.mult

    def detect_pivots(self, df: pd.DataFrame):
        ph = df['high'].rolling(self.length*2 + 1, center=True).max() == df['high']
        pl = df['low'].rolling(self.length*2 + 1, center=True).min() == df['low']
        return ph.shift(-self.length), pl.shift(-self.length)

    def analyze(self, df: pd.DataFrame, ticker: str = "UNKNOWN") -> Dict:
        if len(df) < self.length * 3:
            return {"error": "Not enough data"}

        df = df.copy().reset_index(drop=True)
        slope_series = self.calculate_slope(df)
        ph, pl = self.detect_pivots(df)

        upper = np.nan
        lower = np.nan
        slope_ph = slope_pl = 0.0
        results = []

        for i in range(len(df)):
            if ph.iloc[i]:
                slope_ph = slope_series.iloc[i]
                upper = df['high'].iloc[i]
            elif not np.isnan(upper):
                upper -= slope_ph

            if pl.iloc[i]:
                slope_pl = slope_series.iloc[i]
                lower = df['low'].iloc[i]
            elif not np.isnan(lower):
                lower += slope_pl

            current_upper = upper - slope_ph * self.length if not np.isnan(upper) else np.nan
            current_lower = lower + slope_pl * self.length if not np.isnan(lower) else np.nan

            bu = df['close'].iloc[i] > current_upper if not np.isnan(current_upper) else False
            bd = df['close'].iloc[i] < current_lower if not np.isnan(current_lower) else False

            results.append({
                'upper': upper, 'lower': lower, 'breakout_up': bu, 'breakout_dn': bd,
                'slope_ph': slope_ph, 'slope_pl': slope_pl
            })

        df_results = pd.DataFrame(results)
        latest = df_results.iloc[-1]
        prev = df_results.iloc[-2] if len(df_results) > 1 else latest

        # IMPROVED PREDICTION LOGIC
        atr = self._calculate_atr(df)  # Volatility
        # Linear Regression on last 20 bars for trend slope
        recent = df.tail(20)
        x = np.arange(len(recent))
        slope_lr, intercept = np.polyfit(x, recent['close'], 1)

        if latest['breakout_up']:
            target = latest['upper'] + (latest['upper'] - df['close'].iloc[-1]) * 1.5 + atr * 2
            direction = "BULLISH"
            confidence = 0.72
        elif latest['breakout_dn']:
            target = latest['lower'] - (df['close'].iloc[-1] - latest['lower']) * 1.5 - atr * 2
            direction = "BEARISH"
            confidence = 0.72
        else:
            target = df['close'].iloc[-1] + slope_lr * 10  # LR projection
            direction = "SIDEWAYS"
            confidence = 0.45

        analysis = {
            "ticker": ticker,
            "timestamp": datetime.now().isoformat(),
            "current_price": float(df['close'].iloc[-1]),
            "upper_trend": float(latest['upper']) if not np.isnan(latest['upper']) else None,
            "lower_trend": float(latest['lower']) if not np.isnan(latest['lower']) else None,
            "slope_ph": float(latest['slope_ph']),
            "slope_pl": float(latest['slope_pl']),
            "breakout_up": bool(latest['breakout_up'] and not prev['breakout_up']),
            "breakout_dn": bool(latest['breakout_dn'] and not prev['breakout_dn']),
            "predicted_price": float(target),
            "confidence": confidence,
            "prediction_text": f"{direction} breakout detected. LR slope: {slope_lr:.4f}. Volatility-adjusted target: {target:.2f}",
            "trend_state": direction,
            "atr": float(atr),
        }

        self.save_to_db(analysis)
        logger.success(f" Trendline analysis + improved prediction for {ticker} → {direction}")
        return analysis

    def _calculate_atr(self, df: pd.DataFrame) -> float:
        tr = np.maximum(df['high'] - df['low'],
                        np.maximum(abs(df['high'] - df['close'].shift()),
                                   abs(df['low'] - df['close'].shift())))
        return tr.rolling(14).mean().iloc[-1]

    def save_to_db(self, analysis: Dict):
        db: Session = SessionLocal()
        try:
            record = TrendAnalysis(
                ticker=analysis["ticker"],
                current_price=analysis["current_price"],
                upper_trend=analysis["upper_trend"],
                lower_trend=analysis["lower_trend"],
                slope_ph=analysis["slope_ph"],
                slope_pl=analysis["slope_pl"],
                breakout_up=analysis["breakout_up"],
                breakout_dn=analysis["breakout_dn"],
                predicted_price=analysis["predicted_price"],
                confidence=analysis["confidence"],
                prediction_text=analysis["prediction_text"],
                trend_state=analysis["trend_state"],
                atr=analysis["atr"]
            )
            db.add(record)