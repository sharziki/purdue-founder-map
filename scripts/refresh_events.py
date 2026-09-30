#!/usr/bin/env python3
"""Collect public, dated founder events from first-party calendars."""
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "events.json"
now = datetime.now(timezone.utc)
events = []
failures = []

try:
    body = requests.get("https://www.anvilstartups.com/calendar.ics", timeout=25).text
    lines = re.sub(r"\r?\n[ \t]", "", body).splitlines()
    blocks = "\n".join(lines).split("BEGIN:VEVENT")[1:]
    for block in blocks:
        fields = {}
        for line in block.splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                fields[key.split(";", 1)[0]] = value
        if not fields.get("DTSTART") or not fields.get("SUMMARY"):
            continue
        if not re.fullmatch(r"\d{8}T\d{6}Z", fields["DTSTART"]):
            continue
        start = datetime.strptime(fields["DTSTART"], "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        if start < now:
            continue
        events.append({"id": "anvil-" + fields.get("UID", fields["DTSTART"]),
            "title": fields["SUMMARY"].replace(r"\,", ","), "starts_at": start.isoformat(),
            "venue": fields.get("LOCATION", "See event page").replace(r"\,", ","),
            "host": "The Anvil", "url": fields.get("URL", "https://www.anvilstartups.com/events"),
            "source": "https://www.anvilstartups.com/calendar.ics"})
except Exception as exc:
    failures.append(f"Anvil: {exc}")

try:
    source = "https://www.buildpurdue.org/events"
    soup = BeautifulSoup(requests.get(source, timeout=25).text, "html.parser")
    for anchor in soup.select('a[href^="/events/"]'):
        title = anchor.select_one("h3")
        paragraphs = anchor.select("p")
        if not title or not paragraphs:
            continue
        name = title.get_text(" ", strip=True)
        if name.lower().startswith("test event"):
            continue
        try:
            # Site renders UTC; browser UI converts to local time.
            start = datetime.strptime(paragraphs[0].get_text(" ", strip=True), "%b %d, %Y at %I:%M %p").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        if start < now:
            continue
        events.append({"id": "buildpurdue-" + anchor["href"].split("/")[-1],
            "title": name, "starts_at": start.isoformat(),
            "venue": paragraphs[1].get_text(" ", strip=True) if len(paragraphs) > 1 else "See event page",
            "host": "buildpurdue", "url": urljoin(source, anchor["href"]), "source": source})
except Exception as exc:
    failures.append(f"buildpurdue: {exc}")

try:
    source = "https://new.business.purdue.edu/events/exec-forum/home.php"
    soup = BeautifulSoup(requests.get(source, timeout=25).text, "html.parser")
    for item in soup.select("li"):
        title = item.select_one("h3")
        link = item.select_one("a[href]")
        if not title or not link or "Executive Forum with" not in title.get_text():
            continue
        date_match = re.search(r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b", link.get_text(" ", strip=True))
        if not date_match:
            continue
        start = datetime.strptime(f"{date_match.group(1)} {date_match.group(2)} {now.year} 11:30", "%d %b %Y %H:%M").replace(tzinfo=ZoneInfo("America/Indiana/Indianapolis"))
        if start.astimezone(timezone.utc) < now:
            continue
        events.append({"id": "executive-forum-" + start.date().isoformat(),
            "title": title.get_text(" ", strip=True), "starts_at": start.astimezone(timezone.utc).isoformat(),
            "venue": "Rawls Hall 1086", "host": "Purdue Executive Forum",
            "url": link["href"], "source": source})
except Exception as exc:
    failures.append(f"Executive Forum: {exc}")

try:
    source = "https://purdue.edu/science/events/science/2026/purdue-alumni-of-san-francisco-boilermaker-founders-forum.html"
    page = BeautifulSoup(requests.get(source, timeout=25).text, "html.parser")
    text = page.get_text(" ", strip=True)
    match = re.search(r"October 20, 2026 - (\d{1,2}:\d{2} [AP]M) Pacific Time", text)
    if match:
        start = datetime.strptime("October 20, 2026 " + match.group(1), "%B %d, %Y %I:%M %p").replace(tzinfo=ZoneInfo("America/Los_Angeles"))
        if start.astimezone(timezone.utc) > now:
            events.append({"id": "purdue-sf-founders-forum-2026-10-20",
                "title": "Boilermaker Founders Forum with Brian Feth",
                "starts_at": start.astimezone(timezone.utc).isoformat(),
                "venue": "Third Coast Foundry, San Francisco",
                "host": "Purdue Alumni Club of San Francisco",
                "url": source, "source": source})
except Exception as exc:
    failures.append(f"SF Founders Forum: {exc}")

events.sort(key=lambda item: item["starts_at"])
if not events:
    raise SystemExit("No upcoming events found; existing export preserved. " + "; ".join(failures))
OUT.write_text(json.dumps({"refreshed_at": now.isoformat(), "events": events, "errors": failures}, indent=2) + "\n")
db_path = ROOT / "data" / "founders.sqlite3"
if db_path.exists():
    with sqlite3.connect(db_path) as db:
        db.executescript("""
          CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, starts_at TEXT NOT NULL,
            venue TEXT NOT NULL, host TEXT NOT NULL, url TEXT NOT NULL,
            source TEXT NOT NULL, refreshed_at TEXT NOT NULL
          );
          DELETE FROM events;
        """)
        db.executemany("INSERT INTO events VALUES (?,?,?,?,?,?,?,?)", [
            (e["id"], e["title"], e["starts_at"], e["venue"], e["host"], e["url"], e["source"], now.isoformat())
            for e in events
        ])
        db.commit()
print(f"Refreshed {len(events)} upcoming events. Errors: {failures}")
