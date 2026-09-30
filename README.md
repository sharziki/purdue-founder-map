# Purdue Founder Map

Independent, open-source directory and practical roadmap for Purdue founders. The site is not affiliated with or endorsed by Purdue University.

**Live site:** added after deployment.

## What is here

- Six-stage founder roadmap, from first builder meetup to launch, funding, and growth.
- 48 reviewed campus, alumni, Indiana, and national resources, each with an original source.
- Search and filters by stage, type, and region; a browser-local saved list.
- Upcoming events pulled daily from [The Anvil](https://www.anvilstartups.com/events), [buildpurdue](https://www.buildpurdue.org/events), and [Purdue Executive Forum](https://new.business.purdue.edu/events/exec-forum/home.php).
- One SQLite database at `data/founders.sqlite3`; static JSON exports in `public/` make the site cheap to host and easy to reuse.

No registration or tracking is required. Saved links stay in your browser.

## Run locally

```bash
python3 -m http.server 4173 -d public
```

Open `http://localhost:4173`.

## Data updates

Edit reviewed records in `data/resources.json`, then run:

```bash
python3 scripts/build_data.py
python3 -m pip install requests beautifulsoup4
python3 scripts/refresh_events.py
```

`build_data.py` rebuilds the resource table and public JSON. `refresh_events.py` updates upcoming events in both SQLite and public JSON. A daily GitHub Action refreshes events. If all event sources fail, the script preserves the last good export and exits with an error.

Resource entries use a durable program page rather than a deadline or an `apply` form when applications open and close by cohort. Check each linked page for current eligibility and dates. Event times display in Purdue's Eastern time zone.

## Contribute

Open an issue or pull request with the resource name, official URL, who it serves, and a source that confirms the description. For events, send the organizer's calendar or event page. We do not list private contacts, scrape gated member directories, or invent application dates.

## License

Code and original writing: MIT. Names, trademarks, and linked content belong to their owners.
