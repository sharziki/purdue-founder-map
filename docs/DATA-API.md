# Data

Both endpoints are public and need no account or key. This is a curated, source-backed directory, not a live API. Check each record's `source_url` before contacting anyone.

| Endpoint | Contents |
| --- | --- |
| [`/alumni.json`](https://purdue-founder-map.vercel.app/alumni.json) | Every record in the reading room: name, Purdue connection, role, organization, kind, region, `why_relevant`, `source_url`, `verified_at`, and, where sourced, `role_as_of`, education, affiliations, startup profile, funding, capital events, highlights, company and personal location, tags, LinkedIn/X, and portrait. |
| `POST /mcp` | Stateless MCP (Streamable HTTP): `search_people`, `get_person`, `browse_volume`. |

`/data.json`, `/people.json` and `/notable-alumni.json` are still written by `scripts/build_data.py` as raw files, but the site no longer uses them.

Roles can be historical: `role_as_of` gives the source year, and `flag_notes` says when a role is unverified as current. Funding belongs to the named company, not the person. Company location and personal location are separate fields.
