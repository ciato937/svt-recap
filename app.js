const $=id=>document.getElementById(id);
let cfg,events=[];
const state={countries:new Set(),months:new Set(Array.from({length:12},(_,i)=>i+1)),categories:new Set()};
const STORAGE_KEY='svt-modular-state-v2';
const money=(n,c)=>new Intl.NumberFormat('ko-KR',{style:'currency',currency:c,maximumFractionDigits:c==='KRW'?0:2}).format(Number(n)||0);
const asKrw=(amount,unit)=>unit==='KRW'?(Number(amount)||0):(Number(amount)||0)/(cfg.rates[unit]||1);
const month=e=>Number(e.date.slice(5,7));
const country=id=>cfg.countries.find(c=>c[0]===id);
const allMonths=()=>Array.from({length:12},(_,i)=>i+1);

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39','"':'&quot;'}[char]))}

function expandEvents(){
  events=[];
  cfg.events.forEach(group=>group[0].split(',').forEach(md=>{
    const [mm,dd]=md.split('-');
    const options=group[7].split(',').map(label=>{const colon=label.lastIndexOf(':');return{name:label.slice(0,colon),price:Number(label.slice(colon+1))||0}});
    events.push({id:`${group[1]}-${md}-${events.length}`,date:`2026-${mm}-${dd}`,country:group[1],category:group[2],artist:group[3],title:group[4],venue:group[5],currency:group[6],options,grade:0,price:options[0].price,unit:group[6],selected:false,editing:false});
  }));
}
function visibleEvents(){return events.filter(e=>state.countries.has(e.country)&&state.months.has(month(e))&&state.categories.has(e.category))}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({events:events.map(e=>({id:e.id,selected:e.selected,grade:e.grade,price:e.price,unit:e.unit})),nickname:$('nickname').value}))}catch(_){} }
function renderFilters(){
  $('countries').innerHTML=cfg.countries.map(c=>`<button class="country" data-country="${c[0]}" aria-pressed="${state.countries.has(c[0])}">${c[2]} ${c[1]}</button>`).join('');
  $('months').innerHTML=`<label class="option"><input type="checkbox" data-all-months ${state.months.size===12?'checked':''}>전체 선택</label>`+allMonths().map(m=>`<label class="option"><input type="checkbox" data-month="${m}" ${state.months.has(m)?'checked':''}>${m}월</label>`).join('');
  $('categories').innerHTML=`<label class="option"><input type="checkbox" data-all-categories ${state.categories.size===Object.keys(cfg.categories).length?'checked':''}>전체 선택</label>`+Object.entries(cfg.categories).map(([key,label])=>`<label class="option"><input type="checkbox" data-category="${key}" ${state.categories.has(key)?'checked':''}>${label}</label>`).join('');
}
function renderEvents(){
  const list=visibleEvents();
  $('count').textContent=`표시 ${list.length}건 · 선택 ${events.filter(e=>e.selected).length}건`;
  $('events').innerHTML=list.length?list.map(e=>{
    const c=country(e.country);
    return `<article class="event ${e.selected?'selected':''} ${e.editing?'editing':''}"><input type="checkbox" data-select="${e.id}" ${e.selected?'checked':''} aria-label="공연 선택"><div><div class="date">${e.date} · ${c[2]} ${c[1]}</div><div class="title">${escapeHtml(e.title)}</div><div class="meta">${escapeHtml(e.artist)} · ${cfg.categories[e.category]}</div><div class="venue">${escapeHtml(e.venue)}</div></div></article>`;
  }).join(''):'<div class="empty">선택한 필터에 해당하는 공연이 없습니다.</div>';
}
function renderReceipt(){
  const picked=events.filter(e=>e.selected);
  const total=picked.reduce((sum,e)=>sum+asKrw(e.price,e.unit),0);
  $('total').textContent=money(total,'KRW');
  $('stickyTotal').textContent=money(total,'KRW');
  $('stickyCount').textContent=`선택한 공연 ${picked.length}회`;
  $('visitCount').textContent=`관람 ${picked.length}회 · 국가 ${new Set(picked.map(e=>e.country)).size}개`;

  const grouped=new Map();
  picked.forEach(e=>{
    const key=e.title.trim();
    const current=grouped.get(key)||{title:e.title,count:0,amount:0,dates:[]};
    current.count+=1;
    current.amount+=asKrw(e.price,e.unit);
    current.dates.push(e.date.slice(5));
    grouped.set(key,current);
  });

  $('selectedEvents').innerHTML=grouped.size?
    [...grouped.values()].map(group=>`<div class="selected-line grouped-line" data-count="${group.count}" data-title="${escapeHtml(group.title)}" data-months="${group.dates.join(',')}"><span><b class="group-title">${escapeHtml(group.title)}</b><small>${group.dates.join(' · ')}</small></span><b class="group-count">${group.count}회</b><strong>${money(group.amount,'KRW')}</strong></div>`).join(''):
    '<p>선택한 공연이 없습니다.</p>';
}
function render(){renderFilters();renderEvents();renderReceipt();persist()}

(async()=>{
  try{
    const response=await fetch('data/events.json');
    if(!response.ok)throw Error('schedule unavailable');
    cfg=await response.json();expandEvents();state.countries=new Set(cfg.countries.map(c=>c[0]));state.categories=new Set(Object.keys(cfg.categories));
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(saved){saved.events?.forEach(data=>{const event=events.find(e=>e.id===data.id);if(event)Object.assign(event,{selected:!!data.selected,grade:Number(data.grade)||0,price:Number(data.price)||0,unit:data.unit||event.currency})});$('nickname').value=saved.nickname||''}
    render();
  }catch(error){$('events').innerHTML='<div class="empty">일정 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</div>';console.error(error)}
})();
