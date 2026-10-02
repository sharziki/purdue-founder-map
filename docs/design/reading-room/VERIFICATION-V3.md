# Pixel reading room · 2026-10-02

The owner asked for a full redesign: much more indie and pixelated, mellow, with a pixel version of him in glasses reading on the couch. This replaces the photographic basement archive (V2).

## What changed

- The room is one 320×180, 64-colour pixel image (`public/assets/library/reading-room.png`, 25 KB). Provenance, prompt and the reproducible pixelation step are in `assets/higgsfield-pixel-room.json` and `scripts/pixelate_room.py`.
- `public/library.js` draws it on a canvas at a scale snapped to whole device pixels, so every art pixel stays square. Beyond the art the room keeps going: mirrored walls, repeated ceiling and floorboards, dithered into the dark.
- The 26 volumes are drawn by code onto the image's empty shelves (rows at y 61, 93 and 125), in the room's pixel size. Spine width follows each volume's size; a 3×5 pixel font letters the spines.
- Things that move: rain on the window, out-of-step fairy lights, the cat breathing, z's, mug steam, a candle, a moth around the lamp, and the reader turning a page every few seconds. Clicking him opens a random entry.
- Things to poke (the `TOYS` table in `library.js`, each a labelled button): the cat escalates over repeated pokes (purr and hearts → one eye and "?" → both eyes and "!" → ignores you); the lamp toggles night mode, where only the window, fairy lights and his pages keep their light; the window flashes lightning and wakes the cat; a snow globe, hourglass and radio sit on the top shelf; the candle blows out with smoke and relights; the yarn rolls and the cat watches it; the monstera rustles; the mug steams harder. With reduced motion every toy jumps to its resting state and only the caption changes.
- Covers, title pages and index headers use a 5×7 pixel face; pages use the locally hosted Pixelify Sans and VT323. Sourced portraits are dithered into four sepia tones.
- Compiled books: search knows the alumni tags (Y Combinator, VC investors, Venture-backed, Funded startups, Founders, Investors, Tech, Bay Area, New York) plus derived Exits and IPOs and Accelerators, with aliases such as "yc", "vc", "ipo". A matching search offers "Compile the … book", and any search can "Bind all N into a book". The compiled volume flies out of the search box, has its own cover and index in surname order, and links as `?book=<slug>` or `?find=<query>` (with `&person=<id>`).
- Phones get a larger room they can swipe across, starting on the shelf. On landscape screens the title sits on the floor bottom-left so nothing covers the top shelf; short landscape screens collapse it to one line.
- Removed: the basement WebP backgrounds, cloth grain SVG and the WebGL dust shader.

## Checks

- `node --check public/library.js`; `scripts/pixelate_room.py` reproduces the shipped PNG pixel for pixel.
- Camoufox at 1440×900, 1280×720, 844×390, 390×844 and 320×640: no horizontal overflow, no console errors, volume A never under the header or search, shelf → index → entry → close works, focus returns to the spine. Reduced motion opens and closes the book immediately.
- Chromium screen recording of the full sequence (`v3/opening-frames.png`, `v3/turn-close-frames.png`): spine lifts, turns into the cover, the cover hinges open, pages turn, the book closes and slides back into its slot.
- Search ("gedmark") marks volume G with a ribbon, dims the rest, and Enter opens the sourced entry with its portrait.

Two browser notes found on the way: a 3D transform at exactly 90° is a degenerate matrix that Firefox paints flat, so the waiting cover sits at 89.5° and stays hidden until its turn; and `cloneNode` copies canvases without their pixels, so page clones repaint them.

Screenshots: `v3/room-1440.png`, `v3/book-1440.png`, `v3/person-1440.png`, `v3/room-844.png`, `v3/room-390.png`, `v3/book-390.png`, `v3/person-390.png`, `v3/room-320.png`, `v3/person-320.png`.
