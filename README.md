# Purdue Founder Map

Independent, open-source directory and practical roadmap for Purdue founders. The site is not affiliated with or endorsed by Purdue University.

**Live site:** https://purdue-founder-map.vercel.app

## What is here

- Six-stage scan-friendly roadmap and a chaptered [field guide](https://purdue-founder-map.vercel.app/guide) from first builder meetup to launch, funding, and growth.
- [People directory](https://purdue-founder-map.vercel.app/people) with 41 source-backed public contacts, including program leads, capital, alumni, and Kostas Grigoriou.
- [Alumni directory](https://purdue-founder-map.vercel.app/alumni) backed by 2,130 deduplicated public profiles in this repository: 290 founders, 80 investors, and 1,760 operators. Its default featured ordering surfaces 70 Purdue-connected builders with specific, source-linked milestones; the selection is available in [JSON](https://purdue-founder-map.vercel.app/notable-alumni.json). Every entry links to a public source. Historical roles are labeled or dated; check the linked source for current employment before outreach.
- The database has 1,906 sourced education entries across 1,622 people, 395 dated company and investor affiliations across 118 people, and 89 structured startup profiles. Further enrichment includes company funding for 46 profiles, 62 capital and exit milestones, 63 company locations, 20 directly stated personal locations, 65 verified LinkedIn profiles, 4 X profiles, and 612 source-linked tag rows. Missing social profiles remain unlinked rather than being guessed.
- First-party club imagery for useful campus entry points, with direct organization links.
- 49 core reviewed resources, 28 new Indiana and Bay Area resources, plus 100 entries imported from [Purdue Innovates Navigator](https://purdueinnovates.org/navigator/). Each entry links to its source.
- A separate [opportunity directory](https://purdue-founder-map.vercel.app/opportunities) with 142 source-linked programs: 30 Purdue, 48 Indiana and Midwest, and 64 national or global. It records audience, eligibility, benefit, application page, cycle, and sourced amounts or deadlines where available.
- Search and filters by resource type; alumni filters by role, geography, and source-linked tag, with name or organization sorting. People directories show all matching profiles. Resource and opportunity lists expand on demand. Cmd/Ctrl+K searches the whole map.
- Upcoming events pulled daily from [The Anvil](https://www.anvilstartups.com/events), [buildpurdue](https://www.buildpurdue.org/events), [Purdue Executive Forum](https://new.business.purdue.edu/events/exec-forum/home.php), and the [San Francisco Boilermaker Founders Forum](https://purdue.edu/science/events/science/2026/purdue-alumni-of-san-francisco-boilermaker-founders-forum.html).
- One SQLite database at `data/founders.sqlite3` containing resources, public contacts, alumni, and a separate indexed `opportunities` table; static JSON exports in `public/` make the site cheap to host and easy to reuse.
- A reusable [data catalog](https://purdue-founder-map.vercel.app/catalog.json), [link-only feed](https://purdue-founder-map.vercel.app/links.json), and [structured founder guide](https://purdue-founder-map.vercel.app/guide-data.json) connect the roadmap to programs, tools, and curated Hacker News discussions.

No registration or tracking is required.

The interface uses locally hosted Instrument Sans, an original dithered Bell Tower illustration, three primary navigation destinations, and dedicated pages for every task. Two MIT-licensed [Kokonut UI components](https://21st.dev/@kokonutd/library/kokonut-ui)—Command Button and Slide Text Button—are adapted to native HTML/CSS. Source snapshots and licenses are in `public/vendor/kokonut-source/`. Optional GSAP motion is restricted to the home hero, with reduced-motion and no-JavaScript fallbacks.

`scripts/build_site.py` generates all 19 pages from the same public exports. Shared styles and controls live in `public/map.css` and `public/map.js`. Guide progress is stored only on the visitor’s device. Events support Google Calendar links and per-event `.ics` downloads.

## Run locally

```bash
python3 -m http.server 4173 -d public
```

Open `http://localhost:4173`.

## Data updates

Edit reviewed records in `data/resources.json`, public contacts in `data/people.json`, alumni in `data/alumni.json` and `data/alumni-*-expansion.json`, or the sourced Indiana and Bay Area expansion files, then run:

```bash
python3 -m pip install requests beautifulsoup4
python3 scripts/scrape_navigator.py
python3 scripts/scrape_polytechnic_alumni.py
python3 scripts/scrape_polytechnic_archive.py
python3 scripts/scrape_science_alumni.py
python3 scripts/scrape_ag_awards.py
python3 scripts/build_alumni.py
python3 scripts/build_data.py
python3 scripts/build_opportunities.py
python3 scripts/check_alumni_db.py
python3 scripts/refresh_events.py
python3 scripts/build_catalog.py
python3 scripts/build_site.py
```

`scrape_navigator.py` caches Purdue Innovates' public directory. `build_data.py` combines that index with the reviewed list, then rebuilds the resource table and public JSON. `refresh_events.py` updates upcoming events in both SQLite and public JSON. A daily GitHub Action refreshes the directory and events. If all event sources fail, the script preserves the last good export and exits with an error.

Opportunity source records live in `data/opportunities-{purdue,indiana,national}.json`. `build_opportunities.py` validates and publishes the separate SQLite table and `/opportunities.json`; `build_catalog.py` adds them to the combined exports. A date appears only when supported by the linked organizer page. The derived status is recalculated on each build; check the program page for current terms.

Alumni coverage combines curated profiles with public Purdue Engineering, Business, Polytechnic, Science, Statistics, Agriculture, and Pharmacy sources. The university's private alumni roster is not included. Purdue-connected former students can appear when the connection is documented; attendance is not treated as a degree. Many award and archive biographies describe past roles; `role_as_of` records the source year when known, while undated profile rows carry an explicit verification note. The source URL is the evidence; `verified_at` means the page loaded on that date, not that its job title is current. Optional sourced enrichment lives in `data/alumni-*-enrichment.json`. The normalized education, affiliation, and startup facts are queryable in `data/founders.sqlite3` and exported in `/alumni.json`. Funding belongs to the named company and is not a claim about a person's net worth; company location is separate from personal location. Highlights are an editorial starting point backed by public milestones, not a ranking.

The static endpoints and link relationships are documented in [DATA-API.md](docs/DATA-API.md). Edit `data/founder-guide.json` for roadmap, playbook, tool, and glossary records; edit `data/reading-links.json` for curated reading. Rebuild the catalog and then the static site after either change.

Resource entries use a durable program page rather than a deadline or an `apply` form when applications open and close by cohort. Check each linked page for current eligibility and dates. Event times display in Purdue's Eastern time zone.

## Contribute

Use the [contribution page](https://purdue-founder-map.vercel.app/contribute) to suggest a resource, nominate a public contact or alumnus, or report a correction. Pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) for the data format and verification steps.

## License

Code and original writing: MIT. Names, trademarks, and linked content belong to their owners.
