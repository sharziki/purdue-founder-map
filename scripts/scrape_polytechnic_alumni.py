#!/usr/bin/env python3
"""Build sourced alumni records from Purdue Polytechnic's public profiles."""

import concurrent.futures
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://polytechnic.purdue.edu"
INDEX = BASE + "/alumni-profiles"
OUT = ROOT / "data" / "alumni-polytechnic-expansion.json"
HEADERS = {"User-Agent": "PurdueFounderMap/1.0 (public research; contact via GitHub)"}


def soup(url):
    for attempt in range(3):
        try:
            response = requests.get(url, headers=HEADERS, timeout=25)
            response.raise_for_status()
            return BeautifulSoup(response.text, "html.parser")
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def get_text(page, selector):
    element = page.select_one(selector)
    return element.get_text(" ", strip=True) if element else ""


def profile(path):
    url = urljoin(BASE, path)
    page = soup(url)
    name = get_text(page, "h1.field-content")
    connection = get_text(page, ".views-field-field-graduation-year")
    employment = get_text(page, ".views-field-field-employer")
    if not name or not connection or not employment:
        return None
    if " at " in employment:
        role, organization = employment.rsplit(" at ", 1)
    else:
        role, organization = employment, "See Purdue profile"
    role, organization = role.strip(), organization.strip()
    if not role or not organization:
        return None
    if re.search(r"\bstudent\b", role, re.I):
        return None
    lowered = role.casefold()
    kind = "Investor" if any(word in lowered for word in ("investor", "venture capital", "private equity")) else "Founder" if any(word in lowered for word in ("founder", "co-founder")) else "Operator"
    return {
        "id": "polytechnic-" + path.rsplit("/", 1)[-1],
        "name": name,
        "connection": "Purdue Polytechnic, " + connection,
        "role": role,
        "organization": organization,
        "region": "Not listed",
        "kind": kind,
        "why_relevant": "Purdue Polytechnic alumni profile lists this role; the page does not state when the role was last updated.",
        "source_url": url,
        "verified_at": datetime.now(timezone.utc).date().isoformat(),
    }


def main():
    index = soup(INDEX)
    paths = sorted({a["href"] for a in index.select('a[href^="/alumni-profile/"]')})
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        records = [record for record in pool.map(profile, paths) if record]
    names = [record["name"].casefold() for record in records]
    assert len(names) == len(set(names)), "duplicate Polytechnic names"
    assert all(record["source_url"].startswith(BASE) for record in records)
    OUT.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(records)} documented roles from {len(paths)} public Purdue Polytechnic alumni profiles")


if __name__ == "__main__":
    main()
