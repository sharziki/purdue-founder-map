# Contributing to Purdue Founder Map

Thanks for helping keep the reading room accurate. You can [suggest an alumnus](https://github.com/sharziki/purdue-founder-map/issues/new?template=alumnus.yml) or [report a correction](https://github.com/sharziki/purdue-founder-map/issues/new?template=correction.yml). Pull requests work too.

## What belongs here

A Purdue-connected founder, investor, or operator with a public source for the connection and the role. Do not submit private contact information, member-only directories, or speculative descriptions. A listing is not an endorsement.

## Edit the data

Alumni profiles live in `data/alumni.json`, the sourced `data/alumni-*-expansion.json` and wave files, and `data/bay-area-connections.json`. Reuse the fields in nearby entries. Each record needs a public `source_url`, the name, the Purdue connection, the role and the organization. Add a `role_as_of` year when the source describes a past role, and never describe an archival role as current.

Funding, social links, location and flags live in `data/alumni-*-enrichment.json`, keyed by the published alumni ID. Every funding claim, profile link, location and flag needs its own source URL. Keep a person's stated location separate from company headquarters.

Rebuild and check:

```bash
python3 scripts/build_alumni.py
python3 scripts/build_data.py
python3 scripts/check_alumni_db.py
node scripts/check_mcp.js
```

Commit the source JSON, the rebuilt `data/founders.sqlite3`, and `public/alumni.json`.

## Review standard

We check source URLs, role dates, duplicates, and how each page reads in the room. A historical role must carry `role_as_of`. Corrections to outdated records are welcome even without a replacement.
