# Active visual narrative · October 2026

**Thesis:** starting a company at Purdue begins with one useful step and one real conversation.

The homepage establishes place with an original dithered Bell Tower. Large sans-serif typography gives the idea room; ink, ivory, and a little gold connect every page. There is no blocking splash screen. The tower and headline settle with a brief GSAP entrance, and static content stays available if motion fails.

Reading order: first action → six stages → three sourced opportunities → four real alumni → open-source contribution and exports. The guide, people, and opportunities are the three primary destinations. Events, resources, dictionary, and contribution live in one secondary menu.

Interior pages begin with compact literal headings. Search and filters sit immediately above ruled records. Profile facts, funding, education, affiliations, and evidence appear in native dialogs. Two-column mobile filters preserve readable labels. The mobile event calendar opens on demand so the next event appears immediately. Individual guide chapters include persistent local checklists, useful links, and a clear next stage.

## Motion ownership

- GSAP: home image/headline/CTA transform and opacity, 0.6–1.1 seconds; context reverted on pagehide and preference changes.
- CSS: small control hover transitions, menu, actual-navigation progress line.
- Native browser: scrolling, details, dialogs, focus containment, Escape, and history.
- No Lenis, scroll traps, pinned scenes, canvas loops, or content hidden pending animation.

## Design review

An independent critic requested compact database headings, readable metadata, a mobile date disclosure, closer guide columns, and SVG arrow icons. All were implemented. Reference rationale and product truth: `REDESIGN-2026.md`. License and asset details: `ASSET-LEDGER.md`.
