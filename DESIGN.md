# Purdue Founder Map design

Audience: Purdue students, alumni, and research founders seeking one useful next action. Independent, open source, and source-backed.

## Route map

- `/`: short triage, six scannable roadmap rows, four current application paths, people bridge, expandable resource index, and upcoming events.
- `/guide.html`: deeper six-chapter editorial guide with sticky chapter navigation.
- `/people.html`: public professional contact directory, search, kind-of-help filters, and pagination.
- `/alumni.html`: sourced Purdue founder/investor/operator profiles; role and geography filters, expandable provenance.
- `/contribute.html`: issue-form paths for resources, public contacts, alumni, and corrections.

## Visual system

Newsreader for editorial headlines and explanations; DM Sans for actions and UI; DM Mono for precise labels. Warm paper, dark olive ink, restrained old gold. The conceptual workshop and corridor images are contained and labeled; sourced staff portraits appear only where useful. The homepage leads with one sentence and three entry doors. Depth lives in the guide and directories.

GSAP 3.14.2 and ScrollTrigger add small entrance motion to visible content. Content starts visible in HTML/CSS; reduced-motion and blocked scripts preserve it. The loader is a short monogram and progress line with a CSS exit. Native anchors, details, search, and buttons remain keyboard reachable.

21st.dev's MIT Kokonut UI library supplies interaction patterns: slide-text CTA, moving nav/filter pills, pointer spotlight, search affordance, roadmap focus, and loader pacing. Direct sources and license: `docs/design/ASSET-LEDGER.md`. The project adapts those primitives into one editorial system. Supplied references Optimizing Purdue CS and Grug informed navigation and reading rhythm; no code or media from those sites was copied.

## QA gates

- No page-level overflow at 320, 390, or desktop widths.
- Search, filters, pagination, links, native details, and chapter anchors work by keyboard and pointer.
- Every public person and alumni record has a source link and date. Location claims are qualified.
- Event and resource failure states are visible.
- Generated imagery is never presented as an actual campus building.
