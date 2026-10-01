#!/usr/bin/env python3
"""Build the public export and SQLite source of truth from reviewed seed rows."""
import json
import re
import sqlite3
import unicodedata
from urllib.parse import urlparse
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
NOTABLE_OUT = ROOT / "public" / "notable-alumni.json"
NOTABLE_ORDER = ROOT / "data" / "notable-display-order.json"
ALUMNI_EXPANSIONS = (
    "alumni-ece-expansion.json",
    "alumni-awards-expansion.json",
    "alumni-business-expansion.json",
    "alumni-polytechnic-expansion.json",
    "alumni-polytechnic-archive.json",
    "alumni-science-expansion.json",
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
)
ALUMNI_ENRICHMENTS = (
    "alumni-funding-enrichment.json",
    "alumni-social-enrichment.json",
    "alumni-social-wave3-enrichment.json",
    "alumni-location-enrichment.json",
    "alumni-company-enrichment.json",
    "alumni-capital-enrichment.json",
    "alumni-notable-enrichment.json",
    "alumni-education-enrichment.json",
    "alumni-affiliations-enrichment.json",
    "alumni-startup-enrichment.json",
)
ENRICHMENT_FIELDS = {
    "funding", "company", "company_location", "linkedin", "linkedin_source_url",
    "x", "x_source_url", "flags", "flag_sources", "flag_notes", "location_city",
    "location_region", "location_country", "location_source_url",
    "location_as_of", "location_note",
    "company_website", "company_website_source_url", "company_product",
    "company_product_source_url", "company_sector", "company_sector_source_url",
    "company_founded_year", "company_founded_year_source_url",
    "capital_events", "highlights", "notable_lanes", "notable_source_url",
    "highlight_order",
    "education", "affiliations", "startup_profile",
}


ALUMNI_ID_ALIASES = {
    "ece-aelred-al-kurtenbach": "aelred-j-kurtenbach",
    "ece-andrew-aj-metcalf": "andrew-metcalf",
    "ece-karenann-terrell": "karenann-kat-terrell",
    "lab-nanoenergy-tianli-feng": "tianli-andy-feng",
    "kathy-kilmer": "kathy-kortte-kilmer",
    "michelle-renae-crumm": "michelle-crumm",
    "peg-berens": "peg-powell-berens",
    "dea26-yen-yu-matsutomi": "aae-oae-yen-matsutomi",
}


