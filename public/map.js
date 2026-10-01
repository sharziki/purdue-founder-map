/* Purdue Founder Map. MIT. Controls adapted from Kokonut UI; see vendor/kokonut-source. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = s => /^(https?:\/\/|\/(?!\/)|mailto:)/i.test(s || '') ? esc(s) : '#';
  const cache = new Map();
  const endpoint = {alumni:'/alumni.json',people:'/people.json',opportunities:'/opportunities.json',resources:'/data.json',events:'/events.json'};
  const load = kind => {
    if (!cache.has(kind)) cache.set(kind, fetch(endpoint[kind]).then(r => {if (!r.ok) throw Error('Could not load data');return r.json();}).then(d => d[kind]).catch(e => {cache.delete(kind);throw e;}));
    return cache.get(kind);
  };
  const arrow = '<span aria-hidden="true"><svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></span>';
  const avatar = p => {
    const image = p.image || (p.id === 'akshay-kothari' ? '/assets/alumni/akshay-kothari.webp' : '');
    return image ? `<img class="portrait" src="${safe(image)}" width="56" height="56" alt="" loading="lazy">` : '<span class="portrait no-portrait" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></svg></span>';
  };
  const button = (label, url, dark = false) => `<a class="button ${dark ? 'button-dark':'button-light'}" href="${safe(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ${arrow}</a>`;
  const state = p => {
    if (p.deadline) {
      const past = p.deadline < new Date().toLocaleDateString('en-CA');
      return `${past ? 'Prior deadline:':'Due'} ${new Date(p.deadline+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    }
    return p.application_cycle === 'rolling' ? 'Rolling' : 'Check next cycle';
  };
  const peopleRow = p => `<article class="person-row" id="${esc(p.id)}">${avatar(p)}<div class="person-name"><a href="${safe(p.source_url)}" data-profile="${esc(p.id)}" data-kind="alumni">${esc(p.name)}</a><span>${esc(p.connection)}</span></div><div class="person-work"><strong>${esc(p.organization)}</strong><span>${esc(p.role)}</span></div><div class="person-region">${esc(p.region === 'Not listed' ? 'Location not listed' : p.region)}</div><span class="pill">${esc(p.kind)}</span><a class="row-arrow" href="${safe(p.source_url)}" data-profile="${esc(p.id)}" data-kind="alumni" aria-label="View ${esc(p.name)}"><svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a></article>`;
  const campusRow = p => `<article class="campus-card">${avatar(p)}<div><span class="eyebrow">${esc(p.lane)}</span><a href="${safe(p.url)}" data-profile="${esc(p.id)}" data-kind="people">${esc(p.name)}</a><span class="campus-org">${esc(p.organization)}</span><p>${esc(p.helps)}</p></div><a class="row-arrow" href="${safe(p.url)}" data-profile="${esc(p.id)}" data-kind="people" aria-label="View ${esc(p.name)}"><svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a></article>`;
  const opRow = p => `<article class="opportunity-row" id="${esc(p.id)}"><div><span class="eyebrow">${esc(p.organizer)}</span><a class="row-title" href="${safe(p.apply_url)}" data-profile="${esc(p.id)}" data-kind="opportunities">${esc(p.name)}</a><p>${esc(p.benefit)}</p></div><div class="op-amount">${esc(p.amount_text || p.type.charAt(0).toUpperCase()+p.type.slice(1))}<span>${esc(p.scope)} · ${esc(p.stage)}</span></div><span class="status-label ${p.application_cycle === 'rolling' ? 'status-open':''}">${esc(state(p))}</span><a class="row-arrow" href="${safe(p.apply_url)}" data-profile="${esc(p.id)}" data-kind="opportunities" aria-label="View ${esc(p.name)}"><svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a></article>`;
  const resourceRow = p => `<a class="resource-row" id="${esc(p.id)}" href="${safe(p.url)}" target="_blank" rel="noopener noreferrer"><span class="pill">${esc(p.category)}</span><div><h2>${esc(p.name)}</h2><p>${esc(p.summary)}</p></div>${arrow}</a>`;

  // Native dialogs preserve focus containment, Escape, and focus return.
  const profile = $('#profile-dialog');
  function facts(rows) {return '<dl class="profile-facts">'+rows.filter(x => x[1]).map(([label,value]) => `<dt>${esc(label)}</dt><dd>${value}</dd>`).join('')+'</dl>';}
  function factSection(title, items) {
    return items?.length ? `<section class="profile-section"><h3>${esc(title)}</h3>${items.map(x => `<div class="fact-item">${esc(x.text)}${x.url ? `<a href="${safe(x.url)}" target="_blank" rel="noopener noreferrer">View source <svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a>`:''}</div>`).join('')}</section>`:'';
  }
  function profileHTML(p, kind) {
    if (kind === 'opportunities') return `<div class="profile-top"><div><span class="eyebrow">${esc(p.type)} · ${esc(p.scope)}</span><h2 id="profile-title">${esc(p.name)}</h2><p>${esc(p.organizer)}</p></div></div><p class="profile-intro">${esc(p.benefit)}</p>${facts([['Who it’s for',esc(p.audience)],['Eligibility',esc(p.eligibility)],['Stage',esc(p.stage)],['Benefit',p.amount_text ? `<a href="${safe(p.amount_source_url)}" target="_blank" rel="noopener noreferrer">${esc(p.amount_text)} <svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a>`:''],['Application',p.deadline_source_url ? `<a href="${safe(p.deadline_source_url)}" target="_blank" rel="noopener noreferrer">${esc(state(p))} <svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a>`:esc(state(p))],['Source checked',esc(p.verified_at)]])}<div class="profile-links">${button('Open program',p.apply_url,true)}${button('Original source',p.source_url)}</div><p class="profile-disclosure">Program benefits are subject to eligibility and terms. Confirm the current cycle on the organizer’s site.</p>`;
    if (kind === 'people') return `<div class="profile-top">${avatar(p)}<div><span class="eyebrow">CAMPUS CONTACT · ${esc(p.lane)}</span><h2 id="profile-title">${esc(p.name)}</h2><p>${esc(p.organization)}</p></div></div><p class="profile-intro">${esc(p.helps)}</p>${facts([['Role',esc(p.role)],['Public work email',p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`:''],['Source checked',esc(p.verified_at)]])}<div class="profile-links">${button('Official profile',p.url,true)}${p.email?button('Write an email','mailto:'+p.email):''}</div><p class="profile-disclosure">Role and contact details are from public organization sources. Check the original profile for updates.</p>`;
    const funding = (p.funding || []).map(f => ({text:[f.amount,f.round,f.date].filter(Boolean).join(' · '),url:f.source_url}));
    const education = (p.education || []).map(x => ({text:[x.institution,x.degree,x.field,x.graduation_year,x.completion_status==='attended_no_degree'?'Attended; no completed degree':''].filter(Boolean).join(' · '),url:x.source_url}));
    const affiliations = (p.affiliations || []).map(x => ({text:[x.organization,x.role,x.as_of ? 'Source year '+x.as_of:'',x.status==='historical'?'Historical role':''].filter(Boolean).join(' · '),url:x.source_url}));
    const milestones = [...(p.highlights || []).map(x=>({text:[x.claim,x.date].filter(Boolean).join(' · '),url:x.source_url})),...(p.capital_events || []).map(x=>({text:[x.company,x.description,x.amount,x.date].filter(Boolean).join(' · '),url:x.source_url}))];
    return `<div class="profile-top">${avatar(p)}<div><span class="eyebrow">PURDUE NETWORK · ${esc(p.kind)}</span><h2 id="profile-title">${esc(p.name)}</h2><p>${esc(p.organization)}</p></div></div><p class="profile-intro">${esc(p.why_relevant)}</p><div class="profile-tags">${(p.tags||[]).map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>${facts([['Purdue connection',esc(p.connection)],['Role',esc(p.role)+(p.role_as_of?` <span>(source: ${esc(p.role_as_of)})</span>`:'')],['Region',p.region && p.region!=='Not listed'?esc(p.region):''],['Company',p.company_website?`<a href="${safe(p.company_website)}" target="_blank" rel="noopener noreferrer">${esc(p.company||p.organization)} <svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a>`:esc(p.company)],['Product',esc(p.company_product)],['Sector',esc(p.company_sector)],['Company founded',esc(p.company_founded_year)],['Company location',esc(p.company_location?.location)],['Source checked',esc(p.verified_at)]])}${factSection('Education',education)}${factSection('Company funding',funding)}${funding.length?'<p class="profile-funding-note">These amounts belong to the company, not the person.</p>':''}${factSection('Public milestones',milestones)}${factSection('Affiliations',affiliations)}<div class="profile-links">${button('Original source',p.source_url,true)}${p.linkedin?button('LinkedIn',p.linkedin):''}${p.x?button('X / Twitter',p.x):''}</div><p class="profile-disclosure">A public source is evidence of what was reported at its date. Archived roles may have changed. This listing does not imply availability for introductions.</p>`;
  }
  async function openProfile(id, kind, trigger) {
    try {
      const rows = await load(kind); const p=rows.find(x=>x.id===id); if (!p) return;
      $('#profile-content').innerHTML=profileHTML(p,kind);
      if(!profile.open) profile.showModal(); profile.scrollTop=0;
    } catch(e) { if(trigger?.href) location.href=trigger.href; }
  }
  document.addEventListener('click', e => {
    const target=e.target.closest('[data-profile]');
    if(target && !e.metaKey && !e.ctrlKey && !e.shiftKey){e.preventDefault();openProfile(target.dataset.profile,target.dataset.kind,target);}
  });
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => {if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));

  const page=document.body.dataset.page;
  if (['alumni','people','opportunities','resources'].includes(page)) {
    let rows=[],shown=page==='opportunities'?20:24;
    const input=$('#directory-search'),kind=$('#kind-filter'),region=$('#region-filter'),tag=$('#tag-filter'),stage=$('#stage-filter'),sort=$('#sort-filter');
    const controls=[input,kind,region,tag,stage,sort].filter(Boolean);
    const params=new URLSearchParams(location.search);input.value=params.get('q')||'';
    if(stage && params.get('stage')) stage.value=params.get('stage');
    function render() {
      const query=input.value.trim().toLowerCase();
      const result=rows.filter(p => {
        if(query && !p._search.includes(query)) return false;
        if(kind?.value && (p.kind||p.lane||p.type||p.category)!==kind.value)return false;
        if(stage?.value && p.stage!==stage.value)return false;
        if(tag?.value && !(p.tags||[]).some(t=>t.toLowerCase()===tag.value.toLowerCase()))return false;
        if(region?.value){
          if(page==='opportunities')return p.scope===region.value;
          const r=(p.region||'').toLowerCase();
          const patterns={'Bay Area':/bay area|san francisco|silicon valley/,'New York':/new york|nyc/,'Indiana':/indiana|lafayette|indianapolis/,'Midwest':/midwest|chicago|illinois|michigan|ohio/};
          if(!patterns[region.value]?.test(r))return false;
        }
        return true;
      });
      if(page==='alumni')result.sort(sort?.value==='organization'?(a,b)=>a.organization.localeCompare(b.organization):sort?.value==='name'?(a,b)=>a.name.localeCompare(b.name):(a,b)=>(a.highlights?.length?0:1)-(b.highlights?.length?0:1)||(a.highlight_order||999)-(b.highlight_order||999)||a.name.localeCompare(b.name));
      if(page==='opportunities')result.sort((a,b)=>(a.scope==='Purdue'?0:1)-(b.scope==='Purdue'?0:1)||a.name.localeCompare(b.name));
      const renderer={alumni:peopleRow,people:campusRow,opportunities:opRow,resources:resourceRow}[page];
      $('#directory-results').innerHTML=result.length?result.slice(0,['people','alumni'].includes(page)?result.length:shown).map(renderer).join(''):'<p class="empty-state">No matches yet. Try a broader search or reset your filters.</p>';
      $('#result-count').textContent=`${result.length.toLocaleString()} ${page==='alumni'?'profiles':page==='people'?'contacts':page}${['people','alumni'].includes(page)?'':' · showing '+Math.min(result.length,shown)}`;
      if($('#load-more'))$('#load-more').hidden=shown>=result.length;
      $('#reset-filters').hidden=!controls.some(c=>c.value && c.id!=='sort-filter');
      document.querySelectorAll('[data-quick]').forEach(b=>b.classList.toggle('active',b.dataset.quick===''?!kind?.value&&!region?.value:(kind?.value===b.dataset.quick||region?.value===b.dataset.quick)));
    }
    controls.forEach(c=>c.addEventListener(c===input?'input':'change',()=>{shown=24;render();}));
    $('#reset-filters').addEventListener('click',()=>{controls.forEach(c=>c.value='');shown=24;render();input.focus();});
    $('#load-more')?.addEventListener('click',()=>{shown+=24;render();});
    document.querySelectorAll('[data-quick]').forEach(b=>b.addEventListener('click',()=>{kind.value='';region.value='';if(b.dataset.quick==='Purdue')region.value='Purdue';else kind.value=b.dataset.quick;shown=24;render();}));
    load(page).then(data=>{rows=data.map(p=>({...p,_search:JSON.stringify(p).toLowerCase()}));render();const id=params.get('person')||params.get('program');if(id)openProfile(id,page);}).catch(()=>{$('#result-count').textContent='Live search unavailable. Showing the saved directory.';if($('#load-more'))$('#load-more').hidden=true;});
  }

  // The global search is lazy: no directory downloads until it is opened.
  const searchDialog=$('#search-dialog'),searchInput=$('#global-search'),searchResults=$('#search-results');
  let searchIndex=null,searchPromise=null;
  const baseLinks=[{title:'The founder guide',detail:'Six stages, from curiosity to company',url:'/guide.html',kind:'Guide'},{title:'Startup dictionary',detail:'Startup terms in plain English',url:'/glossary.html',kind:'Guide'},{title:'Events calendar',detail:'Find a talk, build night, or meetup',url:'/events.html',kind:'Events'},...Object.entries({'cold-outreach':'Cold outreach','first-dollar':'Your first dollar','customer-discovery':'Customer discovery','email-marketing':'Email marketing'}).map(([id,title])=>({title,detail:'A practical founder playbook',url:'/playbooks/'+id+'.html',kind:'Guide'}))];
  function buildSearch(){
    if(searchPromise)return searchPromise;
    searchPromise=Promise.all(['alumni','people','opportunities','resources'].map(load)).then(([a,p,o,r])=>{
      searchIndex=[...baseLinks,...a.map(x=>({title:x.name,detail:x.organization+' · '+x.role,url:'/alumni.html?person='+encodeURIComponent(x.id),kind:'Alumni'})),...p.map(x=>({title:x.name,detail:x.organization+' · '+x.helps,url:'/people.html?person='+encodeURIComponent(x.id),kind:'Contact'})),...o.map(x=>({title:x.name,detail:x.organizer+' · '+x.type,url:'/opportunities.html?program='+encodeURIComponent(x.id),kind:'Opportunity'})),...r.map(x=>({title:x.name,detail:x.category+' · '+x.summary,url:x.url,kind:'Resource'}))];
      return searchIndex;
    }).catch(e=>{searchPromise=null;throw e;});return searchPromise;
  }
  function searchRender(){
    if(!searchIndex)return;
    const query=searchInput.value.trim().toLowerCase();
    const matches=query?searchIndex.filter(x=>(x.title+' '+x.detail).toLowerCase().includes(query)).sort((a,b)=>(a.title.toLowerCase().startsWith(query)?0:1)-(b.title.toLowerCase().startsWith(query)?0:1)).slice(0,12):baseLinks;
    searchResults.innerHTML=matches.length?matches.map(x=>`<a href="${safe(x.url)}"><div>${esc(x.title)}<small>${esc(x.detail)}</small></div><span class="search-kind">${esc(x.kind)}</span></a>`).join(''):'<p>No results. Try a name, company, or program.</p>';
  }
  async function showSearch(){if(!searchDialog.open)searchDialog.showModal();searchInput.focus();try{await buildSearch();searchRender();}catch(e){searchResults.innerHTML='<p>Search could not load. <a href="/alumni.html">Browse people</a> or <a href="/opportunities.html">opportunities</a>.</p>';}}
  document.querySelectorAll('[data-search-open]').forEach(b=>b.addEventListener('click',showSearch));
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchDialog.open?searchDialog.close():showSearch();}});
  searchInput.addEventListener('input',searchRender);
  searchInput.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();searchResults.querySelector('a')?.focus();}if(e.key==='Enter')searchResults.querySelector('a')?.click();});
  searchResults.addEventListener('keydown',e=>{const links=[...searchResults.querySelectorAll('a')],i=links.indexOf(document.activeElement);if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const next=e.key==='ArrowDown'?i+1:i-1;if(next<0)searchInput.focus();else links[Math.min(next,links.length-1)]?.focus();}});

  // Local guide progress and useful copy controls.
  document.querySelectorAll('[data-progress]').forEach(input=>{try{input.checked=localStorage.getItem('pfm:'+input.dataset.progress)==='1';}catch(e){}input.addEventListener('change',()=>{try{localStorage.setItem('pfm:'+input.dataset.progress,input.checked?'1':'0');}catch(e){}});});
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById(b.dataset.copy).textContent);b.textContent='Copied ✓';setTimeout(()=>{b.textContent='Copy template';},1800);}catch(e){b.textContent='Select the text to copy';}}));
  $('#glossary-search')?.addEventListener('input',e=>{let visible=0;document.querySelectorAll('.glossary-term').forEach(d=>{d.hidden=!d.textContent.toLowerCase().includes(e.target.value.toLowerCase());if(!d.hidden)visible++;});$('#glossary-empty').hidden=visible>0;});

  // Calendar data stays in Eastern time; exported timestamps remain UTC.
  if(page==='events'){
    const tz='America/New_York';
    const calendarMedia=matchMedia('(max-width:760px)');
    const calendarPanel=$('.calendar-panel');
    const calendarLayout=()=>{calendarPanel.open=!calendarMedia.matches;};
    calendarLayout();calendarMedia.addEventListener('change',calendarLayout);
    const dayKey=d=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(d));
    const now=new Date();let month=now.getMonth(),year=now.getFullYear(),selected='',items=[];
    const googleURL=p=>{const stamp=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');return 'https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:p.title,dates:stamp(p.starts_at)+'/'+stamp(p.ends_at||new Date(new Date(p.starts_at).getTime()+3600000).toISOString()),details:p.url,location:p.venue||'',ctz:tz}).toString();};
    const format=(s,opts)=>new Intl.DateTimeFormat('en-US',{timeZone:tz,...opts}).format(new Date(s));
    function eligible(){return items.filter(p=>!$('#campus-only').checked||/west lafayette|purdue|hive|daniels|anvil/i.test([p.region,p.venue].join(' ')));}
    function draw(){
      $('#calendar-month').textContent=new Date(year,month,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
      const data=eligible(),keys=new Set(data.map(p=>dayKey(p.starts_at))),first=(new Date(year,month,1).getDay()+6)%7,days=new Date(year,month+1,0).getDate();
      $('#calendar-grid').innerHTML=Array.from({length:first},()=>'<span class="blank-day"></span>').join('')+Array.from({length:days},(_,i)=>{const key=`${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`,has=keys.has(key);return `<button class="${has?'has-event ':''}${selected===key?'selected ':''}${key===dayKey(now)?'today':''}" data-day="${key}" aria-label="${new Date(year,month,i+1).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}${has?', has events':''}" aria-pressed="${selected===key}">${i+1}</button>`;}).join('');
      const shown=data.filter(p=>!selected||dayKey(p.starts_at)===selected);
      $('#agenda-title').textContent=selected?new Date(selected+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'UPCOMING EVENTS';
      $('#events-list').innerHTML=shown.length?shown.map(p=>`<article class="event-row"><time datetime="${esc(p.starts_at)}"><strong>${format(p.starts_at,{day:'2-digit'})}</strong><span>${format(p.starts_at,{month:'short'})}</span></time><div><span class="eyebrow">${esc(p.host)}</span><h3><a href="${safe(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a></h3><p>${format(p.starts_at,{hour:'numeric',minute:'2-digit'})} ET · ${esc(p.venue||p.region)}</p><div class="event-actions"><a href="${safe(googleURL(p))}" target="_blank" rel="noopener noreferrer">Google Calendar <svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a><button class="text-button" data-ics="${esc(p.id)}">Download .ics ↓</button></div></div><a class="row-arrow" href="${safe(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="Event details"><svg class="arrow-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a></article>`).join(''):'<p class="empty-state">Nothing listed for this day. Pick another date or show all upcoming events.</p>';
    }
    $('#calendar-prev').addEventListener('click',()=>{month--;if(month<0){month=11;year--;}draw();});
    $('#calendar-next').addEventListener('click',()=>{month++;if(month>11){month=0;year++;}draw();});
    $('#calendar-grid').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b){selected=selected===b.dataset.day?'':b.dataset.day;draw();}});
    $('#calendar-all').addEventListener('click',()=>{selected='';draw();});$('#campus-only').addEventListener('change',draw);
    $('#events-list').addEventListener('click',e=>{const b=e.target.closest('[data-ics]');if(!b)return;const p=items.find(x=>x.id===b.dataset.ics);if(!p)return;const icsEsc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const stamp=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Purdue Founder Map//Events//EN','BEGIN:VEVENT','UID:'+p.id+'@purdue-founder-map','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(p.starts_at),'DTEND:'+stamp(p.ends_at||new Date(new Date(p.starts_at).getTime()+3600000)), 'SUMMARY:'+icsEsc(p.title),'LOCATION:'+icsEsc(p.venue),'DESCRIPTION:'+icsEsc(p.url),'URL:'+p.url,'END:VEVENT','END:VCALENDAR'];const fold=line=>{let out='',chunk='';for(const char of line){if(new TextEncoder().encode(chunk+char).length>72){out+=chunk+'\r\n ';chunk='';}chunk+=char;}return out+chunk;};const url=URL.createObjectURL(new Blob([lines.map(fold).join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=p.id+'.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    load('events').then(data=>{items=data.filter(p=>new Date(p.ends_at||p.starts_at)>=new Date()).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));draw();}).catch(()=>{$('#calendar-month').textContent='Saved event listing';});
  }
  // Menus and the subtle progress line use native navigation, without a delay.
  document.addEventListener('click',e=>{const menu=$('.site-menu');if(menu?.open&&!menu.contains(e.target))menu.open=false;const a=e.target.closest('a[href]');if(a&&!e.defaultPrevented&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!a.download&&!a.target&&a.getAttribute('href').startsWith('/')&&!a.getAttribute('href').endsWith('.json')&&!a.getAttribute('href').endsWith('.ics'))document.body.classList.add('is-navigating');});
  window.addEventListener('pageshow',()=>document.body.classList.remove('is-navigating'));
})();
