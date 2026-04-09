import feedparser
from newspaper import Article
from datetime import datetime
import json
from pathlib import Path
from loguru import logger

DATA_DIR = Path("data/raw_news")
DATA_DIR.mkdir(parents=True, exist_ok=True)

def parse_rss_feed(url: str, limit: int = 20):
    """Parse RSS feed and download full article text."""
    feed = feedparser.parse(url)
    articles = []
    
    for entry in feed.entries[:limit]:
        try:
            article = Article(entry.link)
            article.download()
            article.parse()
            
            articles.append({
                "title": entry.title,
                "link": entry.link,
                "summary": entry.get("summary", ""),
                "published": entry.get("published", datetime.now().isoformat()),
                "full_text": article.text,
                "authors": article.authors,
                "source": feed.feed.title if hasattr(feed.feed, "title") else "Unknown",
                "fetched_at": datetime.now().isoformat()
            })
            logger.info(f"✅ Parsed: {entry.title[:60]}...")
        except Exception as e:
            logger.warning(f"Failed to parse {entry.link}: {e}")
    
    return articles

def save_articles(articles, filename: str = None):
    if not filename:
        filename = f"news_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    path = DATA_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    logger.success(f"💾 Saved {len(articles)} articles → {path}")