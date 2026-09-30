# Verification · 2026-09-30 redesign

Local static preview: `python3 -m http.server 4173 -d public`.

- Data build: `scripts/build_alumni.py` and `scripts/build_data.py` passed. SQLite and public JSON contain 177 unique resources, 41 unique alumni profiles, and 41 public contacts. `scripts/refresh_events.py` produced 14 future events, including the October 20 San Francisco founders forum from its official Purdue page.
- Syntax: `node --check` passed for home, alumni, people, and motion scripts. `python3 -m py_compile` passed for build and event scripts. All local HTML `href` and `src` targets resolve.
- Browser: Camoufox/Firefox at 1280, 390, and 320 pixels. Home, guide, people, alumni, and contribute pages had no horizontal overflow; loaders cleared. The resource index filters and searches; people pagination advances 12→24; alumni region filter and native detail expansion work. All six guide chapters have a visible next move and expandable details.
- Resilience: Home and guide remain readable with JavaScript disabled. Blocking GSAP files leaves the home content and resource index visible. Reduced-motion mode hides the opening transition and disables GSAP.
- Screenshots: `screenshots/home-desktop.png`, `home-mobile.png`, `guide-desktop.png`, `guide-chapter.png`, `alumni-mobile.png`, and `alumni-featured-mobile.png`.

The first-session opening exits under one second; later route visits skip it. Five alumni directory portraits and four featured cards use first-party Purdue images.

The alumni dataset contains sourced public professional information, not a comprehensive Purdue alumni registry. Some Bay Area entries describe a company work location or an older Purdue-reported location; the expanded profile notes this explicitly. Event and application details should be checked at the linked source before travel or applying.
