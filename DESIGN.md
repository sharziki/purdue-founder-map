# Purdue Founder Map design

Audience: Purdue students, alumni, and research founders who need one useful next action. This is an independent, open source, source backed guide.

## Routes

- `/`: orientation, six step roadmap, application examples, people, searchable resource index, and upcoming events.
- `/guide.html`: six chapter field guide with chapter navigation and concrete next moves.
- `/people.html`: public professional contact directory with search and filters.
- `/alumni.html`: sourced founders, investors, and operators with geography and role filters.
- `/contribute.html`: issue forms for additions and corrections.

## Visual system

The September 2026 revision takes its cues from [Founders, Inc.](https://f.inc/): a white canvas, direct navigation, an unambiguous headline, real people imagery, restrained controls, and content that becomes more detailed as the reader moves down the page. It uses an original Purdue guide layout and its own content and assets. No Founders, Inc. source, imagery, or brand assets are copied.

Libre Baskerville is reserved for major headings. DM Sans carries navigation, body text, controls, and directory rows. Ink and white dominate; Purdue gold marks provenance and the current step. The homepage portraits and alumni features use sourced public images. Decorative conceptual graphics have been removed from the active layout. A shared `/professional.css` keeps all routes consistent.

The first screen gives one guide action and a direct directory path. The six step roadmap and application examples remain brief. Search and filters expose depth only when needed. The final invitation is a compact actionable panel.

GSAP 3.14.2 and ScrollTrigger add light entrance motion. Essential content is visible without scripts. Reduced motion disables the transitions. The opening mark appears only on the first page of a session; subsequent navigation is immediate. Native links, details, search, and buttons remain keyboard reachable.

## Quality gates

- No page overflow at 320, 390, or 1280 pixels.
- Search, filters, pagination, links, chapter anchors, and native details work by keyboard and pointer.
- Every public person and alumni record has source information; professional location is qualified where necessary.
- Event and resource failure states remain visible.
- Organization marks and portraits identify their subjects and do not imply endorsement.
