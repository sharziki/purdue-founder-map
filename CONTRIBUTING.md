# Contributing to Purdue Founder Map

Thanks for helping make the guide accurate and useful. You can [suggest a resource](https://github.com/sharziki/purdue-founder-map/issues/new?template=resource.yml), [nominate a public contact](https://github.com/sharziki/purdue-founder-map/issues/new?template=person.yml), or [report a correction](https://github.com/sharziki/purdue-founder-map/issues/new?template=correction.yml). A pull request works too.

## What belongs here

- A public program, club, funding source, event feed, person, or opportunity that helps Purdue founders take a concrete next step.
- A durable official URL, clear audience and eligibility, and an official source for factual claims.
- Public professional contacts whose role is verified on an organization page. Add a work email only if the organization publishes it.

Do not submit private contact information, member-only directories, unverifiable deadlines, or speculative program descriptions. We do not copy full articles or protected brand assets. A listing is not an endorsement.

## Edit the data

Reviewed resources live in `data/resources.json`; public contacts live in `data/people.json`. Reuse the fields and categories in nearby entries. Include a `source` URL for resources and an official `url` and `verified_at` date for people. Asset files belong in `public/assets/`; record first-party source and ownership in `docs/design/ASSET-LEDGER.md`.

Run:

```bash
python3 scripts/build_data.py
node --check public/app.js
node --check public/people.js
```

Commit the source JSON, rebuilt `data/founders.sqlite3`, and `public/data.json` / `public/people.json`. A daily workflow refreshes imported Navigator listings and upcoming events. Please don't hand-edit those generated imports unless correcting the source parser. For a new public team roster, `scripts/scrape_people.py` produces *candidates* for review; it does not publish people automatically.

## Review standard

We check source URLs, current roles and eligibility, duplicate records, useful next steps, and mobile readability. Corrections to outdated records are welcome even when you do not have a replacement listing.
