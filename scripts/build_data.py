#!/usr/bin/env python3
"""Build the public export and SQLite source of truth from reviewed seed rows."""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "resources.json"
NAVIGATOR = ROOT / "data" / "navigator.json"
DB = ROOT / "data" / "founders.sqlite3"
OUT = ROOT / "public" / "data.json"

rows = json.loads(SEED.read_text())
reviewed_count = len(rows)
category_map = {
    "Alumni Network": "Alumni", "Coaching & Mentorship": "Mentorship",
    "Competitions": "Competition", "Coursework": "Education",
    "De-Risking Support": "Campus support", "Ecosystem": "Campus support",
    "Event Series": "Events", "Experiential Learning": "Education",
    "Funding - Dilutive and Non-Dilutive": "Funding",
    "Majors, Minors, Certificates": "Education", "Office/Lab Space": "Workspace",
    "Programming": "Program", "Student organization": "Community",
    "Transactional Support": "IP & legal",
}
stage_map = {"Explore": "Explore", "Sketch": "Validate", "Define": "Validate", "Refine": "Build", "Launch": "Launch", "Scale": "Scale"}
seen_names = {r["name"].casefold().replace(" ", "") for r in rows}
for item in json.loads(NAVIGATOR.read_text())["resources"]:
    name = (item.get("name") or "").strip()
    if not name or name.casefold().replace(" ", "") in seen_names:
        continue
    url = (item.get("url") or "").strip()
    if not url.startswith("https://"):
        url = "https://purdueinnovates.org/navigator/"
    stages = item.get("stages") or []
    stage = next((stage_map[s] for s in stages if s in stage_map), "Explore")
    kind = item.get("type") or "Ecosystem"
    if kind.startswith("Funding"):
        stage = "Fund"
    audience = [label for key, label in (("undergrad", "Undergraduates"), ("grad", "Graduate students"), ("faculty", "Faculty"), ("alum", "Alumni"), ("industry", "Industry")) if (item.get("aud") or {}).get(key)]
    rows.append({"id": "navigator-" + str(item.get("uid") or item["name"]),
      "name": name, "category": category_map.get(kind, "Campus support"),
      "stage": stage, "audience": ", ".join(audience) or "Check organizer eligibility",
      "geography": "Purdue", "summary": (item.get("description") or "Listed in Purdue Innovates Navigator.").strip().replace("\n", " ")[:450],
      "next_step": "Open the program page." if url != "https://purdueinnovates.org/navigator/" else "Find this resource in Purdue Navigator.",
      "url": url, "source": "https://purdueinnovates.org/navigator/"})
    seen_names.add(name.casefold().replace(" ", ""))
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
OUT.write_text(json.dumps({"checked_at": checked, "reviewed_count": reviewed_count, "resources": rows}, indent=2) + "\n")
print(f"Built {len(rows)} resources ({reviewed_count} reviewed, {len(rows)-reviewed_count} Navigator) → {DB} and {OUT}")
