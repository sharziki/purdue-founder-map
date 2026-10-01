# Purdue Founder Map — October 2026 redesign

## Product truth

Explore surface. Independent founder guide for Purdue students and alumni. Primary action: choose a starting stage. Secondary actions: research people and find fitting opportunities. Counts come from public JSON, not marketing estimates. Listings document public sources; they do not imply availability for introductions, affiliation, or endorsement.

## References and decisions

- f.inc: concise message, restrained navigation, place as a meaningful visual anchor. Do not copy its centered composition, identity, photographs or typography.
- opcs.cart.moe: persistent reading navigation and practical chapter structure. Replace its continuous document with individually addressable chapters.
- Linear: clear typographic hierarchy and small, consistent controls. No copied dark surfaces or product imagery.
- Stripe Atlas: direct action language and explicit next steps. No copied graphics.
- Mobbin Workable / Polywork / Apollo directory screens: keep search adjacent to filters; give records a consistent visual rhythm; reveal deeper information only on demand. Screens are reference evidence, not assets.

Three directions considered: traditional editorial book (clear but too similar to the rejected site); technical dashboard (fast but intimidating to new founders); campus field index (selected: clear orientation, spatial identity, strong directory utility).

## Composition

Ivory #f7f7f2, near-black #20221e, muted olive gray and small Purdue-gold signals. Instrument Sans is the single locally hosted text family. An original dithered Bell Tower illustration anchors an asymmetric first viewport. Wayfinding numbers, dotted route marks, framed source notes, and precise ruled rows form four original signature elements.

Home: orientation → six-step route → current opportunities → real alumni → complete footer. Internal pages: one task per screen, consistent header, compact filters, progressively disclosed facts. The guide has individual chapter URLs, actions, tools, reading, and next-stage links. People have a directory and accessible profile dialog. Opportunities have compact rows and detail dialogs. Events have calendar and agenda views plus calendar exports.

Hero beats: complete static headline and tower → short tower resolve → type settles → start-guide CTA → route line continues into the roadmap. No blocking loader. A thin navigation progress indicator only accompanies actual navigation.

## Components and motion

21st CLI search returned HTTP 401. Canonical local Kokonut UI command-button and slide-text-button source at bbe9fe9592e86c5c773b1e25b109dc10bb864ff0 inspected; MIT license retained. Adapted to semantic HTML/CSS for the existing static stack. No React runtime added for two small controls. Native dialog owns focus containment and escape behavior.

GSAP owns only landing hero transforms and opacity; CSS owns button and menu transitions. Native scrolling retained because this is a reading and research tool. No inertia, pins, parallax, or scroll traps. Reduced motion bypasses optional hero motion. Static HTML contains the useful initial directory, chapter content, and links. No external font dependency.

## Asset provenance

Instrument Sans 5.3.0: Fontsource, SIL OFL 1.1, locally hosted with license.
Existing public alumni/club portraits: original source ledger retained.
Bell Tower: original generated architectural illustration, not a documentary photograph. Isolated transparent ink/dither art; prompt and master retained. Displayed with explicit dimensions and static fallback.
Component source masters and MIT notice: public/vendor/kokonut-source/.

## Gates

Desktop 1440×900; mobile 390×844 and 320 wide. Check search/filter/pagination, profile dialog and focus restoration, command search, stage navigation and saved checklist, calendar navigation/ICS/Google links, no-JS, blocked core JS, reduced motion, no overflow, and local/public export parity. Independent visual critique after first implementation.
