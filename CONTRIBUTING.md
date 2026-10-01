# Contributing to Purdue Founder Map

Thanks for helping make the guide accurate and useful. You can [suggest a resource](https://github.com/sharziki/purdue-founder-map/issues/new?template=resource.yml), [nominate a public contact](https://github.com/sharziki/purdue-founder-map/issues/new?template=person.yml), [suggest an alumnus](https://github.com/sharziki/purdue-founder-map/issues/new?template=alumnus.yml), or [report a correction](https://github.com/sharziki/purdue-founder-map/issues/new?template=correction.yml). A pull request works too.

## What belongs here

- A public program, club, funding source, event feed, person, or opportunity that helps Purdue founders take a concrete next step.
- A durable official URL, clear audience and eligibility, and an official source for factual claims.
- Public professional contacts whose role is verified on an organization page. Add a work email only if the organization publishes it.

Do not submit private contact information, member-only directories, unverifiable deadlines, or speculative program descriptions. We do not copy full articles or protected brand assets. A listing is not an endorsement.

## Edit the data

Reviewed resources live in `data/resources.json`; public contacts live in `data/people.json`. Alumni profiles live in `data/alumni.json`, the sourced `data/alumni-*-expansion.json` files, `data/alumni-polytechnic-archive.json`, and `data/bay-area-connections.json`. Indiana resource expansion lives in `data/indiana-expansion.json`. Reuse the fields and categories in nearby entries. Include a `source` URL for resources and an official `url` and `verified_at` date for people. For alumni, include a public `source_url`, name, Purdue connection, role, organization, and `role_as_of` year when the source describes a historical role. Do not describe an archival role as current. Asset files belong in `public/assets/`; record first-party source and ownership in `docs/design/ASSET-LEDGER.md`.

Application-oriented programs live in `data/opportunities-purdue.json`, `data/opportunities-indiana.json`, and `data/opportunities-national.json`. Add one record per distinct program or fund with an official `source_url` and `apply_url`. State eligibility precisely. Add `amount_text` or `deadline` only with its own `amount_source_url` or `deadline_source_url`. Use `application_cycle: "check_source"` when the current window is unclear.

Sourced alumni funding, personal profile links, and location/flags live in `data/alumni-{funding,social,location}-enrichment.json`, keyed by the published alumni ID. Every funding claim, social profile, location, and flag needs its own source URL. Separate a person's stated location from company headquarters; identify grants and crowdfunding separately from VC rounds.

Run:

```bash
python3 scripts/build_data.py
python3 scripts/build_alumni.py
python3 scripts/build_opportunities.py
python3 scripts/build_catalog.py
node --check public/app.js
node --check public/people.js
```

Commit the source JSON, rebuilt `data/founders.sqlite3`, and generated public JSON exports. A daily workflow refreshes imported Navigator listings, opportunity status, and upcoming events. Please don't hand-edit those generated imports unless correcting the source parser. For a new public team roster, `scripts/scrape_people.py` produces *candidates* for review; it does not publish people automatically.

## Review standard

We check source URLs, role dates and eligibility, duplicate records, useful next steps, and mobile readability. A historical role must carry `role_as_of`; do not present it as a current appointment. Corrections to outdated records are welcome even when you do not have a replacement listing.
