/* The Reading Room: every person on the map, shelved A to Z by surname. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOK = () => !motionPreference.matches;
  const safeURL = value => /^(https?:\/\/|\/(?!\/))/.test(value || '') ? value : ''; 
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const C = { ink: '#28241c', page: '#eee7d5', foil: '#cfb777' };
  const BOOK = ['#43332a','#39433c','#5b3d31','#303b42','#4c4238','#534331','#3d3836','#49372f','#3d4640','#5d503d'];
  const LIGHT_BOOKS = new Set();
  const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const tint = (c, f) => hex(rgb(c).map(v => f > 1 ? v + (255 - v) * (f - 1) : v * f));
  const hashStr = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = seed => { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
  let S = 2, L = null;
  let people = [], volumes = [], byId = new Map();
  let hovered = -1, matches = null, busy = false;
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
      const c = BOOK[(i * 3) % BOOK.length];
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

  /* Shelf geometry is shared by the hit areas and book-flight animation. */
  function layout() {
    const vw = innerWidth, vh = innerHeight, mobile = vw < 760;
    const width = Math.min(mobile ? vw - 40 : vw * .48, 650);
    const height = Math.min(mobile ? vh * .51 : vh * .58, 520);
    const left = (vw - width) / 2, top = Math.max(mobile ? 195 : 154, mobile ? vh * .30 : (vh - height) / 2 + 32);
    const shelf = $('cabinet');
    Object.assign(shelf.style, {left: left+'px', top: top+'px', width: width+'px', height: height+'px'});
    const counts = mobile ? [7,7,6,6] : [9,9,8];
    const inset = mobile ? 13 : 23, cap = mobile ? 24 : 34;
    const rowHeight = (height - cap - 20) / counts.length;
    shelf.innerHTML = counts.map((n,i) => `<div class="shelf-board" style="top:${cap+(i+1)*rowHeight}px"></div>`).join('') + '<span class="cabinet-plate">PURDUE · A—Z</span>';
    let start = 0;
    for (let row=0; row<counts.length; row++) {
      const count=counts[row], group=volumes.slice(start,start+count);
      const available=width-2*inset, total=group.reduce((n,v)=>n+v.w,0);
      let x=left+inset;
      for (const v of group) {
        const slot=available*v.w/total;
        v.dw=(slot-2)/S; v.h=(rowHeight-13-(hashStr(v.letter)%8))/S;
        v.x=x/S; v.y=(top+cap+(row+1)*rowHeight)/S-v.h; v.lift=0;
        x+=slot;
      }
      start+=count;
    }
    // The cat is part of the original photographic set. Its hit area follows the cover crop.
    const scale=Math.max(vw/2688,vh/1520), ox=(vw-2688*scale)/2, oy=(vh-1520*scale)/2;
    L={cat:{x:(ox+1900*scale)/S,y:(oy+1040*scale)/S}};
    placeSpines(); frame();
  }
  function frame() {
    for (const b of $('spines').children) {
      const v=volumes[+b.dataset.vol];
      b.style.visibility=v.out?'hidden':'visible';
      b.classList.toggle('is-match',!!matches && v.hits > 0);
      b.classList.toggle('is-dim',!!matches && !v.hits);
    }
  }

  /* ---------- spines, tip, cat ---------- */
  const spinesEl = $('spines'), tip = $('spine-tip'), catSpot = $('cat-spot');
  function placeSpines() {
    if (volumes.length && !spinesEl.children.length) {
      spinesEl.innerHTML = volumes.map(v => `<button type="button" class="spine-btn" data-vol="${v.i}" aria-label="Volume ${v.letter}, ${v.people.length} ${v.people.length === 1 ? 'person' : 'people'}"><span class="spine-letter">${v.letter}</span><span class="spine-title">PURDUE</span><span class="spine-number">${String(v.i+1).padStart(2,'0')}</span></button>`).join('');
    }
    for (const b of spinesEl.children) {
      const v = volumes[+b.dataset.vol];
      b.style.setProperty('--leather', v.c);
      Object.assign(b.style, { left: v.x * S + 'px', top: v.y * S + 'px', width: v.dw * S + 'px', height: v.h * S + 'px' });
    }
    Object.assign(catSpot.style, { left: L.cat.x * S + 'px', top: (L.cat.y - 2) * S + 'px', width: 28 * S + 'px', height: 14 * S + 'px' });
    catSpot.hidden = innerWidth < 1000;
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
    frame();
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
    let ph = Math.min(vh - (single ? 112 : 126), 710), pw = single ? Math.min(vw - 36, 480) : Math.min((vw - 96) / 2, 520);
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
  }
  function coverCanvas(v, m) {
    const c=document.createElement('canvas'); c.width=m.cw*2; c.height=m.ch*2;
    const x=c.getContext('2d'); x.scale(2,2);
    const w=m.cw,h=m.ch, rand=rng(hashStr(v.letter));
    x.fillStyle=v.c;x.fillRect(0,0,w,h);
    for(let i=0;i<18000;i++){ x.fillStyle=rand()>.5?'rgba(255,235,195,.035)':'rgba(0,0,0,.045)';x.fillRect(rand()*w,rand()*h,rand()*1.5,.7); }
    const shade=x.createLinearGradient(0,0,w,0); shade.addColorStop(0,'#0008');shade.addColorStop(.035,'#ffffff14');shade.addColorStop(.075,'#0005');shade.addColorStop(.14,'#0000');shade.addColorStop(.96,'#0000');shade.addColorStop(1,'#0007');
    x.fillStyle=shade;x.fillRect(0,0,w,h);
    x.strokeStyle='#baa477';x.lineWidth=.8;x.strokeRect(26,24,w-48,h-48);x.strokeStyle='#baa47755';x.strokeRect(30,28,w-56,h-56);
    x.fillStyle='#dbc899';x.textAlign='center';
    x.font='12px "Instrument Sans", sans-serif';x.fillText('THE PURDUE ARCHIVE',w/2,h*.20);
    x.font=`${Math.round(w*.32)}px Georgia, serif`;x.fillText(v.letter,w/2,h*.49);
    x.font='italic 22px Georgia, serif';x.fillText('Volume '+v.letter,w/2,h*.61);
    x.font='12px "Instrument Sans", sans-serif';x.fillText(v.people.length+' PEOPLE',w/2,h*.68);
    x.fillText('THE READING ROOM',w/2,h*.88);
    return c;
  }
  function spineCanvas(v) { return spineArt(v); }
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
    return `<div class="title-page"><p class="tp-letter">${v.letter}</p><p class="tp-count">${v.people.length.toLocaleString()} ${v.people.length === 1 ? 'person' : 'people'}</p><p class="tp-kinds">${parts.join(' · ')}</p><p class="tp-hint">Choose a name from the index, or use the next-page button below.</p></div>`;
  }
  function personPage(p) {
    const r = p.raw, v = volumes[p.vol];
    const role = r.role && r.organization && !r.role.toLowerCase().includes(r.organization.toLowerCase()) ? `${r.role} · ${r.organization}` : (r.role || r.organization);
    const facts = [['Purdue', r.connection], ['Based', r.region === 'Not listed' ? '' : r.region], ['Role', r.kind], ['Sector', r.company_sector]].filter(([, val]) => val);
    const high = (r.highlights || []).slice(0, 2).map(h => `<li>${esc(h.claim)}${h.date && !h.claim.includes(String(h.date).slice(0,4)) ? ` <span class="e-date">${esc(String(h.date).slice(0, 4))}</span>` : ''}</li>`).join('');
    const fund = (r.funding || [])[0];
    const links = [[r.source_url, 'Source'], [r.linkedin, 'LinkedIn'], [r.company_website, 'Website'], [r.x, 'X'], [`/alumni.html?person=${encodeURIComponent(r.id)}`, 'On the map']].filter(([u]) => safeURL(u))
      .map(([u, t]) => `<a href="${esc(u)}"${u.startsWith('/') ? '' : ' target="_blank" rel="noopener noreferrer"'}>${t}<svg class="external-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" stroke="currentColor" stroke-width="1.3"/></svg></a>`).join('');
    const asOf = r.role_as_of ? ` <span class="e-asof">as of ${esc(r.role_as_of)}</span>` : '';
    return `<article class="person">
      <header class="e-top"><div class="stamp" data-img="${esc(r.image || '')}" aria-hidden="true"><svg viewBox="0 0 64 72" fill="none" aria-hidden="true"><circle cx="32" cy="25" r="11" stroke="currentColor"/><path d="M12 62v-6a20 20 0 0 1 40 0v6M7 7h50v58H7z" stroke="currentColor"/></svg></div>
        <div><h2 class="e-name">${esc(r.name)}</h2><p class="e-role">${esc(role)}${asOf}</p></div></header>
      <div class="rule" aria-hidden="true"></div>
      <dl class="facts">${facts.map(([k, val]) => `<dt>${k}</dt><dd>${esc(val)}</dd>`).join('')}${fund ? `<dt>Company funding</dt><dd>${esc(fund.amount)}${fund.round ? `, ${esc(fund.round)}` : ''}${safeURL(fund.source_url) ? ` <a href="${esc(fund.source_url)}" target="_blank" rel="noopener noreferrer">source</a>` : ''}</dd>` : ''}</dl>
      <p class="e-why">${esc(r.why_relevant)}</p>
      ${high ? `<ul class="e-high">${high}</ul>` : ''}
      <nav class="e-links" aria-label="Links for ${esc(r.name)}">${links}</nav>
      <footer class="e-foot"><span>Vol. ${v.letter}, p. ${p.n + 1} of ${v.people.length}</span><span>Checked ${esc(r.verified_at || '')}</span></footer>
    </article>`;
  }
  function paintStamp(root) {
    const st=root.querySelector('.stamp[data-img]');
    if(!st || !safeURL(st.dataset.img)) return;
    const img=new Image();img.alt='';img.decoding='async';
    img.onload=()=>{st.replaceChildren(img);st.classList.add('has-photo');};
    img.src=st.dataset.img;
  }
  function renderEntry() {
    const v = volumes[book.vol];
    entryEl.innerHTML = book.person < 0 ? titlePage(v) : personPage(v.people[book.person]);
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
    boards.style.clipPath = book.single ? '' : 'inset(0 0 0 50%)';
    if (motion) {
      spread.animate([{ transform: `translateX(${shift}px)` }, { transform: 'translateX(0)' }], { duration: 780, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
      await swing(h, true, 780);
    }
    for (const a of spread.getAnimations()) a.cancel();
    spread.style.transform = '';
    h.leaf.remove();
    pageL.style.visibility = '';
    boards.style.clipPath = '';
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
      boards.style.clipPath = book.single ? '' : 'inset(0 0 0 50%)';
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
    reader.hidden = true; spread.style.visibility = ''; pageL.style.visibility = ''; boards.style.clipPath = '';
    for (const a of [...spread.getAnimations(), ...scrim.getAnimations()]) a.cancel();
    book.open = false; busy = false; book.person = -1; roomInert(false);
    syncURL();
    if (returnFocus) returnFocus.focus({ preventScroll: true });
  }
  function spineArt(v) {
    const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(v.dw*S*2));c.height=Math.max(1,Math.round(v.h*S*2));
    const x=c.getContext('2d'), w=c.width,h=c.height;
    x.fillStyle=v.c;x.fillRect(0,0,w,h);
    const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#000a');g.addColorStop(.22,'#ffffff15');g.addColorStop(.8,'#0000');g.addColorStop(1,'#000a');x.fillStyle=g;x.fillRect(0,0,w,h);
    x.fillStyle='#d4bd8a';x.textAlign='center';x.font=`${w*.55}px Georgia,serif`;x.fillText(v.letter,w/2,h*.35);
    x.fillRect(w*.18,h*.14,w*.64,1);x.fillRect(w*.18,h*.85,w*.64,1);
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

  indexEl.addEventListener('click', e => {
    const b = e.target.closest('button[data-n]');
    if (!b || busy) return;
    if (+b.dataset.n === book.person && book.single) {
      setView('entry'); entryEl.tabIndex = -1; entryEl.focus({preventScroll:true});
    } else turnTo(+b.dataset.n, +b.dataset.n > book.person ? 1 : -1);
  });
  closeBtn.addEventListener('click', closeBook);
  $('previous-person').addEventListener('click', () => turnTo(book.person - 1, -1));
  $('next-person').addEventListener('click', () => turnTo(book.person + 1, 1));
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
        const f = [...bookEl.querySelectorAll('button:not([hidden]), a[href]')].filter(el => el.offsetParent && getComputedStyle(el).visibility !== 'hidden' && !el.disabled && !el.closest('.ghost, .sheet'));
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
      if (book.open && !busy) { applyMetrics(metrics(), volumes[book.vol]); setView(book.single && book.person >= 0 ? 'entry' : 'index'); }
    }, 120);
  });
  layout();

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
