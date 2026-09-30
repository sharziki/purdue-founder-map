#!/usr/bin/env python3
"""Build the public export and SQLite source of truth from reviewed seed rows."""
import json
import re
import sqlite3
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "resources.json"
NAVIGATOR = ROOT / "data" / "navigator.json"
DB = ROOT / "data" / "founders.sqlite3"
OUT = ROOT / "public" / "data.json"
PEOPLE = ROOT / "data" / "people.json"
PEOPLE_OUT = ROOT / "public" / "people.json"
ALUMNI_OUT = ROOT / "public" / "alumni.json"
ALUMNI_EXPANSIONS = (
    "alumni-ece-expansion.json",
    "alumni-awards-expansion.json",
    "alumni-business-expansion.json",
    "alumni-polytechnic-expansion.json",
    "alumni-polytechnic-archive.json",
    "alumni-science-expansion.json",
    "alumni-ag-expansion.json",
)


def alumni_name_key(name):
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    words = re.findall(r"[a-z]+", plain)
    return "".join(word for word in words if len(word) > 1 and word not in {"jr", "sr", "ii", "iii"})

rows = json.loads(SEED.read_text())
reviewed_count = len(rows)
rows.extend(json.loads((ROOT / "data" / "indiana-expansion.json").read_text()))
bay_data = json.loads((ROOT / "data" / "bay-area-connections.json").read_text())
bay_types = {
    "Founder workspace and investor bridge": ("Workspace", "Build"),
    "Regional alumni community": ("Alumni", "Explore"),
    "Purdue founder support": ("Campus support", "Build"),
    "Purdue founder speaker series": ("Events", "Explore"),
    "Purdue course and Bay Area visit": ("Education", "Explore"),
}
for org in bay_data["organizations"]:
    if org["id"] in {"svbig", "a16z-speedrun-alpha-2026", "bdm-sf-trip-2026"}:
        continue  # Already covered by durable curated program entries.
    category, stage = bay_types[org["type"]]
    rows.append({"id": org["id"], "name": org["name"], "category": category,
        "stage": stage, "audience": "Purdue founders and alumni",
        "geography": "Bay Area", "summary": org["why_it_matters"],
        "next_step": "Open the official page for access details and current dates.",
        "url": org["url"], "source": org["source_urls"][0]})
expanded_count = len(rows)
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
    people = json.loads(PEOPLE.read_text())
    assert len({person["id"] for person in people}) == len(people), "duplicate person id"
    assert all(person["url"].startswith("https://") for person in people)
    db.executescript("""
      DROP TABLE IF EXISTS people;
      CREATE TABLE people (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
        organization TEXT NOT NULL, lane TEXT NOT NULL, helps TEXT NOT NULL,
        url TEXT NOT NULL, image TEXT, email TEXT, verified_at TEXT NOT NULL
      );
      CREATE INDEX idx_people_lane ON people(lane);
    """)
    db.executemany("INSERT INTO people VALUES (?,?,?,?,?,?,?,?,?,?)", [
        (p["id"], p["name"], p["role"], p["organization"], p["lane"],
         p["helps"], p["url"], p.get("image"), p.get("email"), p["verified_at"])
        for p in people
    ])
    alumni = json.loads((ROOT / "data" / "alumni.json").read_text())
    known = {alumni_name_key(person["name"]): index for index, person in enumerate(alumni)}
    for item in bay_data["people"]:
        if alumni_name_key(item["name"]) in known:
            continue
        role = item["current_role"].lower()
        kind = "Investor" if any(term in role for term in ("investor", "partner", "golden seeds", "angel")) else "Founder" if any(term in role for term in ("founder", "entrepreneur")) else "Operator"
        alumni.append({"id": item["id"], "name": item["name"],
            "connection": item["purdue_connection"], "role": item["current_role"],
            "organization": item["organization"], "region": "Bay Area connection",
            "location_detail": item["location"], "kind": kind,
            "why_relevant": item["founder_relevance"],
            "source_url": item["source_urls"][0],
            "verified_at": bay_data["reviewed_at"], "source_urls": item["source_urls"]})
        known[alumni_name_key(item["name"])] = len(alumni) - 1
    protected = set(known)
    for filename in ALUMNI_EXPANSIONS:
        for person in json.loads((ROOT / "data" / filename).read_text()):
            key = alumni_name_key(person["name"])
            if key not in known:
                known[key] = len(alumni)
                alumni.append(person)
            elif key not in protected and int(person.get("role_as_of") or 0) > int(alumni[known[key]].get("role_as_of") or 0):
                alumni[known[key]] = person
    extra_portraits = {
            "ashish-toshniwal": "https://engineering.purdue.edu/ECE/Alums/OECE/2021/Images/TOSHNIWAL-web.jpg",
            "akshay-kothari": "https://engineering.purdue.edu/ECE/Alums/OECE/2014/Images/kothari.jpg",
    }
    for person in alumni:
        if person["id"] in extra_portraits:
            person["image"] = "/assets/alumni/" + person["id"] + ".webp"
            person["image_source_url"] = extra_portraits[person["id"]]
    assert len({person["id"] for person in alumni}) == len(alumni), "duplicate alumni id"
    assert all(person["source_url"].startswith("https://") for person in alumni)
    db.executescript("""
      DROP TABLE IF EXISTS alumni;
      CREATE TABLE alumni (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, connection TEXT NOT NULL,
        role TEXT NOT NULL, organization TEXT NOT NULL, region TEXT NOT NULL,
        kind TEXT NOT NULL, why_relevant TEXT NOT NULL,
        source_url TEXT NOT NULL, verified_at TEXT NOT NULL,
        image TEXT, image_source_url TEXT, role_as_of TEXT
      );
      CREATE INDEX idx_alumni_region ON alumni(region);
    """)
    db.executemany("INSERT INTO alumni VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", [
        (p["id"], p["name"], p["connection"], p["role"], p["organization"],
         p["region"], p["kind"], p["why_relevant"], p["source_url"], p["verified_at"],
        p.get("image"), p.get("image_source_url"), p.get("role_as_of"))
        for p in alumni
    ])
    db.commit()
OUT.write_text(json.dumps({"checked_at": checked, "reviewed_count": reviewed_count, "expanded_count": expanded_count, "resources": rows}, indent=2) + "\n")
PEOPLE_OUT.write_text(json.dumps({"generated_at": checked, "people": people}, ensure_ascii=False, indent=2) + "\n")
ALUMNI_OUT.write_text(json.dumps({"generated_at": checked, "alumni": alumni}, ensure_ascii=False, indent=2) + "\n")
print(f"Built {len(rows)} resources ({reviewed_count} core, {expanded_count-reviewed_count} expansion, {len(rows)-expanded_count} Navigator) → {DB} and {OUT}")
print(f"Built {len(people)} public professional profiles → {DB} and {PEOPLE_OUT}")
print(f"Built {len(alumni)} alumni profiles → {DB} and {ALUMNI_OUT}")
