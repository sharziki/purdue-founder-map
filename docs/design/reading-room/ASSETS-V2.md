# Basement archive assets · 2026-10-02

## Direction
Explore the Purdue network through a tactile, dimly lit basement archive. Crisp serif book headings, readable Instrument Sans body text, muted leather, quiet paper, and a 22px binding shadow. Photos and sources stay factual; the interior is an imagined set, not a real Purdue building.

## Assets and provenance

- Desktop interior: original Higgsfield GPT Image 2 generation. Master `assets/basement-master.png`; exact prompt and result provenance in `assets/higgsfield-room.json`. Optimized local WebP, 2200×1244.
- Mobile interior: Higgsfield GPT Image 2 reference-guided recomposition of the desktop master. Master `assets/basement-mobile-master.png`; prompt/provenance in `assets/higgsfield-mobile.json`. Optimized local WebP, 1000×1768.
- Cloth grain: original small SVG noise texture, `public/assets/library/cloth-grain.svg`.
- Book covers/spines: original Canvas/HTML/CSS material treatment. No reference-site assets or new component dependencies.
- Portraits: 112 additional images from public Purdue Engineering 38 by 38 profiles. Import requires image alt text to match the person's normalized full name exactly. Canonical image URL, page URL and original alt text retained in `data/alumni-portraits.json`, alumni JSON and SQLite. No generated faces. Existing sourced portraits are preserved; unpictured records retain a neutral bookplate icon.
- Instrument Sans: existing locally hosted OFL font; license in `public/fonts/INSTRUMENT-SANS-LICENSE.txt`. Georgia uses the reader's system font.

## Motion ownership

| Interaction | Owner | Duration | Reduced motion |
|---|---|---|---|
| Book hover | CSS | 220ms | static highlight |
| Spine to cover to open spread | Web Animations | 560 + 380 + 780ms | immediate open |
| Page turn | Web Animations | 340ms | immediate replacement |
| Book return | Web Animations | 640 + 300 + 540ms | immediate close |
| Ambient dust / lamp glow | Original WebGL shader | ≤20fps, DPR ≤1.5 | static frame |

The atmospheric loop pauses while the document is hidden or a book is open. WebGL failure leaves the photographic scene intact. Layout and book flight share coordinates. Mobile uses four shelves and a separate portrait interior; desktop uses three shelves. Text never enters the binding-shadow region.

## Independent critique repairs

1. Replaced unsupported arrow glyphs with inline SVGs.
2. Increased reader controls to 44px; mobile profile links to 44px, metadata to 13px, footer to 11px.
3. Generated a dedicated mobile composition and shortened the cabinet to retain the moonlit window and warm lamp.
