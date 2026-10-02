# Purdue Founder Map

An independent, open-source reading room of Purdue founders, investors and operators. It is not affiliated with or endorsed by Purdue University.

**Live:** https://purdue-founder-map.vercel.app

## What it is

One screen: a pixel-art room on a rainy night. Someone reads on the couch, a cat sleeps beside him, and a shelf of 26 volumes holds all 2,130 people, A to Z by surname (290 founders, 80 investors, 1,760 operators).

- **Read.** Click a spine and the book flies off the shelf and opens to an index and one page per person. A page gathers everything the database knows about that person: role and Purdue connection, milestones and capital events, the company (product, sector, founding year, funding rounds), career, education, location, and tags. Every claim carries a numbered source. Historical roles are labelled with the year of their source.
- **Search.** Search by name, company, field, place or tag. Searches for tags such as "yc", "vc", "exits", "bay area" or "new york" offer to **compile a book** of that set. Any search can also be **bound into a book**. Matching volumes get a red ribbon on the shelf.
- **Links.** `/?person=<id>`, `/#G` (a volume), `/?book=y-combinator` (a tag book), `/?find=robotics` (a search book). `/library` serves the same room.
- **Poke around.** The cat, the lamp (night mode), the window, a snow globe, an hourglass, a radio, the candle, a ball of yarn, the plant, the tea. Click the reader for a random page.
- **Connect Claude.** The small *connect claude* link gives the public MCP endpoint, `https://purdue-founder-map.vercel.app/mcp`. It has three read-only tools: `search_people`, `get_person` and `browse_volume`. Add it in Claude.ai or Desktop under Settings → Connectors → Add custom connector, or in Claude Code with `claude mcp add --transport http purdue-founders https://purdue-founder-map.vercel.app/mcp`.

The database holds 1,906 sourced education entries across 1,622 people, 395 dated affiliations, 89 startup profiles, funding for 46 companies, 62 capital and exit milestones, and 612 source-linked tags. Missing profiles stay empty rather than guessed.

Reduced motion freezes the room and skips book transitions. On phones the room scrolls sideways and the book shows one page at a time.

## Files

- `public/index.html`, `public/library.css`, `public/library.js` — the whole site.
- `public/assets/library/reading-room.png` — the 320×180 room. Generated with Higgsfield GPT Image 2 and snapped to a 64-colour grid by `scripts/pixelate_room.py`. Provenance is in `docs/design/reading-room/VERIFICATION-V3.md`.
- `public/assets/alumni/` — 117 sourced portraits, shown dithered.
- `public/alumni.json` — every record, the room's only data source. See [DATA-API.md](docs/DATA-API.md).
- `api/mcp.js` — the stateless MCP server, routed to `/mcp` by `vercel.json`. `vercel.json` also redirects the old site's pages to the room.

## Run locally

```bash
node scripts/serve.js        # http://127.0.0.1:4320, the room plus /mcp
node scripts/check_mcp.js    # MCP protocol and data checks
```

## Update the data

Alumni records live in `data/alumni.json` and the sourced `data/alumni-*.json` expansion and enrichment files. Rebuild the database and the public export:

```bash
python3 scripts/build_alumni.py
python3 scripts/build_data.py      # writes data/founders.sqlite3 and public/alumni.json
python3 scripts/check_alumni_db.py
```

`scripts/scrape_*.py` collect candidates from public Purdue alumni pages for review, and `scripts/refresh_portraits.py` refreshes sourced portraits. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Code and original writing: MIT. Names, trademarks, and linked content belong to their owners.
