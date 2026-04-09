import feedparser
import requests
from bs4 import BeautifulSoup
from loguru import logger
from typing import List, Dict
from datetime import datetime

def parse_rss_feed(url: str, limit: int = 15) -> List[Dict]:
    """Parse RSS feed and return clean article dicts"""
    try:
        feed = feedparser.parse(url)
        articles = []

        for entry in feed.entries[:limit]:
            # Try to get full text if summary is short
            summary = entry.get("summary", entry.get("description", ""))
            if len(summary) < 100 and entry.get("link"):
                try:
                    resp = requests.get(entry.link, timeout=8)
                    soup = BeautifulSoup(resp.text, "html.parser")
                    paragraphs = soup.find_all("p")
                    full_text = " ".join(p.get_text() for p in paragraphs[:5])
                except:
                    full_text = summary
            else:
                full_text = summary

            article = {
                "title": entry.get("title", "No Title"),
                "link": entry.get("link"),
                "summary": summary[:500],
                "full_text": full_text[:2000],
                "published": entry.get("published_parsed") or entry.get("updated_parsed"),
                "source": feed.feed.get("title", "Unknown"),
                "source_url": url
            }
            articles.append(article)

        logger.info(f"✅ RSS {feed.feed.get('title', 'Unknown')} → {len(articles)} articles")
        return articles

    except Exception as e:
        logger.error(f"Failed to parse RSS feed {url}: {e}")
        return []


def save_articles(articles: List[Dict]):
    """Save articles to JSON (temporary) – later replace with DB save"""
    import json
    from pathlib import Path

    try:
        Path("data").mkdir(exist_ok=True)
        filename = f"data/articles_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        logger.info(f"Articles saved to {filename}")
    except Exception as e:
        logger.error(f"Failed to save articles: {e}")