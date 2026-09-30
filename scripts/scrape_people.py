#!/usr/bin/env python3
"""List public Purdue Innovates team candidates for human review.

This is deliberately a review aid: publishing and role descriptions remain curated
in data/people.json so a site layout change cannot silently change the directory.
"""
import json
import re
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup

SOURCE = "https://purdueinnovates.org/our-team/"
html = urlopen(Request(SOURCE, headers={"User-Agent": "Mozilla/5.0"}), timeout=20).read()
soup = BeautifulSoup(html, "html.parser")
seen = set()
rows = []
for card in soup.select("div.e-con-inner"):
    text = card.get_text(" ", strip=True)
    if len(text) > 280 or not re.search(r"[\w.+-]+@prf\.org", text, re.I):
        continue
    headings = [x.get_text(" ", strip=True) for x in card.select(".elementor-heading-title")]
    if len(headings) < 3:
        continue
    name, role, unit = headings[:3]
    email = re.search(r"[\w.+-]+@prf\.org", text, re.I).group(0).lower()
    if name.casefold() in seen:
        continue
    seen.add(name.casefold())
    img = card.find("img")
    rows.append({"name": name, "role": role, "unit": unit, "email": email,
                 "image_source": img.get("src") if img else None, "source": SOURCE})
print(json.dumps(rows, ensure_ascii=False, indent=2))
