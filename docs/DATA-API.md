# Static data exports

All endpoints are public JSON files at `https://purdue-founder-map.vercel.app`. They require no account or API key. They can be downloaded, filtered, or imported into another site. This is a curated directory, not a live API: check the original source before applying, contacting someone, or attending an event.

| Path | Contents |
| --- | --- |
| [`/catalog.json`](https://purdue-founder-map.vercel.app/catalog.json) | Combined resources, people, alumni, events, roadmap, playbooks, tools, glossary, and reading links |
| [`/links.json`](https://purdue-founder-map.vercel.app/links.json) | Lightweight link feed: curated reading, resource pages, and upcoming event pages |
| [`/guide-data.json`](https://purdue-founder-map.vercel.app/guide-data.json) | Founder stages, actionable playbooks, templates, tools, glossary, and reading links |
| [`/data.json`](https://purdue-founder-map.vercel.app/data.json) | Searchable program, funding, club, and service resources |
| [`/people.json`](https://purdue-founder-map.vercel.app/people.json) | Public Purdue ecosystem contacts |
| [`/alumni.json`](https://purdue-founder-map.vercel.app/alumni.json) | Public Purdue-connected founder, investor, and operator profiles |
| [`/events.json`](https://purdue-founder-map.vercel.app/events.json) | Upcoming founder-relevant events from public event feeds |
| [`/founder-events.ics`](https://purdue-founder-map.vercel.app/founder-events.ics) | Importable iCalendar event snapshot |

## Link relationships

Every guide stage and playbook has a stable `id`. Reading links use `stage_ids` and `playbook_ids` to say where they belong. The generated guide also adds `reading_link_ids` to each stage and playbook, so consumers can look up links in either direction. Stages have curated `resource_ids` for relevant Purdue programs and external applications; resource entries in `/links.json` expose the reverse `stage_ids` relationship.

`source_ids` point to the guide's `sources` registry. Resource, person, alumni, and event records each include a public source or official page. Reading links have `kind` values such as `discussion`, `guide`, `course`, or `tool`. A Hacker News discussion is a set of personal experiences; it is not an endorsement or verified instruction.

Alumni records include `name`, `connection` to Purdue, sourced `role` and `organization`, `region` when known, `kind`, a short `why_relevant` note, and `source_url`. `role_as_of`, when present, records the year of the source's role claim. `verified_at` is the date the public source was checked; it does not imply the person still holds an older role. The directory includes founders, investors, and other publicly documented working alumni. It is not Purdue's private alumni roster or a list of people available for introductions.

```js
const { roadmap, reading_links } = await fetch('/guide-data.json').then(r => r.json());
const current = roadmap.find(stage => stage.id === 'launch');
const recommended = reading_links.filter(link => current.reading_link_ids.includes(link.id));
```

`/links.json` adds `record_type` to each link: `reading`, `resource`, or `event`. It includes original event dates and resource categories, making it suitable for a simple link directory. `/catalog.json` is the full export when a consumer needs all record fields.

## Update and reuse

Curated guide content lives in `data/founder-guide.json`, and external reading in `data/reading-links.json`. The build command checks IDs and relationships, then writes the three aggregate exports:

```bash
python3 scripts/build_catalog.py
```

The daily refresh also rebuilds these exports. Event times are ISO 8601 UTC in JSON. The `.ics` file is a snapshot; import it again after a refresh if you need new events. Each record's official link is the source for current time, venue, and eligibility.
