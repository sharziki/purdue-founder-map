# Reading room recovery — 2026-10-02

Recovered the interrupted agent’s uncommitted `worktree-library-room` work. Kept its original canvas room, 26 books, sleepy cat, book choreography, search, and small Claude connection panel.

## Repairs

- Honor reduced motion for the entire canvas scene and book transitions; stop the animation loop when the page is hidden.
- Make the room behind the reader inert, contain keyboard focus, and return focus when a book closes. Animated page clones are inert and hidden from assistive technology.
- Move focus onto a mobile entry after turning from the index. Recompute book dimensions after opening across viewport changes.
- Lower the bookshelf on short landscape screens so the heading cannot block volume A.
- Preserve a directory fallback if the library bundle or data cannot load.
- Host Pixelify Sans and VT323 locally with their SIL OFL licenses. Sources: Google Fonts `ofl/pixelifysans` and `ofl/vt323` in https://github.com/google/fonts .
- Validate MCP messages, arguments, protocol headers, origins, content types, accepted response types, and payload size. Return proper JSON-RPC errors and notification acknowledgments. All tools are public and read-only.
- Add a localhost-only development server and repeatable endpoint checks.

## Checks

`node --check public/library.js`, `node --check api/mcp.js`, `node scripts/check_mcp.js`, and `python3 scripts/build_site.py` pass.

The official MCP Inspector connects over Streamable HTTP, lists all three tools, and executes `search_people` successfully. The native endpoint check verifies sourced person details, all 2,130 records across the 26 volumes, pagination bounds, invalid input, notifications, origin rejection, unsupported protocol versions, large bodies, and GET 405.

Camoufox desktop/mobile evidence is stored alongside this file, with final results in `browser-checks.json`. Target viewports: 1440×900, 390×844, 320×640, and 844×390. Verify volume opening, index selection, search deep links, closing, focus, reduced motion, cat interaction, and the connector panel.

MCP transport reference: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports

The illustration is original procedural pixel art from `public/library.js`. Existing photos, public data, and sources remain the same as the map. No personal Claude account was connected during testing; protocol interoperability was tested with MCP Inspector.
