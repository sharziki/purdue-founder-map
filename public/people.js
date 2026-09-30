const grid=document.querySelector('#people-grid');
const search=document.querySelector('#people-search');
const lanes=document.querySelector('#people-lanes');
const count=document.querySelector('#people-count');
const more=document.querySelector('#people-more');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let people=[],shown=12,lane=new URLSearchParams(location.search).get('lane')||'All';
function render(){
  const q=search.value.trim().toLowerCase();
  const filtered=people.filter(p=>(lane==='All'||p.lane===lane)&&(!q||[p.name,p.role,p.organization,p.helps,p.lane].join(' ').toLowerCase().includes(q)));
  lanes.innerHTML='<span class="lane-indicator" aria-hidden="true"></span>'+['All','Start','Community','Programs','Research & IP','Capital','Alumni'].map(x=>`<button type="button" data-lane="${esc(x)}" aria-pressed="${x===lane}">${esc(x)}</button>`).join('');
  lanes.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{lane=b.dataset.lane;search.value='';shown=12;history.replaceState(null,'',lane==='All'?'/people.html':'/people.html?lane='+encodeURIComponent(lane));render()}));
  requestAnimationFrame(positionIndicator);
  count.textContent=`${filtered.length} of ${people.length} public contacts`;
  grid.innerHTML=filtered.length?filtered.slice(0,shown).map(p=>`<article class="person-card"><div class="person-image ${p.image?'':'no-photo'}">${p.image?`<img src="${esc(p.image)}" alt="Portrait of ${esc(p.name)}" loading="lazy">`:`<span aria-hidden="true">${esc(p.name.split(' ').map(w=>w[0]).slice(0,2).join(''))}</span>`}</div><div class="person-info"><span class="person-lane">${esc(p.lane)}</span><h2>${esc(p.name)}</h2><p class="person-role">${esc(p.role)}</p><p class="person-org">${esc(p.organization)}</p><div class="person-helps"><b>GO HERE FOR</b><p>${esc(p.helps)}</p></div>${p.email?`<a class="person-email" href="mailto:${esc(p.email)}">${esc(p.email)} ↗</a>`:''}<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Official profile ↗</a></div></article>`).join(''):'<p class="people-empty">No match. Clear search or choose another kind of help.</p>';
  more.hidden=shown>=filtered.length;
}
function positionIndicator(){const active=lanes.querySelector('button[aria-pressed="true"]'),indicator=lanes.querySelector('.lane-indicator');if(!active||!indicator)return;const a=active.getBoundingClientRect(),root=lanes.getBoundingClientRect();indicator.style.transform=`translate(${a.left-root.left}px,${a.top-root.top}px)`;indicator.style.width=`${a.width}px`;indicator.style.height=`${a.height}px`}
window.addEventListener('resize',positionIndicator);
lanes.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const buttons=[...lanes.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(i<0)return;e.preventDefault();buttons[(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].click();lanes.querySelector('button[aria-pressed="true"]').focus()});
fetch('/people.json').then(r=>{if(!r.ok)throw Error('People data unavailable');return r.json()}).then(data=>{people=data.people;render()}).catch(()=>{count.textContent='People data unavailable';grid.innerHTML='<p class="people-empty">Refresh the page to retry.</p>'});
search.addEventListener('input',()=>{shown=12;render()});
more.addEventListener('click',()=>{shown+=12;render()});
