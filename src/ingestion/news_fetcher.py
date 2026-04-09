from .rss_parser import parse_rss_feed, save_articles
from .api_clients import NewsAPIClient, AlphaVantageClient
from loguru import logger
import asyncio

RSS_FEEDS = [
    {"name": "CNBC", "url": "https://www.cnbc.com/id/100003114/device/rss/rss.html"},
    {"name": "Bloomberg Markets", "url": "https://feeds.bloomberg.com/markets/news.rss"},
    {"name": "MarketWatch", "url": "https://feeds.marketwatch.com/marketwatch/topstories"},
    {"name": "Reuters Business", "url": "http://feeds.reuters.com/reuters/businessNews"},
    {"name": "Yahoo Finance", "url": "https://finance.yahoo.com/rss/topstories"},
    {"name": "Financial Times", "url": "https://www.ft.com/rss/home"},
    {"name": "Investing.com", "url": "https://www.investing.com/rss/news.rss"},
]

class NewsFetcher:
    def __init__(self):
        self.news_api = NewsAPIClient()
        self.alpha = AlphaVantageClient()

    async def fetch_all(self, limit_per_source: int = 15):
        logger.info("🚀 Starting full financial news ingestion...")
        all_articles = []

        # 1. RSS Feeds (fastest)
        for feed in RSS_FEEDS:
            articles = parse_rss_feed(feed["url"], limit=limit_per_source)
            all_articles.extend(articles)

        # 2. NewsAPI
        newsapi_articles = self.news_api.fetch_financial_news(limit=limit_per_source)
        all_articles.extend([{
            "title": a["title"],
            "link": a["url"],
            "summary": a["description"],
            "published": a["publishedAt"],
            "full_text": "",  # full text later if needed
            "source": a["source"]["name"]
        } for a in newsapi_articles])

        # 3. Alpha Vantage News Sentiment
        av_articles = self.alpha.fetch_news_sentiment(limit=limit_per_source)
        all_articles.extend(av_articles)

        # Save everything
        save_articles(all_articles)
        logger.success(f"🎉 Ingestion complete! Total articles: {len(all_articles)}")
        return all_articles

    def run(self):
        """Sync wrapper for Celery / scheduler"""
        return asyncio.run(self.fetch_all()))