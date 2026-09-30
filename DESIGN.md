# Purdue Founder Map design

Audience: Purdue students, alumni, and research founders who need a concrete next action. The first useful action is reading one guide chapter, finding one person, or attending one open event.

## Structure

- `/`: fast triage, clickable six-stop route, official organization imagery, searchable resource index, and live events.
- `/guide.html`: editorial field guide with a sticky chapter rail, six short stages, evidence examples, and linked applications.
- `/people.html`: public professional contacts grouped by need, searchable by name, role, organization, and specialty.

The guide prose is in HTML for indexing and works without JavaScript. Search, filters, saved resources, and active chapter highlighting progressively enhance it. Mobile keeps site navigation and chapter navigation horizontally scrollable.

## Visual system

Purdue black and old gold anchor the identity. Warm paper, dark ink, red and sage evidence panels make long reading comfortable. Condensed display type is used for navigation and milestones; Newsreader serif is used for explanatory prose. Original conceptual images remain labeled as such. Organization logos and staff photos come from first-party pages with source links.

[Mobbin](https://mobbin.com/) was reviewed for its public catalog of sidebar, browsing, and onboarding patterns; individual screen flows require an account, so no Mobbin screen or asset was used. The roadmap uses a process-timeline interaction after reviewing [21st.dev's timeline patterns](https://21st.dev/community/components/explore/timeline-component). The sticky chapter rail and active item follow the behavior described in [21st.dev's documentation layout guide](https://21st.dev/blog/docs-site-components). These patterns are implemented with native HTML, CSS, and a small amount of JavaScript; no marketplace code or assets were copied. The directory still uses the previously sourced MIT Kokonut search interaction. [Optimizing Purdue CS](https://opcs.cart.moe/) supplied the editorial navigation reference; [The Grug Brained Data Merchant](https://data-industry-index.vercel.app/grug/02-grug-work-scribe-watch) supplied the chapter illustration reference. Neither site's code or media was copied.

## Quality gates

- 320px, 390px, and desktop layouts must have no horizontal page overflow.
- Every visible route, filter, stage stop, and chapter anchor must work with keyboard and pointer.
- People and organizations must link to official sources; no private directory data.
- Search and event failure states must remain visible.
- Generated imagery must never imply it depicts an actual Purdue building.
