#!/usr/bin/env python3
"""Check that SQLite's queryable alumni facts match the public JSON export."""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
people = json.loads((ROOT / "public" / "alumni.json").read_text())["alumni"]
for person in people:
    assert set(person.get("tags", [])) == set(person.get("tag_sources", {})), person["id"]
    assert all(url.startswith("https://") for url in person.get("tag_sources", {}).values()), person["id"]
    if "VC investor" in person["tags"]:
        assert "vc-investor" in person.get("flags", []), person["id"]
    if "Venture-backed" in person["tags"]:
        assert "vc-backed" in person.get("flags", []) or any(
            claim.get("type") in {"round", "seed_round"} for claim in person.get("funding", [])
        ), person["id"]
    for item in person.get("education", []):
        assert item["source_url"].startswith("https://"), person["id"]
        assert not (item["completion_status"] == "attended_no_degree" and item.get("graduation_year")), person["id"]
    for item in person.get("affiliations", []):
        assert item["source_url"].startswith("https://") and item.get("organization") and item.get("role"), person["id"]
    if profile := person.get("startup_profile"):
        for field, value in profile.items():
            if field != "field_sources" and value:
                assert profile["field_sources"].get(field, "").startswith("https://"), (person["id"], field)
with sqlite3.connect(ROOT / "data" / "founders.sqlite3") as db:
    expected = {
        "alumni": len(people),
        "alumni_education": sum(len(p.get("education", [])) for p in people),
        "alumni_affiliations": sum(len(p.get("affiliations", [])) for p in people),
        "alumni_startups": sum(bool(p.get("startup_profile")) for p in people),
        "alumni_tags": sum(len(p.get("tags", [])) for p in people),
    }
    for table, count in expected.items():
        actual = db.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
        assert actual == count, f"{table}: SQLite has {actual}, JSON has {count}"
    for table in ("alumni_education", "alumni_affiliations", "alumni_startups", "alumni_tags"):
        orphan = db.execute(
            f"SELECT count(*) FROM {table} AS fact LEFT JOIN alumni AS person "
            "ON fact.alumni_id = person.id WHERE person.id IS NULL"
        ).fetchone()[0]
        assert orphan == 0, f"{table}: {orphan} orphan facts"
    assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    joe = db.execute(
        "SELECT completion_status, graduation_year FROM alumni_education WHERE alumni_id = ?",
        ("joe-watkins",),
    ).fetchall()
    assert joe == [("attended_no_degree", None)], joe
print("Alumni JSON and SQLite match:", expected)
