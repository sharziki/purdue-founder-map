# Asset and component ledger

| Section | Asset | Role | Source master | Web derivative | Alt/label |
|---|---|---|---|---|---|
| Hero | Night workshop | Beginning of the build | `assets/source/foundry-night.png` | `public/assets/foundry-night.webp` | Conceptual illustration of an empty university engineering workshop at night |
| Roadmap | Dawn corridor | Choosing a path | `assets/source/founder-path.png` | `public/assets/founder-path.webp` | Conceptual illustration of an empty innovation corridor at dawn |
| Events | Empty auditorium | Showing up | `assets/source/founder-stage.png` | `public/assets/founder-stage.webp` | Conceptual illustration of a founder talk venue before the event |

All three images were generated for this project with the built-in image tool on 2026-09-30. Each prompt requested photorealistic conceptual university spaces, no people, no logos, no text, and no SpaceX vehicles or trademarks. The prompts respectively specified: (1) a night workshop with prototype at right; (2) a dawn innovation corridor with doors and horizon; (3) an auditorium before a founder talk. Masters are 1672 × 941 PNG; WebP derivatives are 113–156 KB. CSS overlays keep type legible. No source image is claimed as documentary proof of a Purdue location.

Exact prompts: [`IMAGE-PROMPTS.md`](IMAGE-PROMPTS.md).

**Component:** The hero and chapter CTA hover transition adapts Kokonut UI's `SlideTextButton`, published in the [21st.dev Kokonut library](https://21st.dev/@kokonutd/library/kokonut-ui). Exact source inspected at [`kokonut-labs/kokonutui` commit `83eec6d`](https://github.com/kokonut-labs/kokonutui/blob/83eec6d/components/kokonutui/slide-text-button.tsx), MIT license. The interaction was ported to native HTML/CSS to fit this dependency-free site; text stays semantic and focusable, with reduced-motion support. 21st CLI component search returned HTTP 401, so the canonical open-source source was used for inspection. No marketplace media or code was scraped.

**Component:** The directory search control adapts the keyboard-first search and action affordances of Kokonut UI's MIT [`ActionSearchBar`](https://github.com/kokonut-labs/kokonutui/blob/83eec6d/components/kokonutui/action-search-bar.tsx), also in the [21st.dev Kokonut library](https://21st.dev/@kokonutd/library/kokonut-ui). It uses the existing live resource filter, `/` or Cmd/Ctrl+K to focus, Escape to clear, and a visible clear action. The port keeps native search semantics and avoids the source's React, Motion, and icon dependencies.

## Public organization imagery and staff photos (2026-09-30)

Organization marks in `public/assets/orgs/` were downloaded from first-party `buildpurdue.org/kickoff` image paths for buildpurdue, Anvil, HIVE, Purdue Innovates, Elevate Ventures, and ML@Purdue. Each card links to the corresponding organization. These marks remain the organizations' trademarks; they are included to identify the linked organizations, not to imply endorsement. Source paths: `/brand/v2/color/logo-horizontal-yellow-white-text-transparent-buildpurdue.svg`, `/kickoff/anvil.png`, `/kickoff/hive.png`, `/kickoff/purdue-innovates.png`, `/kickoff/elevate-ventures.png`, `/kickoff/ml-purdue.jpeg` at `https://www.buildpurdue.org`.

Staff images in `public/assets/people/` were sourced from publicly accessible official profile pages. Kostas Grigoriou's photo is from [Daniels School faculty](https://business.purdue.edu/faculty/home.php?username=kgrigori). Brooke Beier, Justin Renfrow, Doug Applegate, Abhijit Karve, Moe Simmons, and Max Frischman are from [Purdue Innovates' team page](https://purdueinnovates.org/our-team/). Danielle Salters and Makenzie Norris are from [Purdue Innovates Ventures](https://ventures.prf.org/). Images were resized to 480px WebP for site delivery. People without a verifiable source image use initials. Roles and official profile URLs live in `data/people.json` and are exported into the project's SQLite database and `public/people.json`.

**Additional Kokonut UI component ports:** The site loader adapts the conic ring structure of [Loader](https://github.com/kokonut-labs/kokonutui/blob/83eec6d/components/kokonutui/loader.tsx). People category filtering adapts the moving indicator and button geometry of [Smooth Tab](https://github.com/kokonut-labs/kokonutui/blob/83eec6d/components/kokonutui/smooth-tab.tsx). The founder entry cards adapt the pointer-position glow of [Spotlight Cards](https://github.com/kokonut-labs/kokonutui/blob/83eec6d/components/kokonutui/spotlight-cards.tsx). All are native CSS/JS ports of MIT-licensed 21st.dev Kokonut UI components. The complete license notice is in [`KOKONUT-MIT.txt`](KOKONUT-MIT.txt). Motion is disabled or reduced for users who request reduced motion.

Purdue Hackers mark in `public/assets/orgs/purdue-hackers.svg` comes from the official [Purdue Hackers site](https://purduehackers.com/); the µgrants listing links to their [official grants page](https://grants.purduehackers.com/). The mark remains Purdue Hackers' trademark.

Additional staff portraits (including licensing, IP, and legal contacts) come from the [Purdue Innovates team page](https://purdueinnovates.org/our-team/) and were resized to 480px WebP. The exact public profile and work email source for each person is represented by their `url` in `data/people.json`. `scripts/scrape_people.py` collects candidate public records for manual review.

## Calmer homepage and motion (2026-09-30)

The contained workshop and corridor images are the existing generated conceptual assets listed above. They are labeled in the UI. The new home layout uses typography and real sourced data as its main visual evidence; no new stock photography or marketplace imagery was added.

Component ports from the [MIT-licensed Kokonut UI source](https://github.com/kokonut-labs/kokonutui/tree/83eec6d/components/kokonutui) indexed by 21st.dev: `SlideTextButton` (main CTAs), `MorphicNavbar` (active navigation pill), `SpotlightCards` (pointer light on entry cards), `ActionSearchBar` (keyboard search), `SmoothTab` (resource, people, and alumni filters), `ScrollText` (current roadmap row via intersection observer), and `Loader` (brief branded opening line/monogram rather than its circular spinner). These are native adaptations to the static site, not pasted demo code or marketplace media. License copy: [`KOKONUT-MIT.txt`](KOKONUT-MIT.txt).

GSAP 3.14.2 and ScrollTrigger are vendored in `public/vendor/` from official npm distribution via jsDelivr. [GSAP standard license](https://gsap.com/standard-license/) governs these files. They animate only entrance transforms and opacity after load; source content is visible without JS and `prefers-reduced-motion` skips the timelines. The opening mark exits with CSS even if GSAP fails.

Five alumni portraits in `public/assets/alumni/` come from the official Purdue pages linked by `image_source_url` in `data/alumni.json` and `public/alumni.json`: John Gedmark (Purdue AAE), Don Thompson (Purdue ECE), Kendra Bracken-Ferguson (Purdue CLA), Akshay Kothari (Purdue ECE), and Ashish Toshniwal (Purdue ECE). Files were downloaded on 2026-09-30 and resized/encoded as WebP; four appear in the alumni feature and available portraits appear in directory rows. These portraits remain their owners' content and identify the linked person only.
