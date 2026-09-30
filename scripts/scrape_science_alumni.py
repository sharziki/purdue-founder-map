#!/usr/bin/env python3
"""Extract public Purdue Science and Statistics alumni career profiles."""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "alumni-science-expansion.json"
SOURCES = (
    ("https://www.stat.purdue.edu/alumni/profiles/index.html", ".maincontent", "Statistics"),
    ("https://purdue.edu/science/careers/alumni_profiles/index.html", ".page-content", "Science"),
)


def record(name, connection, employment, url, department):
    if not all((name, connection, employment)):
        return None
    if " at " in employment:
        role, organization = employment.rsplit(" at ", 1)
    elif ", " in employment:
        role, organization = employment.rsplit(", ", 1)
    elif " with " in employment:
        role, organization = employment.rsplit(" with ", 1)
    else:
        role, organization = employment, "See Purdue profile"
    if organization.strip().isdigit() or role.strip().startswith(("MS Management", "M.S. Management")) or re.search(r"\bstudent\b", role, re.I):
        return None
    lowered = role.casefold()
    kind = "Investor" if "investor" in lowered else "Founder" if "founder" in lowered else "Operator"
    return {
        "id": "science-" + re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-"),
        "name": name,
        "connection": "Purdue " + department + ", " + connection,
        "role": role.strip(),
        "organization": organization.strip(),
        "region": "Not listed",
        "kind": kind,
        "why_relevant": "Public Purdue " + department + " alumni profile lists this role; verify current employment before outreach.",
        "source_url": url,
        "verified_at": datetime.now(timezone.utc).date().isoformat(),
    }


def main():
    rows = []
    for index_url, selector, department in SOURCES:
        response = requests.get(index_url, timeout=25)
        response.raise_for_status()
        container = BeautifulSoup(response.text, "html.parser").select_one(selector)
        assert container, index_url
        seen = set()
        for link in container.select('a[href$=".html"]'):
            href = link["href"]
            if href.startswith(("/", "../", "http")) or href == "index.html" or href in seen:
                continue
            seen.add(href)
            if department == "Statistics":
                box = link.parent
                if not box or box.name != "div" or not box.select_one("strong"):
                    continue
                label = box.select_one("strong").get_text(" ", strip=True)
                name = label
                if ": " in name:
                    name = name.rsplit(": ", 1)[-1]
                parts = [x.strip() for x in box.stripped_strings]
                parts = [x for x in parts if x != label]
                if len(parts) < 2:
                    continue
                connection, employment = parts[0], parts[1]
            else:
                box = link.find_parent("div", class_="is-9")
                if not box:
                    continue
                name = link.get_text(" ", strip=True)
                name = {"philip_devoe.html": "Philip DeVoe", "charles_lee_coates.html": "Charles Lee Coates"}.get(href, name)
                paragraphs = box.select("p")
                if len(paragraphs) < 2:
                    continue
                parts = list(paragraphs[1].stripped_strings)
                if len(parts) < 2:
                    continue
                connection, employment = parts[0], parts[1]
            item = record(name, connection, employment, urljoin(index_url, href), department)
            if item:
                rows.append(item)
    assert len({row["id"] for row in rows}) == len(rows), "duplicate Science alumni"
    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(rows)} Purdue Science and Statistics alumni roles")


if __name__ == "__main__":
    main()
