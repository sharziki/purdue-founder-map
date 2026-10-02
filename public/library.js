/* The Reading Room: every person on the map, shelved A to Z by surname. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOK = () => !motionPreference.matches;
  const safeURL = value => /^(https?:\/\/|\/(?!\/))/.test(value || '') ? value : ''; 
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- palette ---------- */
  const C = {
    ink: '#170f1c', wall0: '#2a2132', wall1: '#382b40', wall2: '#433549', wall3: '#4d3d53',
    wain0: '#1f130d', wain1: '#341f16', wain2: '#43291d', wain3: '#553426',
    floor0: '#26170f', floor1: '#3b2418', floor2: '#4a2e1f', floor3: '#5a3926',
    wood0: '#21120a', wood1: '#3a2112', wood2: '#52301b', wood3: '#6b4024', wood4: '#86532f',
    sky0: '#0e1433', sky1: '#141d45', sky2: '#1c2857', sky3: '#26366b', hill: '#0b1029', tower: '#090d22',
    moon: '#f4e6b8', star: '#fff3d1', starDim: '#8790c2',
    cur0: '#43192a', cur1: '#5c2235', cur2: '#762e42',
    ch0: '#17301f', ch1: '#22452f', ch2: '#2e5c3f', ch3: '#3f7552',
    brass0: '#6e4b20', brass1: '#b0843a', brass2: '#e0b65e',
    shade0: '#b5762f', shade1: '#dba155', shade2: '#f2ca80', bulb: '#fff2c8',
    rug0: '#45202a', rug1: '#672c33', rug2: '#8f4a39', rug3: '#c98f4f', rug4: '#e8c487',
    leaf0: '#14301f', leaf1: '#22502e', leaf2: '#397a3f', leaf3: '#5f9e50',
    pot0: '#6f3320', pot1: '#9d4c2b', pot2: '#c06a3b',
    page: '#f1e4c6', page1: '#e0cda3', page2: '#c4ab7f',
    foil: '#e7c66b', red: '#d2493f', heart: '#e86a7c', flame: '#ffd36b', flame2: '#ff9a3c',
  };
  const CAT = { o: C.ink, b: '#de8a3c', d: '#b4602a', l: '#f2b56c', w: '#f4ead8', p: '#e79a92', e: C.ink, n: '#d9706b' };
  const BOOK = ['#8b2f3b', '#2f6b67', '#c4963f', '#34496f', '#6f8c5c', '#a3542f', '#5c4475', '#b06a76', '#3d6844', '#d4c39c', '#7a4a2c', '#55677e', '#9b3a2c', '#cf8a3a'];
  const LIGHT_BOOKS = new Set(['#c4963f', '#d4c39c', '#cf8a3a']);

  const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const tint = (c, f) => hex(rgb(c).map(v => (f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const bayer = (x, y) => BAYER[((y & 3) << 2) + (x & 3)];
  const hashStr = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = seed => { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };

  /* ---------- pixel font ---------- */
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
    9: ['###', '#.#', '###', '..#', '##.'], '-': ['...', '...', '###', '...', '...'], '·': ['.', '.', '#', '.', '.'], ' ': ['..', '..', '..', '..', '..'],
  };
  const ZZ = ['####', '..#.', '.#..', '####'];
  const HEART = ['.#.#.', '#####', '#####', '.###.', '..#..'];
  const CAT_ROWS = [
    '..o....o....................',
    '.obo..obo......ooooooo......',
    '.obpooopbo...oobbdbbbboo....',
    'obbbbbbbbbo.obbbdbbbdbbbbo..',
    'obbbbbbbbbbobbbbbbbbbdbbbbo.',
    'obebebbebebdbbbbbbbbbbbbbbbo',
    'obbebbbbebbdbbbbbdbbbbbbbbbo',
    'obbbbnbbbbbdbbbbbbdbbbbbbbbo',
    '.olbwwwwbllbbbbbbbbbbbbbbbdo',
    '..owwowwobbbbbbbbbbbbbbbbddo',
    '.oddlllllldllllllldllllldddo',
    '..ooooooooooooooooooooooooo.',
  ];
  const CAT_INHALE = (() => {
    const g = CAT_ROWS.map(r => r.split(''));
    for (let x = 13; x <= 25; x++) {
      const y0 = g.findIndex(r => r[x] !== '.');
      if (y0 < 1) continue;
      g[y0 - 1][x] = 'o';
      g[y0][x] = 'b';
    }
    return g.map(r => r.join(''));
  })();

  /* ---------- canvas plumbing ---------- */
  const room = $('room'), view = room.getContext('2d');
  const buf = document.createElement('canvas'), bufCtx = buf.getContext('2d', { willReadFrequently: true });
  const base = document.createElement('canvas'), baseCtx = base.getContext('2d');
  let X = bufCtx;
  const R = (x, y, w, h, c) => { if (w <= 0 || h <= 0) return; X.fillStyle = c; X.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const P = (x, y, c) => R(x, y, 1, 1, c);
  const ellipse = (cx, cy, rx, ry, c) => {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + 0.5) * (ry + 0.5)))));
      R(cx - w, cy + y, w * 2 + 1, 1, c);
    }
  };
  const rounded = (x, y, w, h, r, c, bottom = true) => {
    for (let j = 0; j < h; j++) {
      let k = -1;
      if (j < r) k = j; else if (bottom && j >= h - r) k = h - 1 - j;
      const inset = k < 0 ? 0 : r - Math.round(Math.sqrt(r * r - (r - k - 0.5) * (r - k - 0.5)));
      R(x + inset, y + j, w - 2 * inset, 1, c);
    }
  };
  const sprite = (rows, x, y, pal) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') P(x + i, y + j, pal[row[i]] || pal); });
  const glyphW = ch => (GLYPH[ch] || GLYPH[' '])[0].length;
  const textW = (s, k = 1) => [...s].reduce((w, ch) => w + (glyphW(ch) + 1) * k, -k);
  const text = (s, x, y, c, k = 1) => {
    for (const ch of s) {
      const g = GLYPH[ch] || GLYPH[' '];
      g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') R(x + i * k, y + j * k, k, k, c); });
      x += (g[0].length + 1) * k;
    }
  };

  /* ---------- state ---------- */
  let S = 4, W = 0, H = 0, L = null;
  let people = [], volumes = [], byId = new Map();
  let warm = null, cool = null, dark = null;
  let hovered = -1, matches = null, catPet = 0, busy = false;
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
      return { letter, i, people: [], c, cd: tint(c, 0.72), cl: tint(c, 1.18), light: LIGHT_BOOKS.has(c), style: h % 4, h: 22 + (h % 7), w: 11, x: 0, y: 0, lift: 0, out: false, hits: 0 };
    });
    people = rows.map(raw => {
      const { last, first } = splitName(raw.name);
      const letter = (fold(last).replace(/[^a-z]/g, '')[0] || fold(raw.name).replace(/[^a-z]/g, '')[0] || 'x').toUpperCase();
      const tags = (raw.tags || []).join(' ');
      return {
        raw, id: raw.id, last, first, letter, display: first ? `${last}, ${first}` : last,
        fname: fold(raw.name), flast: fold(last), forg: fold(raw.organization),
        hay: fold([raw.name, raw.organization, raw.role, raw.region, raw.kind, raw.connection, tags, raw.company_sector, raw.company].join(' ')),
      };
    });
    for (const p of people) volumes[p.letter.charCodeAt(0) - 65].people.push(p);
    const max = Math.max(...volumes.map(v => v.people.length));
    for (const v of volumes) {
      v.people.sort((a, b) => a.flast.localeCompare(b.flast) || fold(a.first).localeCompare(fold(b.first)));
      v.people.forEach((p, n) => { p.vol = v.i; p.n = n; });
      v.w = 9 + Math.round(5 * Math.sqrt(v.people.length / max));
      v.kinds = v.people.reduce((k, p) => (k[p.raw.kind] = (k[p.raw.kind] || 0) + 1, k), {});
    }
    byId = new Map(people.map(p => [p.id, p]));
  }

  /* ---------- layout ---------- */
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    const wide = vw >= 640 && vw / vh >= 0.95;
    S = Math.max(2, wide ? Math.min(Math.floor(vh / 205), Math.floor(vw / 330)) : Math.min(Math.floor(vw / 130), Math.floor(vh / 280)));
    W = Math.ceil(vw / S); H = Math.ceil(vh / S);
    document.documentElement.style.setProperty('--px', S + 'px');
    for (const c of [room, buf, base]) { c.width = W; c.height = H; }
    room.style.width = W * S + 'px'; room.style.height = H * S + 'px';

    const cx = W >> 1;
    const perRow = wide ? [9, 9, 8] : [7, 7, 6, 6];
    const rowH = 33, board = 3;
    const caseW = wide ? 134 : Math.min(W - 10, 120);
    const caseH = 6 + perRow.length * (rowH + board) + 16 + 4;
    const floorY = wide ? H - (vh < 520 ? 16 : Math.round(H * 0.23)) : H - Math.max(56, Math.round(H * 0.2));
    const caseX = cx - (caseW >> 1), caseY = floorY + 3 - caseH;
    const rows = perRow.map((n, r) => {
      const top = caseY + 6 + r * (rowH + board);
      return { n, top, base: top + rowH, x0: caseX + 5, x1: caseX + caseW - 5 };
    });
    L = { wide, cx, floorY, rowH, board, perRow, rows, caseX, caseY, caseW, caseH };

    if (wide) {
      const winW = Math.min(56, caseX - 40);
      L.win = winW >= 30 ? { x: Math.round((caseX - winW) / 2) - 4, y: caseY + 6, w: winW, h: 66 } : null;
      L.plant = { x: caseX - 21, y: floorY + 8 };
      L.chair = { x: caseX + caseW + 14, y: floorY + 16 };
      L.lamp = { kind: 'floor', x: L.chair.x + 66, y: floorY + 14 };
      L.frame = { x: L.chair.x + 12, y: caseY + 12 };
      L.rug = { x: Math.round((cx + L.chair.x + 27) / 2), y: floorY + 24, rx: 74, ry: 9 };
      L.stack = { x: caseX + caseW - 20, y: floorY + 14 };
    } else {
      L.win = null;
      L.chair = { x: W - 58, y: H - 4 };
      L.lamp = { kind: 'table', x: 14, y: H - 6 };
      L.rug = { x: cx, y: H - 9, rx: Math.min(70, (W >> 1) - 6), ry: 6 };
    }
    L.cat = { x: L.chair.x + 13, y: L.chair.y - 30 };
    L.lampLight = L.lamp.kind === 'floor' ? { x: L.lamp.x, y: L.lamp.y - 72, rx: 120, ry: 104 } : { x: L.lamp.x + 1, y: L.lamp.y - 30, rx: 80, ry: 70 };
    placeBooks();
    computeLight();
    drawBase();
    placeSpines();
  }

  function placeBooks() {
    L.candle = null;
    if (!volumes.length) return;
    let i = 0;
    for (const row of L.rows) {
      const vols = volumes.slice(i, i + row.n); i += row.n;
      const avail = row.x1 - row.x0 - 12;
      let total = vols.reduce((s, v) => s + v.w, 0);
      const k = total > avail ? avail / total : 1;
      let x = row.x0 + 1;
      for (const v of vols) {
        v.dw = Math.max(8, Math.floor(v.w * k));
        v.x = x; v.y = row.base - v.h; v.row = row;
        x += v.dw;
      }
      row.deco = x + 2;
    }
    const rl = L.rows[L.rows.length - 1];
    if (rl.x1 - rl.deco >= 8) L.candle = { x: rl.deco + Math.min(10, (rl.x1 - rl.deco) >> 1), y: rl.base - 11, base: rl.base };
  }

  function computeLight() {
    const n = W * H;
    warm = new Uint8Array(n); cool = new Uint8Array(n); dark = new Uint8Array(n);
    const lights = [L.lampLight];
    if (L.candle) lights.push({ x: L.candle.x, y: L.candle.y - 3, rx: 22, ry: 18, k: 0.55 });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = 0;
      for (const l of lights) {
        const dx = (x - l.x) / l.rx, dy = (y - l.y) / l.ry;
        let s = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
        if (l === L.lampLight && y < l.y) s *= 0.55;
        v = Math.max(v, s * (l.k || 1));
      }
      warm[i] = Math.round(Math.min(1, v * 1.25) * 255);
      const ex = (x - W / 2) / (W / 2), ey = (y - H * 0.45) / (H * 0.62);
      dark[i] = Math.round(Math.max(0, Math.min(1, (Math.sqrt(ex * ex + ey * ey) - 0.62) / 0.5)) * 255);
    }
    if (L.win) {
      const { x: wx, w: ww } = L.win;
      for (let y = L.floorY + 2; y < Math.min(H, L.floorY + 24); y++) {
        const t = (y - L.floorY) / 24, sx = Math.round(wx + 4 + t * 26), ex = Math.round(wx + ww - 4 + t * 34);
        for (let x = Math.max(0, sx); x < Math.min(W, ex); x++) cool[y * W + x] = Math.round(255 * (1 - t * 0.7));
      }
    }
  }

  /* ---------- static room ---------- */
  function drawBase() {
    X = baseCtx;
    const { floorY } = L;
    const wainY = floorY - 30;
    R(0, 0, W, wainY, C.wall1);
    for (let y = 4; y < wainY - 2; y += 10) for (let x = Math.floor(y / 10) % 2 ? 7 : 2; x < W; x += 10) {
      P(x, y, C.wall2); P(x - 1, y + 1, C.wall2); P(x + 1, y + 1, C.wall2); P(x, y + 2, C.wall2); P(x, y + 1, C.wall3);
    }
    for (let x = 0; x < W; x += 5) R(x, 0, 1, wainY, C.wall0 + '55');
    // picture rail + wainscot
    R(0, wainY - 3, W, 1, C.wain1); R(0, wainY - 2, W, 2, C.wain3); R(0, wainY, W, 1, C.wain0);
    R(0, wainY + 1, W, floorY - wainY - 1, C.wain2);
    for (let x = 4; x < W; x += 30) { R(x, wainY + 5, 24, floorY - wainY - 12, C.wain1); R(x + 1, wainY + 6, 22, floorY - wainY - 14, C.wain2); R(x + 1, floorY - 8, 22, 1, C.wain3); }
    R(0, floorY - 4, W, 1, C.wain3); R(0, floorY - 3, W, 3, C.wain1); R(0, floorY, W, 1, C.wain0);
    // floor planks
    R(0, floorY + 1, W, H - floorY, C.floor2);
    let y = floorY + 1, row = 0, gap = 5;
    while (y < H) {
      R(0, y, W, 1, C.floor3);
      const r = rng(row * 97 + 13);
      for (let x = Math.floor(r() * 40); x < W; x += 34 + Math.floor(r() * 30)) R(x, y + 1, 1, gap - 1, C.floor1);
      R(0, y + gap - 1, W, 1, C.floor1);
      y += gap; gap = Math.min(10, gap + 1); row++;
    }
    if (L.win) drawWindow();
    if (L.plant) drawFloorPlant(L.plant.x, L.plant.y);
    if (L.frame) drawFrame(L.frame.x, L.frame.y);
    drawRug();
    drawCase();
    if (L.stack) drawStack(L.stack.x, L.stack.y);
    drawChair(L.chair.x, L.chair.y);
    drawLamp();
    X = bufCtx;
  }

  function drawWindow() {
    const { x, y, w, h } = L.win;
    const sky = [C.sky0, C.sky1, C.sky2, C.sky3];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const t = (j / h) * 3 + bayer(i, j) - 0.5;
      P(x + i, y + j, sky[Math.max(0, Math.min(3, Math.round(t)))]);
    }
    // moon
    const mx = x + w - 15, my = y + 13;
    ellipse(mx, my, 5, 5, C.moon); ellipse(mx + 3, my - 2, 4, 4, sky[0]);
    // hills, rooftops and the Bell Tower far away
    const r = rng(7);
    for (let i = 0; i < w; i++) { const hh = 6 + Math.round(Math.sin(i / 7) * 2 + r() * 2); R(x + i, y + h - hh, 1, hh, C.hill); }
    const tx = x + 13, ty = y + h - 40;
    R(tx, ty + 12, 5, 30, C.tower); R(tx - 1, ty + 9, 7, 4, C.tower);
    P(tx + 1, ty + 10, C.sky2); P(tx + 3, ty + 10, C.sky2);
    for (let k = 0; k < 7; k++) R(tx + 2 - Math.floor(k / 2), ty + 2 + k, 1 + 2 * Math.floor(k / 2), 1, C.tower);
    P(tx + 2, ty, C.tower); P(tx + 2, ty + 1, C.tower);
    P(tx + 2, ty + 15, C.flame);
    for (let i = 0; i < 3; i++) R(x + 26 + i * 8, y + h - 9 - (i % 2) * 2, 5, 3, C.hill);
    // frame, mullions, sill
    const f = C.wood3;
    R(x - 3, y - 3, w + 6, 3, f); R(x - 3, y + h, w + 6, 2, f); R(x - 3, y, 3, h, f); R(x + w, y, 3, h, f);
    R(x - 3, y - 3, w + 6, 1, C.wood4); R(x - 4, y - 4, w + 8, 1, C.ink);
    R(x + (w >> 1) - 1, y, 2, h, f); R(x, y + Math.round(h * 0.45), w, 2, f);
    R(x - 6, y + h + 2, w + 12, 3, C.wood4); R(x - 6, y + h + 5, w + 12, 1, C.wood1);
    // little plant on the sill
    R(x + w - 12, y + h - 3, 6, 5, C.pot1); R(x + w - 12, y + h - 3, 6, 1, C.pot2);
    ellipse(x + w - 9, y + h - 6, 4, 2, C.leaf2); P(x + w - 11, y + h - 9, C.leaf3); P(x + w - 7, y + h - 8, C.leaf3); P(x + w - 9, y + h - 10, C.leaf2);
    // curtains
    R(x - 12, y - 8, w + 24, 2, C.brass1); P(x - 13, y - 8, C.brass2); P(x + w + 12, y - 8, C.brass2);
    for (const side of [0, 1]) {
      for (let j = 0; j < h + 14; j++) {
        const pinch = j > h * 0.55 && j < h * 0.7 ? 3 : 0;
        const cw = 11 - pinch;
        const cx0 = side ? x + w + 12 - cw : x - 12;
        for (let i = 0; i < cw; i++) P(cx0 + i, y - 6 + j, [C.cur1, C.cur2, C.cur1, C.cur0][(i + (side ? 1 : 0)) % 4]);
        P(side ? cx0 : cx0 + cw - 1, y - 6 + j, C.cur0);
      }
      R(side ? x + w + 3 : x - 12, y - 6 + Math.round(h * 0.6), 9, 2, C.brass1);
    }
    L.stars = [];
    const sr = rng(41);
    for (let k = 0; k < 18; k++) {
      const sx = x + 1 + Math.floor(sr() * (w - 2)), sy = y + 1 + Math.floor(sr() * (h * 0.55));
      const px = X.getImageData(sx, sy, 1, 1).data;
      const isSky = sky.some(c => { const q = rgb(c); return q[0] === px[0] && q[1] === px[1] && q[2] === px[2]; });
      if (isSky) L.stars.push({ x: sx, y: sy, p: sr() * 6.28, s: 0.6 + sr() * 1.6, big: sr() > 0.8 });
    }
  }

  function drawFloorPlant(x, y) {
    R(x + 3, y - 10, 12, 10, C.pot1); R(x + 2, y - 12, 14, 3, C.pot2); R(x + 4, y - 1, 10, 1, C.pot0); R(x + 13, y - 9, 1, 8, C.pot0);
    R(x + 8, y - 36, 2, 26, C.wood1);
    const leaves = [[2, -30, 4, 3], [13, -34, 4, 3], [4, -40, 4, 3], [12, -44, 4, 3], [7, -48, 3, 3], [1, -22, 4, 2], [15, -24, 4, 2], [9, -38, 3, 2]];
    for (const [lx, ly, rx, ry] of leaves) { ellipse(x + lx, y + ly, rx, ry, C.leaf1); ellipse(x + lx - 1, y + ly - 1, rx - 1, ry - 1, C.leaf2); P(x + lx - 2, y + ly - 1, C.leaf3); }
  }

  function drawFrame(x, y) {
    R(x - 1, y - 1, 32, 24, C.ink); R(x, y, 30, 22, C.wood3); R(x + 2, y + 2, 26, 18, C.page); R(x + 3, y + 3, 24, 16, C.page1);
    const path = [[5, 15], [8, 13], [11, 14], [14, 11], [17, 10], [20, 8]];
    for (const [px, py] of path) P(x + px, y + py, C.wood2);
    R(x + 22, y + 5, 1, 1, C.red); P(x + 21, y + 4, C.red); P(x + 23, y + 4, C.red); P(x + 21, y + 6, C.red); P(x + 23, y + 6, C.red);
    R(x + 4, y + 4, 6, 1, C.page2); R(x + 4, y + 6, 4, 1, C.page2);
    P(x + 15, y - 4, C.brass1); P(x + 14, y - 3, C.ink); P(x + 16, y - 3, C.ink);
  }

  function drawRug() {
    const { x, y, rx, ry } = L.rug;
    ellipse(x, y, rx + 1, ry + 1, C.ink); ellipse(x, y, rx, ry, C.rug3); ellipse(x, y, rx - 3, ry - 1, C.rug1); ellipse(x, y, rx - 7, ry - 2, C.rug2); ellipse(x, y, rx - 12, ry - 4, C.rug1);
    for (let i = -rx + 14; i < rx - 14; i += 7) { P(x + i, y, C.rug4); P(x + i - 1, y + 1, C.rug4); P(x + i + 1, y + 1, C.rug4); P(x + i, y + 2, C.rug4); }
    for (let j = -ry + 2; j <= ry - 2; j += 2) { P(x - rx - 2, y + j, C.rug4); P(x + rx + 2, y + j, C.rug4); }
  }

  function drawCase() {
    const { caseX: x, caseY: y, caseW: w, caseH: h, rows, board } = L;
    R(x - 1, y - 1, w + 2, h + 1, C.ink);
    R(x, y, w, h, C.wood2);
    R(x - 3, y - 3, w + 6, 6, C.ink); R(x - 2, y - 2, w + 4, 4, C.wood3); R(x - 2, y - 2, w + 4, 1, C.wood4);
    R(x + 1, y + 4, 2, h - 6, C.wood3); R(x + w - 3, y + 4, 2, h - 6, C.wood1);
    for (const r of rows) {
      R(r.x0, r.top, r.x1 - r.x0, L.rowH, C.wood0);
      for (let px = r.x0 + 6; px < r.x1; px += 11) R(px, r.top + 2, 1, L.rowH - 2, C.wood1);
      R(r.x0, r.top, r.x1 - r.x0, 2, '#160b06');
      R(r.x0 - 1, r.base, r.x1 - r.x0 + 2, board, C.wood3); R(r.x0 - 1, r.base, r.x1 - r.x0 + 2, 1, C.wood4); R(r.x0 - 1, r.base + board - 1, r.x1 - r.x0 + 2, 1, C.wood1);
    }
    // cabinet doors
    const cy = rows[rows.length - 1].base + board + 1, ch = 14, half = (w - 10) >> 1;
    for (const dx of [5, 5 + half + 1]) {
      R(x + dx, cy, half - 1, ch, C.wood1); R(x + dx + 1, cy + 1, half - 3, ch - 2, C.wood3); R(x + dx + 3, cy + 3, half - 7, ch - 6, C.wood2);
    }
    P(x + 4 + half - 2, cy + 7, C.brass2); P(x + 7 + half, cy + 7, C.brass2);
    R(x - 2, y + h - 3, w + 4, 3, C.wood1); R(x, y + h, 3, 2, C.ink); R(x + w - 3, y + h, 3, 2, C.ink);
    // trailing pothos and a stack on top
    R(x + 8, y - 10, 10, 7, C.pot1); R(x + 7, y - 11, 12, 2, C.pot2);
    ellipse(x + 13, y - 13, 6, 3, C.leaf1); ellipse(x + 12, y - 14, 4, 2, C.leaf2); P(x + 10, y - 15, C.leaf3); P(x + 15, y - 14, C.leaf3);
    let vx = x + 4;
    for (let j = 0; j < 46; j++) {
      vx += Math.round(Math.sin(j / 4) * 0.6);
      const px = Math.min(vx, x + 2) - 2;
      P(px, y - 6 + j, C.leaf1);
      if (j % 5 === 0) { R(px - 2, y - 6 + j, 2, 2, C.leaf2); P(px - 2, y - 6 + j, C.leaf3); }
      if (j % 7 === 3) R(px + 1, y - 6 + j, 2, 2, C.leaf2);
    }
    const bx = x + w - 34;
    R(bx, y - 7, 26, 4, C.ink); R(bx + 1, y - 6, 24, 2, '#34496f'); R(bx + 1, y - 6, 24, 1, '#4b6391');
    R(bx + 3, y - 11, 21, 4, C.ink); R(bx + 4, y - 10, 19, 2, '#8b2f3b'); R(bx + 6, y - 10, 1, 2, C.foil); R(bx + 20, y - 10, 1, 2, C.foil);
    // shelf trinkets in the leftover space
    if (volumes.length) {
      const [r1, r2] = rows;
      if (r1.x1 - r1.deco >= 9) drawSucculent(r1.deco + 1, r1.base);
      if (r2.x1 - r2.deco >= 13) drawGlobe(r2.deco + 1, r2.base);
      if (L.candle) drawCandle(L.candle.x, L.candle.base);
    }
  }

  function drawSucculent(x, y) { R(x, y - 6, 7, 6, C.pot1); R(x, y - 6, 7, 1, C.pot2); ellipse(x + 3, y - 8, 3, 2, C.leaf2); P(x + 1, y - 10, C.leaf3); P(x + 5, y - 10, C.leaf3); P(x + 3, y - 11, C.leaf3); }
  function drawGlobe(x, y) {
    R(x + 3, y - 2, 6, 2, C.brass1); R(x + 5, y - 5, 2, 3, C.brass0);
    ellipse(x + 6, y - 11, 5, 5, C.ink); ellipse(x + 6, y - 11, 4, 4, '#2f5d84');
    R(x + 4, y - 14, 3, 2, C.leaf2); R(x + 7, y - 11, 2, 3, C.leaf2); P(x + 3, y - 10, C.leaf2); P(x + 4, y - 13, '#4f80ab');
    for (let k = -6; k <= 6; k++) { const a = (k / 6) * 1.2; P(Math.round(x + 6 + Math.sin(a) * 6), Math.round(y - 11 - Math.cos(a) * 6), C.brass1); }
  }
  function drawCandle(x, y) { R(x - 3, y - 2, 7, 2, C.brass1); R(x - 2, y - 3, 5, 1, C.brass2); R(x - 1, y - 11, 3, 8, C.page); R(x + 1, y - 11, 1, 8, C.page1); }

  function drawStack(x, y) {
    const books = [['#5c4475', 20], ['#2f6b67', 17], ['#c4963f', 15]];
    books.forEach(([c, bw], k) => { const yy = y - k * 4, xx = x + k * 2 - (k === 2 ? 3 : 0); R(xx, yy - 4, bw, 4, C.ink); R(xx + 1, yy - 3, bw - 2, 2, c); R(xx + 1, yy - 3, bw - 2, 1, tint(c, 1.2)); R(xx + bw - 3, yy - 3, 1, 2, C.page); });
  }

  function drawChair(x, yb) {
    const w = 54;
    R(x + 5, yb - 3, 3, 3, C.wood1); R(x + w - 8, yb - 3, 3, 3, C.wood1);
    rounded(x + 5, yb - 44, w - 10, 32, 6, C.ink, false); rounded(x + 6, yb - 43, w - 12, 31, 5, C.ch1, false);
    for (let i = 0; i < 4; i++) R(x + 12 + i * 9, yb - 40, 3, 26, C.ch2);
    for (const [bx, by] of [[14, -36], [24, -36], [34, -36], [19, -29], [29, -29], [39, -29]]) P(x + bx + 1, yb + by, C.ch0);
    R(x + 2, yb - 13, w - 4, 11, C.ink); R(x + 3, yb - 12, w - 6, 9, C.ch1); R(x + 3, yb - 12, w - 6, 1, C.ch2);
    R(x + 9, yb - 19, w - 18, 8, C.ink); R(x + 10, yb - 18, w - 20, 7, C.ch2); R(x + 10, yb - 18, w - 20, 1, C.ch3);
    for (const ax of [0, w - 12]) {
      rounded(x + ax, yb - 27, 12, 24, 4, C.ink, false); rounded(x + ax + 1, yb - 26, 10, 23, 3, C.ch2, false);
      R(x + ax + 2, yb - 25, 7, 2, C.ch3); R(x + ax + 1, yb - 8, 10, 1, C.ch1);
    }
    if (L.wide) {
      const mx = x + w - 9, my = yb - 31;
      R(mx, my, 5, 5, C.ink); R(mx + 1, my + 1, 3, 3, C.page); R(mx + 1, my + 1, 3, 1, '#8a5a3a'); P(mx + 5, my + 2, C.ink); P(mx + 5, my + 3, C.ink);
      L.mug = { x: mx + 2, y: my - 1 };
    } else L.mug = null;
  }

  function drawLamp() {
    const { kind, x, y } = L.lamp;
    if (kind === 'floor') {
      ellipse(x, y, 6, 1, C.ink); ellipse(x, y - 1, 5, 1, C.brass1);
      R(x - 1, y - 72, 2, 71, C.brass0); R(x - 1, y - 72, 1, 71, C.brass1);
      shade(x, y - 72, 22, 14, 12);
    } else {
      R(x - 9, y - 14, 20, 3, C.ink); R(x - 8, y - 13, 18, 1, C.wood4); R(x - 7, y - 11, 2, 11, C.wood1); R(x + 7, y - 11, 2, 11, C.wood1);
      R(x - 3, y - 18, 7, 4, C.brass1); R(x - 2, y - 19, 5, 1, C.brass2); R(x, y - 24, 1, 6, C.brass0);
      shade(x, y - 30, 16, 10, 9);
    }
  }
  function shade(x, yb, bw, tw, h) {
    for (let j = 0; j < h; j++) {
      const ww = Math.round(tw + (bw - tw) * (j / (h - 1)));
      R(x - (ww >> 1) - 1, yb - h + j, ww + 2, 1, C.ink);
      R(x - (ww >> 1), yb - h + j, ww, 1, j < 2 ? C.shade2 : C.shade1);
      P(x - (ww >> 1), yb - h + j, C.shade0); P(x + (ww >> 1) - 1, yb - h + j, C.shade0);
    }
    R(x - (bw >> 1) - 1, yb, bw + 2, 1, C.ink); R(x - 3, yb + 1, 6, 1, C.bulb);
  }

  /* ---------- dynamic layer ---------- */
  function drawSpine(v, x, y) {
    const w = v.dw, h = v.h;
    R(x, y, w, h, C.ink);
    R(x + 1, y + 1, w - 2, h - 1, v.c);
    R(x + 1, y + 1, 1, h - 1, v.cl);
    R(x + w - 2, y + 1, 1, h - 1, v.cd);
    const ink = v.light ? C.ink : C.foil;
    const gw = glyphW(v.letter), gx = x + ((w - gw) >> 1);
    if (v.style === 0) {
      R(x + 2, y + 3, w - 4, 1, ink); R(x + 2, y + 5, w - 4, 1, ink); R(x + 2, y + h - 4, w - 4, 1, ink);
      text(v.letter, gx, y + 9, ink);
    } else if (v.style === 1) {
      R(x + 2, y + 6, w - 4, 9, v.light ? C.ink : C.page1); R(x + 3, y + 7, w - 6, 7, v.light ? C.page : C.page);
      text(v.letter, gx, y + 8, C.ink);
      R(x + 2, y + h - 5, w - 4, 2, v.cd);
    } else if (v.style === 2) {
      for (let k = 4; k < h - 3; k += 6) R(x + 1, y + k, w - 2, 1, v.cd);
      R(x + 2, y + 6, w - 4, 7, v.cd);
      text(v.letter, gx, y + 7, ink);
    } else {
      text(v.letter, gx, y + 5, ink);
      P(x + (w >> 1), y + h - 6, ink); R(x + 2, y + h - 3, w - 4, 1, ink);
    }
  }

  function drawVolumes(now) {
    for (const v of volumes) {
      if (v.out) continue;
      const target = v.i === hovered ? 3 : 0;
      v.lift = motionOK() ? v.lift + Math.sign(target - v.lift) : target;
      const y = v.y - v.lift;
      drawSpine(v, v.x, y);
      if (matches && !v.hits) { X.fillStyle = 'rgba(14,8,18,.55)'; X.fillRect(v.x, y, v.dw, v.h); }
      if (matches && v.hits) { R(v.x + v.dw - 4, y - 4, 2, 6, C.red); P(v.x + v.dw - 4, y - 4, C.ink); R(v.x + v.dw - 4, y - 5, 2, 1, C.ink); }
    }
  }

  function drawCat(now) {
    const { x, y } = L.cat;
    const t = now / 1000;
    const inhale = Math.sin(t * Math.PI * 2 / 3.4) > 0.15;
    sprite(inhale ? CAT_INHALE : CAT_ROWS, x, y, CAT);
    const pet = catPet > 0 && now >= catPet && now - catPet < 1800;
    if (pet) {
      const k = (now - catPet) / 1800;
      sprite(HEART, x + 4, y - 8 - Math.round(k * 9), C.heart);
    } else {
      for (const off of [0, 0.5]) {
        const ph = ((t / 3.2) + off) % 1;
        if (ph > 0.85) continue;
        const col = ph < 0.55 ? C.page : C.page2;
        const zx = x + 4 + Math.round(ph * 7 + Math.sin(ph * 6) * 1.5), zy = y - 5 - Math.round(ph * 13);
        if (off) text('Z', zx, zy, col); else sprite(ZZ, zx, zy, col);
      }
    }
  }

  function frame(now = performance.now()) {
    if (!L) return;
    if (!motionOK()) now = 2000;
    X = bufCtx;
    X.drawImage(base, 0, 0);
    if (L.stars) for (const s of L.stars) {
      const b = Math.sin(now / 1000 * s.s + s.p);
      if (b > 0.55) { P(s.x, s.y, C.star); if (s.big && b > 0.85) { P(s.x - 1, s.y, C.starDim); P(s.x + 1, s.y, C.starDim); P(s.x, s.y - 1, C.starDim); P(s.x, s.y + 1, C.starDim); } }
      else if (b > -0.3) P(s.x, s.y, C.starDim);
    }
    if (volumes.length) drawVolumes(now);
    if (L.candle) {
      const f = Math.floor(now / 160) % 3;
      P(L.candle.x, L.candle.y - 1, C.ink); P(L.candle.x, L.candle.y - 2, C.flame2); P(L.candle.x + (f === 1 ? 1 : 0), L.candle.y - 3, C.flame); if (f !== 2) P(L.candle.x, L.candle.y - 4, C.flame);
    }
    if (L.mug) for (let k = 0; k < 2; k++) {
      const ph = ((now / 2200) + k * 0.5) % 1;
      for (let j = 0; j < 3; j++) P(L.mug.x + Math.round(Math.sin(ph * 7 + j) * 1.2) + k, L.mug.y - Math.round(ph * 9) - j, ph < 0.6 ? C.page1 : C.page2);
    }
    drawCat(now);
    const img = X.getImageData(0, 0, W, H), d = img.data;
    const AMT = [0, 0.08, 0.15, 0.23, 0.33], DAMT = [0, 0.2, 0.34, 0.48];
    for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
      const t = bayer(x, y), k = i * 4;
      if (warm[i]) { const q = Math.min(4, Math.floor((warm[i] / 255) * 4 + t)); if (q) { const a = AMT[q]; d[k] += (255 - d[k]) * a; d[k + 1] += (214 - d[k + 1]) * a; d[k + 2] += (150 - d[k + 2]) * a * 0.6; } }
      if (cool[i] && ((x + y) & 1) && t < cool[i] / 255) { d[k] += (150 - d[k]) * 0.16; d[k + 1] += (172 - d[k + 1]) * 0.16; d[k + 2] += (232 - d[k + 2]) * 0.2; }
      if (dark[i]) { const q = Math.min(3, Math.floor((dark[i] / 255) * 3 + t)); if (q) { const a = 1 - DAMT[q]; d[k] = d[k] * a + 16 * (1 - a); d[k + 1] = d[k + 1] * a + 10 * (1 - a); d[k + 2] = d[k + 2] * a + 22 * (1 - a); } }
    }
    view.putImageData(img, 0, 0);
  }

  let last = 0, animationFrame;
  function loop(now) {
    if (now - last > 66 && !book.open) { last = now; frame(now); }
    animationFrame = requestAnimationFrame(loop);
  }
  function refreshMotion() {
    cancelAnimationFrame(animationFrame);
    frame();
    if (!document.hidden && motionOK()) animationFrame = requestAnimationFrame(loop);
  }
  motionPreference.addEventListener('change', refreshMotion);
  document.addEventListener('visibilitychange', refreshMotion);
  addEventListener('pagehide', () => cancelAnimationFrame(animationFrame));
  addEventListener('pageshow', refreshMotion);

  /* ---------- spines, tip, cat ---------- */
  const spinesEl = $('spines'), tip = $('spine-tip'), catSpot = $('cat-spot');
  function placeSpines() {
    if (volumes.length && !spinesEl.children.length) {
      spinesEl.innerHTML = volumes.map(v => `<button type="button" class="spine-btn" data-vol="${v.i}" aria-label="Volume ${v.letter}, ${v.people.length} ${v.people.length === 1 ? 'person' : 'people'}"></button>`).join('');
    }
    for (const b of spinesEl.children) {
      const v = volumes[+b.dataset.vol];
      Object.assign(b.style, { left: v.x * S + 'px', top: (v.y - 4) * S + 'px', width: v.dw * S + 'px', height: (v.h + 4) * S + 'px' });
    }
    Object.assign(catSpot.style, { left: L.cat.x * S + 'px', top: (L.cat.y - 2) * S + 'px', width: 28 * S + 'px', height: 14 * S + 'px' });
    catSpot.hidden = false;
  }
  function showTip(v) {
    const a = v.people[0], z = v.people[v.people.length - 1];
    const hits = matches ? `<span class="tip-hits">${v.hits} match${v.hits === 1 ? '' : 'es'}</span>` : '';
    tip.innerHTML = `<b>${v.letter}</b> ${v.people.length} people${hits}<small>${esc(a ? a.last : '')} to ${esc(z ? z.last : '')}</small>`;
    tip.style.left = (v.x + v.dw / 2) * S + 'px';
    tip.style.top = (v.y - 6) * S + 'px';
    tip.hidden = false;
  }
  function hideTip() { tip.hidden = true; }
  spinesEl.addEventListener('pointerover', e => { const b = e.target.closest('.spine-btn'); if (!b || busy) return; hovered = +b.dataset.vol; showTip(volumes[hovered]); frame(); });
  spinesEl.addEventListener('pointerout', e => { if (e.target.closest('.spine-btn') && !e.relatedTarget?.closest?.('.spine-btn')) { hovered = -1; hideTip(); frame(); } });
  spinesEl.addEventListener('focusin', e => { const b = e.target.closest('.spine-btn'); if (!b) return; hovered = +b.dataset.vol; showTip(volumes[hovered]); frame(); });
  spinesEl.addEventListener('focusout', () => { hovered = -1; hideTip(); frame(); });
  spinesEl.addEventListener('click', e => { const b = e.target.closest('.spine-btn'); if (b) openVolume(+b.dataset.vol); });
  spinesEl.addEventListener('keydown', e => {
    const b = e.target.closest('.spine-btn'); if (!b) return;
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (d) { e.preventDefault(); spinesEl.children[(+b.dataset.vol + d + 26) % 26].focus(); }
  });
  catSpot.addEventListener('click', () => {
    catPet = performance.now(); frame();
    tip.innerHTML = '<b>mrrp.</b> back to sleep';
    tip.style.left = (L.cat.x + 14) * S + 'px'; tip.style.top = (L.cat.y - 10) * S + 'px'; tip.hidden = false;
    clearTimeout(catSpot.t); catSpot.t = setTimeout(hideTip, 1600);
  });

  /* ---------- search ---------- */
  const q = $('q'), results = $('results'), list = $('results-list'), foot = $('results-foot');
  let found = [], active = 0;
  function search(value) {
    const toks = fold(value).split(/\s+/).filter(Boolean);
    volumes.forEach(v => { v.hits = 0; });
    if (!toks.length) { matches = null; found = []; results.hidden = true; q.setAttribute('aria-expanded', 'false'); frame(); return; }
    const first = toks[0];
    found = people.filter(p => toks.every(t => p.hay.includes(t))).map(p => ({ p, s: p.flast.startsWith(first) ? 0 : p.fname.startsWith(first) ? 1 : p.fname.includes(first) ? 2 : p.forg.includes(first) ? 3 : 4 }))
      .sort((a, b) => a.s - b.s || a.p.flast.localeCompare(b.p.flast)).map(x => x.p);
    matches = new Set(found.map(p => p.id));
    for (const p of found) volumes[p.vol].hits++;
    active = 0;
    renderResults();
    frame();
  }
  function renderResults() {
    const top = found.slice(0, 7);
    list.innerHTML = top.map((p, i) => `<li role="option" id="opt-${i}" aria-selected="${i === active}"><button type="button" tabindex="-1" data-id="${esc(p.id)}"><span class="r-name">${esc(p.raw.name)}</span><span class="r-vol" aria-label="Volume ${p.letter}">${p.letter}</span><span class="r-meta">${esc([p.raw.role, p.raw.organization].filter(Boolean).join(' · '))}</span></button></li>`).join('');
    const vols = volumes.filter(v => v.hits).length;
    foot.textContent = found.length ? `${found.length.toLocaleString()} ${found.length === 1 ? 'person' : 'people'} in ${vols} ${vols === 1 ? 'volume' : 'volumes'}. Marked volumes hold a match.` : 'Nobody on the shelves matches that yet.';
    results.hidden = false;
    q.setAttribute('aria-expanded', 'true');
    q.setAttribute('aria-activedescendant', top.length ? `opt-${active}` : '');
  }
  q.addEventListener('input', () => search(q.value));
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(7, found.length); if (!n) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; renderResults();
    } else if (e.key === 'Enter') {
      const p = found[active]; if (p) { e.preventDefault(); results.hidden = true; q.blur(); openPerson(p); }
    } else if (e.key === 'Escape') {
      if (q.value) { q.value = ''; search(''); } else q.blur();
    }
  });
  q.addEventListener('focus', () => { if (found.length || q.value) renderResults(); });
  q.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== q) { results.hidden = true; q.setAttribute('aria-expanded', 'false'); } }, 150));
  list.addEventListener('pointerdown', e => e.preventDefault());
  list.addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (b) { results.hidden = true; q.blur(); openPerson(byId.get(b.dataset.id)); } });

  /* ---------- the book ---------- */
  const reader = $('reader'), scrim = $('reader-scrim'), bookEl = $('book'), spread = $('spread'), boards = $('boards');
  const pageL = $('page-left'), pageR = $('page-right'), indexEl = $('index'), entryEl = $('entry'), flyer = $('flyer');
  const toIndex = $('to-index'), closeBtn = $('book-close');
  let returnFocus = null;
  function roomInert(value) {
    for (const el of document.querySelectorAll('#spines, #cat-spot, .room-head, #catalog, #room-hint, #mcp')) el.inert = value;
  }

  function metrics() {
    const vw = innerWidth, vh = innerHeight, single = vw < 760;
    let ph = Math.min(vh - (single ? 120 : 110), 600), pw = single ? Math.min(vw - 40, 460) : Math.min((vw - 90) / 2, 440);
    ph = Math.floor(ph / S) * S; pw = Math.floor(pw / S) * S;
    return { pw, ph, single, cw: pw + 3 * S, ch: ph + 6 * S };
  }
  function applyMetrics(m, v) {
    book.m = m; book.single = m.single;
    const st = bookEl.style;
    st.setProperty('--pw', m.pw + 'px'); st.setProperty('--ph', m.ph + 'px'); st.setProperty('--bw', (m.single ? m.pw : m.pw * 2) + 'px');
    st.setProperty('--vol', v.c); st.setProperty('--vol-dark', v.cd); st.setProperty('--vol-light', v.cl);
    st.setProperty('--vol-ink', v.light ? C.ink : C.page);
    bookEl.classList.toggle('single', m.single);
    gutters();
  }
  let gutterDone = 0;
  function gutters() {
    if (gutterDone === S) return; gutterDone = S;
    const make = flip => {
      const c = document.createElement('canvas'); c.width = 14; c.height = 4; const x = c.getContext('2d');
      for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) {
        const t = Math.pow(1 - i / 14, 1.6);
        if (bayer(i, j) < t * 0.85) { x.fillStyle = i < 2 ? 'rgba(90,60,30,.55)' : 'rgba(150,115,70,.35)'; x.fillRect(flip ? 13 - i : i, j, 1, 1); }
      }
      return c.toDataURL();
    };
    document.documentElement.style.setProperty('--gutter-r', `url(${make(false)})`);
    document.documentElement.style.setProperty('--gutter-l', `url(${make(true)})`);
  }

  function coverCanvas(v, m) {
    const cw = m.cw / S, ch = m.ch / S;
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const prev = X; X = c.getContext('2d');
    R(0, 0, cw, ch, C.ink); R(1, 1, cw - 2, ch - 2, v.c);
    for (let j = 1; j < ch - 1; j++) for (let i = 1; i < cw - 1; i++) if (bayer(i * 3, j * 5) < 0.07) P(i, j, v.cd);
    R(1, 1, 3, ch - 2, v.cd); R(4, 1, 1, ch - 2, v.cl);
    const ink = v.light ? '#5a3d22' : C.foil;
    const fx = 9, fy = 7, fw = cw - 15, fh = ch - 14;
    const box = (x, y, w, h) => { R(x, y, w, 1, ink); R(x, y + h - 1, w, 1, ink); R(x, y, 1, h, ink); R(x + w - 1, y, 1, h, ink); };
    box(fx, fy, fw, fh); box(fx + 2, fy + 2, fw - 4, fh - 4);
    for (const [ox, oy] of [[fx, fy], [fx + fw - 1, fy], [fx, fy + fh - 1], [fx + fw - 1, fy + fh - 1]]) { P(ox, oy - 1, ink); P(ox - 1, oy, ink); P(ox + 1, oy, ink); P(ox, oy + 1, ink); }
    const mid = fx + fw / 2;
    const k = Math.max(4, Math.min(Math.floor(fw * 0.42 / 5), Math.floor(fh * 0.3 / 5)));
    const lw = glyphW(v.letter) * k;
    text('VOLUME', Math.round(mid - textW('VOLUME') / 2), Math.round(fy + fh * 0.2), ink);
    text(v.letter, Math.round(mid - lw / 2), Math.round(fy + fh * 0.3), ink, k);
    const a = fold(v.people[0]?.last || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8), z = fold(v.people[v.people.length - 1]?.last || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
    const range = `${a}-${z}`, count = `${v.people.length} PEOPLE`;
    const ry = Math.round(fy + fh * 0.3 + 5 * k + 8);
    if (textW(range) < fw - 8) text(range, Math.round(mid - textW(range) / 2), ry, ink);
    text(count, Math.round(mid - textW(count) / 2), ry + 9, ink);
    const brand = 'PURDUE FOUNDER MAP';
    if (textW(brand) < fw - 8) text(brand, Math.round(mid - textW(brand) / 2), fy + fh - 11, ink);
    X = prev;
    return c;
  }
  function spineCanvas(v) {
    const c = document.createElement('canvas'); c.width = v.dw; c.height = v.h;
    c.getContext('2d').drawImage(room, v.x, v.y - v.lift, v.dw, v.h, 0, 0, v.dw, v.h);
    return c;
  }
  const T = (tx, ty, sx, sy, deg) => `perspective(1400px) translate(${tx}px, ${ty}px) scale(${sx}, ${sy}) rotateY(${deg}deg)`;
  const anim = (el, frames, opts) => el.animate(frames, { fill: 'forwards', ...opts }).finished;
  // The closed book sits where the open spread's hinged cover will be, so the hand-off is seamless.
  function flight(v, m) {
    const rect = bookEl.getBoundingClientRect();
    const left = book.single ? rect.left : rect.left + m.pw / 2, top = rect.top - 3 * S;
    const rw = v.dw * S, rh = v.h * S, rx = v.x * S, ry = v.y * S;
    const sx = rw / m.cw, sy = rh / m.ch, tx = rx + rw / 2 - (left + m.cw / 2), ty = ry + rh / 2 - (top + m.ch / 2);
    Object.assign(flyer.style, { width: m.cw + 'px', height: m.ch + 'px', left: left + 'px', top: top + 'px' });
    return { rh, start: [tx, ty, sx, sy], mid: [tx * 0.4, ty * 0.4 - 30, sx + (1 - sx) * 0.42, sy + (1 - sy) * 0.42] };
  }
  function hingedLeaf(cover, fromOpen) {
    const leaf = document.createElement('div'); leaf.className = 'leaf'; leaf.inert = true; leaf.setAttribute('aria-hidden', 'true');
    const back = document.createElement('div'); back.className = 'face back';
    const ghost = pageL.cloneNode(true); ghost.removeAttribute('id'); ghost.className = 'page ghost';
    ghost.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
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
    $('vol-title').textContent = v.letter;
    const a = v.people[0], z = v.people[v.people.length - 1];
    $('vol-range').textContent = `${v.people.length.toLocaleString()} people · ${a ? a.last : ''} to ${z ? z.last : ''}`;
    indexEl.innerHTML = v.people.map(p => `<li><button type="button" data-n="${p.n}"${matches && matches.has(p.id) ? ' class="hit"' : ''}><span class="i-name">${esc(p.display)}</span><span class="i-org">${esc(p.raw.organization)}</span></button></li>`).join('');
  }
  function markIndex() {
    for (const b of indexEl.querySelectorAll('button')) b.toggleAttribute('aria-current', +b.dataset.n === book.person);
    const cur = indexEl.querySelector('[aria-current]');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }

  function titlePage(v) {
    const k = v.kinds, parts = [['Founder', 'founder'], ['Investor', 'investor'], ['Operator', 'operator']].filter(([key]) => k[key]).map(([key, n]) => `${k[key]} ${n}${k[key] === 1 ? '' : 's'}`);
    return `<div class="title-page"><p class="tp-letter">${v.letter}</p><p class="tp-count">${v.people.length.toLocaleString()} ${v.people.length === 1 ? 'person' : 'people'}</p><p class="tp-kinds">${parts.join(' · ')}</p><p class="tp-hint">Choose a name from the index, or press <kbd>→</kbd> to start reading.</p></div>`;
  }
  function personPage(p) {
    const r = p.raw, v = volumes[p.vol];
    const initials = (p.first ? p.first[0] : '') + p.last[0];
    const role = [r.role, r.organization].filter(Boolean).join(' at ');
    const facts = [['Purdue', r.connection], ['Based', r.region === 'Not listed' ? '' : r.region], ['Shelved as', r.kind], ['Sector', r.company_sector]].filter(([, val]) => val);
    const high = (r.highlights || []).slice(0, 2).map(h => `<li>${esc(h.claim)}${h.date ? ` <span class="e-date">${esc(String(h.date).slice(0, 4))}</span>` : ''}</li>`).join('');
    const fund = (r.funding || [])[0];
    const links = [[r.source_url, 'Source'], [r.linkedin, 'LinkedIn'], [r.company_website, 'Website'], [r.x, 'X'], [`/alumni.html?person=${encodeURIComponent(r.id)}`, 'On the map']].filter(([u]) => safeURL(u))
      .map(([u, t]) => `<a href="${esc(u)}"${u.startsWith('/') ? '' : ' target="_blank" rel="noopener noreferrer"'}>${t} ↗</a>`).join('');
    const asOf = r.role_as_of ? ` <span class="e-asof">as of ${esc(r.role_as_of)}</span>` : '';
    return `<article class="person">
      <header class="e-top"><div class="stamp" data-img="${esc(r.image || '')}" aria-hidden="true"><span>${esc(initials.toUpperCase())}</span></div>
        <div><h2 class="e-name">${esc(r.name)}</h2><p class="e-role">${esc(role)}${asOf}</p></div></header>
      <div class="rule" aria-hidden="true"></div>
      <dl class="facts">${facts.map(([k, val]) => `<dt>${k}</dt><dd>${esc(val)}</dd>`).join('')}${fund ? `<dt>Company funding</dt><dd>${esc(fund.amount)}${fund.round ? `, ${esc(fund.round)}` : ''}${safeURL(fund.source_url) ? ` <a href="${esc(fund.source_url)}" target="_blank" rel="noopener noreferrer">source ↗</a>` : ''}</dd>` : ''}</dl>
      <p class="e-why">${esc(r.why_relevant)}</p>
      ${high ? `<ul class="e-high">${high}</ul>` : ''}
      <nav class="e-links" aria-label="Links for ${esc(r.name)}">${links}</nav>
      <footer class="e-foot"><span>Vol. ${v.letter}, p. ${p.n + 1} of ${v.people.length}</span><span>Checked ${esc(r.verified_at || '')}</span></footer>
    </article>`;
  }
  function paintStamp(root) {
    const st = root.querySelector('.stamp[data-img]');
    if (!st || !st.dataset.img) return;
    const img = new Image();
    img.onload = () => {
      const n = 24, c = document.createElement('canvas'); c.width = n; c.height = n;
      const x = c.getContext('2d'); const s = Math.min(img.width, img.height);
      x.drawImage(img, (img.width - s) / 2, (img.height - s) / 4, s, s, 0, 0, n, n);
      const d = x.getImageData(0, 0, n, n), tones = [C.ink, '#5b3a2a', '#b98f62', C.page].map(rgb);
      for (let i = 0; i < n * n; i++) {
        const k = i * 4, lum = (d.data[k] * 0.3 + d.data[k + 1] * 0.59 + d.data[k + 2] * 0.11) / 255;
        const q = Math.max(0, Math.min(3, Math.floor(lum * 3.2 + bayer(i % n, (i / n) | 0) - 0.4)));
        [d.data[k], d.data[k + 1], d.data[k + 2]] = tones[q];
      }
      x.putImageData(d, 0, 0);
      st.replaceChildren(c);
    };
    img.src = st.dataset.img;
  }
  function renderEntry() {
    const v = volumes[book.vol];
    entryEl.innerHTML = book.person < 0 ? titlePage(v) : personPage(v.people[book.person]);
    paintStamp(entryEl);
    entryEl.scrollTop = 0;
  }
  function setView(view) {
    book.view = view;
    bookEl.dataset.view = view;
    toIndex.hidden = !(book.single && view === 'entry');
  }
  function syncURL() {
    const v = volumes[book.vol], p = book.open && book.person >= 0 ? v.people[book.person] : null;
    const url = p ? `?person=${encodeURIComponent(p.id)}` : book.open ? `#${v.letter}` : location.pathname;
    history.replaceState(null, '', url);
  }

  async function openVolume(vi, person = null) {
    if (busy || book.open) return;
    busy = true; hideTip(); hovered = -1;
    returnFocus = document.activeElement === q ? q : spinesEl.children[vi];
    roomInert(true);
    const v = volumes[vi], m = metrics();
    book.vol = vi; book.person = person ? person.n : -1;
    applyMetrics(m, v);
    fillIndex(v); renderEntry();
    setView(book.single && person ? 'entry' : 'index');
    const cover = coverCanvas(v, m);
    book.spine = spineCanvas(v);
    reader.hidden = false; bookEl.tabIndex = -1; bookEl.focus({preventScroll:true}); spread.style.visibility = 'hidden'; bookEl.classList.remove('ready');
    const shift = book.single ? 0 : -m.pw / 2;
    spread.style.transform = `translateX(${shift}px)`;
    const f = flight(v, m);
    const fs = face(book.spine), fc = face(cover);
    flyer.replaceChildren(fs, fc);
    fc.style.transform = T(0, 0, 1, 1, -90);
    fs.style.transform = T(...f.start, 0);
    flyer.hidden = false;
    v.out = true; frame();
    const motion = motionOK();
    scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion ? 700 : 1, fill: 'forwards' });
    if (motion) {
      const [tx, ty, sx, sy] = f.start;
      await anim(fs, [
        { transform: T(tx, ty, sx, sy, 0) },
        { transform: T(tx, ty - f.rh * 0.55, sx, sy, 0), offset: 0.32, easing: 'cubic-bezier(.4,0,.6,1)' },
        { transform: T(...f.mid, 88) },
      ], { duration: 560, easing: 'cubic-bezier(.3,.05,.4,1)' });
      fs.remove();
      await anim(fc, [{ transform: T(...f.mid, -88) }, { transform: T(0, 0, 1, 1, 0) }], { duration: 380, easing: 'cubic-bezier(.15,.7,.25,1)' });
    }
    // swap the flying cover for a hinged leaf on the spread, then open it
    const h = hingedLeaf(cover, false);
    spread.style.visibility = 'visible';
    flyer.hidden = true; flyer.replaceChildren();
    pageL.style.visibility = 'hidden';
    if (motion) {
      spread.animate([{ transform: `translateX(${shift}px)` }, { transform: 'translateX(0)' }], { duration: 780, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
      await swing(h, true, 780);
    }
    for (const a of spread.getAnimations()) a.cancel();
    spread.style.transform = '';
    h.leaf.remove();
    pageL.style.visibility = '';
    applyMetrics(metrics(), v);
    bookEl.classList.add('ready');
    book.open = true; busy = false;
    markIndex(); syncURL();
    (book.single && book.view === 'entry' ? closeBtn : (indexEl.querySelector('[aria-current]') || indexEl.querySelector('button') || closeBtn)).focus({ preventScroll: true });
  }

  async function closeBook() {
    if (busy || !book.open) return;
    busy = true;
    const v = volumes[book.vol], m = book.m, motion = motionOK();
    const cover = coverCanvas(v, m);
    bookEl.classList.remove('ready');
    if (motion) {
      const h = hingedLeaf(cover, true);
      pageL.style.visibility = 'hidden';
      const shift = book.single ? 0 : -m.pw / 2;
      spread.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${shift}px)` }], { duration: 640, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
      await swing(h, false, 640);
      // hand the closed cover to the flyer and carry it back to its slot
      const f = flight(v, m);
      const fc = face(cover), fs = face(book.spine || spineArt(v));
      fs.style.transform = T(...f.mid, 88);
      fc.style.transform = T(0, 0, 1, 1, 0);
      flyer.replaceChildren(fs, fc); flyer.hidden = false;
      spread.style.visibility = 'hidden';
      h.leaf.remove();
      scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, fill: 'forwards' });
      const [tx, ty, sx, sy] = f.start;
      await anim(fc, [{ transform: T(0, 0, 1, 1, 0) }, { transform: T(...f.mid, -88) }], { duration: 300, easing: 'cubic-bezier(.6,0,.85,.4)' });
      fc.remove();
      await anim(fs, [
        { transform: T(...f.mid, 88) },
        { transform: T(tx, ty - f.rh * 0.55, sx, sy, 0), offset: 0.68, easing: 'cubic-bezier(.4,0,.6,1)' },
        { transform: T(tx, ty, sx, sy, 0) },
      ], { duration: 540, easing: 'cubic-bezier(.2,.6,.35,1)' });
    }
    v.out = false; v.lift = 0; frame();
    flyer.hidden = true; flyer.replaceChildren();
    reader.hidden = true; spread.style.visibility = ''; pageL.style.visibility = '';
    for (const a of [...spread.getAnimations(), ...scrim.getAnimations()]) a.cancel();
    book.open = false; busy = false; book.person = -1; roomInert(false);
    syncURL();
    if (returnFocus) returnFocus.focus({ preventScroll: true });
  }
  function spineArt(v) {
    const c = document.createElement('canvas'); c.width = v.dw; c.height = v.h;
    const prev = X; X = c.getContext('2d'); drawSpine(v, 0, 0); X = prev;
    return c;
  }

  async function turnTo(n, dir) {
    const v = volumes[book.vol];
    if (busy || n === book.person || n < -1 || n >= v.people.length) return;
    busy = true;
    const motion = motionOK() && dir;
    const page = book.single ? (book.view === 'entry' ? pageR : pageL) : pageR;
    if (motion && dir > 0) {
      const sheet = page.cloneNode(true); sheet.removeAttribute('id'); sheet.classList.add('sheet'); sheet.inert = true; sheet.setAttribute('aria-hidden', 'true');
      sheet.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      page.after(sheet);
      book.person = n; renderEntry();
      if (book.single) setView('entry');
      await anim(sheet, [{ transform: 'rotateY(0deg)', filter: 'brightness(1)' }, { transform: 'rotateY(-90deg)', filter: 'brightness(.6)' }], { duration: 340, easing: 'cubic-bezier(.5,0,.75,.4)' });
      sheet.remove();
    } else if (motion) {
      book.person = n; renderEntry();
      if (book.single) setView('entry');
      const sheet = pageR.cloneNode(true); sheet.removeAttribute('id'); sheet.classList.add('sheet'); sheet.inert = true; sheet.setAttribute('aria-hidden', 'true');
      sheet.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      if (book.single) sheet.style.left = '0';
      pageR.after(sheet);
      pageR.style.visibility = 'hidden';
      await anim(sheet, [{ transform: 'rotateY(-90deg)', filter: 'brightness(.6)' }, { transform: 'rotateY(0deg)', filter: 'brightness(1)' }], { duration: 340, easing: 'cubic-bezier(.25,.6,.5,1)' });
      pageR.style.visibility = '';
      sheet.remove();
    } else {
      book.person = n; renderEntry();
      if (book.single) setView('entry');
    }
    if (book.single) { entryEl.tabIndex = -1; entryEl.focus({preventScroll:true}); }
    markIndex(); syncURL();
    busy = false;
  }

  async function openPerson(p) {
    if (!p) return;
    if (book.open && book.vol === p.vol) { await turnTo(p.n, p.n > book.person ? 1 : -1); return; }
    if (book.open) await closeBook();
    await openVolume(p.vol, p);
  }

  indexEl.addEventListener('click', e => { const b = e.target.closest('button[data-n]'); if (b) turnTo(+b.dataset.n, +b.dataset.n > book.person ? 1 : -1); });
  closeBtn.addEventListener('click', closeBook);
  scrim.addEventListener('click', closeBook);
  toIndex.addEventListener('click', async () => {
    if (busy) return;
    setView('index'); markIndex();
    (indexEl.querySelector('[aria-current]') || indexEl.querySelector('button'))?.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', e => {
    const typing = e.target === q;
    if (!reader.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeBook(); return; }
      if (typing) return;
      const n = volumes[book.vol].people.length;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); if (book.person < n - 1) turnTo(book.person + 1, 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); if (book.person > -1) turnTo(book.person - 1, -1); }
      else if (e.key === 'Tab') {
        const f = [...bookEl.querySelectorAll('button:not([hidden]), a[href]')].filter(el => el.offsetParent && !el.closest('.ghost, .sheet'));
        if (!f.length) { e.preventDefault(); return; }
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
      }
      return;
    }
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
      layout(); frame();
      if (book.open && !busy) { applyMetrics(metrics(), volumes[book.vol]); setView(book.single ? book.view : 'index'); }
    }, 120);
  });
  layout();
  refreshMotion();

  fetch('/alumni.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => {
    shelve(d.alumni || []);
    $('room-sub').textContent = `${people.length.toLocaleString()} Purdue people, shelved by surname.`;
    layout(); frame();
    const id = new URLSearchParams(location.search).get('person');
    const letter = location.hash.slice(1).toUpperCase();
    if (id && byId.has(id)) openPerson(byId.get(id));
    else if (/^[A-Z]$/.test(letter)) openVolume(letter.charCodeAt(0) - 65);
  }).catch(() => {
    $('room-sub').innerHTML = 'The shelves did not load. Try again, or browse the <a href="/alumni.html">alumni directory</a>.';
  });
})();