def alumni_name_key(name):
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    words = re.findall(r"[a-z]+", plain)
    key = "".join(word for word in words if len(word) > 1 and word not in {"jr", "sr", "ii", "iii"})
    return {
        "aelredalkurtenbach": "aelredkurtenbach",
        "aelredjkurtenbach": "aelredkurtenbach",
        "andrewajmetcalf": "andrewmetcalf",
        "karenannkatterrell": "karenannterrell",
        "tianliandyfeng": "tianlifeng",
        "kathykorttekilmer": "kathykilmer",
        "michellerenaecrumm": "michellecrumm",
        "pegpowellberens": "pegberens",
        "yenyumatsutomi": "yenmatsutomi",
    }.get(key, key)

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
    pinned_ids = set(json.loads(NOTABLE_ORDER.read_text()))
    for enrichment_name in ALUMNI_ENRICHMENTS:
        enrichment_path = ROOT / "data" / enrichment_name
        if enrichment_path.exists():
            pinned_ids.update(json.loads(enrichment_path.read_text()))
    for filename in ALUMNI_EXPANSIONS:
        for person in json.loads((ROOT / "data" / filename).read_text()):
            person = {**person, "id": ALUMNI_ID_ALIASES.get(person["id"], person["id"])}
            key = alumni_name_key(person["name"])
            if key not in known:
                known[key] = len(alumni)
                alumni.append(person)
            elif person["id"] == alumni[known[key]]["id"]:
                current = alumni[known[key]]
                newer = key not in protected and int(person.get("role_as_of") or 0) > int(current.get("role_as_of") or 0)
                alumni[known[key]] = {**(current if newer else person), **(person if newer else current)}
            elif key in protected:
                current = alumni[known[key]]
                stable_id = person["id"] if person["id"] in pinned_ids and current["id"] not in pinned_ids else current["id"]
                alumni[known[key]] = {**person, **current, "id": stable_id}
            elif int(person.get("role_as_of") or 0) > int(alumni[known[key]].get("role_as_of") or 0):
                current = alumni[known[key]]
                stable_id = person["id"] if person["id"] in pinned_ids and current["id"] not in pinned_ids else current["id"]
                alumni[known[key]] = {**current, **person, "id": stable_id}
            else:
                current = alumni[known[key]]
                alumni[known[key]] = {**person, **current}
    by_id = {person["id"]: person for person in alumni}
    for filename in ALUMNI_ENRICHMENTS:
        path = ROOT / "data" / filename
        if not path.exists():
            continue
        for person_id, details in json.loads(path.read_text()).items():
            person_id = ALUMNI_ID_ALIASES.get(person_id, person_id)
            if person_id not in by_id:
                raise ValueError(f"{filename}: unknown alumni id {person_id}")
            unknown = set(details) - ENRICHMENT_FIELDS
            if unknown:
                raise ValueError(f"{filename}: unsupported fields {sorted(unknown)}")
            if "funding" in details:
                assert isinstance(details["funding"], list)
                assert all(claim.get("source_url", "").startswith("https://") and claim.get("amount") for claim in details["funding"])
            for field in ("linkedin", "linkedin_source_url", "x", "x_source_url", "location_source_url"):
                if details.get(field) and not details[field].startswith("https://"):
                    raise ValueError(f"{filename}: {person_id} has invalid {field}")
            if details.get("linkedin"):
                url = urlparse(details["linkedin"])
                if not (url.hostname == "linkedin.com" or (url.hostname or "").endswith(".linkedin.com")) or not url.path.startswith(("/in/", "/pub/")) or not details.get("linkedin_source_url"):
                    raise ValueError(f"{filename}: {person_id} has unverified LinkedIn profile")
            if details.get("x"):
                url = urlparse(details["x"])
                if url.hostname not in {"x.com", "www.x.com", "twitter.com", "www.twitter.com"} or url.path.startswith(("/intent", "/Purdue")) or not details.get("x_source_url"):
                    raise ValueError(f"{filename}: {person_id} has unverified X profile")
            if "flags" in details:
                allowed_flags = {"historical-role", "purdue-founder", "investor", "indiana", "bay-area", "mentor"}
                if not isinstance(details["flags"], list) or any(flag not in allowed_flags or not details.get("flag_sources", {}).get(flag, "").startswith("https://") for flag in details["flags"]):
                    raise ValueError(f"{filename}: {person_id} has unsourced flags")
            if any(details.get(field) for field in ("location_city", "location_region", "location_country")) and not details.get("location_source_url"):
                raise ValueError(f"{filename}: {person_id} has unsourced personal location")
            if details.get("company_location") and not details["company_location"].get("source_url", "").startswith("https://"):
                raise ValueError(f"{filename}: {person_id} has unsourced company location")
            for field in ("company_website", "company_product", "company_sector", "company_founded_year"):
                if field in details:
                    source = details.get(f"{field}_source_url", "")
                    if not source.startswith("https://"):
                        raise ValueError(f"{filename}: {person_id} has unsourced {field}")
            if details.get("company_website") and not details["company_website"].startswith("https://"):
                raise ValueError(f"{filename}: {person_id} has invalid company website")
            for field, required in (("capital_events", ("type", "company", "description")),
                                    ("highlights", ("claim",))):
                if field in details:
                    events = details[field]
                    if not isinstance(events, list) or any(
                        not isinstance(event, dict) or
                        any(not event.get(key) for key in required) or
                        not event.get("source_url", "").startswith("https://")
                        for event in events
                    ):
                        raise ValueError(f"{filename}: {person_id} has invalid {field}")
            if "notable_lanes" in details:
                allowed_lanes = {"startup-founder", "venture-investor", "industry-builder", "campus-builder"}
                if not isinstance(details["notable_lanes"], list) or not details["notable_lanes"] or any(
                    lane not in allowed_lanes for lane in details["notable_lanes"]
                ) or not details.get("notable_source_url", "").startswith("https://"):
                    raise ValueError(f"{filename}: {person_id} has invalid notable lanes")
            if "education" in details:
                items = details["education"]
                if not isinstance(items, list) or any(
                    not isinstance(item, dict) or not item.get("institution") or
                    not item.get("source_url", "").startswith("https://") or
                    item.get("completion_status", "degree_completed") not in {"degree_completed", "attended_no_degree", "attended_status_unknown"} or
                    (item.get("completion_status") == "attended_no_degree" and (item.get("degree") or item.get("graduation_year"))) or
                    (item.get("graduation_year") and not re.fullmatch(r"\d{4}", str(item["graduation_year"])))
                    for item in items
                ):
                    raise ValueError(f"{filename}: {person_id} has invalid education")
            if "affiliations" in details:
                allowed_relationships = {"founder", "co-founder", "investor", "executive", "employee", "board", "advisor"}
                allowed_statuses = {"historical", "current_as_of_source"}
                items = details["affiliations"]
                if not isinstance(items, list) or any(
                    not isinstance(item, dict) or not item.get("organization") or
                    not item.get("role") or item.get("relationship") not in allowed_relationships or
                    item.get("status") not in allowed_statuses or
                    not item.get("source_url", "").startswith("https://") or
                    (item.get("as_of") and not re.fullmatch(r"\d{4}", str(item["as_of"])))
                    for item in items
                ):
                    raise ValueError(f"{filename}: {person_id} has invalid affiliations")
            if "startup_profile" in details:
                profile = details["startup_profile"]
                fields = ("company_name", "company_url", "founded_year", "product_summary", "sector", "company_stage_as_of_source", "exit_status")
                sources = profile.get("field_sources", {}) if isinstance(profile, dict) else {}
                if not isinstance(profile, dict) or not profile.get("company_name") or not isinstance(sources, dict) or any(
                    field in profile and (not isinstance(profile[field], str) or not profile[field].strip() or
                    not sources.get(field, "").startswith("https://"))
                    for field in fields
                ) or (profile.get("founded_year") and not re.fullmatch(r"\d{4}", str(profile["founded_year"]))) or (
                    profile.get("company_url") and not profile["company_url"].startswith("https://")
                ):
                    raise ValueError(f"{filename}: {person_id} has invalid startup profile")
            by_id[person_id].update(details)
    extra_portraits = {
            "ashish-toshniwal": "https://engineering.purdue.edu/ECE/Alums/OECE/2021/Images/TOSHNIWAL-web.jpg",
            "akshay-kothari": "https://engineering.purdue.edu/ECE/Alums/OECE/2014/Images/kothari.jpg",
    }
    for person in alumni:
        for education in person.get("education", []):
            education.setdefault("completion_status", "degree_completed" if education.get("degree") or education.get("graduation_year") else "attended_status_unknown")
        if person["id"] in extra_portraits:
            person["image"] = "/assets/alumni/" + person["id"] + ".webp"
            person["image_source_url"] = extra_portraits[person["id"]]
    display_ids = json.loads(NOTABLE_ORDER.read_text())
    if len(display_ids) != len(set(display_ids)) or any(
        person_id not in by_id or not by_id[person_id].get("highlights")
        for person_id in display_ids
    ):
        raise ValueError("notable display order must contain unique alumni with sourced highlights")
    for index, person_id in enumerate(display_ids):
        by_id[person_id]["highlight_order"] = index
    assert len({person["id"] for person in alumni}) == len(alumni), "duplicate alumni id"
    assert all(person["source_url"].startswith("https://") for person in alumni)
    db.executescript("""
      DROP TABLE IF EXISTS alumni_education;
      DROP TABLE IF EXISTS alumni_affiliations;
      DROP TABLE IF EXISTS alumni_startups;
      DROP TABLE IF EXISTS alumni;
      CREATE TABLE alumni (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, connection TEXT NOT NULL,
        role TEXT NOT NULL, organization TEXT NOT NULL, region TEXT NOT NULL,
        kind TEXT NOT NULL, why_relevant TEXT NOT NULL,
        source_url TEXT NOT NULL, verified_at TEXT NOT NULL,
        image TEXT, image_source_url TEXT, role_as_of TEXT, enrichment_json TEXT NOT NULL
      );
      CREATE INDEX idx_alumni_region ON alumni(region);
    """)
    db.executemany("INSERT INTO alumni VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
        (p["id"], p["name"], p["connection"], p["role"], p["organization"],
         p["region"], p["kind"], p["why_relevant"], p["source_url"], p["verified_at"],
        p.get("image"), p.get("image_source_url"), p.get("role_as_of"),
        json.dumps({key: p[key] for key in ENRICHMENT_FIELDS if key in p}, ensure_ascii=False))
        for p in alumni
    ])
    db.executescript("""
      CREATE TABLE alumni_education (
        alumni_id TEXT NOT NULL REFERENCES alumni(id), institution TEXT NOT NULL,
        degree TEXT, field TEXT, graduation_year TEXT,
        completion_status TEXT NOT NULL, source_url TEXT NOT NULL
      );
      CREATE INDEX idx_alumni_education_year ON alumni_education(graduation_year);
      CREATE INDEX idx_alumni_education_alumni ON alumni_education(alumni_id);
      CREATE TABLE alumni_affiliations (
        alumni_id TEXT NOT NULL REFERENCES alumni(id), organization TEXT NOT NULL,
        role TEXT NOT NULL, relationship TEXT NOT NULL, as_of TEXT,
        status TEXT NOT NULL, source_url TEXT NOT NULL
      );
      CREATE INDEX idx_alumni_affiliations_org ON alumni_affiliations(organization);
      CREATE INDEX idx_alumni_affiliations_alumni ON alumni_affiliations(alumni_id);
      CREATE TABLE alumni_startups (
        alumni_id TEXT PRIMARY KEY REFERENCES alumni(id), company_name TEXT NOT NULL,
        company_url TEXT, founded_year TEXT, product_summary TEXT, sector TEXT,
        company_stage_as_of_source TEXT, exit_status TEXT, field_sources_json TEXT NOT NULL
      );
      CREATE INDEX idx_alumni_startups_sector ON alumni_startups(sector);
    """)
    db.executemany("INSERT INTO alumni_education VALUES (?,?,?,?,?,?,?)", [
        (p["id"], e["institution"], e.get("degree"), e.get("field"),
         e.get("graduation_year"), e["completion_status"], e["source_url"])
        for p in alumni for e in p.get("education", [])
    ])
    db.executemany("INSERT INTO alumni_affiliations VALUES (?,?,?,?,?,?,?)", [
        (p["id"], a["organization"], a["role"], a["relationship"],
         a.get("as_of"), a["status"], a["source_url"])
        for p in alumni for a in p.get("affiliations", [])
    ])
    db.executemany("INSERT INTO alumni_startups VALUES (?,?,?,?,?,?,?,?,?)", [
        (p["id"], s["company_name"], s.get("company_url"), s.get("founded_year"),
         s.get("product_summary"), s.get("sector"), s.get("company_stage_as_of_source"),
         s.get("exit_status"), json.dumps(s["field_sources"], ensure_ascii=False))
        for p in alumni if (s := p.get("startup_profile"))
    ])
    db.commit()
