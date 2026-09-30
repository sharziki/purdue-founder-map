# Purdue Founder Map

Independent, open-source directory and practical roadmap for Purdue founders. The site is not affiliated with or endorsed by Purdue University.

**Live site:** https://purdue-founder-map.vercel.app

## What is here

- Six-stage scan-friendly roadmap and a chaptered [field guide](https://purdue-founder-map.vercel.app/guide) from first builder meetup to launch, funding, and growth.
- [People directory](https://purdue-founder-map.vercel.app/people) with 41 source-backed public contacts, including program leads, capital, alumni, and Kostas Grigoriou.
- [Alumni directory](https://purdue-founder-map.vercel.app/alumni) with 1,045 deduplicated public profiles: 156 founders, 44 investors, and 845 operators. Every entry links to a public source. Historical roles are labeled or dated; check the linked source for current employment before outreach.
- First-party club imagery for useful campus entry points, with direct organization links.
- 49 core reviewed resources, 28 new Indiana and Bay Area resources, plus 100 entries imported from [Purdue Innovates Navigator](https://purdueinnovates.org/navigator/). Each entry links to its source.
- Search and filters by resource type; alumni filters by role and geography. The homepage shows eight results at first and expands on demand.
- Upcoming events pulled daily from [The Anvil](https://www.anvilstartups.com/events), [buildpurdue](https://www.buildpurdue.org/events), [Purdue Executive Forum](https://new.business.purdue.edu/events/exec-forum/home.php), and the [San Francisco Boilermaker Founders Forum](https://purdue.edu/science/events/science/2026/purdue-alumni-of-san-francisco-boilermaker-founders-forum.html).
- One SQLite database at `data/founders.sqlite3` containing resources, public contacts, and alumni; static JSON exports in `public/` make the site cheap to host and easy to reuse.
- A reusable [data catalog](https://purdue-founder-map.vercel.app/catalog.json), [link-only feed](https://purdue-founder-map.vercel.app/links.json), and [structured founder guide](https://purdue-founder-map.vercel.app/guide-data.json) connect the roadmap to programs, tools, and curated Hacker News discussions.

No registration or tracking is required.

The visual design uses three original generated, conceptual images. The homepage now uses an editorial paper-and-ink system with optional GSAP motion. The CTA, search, loader, filter, and spotlight interactions adapt MIT-licensed components from the [21st.dev Kokonut UI library](https://21st.dev/@kokonutd/library/kokonut-ui); provenance and source masters are in [`docs/design/ASSET-LEDGER.md`](docs/design/ASSET-LEDGER.md).

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
python3 scripts/refresh_events.py
python3 scripts/build_catalog.py
```

`scrape_navigator.py` caches Purdue Innovates' public directory. `build_data.py` combines that index with the reviewed list, then rebuilds the resource table and public JSON. `refresh_events.py` updates upcoming events in both SQLite and public JSON. A daily GitHub Action refreshes the directory and events. If all event sources fail, the script preserves the last good export and exits with an error.

Alumni coverage combines curated profiles with public Purdue Engineering, Business, Polytechnic, Science, Statistics, and Agriculture sources. The university's private alumni roster is not included. Many award and archive biographies describe past roles; `role_as_of` records the source year when known, while undated profile rows carry an explicit verification note. The source URL is the evidence; `verified_at` means the page loaded on that date, not that its job title is current.

The static endpoints and link relationships are documented in [DATA-API.md](docs/DATA-API.md). Edit `data/founder-guide.json` for roadmap, playbook, tool, and glossary records; edit `data/reading-links.json` for curated reading. Rebuild the catalog after either change.

Resource entries use a durable program page rather than a deadline or an `apply` form when applications open and close by cohort. Check each linked page for current eligibility and dates. Event times display in Purdue's Eastern time zone.

## Contribute

Use the [contribution page](https://purdue-founder-map.vercel.app/contribute) to suggest a resource, nominate a public contact or alumnus, or report a correction. Pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) for the data format and verification steps.

## License

Code and original writing: MIT. Names, trademarks, and linked content belong to their owners.
