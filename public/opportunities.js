const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const controls = {
  search: document.querySelector('#op-search'),
  type: document.querySelector('#op-type'),
  scope: document.querySelector('#op-scope'),
  stage: document.querySelector('#op-stage'),
};
const list = document.querySelector('#op-list');
const more = document.querySelector('#op-more');
let opportunities = [], shown = 24;

function stateLabel(item) {
  if (item.status === 'upcoming_deadline') return `Deadline ${item.deadline}`;
  if (item.status === 'deadline_passed') return 'Prior deadline passed';
  if (item.status === 'rolling') return 'Rolling';
  return 'Check current cycle';
}

function render() {
  const query = controls.search.value.trim().toLowerCase();
  const matches = opportunities.filter(item =>
    (!controls.type.value || item.type === controls.type.value) &&
    (!controls.scope.value || item.scope === controls.scope.value) &&
    (!controls.stage.value || item.stage === controls.stage.value) &&
    (!query || [item.name, item.organizer, item.type, item.scope, item.stage, item.audience, item.benefit, item.eligibility].join(' ').toLowerCase().includes(query))
  ).sort((a, b) => {
    const rank = {upcoming_deadline: 0, rolling: 1, check_source: 2, deadline_passed: 3};
    return rank[a.status] - rank[b.status] || (a.deadline || '9999').localeCompare(b.deadline || '9999') || a.name.localeCompare(b.name);
  });
  document.querySelector('#op-count').textContent = `${matches.length} of ${opportunities.length} opportunities`;
  list.innerHTML = matches.slice(0, shown).map(item => `<article class="op-row">
    <div class="op-row-main"><div class="op-meta">${esc(item.organizer)} · ${esc(item.scope)} · ${esc(item.stage)}</div><h3>${esc(item.name)}</h3><p>${esc(item.benefit)}</p><small>For: ${esc(item.eligibility)}</small></div>
    <div class="op-row-side"><span class="op-kind">${esc(item.type)}</span>${item.amount_text ? `<a class="op-amount" href="${esc(item.amount_source_url)}" target="_blank" rel="noopener noreferrer">${esc(item.amount_text)}</a>` : ''}${item.deadline_source_url ? `<a class="op-status${item.status === 'deadline_passed' ? ' is-past' : ''}" href="${esc(item.deadline_source_url)}" target="_blank" rel="noopener noreferrer">${esc(stateLabel(item))}</a>` : `<span class="op-status${item.status === 'deadline_passed' ? ' is-past' : ''}">${esc(stateLabel(item))}</span>`}<div class="op-links"><a href="${esc(item.apply_url)}" target="_blank" rel="noopener noreferrer">Open program ↗</a><a href="${esc(item.source_url)}" target="_blank" rel="noopener noreferrer">Source ↗</a></div></div>
  </article>`).join('') || '<p class="op-empty">No matches. Try a broader search.</p>';
  more.hidden = shown >= matches.length;
}

function options(select, values) {
  select.innerHTML += [...new Set(values)].sort((a, b) => a.localeCompare(b)).map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
}

for (const control of Object.values(controls)) control.addEventListener(control === controls.search ? 'input' : 'change', () => { shown = 24; render(); });
more.addEventListener('click', () => { shown += 24; render(); });
fetch('/opportunities.json').then(response => {
  if (!response.ok) throw Error('Opportunities unavailable');
  return response.json();
}).then(data => {
  opportunities = data.opportunities;
  document.querySelector('#op-summary').textContent = `${opportunities.length} SOURCE-LINKED OPPORTUNITIES · PURDUE / INDIANA / BEYOND`;
  options(controls.type, opportunities.map(item => item.type));
  options(controls.scope, opportunities.map(item => item.scope));
  options(controls.stage, opportunities.map(item => item.stage));
  render();
}).catch(() => {
  document.querySelector('#op-count').textContent = 'Directory unavailable';
  list.innerHTML = '<p class="op-empty">Refresh to retry.</p>';
});
