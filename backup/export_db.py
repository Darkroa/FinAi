#!/usr/bin/env python3
"""
FinAi — Database Export Script
================================
Exports every table from the live PostgreSQL DB to JSON files in backup/data/.
Run from the project root:
    python backup/export_db.py

The backup/data/ folder is git-ignored (local only).
"""

import json
import os
import sys
from datetime import datetime, date
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit("psycopg2 not found — run:  pip install psycopg2-binary")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("DATABASE_URL environment variable not set.")

OUT_DIR = Path(__file__).parent / "data"
OUT_DIR.mkdir(exist_ok=True)

# Tables in safe export order (FK parents first)
TABLES = [
    "users",
    "wallet_config",
    "api_keys",
    "transactions",
    "user_money",
    "trade_logs",
    "notifications",
    "support_tickets",
    "support_messages",
    "subscription_requests",
    "price_alerts",
    "ads",
    "testimonials",
    "bonuses",
    "user_bonus_claims",
    "events",
    "trend_analyses",
]


def _serialize(val):
    """Recursively serialize values to JSON-safe types."""
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, dict):
        return {k: _serialize(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_serialize(v) for v in val]
    # Return as-is (str, int, float, bool, None all fine)
    return val


def export_table(cur, table: str) -> int:
    try:
        # Use RealDictCursor so JSONB columns come back as dicts/lists
        cur.execute(f"SELECT * FROM {table}")
    except Exception as e:
        print(f"  ⚠  Skipped {table}: {e}")
        return 0

    cols = [desc[0] for desc in cur.description]
    rows = []
    for row in cur.fetchall():
        rows.append({col: _serialize(val) for col, val in zip(cols, row)})

    out_path = OUT_DIR / f"{table}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2, default=str)

    return len(rows)


def main():
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"\n{'='*55}")
    print(f"  FinAi DB Export — {timestamp}")
    print(f"  Output: {OUT_DIR}")
    print(f"{'='*55}")

    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    conn.autocommit = True
    cur = conn.cursor()

    total_rows = 0
    for table in TABLES:
        count = export_table(cur, table)
        total_rows += count
        status = f"{count:>6,} rows" if count > 0 else "  (empty)"
        print(f"  ✓  {table:<30} {status}")

    cur.close()
    conn.close()

    # Write a manifest
    manifest = {
        "exported_at": timestamp,
        "tables": TABLES,
        "total_rows": total_rows,
    }
    (OUT_DIR / "_manifest.json").write_text(json.dumps(manifest, indent=2))

    print(f"{'='*55}")
    print(f"  Done. {total_rows:,} total rows → backup/data/")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