OUT.write_text(json.dumps({"checked_at": checked, "reviewed_count": reviewed_count, "expanded_count": expanded_count, "resources": rows}, indent=2) + "\n")
PEOPLE_OUT.write_text(json.dumps({"generated_at": checked, "people": people}, ensure_ascii=False, indent=2) + "\n")
ALUMNI_OUT.write_text(json.dumps({"generated_at": checked, "alumni": alumni}, ensure_ascii=False, indent=2) + "\n")
notable = sorted((person for person in alumni if person.get("highlights")),
                 key=lambda person: (person.get("highlight_order", len(display_ids)), person["name"]))
NOTABLE_OUT.write_text(json.dumps({
    "generated_at": checked,
    "selection": "Editorial set of Purdue-connected founders, investors, and builders with specific public milestones. Inclusion is not a ranking or an endorsement; each milestone links to its source.",
    "count": len(notable),
    "alumni": notable,
}, ensure_ascii=False, indent=2) + "\n")
print(f"Built {len(rows)} resources ({reviewed_count} core, {expanded_count-reviewed_count} expansion, {len(rows)-expanded_count} Navigator) → {DB} and {OUT}")
print(f"Built {len(people)} public professional profiles → {DB} and {PEOPLE_OUT}")
print(f"Built {len(alumni)} alumni profiles → {DB} and {ALUMNI_OUT}")
print(f"Built {len(notable)} sourced milestone profiles → {NOTABLE_OUT}")
