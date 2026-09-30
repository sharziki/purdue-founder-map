#!/usr/bin/env python3
"""Build the public export and SQLite source of truth from reviewed seed rows."""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "resources.json"
DB = ROOT / "data" / "founders.sqlite3"
OUT = ROOT / "public" / "data.json"

rows = json.loads(SEED.read_text())
assert len({row["id"] for row in rows}) == len(rows), "duplicate resource id"
assert all(row["url"].startswith("https://") for row in rows)
assert all(row["source"].startswith("https://") for row in rows)
DB.parent.mkdir(exist_ok=True)
with sqlite3.connect(DB) as db:
    db.executescript("""
      DROP TABLE IF EXISTS resources;
      CREATE TABLE resources (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
        stage TEXT NOT NULL, audience TEXT NOT NULL, geography TEXT NOT NULL,
        summary TEXT NOT NULL, next_step TEXT NOT NULL, url TEXT NOT NULL,
        source TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_category ON resources(category);
      CREATE INDEX idx_stage ON resources(stage);
    """)
    checked = datetime.now(timezone.utc).date().isoformat()
    db.executemany("INSERT INTO resources VALUES (?,?,?,?,?,?,?,?,?,?,?)", [
        (r["id"], r["name"], r["category"], r["stage"], r["audience"],
         r["geography"], r["summary"], r["next_step"], r["url"], r["source"], checked)
        for r in rows
    ])
    db.commit()
OUT.write_text(json.dumps({"checked_at": checked, "resources": rows}, indent=2) + "\n")
print(f"Built {len(rows)} resources → {DB} and {OUT}")
