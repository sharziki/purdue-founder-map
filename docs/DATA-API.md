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
| [`/notable-alumni.json`](https://purdue-founder-map.vercel.app/notable-alumni.json) | Editorial selection of alumni with individually sourced milestones; full profile records and selection note |
| [`/events.json`](https://purdue-founder-map.vercel.app/events.json) | Upcoming founder-relevant events from public event feeds |
| [`/founder-events.ics`](https://purdue-founder-map.vercel.app/founder-events.ics) | Importable iCalendar event snapshot |

## Link relationships

Every guide stage and playbook has a stable `id`. Reading links use `stage_ids` and `playbook_ids` to say where they belong. The generated guide also adds `reading_link_ids` to each stage and playbook, so consumers can look up links in either direction. Stages have curated `resource_ids` for relevant Purdue programs and external applications; resource entries in `/links.json` expose the reverse `stage_ids` relationship.

`source_ids` point to the guide's `sources` registry. Resource, person, alumni, and event records each include a public source or official page. Reading links have `kind` values such as `discussion`, `guide`, `course`, or `tool`. A Hacker News discussion is a set of personal experiences; it is not an endorsement or verified instruction.

Alumni records include `name`, `connection` to Purdue, sourced `role` and `organization`, `region` when known, `kind`, a short `why_relevant` note, and `source_url`. `role_as_of`, when present, records the year of the source's role claim. `verified_at` is the date the public source was checked; it does not imply the person still holds an older role. The directory includes founders, investors, and other publicly documented working alumni. It is not Purdue's private alumni roster or a list of people available for introductions.

Some alumni also have `funding` claims (`type`, `amount`, `round`, `date`, `source_url`) tied to the `company` field; `company_location` is the company's stated base. Personal `location_city`, `location_region`, and `location_country` are separate and require `location_source_url`. Verified public `linkedin` and `x` profile URLs include their own source URL. `flags` are sourced through the `flag_sources` map. Missing fields mean the public evidence did not support that claim; they are not empty values to fill by guessing. The optional fields are mirrored in SQLite's `alumni.enrichment_json` column.

Deeper profiles may include `company_website`, `company_product`, `company_sector`, and `company_founded_year`, each with a matching `_source_url`; `capital_events` and `highlights` are arrays of dated, source-linked facts. `notable_lanes` groups documented startup founders, venture investors, industry builders, and campus builders. The Highlights filter and `/notable-alumni.json` are editorial discovery aids, not an objective ranking or an offer of contact. The optional `highlight_order` only controls which stories appear first; it is not a score. Historical transactions and positions retain their source dates.

Structured research adds `education[]` (`institution`, optional `degree`, `field`, `graduation_year`, `completion_status`, `source_url`), `affiliations[]` (`organization`, `role`, `relationship`, source-year `as_of`, `status`, `source_url`), and `startup_profile` (`company_name`, optional website, founding year, product, sector, stage, or exit, with a URL for each claim in `field_sources`). `graduation_year` requires an explicit degree or class-year statement; an article or award year does not count. `completion_status: "attended_no_degree"` records verified Purdue attendance without a completed degree. `current_as_of_source` describes what a dated source said, not a live employment check.

The same facts are queryable in `data/founders.sqlite3` through `alumni_education`, `alumni_affiliations`, and `alumni_startups`. Example:

```sql
SELECT a.name, e.degree, e.field, e.graduation_year, s.company_name, s.sector
FROM alumni AS a
JOIN alumni_education AS e ON e.alumni_id = a.id
LEFT JOIN alumni_startups AS s ON s.alumni_id = a.id
WHERE e.graduation_year = '2019';
```

Run `python3 scripts/check_alumni_db.py` after a build to confirm the SQLite rows match the JSON export and contain no orphan facts.

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
