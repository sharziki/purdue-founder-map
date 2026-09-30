"""Publish stable, static JSON exports from the project's source-backed data."""

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def read(path):
    return json.loads((ROOT / path).read_text())


def write(name, value):
    (PUBLIC / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def require_unique(records, label):
    ids = [record["id"] for record in records]
    if len(ids) != len(set(ids)):
        raise ValueError(f"Duplicate {label} IDs")
    return set(ids)


def require_url(url, label):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError(f"Invalid URL in {label}: {url}")


def main():
    resources = read("public/data.json")["resources"]
    people = read("public/people.json")["people"]
    alumni = read("public/alumni.json")["alumni"]
    events = read("public/events.json")["events"]
    guide = read("data/founder-guide.json")
    reading = read("data/reading-links.json")["links"]

    resource_ids = require_unique(resources, "resource")
    for label, records in (("person", people), ("alumnus", alumni), ("event", events), ("reading", reading)):
        require_unique(records, label)

    stages = require_unique(guide["roadmap"], "roadmap stage")
    playbooks = require_unique(guide["playbooks"], "playbook")
    tools = require_unique(guide["tools"], "tool")
    require_unique(guide["glossary"], "glossary term")

    for item in guide["roadmap"] + guide["playbooks"]:
        for field, allowed in (("stage_ids", stages), ("playbook_ids", playbooks), ("tool_ids", tools), ("source_ids", set(guide["sources"]))):
            unknown = set(item.get(field, [])) - allowed
            if unknown:
                raise ValueError(f"Unknown {field} on {item['id']}: {sorted(unknown)}")
        unknown_resources = set(item.get("resource_ids", [])) - resource_ids
        if unknown_resources:
            raise ValueError(f"Unknown resource_ids on {item['id']}: {sorted(unknown_resources)}")
    for item in guide["glossary"]:
        unknown = set(item.get("source_ids", [])) - set(guide["sources"])
        if unknown:
            raise ValueError(f"Unknown glossary sources on {item['id']}: {sorted(unknown)}")
    for item in reading:
        require_url(item["url"], item["id"])
        if set(item["stage_ids"]) - stages or set(item["playbook_ids"]) - playbooks:
            raise ValueError(f"Unknown reading relationship on {item['id']}")

    for item in guide["roadmap"]:
        item["reading_link_ids"] = [link["id"] for link in reading if item["id"] in link["stage_ids"]]
    for item in guide["playbooks"]:
        item["reading_link_ids"] = [link["id"] for link in reading if item["id"] in link["playbook_ids"]]
    guide["reading_links"] = reading

    links = []
    for item in reading:
        links.append({**item, "record_type": "reading"})
    for item in resources:
        require_url(item["url"], item["id"])
        stage_ids = [stage["id"] for stage in guide["roadmap"] if item["id"] in stage.get("resource_ids", [])]
        links.append({
            "id": f"resource:{item['id']}",
            "record_type": "resource",
            "title": item["name"],
            "url": item["url"],
            "kind": item["category"],
            "stage": item.get("stage"),
            "stage_ids": stage_ids,
            "region": item.get("geography"),
            "source_url": item.get("source", item["url"]),
        })
    for item in events:
        require_url(item["url"], item["id"])
        links.append({
            "id": f"event:{item['id']}",
            "record_type": "event",
            "title": item["title"],
            "url": item["url"],
            "starts_at": item["starts_at"],
            "region": item.get("region"),
            "source_url": item.get("source", item["url"]),
        })

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    write("guide-data.json", guide)
    write("links.json", {"schema_version": "1.0", "generated_at": generated_at, "links": links})
    write("catalog.json", {
        "schema_version": "1.0",
        "generated_at": generated_at,
        "counts": {"resources": len(resources), "people": len(people), "alumni": len(alumni), "events": len(events), "reading_links": len(reading)},
        "resources": resources,
        "people": people,
        "alumni": alumni,
        "events": events,
        "guide": guide,
    })
    print(f"Published {len(resources)} resources, {len(people)} people, {len(alumni)} alumni, {len(events)} events, {len(reading)} reading links")


if __name__ == "__main__":
    main()
