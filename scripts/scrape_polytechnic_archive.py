#!/usr/bin/env python3
"""Extract dated-as-unknown professional roles from Purdue Polytechnic's archive."""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://old.polytechnic.purdue.edu"
OUT = ROOT / "data" / "alumni-polytechnic-archive.json"
HEADERS = {"User-Agent": "PurdueFounderMap/1.0 (public research; contact via GitHub)"}


def main():
    rows = []
    for page in range(30):
        url = f"{BASE}/people-profiles?field_profile_type_value=alumni&page={page}"
        response = requests.get(url, headers=HEADERS, timeout=25)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for tr in soup.select("table tbody tr"):
            cells = tr.select("td")
            if len(cells) != 5:
                continue
            link = cells[1].select_one("a[href]")
            if not link:
                continue
            name, connection, role, organization = [cell.get_text(" ", strip=True) for cell in cells[1:]]
            if not all((name, connection, role, organization)):
                continue
            if not link["href"].startswith("/people-profiles/"):
                continue
            lowered = role.casefold()
            kind = "Investor" if any(word in lowered for word in ("investor", "venture capital", "private equity")) else "Founder" if any(word in lowered for word in ("founder", "co-founder")) else "Operator"
            rows.append({
                "id": "polytechnic-archive-" + re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-"),
                "name": name,
                "connection": "Purdue Polytechnic, " + connection,
                "role": role,
                "organization": organization,
                "region": "Not listed",
                "kind": kind,
                "why_relevant": "Archived Purdue Polytechnic alumni profile; the listed role may have changed.",
                "source_url": urljoin(BASE, link["href"]),
                "verified_at": datetime.now(timezone.utc).date().isoformat(),
            })
    assert len({r["id"] for r in rows}) == len(rows), "duplicate archive ids"
    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(rows)} archived alumni roles across 30 public listing pages")


if __name__ == "__main__":
    main()
