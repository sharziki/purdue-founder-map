#!/usr/bin/env python3
"""Collect public, dated founder events from first-party calendars."""
import json
import hashlib
import re
import sqlite3
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "events.json"
ICAL = ROOT / "public" / "founder-events.ics"
now = datetime.now(timezone.utc)
events = []
failures = []

def region_for(location, groups=None):
    text = (location + " " + " ".join(groups or [])).lower()
    if "indianapolis" in text or "launch pad" in text or "et 333" in text:
        return "Indianapolis"
    if "san francisco" in text:
        return "Beyond campus"
    if "virtual" in text or "online" in text:
        return "Online"
    return "West Lafayette"

def category_for(title):
    title = title.lower()
    if "pitch" in title or "competition" in title:
        return "Pitch"
    if "nightshift" in title or "founder's table" in title:
        return "Community"
    if "forum" in title or "realtalk" in title or "leadership" in title or "lecture" in title:
        return "Talk"
    if "workshop" in title:
        return "Workshop"
    return "Event"

# Purdue's public Localist API is first-party, dated, and includes event instances.
# Keep founder relevance narrow so the feed does not become the whole university calendar.
try:
    source = "https://events.purdue.edu/api/2/events"
    session = requests.Session()
    page = 1
    while True:
        payload = session.get(source, params={"days": 90, "pp": 100, "page": page}, timeout=30).json()
        for wrapped in payload.get("events", []):
            item = wrapped["event"]
            title = item.get("title", "").strip()
            if not re.search(r"founder|start.?up|entrepreneur|pitch|venture|realtalk|executive forum|coffee at convergence|principled leadership|innovation showcase|write winning grants", title, re.I):
                continue
            place = item.get("location_name") or item.get("location") or "See event page"
            groups = [group.get("name", "") for group in item.get("groups", [])]
            event_url = item.get("localist_url") or "https://events.purdue.edu/event/" + item.get("urlname", "")
            for wrapped_instance in item.get("event_instances", []):
                instance = wrapped_instance.get("event_instance", {})
                if not instance.get("start") or instance.get("all_day"):
                    continue
                start = datetime.fromisoformat(instance["start"]).astimezone(timezone.utc)
                if start < now:
                    continue
                end = datetime.fromisoformat(instance["end"]).astimezone(timezone.utc) if instance.get("end") else None
                events.append({"id": "purdue-" + str(instance.get("id", item["id"])),
                    "title": title, "starts_at": start.isoformat(),
                    "ends_at": end.isoformat() if end else None,
                    "venue": place, "host": groups[0] if groups else item.get("custom_fields", {}).get("unit", "Purdue University"),
                    "region": region_for(place, groups), "category": category_for(title),
                    "url": event_url, "source": source})
        if not payload.get("page", {}).get("next_page") or page >= 12:
            break
        page += 1
except Exception as exc:
    failures.append(f"Purdue calendar: {exc}")

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
            "ends_at": datetime.strptime(fields["DTEND"], "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc).isoformat() if re.fullmatch(r"\d{8}T\d{6}Z", fields.get("DTEND", "")) else None,
            "venue": fields.get("LOCATION", "See event page").replace(r"\,", ","),
            "host": "The Anvil", "url": fields.get("URL", "https://www.anvilstartups.com/events"),
            "region": "West Lafayette", "category": category_for(fields["SUMMARY"]),
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
        detail_url = urljoin(source, anchor["href"])
        end = None
        try:
            detail_html = requests.get(detail_url, timeout=15).text.replace(r'\"', '"')
            end_match = re.search(r'"endTime":"([^"]+)"', detail_html)
            if end_match:
                end = datetime.fromisoformat(end_match.group(1).replace("Z", "+00:00"))
        except Exception:
            pass
        events.append({"id": "buildpurdue-" + anchor["href"].split("/")[-1],
            "title": name, "starts_at": start.isoformat(),
            "ends_at": end.isoformat() if end else None,
            "venue": paragraphs[1].get_text(" ", strip=True) if len(paragraphs) > 1 else "See event page",
            "host": "buildpurdue", "region": "West Lafayette", "category": category_for(name),
            "url": detail_url, "source": source})
except Exception as exc:
    failures.append(f"buildpurdue: {exc}")

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
                "ends_at": (start + timedelta(hours=2)).astimezone(timezone.utc).isoformat(),
                "venue": "Third Coast Foundry, San Francisco",
                "host": "Purdue Alumni Club of San Francisco", "region": "Beyond campus", "category": "Talk",
                "url": source, "source": source})
except Exception as exc:
    failures.append(f"SF Founders Forum: {exc}")

deduped = {}
for event in events:
    key = (re.sub(r"\W+", "", event["title"].lower()), event["starts_at"][:16])
    deduped.setdefault(key, event)
events = sorted(deduped.values(), key=lambda item: item["starts_at"])
if not events:
    raise SystemExit("No upcoming events found; existing export preserved. " + "; ".join(failures))
OUT.write_text(json.dumps({"refreshed_at": now.isoformat(), "events": events, "errors": failures}, indent=2) + "\n")

def ics_escape(value):
    return str(value).replace("\\", "\\\\").replace("\n", "\\n").replace(",", "\\,").replace(";", "\\;")

def ics_fold(line):
    lines, current = [], ""
    for char in line:
        if len((current + char).encode("utf-8")) > 75:
            lines.append(current)
            current = " " + char
        else:
            current += char
    lines.append(current)
    return "\r\n".join(lines)

ics_lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Purdue Founder Map//Founder Events//EN",
             "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Purdue Founder Events"]
for event in events:
    start = datetime.fromisoformat(event["starts_at"]).astimezone(timezone.utc)
    end = datetime.fromisoformat(event["ends_at"]).astimezone(timezone.utc) if event.get("ends_at") else start + timedelta(hours=1)
    description = "Official event page: " + event["url"]
    if not event.get("ends_at"):
        description += "\nEnd time is a one-hour calendar hold; verify with organizer."
    uid = hashlib.sha1(event["id"].encode()).hexdigest() + "@purdue-founder-map.vercel.app"
    ics_lines += ["BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + now.strftime("%Y%m%dT%H%M%SZ"),
                  "DTSTART:" + start.strftime("%Y%m%dT%H%M%SZ"), "DTEND:" + end.strftime("%Y%m%dT%H%M%SZ"),
                  "SUMMARY:" + ics_escape(event["title"]), "LOCATION:" + ics_escape(event["venue"]),
                  "DESCRIPTION:" + ics_escape(description), "URL:" + event["url"], "END:VEVENT"]
ics_lines.append("END:VCALENDAR")
ICAL.write_bytes(("\r\n".join(ics_fold(line) for line in ics_lines) + "\r\n").encode("utf-8"))

db_path = ROOT / "data" / "founders.sqlite3"
if db_path.exists():
    with sqlite3.connect(db_path) as db:
        db.executescript("""
          DROP TABLE IF EXISTS events;
          CREATE TABLE events (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, starts_at TEXT NOT NULL,
            ends_at TEXT, venue TEXT NOT NULL, host TEXT NOT NULL,
            region TEXT NOT NULL, category TEXT NOT NULL, url TEXT NOT NULL,
            source TEXT NOT NULL, refreshed_at TEXT NOT NULL
          );
        """)
        db.executemany("INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?,?)", [
            (e["id"], e["title"], e["starts_at"], e.get("ends_at"), e["venue"], e["host"],
             e["region"], e["category"], e["url"], e["source"], now.isoformat())
            for e in events
        ])
        db.commit()
print(f"Refreshed {len(events)} upcoming events. Errors: {failures}")
