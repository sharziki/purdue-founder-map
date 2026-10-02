# Purdue Founder Map design

The whole site is one screen: the reading room. Visitors want to find a Purdue person and read a trustworthy page about them. The room makes that feel calm and a little playful.

## Room

- A 320×180, 64-colour pixel image (`public/assets/library/reading-room.png`) at a scale snapped to whole device pixels. Past its edges, the walls mirror, the ceiling and floorboards repeat, and everything fades to night.
- Mellow lo-fi palette: indigo and plum shadows, amber lamplight. Nothing glows that wouldn't glow in the room.
- The 26 volumes, the toys and every animation are drawn in code on the same pixel grid. The overlay coordinates (`SHELF`, `SPOTS`, `TOYS` in `library.js`) are tied to this exact image, so re-measure them if the art changes.
- The title sits on the floor at bottom-left, search at top-right, and the tiny *unofficial · source · data · connect claude* line at bottom-right. Nothing may cover a spine or a toy; this is checked at 13 viewport sizes.

## Book

- Covers, spines and big letters are pixel art: a 3×5 face on spines, 5×7 on covers. Names and section titles use Pixelify Sans.
- Page text uses Instrument Sans: 17px lead, 15px lists, 14.5px facts. Every claim carries a numbered source, and a Sources list closes the page.
- Motion has jobs: a book is pulled from the shelf, turns to its cover, and hinges open. Pages turn, and the book goes back to its slot. Compiled books bind out of the search box. Reduced motion skips all of it.

## Quality gates

- No page scroll on desktop; phones scroll the room sideways only.
- Keyboard: search first, then spines, toys, the cat and the reader. Escape closes the book or the connect card, and focus returns to where the book came from.
- Every person page shows its sources. Historical roles are labelled.
