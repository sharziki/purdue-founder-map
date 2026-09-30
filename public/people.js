const grid=document.querySelector('#people-grid');
const search=document.querySelector('#people-search');
const lanes=document.querySelector('#people-lanes');
const count=document.querySelector('#people-count');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let people=[],lane=new URLSearchParams(location.search).get('lane')||'All';
function render(){
  const q=search.value.trim().toLowerCase();
  const filtered=people.filter(p=>(lane==='All'||p.lane===lane)&&(!q||[p.name,p.role,p.organization,p.helps,p.lane].join(' ').toLowerCase().includes(q)));
  lanes.innerHTML=['All','Start','Community','Programs','Research & IP','Capital','Alumni'].map(x=>`<button type="button" data-lane="${esc(x)}" aria-pressed="${x===lane}">${esc(x)}</button>`).join('');
  lanes.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{lane=b.dataset.lane;search.value='';history.replaceState(null,'',lane==='All'?'/people.html':'/people.html?lane='+encodeURIComponent(lane));render()}));
  count.textContent=`${filtered.length} of ${people.length} public contacts`;
  grid.innerHTML=filtered.length?filtered.map(p=>`<article class="person-card"><div class="person-image ${p.image?'':'no-photo'}">${p.image?`<img src="${esc(p.image)}" alt="Portrait of ${esc(p.name)}" loading="lazy">`:`<span aria-hidden="true">${esc(p.name.split(' ').map(w=>w[0]).slice(0,2).join(''))}</span>`}</div><div class="person-info"><span class="person-lane">${esc(p.lane)}</span><h2>${esc(p.name)}</h2><p class="person-role">${esc(p.role)}</p><p class="person-org">${esc(p.organization)}</p><div class="person-helps"><b>GO HERE FOR</b><p>${esc(p.helps)}</p></div><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Official profile ↗</a></div></article>`).join(''):'<p class="people-empty">No match. Clear search or choose another kind of help.</p>';
}
fetch('/people.json').then(r=>{if(!r.ok)throw Error('People data unavailable');return r.json()}).then(data=>{people=data.people;render()}).catch(()=>{count.textContent='People data unavailable';grid.innerHTML='<p class="people-empty">Refresh the page to retry.</p>'});
search.addEventListener('input',render);
