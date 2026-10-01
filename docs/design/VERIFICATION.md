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

Production verification is recorded below after deployment.
