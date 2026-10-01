#!/usr/bin/env python3
"""Validate the hand-reviewed public alumni directory. No speculative scraping."""

import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "alumni.json"
EXPANSIONS = (
    "alumni-ece-expansion.json", "alumni-awards-expansion.json",
    "alumni-business-expansion.json", "alumni-polytechnic-expansion.json",
    "alumni-polytechnic-archive.json", "alumni-science-expansion.json",
    "alumni-ag-expansion.json",
    "alumni-notable-new.json",
    "alumni-founder-discovery.json",
    "alumni-cs-expansion.json",
    "alumni-biology-expansion.json",
    "alumni-yc-expansion.json",
    "alumni-liberal-arts-expansion.json",
    "alumni-hhs-pharmacy-expansion.json",
    "alumni-engineering-archive-expansion.json",
    "alumni-pfl-wave2.json",
    "alumni-expo26-expansion.json",
    "alumni-founder-stories-expansion.json",
    "alumni-paen-2026-expansion.json",
    "alumni-business-wave2.json",
    "alumni-science-archive-wave2.json",
    "alumni-polytechnic-ag-wave2.json",
    "alumni-dea-2026-expansion.json",
    "alumni-old-masters-wave3.json",
    "alumni-old-masters-early-wave3.json",
    "alumni-vet-wave3.json",
    "alumni-engineering-labs-wave4.json",
    "alumni-bay-tech-wave5.json",
    "alumni-nyc-business-wave5.json",
    "alumni-investor-wave5.json",
)
REQUIRED = {"id", "name", "connection", "role", "organization", "region", "kind", "why_relevant", "source_url", "verified_at"}
KINDS = {"Founder", "Investor", "Operator"}


def validate() -> list[dict]:
    records = []
    for path in (DATA, *(ROOT / "data" / filename for filename in EXPANSIONS)):
        batch = json.loads(path.read_text())
        if not isinstance(batch, list):
            raise ValueError(f"{path.name} must contain a list")
        records.extend(batch)
    seen = {}
    for n, record in enumerate(records, 1):
        missing = REQUIRED - record.keys()
        if missing:
            raise ValueError(f"record {n}: missing {sorted(missing)}")
        if not all(isinstance(record[key], str) and record[key].strip() for key in REQUIRED):
            raise ValueError(f"record {n}: required fields must be nonempty strings")
        if record["id"] in seen and seen[record["id"]] != record["name"].casefold():
            raise ValueError(f"record {n}: duplicate id {record['id']}")
        seen[record["id"]] = record["name"].casefold()
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
