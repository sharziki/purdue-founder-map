const root = document.querySelector('#alumni-list');
const search = document.querySelector('#alumni-search');
const filters = document.querySelector('#alumni-filters');
const count = document.querySelector('#alumni-count');
const more = document.querySelector('#alumni-more');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const kinds = ['All', 'Highlights', 'Founder', 'Investor', 'Operator', 'Bay Area', 'Indiana'];
let people = [], filter = 'Highlights', shown = 12;

function basedIn(person) {
  return [person.location_city, person.location_region, person.location_country].filter(Boolean).join(', ');
}
function regionMatch(person) {
  const place = [person.region, basedIn(person)].join(' ');
  return filter === 'All' || (filter === 'Highlights' && person.highlights?.length) || filter === person.kind ||
    (filter === 'Bay Area' && /Bay Area|San Francisco|Palo Alto|Silicon Valley/i.test(place)) ||
    (filter === 'Indiana' && /Indiana/i.test(place));
}
function positionPill() {
  const active = filters.querySelector('button[aria-pressed=true]');
  const pill = filters.querySelector('.tab-pill');
  if (!active || !pill) return;
  const a = active.getBoundingClientRect(), b = filters.getBoundingClientRect();
  pill.style.width = a.width + 'px';
  pill.style.height = a.height + 'px';
  pill.style.transform = `translate(${a.left - b.left}px,${a.top - b.top}px)`;
}
function sourceLink(url, label) {
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
}
function extraFacts(person) {
  const facts = [];
  const place = basedIn(person);
  if (place) facts.push(`<p><b>Based in</b> ${esc(place)} ${sourceLink(person.location_source_url, 'Source')}${person.location_as_of ? ` <small>As of ${esc(person.location_as_of)}</small>` : ''}${person.location_note ? ` <small>${esc(person.location_note)}</small>` : ''}</p>`);
  if (person.company_location?.location) facts.push(`<p><b>Company location in source</b> ${esc(person.company_location.location)} ${sourceLink(person.company_location.source_url, 'Source')}</p>`);
  if (person.company_product) facts.push(`<p><b>What the company makes</b> ${esc(person.company_product)} ${sourceLink(person.company_product_source_url, 'Source')}</p>`);
  if (person.company_sector) facts.push(`<p><b>Field</b> ${esc(person.company_sector)} ${sourceLink(person.company_sector_source_url, 'Source')}</p>`);
  if (person.company_founded_year) facts.push(`<p><b>Founded</b> ${esc(person.company_founded_year)} ${sourceLink(person.company_founded_year_source_url, 'Source')}</p>`);
  if (person.company_website) facts.push(`<p><b>Company</b> ${sourceLink(person.company_website, 'Website')}</p>`);
  for (const milestone of person.highlights || []) facts.push(`<p><b>Milestone</b> ${esc(milestone.claim)}${milestone.date ? ` · ${esc(milestone.date)}` : ''} ${sourceLink(milestone.source_url, 'Source')}</p>`);
  for (const event of person.capital_events || []) facts.push(`<p><b>${esc(event.type.replaceAll('_', ' '))}</b> ${esc(event.company)} · ${esc(event.description)}${event.amount ? ` · ${esc(event.amount)}` : ''}${event.date ? ` · ${esc(event.date)}` : ''} ${sourceLink(event.source_url, 'Source')}</p>`);
  for (const claim of person.funding || []) {
    const kind = claim.round || claim.type?.replaceAll('_', ' ');
    facts.push(`<p><b>Company funding</b> ${person.company ? `${esc(person.company)} · ` : ''}${esc(claim.amount)}${kind ? ` · ${esc(kind)}` : ''}${claim.date ? ` · ${esc(claim.date)}` : ''} ${sourceLink(claim.source_url, 'Source')}</p>`);
  }
  const links = [];
  if (person.linkedin) links.push(sourceLink(person.linkedin, 'LinkedIn'));
  if (person.x) links.push(sourceLink(person.x, 'X'));
  if (!person.linkedin) links.push(sourceLink(`https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in/ "${person.name}" Purdue`)}`, 'Search LinkedIn'));
  if (!person.x) links.push(sourceLink(`https://www.google.com/search?q=${encodeURIComponent(`site:x.com/ "${person.name}" "${person.organization}"`)}`, 'Search X'));
  facts.push(`<p><b>Profiles</b> ${links.join(' ')}</p>`);
  if (person.flags?.length) facts.push(`<div class="alumni-flags">${person.flags.map(flag => `<a href="${esc(person.flag_sources[flag])}" target="_blank" rel="noopener noreferrer"${person.flag_notes?.[flag] ? ` title="${esc(person.flag_notes[flag])}"` : ''}>${esc(flag.replaceAll('-', ' '))} ↗</a>`).join('')}</div>`);
  return facts.length ? `<div class="alumni-facts">${facts.join('')}</div>` : '';
}
function renderRow(person) {
  const initials = person.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const image = person.image ? `<img src="${esc(person.image)}" alt="" loading="lazy">` : esc(initials);
  const location = basedIn(person) || person.region;
  const otherSources = person.source_urls?.slice(1).map((url, i) => sourceLink(url, `Additional source ${i + 1}`)).join(' ') || '';
  return `<details class="alumni-row"><summary>
    <span class="alumni-initial" aria-hidden="true">${image}</span>
    <span class="alumni-name">${esc(person.name)}</span>
    <span class="alumni-role">${esc(person.role)} · ${esc(person.organization)}<small>${esc(person.connection)}</small></span>
    <span class="alumni-region">${esc(location)}</span><span aria-hidden="true">↗</span>
  </summary><div class="alumni-expand">
    <p>${esc(person.why_relevant)}</p>
    ${person.location_detail ? `<p>Location note: ${esc(person.location_detail)}</p>` : ''}
    ${extraFacts(person)}
    ${sourceLink(person.source_url, 'Purdue or public profile')} ${otherSources}
    <small>Source checked ${esc(person.verified_at)}${person.role_as_of ? ` · Role described in ${esc(person.role_as_of)}` : ' · Role date not stated'} · Public professional information</small>
  </div></details>`;
}
function render() {
  const query = search.value.trim().toLowerCase();
  const matches = people.filter(person => regionMatch(person) && (!query || [person.name, person.connection, person.role, person.organization, person.region, person.why_relevant, basedIn(person), person.company_location?.location, person.company_sector, person.company_product, ...(person.flags || []), ...(person.notable_lanes || []), ...(person.highlights || []).map(item => item.claim)].join(' ').toLowerCase().includes(query)));
  if (filter === 'Highlights' && !query) matches.sort((a, b) => (a.highlight_order ?? 999) - (b.highlight_order ?? 999) || a.name.localeCompare(b.name));
  filters.innerHTML = '<span class="tab-pill" aria-hidden="true"></span>' + kinds.map(kind => `<button type="button" data-filter="${esc(kind)}" aria-pressed="${kind === filter}">${esc(kind)}</button>`).join('');
  filters.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; shown = 12; render(); }));
  requestAnimationFrame(positionPill);
  count.textContent = `${matches.length} of ${people.length} sourced profiles`;
  root.innerHTML = matches.slice(0, shown).map(renderRow).join('') || '<p class="resource-empty">No match. Try a broader search.</p>';
  more.hidden = shown >= matches.length;
}
search.addEventListener('input', () => { shown = 12; render(); });
more.addEventListener('click', () => { shown += 12; render(); });
window.addEventListener('resize', positionPill);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault(); search.focus();
  }
});
fetch('/alumni.json').then(response => {
  if (!response.ok) throw Error('Alumni data unavailable');
  return response.json();
}).then(data => {
  people = data.alumni;
  document.querySelector('#alumni-summary').textContent = `${people.length} SOURCED PROFILES · FOUNDERS / INVESTORS / OPERATORS`;
  render();
}).catch(() => {
  count.textContent = 'Directory unavailable';
  root.innerHTML = '<p class="resource-empty">Refresh to retry.</p>';
});

if(window.gsap&&window.ScrollTrigger&&!matchMedia('(prefers-reduced-motion: reduce)').matches){gsap.registerPlugin(ScrollTrigger);document.documentElement.dataset.motion='gsap';gsap.from('.alumni-hero>div',{y:15,opacity:0,duration:.65,stagger:.12,ease:'power2.out',clearProps:'all'});gsap.from('.sf-event',{scrollTrigger:{trigger:'.sf-event',start:'top 90%',once:true},y:12,opacity:0,duration:.45,clearProps:'all'});window.addEventListener('pagehide',()=>ScrollTrigger.getAll().forEach(t=>t.kill()),{once:true})}
