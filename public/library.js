/* The Reading Room: every person on the map, shelved A to Z by surname, in a little pixel room. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOK = () => !motionPreference.matches;
  const safeURL = value => /^(https?:\/\/|\/(?![\/\\]))/.test(value || '') ? value : '';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- palette and pixel helpers ---------- */
  const C = { ink: '#140a10', page: '#f3e6c8', page2: '#e4d3ae', foil: '#e3bd62', red: '#e0604f', heart: '#ff7d8e', rain: '#8d9bd6', rain2: '#b6c1ee', flame: '#ffd36b', flame2: '#ff9a3c', steam: '#c9a27a', steam2: '#8a6a58' };
  const BOOK = ['#7d2f38', '#2f5e5a', '#a8792e', '#2e3d63', '#5d6a34', '#93462a', '#5a3a66', '#9a5a64', '#35553b', '#b9a47c', '#6e4228', '#4a5670', '#8a3428', '#b0702f'];
  const LIGHT_BOOKS = new Set(['#a8792e', '#b9a47c', '#b0702f']);
  const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const tint = (c, f) => hex(rgb(c).map(v => (f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const bayer = (x, y) => BAYER[((y & 3) << 2) + (x & 3)];
  const hashStr = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = seed => { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };

  const GLYPH = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
    J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
    P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
    3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
    6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
    9: ['###', '#.#', '###', '..#', '##.'], '-': ['...', '...', '###', '...', '...'], ' ': ['..', '..', '..', '..', '..'],
    '?': ['##.', '..#', '.#.', '...', '.#.'], '!': ['.#.', '.#.', '.#.', '...', '.#.'],
  };
  // A roomier 5x7 face for the big volume letters on covers and title pages.
  const BIG = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '*': ['..#..', '..#..', '#####', '.###.', '.###.', '.#.#.', '#...#'],
  };
  const big = (letter, x, y, c, k) => (BIG[letter] || BIG.X).forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '#') R(x + i * k, y + j * k, k, k, c); });
  function letterCanvas(letter, color) {
    const c = document.createElement('canvas'); c.width = 5; c.height = 7; c.setAttribute('aria-hidden', 'true');
    const prev = X; X = c.getContext('2d'); big(letter, 0, 0, color, 1); X = prev;
    return c;
  }
  const ZZ = ['###', '..#', '.#.', '###'];
  const HEART = ['#.#', '###', '.#.'];
  const NOTE = ['.##', '.#.', '.#.', '##.'];

  /* ---------- the room art and the things that move in it ---------- */
  const ART = { w: 320, h: 180, src: '/assets/library/reading-room.png' };
  const SHELF = { x0: 5, x1: 101, bases: [61, 93, 125], top: [34, 65, 97], perRow: [9, 9, 8], low: { y0: 128, base: 146 } };
  const SPOTS = {
    reader: { x: 138, y: 50, w: 56, h: 92 },
    cat: { x: 198, y: 106, w: 42, h: 30 },
    catBand: { x: 199, y: 108, w: 40, h: 14 },
    catHead: { x: 205, y: 108 },
    pages: { x: 154, y: 97, gutter: 169 },
    steam: { x: 269, y: 109 },
    panes: [{ x: 128, y: 21, w: 63, h: 70 }, { x: 197, y: 21, w: 62, h: 70 }],
  };
  const art = new Image();
  const artReady = new Promise(resolve => { art.onload = resolve; art.onerror = resolve; });
  art.src = ART.src;
  let artPixels = null;

  const room = $('room'), view = room.getContext('2d');
  const base = document.createElement('canvas'), baseCtx = base.getContext('2d');
  const glow = document.createElement('canvas');
  let X = view;
  const R = (x, y, w, h, c) => { if (w <= 0 || h <= 0) return; X.fillStyle = c; X.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const P = (x, y, c) => R(x, y, 1, 1, c);
  const glyphW = ch => (GLYPH[ch] || GLYPH[' '])[0].length;
  const textW = (s, k = 1) => [...s].reduce((w, ch) => w + (glyphW(ch) + 1) * k, -k);
  const text = (s, x, y, c, k = 1) => {
    for (const ch of s) {
      const g = GLYPH[ch] || GLYPH[' '];
      g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') R(x + i * k, y + j * k, k, k, c); });
      x += (g[0].length + 1) * k;
    }
  };
  const sprite = (rows, x, y, c) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') P(x + i, y + j, c); });

  /* ---------- state ---------- */
  let S = 4, W = 320, H = 180, ax = 0, ay = 0;
  let people = [], volumes = [], byId = new Map();
  let hovered = -1, matches = null, busy = false, pageTurn = 0;
  let rain = [], bulbs = [], rainMask = null, pageColors = null;
  const book = { open: false, vol: -1, person: -1, single: false, view: 'index', m: null };

  /* ---------- data ---------- */
  const SUFFIX = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md', 'mba', 'pe', 'dds', 'esq', 'cpa', 'dvm', 'pharmd']);
  function splitName(name) {
    const toks = name.replace(/\(.*?\)/g, ' ').replace(/".*?"/g, ' ').split(/[\s,]+/).filter(Boolean);
    while (toks.length > 1 && SUFFIX.has(toks[toks.length - 1].toLowerCase().replace(/\./g, ''))) toks.pop();
    const last = toks.pop() || name;
    return { last, first: toks.join(' ') };
  }
  function shelve(rows) {
    volumes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, i) => {
      const h = hashStr(letter + 'vol');
      const c = BOOK[(i * 5) % BOOK.length];
      return { letter, i, people: [], c, cd: tint(c, 0.7), cdd: tint(c, 0.5), cl: tint(c, 1.22), light: LIGHT_BOOKS.has(c), style: h % 4, h: 19 + (h % 6), w: 9, x: 0, y: 0, lift: 0, out: false, hits: 0 };
    });
    people = rows.map(raw => {
      const { last, first } = splitName(raw.name);
      const letter = (fold(last).replace(/[^a-z]/g, '')[0] || fold(raw.name).replace(/[^a-z]/g, '')[0] || 'x').toUpperCase();
      return {
        raw, id: raw.id, last, first, letter, display: first ? `${last}, ${first}` : last,
        fname: fold(raw.name), flast: fold(last), forg: fold(raw.organization),
        hay: fold([raw.name, raw.organization, raw.role, raw.region, raw.kind, raw.connection, (raw.tags || []).join(' '), raw.company_sector, raw.company].join(' ')),
      };
    });
    for (const p of people) volumes[p.letter.charCodeAt(0) - 65].people.push(p);
    const max = Math.max(...volumes.map(v => v.people.length));
    for (const v of volumes) {
      v.people.sort((a, b) => a.flast.localeCompare(b.flast) || fold(a.first).localeCompare(fold(b.first)));
      v.people.forEach((p, n) => { p.vol = v.i; p.n = n; });
      v.w = 8 + Math.round(4 * Math.sqrt(v.people.length / max));
      v.kinds = v.people.reduce((k, p) => (k[p.raw.kind] = (k[p.raw.kind] || 0) + 1, k), {});
    }
    let i = 0;
    SHELF.perRow.forEach((n, r) => {
      let x = SHELF.x0;
      for (const v of volumes.slice(i, i + n)) { v.x = x; v.y = SHELF.bases[r] - v.h; v.row = r; x += v.w; }
      SHELF.deco = SHELF.deco || []; SHELF.deco[r] = x + 1;
      i += n;
    });
    byId = new Map(people.map(p => [p.id, p]));
  }

  /* ---------- compiled books: a tag or a search, bound into its own volume ---------- */
  const EXIT_TYPES = new Set(['acquisition', 'ipo', 'merger', 'exit', 'public_listing', 'majority_stake_sale']);
  const hasTag = name => p => (p.raw.tags || []).includes(name);
  const COLLECTIONS = [
    { slug: 'y-combinator', title: 'Y Combinator', tag: 'Y Combinator', c: '#c4572a', words: ['yc', 'y combinator', 'ycombinator', 'combinator'], test: hasTag('Y Combinator') },
    { slug: 'venture-backed', title: 'Venture-backed', tag: 'Venture-backed', words: ['venture backed', 'venture-backed', 'vc backed', 'vc-backed'], test: hasTag('Venture-backed') },
    { slug: 'funded-startups', title: 'Funded startups', tag: 'Funded startup', words: ['funded', 'funded startup', 'funded startups', 'funding', 'raised'], test: hasTag('Funded startup') },
    { slug: 'exits', title: 'Exits and IPOs', words: ['exit', 'exits', 'ipo', 'ipos', 'acquired', 'acquisition', 'merger'], test: p => (p.raw.capital_events || []).some(e => EXIT_TYPES.has(e.type)) },
    { slug: 'accelerators', title: 'Accelerators', words: ['accelerator', 'accelerators', 'techstars'], test: p => hasTag('Y Combinator')(p) || (p.raw.capital_events || []).some(e => e.type === 'accelerator') },
    { slug: 'vc-investors', title: 'VC investors', tag: 'VC investor', words: ['vc', 'vcs', 'venture capital', 'vc investor', 'vc investors'], test: hasTag('VC investor') },
    { slug: 'investors', title: 'Investors', tag: 'Investor', words: ['investor', 'investors', 'angel', 'angels'], test: hasTag('Investor') },
    { slug: 'founders', title: 'Founders', tag: 'Founder', words: ['founder', 'founders'], test: hasTag('Founder') },
    { slug: 'tech', title: 'Tech', tag: 'Tech', words: ['tech', 'software'], test: hasTag('Tech') },
    { slug: 'bay-area', title: 'Bay Area', tag: 'Bay Area', words: ['bay area', 'sf', 'san francisco', 'silicon valley'], test: hasTag('Bay Area') },
    { slug: 'new-york', title: 'New York', tag: 'NYC', words: ['nyc', 'new york', 'ny'], test: hasTag('NYC') },
  ];
  function matchCollections(value) {
    const q = fold(value).trim();
    if (q.length < 2) return [];
    return COLLECTIONS.filter(c => fold(c.title).startsWith(q) || c.words.some(w => w.startsWith(q) || (q.length > w.length && q.startsWith(w + ' '))));
  }
  const exactCollection = value => { const q = fold(value).trim(); return COLLECTIONS.find(c => fold(c.title) === q || c.words.includes(q)); };
  function compileBook(title, list, slug) {
    const c = COLLECTIONS.find(x => x.slug === slug)?.c || BOOK[hashStr(title) % BOOK.length];
    const shelf = [...list].sort((a, b) => a.flast.localeCompare(b.flast) || fold(a.first).localeCompare(fold(b.first)));
    return {
      custom: true, slug, title, letter: '*', i: -1, people: shelf, c, cd: tint(c, 0.7), cdd: tint(c, 0.5), cl: tint(c, 1.22), light: LIGHT_BOOKS.has(c),
      kinds: shelf.reduce((k, p) => (k[p.raw.kind] = (k[p.raw.kind] || 0) + 1, k), {}),
    };
  }
  const collectionBook = c => compileBook(c.title, people.filter(c.test), c.slug);

  /* ---------- layout: crisp scale, letterboxed with the room continuing outward ---------- */
  // Scale snaps to whole device pixels so the art stays crisp. Phones get a bigger room they can swipe across.
  const stage = $('stage'), panHint = $('pan-hint');
  let panned = false;
  function layout() {
    const vw = innerWidth, vh = innerHeight, dpr = devicePixelRatio || 1;
    const portrait = vw < 760 || vw / vh < 1.05;
    const snap = s => Math.max(1, Math.floor(s * dpr) / dpr);
    if (portrait) {
      S = snap(Math.max(2, Math.min(vh * 0.64 / ART.h, vw / 110)));
      const fit = Math.ceil(vw / S);
      W = Math.max(fit, ART.w); H = Math.ceil(vh / S);
      ax = Math.max(0, Math.round((fit - ART.w) / 2)); ay = Math.round(Math.min(H - ART.h, Math.max((H - ART.h) * 0.55, 160 / S)));
    } else {
      S = snap(Math.min(vw / ART.w, vh / ART.h));
      W = Math.ceil(vw / S); H = Math.ceil(vh / S);
      ax = Math.round((W - ART.w) / 2); ay = Math.round((H - ART.h) / 2);
    }
    // Only a phone-shaped screen narrower than the art pans; rounding slack on desktop never does.
    const pan = portrait && W * S > vw + S;
    document.documentElement.classList.toggle('portrait', portrait);
    stage.classList.toggle('pan', pan);
    panHint.hidden = !pan || panned || !reader.hidden;
    document.documentElement.style.setProperty('--u', S + 'px');
    room.width = W; room.height = H; base.width = W; base.height = H;
    room.style.width = W * S + 'px'; room.style.height = H * S + 'px';
    buildBase();
    placeHits();
    frame();
  }
  const panX = () => stage.scrollLeft;
  stage.addEventListener('scroll', () => { hideTip(); if (stage.scrollLeft > 8 && !panned) { panned = true; panHint.hidden = true; } }, { passive: true });

  function buildBase() {
    X = baseCtx;
    R(0, 0, W, H, '#0c070c');
    if (!artPixels) { X = view; return; }
    const img = X.createImageData(W, H), d = img.data, src = artPixels.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = x - ax, sy = y - ay, inside = sx >= 0 && sy >= 0 && sx < ART.w && sy < ART.h;
      // Past the edges the room keeps going: walls mirror, the ceiling and floorboards repeat, and it all fades to night.
      let cx = sx < 0 ? -sx - 1 : sx >= ART.w ? 2 * ART.w - sx - 1 : sx;
      let cy = sy < 0 ? (-sy - 1) % 3 : sy;
      if (sy >= ART.h) { // floorboards: a rug-free strip, tiled back and forth so there are no hard seams
        const m = ((sx % 192) + 192) % 192;
        cy = ART.h - 1 - ((sy - ART.h) % 12); cx = 4 + (m < 96 ? m : 191 - m);
      }
      cx = Math.max(0, Math.min(ART.w - 1, cx)); cy = Math.max(0, Math.min(ART.h - 1, cy));
      const k = (cy * ART.w + cx) * 4, o = (y * W + x) * 4;
      let f = 1;
      if (!inside) {
        const dist = Math.max(-sx, sx - ART.w + 1, -sy, sy - ART.h + 1);
        const q = Math.min(4, Math.floor(dist / 6 + bayer(x, y) * 1.2));
        f = [0.66, 0.5, 0.36, 0.24, 0.14][q];
      }
      d[o] = src[k] * f; d[o + 1] = src[k + 1] * f; d[o + 2] = src[k + 2] * f; d[o + 3] = 255;
    }
    X.putImageData(img, 0, 0);
    drawShelfDeco();
    // What still glows when the lamp is off: the rainy sky, the city, his pages, the fairy lights.
    glow.width = W; glow.height = H;
    const gx = glow.getContext('2d'), gi = gx.createImageData(W, H), gd = gi.data;
    const keep = (i, j) => {
      const k = (j * ART.w + i) * 4, l = 0.3 * src[k] + 0.59 * src[k + 1] + 0.11 * src[k + 2];
      const inPanes = SPOTS.panes.some(p => i >= p.x && i < p.x + p.w && j >= p.y && j < p.y + p.h);
      const inHead = i >= 144 && i < 186 && j >= 48 && j < 92;
      if (inPanes && (rainMask[j * ART.w + i] || (l > 150 && !inHead))) return true;
      return i >= 153 && i < 184 && j >= 95 && j < 103 && l > 120;
    };
    for (let j = 0; j < ART.h; j++) for (let i = 0; i < ART.w; i++) if (keep(i, j)) {
      const k = (j * ART.w + i) * 4, o = ((j + ay) * W + i + ax) * 4;
      if (i + ax < 0 || i + ax >= W || j + ay < 0 || j + ay >= H) continue;
      gd[o] = src[k]; gd[o + 1] = src[k + 1]; gd[o + 2] = src[k + 2]; gd[o + 3] = 255;
    }
    for (const b of bulbs) for (const [i, j, , c] of b.px) { const [r, g, bl] = rgb(c), o = ((j + ay) * W + i + ax) * 4; if (o >= 0 && o < gd.length) { gd[o] = r; gd[o + 1] = g; gd[o + 2] = bl; gd[o + 3] = 255; } }
    gx.putImageData(gi, 0, 0);
    X = view;
  }

  function prepareArt() {
    const c = document.createElement('canvas'); c.width = ART.w; c.height = ART.h;
    const x = c.getContext('2d'); x.drawImage(art, 0, 0);
    artPixels = x.getImageData(0, 0, ART.w, ART.h);
    const px = (i, j) => { const k = (j * ART.w + i) * 4; return [artPixels.data[k], artPixels.data[k + 1], artPixels.data[k + 2]]; };
    const lum = ([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b;
    rainMask = new Uint8Array(ART.w * ART.h);
    for (const p of SPOTS.panes) for (let j = p.y; j < p.y + p.h; j++) for (let i = p.x; i < p.x + p.w; i++) {
      const [r, g, b] = px(i, j);
      if (b > r + 8 && b >= g && lum([r, g, b]) < 120) rainMask[j * ART.w + i] = 1;
    }
    const r = rng(9);
    rain = Array.from({ length: 54 }, () => ({ x: 128 + r() * 136, y: 20 + r() * 72, v: 1.6 + r() * 1.8, l: 2 + (r() * 2 | 0), c: r() > 0.7 ? C.rain2 : C.rain }));
    bulbs = [];
    for (let j = 0; j < 18; j++) for (let i = 100; i < ART.w; i++) {
      if (lum(px(i, j)) < 150) continue;
      let b = bulbs.find(o => Math.abs(o.x - i) <= 3 && Math.abs(o.y - j) <= 3);
      if (!b) { b = { x: i, y: j, px: [], p: r() * 6.28, s: 0.4 + r() * 0.9 }; bulbs.push(b); }
      b.px.push([i, j, hex(px(i, j).map(v => v * 0.42)), hex(px(i, j))]);
    }
    pageColors = [hex(px(158, 98)), hex(px(176, 98))];
  }

  /* ---------- the shelf ---------- */
  function drawSpine(v, x, y, lit) {
    const w = v.w, h = v.h, body = lit ? v.cl : v.c;
    R(x, y, w, h, C.ink);
    R(x + 1, y + 1, w - 2, h - 1, body);
    R(x + 1, y + 1, 1, h - 1, lit ? tint(v.cl, 1.12) : v.cl);
    R(x + w - 2, y + 1, 1, h - 1, v.cd);
    R(x + 1, y + 1, w - 2, 1, v.cd);
    const ink = v.light ? '#2a1a12' : C.foil, gx = x + ((w - glyphW(v.letter)) >> 1);
    if (v.style === 0) { R(x + 2, y + 3, w - 4, 1, ink); R(x + 2, y + h - 4, w - 4, 1, ink); text(v.letter, gx, y + 6, ink); }
    else if (v.style === 1) { R(x + 2, y + 5, w - 4, 7, v.light ? '#2a1a12' : '#d9c79f'); text(v.letter, gx, y + 6, v.light ? '#e8d6a8' : '#2a1a12'); R(x + 2, y + h - 4, w - 4, 1, v.cd); }
    else if (v.style === 2) { for (let k = 3; k < h - 2; k += 5) R(x + 1, y + k, w - 2, 1, v.cd); R(x + 2, y + 5, w - 4, 7, v.cd); text(v.letter, gx, y + 6, ink); }
    else { text(v.letter, gx, y + 4, ink); P(x + (w >> 1), y + h - 5, ink); }
    // the board above throws a soft shadow over the top of every book
    for (let j = 0; j < 3; j++) for (let i = 0; i < w; i++) if (bayer(x + i, y + j) < 0.55 - j * 0.18) { X.fillStyle = 'rgba(10,4,10,.45)'; X.fillRect(x + i, y + j, 1, 1); }
  }

  function drawShelfDeco() {
    if (!volumes.length) return;
    const ox = ax, oy = ay;
    const [d1, d2, d3] = SHELF.deco;
    // row 1: a little framed photo leaning on the books
    if (SHELF.x1 - d1 > 6) { const x = ox + d1 + 1, y = oy + 61; R(x, y - 9, 7, 9, '#2a1a12'); R(x + 1, y - 8, 5, 7, '#e9dcbc'); R(x + 2, y - 7, 3, 3, '#4b6391'); R(x + 2, y - 4, 3, 1, '#c79a46'); P(x + 3, y - 6, '#f2cc82'); }
    // row 2: a tiny cactus
    if (SHELF.x1 - d2 > 8) { const x = ox + d2 + 2, y = oy + 93; R(x, y - 5, 6, 5, '#9d4c2b'); R(x, y - 5, 6, 1, '#c06a3b'); R(x + 2, y - 11, 2, 6, '#3e6b39'); R(x + 1, y - 9, 1, 2, '#3e6b39'); R(x + 4, y - 10, 1, 3, '#3e6b39'); P(x + 2, y - 11, '#5f9e50'); }
    // row 3: a candle holder (the flame is animated) and a short stack
    if (SHELF.x1 - d3 > 12) {
      const x = ox + d3 + 5, y = oy + 125;
      R(x - 3, y - 2, 7, 2, '#8a6a32'); R(x - 2, y - 3, 5, 1, '#c79a46'); R(x - 1, y - 10, 3, 7, '#e9dcbc'); R(x + 1, y - 10, 1, 7, '#cdbd96');
      SHELF.candle = { x: x - ox, y: y - 11 - oy }; // art coordinates; the flame is drawn per frame
      [[x + 6, '#4a5670', 13], [x + 7, '#7d2f38', 11]].forEach(([bx, c, bw], k) => { const by = y - 3 - k * 3; R(bx, by, bw, 3, C.ink); R(bx + 1, by + 1, bw - 2, 1, c); });
    }
    // top shelf: two books lying beside the toys
    [[ox + 92, '#5d6a34', 13], [ox + 93, '#2e3d63', 11]].forEach(([bx, c, bw], k) => { const y = oy + 30 - 3 - k * 3; R(bx, y, bw, 3, C.ink); R(bx + 1, y + 1, bw - 2, 1, c); R(bx + bw - 2, y + 1, 1, 1, '#e9dcbc'); });
    // bottom row: lying stacks and a little crate of records
    const by = oy + SHELF.low.base;
    [[ox + 7, '#2f5e5a', 22], [ox + 9, '#a8792e', 19], [ox + 8, '#5a3a66', 20]].forEach(([bx, c, bw], k) => { const y = by - 4 - k * 4; R(bx, y, bw, 4, C.ink); R(bx + 1, y + 1, bw - 2, 2, c); R(bx + 1, y + 1, bw - 2, 1, tint(c, 1.2)); R(bx + bw - 3, y + 1, 1, 2, '#e9dcbc'); });
    const cx = ox + 40;
    R(cx, by - 12, 26, 12, '#3a2414'); R(cx + 1, by - 11, 24, 10, '#6b4024'); R(cx + 1, by - 11, 24, 1, '#86532f'); R(cx + 3, by - 7, 20, 1, '#3a2414');
    for (let k = 0; k < 5; k++) R(cx + 3 + k * 4, by - 16 + (k % 2), 3, 5, k % 2 ? '#1c1418' : '#2a2026');
    R(ox + 74, by - 7, 9, 7, '#9d4c2b'); R(ox + 74, by - 7, 9, 1, '#c06a3b'); R(ox + 76, by - 13, 5, 6, '#2e5a34'); P(ox + 75, by - 11, '#3f7a40'); P(ox + 81, by - 12, '#3f7a40'); P(ox + 78, by - 14, '#5f9e50');
  }

  function drawVolumes() {
    for (const v of volumes) {
      if (v.out) continue;
      const target = v.i === hovered ? 2 : 0;
      v.lift += Math.sign(target - v.lift);
      const x = ax + v.x, y = ay + v.y - v.lift;
      drawSpine(v, x, y, v.i === hovered);
      if (matches && !v.hits) { X.fillStyle = 'rgba(12,6,14,.55)'; X.fillRect(x, y, v.w, v.h); }
      if (matches && v.hits) { R(x + v.w - 4, y - 3, 2, 6, C.red); P(x + v.w - 4, y - 4, C.ink); P(x + v.w - 3, y - 4, C.ink); }
    }
  }

  /* ---------- per-frame life ---------- */
  /* ---------- toys: the room's state ---------- */
  const fx = { cat: null, catPokes: 0, catLast: -1e9, lampOff: false, chain: -1e9, flash: -1e9, globe: -1e9, glass: -1e9, radio: false, yarn: -1e9, candleOut: false, candleT: -1e9, plant: -1e9, mug: -1e9 };
  const ago = t0 => performance.now() - t0;
  const A = (x, y, c) => P(ax + x, ay + y, c);
  const RA = (x, y, w, h, c) => R(ax + x, ay + y, w, h, c);

  function drawRain(move) {
    for (const d of rain) {
      if (move && motionOK()) { d.y += d.v; d.x -= d.v * 0.28; if (d.y > 92) { d.y = 20 + Math.random() * 6; d.x = 128 + Math.random() * 140; } if (d.x < 128) d.x += 136; }
      for (let k = 0; k < d.l; k++) {
        const px = Math.round(d.x + k * 0.28), py = Math.round(d.y - k);
        if (px >= 0 && py >= 0 && px < ART.w && py < ART.h && rainMask[py * ART.w + px]) A(px, py, d.c);
      }
    }
  }
  function drawLightning(now) {
    const e = now - fx.flash;
    if (e > 300) return;
    const bright = e < 90 || (e > 170 && e < 250);
    if (!bright) return;
    const c = e < 90 ? '#dfe4ff' : '#8f9bd3';
    for (const p of SPOTS.panes) for (let j = p.y; j < p.y + p.h; j++) for (let i = p.x; i < p.x + p.w; i++) if (rainMask[j * ART.w + i]) A(i, j, c);
    if (e < 90) {
      const bolt = [[238, 21], [233, 30], [236, 31], [229, 43], [232, 44], [225, 57]];
      for (let s = 0; s < bolt.length - 1; s++) {
        const [x0, y0] = bolt[s], [x1, y1] = bolt[s + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); if (rainMask[y * ART.w + x]) A(x, y, '#ffffff'); }
      }
    }
  }
  function drawCat(now, t) {
    const c = fx.cat, active = c && now - c.t < c.dur, h = SPOTS.catHead, band = SPOTS.catBand;
    if (active && c.kind === 'purr') X.drawImage(base, ax + 197, ay + 105, 44, 32, ax + 197 + (Math.floor(now / 60) % 2), ay + 105, 44, 32);
    else if (!active && Math.sin(t * Math.PI * 2 / 3.6) > 0.1) X.drawImage(base, ax + band.x, ay + band.y, band.w, band.h, ax + band.x, ay + band.y - 1, band.w, band.h);
    if (active && (c.kind === 'one' || c.kind === 'both')) {
      if (c.kind === 'both') X.drawImage(base, ax + 199, ay + 110, 18, 6, ax + 199, ay + 109, 18, 6);
      const blink = (now - c.t) % 1400 > 1300;
      const eye = x => { if (blink) return; A(x, 122, '#d7ea6a'); A(x + 1, 122, '#d7ea6a'); A(x, 123, '#d7ea6a'); A(x + 1, 123, '#140a10'); };
      eye(203); if (c.kind === 'both') eye(209);
    }
    if (active && c.kind === 'purr') {
      const k = (now - c.t) / c.dur;
      sprite(HEART, ax + h.x - 1, ay + h.y - 4 - Math.round(k * 10), C.heart);
      if (k > 0.3) sprite(HEART, ax + h.x + 6, ay + h.y - 2 - Math.round((k - 0.3) * 12), C.heart);
    }
    if (active && c.mark) {
      const bx = 205, by = 98 - Math.min(2, Math.floor((now - c.t) / 120));
      RA(bx, by, 7, 8, C.ink); RA(bx + 1, by + 1, 5, 6, C.page); text(c.mark, ax + bx + 2, ay + by + 1, C.ink); A(bx + 2, by + 8, C.ink); A(bx + 1, by + 9, C.ink);
    }
  }
  function drawZs(now, t) {
    const c = fx.cat, h = SPOTS.catHead;
    if (c && now - c.t < c.dur) return;
    for (const off of [0, 0.5]) {
      const ph = ((t / 3.4) + off) % 1;
      if (ph > 0.82) continue;
      sprite(ZZ, ax + h.x + Math.round(ph * 6 + Math.sin(ph * 6)), ay + h.y - 6 - Math.round(ph * 14), ph < 0.5 ? C.page : '#b39f85');
    }
  }
  function drawGlobe(now) {
    RA(50, 27, 9, 3, '#5a3a22'); RA(50, 27, 9, 1, '#8a5a32'); RA(51, 29, 7, 1, '#3a2414');
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = x * x + y * y; if (d <= 18) A(54 + x, 22 + y, d >= 13 ? '#7b8fc0' : y >= 2 ? '#dfe6f5' : '#26355e'); }
    RA(53, 22, 3, 2, '#c06a3b'); A(54, 21, '#9d4c2b'); A(54, 23, '#ffd36b'); A(52, 19, '#e8f0ff');
    const p = Math.min(1, (now - fx.globe) / 3200);
    if (p < 1) for (let i = 0; i < 10; i++) {
      const a = i * 0.7 + now / 1000 * (3.2 + i * 0.25), rr = 3.2 * (1 - p) + 0.3;
      const x = Math.round(Math.cos(a) * rr), y = Math.round(Math.sin(a) * rr * 0.8 + p * 2.5);
      if (x * x + y * y <= 11) A(54 + x, 22 + y, '#ffffff');
    }
  }
  function drawHourglass(now) {
    const e = now - fx.glass, sand = '#e3bd62', glass = '#33415f';
    if (e < 260) { RA(61, 25, 11, 1, '#c79a46'); RA(61, 29, 11, 1, '#c79a46'); RA(62, 26, 9, 3, glass); RA(63, 27, 3, 2, sand); return; }
    const f = fx.glass < 0 ? 0 : Math.max(0, 1 - (e - 260) / 7000);
    RA(63, 19, 6, 1, '#c79a46'); RA(63, 29, 6, 1, '#c79a46'); RA(63, 20, 1, 9, '#6b4024'); RA(68, 20, 1, 9, '#6b4024');
    const rows = [[20, 4], [21, 4], [22, 2], [23, 2], [24, 2], [25, 2], [26, 2], [27, 4], [28, 4]];
    for (const [y, w] of rows) RA(64 + (4 - w) / 2, y, w, 1, glass);
    const top = Math.round(f * 4), bottom = Math.round((1 - f) * 4);
    for (let k = 0; k < top; k++) { const [y, w] = rows[3 - k]; RA(64 + (4 - w) / 2, y, w, 1, sand); }
    for (let k = 0; k < bottom; k++) { const [y, w] = rows[8 - k]; RA(64 + (4 - w) / 2, y, w, 1, sand); }
    if (f > 0 && f < 1) { A(65 + (Math.floor(now / 140) % 2), 24, sand); A(65, 25 + (Math.floor(now / 90) % Math.max(1, 3 - bottom)), sand); }
  }
  function drawRadio(now) {
    for (let k = 0; k < 7; k++) A(86 + (k >> 1), 21 - k, '#8d8a92'); A(89, 14, '#e9dcbc');
    RA(74, 22, 15, 8, C.ink); RA(75, 23, 13, 6, '#8a3428'); RA(75, 23, 13, 1, '#b04a38');
    for (let y = 24; y < 28; y++) for (let x = 76; x < 81; x++) if ((x + y) % 2) A(x, y, '#4a1a16');
    RA(82, 24, 5, 3, fx.radio ? '#ffd36b' : '#c9b48a'); A(83 + (fx.radio ? Math.floor(now / 700) % 3 : 0), 25, '#7d2f38');
    A(83, 28, '#c79a46'); A(86, 28, '#c79a46');
  }
  function drawNotes(now) {
    if (!fx.radio) return;
    for (let k = 0; k < 3; k++) {
      const ph = ((now / 2600) + k / 3) % 1;
      sprite(NOTE, ax + 77 + k * 3 + Math.round(Math.sin(ph * 6 + k) * 2), ay + 18 - Math.round(ph * 16), ph < 0.6 ? C.page : '#b39f85');
    }
  }
  function drawCandle(now) {
    if (!SHELF.candle) return;
    const { x, y } = SHELF.candle;
    if (fx.candleOut) {
      const e = now - fx.candleT;
      if (e < 2600) for (let k = 0; k < 8; k++) {
        const ph = Math.min(1, e / 2600 + k * 0.06), sx = x + Math.round(Math.sin(ph * 9 + k * 0.8) * 1.6), sy = y - 1 - Math.round(ph * 13) - k;
        A(sx, sy, ph < 0.55 ? '#c4bcc8' : '#857d8a'); if (k % 3 === 0) A(sx + 1, sy, '#857d8a');
      }
      return;
    }
    const f = Math.floor(now / 170) % 3;
    A(x, y + 1, C.ink); A(x, y, C.flame2); A(x + (f === 1 ? 1 : 0), y - 1, C.flame); if (f !== 2) A(x, y - 2, C.flame);
    if (now - fx.candleT < 260) { A(x - 1, y - 1, C.flame); A(x + 1, y - 1, C.flame); A(x, y - 3, '#fff3c4'); }
  }
  function drawSteam(now, t) {
    const burst = now - fx.mug < 1800, n = burst ? 4 : 2;
    for (let k = 0; k < n; k++) {
      const ph = ((t / (burst ? 1.4 : 2.4)) + k / n) % 1;
      for (let j = 0; j < 3; j++) A(SPOTS.steam.x + Math.round(Math.sin(ph * 7 + j + k) * (burst ? 2 : 1.3)) + (k % 2), SPOTS.steam.y - Math.round(ph * (burst ? 16 : 11)) - j, ph < 0.55 ? C.steam : C.steam2);
    }
  }
  function drawYarn(now) {
    const e = Math.max(0, now - fx.yarn), rolling = e < 2400; // rAF time can trail the click by a few ms
    const dx = rolling ? Math.round(Math.sin(Math.min(1, e / 2400) * Math.PI) * 13) : 0, x = 250 + dx, y = 164;
    for (let k = 1; k <= 6 + dx; k++) A(x - 3 - k, y + 2 + (k % 3 === 0 ? 1 : 0), '#b55468');
    RA(x - 3, y + 4, 7, 1, '#140a0c');
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 10) A(x + i, y + j, '#d26a7d');
    const r = rolling ? Math.floor(e / 110) % 3 : 0;
    for (const [i, j] of [[[-2, -1], [-1, 0], [0, 1], [1, 2]], [[-2, 1], [-1, 0], [1, -1], [2, -2]], [[-1, -2], [0, -1], [0, 1], [1, 2]]][r]) A(x + i, y + j, '#9c4258');
    A(x - 1, y - 2, '#f2a0ae'); A(x, y - 2, '#f2a0ae');
  }
  function drawMoth(t) {
    if (fx.lampOff) return;
    const x = 277 + Math.round(Math.cos(t * 1.5) * 19 + Math.sin(t * 3.7) * 2), y = 47 + Math.round(Math.sin(t * 2.3) * 9);
    A(x, y, '#efe3c6');
    if (Math.floor(t * 11) % 2) { A(x - 1, y - 1, '#c8b998'); A(x + 1, y - 1, '#c8b998'); } else { A(x - 1, y, '#c8b998'); A(x + 1, y, '#c8b998'); }
  }

  function frame(now = performance.now()) {
    X = view;
    X.drawImage(base, 0, 0);
    if (!artPixels) return;
    const t = now / 1000;
    drawRain(true);
    // fairy lights breathe out of step with each other
    for (const b of bulbs) if (Math.sin(t * b.s + b.p) < -0.55) for (const [x, y, c] of b.px) A(x, y, c);
    drawLightning(now);
    if (now - fx.plant < 700) X.drawImage(base, ax + 284, ay + 64, 36, 58, ax + 284 + (Math.floor(now / 70) % 2 ? 1 : -1), ay + 64, 36, 58);
    if (now - fx.chain < 260) X.drawImage(base, ax + 281, ay + 62, 4, 16, ax + 281, ay + 63, 4, 16);
    drawCat(now, t);
    if (volumes.length) drawVolumes();
    drawGlobe(now); drawHourglass(now); drawRadio(now);
    drawCandle(now);
    drawSteam(now, t);
    drawYarn(now);
    // a page turns now and then
    const cycle = (t - pageTurn) % 9;
    if (motionOK() && cycle > 8.2 && pageColors) {
      const f = Math.floor((cycle - 8.2) / 0.16), { y, gutter } = SPOTS.pages, [pc, pc2] = pageColors;
      const frames = [
        [[gutter + 11, y - 1], [gutter + 11, y], [gutter + 10, y - 2]],
        [[gutter + 6, y - 3], [gutter + 6, y - 2], [gutter + 5, y - 4], [gutter + 7, y - 1]],
        [[gutter, y - 5], [gutter, y - 4], [gutter, y - 3], [gutter + 1, y - 2], [gutter, y - 6]],
        [[gutter - 6, y - 3], [gutter - 5, y - 4], [gutter - 6, y - 2], [gutter - 7, y - 1]],
        [[gutter - 11, y - 1], [gutter - 10, y - 2], [gutter - 12, y]],
      ];
      for (const [i, j] of frames[Math.min(4, f)] || []) A(i, j, f === 2 ? pc : pc2);
    }
    drawZs(now, t);
    drawMoth(t);
    drawNotes(now);
    if (fx.lampOff) {
      // night mode: everything dims except what makes its own light
      X.fillStyle = 'rgba(8,6,24,.55)'; X.fillRect(0, 0, W, H);
      X.fillStyle = 'rgba(8,6,24,.5)'; X.fillRect(ax + 260, ay + 34, 36, 30); // the shade itself goes dark
      X.drawImage(glow, 0, 0);
      drawRain(false);
      for (const b of bulbs) if (Math.sin(t * b.s + b.p) < -0.55) for (const [x, y, c] of b.px) A(x, y, c);
      drawLightning(now);
      drawCandle(now);
      if (fx.radio) { RA(82, 24, 5, 3, '#ffd36b'); A(83 + Math.floor(now / 700) % 3, 25, '#7d2f38'); drawNotes(now); }
    }
  }
  let last = 0;
  function loop(now) {
    if (!document.hidden && motionOK() && reader.hidden && now - last > 80) { last = now; frame(now); }
    requestAnimationFrame(loop);
  }

  /* ---------- hit areas ---------- */
  const spinesEl = $('spines'), tip = $('spine-tip'), catSpot = $('cat-spot'), readerSpot = $('reader-spot');
  const place = (el, x, y, w, h) => Object.assign(el.style, { left: (ax + x) * S + 'px', top: (ay + y) * S + 'px', width: w * S + 'px', height: h * S + 'px' });
  function placeHits() {
    if (volumes.length && !spinesEl.children.length) {
      spinesEl.innerHTML = volumes.map(v => `<button type="button" class="hit spine-btn" data-vol="${v.i}" aria-label="Volume ${v.letter}, ${v.people.length} ${v.people.length === 1 ? 'person' : 'people'}"></button>`).join('');
    }
    for (const b of spinesEl.children) { const v = volumes[+b.dataset.vol]; place(b, v.x, v.y - 3, v.w, v.h + 3); }
    const c = SPOTS.cat, r = SPOTS.reader;
    place(catSpot, c.x, c.y, c.w, c.h); catSpot.hidden = false;
    place(readerSpot, r.x, r.y, r.w, r.h); readerSpot.hidden = !volumes.length;
    if (!toysEl.children.length) toysEl.innerHTML = TOYS.map((toy, i) => `<button type="button" class="hit toy" data-toy="${i}"${toy.toggle ? ' aria-pressed="false"' : ''}></button>`).join('');
    TOYS.forEach((toy, i) => {
      const b = toysEl.children[i], at = typeof toy.at === 'function' ? toy.at() : toy.at;
      b.hidden = !at;
      if (!at) return;
      place(b, ...at);
      b.setAttribute('aria-label', toy.hint());
      if (toy.toggle) b.setAttribute('aria-pressed', String(toy.toggle()));
    });
  }
  // Tips sit above their anchor, or below it when the anchor is near the top of the room.
  function showTip(html, x, y, below = false) {
    tip.innerHTML = html;
    tip.classList.toggle('below', below);
    tip.style.left = (ax + x) * S - panX() + 'px'; tip.style.top = (ay + y) * S + (below ? 8 : -6) + 'px';
    tip.hidden = false;
  }
  function volumeTip(v) {
    const a = v.people[0], z = v.people[v.people.length - 1];
    const hits = matches ? `<span class="tip-hits">${v.hits} match${v.hits === 1 ? '' : 'es'}</span>` : '';
    showTip(`<b>${v.letter}</b> ${v.people.length} people${hits}<small>${esc(a ? a.last : '')} to ${esc(z ? z.last : '')}</small>`, v.x + v.w / 2, v.y - 4);
  }
  function hideTip() { tip.hidden = true; }
  spinesEl.addEventListener('pointerover', e => { const b = e.target.closest('.spine-btn'); if (!b || busy) return; hovered = +b.dataset.vol; volumeTip(volumes[hovered]); frame(); });
  spinesEl.addEventListener('pointerout', e => { if (e.target.closest('.spine-btn') && !e.relatedTarget?.closest?.('.spine-btn')) { hovered = -1; hideTip(); } });
  spinesEl.addEventListener('focusin', e => { const b = e.target.closest('.spine-btn'); if (!b) return; hovered = +b.dataset.vol; volumeTip(volumes[hovered]); });
  spinesEl.addEventListener('focusout', () => { hovered = -1; hideTip(); });
  spinesEl.addEventListener('click', e => { const b = e.target.closest('.spine-btn'); if (b) openVolume(+b.dataset.vol); });
  spinesEl.addEventListener('keydown', e => {
    const b = e.target.closest('.spine-btn'); if (!b) return;
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (d) { e.preventDefault(); spinesEl.children[(+b.dataset.vol + d + 26) % 26].focus(); }
  });
  /* ---------- poking things ---------- */
  const toysEl = $('toys');
  let sayT;
  function say(html, x, y, below) { showTip(html, x, y, below); clearTimeout(sayT); sayT = setTimeout(hideTip, 1800); }
  const catReact = (kind, dur, mark = '') => { if (motionOK()) fx.cat = { kind, t: performance.now(), dur, mark }; };
  function pokeCat() {
    const now = performance.now();
    fx.catPokes = now - fx.catLast > 6000 ? 1 : fx.catPokes + 1; fx.catLast = now;
    const at = [SPOTS.catHead.x + 8, SPOTS.cat.y - 15]; // high enough to leave room for its ? and ! bubbles
    if (fx.catPokes === 1) { catReact('purr', 1600); say('<b>prrr…</b>', ...at); }
    else if (fx.catPokes === 2) { catReact('one', 1900, '?'); say('<b>mrrp?</b>', ...at); }
    else if (fx.catPokes === 3) { catReact('both', 2300, '!'); say('<b>…fine.</b> i’m up.', ...at); }
    else { fx.cat = null; say('it’s ignoring you now.', ...at); }
  }
  catSpot.addEventListener('pointerenter', () => { if (!busy) showTip('poke the cat', SPOTS.catHead.x + 8, SPOTS.cat.y - 15); });
  catSpot.addEventListener('pointerleave', hideTip);
  catSpot.addEventListener('click', () => { pokeCat(); settle(); frame(); });

  // Every other trinket: where it sits (art pixels), what hovering says, and what a poke does.
  const TOYS = [
    { at: [262, 34, 31, 30], hint: () => fx.lampOff ? 'turn the lamp on' : 'turn the lamp off', toggle: () => fx.lampOff,
      poke: () => { fx.lampOff = !fx.lampOff; fx.chain = performance.now(); return fx.lampOff ? 'night mode.' : 'lamp on.'; } },
    { at: [197, 21, 62, 70], hint: () => 'tap the glass',
      poke: () => { fx.flash = performance.now(); setTimeout(() => { catReact('both', 1300, '!'); say('<b>rumble…</b>', 228, 20); }, 420); return ''; } },
    { at: [49, 16, 11, 14], hint: () => 'shake the snow globe', poke: () => { fx.globe = performance.now(); return 'snow day.'; } },
    { at: [61, 17, 9, 13], hint: () => 'flip the hourglass', poke: () => { fx.glass = performance.now(); return 'seven seconds.'; } },
    { at: [73, 13, 18, 17], hint: () => fx.radio ? 'turn the radio off' : 'turn the radio on', toggle: () => fx.radio,
      poke: () => { fx.radio = !fx.radio; return fx.radio ? 'lo-fi, very quietly.' : 'radio off.'; } },
    { at: () => SHELF.candle && [SHELF.candle.x - 4, SHELF.candle.y - 4, 9, 16], hint: () => fx.candleOut ? 'light the candle' : 'blow out the candle', toggle: () => !fx.candleOut,
      poke: () => { fx.candleOut = !fx.candleOut; fx.candleT = performance.now(); return fx.candleOut ? 'poof.' : 'there.'; } },
    { at: [243, 157, 16, 12], hint: () => 'roll the yarn',
      poke: () => { fx.yarn = performance.now(); setTimeout(() => catReact('one', 2200, '!'), 300); return 'the cat noticed.'; } },
    { at: [286, 66, 33, 54], hint: () => 'poke the monstera', poke: () => { fx.plant = performance.now(); return 'rustle rustle.'; } },
    { at: [262, 100, 18, 22], hint: () => 'his tea', poke: () => { fx.mug = performance.now(); return 'still warm.'; } },
  ];
  const toyAt = toy => typeof toy.at === 'function' ? toy.at() : toy.at;
  // Without motion there is no next frame, so skip straight to each toy's resting state.
  function settle() {
    if (motionOK()) return;
    fx.flash = fx.globe = fx.glass = fx.yarn = fx.plant = fx.mug = fx.chain = fx.candleT = -1e9;
    fx.cat = null;
  }
  const toyTip = (toy, html, speak) => { const [x, y, w, h] = toyAt(toy), below = y < 40; (speak ? say : showTip)(html, x + w / 2, below ? y + h : y, below); };
  toysEl.addEventListener('pointerover', e => { const b = e.target.closest('.toy'); if (!b || busy) return; const toy = TOYS[+b.dataset.toy]; toyTip(toy, toy.hint()); });
  toysEl.addEventListener('focusin', e => { const b = e.target.closest('.toy'); if (!b) return; const toy = TOYS[+b.dataset.toy]; toyTip(toy, toy.hint()); });
  toysEl.addEventListener('pointerout', e => { if (e.target.closest('.toy')) hideTip(); });
  toysEl.addEventListener('focusout', hideTip);
  toysEl.addEventListener('click', e => {
    const b = e.target.closest('.toy'); if (!b) return;
    const toy = TOYS[+b.dataset.toy], line = toy.poke();
    if (line) toyTip(toy, line, true);
    b.setAttribute('aria-label', toy.hint());
    if (toy.toggle) b.setAttribute('aria-pressed', String(toy.toggle()));
    settle(); frame();
  });
  const readerTip = () => showTip('<b>shh.</b> peek at his page', SPOTS.reader.x + SPOTS.reader.w / 2, SPOTS.reader.y);
  readerSpot.addEventListener('pointerenter', () => { if (!busy) readerTip(); });
  readerSpot.addEventListener('focus', readerTip);
  readerSpot.addEventListener('pointerleave', hideTip);
  readerSpot.addEventListener('blur', hideTip);
  readerSpot.addEventListener('click', () => {
    if (!people.length) return;
    hideTip(); pageTurn = performance.now() / 1000 - 8.2;
    const p = people[Math.floor(Math.random() * people.length)];
    setTimeout(() => openPerson(p), motionOK() ? 900 : 0);
  });

  /* ---------- search ---------- */
  const q = $('q'), results = $('results'), list = $('results-list'), foot = $('results-foot');
  let found = [], active = 0, items = [];
  function search(value) {
    const toks = fold(value).split(/\s+/).filter(Boolean);
    volumes.forEach(v => { v.hits = 0; });
    if (!toks.length) { matches = null; found = []; items = []; results.hidden = true; q.setAttribute('aria-expanded', 'false'); frame(); return; }
    const first = toks[0];
    found = people.filter(p => toks.every(t => p.hay.includes(t))).map(p => ({ p, s: p.flast.startsWith(first) ? 0 : p.fname.startsWith(first) ? 1 : p.fname.includes(first) ? 2 : p.forg.includes(first) ? 3 : 4 }))
      .sort((a, b) => a.s - b.s || a.p.flast.localeCompare(b.p.flast)).map(x => x.p);
    // "yc", "vc", "exits"…: the tag's people lead, and mark their volumes on the shelf
    const tag = exactCollection(value);
    if (tag) found = people.filter(tag.test).sort((a, b) => a.flast.localeCompare(b.flast));
    matches = new Set(found.map(p => p.id));
    for (const p of found) volumes[p.vol].hits++;
    active = 0;
    renderResults();
    frame();
  }
  const BOOK_ICON = '<span class="r-book-icon" aria-hidden="true"></span>';
  function renderResults() {
    const books = matchCollections(q.value).slice(0, 2).map(c => ({ kind: 'book', c, n: people.filter(c.test).length }));
    const bind = found.length > 1 && found.length <= 800 && !(books[0] && books[0].n === found.length) ? [{ kind: 'bind' }] : [];
    items = [...books, ...found.slice(0, 6).map(p => ({ kind: 'person', p })), ...bind];
    list.innerHTML = items.map((it, i) => {
      const li = `<li role="option" id="opt-${i}" aria-selected="${i === active}"${it.kind === 'person' ? '' : ' class="r-book"'}><button type="button" tabindex="-1" data-item="${i}">`;
      if (it.kind === 'book') return `${li}<span class="r-name">Compile the ${esc(it.c.title)} book</span>${BOOK_ICON}<span class="r-meta">${it.n} people, bound by surname</span></button></li>`;
      if (it.kind === 'bind') return `${li}<span class="r-name">Bind all ${found.length.toLocaleString()} into a book</span>${BOOK_ICON}<span class="r-meta">“${esc(q.value.trim())}”</span></button></li>`;
      const p = it.p;
      return `${li}<span class="r-name">${esc(p.raw.name)}</span><span class="r-vol" aria-label="Volume ${p.letter}">${p.letter}</span><span class="r-meta">${esc([p.raw.role, p.raw.organization].filter(Boolean).join(' · '))}</span></button></li>`;
    }).join('');
    const vols = volumes.filter(v => v.hits).length;
    foot.textContent = found.length ? `${found.length.toLocaleString()} ${found.length === 1 ? 'person' : 'people'} in ${vols} ${vols === 1 ? 'volume' : 'volumes'}. Marked volumes hold a match.` : 'Nobody on the shelves matches that yet.';
    results.hidden = false;
    q.setAttribute('aria-expanded', 'true');
    q.setAttribute('aria-activedescendant', items.length ? `opt-${active}` : '');
  }
  async function openBook(v) {
    if (busy || !v.people.length) return;
    if (book.open) await closeBook();
    await openVolume(v, null, q);
  }
  function choose(it) {
    if (!it) return;
    results.hidden = true; q.blur();
    if (it.kind === 'person') openPerson(it.p, q);
    else if (it.kind === 'book') openBook(collectionBook(it.c));
    else openBook(compileBook(q.value.trim(), found, 'find:' + q.value.trim()));
  }
  q.addEventListener('input', () => search(q.value));
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = items.length; if (!n) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; renderResults();
    } else if (e.key === 'Enter') {
      if (items[active]) { e.preventDefault(); choose(items[active]); }
    } else if (e.key === 'Escape') {
      if (q.value) { q.value = ''; search(''); } else q.blur();
    }
  });
  q.addEventListener('focus', () => { if (found.length || q.value) renderResults(); });
  q.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== q) { results.hidden = true; q.setAttribute('aria-expanded', 'false'); } }, 150));
  list.addEventListener('pointerdown', e => e.preventDefault());
  list.addEventListener('click', e => { const b = e.target.closest('button[data-item]'); if (b) choose(items[+b.dataset.item]); });

  /* ---------- the book ---------- */
  const reader = $('reader'), scrim = $('reader-scrim'), bookEl = $('book'), spread = $('spread'), boards = $('boards');
  const pageL = $('page-left'), pageR = $('page-right'), indexEl = $('index'), entryEl = $('entry'), flyer = $('flyer');
  const toIndex = $('to-index'), closeBtn = $('book-close');
  let returnFocus = null;
  function roomInert(value) {
    for (const el of document.querySelectorAll('#stage, .room-head, #catalog, #mcp')) el.inert = value;
    panHint.hidden = value || panned || !stage.classList.contains('pan');
  }

  function metrics() {
    const vw = innerWidth, vh = innerHeight, single = vw < 760, u = S;
    let ph = Math.min(vh - (single ? 112 : 126), 640), pw = single ? Math.min(vw - 36, 470) : Math.min((vw - 96) / 2, 470);
    ph = Math.floor(ph / u) * u; pw = Math.floor(pw / u) * u;
    return { pw, ph, single, u, cw: pw + 3 * u, ch: ph + 6 * u };
  }
  function applyMetrics(m, v) {
    book.m = m; book.single = m.single;
    const st = bookEl.style;
    st.setProperty('--pw', m.pw + 'px'); st.setProperty('--ph', m.ph + 'px'); st.setProperty('--bw', (m.single ? m.pw : m.pw * 2) + 'px');
    st.setProperty('--vol', v.c); st.setProperty('--vol-dark', v.cd);
    bookEl.classList.toggle('single', m.single);
  }
  function coverCanvas(v, m) {
    const cw = Math.round(m.cw / m.u), ch = Math.round(m.ch / m.u);
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const prev = X; X = c.getContext('2d');
    R(0, 0, cw, ch, C.ink); R(1, 1, cw - 2, ch - 2, v.c);
    for (let j = 1; j < ch - 1; j++) for (let i = 1; i < cw - 1; i++) if (bayer(i * 3, j * 5) < 0.08) P(i, j, v.cd);
    R(1, 1, 3, ch - 2, v.cd); R(4, 1, 1, ch - 2, v.cl);
    const ink = v.light ? '#3a2614' : C.foil;
    const fx = 9, fy = 7, fw = cw - 15, fh = ch - 14;
    const box = (x, y, w, h) => { R(x, y, w, 1, ink); R(x, y + h - 1, w, 1, ink); R(x, y, 1, h, ink); R(x + w - 1, y, 1, h, ink); };
    box(fx, fy, fw, fh); box(fx + 2, fy + 2, fw - 4, fh - 4);
    for (const [ox, oy] of [[fx, fy], [fx + fw - 1, fy], [fx, fy + fh - 1], [fx + fw - 1, fy + fh - 1]]) { P(ox, oy - 1, ink); P(ox - 1, oy, ink); P(ox + 1, oy, ink); P(ox, oy + 1, ink); }
    const mid = fx + fw / 2, k = Math.max(3, Math.min(Math.floor(fw * 0.4 / 5), Math.floor(fh * 0.32 / 7)));
    const kicker = v.custom ? 'COMPILED' : 'VOLUME';
    text(kicker, Math.round(mid - textW(kicker) / 2), Math.round(fy + fh * 0.18), ink);
    const ly = Math.round(fy + fh * 0.27);
    big(v.letter, Math.round(mid - 5 * k / 2) + Math.max(1, k >> 2), ly + Math.max(1, k >> 2), v.cd, k);
    big(v.letter, Math.round(mid - 5 * k / 2), ly, ink, k);
    const count = `${v.people.length} PEOPLE`;
    let ry = ly + 7 * k + 9;
    if (v.custom) {
      // the title, word-wrapped onto the cover in the pixel face
      const words = fold(v.title).toUpperCase().replace(/[^A-Z0-9 -]/g, ' ').split(/\s+/).filter(Boolean), lines = [''];
      for (const w of words) { const next = (lines[lines.length - 1] + ' ' + w).trim(); if (textW(next) < fw - 10 || !lines[lines.length - 1]) lines[lines.length - 1] = next; else lines.push(w); }
      for (const line of lines.slice(0, 3)) { if (textW(line) < fw - 6) text(line, Math.round(mid - textW(line) / 2), ry, ink); ry += 8; }
      text(count, Math.round(mid - textW(count) / 2), ry + 3, ink);
    } else {
      const end = (p, n) => fold(p?.last || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, n);
      const span = n => `${end(v.people[0], n)}-${end(v.people[v.people.length - 1], n)}`;
      const range = textW(span(12)) < fw - 8 ? span(12) : span(8);
      if (textW(range) < fw - 8) text(range, Math.round(mid - textW(range) / 2), ry, ink);
      text(count, Math.round(mid - textW(count) / 2), ry + 9, ink);
    }
    const brand = 'THE READING ROOM';
    if (textW(brand) < fw - 8) text(brand, Math.round(mid - textW(brand) / 2), fy + fh - 11, ink);
    X = prev;
    return c;
  }
  function spineCanvas(v) {
    const c = document.createElement('canvas'); c.width = v.w; c.height = v.h;
    c.getContext('2d').drawImage(room, ax + v.x, ay + v.y - v.lift, v.w, v.h, 0, 0, v.w, v.h);
    return c;
  }
  const T = (tx, ty, sx, sy, deg) => `perspective(1400px) translate(${tx}px, ${ty}px) scale(${sx}, ${sy}) rotateY(${deg}deg)`;
  const anim = (el, frames, opts) => el.animate(frames, { fill: 'forwards', ...opts }).finished;
  // The closed book sits where the open spread's hinged cover will be, so the hand-off is seamless.
  function flight(v, m) {
    const rect = bookEl.getBoundingClientRect();
    const left = book.single ? rect.left : rect.left + m.pw / 2, top = rect.top - 3 * m.u;
    let rw, rh, rx, ry;
    if (v.custom) { const r = q.getBoundingClientRect(); rw = 44; rh = 62; rx = r.left + r.width / 2 - rw / 2; ry = r.top + r.height / 2 - rh / 2; }
    else { rw = v.w * S; rh = v.h * S; rx = (ax + v.x) * S - panX(); ry = (ay + v.y) * S; }
    const sx = rw / m.cw, sy = rh / m.ch, tx = rx + rw / 2 - (left + m.cw / 2), ty = ry + rh / 2 - (top + m.ch / 2);
    Object.assign(flyer.style, { width: m.cw + 'px', height: m.ch + 'px', left: left + 'px', top: top + 'px' });
    return { rh, start: [tx, ty, sx, sy], mid: [tx * 0.4, ty * 0.4 - 30, sx + (1 - sx) * 0.42, sy + (1 - sy) * 0.42] };
  }
  // cloneNode copies a canvas element but not its pixels, so the copies are painted by hand.
  function cloneWithCanvas(el) {
    const copy = el.cloneNode(true), from = el.querySelectorAll('canvas');
    copy.querySelectorAll('canvas').forEach((c, i) => c.getContext('2d').drawImage(from[i], 0, 0));
    copy.removeAttribute('id'); copy.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    return copy;
  }
  function hingedLeaf(cover, fromOpen) {
    const leaf = document.createElement('div'); leaf.className = 'leaf'; leaf.inert = true; leaf.setAttribute('aria-hidden', 'true');
    const back = document.createElement('div'); back.className = 'face back';
    const ghost = cloneWithCanvas(pageL); ghost.className = 'page ghost';
    back.append(ghost);
    if (book.single) { back.style.background = 'transparent'; ghost.style.visibility = 'hidden'; }
    const front = face(cover, 'front');
    leaf.append(front, back);
    if (fromOpen) leaf.style.transform = 'rotateY(-180deg)';
    spread.append(leaf);
    return { leaf, faces: [front, back] };
  }
  function swing(h, open, duration) {
    const turn = open ? ['rotateY(0deg)', 'rotateY(-90deg)', 'rotateY(-180deg)'] : ['rotateY(-180deg)', 'rotateY(-90deg)', 'rotateY(0deg)'];
    const easing = 'cubic-bezier(.45,.05,.25,1)';
    for (const f of h.faces) f.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.7)' }, { filter: 'brightness(1)' }], { duration, easing });
    return anim(h.leaf, turn.map(transform => ({ transform })), { duration, easing });
  }
  function face(canvas, cls = '') { const d = document.createElement('div'); d.className = 'face ' + cls; d.append(canvas); return d; }

  function fillIndex(v) {
    $('vol-title').innerHTML = `<span class="sr-only">${v.custom ? esc(v.title) : `Volume ${v.letter}`}</span>`;
    $('vol-title').append(letterCanvas(v.letter, v.c));
    bookEl.querySelector('.vol-kicker').textContent = v.custom ? 'Compiled' : 'Volume';
    const a = v.people[0], z = v.people[v.people.length - 1];
    const count = `${v.people.length.toLocaleString()} ${v.people.length === 1 ? 'person' : 'people'}`;
    $('vol-range').textContent = v.custom ? `${count} · ${v.title}` : `${count} · ${a ? a.last : ''} to ${z ? z.last : ''}`;
    const mark = p => !v.custom && matches && matches.has(p.id) ? ' class="hit-name"' : '';
    indexEl.innerHTML = v.people.map((p, i) => `<li><button type="button" data-n="${i}"${mark(p)}><span class="i-name">${esc(p.display)}</span><span class="i-org">${esc(p.raw.organization)}</span></button></li>`).join('');
  }
  function markIndex() {
    for (const b of indexEl.querySelectorAll('button')) b.toggleAttribute('aria-current', +b.dataset.n === book.person);
    const cur = indexEl.querySelector('[aria-current]');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  function titlePage(v) {
    const k = v.kinds, parts = [['Founder', 'founder'], ['Investor', 'investor'], ['Operator', 'operator']].filter(([key]) => k[key]).map(([key, n]) => `${k[key]} ${n}${k[key] === 1 ? '' : 's'}`);
    return `<div class="title-page"><p class="tp-letter" data-letter="${v.letter}"><span class="sr-only">${v.custom ? 'Compiled book' : `Volume ${v.letter}`}</span></p>${v.custom ? `<p class="tp-title">${esc(v.title)}</p>` : ''}<p class="tp-count">${v.people.length.toLocaleString()} ${v.people.length === 1 ? 'person' : 'people'}</p><p class="tp-kinds">${parts.join(' · ')}</p><p class="tp-hint">Choose a name from the index, or turn the page with <kbd>→</kbd>.</p></div>`;
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const when = d => { const m = /^(\d{4})(?:-(\d{2}))?/.exec(String(d || '')); return !m ? esc(d || '') : m[2] ? `${MONTHS[+m[2] - 1]} ${m[1]}` : m[1]; };
  const human = s => String(s || '').replace(/_/g, ' ');
  // Everything the database knows about a person, laid out as a readable page; each claim cites its source.
  function personPage(p) {
    const r = p.raw, v = volumes[p.vol], cited = [];
    const cite = url => {
      if (!safeURL(url) || url.startsWith('/')) return '';
      let n = cited.indexOf(url) + 1; if (!n) { cited.push(url); n = cited.length; }
      return `<a class="cite" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Source ${n}">${n}</a>`;
    };
    const role = r.role && r.organization && !r.role.toLowerCase().includes(r.organization.toLowerCase()) ? `${r.role} · ${r.organization}` : (r.role || r.organization);
    const asOf = r.role_as_of ? ` <span class="e-asof">as of ${esc(r.role_as_of)}</span>` : '';
    const initials = ((p.first ? p.first[0] : '') + p.last[0]).toUpperCase();
    const roleCite = cite(r.role_source_url);
    const lead = `${esc(r.why_relevant)}${cite(r.source_url)}`;
    const place = [r.location_city, r.location_region, r.location_country === 'United States' && r.location_city ? '' : r.location_country].filter(Boolean).join(', ') || (r.region && r.region !== 'Not listed' ? r.region : '');
    const tags = (r.tags || []).map(t => { const c = COLLECTIONS.find(x => x.tag === t); return c ? `<button type="button" class="tag-chip" data-book="${c.slug}" title="Open the ${esc(c.title)} book">${esc(t)}</button>` : `<span class="tag-chip">${esc(t)}</span>`; }).join('');
    const facts = [
      ['Purdue', r.connection && `${esc(r.connection)}${cite(r.connection_source_url)}`],
      ['Based', place && `${esc(place)}${r.location_as_of ? ` <span class="e-asof">(${esc(r.location_as_of)})</span>` : ''}${cite(r.location_source_url)}`],
      ['Company HQ', r.company_location?.location && `${esc(r.company_location.location)}${cite(r.company_location.source_url)}`],
      ['Shelved as', esc(r.kind)],
      ['Tags', tags],
    ].filter(([, val]) => val);
    const milestones = [
      ...(r.highlights || []).map(h => ({ d: h.date, html: `${esc(h.claim)}${cite(h.source_url)}` })),
      ...(r.capital_events || []).map(e => ({ d: e.date, html: `<b>${esc(human(e.type).replace(/^./, c => c.toUpperCase()))}.</b> ${esc(e.description || e.company || '')}${e.amount ? ` (${esc(e.amount)})` : ''}${cite(e.source_url)}` })),
    ].sort((a, b) => String(b.d || '').localeCompare(String(a.d || '')));
    const sp = r.startup_profile || {}, fs = sp.field_sources || {};
    const company = sp.company_name || r.company;
    const product = r.company_product || sp.product_summary;
    const companyRows = [
      ['Makes', product && `${esc(product)}${cite(r.company_product_source_url || fs.product_summary)}`],
      ['Sector', (r.company_sector || sp.sector) && `${esc(r.company_sector || sp.sector)}${cite(r.company_sector_source_url || fs.sector)}`],
      ['Founded', (r.company_founded_year || sp.founded_year) && `${esc(r.company_founded_year || sp.founded_year)}${cite(r.company_founded_year_source_url || fs.founded_year)}`],
      ['Status', sp.exit_status && esc(human(sp.exit_status))],
      ...(r.funding || []).map(f => ['Funding', `${esc(f.amount)}${f.round ? `, ${esc(f.round)}` : ''}${f.date ? ` <span class="e-asof">· ${when(f.date)}</span>` : ''}${cite(f.source_url)}`]),
    ].filter(([, val]) => val);
    const site = safeURL(r.company_website || sp.company_url);
    const career = (r.affiliations || []).map(a => `<li>${esc(a.role)}${a.organization ? `, <b>${esc(a.organization)}</b>` : ''} <span class="e-asof">· ${a.status === 'historical' ? 'earlier role' : 'current'}${a.as_of ? `, as of ${esc(a.as_of)}` : ''}</span>${cite(a.source_url)}</li>`).join('');
    const school = (r.education || []).map(e => `<li><b>${esc(e.institution || 'Purdue University')}</b>${[e.degree, e.field].filter(Boolean).length ? `, ${esc([e.degree, e.field].filter(Boolean).join(' in '))}` : ''}${e.graduation_year ? ` <span class="e-asof">· ${esc(e.graduation_year)}</span>` : ''}${e.completion_status === 'attended_no_degree' ? ' <span class="e-asof">attended, no degree</span>' : e.completion_status === 'attended_status_unknown' ? ' <span class="e-asof">attended</span>' : ''}${cite(e.source_url)}</li>`).join('');
    const notes = Object.values(r.flag_notes || {}).filter(Boolean);
    const links = [[site, 'Website'], [r.x, 'X']].filter(([u]) => safeURL(u))
      .map(([u, t]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`).join('');
    // A verified profile links straight to it; otherwise the button is an honest LinkedIn people search.
    const linkedin = safeURL(r.linkedin)
      ? `<a class="li-btn" href="${esc(r.linkedin)}" target="_blank" rel="noopener noreferrer"><span class="li-in" aria-hidden="true">in</span>LinkedIn</a>`
      : `<a class="li-btn li-search" href="https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent([r.name, r.organization].filter(Boolean).join(' '))}" target="_blank" rel="noopener noreferrer" title="Search LinkedIn for ${esc(r.name)}"><span class="li-in" aria-hidden="true">in</span>Find on LinkedIn</a>`;
    const section = (title, body) => body ? `<section class="e-sec"><h3>${title}</h3>${body}</section>` : '';
    const dl = rows => `<dl class="facts">${rows.map(([k, val]) => `<dt>${k}</dt><dd>${val}</dd>`).join('')}</dl>`;
    const sources = cited.map((u, i) => { let host = u; try { const x = new URL(u); host = x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? x.pathname.replace(/\/$/, '').slice(0, 38) : ''); } catch {} return `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer"><span>${i + 1}</span>${esc(host)}</a></li>`; });
    return `<article class="person">
      <header class="e-top"><div class="stamp" data-img="${esc(r.image || '')}" aria-hidden="true"><span>${esc(initials)}</span></div>
        <div><h2 class="e-name">${esc(r.name)}</h2><p class="e-role">${esc(role)}${asOf}${roleCite}</p>${linkedin}</div></header>
      <p class="e-why">${lead}</p>
      ${dl(facts)}
      ${section('Milestones', milestones.length ? `<ul class="e-list">${milestones.map(m => `<li>${m.d ? `<span class="e-when">${when(m.d)}</span>` : ''}${m.html}</li>`).join('')}</ul>` : '')}
      ${section(company ? `The company: ${esc(company)}` : 'The company', companyRows.length ? dl(companyRows) : '')}
      ${section('Career', career && `<ul class="e-list">${career}</ul>`)}
      ${section('Education', school && `<ul class="e-list">${school}</ul>`)}
      ${notes.length ? `<p class="e-note">${notes.map(esc).join(' ')}</p>` : ''}
      ${links ? `<nav class="e-links" aria-label="Links for ${esc(r.name)}">${links}</nav>` : ''}
      ${section('Sources', sources.length ? `<ol class="e-sources">${sources.join('')}</ol>` : '')}
      <footer class="e-foot"><span>${book.v && book.v.custom ? `${esc(book.v.title)}, p. ${book.person + 1} of ${book.v.people.length} · shelved in Vol. ${v.letter}` : `Vol. ${v.letter}, p. ${p.n + 1} of ${v.people.length}`}</span><span>Checked ${esc(r.verified_at || '')}</span></footer>
    </article>`;
  }
  // Portraits get the same treatment as the room: a small dithered pixel picture.
  function paintStamp(root) {
    const st = root.querySelector('.stamp[data-img]');
    if (!st || !safeURL(st.dataset.img)) return;
    const img = new Image(); img.decoding = 'async';
    img.onload = () => {
      const n = 28, c = document.createElement('canvas'); c.width = n; c.height = n;
      const x = c.getContext('2d'), s = Math.min(img.width, img.height);
      x.drawImage(img, (img.width - s) / 2, (img.height - s) / 4, s, s, 0, 0, n, n);
      const d = x.getImageData(0, 0, n, n), tones = ['#1b1110', '#5b3a2a', '#b98f62', '#f1e2c2'].map(rgb);
      for (let i = 0; i < n * n; i++) {
        const k = i * 4, lum = (d.data[k] * 0.3 + d.data[k + 1] * 0.59 + d.data[k + 2] * 0.11) / 255;
        const q = Math.max(0, Math.min(3, Math.floor(lum * 3.3 + bayer(i % n, (i / n) | 0) - 0.45)));
        [d.data[k], d.data[k + 1], d.data[k + 2]] = tones[q];
      }
      x.putImageData(d, 0, 0);
      st.replaceChildren(c); st.classList.add('has-photo');
    };
    img.src = st.dataset.img;
  }
  function renderEntry() {
    const v = book.v;
    entryEl.innerHTML = book.person < 0 ? titlePage(v) : personPage(v.people[book.person]);
    entryEl.querySelector('.tp-letter')?.append(letterCanvas(v.letter, v.c));
    paintStamp(entryEl);
    entryEl.scrollTop = 0;
    $('previous-person').disabled = book.person < 0;
    $('next-person').disabled = book.person >= v.people.length - 1;
  }
  function setView(view) {
    book.view = view;
    bookEl.dataset.view = view;
    toIndex.hidden = !(book.single && view === 'entry');
  }
  function syncURL() {
    const v = book.v, p = book.open && book.person >= 0 ? v.people[book.person] : null, path = location.pathname;
    if (!book.open) return history.replaceState(null, '', path);
    if (v.custom) {
      const params = new URLSearchParams(v.slug.startsWith('find:') ? { find: v.slug.slice(5) } : { book: v.slug });
      if (p) params.set('person', p.id);
      return history.replaceState(null, '', `${path}?${params}`);
    }
    history.replaceState(null, '', p ? `${path}?person=${encodeURIComponent(p.id)}` : `${path}#${v.letter}`);
  }

  async function openVolume(vi, person = null, from = null) {
    if (busy || book.open) return;
    busy = true; hideTip(); hovered = -1;
    const v = typeof vi === 'number' ? volumes[vi] : vi, m = metrics();
    returnFocus = from || (document.activeElement === q || v.custom ? q : spinesEl.children[v.i]);
    roomInert(true);
    book.v = v; book.vol = v.custom ? -1 : v.i; book.person = person ? v.people.indexOf(person) : -1;
    applyMetrics(m, v);
    fillIndex(v); renderEntry();
    setView(book.single && person ? 'entry' : 'index');
    const cover = coverCanvas(v, m);
    frame();
    book.spine = v.custom ? null : spineCanvas(v);
    reader.hidden = false; bookEl.tabIndex = -1; bookEl.focus({ preventScroll: true }); spread.style.visibility = 'hidden'; bookEl.classList.remove('ready');
    const shift = book.single ? 0 : -m.pw / 2;
    spread.style.transform = `translateX(${shift}px)`;
    const f = flight(v, m);
    const fc = face(cover), fs = v.custom ? null : face(book.spine);
    flyer.replaceChildren(...[fs, fc].filter(Boolean));
    if (v.custom) { fc.style.transform = T(...f.start, -30); fc.style.opacity = '0'; }
    else {
      fc.style.transform = T(0, 0, 1, 1, -89.5); // exactly 90deg is a degenerate matrix that Firefox paints flat
      fc.style.visibility = 'hidden';
      fs.style.transform = T(...f.start, 0);
    }
    flyer.hidden = false;
    if (!v.custom) { v.out = true; frame(); }
    const motion = motionOK();
    scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion ? 700 : 1, fill: 'forwards' });
    if (motion && v.custom) {
      // a compiled book is bound out of the search box: it grows, tilts and settles
      await anim(fc, [
        { transform: T(...f.start, -30), opacity: 0 },
        { transform: T(...f.mid, -14), opacity: 1, offset: 0.4 },
        { transform: T(0, 0, 1, 1, 0), opacity: 1 },
      ], { duration: 820, easing: 'cubic-bezier(.2,.7,.25,1)' });
    } else if (motion) {
      const [tx, ty, sx, sy] = f.start;
      await anim(fs, [
        { transform: T(tx, ty, sx, sy, 0) },
        { transform: T(tx, ty - f.rh * 0.55, sx, sy, 0), offset: 0.32, easing: 'cubic-bezier(.4,0,.6,1)' },
        { transform: T(...f.mid, 88) },
      ], { duration: 580, easing: 'cubic-bezier(.3,.05,.4,1)' });
      fs.remove();
      fc.style.visibility = '';
      await anim(fc, [{ transform: T(...f.mid, -88) }, { transform: T(0, 0, 1, 1, 0) }], { duration: 400, easing: 'cubic-bezier(.15,.7,.25,1)' });
    }
    const h = hingedLeaf(cover, false);
    spread.style.visibility = 'visible';
    flyer.hidden = true; flyer.replaceChildren();
    pageL.style.visibility = 'hidden';
    boards.style.clipPath = book.single ? '' : 'inset(0 0 0 50%)';
    if (motion) {
      spread.animate([{ transform: `translateX(${shift}px)` }, { transform: 'translateX(0)' }], { duration: 800, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
      await swing(h, true, 800);
    }
    for (const a of spread.getAnimations()) a.cancel();
    spread.style.transform = '';
    h.leaf.remove();
    pageL.style.visibility = '';
    boards.style.clipPath = '';
    bookEl.classList.add('ready');
    book.open = true; busy = false;
    markIndex(); syncURL();
    (book.single && book.view === 'entry' ? closeBtn : (indexEl.querySelector('[aria-current]') || indexEl.querySelector('button') || closeBtn)).focus({ preventScroll: true });
  }

  async function closeBook() {
    if (busy || !book.open) return;
    busy = true;
    const v = book.v, m = book.m, motion = motionOK();
    const cover = coverCanvas(v, m);
    bookEl.classList.remove('ready');
    if (motion) {
      const h = hingedLeaf(cover, true);
      pageL.style.visibility = 'hidden';
      boards.style.clipPath = book.single ? '' : 'inset(0 0 0 50%)';
      const shift = book.single ? 0 : -m.pw / 2;
      spread.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${shift}px)` }], { duration: 660, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
      await swing(h, false, 660);
      const f = flight(v, m);
      if (v.custom) {
        // compiled books go back where they came from: shrinking into the search box
        const fc = face(cover);
        fc.style.transform = T(0, 0, 1, 1, 0);
        flyer.replaceChildren(fc); flyer.hidden = false;
        spread.style.visibility = 'hidden';
        h.leaf.remove();
        scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 640, fill: 'forwards' });
        await anim(fc, [{ transform: T(0, 0, 1, 1, 0), opacity: 1 }, { transform: T(...f.mid, -14), opacity: 1, offset: 0.55 }, { transform: T(...f.start, -30), opacity: 0 }], { duration: 640, easing: 'cubic-bezier(.5,0,.75,.6)' });
      } else {
      const fc = face(cover), fs = face(book.spine || spineCanvas(v));
      fs.style.transform = T(...f.mid, 88);
      fc.style.transform = T(0, 0, 1, 1, 0);
      flyer.replaceChildren(fs, fc); flyer.hidden = false;
      spread.style.visibility = 'hidden';
      h.leaf.remove();
      scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 720, fill: 'forwards' });
      const [tx, ty, sx, sy] = f.start;
      await anim(fc, [{ transform: T(0, 0, 1, 1, 0) }, { transform: T(...f.mid, -88) }], { duration: 320, easing: 'cubic-bezier(.6,0,.85,.4)' });
      fc.remove();
      await anim(fs, [
        { transform: T(...f.mid, 88) },
        { transform: T(tx, ty - f.rh * 0.55, sx, sy, 0), offset: 0.68, easing: 'cubic-bezier(.4,0,.6,1)' },
        { transform: T(tx, ty, sx, sy, 0) },
      ], { duration: 560, easing: 'cubic-bezier(.2,.6,.35,1)' });
      }
    }
    if (!v.custom) { v.out = false; v.lift = 0; }
    frame();
    flyer.hidden = true; flyer.replaceChildren();
    reader.hidden = true; spread.style.visibility = ''; pageL.style.visibility = ''; boards.style.clipPath = '';
    for (const a of [...spread.getAnimations(), ...scrim.getAnimations()]) a.cancel();
    book.open = false; busy = false; book.person = -1; roomInert(false);
    syncURL();
    if (returnFocus) returnFocus.focus({ preventScroll: true });
  }

  async function turnTo(n, dir) {
    const v = book.v;
    if (busy || n === book.person || n < -1 || n >= v.people.length) return;
    busy = true;
    const motion = motionOK() && dir;
    const page = book.single ? (book.view === 'entry' ? pageR : pageL) : pageR;
    const sheetOf = el => { const s = cloneWithCanvas(el); s.classList.add('sheet'); s.inert = true; s.setAttribute('aria-hidden', 'true'); return s; };
    if (motion && dir > 0) {
      const sheet = sheetOf(page);
      page.after(sheet);
      book.person = n; renderEntry();
      if (book.single) setView('entry');
      await anim(sheet, [{ transform: 'rotateY(0deg)', filter: 'brightness(1)' }, { transform: 'rotateY(-90deg)', filter: 'brightness(.6)' }], { duration: 360, easing: 'cubic-bezier(.5,0,.75,.4)' });
      sheet.remove();
    } else if (motion) {
      // keep the outgoing page underneath until the incoming sheet has swung over it
      const under = sheetOf(page); under.classList.remove('sheet'); under.style.zIndex = 3;
      page.after(under);
      book.person = n; renderEntry();
      if (book.single) setView('entry');
      const sheet = sheetOf(pageR);
      pageR.after(sheet);
      pageR.style.visibility = 'hidden';
      await anim(sheet, [{ transform: 'rotateY(-90deg)', filter: 'brightness(.6)' }, { transform: 'rotateY(0deg)', filter: 'brightness(1)' }], { duration: 360, easing: 'cubic-bezier(.25,.6,.5,1)' });
      pageR.style.visibility = '';
      sheet.remove(); under.remove();
    } else {
      book.person = n; renderEntry();
      if (book.single) setView('entry');
    }
    if (book.single) { entryEl.tabIndex = -1; entryEl.focus({ preventScroll: true }); }
    markIndex(); syncURL();
    busy = false;
  }

  async function openPerson(p, from = null) {
    if (!p) return;
    const at = book.open ? book.v.people.indexOf(p) : -1;
    if (at >= 0) { await turnTo(at, at > book.person ? 1 : -1); return; }
    if (book.open) await closeBook();
    await openVolume(p.vol, p, from);
  }

  indexEl.addEventListener('click', e => {
    const b = e.target.closest('button[data-n]');
    if (!b || busy) return;
    if (+b.dataset.n === book.person && book.single) { setView('entry'); entryEl.tabIndex = -1; entryEl.focus({ preventScroll: true }); }
    else turnTo(+b.dataset.n, +b.dataset.n > book.person ? 1 : -1);
  });
  entryEl.addEventListener('click', e => {
    const chip = e.target.closest('.tag-chip[data-book]'); if (!chip || busy) return;
    const c = COLLECTIONS.find(x => x.slug === chip.dataset.book); if (c) openBook(collectionBook(c));
  });
  closeBtn.addEventListener('click', closeBook);
  $('previous-person').addEventListener('click', () => turnTo(book.person - 1, -1));
  $('next-person').addEventListener('click', () => turnTo(book.person + 1, 1));
  scrim.addEventListener('click', closeBook);
  toIndex.addEventListener('click', () => {
    if (busy) return;
    setView('index'); markIndex();
    (indexEl.querySelector('[aria-current]') || indexEl.querySelector('button'))?.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', e => {
    const typing = e.target === q;
    if (!reader.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeBook(); return; }
      if (typing) return;
      const n = book.v.people.length;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); if (book.person < n - 1) turnTo(book.person + 1, 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); if (book.person > -1) turnTo(book.person - 1, -1); }
      else if (e.key === 'Tab') {
        const f = [...bookEl.querySelectorAll('button:not([hidden]), a[href]')].filter(el => el.offsetParent && getComputedStyle(el).visibility !== 'hidden' && !el.disabled && !el.closest('.ghost, .sheet'));
        if (!f.length) { e.preventDefault(); return; }
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
      }
      return;
    }
    if (e.key === 'Escape' && !mcpCard.hidden) { mcpCard.hidden = true; mcpTag.setAttribute('aria-expanded', 'false'); mcpTag.focus(); return; }
    if (e.key === '/' && !typing) { e.preventDefault(); q.focus(); }
  });

  /* ---------- MCP card ---------- */
  const mcpTag = $('mcp-tag'), mcpCard = $('mcp-card');
  const endpoint = location.origin + '/mcp';
  $('mcp-url').textContent = endpoint;
  $('mcp-cli').textContent = `claude mcp add --transport http purdue-founders ${endpoint}`;
  mcpTag.addEventListener('click', () => { const open = mcpCard.hidden; mcpCard.hidden = !open; mcpTag.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('pointerdown', e => { if (!mcpCard.hidden && !e.target.closest('#mcp')) { mcpCard.hidden = true; mcpTag.setAttribute('aria-expanded', 'false'); } });
  mcpCard.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    try { await navigator.clipboard.writeText($(b.dataset.copy).textContent); b.textContent = 'copied'; }
    catch { getSelection().selectAllChildren($(b.dataset.copy)); b.textContent = 'selected'; }
    setTimeout(() => { b.textContent = 'copy'; }, 1400);
  });

  /* ---------- boot ---------- */
  let resizeT;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      layout();
      if (book.open && !busy) { applyMetrics(metrics(), book.v); setView(book.single && book.person >= 0 ? 'entry' : 'index'); }
    }, 120);
  });
  layout();
  requestAnimationFrame(loop);

  const data = fetch('/alumni.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  Promise.all([data, artReady]).then(([d]) => {
    if (art.naturalWidth) prepareArt();
    shelve(d.alumni || []);
    $('room-sub').textContent = `${people.length.toLocaleString()} Purdue people, A–Z.`;
    layout();
    const params = new URLSearchParams(location.search), id = params.get('person');
    const letter = location.hash.slice(1).toUpperCase();
    const tag = COLLECTIONS.find(c => c.slug === params.get('book')), find = (params.get('find') || '').trim();
    let compiled = tag ? collectionBook(tag) : null;
    if (!compiled && find) { q.value = find; search(find); results.hidden = true; compiled = compileBook(find, found, 'find:' + find); }
    if (compiled && compiled.people.length) openVolume(compiled, byId.get(id) && compiled.people.includes(byId.get(id)) ? byId.get(id) : null, q);
    else if (id && byId.has(id)) openPerson(byId.get(id));
    else if (/^[A-Z]$/.test(letter)) openVolume(letter.charCodeAt(0) - 65);
  }).catch(() => {
    $('room-sub').innerHTML = 'The shelves did not load. Try again in a moment, or read the <a href="/alumni.json">plain data</a>.';
  });
})();
