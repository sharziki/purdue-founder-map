#!/usr/bin/env python3
"""Validate reviewed founder opportunities and publish a separate SQLite table/JSON export."""

import json
import re
import sqlite3
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
FILES = (
    "opportunities-purdue.json",
    "opportunities-indiana.json",
    "opportunities-national.json",
)
REQUIRED = {
    "id", "name", "organizer", "type", "scope", "stage", "audience",
    "benefit", "eligibility", "apply_url", "source_url", "application_cycle",
    "verified_at",
}
OPTIONAL = {"amount_text", "amount_source_url", "deadline", "deadline_source_url"}
TYPES = {"grant", "competition", "accelerator", "incubator", "fellowship", "investment", "program", "workspace"}
SCOPES = {"Purdue", "Indiana", "Midwest", "US", "Global"}
STAGES = {"Explore", "Validate", "Build", "Launch", "Fund", "Scale"}
CYCLES = {"rolling", "cohort", "event", "check_source"}


def https_url(value):
    parsed = urlparse(value or "")
    return parsed.scheme == "https" and bool(parsed.netloc)


def status(item, today):
    if item.get("deadline"):
        return "deadline_passed" if item["deadline"] < today else "upcoming_deadline"
    return "rolling" if item["application_cycle"] == "rolling" else "check_source"


def main():
    items = []
    for filename in FILES:
        path = ROOT / "data" / filename
        batch = json.loads(path.read_text())
        if not isinstance(batch, list):
            raise ValueError(f"{filename}: expected an array")
        for item in batch:
            unknown = set(item) - REQUIRED - OPTIONAL
            missing = REQUIRED - set(item)
            if unknown or missing:
                raise ValueError(f"{filename}: {item.get('id', '?')}: unknown={sorted(unknown)} missing={sorted(missing)}")
            if any(not isinstance(item[key], str) or not item[key].strip() for key in REQUIRED):
                raise ValueError(f"{filename}: {item['id']}: required fields must be nonempty strings")
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", item["id"]):
                raise ValueError(f"{filename}: invalid id {item['id']}")
            for field, allowed in (("type", TYPES), ("scope", SCOPES), ("stage", STAGES), ("application_cycle", CYCLES)):
                if item[field] not in allowed:
                    raise ValueError(f"{filename}: {item['id']}: invalid {field}={item[field]}")
            for field in ("apply_url", "source_url", "amount_source_url", "deadline_source_url"):
                if item.get(field) and not https_url(item[field]):
                    raise ValueError(f"{filename}: {item['id']}: invalid {field}")
            if item.get("amount_text") and not item.get("amount_source_url"):
                raise ValueError(f"{filename}: {item['id']}: amount lacks source")
            if item.get("deadline"):
                if not item.get("deadline_source_url"):
                    raise ValueError(f"{filename}: {item['id']}: deadline lacks source")
                date.fromisoformat(item["deadline"])
            date.fromisoformat(item["verified_at"])
            items.append(item)

    ids = [item["id"] for item in items]
    names = [(item["organizer"].casefold(), item["name"].casefold()) for item in items]
    if len(ids) != len(set(ids)) or len(names) != len(set(names)):
        raise ValueError("Duplicate opportunity ID or organizer/name")

    today = datetime.now(timezone.utc).date().isoformat()
    records = [{**item, "status": status(item, today)} for item in items]
    with sqlite3.connect(ROOT / "data" / "founders.sqlite3") as db:
        db.executescript("""
          DROP TABLE IF EXISTS opportunities;
          CREATE TABLE opportunities (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, organizer TEXT NOT NULL,
            type TEXT NOT NULL, scope TEXT NOT NULL, stage TEXT NOT NULL,
            audience TEXT NOT NULL, benefit TEXT NOT NULL, eligibility TEXT NOT NULL,
            apply_url TEXT NOT NULL, source_url TEXT NOT NULL,
            application_cycle TEXT NOT NULL, amount_text TEXT, amount_source_url TEXT,
            deadline TEXT, deadline_source_url TEXT, verified_at TEXT NOT NULL,
            status TEXT NOT NULL
          );
          CREATE INDEX idx_opportunities_type ON opportunities(type);
          CREATE INDEX idx_opportunities_scope ON opportunities(scope);
          CREATE INDEX idx_opportunities_stage ON opportunities(stage);
          CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
        """)
        db.executemany("INSERT INTO opportunities VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
            tuple(item.get(field) for field in (
                "id", "name", "organizer", "type", "scope", "stage", "audience",
                "benefit", "eligibility", "apply_url", "source_url", "application_cycle",
                "amount_text", "amount_source_url", "deadline", "deadline_source_url",
                "verified_at", "status",
            )) for item in records
        ])
    (ROOT / "public" / "opportunities.json").write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": "Curated public opportunities. Status is derived only from a sourced deadline or rolling cycle; check the official page before applying.",
        "count": len(records),
        "opportunities": records,
    }, indent=2, ensure_ascii=False) + "\n")
    print(f"Built {len(records)} opportunities → SQLite and public/opportunities.json")


if __name__ == "__main__":
    main()
