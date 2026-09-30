const stages = [
  {name:'Explore',number:'01',prompt:'I want to build something.',action:'Show up to an open founder night. Meet builders. Write down problems you understand.',ids:['buildpurdue','anvil','startup-school']},
  {name:'Validate',number:'02',prompt:'I have a problem or idea.',action:'Talk to five potential users. Test demand before polishing a pitch.',ids:['buildpurdue-cohort','moonshot','firestarter']},
  {name:'Build',number:'03',prompt:'I’m making the first version.',action:'Find peers, workspace, small grants, and any IP help you need.',ids:['hive','purdue-hackers-microgrants','otc-disclosure']},
  {name:'Launch',number:'04',prompt:'I need real users.',action:'Ship something small. Ask for a pilot, payment, or repeat use.',ids:['nvc','boilerlaunch','talent-connect']},
  {name:'Fund',number:'05',prompt:'I can show evidence.',action:'Choose revenue, grants, local capital, or a national accelerator.',ids:['ventures','yc','a16z-speedrun']},
  {name:'Scale',number:'06',prompt:'This works. Now grow.',action:'Strengthen distribution, hiring, operations, and your investor network.',ids:['innovates-accelerator','techpoint','research-park']}
];
let resources=[], events=[], saved = new Set(JSON.parse(localStorage.getItem('pfm-saved') || '[]'));
let category='All', savedOnly=false;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = id => resources.find(r => r.id===id);
const external = (url,label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;

function renderStages(){
  $('#route-map').innerHTML=stages.map((s,i)=>`<button class="route-stop" type="button" data-route-stage="${s.name}" aria-label="Filter ${s.name} resources"><span class="route-node">${s.number}</span><span class="route-name">${s.name}</span><small>${['Meet builders','Find a real problem','Make a first test','Win first users','Choose capital','Grow repeatably'][i]}</small></button>`).join('');
  document.querySelectorAll('[data-route-stage]').forEach(button=>button.addEventListener('click',()=>{$('#stage-filter').value=button.dataset.routeStage;renderResources();$('#directory').scrollIntoView({behavior:'smooth'})}));
  $('#stage-grid').innerHTML=stages.map(s=>`<article class="stage-card"><div class="stage-head"><span>${s.number} / 06</span><span class="stage-arrow">↗</span></div><h3>${s.prompt}</h3><p>${s.action}</p><div class="stage-door">${s.ids.map(id=>{const r=byId(id);return r?external(r.url,esc(r.name)+' ↗'):''}).join('')}</div><button type="button" data-stage="${s.name}">See ${s.name.toLowerCase()} resources <span>→</span></button></article>`).join('');
  document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{ $('#stage-filter').value=button.dataset.stage;renderResources();$('#directory').scrollIntoView({behavior:'smooth'}); }));
}
function renderCategories(){
  const cats=['All',...new Set(resources.map(r=>r.category))].sort((a,b)=>a==='All'?-1:b==='All'?1:a.localeCompare(b));
  $('#category-filters').innerHTML=cats.map(c=>`<button type="button" class="chip ${c===category?'active':''}" data-category="${esc(c)}" aria-pressed="${c===category}">${esc(c)}</button>`).join('');
  document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;renderCategories();renderResources()}));
}
function renderResources(){
  const q=$('#search').value.trim().toLowerCase(), stage=$('#stage-filter').value, geo=$('#geo-filter').value;
  $('#clear-search').hidden=!q;
  const filtered=resources.filter(r=>(!q||[r.name,r.category,r.summary,r.audience,r.geography].join(' ').toLowerCase().includes(q))&&(!stage||r.stage===stage)&&(!geo||r.geography===geo)&&(category==='All'||r.category===category)&&(!savedOnly||saved.has(r.id)));
  $('#results-label').textContent=`${filtered.length} of ${resources.length} resources`;
  $('#saved-count').textContent=saved.size;
  $('#saved-toggle').setAttribute('aria-pressed',String(savedOnly));
  $('#resource-list').innerHTML=filtered.length?filtered.map(r=>`<article class="resource"><div class="resource-main"><div class="resource-tags"><span>${esc(r.category)}</span><span>${esc(r.geography)}</span><span>${esc(r.stage)}</span>${r.id.startsWith('navigator-')?'<span>Navigator listing</span>':''}</div><h3>${esc(r.name)}</h3><p>${esc(r.summary)}</p><div class="resource-audience">FOR ${esc(r.audience)}</div></div><div class="resource-side"><p>${esc(r.next_step)}</p><div class="resource-links">${external(r.url,'Open resource ↗')}${external(r.source,'Source ↗')}</div><button class="save" data-save="${esc(r.id)}" aria-label="${saved.has(r.id)?'Remove saved':'Save'} ${esc(r.name)}" aria-pressed="${saved.has(r.id)}">${saved.has(r.id)?'★':'☆'}</button></div></article>`).join(''):'<div class="empty">No matching resources. Try a broader search or clear filters.</div>';
  document.querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);localStorage.setItem('pfm-saved',JSON.stringify([...saved]));renderResources()}));
}
function renderEvents(){
  $('#event-count').textContent=String(events.length).padStart(2,'0');
  $('#events-list').innerHTML=events.length?events.map(e=>{const d=new Date(e.starts_at);return `<article class="event"><div class="event-date"><strong>${d.toLocaleDateString('en-US',{day:'2-digit',timeZone:'America/Indiana/Indianapolis'})}</strong><span>${d.toLocaleDateString('en-US',{month:'short',timeZone:'America/Indiana/Indianapolis'}).toUpperCase()}</span></div><div class="event-info"><span>${esc(e.host)} · ${d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/Indiana/Indianapolis'})} ET</span><h3>${esc(e.title)}</h3><p>${esc(e.venue||'See event page')}</p></div>${external(e.url,'Details ↗')}</article>`}).join(''):'<div class="empty">No confirmed upcoming events in current feeds. Check the organizer calendars.</div>';
}
async function boot(){
  try {const data=await (await fetch('/data.json')).json();resources=data.resources;$('#resource-count').textContent=String(resources.length).padStart(2,'0');$('#updated').textContent=`Index refreshed ${data.checked_at}`;$('#stage-filter').innerHTML+=stages.map(s=>`<option>${esc(s.name)}</option>`).join('');renderStages();renderCategories();renderResources();}
  catch(e){$('#resource-list').innerHTML='<div class="empty">Resource data failed to load. Please refresh.</div>';console.error(e)}
  try {const data=await (await fetch('/events.json')).json();events=data.events.filter(e=>new Date(e.starts_at)>new Date());renderEvents();}
  catch(e){$('#events-list').innerHTML='<div class="empty">Event feed unavailable. Use the organizer calendars.</div>';console.error(e)}
}
$('#search').addEventListener('input',renderResources);$('#stage-filter').addEventListener('change',renderResources);$('#geo-filter').addEventListener('change',renderResources);
$('#clear-search').addEventListener('click',()=>{$('#search').value='';renderResources();$('#search').focus()});
$('#saved-toggle').addEventListener('click',()=>{savedOnly=!savedOnly;renderResources()});
document.addEventListener('keydown',e=>{if((e.key==='/'||((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'))&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus()}else if(e.key==='Escape'&&document.activeElement===$('#search')){$('#search').value='';renderResources();$('#search').blur()}});
document.querySelectorAll('[data-filter-category]').forEach(a=>a.addEventListener('click',()=>{category=a.dataset.filterCategory;renderCategories();renderResources()}));
boot();
