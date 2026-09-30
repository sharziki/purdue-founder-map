#!/usr/bin/env python3
"""Validate the hand-reviewed public alumni directory. No speculative scraping."""

import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "alumni.json"
REQUIRED = {"id", "name", "connection", "role", "organization", "region", "kind", "why_relevant", "source_url", "verified_at"}
KINDS = {"Founder", "Investor", "Operator"}


def validate() -> list[dict]:
    records = json.loads(DATA.read_text())
    if not isinstance(records, list):
        raise ValueError("alumni.json must contain a list")
    seen = set()
    for n, record in enumerate(records, 1):
        missing = REQUIRED - record.keys()
        if missing:
            raise ValueError(f"record {n}: missing {sorted(missing)}")
        if not all(isinstance(record[key], str) and record[key].strip() for key in REQUIRED):
            raise ValueError(f"record {n}: required fields must be nonempty strings")
        if record["id"] in seen:
            raise ValueError(f"record {n}: duplicate id {record['id']}")
        seen.add(record["id"])
        if record["kind"] not in KINDS:
            raise ValueError(f"record {n}: unknown kind {record['kind']}")
        if urlparse(record["source_url"]).scheme != "https":
            raise ValueError(f"record {n}: source must use HTTPS")
        if "email" in record and ("@" not in record["email"] or not record.get("email_source_url")):
            raise ValueError(f"record {n}: email requires a source")
        if "role_as_of" in record and not re.fullmatch(r"\d{4}", record["role_as_of"]):
            raise ValueError(f"record {n}: role_as_of must be a four-digit source year")
    return records


if __name__ == "__main__":
    records = validate()
    print(f"Validated {len(records)} sourced alumni records")
