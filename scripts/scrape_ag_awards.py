#!/usr/bin/env python3
"""Check hand-reviewed agriculture alumni roles against Purdue's award archive."""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "alumni-ag-expansion.json"
URL = "https://ag.purdue.edu/agalumni/awards/DistinguishedAgAlumniAlpha.html"
# Historic award pages. These are documented career examples, not current-job claims.
CURATED = [
    ("Tahirou Abdoulaye", "Agricultural economist", "International Institute of Tropical Agriculture"),
    ("Mary Beth Adams", "Research soil scientist", "USDA Forest Service"),
    ("W. Dwight Armstrong", "President and CEO", "Carl S. Akey"),
    ("Antônio Bandeira", "President-director", "AGROS"),
    ("Lawrence “Sonny” Beck", "President and general manager", "Beck’s Superior Hybrids"),
    ("Martin Berry", "Senior principal research engineer", "Ocean Spray Cranberries"),
    ("Richard A. Brock", "President", "Brock Associates"),
    ("Allen Thomas Budd", "Vice president and publisher", "Farm Progress Companies"),
    ("James R. Carpenter", "President and CEO", "Wild Birds Unlimited"),
    ("Joseph Coffey", "Vice president of economics and planning", "Southern State Cooperative"),
    ("David A. Dull", "President and CEO", "Fluidrive"),
    ("Victoria L. Finkenstadt", "Lead scientist", "National Center for Agricultural Utilization Research"),
    ("Robert R. Halderman", "President", "Halderman Farm Management Service"),
    ("Marilyn Hartig", "Vice president of external service and technology", "Bristol-Myers Squibb"),
    ("Jay Hood", "Principal and director of landscape architecture", "Littlejohn Engineering Associates"),
    ("Michael Jackson", "Founder and president", "Agri Business group"),
    ("Shibu Jose", "Editor-in-chief", "Agroforestry Systems"),
    ("William Mann", "President", "Mann Seed Farms"),
    ("Jean L. Marx", "Deputy news editor", "Science magazine"),
    ("Thomas McKinney", "President and general manager", "McKinney & McKinney"),
    ("Robert B. McNamara", "Founder and president", "McNamara Florists"),
    ("Darrell G. Medcalf", "Vice president of research", "Kraft General Foods"),
    ("Melak Mengesha", "Director, genetic resources", "International Crop Research Institute"),
    ("Barton R. Nelson", "President", "Nelson Irrigation Corporation"),
    ("John H. Nelson", "Vice president of science and technology", "McCormick and Company"),
    ("Craig Newman", "President and CEO", "AgReliant Genetics"),
    ("Michael E. Pape", "Founding partner and managing director", "Orchard Venture Partners"),
    ("Ronald R. Rice", "Group vice president", "The Kroger Company"),
    ("James Rieth", "President and CEO", "Jennie-O Foods"),
    ("Robert M. Schweikher", "Vice president and COO", "Orcon Corporation"),
    ("Max D. Summers", "Distinguished professor of entomology", "Texas A&M University"),
    ("Sue A. Tolin", "Professor of plant pathology", "Virginia Polytechnic Institute"),
    ("Jeffrey T. Troike", "President and CEO", "Ceres Solutions"),
    ("Terry L. Tucker", "Chairman, president and CEO", "Maple Leaf Farms"),
    ("Del Unger", "Owner-operator", "Unger Farms"),
    ("Elaine R. Wedral", "President and chairman", "Westreco"),
    ("Karl Weiss", "Vice president, Earthmoving Division", "Caterpillar"),
    ("Kristin Whittington", "Founder and president", "Landmark Enterprises"),
    ("Robert K. Wichmann", "Corporate vice president, North American Seed Division", "Pioneer Hi-Bred International"),
]


def fold(value):
    return re.sub(r"[^a-z0-9]+", "", value.casefold().replace("&", ""))


def main():
    response = requests.get(URL, timeout=25)
    response.raise_for_status()
    page = BeautifulSoup(response.text, "html.parser")
    paragraphs = page.select("p")
    headings = [i for i, p in enumerate(paragraphs) if "Distinguished Ag Alumni:" in p.get_text(" ", strip=True)]
    profiles = {}
    for position, start in enumerate(headings):
        heading = paragraphs[start].get_text(" ", strip=True)
        name = heading.split("(", 1)[0].strip()
        end = headings[position + 1] if position + 1 < len(headings) else len(paragraphs)
        body = " ".join(p.get_text(" ", strip=True) for p in paragraphs[start + 1:end])
        year = re.search(r"Distinguished Ag Alumni:\s*(\d{4})", heading)
        if name and year:
            profiles[fold(name)] = (name, body, year.group(1))
    records = []
    for name, role, organization in CURATED:
        key = fold(name)
        if key not in profiles:
            raise ValueError(f"Award profile missing: {name}")
        source_name, body, year = profiles[key]
        if fold(organization) not in fold(body):
            raise ValueError(f"Organization missing in source: {name} / {organization}")
        records.append({
            "id": "ag-award-" + re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-"),
            "name": source_name,
            "connection": "Purdue College of Agriculture distinguished alumnus",
            "role": role + " (historical)",
            "organization": organization,
            "region": "Not listed",
            "kind": "Investor" if "Venture Partners" in organization else "Founder" if "Founder" in role or "Owner" in role else "Operator",
            "why_relevant": "Purdue's Distinguished Agriculture Alumni archive documents this role; check current details before outreach.",
            "source_url": URL,
            "role_as_of": year,
            "verified_at": datetime.now(timezone.utc).date().isoformat(),
        })
    OUT.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(records)} curated agriculture alumni profiles checked against Purdue's archive")


if __name__ == "__main__":
    main()
