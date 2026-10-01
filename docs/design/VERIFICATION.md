# Verification · October 2026 redesign

## Local release checks

- `python3 scripts/build_site.py`: all 19 static pages render from existing public exports.
- `node --check public/map.js` and `public/landing-motion.js`: pass.
- `python3 scripts/check_alumni_db.py`: SQLite and JSON agree on 2,130 alumni, 1,906 education entries, 395 affiliations, 89 startup profiles, and 612 tag rows.
- All generated local links and asset paths resolve.
- Camoufox/Firefox: 11 representative routes at 1440px, 390px, and 320px; no horizontal overflow, runtime exceptions, or failed local assets. Evidence: `redesign/layout-results.json`.
- Alumni search, investor filter, organization sorting, pagination, sourced profile details, Escape and focus return, global keyboard search, grant filters, opportunity eligibility, saved guide checklist, glossary empty state, date filtering, Google Calendar URL, downloaded ICS, mobile navigation, and reduced motion passed. Evidence: `redesign/interaction-results.json`.
- True JavaScript-disabled context preserves homepage content, source links, and 24 initial alumni records plus complete data download. Blocking only the core JS bundle also preserves the homepage. Screenshots saved.
- Home images fully loaded before final full-page capture; no broken images. Hero artwork WebP is approximately 223KB. Local font avoids external font requests.
- Independent visual review identified excessive interior heading space, small metadata, cramped mobile filters, hidden mobile events, overly wide guide gutter, and unsupported arrow glyphs. All six were repaired and the affected pages recaptured.

## Evidence

Current screenshots: `redesign/home-desktop.png`, `home-mobile.png`, `home-full-desktop.png`, `alumni-desktop.png`, `alumni-mobile.png`, `opportunities-desktop.png`, `events-mobile.png`, `guide-explore-desktop.png`, plus other route captures.

## Scope and limitations

The redesign preserves the existing datasets: 2,130 alumni, 41 campus contacts, 142 opportunities, and 177 resources. This release does not revalidate every third-party profile or program claim. Dates, roles, benefits, and eligibility remain tied to their linked evidence. Historical biographies are not represented as current employment. Calendar exports support Google, Apple, and Outlook; imports were checked structurally and by URL, not by signing into a personal calendar account.

Two MIT Kokonut UI controls were adapted from inspected canonical source. 21st CLI discovery returned HTTP 401; no React components were installed. Sources, licenses, and original asset masters are preserved in the asset ledger.

## Production verification

Published UI revision `b0fcab3` to https://purdue-founder-map.vercel.app through the existing GitHub → Vercel production integration. GitHub deployment `6795330285` reports success. The latest daily data refresh was rebased before publishing.

- All 19 public page routes plus seven required assets/data files return HTTP 200 and match the local bytes exactly (26 checks). Evidence: `redesign/production-results.json`.
- Live desktop and mobile browser passes: home, three primary destinations, 2,130-profile search, sourced funding dialog, Escape, mobile event agenda and calendar disclosure. No runtime errors or horizontal overflow.
- Hosted screenshots: `redesign/live-home-desktop.png`, `live-home-mobile.png`, `live-events-mobile.png`. Result record: `redesign/live-results.json`.
- Direct Vercel CLI authorization failed because the CLI session belongs to another account. The existing repository integration successfully deployed the intended project; no account or DNS configuration was changed.



## Asset-led refinement checks

Homepage copy reduced by more than half; detailed database and guide content retained. Original prototype illustration and first-party YC mark added; no new runtime dependencies. Independent review requested consistent portrait crops and wider mobile program labels; both fixed.

Camoufox checks at 1440, 390, and 320px: no overflow, broken images, or runtime errors. Program detail deep links, six roadmap links, reduced-motion behavior, real no-JavaScript context, and blocked core bundle preserve the intended content. Evidence and exact final screenshots: `asset-pass/checks.json`, `asset-pass/home-1440.png`, `asset-pass/home-390.png`, and `asset-pass/home-320.png`.

Asset-led release `17f9eeb` verified on the production alias: homepage, shared CSS, guide, and both new assets match local bytes. Live desktop/mobile render and the microgrant detail link pass. Screenshots: `asset-pass/live-desktop.png` and `asset-pass/live-mobile.png`.
