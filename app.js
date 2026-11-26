const $=id=>document.getElementById(id);
let cfg,events=[];
const state={countries:new Set(),months:new Set(Array.from({length:12},(_,i)=>i+1)),categories:new Set()};
const STORAGE_KEY='svt-modular-state-v2';
const money=(n,c)=>new Intl.NumberFormat('ko-KR',{style:'currency',currency:c,maximumFractionDigits:c==='KRW'?0:2}).format(Number(n)||0);
const asKrw=(amount,unit)=>unit==='KRW'?(Number(amount)||0):(Number(amount)||0)/(cfg.rates[unit]||1);
const month=e=>Number(e.date.slice(5,7));
const country=id=>cfg.countries.find(c=>c[0]===id);
const allMonths=()=>Array.from({length:12},(_,i)=>i+1);
const MEMBERS_BY_TITLE={
  'CxM [DOUBLE UP] LIVE PARTY':['에스쿱스','민규'],
  'SEVENTEEN WORLD TOUR [NEW_]':['에스쿱스','조슈아','준','디에잇','민규','도겸','승관','버논','디노'],
  'SEVENTEEN WORLD TOUR [NEW_] ENCORE':['에스쿱스','조슈아','준','디에잇','민규','도겸','승관','버논','디노'],
  'DxS [소야곡] ON STAGE':['도겸','승관'],
  "SEVENTEEN 2026 JAPAN FANMEETING 'YAKUSOKU'":['에스쿱스','조슈아','준','디에잇','민규','도겸','승관','버논','디노'],
  '제18회 서울재즈페스티벌 2026 (DAY 1)':['도겸','승관'],
  '2026 SVT 10TH FAN MEETING 〈SEVENTEEN in CARAT LAND〉':['에스쿱스','조슈아','준','디에잇','민규','도겸','승관','버논','디노'],
  '2026 VERNON THE8 [V8] LIVE':['디에잇','버논'],
  '2026 디노X피철인 [吉BOARD SHOW]':['디노'],
  'MADLY MEDLEY 2026 (DAY 2)':['디노'],
  'JEONGHAN X JOSHUA JOURNEY INTO [DREAMING]':['정한','조슈아']
};

function expandEvents(){
  events=[];
  cfg.events.forEach(group=>group[0].split(',').forEach(md=>{
    const [mm,dd]=md.split('-');
    const options=group[7].split(',').map(label=>{const colon=label.lastIndexOf(':');return{name:label.slice(0,colon),price:Number(label.slice(colon+1))||0}});
    const title=group[4];
    events.push({id:`${group[1]}-${md}-${events.length}`,date:`2026-${mm}-${dd}`,country:group[1],category:group[2],artist:group[3],title,venue:group[5],currency:group[6],options,grade:0,price:options[0].price,unit:group[6],members:MEMBERS_BY_TITLE[title]||[],selected:false,editing:false});
  }));
}
function visibleEvents(){return events.filter(e=>state.countries.has(e.country)&&state.months.has(month(e))&&state.categories.has(e.category))}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({events:events.map(e=>({id:e.id,selected:e.selected,grade:e.grade,price:e.price,unit:e.unit})),nickname:$('nickname').value}))}catch(_){}}
function renderFilters(){
  $('countries').innerHTML=cfg.countries.map(c=>`<button class="country" data-country="${c[0]}" aria-pressed="${state.countries.has(c[0])}">${c[2]} ${c[1]}</button>`).join('');
  $('months').innerHTML=`<label class="option"><input type="checkbox" data-all-months ${state.months.size===12?'checked':''}>전체 선택</label>`+allMonths().map(m=>`<label class="option"><input type="checkbox" data-month="${m}" ${state.months.has(m)?'checked':''}>${m}월</label>`).join('');
  $('categories').innerHTML=`<label class="option"><input type="checkbox" data-all-categories ${state.categories.size===Object.keys(cfg.categories).length?'checked':''}>전체 선택</label>`+Object.entries(cfg.categories).map(([key,label])=>`<label class="option"><input type="checkbox" data-category="${key}" ${state.categories.has(key)?'checked':''}>${label}</label>`).join('');
  const months=[...state.months].sort((a,b)=>a-b);
  $('monthSummary').textContent=months.length===12?'전체 12개월':months.length?months.map(m=>`${m}월`).join(', '):'월 선택 안 함';
  const categories=[...state.categories];
  $('categorySummary').textContent=categories.length===Object.keys(cfg.categories).length?'전체 유형':categories.length?categories.map(c=>cfg.categories[c]).join(', '):'유형 선택 안 함';
}
function renderEvents(){
  const list=visibleEvents();
  $('count').textContent=`표시 ${list.length}건 · 선택 ${events.filter(e=>e.selected).length}건`;
  $('events').innerHTML=list.length?list.map(e=>{
    const c=country(e.country);
    return `<article class="event ${e.selected?'selected':''} ${e.editing?'editing':''}"><input type="checkbox" data-select="${e.id}" ${e.selected?'checked':''} aria-label="공연 선택"><div><div class="date">${e.date} · ${c[2]} ${c[1]}</div><div class="title">${e.title}</div><div class="meta">${e.artist} · ${cfg.categories[e.category]}</div><div class="venue">${e.venue}</div><div class="event-members">참여 멤버 · ${e.members.join(', ')||'정보 없음'}</div><div class="ticket-heading"><div class="grades">${e.options.map((o,i)=>`<button type="button" class="grade ${e.grade===i?'active':''}" data-grade="${e.id}" data-index="${i}">${o.name}${o.price?` · ${money(o.price,e.currency)}`:''}</button>`).join('')}</div><button type="button" class="edit-toggle" data-edit="${e.id}" aria-label="가격 직접 입력">가격 수정</button></div>${e.editing?`<div class="edit"><input type="number" min="0" step="1" data-price="${e.id}" value="${Number(e.price)||0}" aria-label="티켓 가격"><select data-unit="${e.id}" aria-label="통화"><option value="${e.currency}" ${e.unit===e.currency?'selected':''}>${e.currency}</option><option value="KRW" ${e.unit==='KRW'?'selected':''}>KRW</option></select></div>`:''}</div></article>`;
  }).join(''):'<div class="empty">선택한 필터에 해당하는 공연이 없습니다.</div>';
}
function renderReceipt(){
  const picked=events.filter(e=>e.selected),total=picked.reduce((sum,e)=>sum+asKrw(e.price,e.unit),0);
  $('total').textContent=money(total,'KRW');$('stickyTotal').textContent=money(total,'KRW');$('stickyCount').textContent=`선택한 공연 ${picked.length}회`;
  $('visitCount').textContent=`관람 ${picked.length}회 · 국가 ${new Set(picked.map(e=>e.country)).size}개`;
  $('selectedEvents').innerHTML=picked.length?picked.map(e=>`<div class="selected-line"><span>${e.date.slice(5)} · ${e.title}</span><b>${money(asKrw(e.price,e.unit),'KRW')}</b></div>`).join(''):'<p>선택한 공연이 없습니다.</p>';
}
function render(){renderFilters();renderEvents();renderReceipt();persist()}
function selectFromShare(){if(!location.hash)return;try{const data=JSON.parse(decodeURIComponent(location.hash.slice(1)));data.events?.forEach(([id,grade,price,unit])=>{const event=events.find(e=>e.id===id);if(event)Object.assign(event,{selected:true,grade:Number(grade)||0,price:Number(price)||0,unit:unit||event.currency})});$('nickname').value=data.nickname||''}catch(_){}}

document.addEventListener('click',event=>{
  const countryButton=event.target.closest('[data-country]'),gradeButton=event.target.closest('[data-grade]'),editButton=event.target.closest('[data-edit]');
  if(countryButton){const id=countryButton.dataset.country;state.countries.has(id)?state.countries.delete(id):state.countries.add(id);render()}
  if(gradeButton){const item=events.find(e=>e.id===gradeButton.dataset.grade);if(item){item.grade=Number(gradeButton.dataset.index);item.price=item.options[item.grade].price;item.unit=item.currency;item.editing=false;render()}}
  if(editButton){const item=events.find(e=>e.id===editButton.dataset.edit);if(item){item.editing=!item.editing;render();if(item.editing)document.querySelector(`[data-price="${CSS.escape(item.id)}"]`)?.focus()}}
  if(event.target.closest('#selectVisibleEvents')){visibleEvents().forEach(item=>item.selected=true);render()}
  if(event.target.closest('#clearVisibleEvents')){visibleEvents().forEach(item=>item.selected=false);render()}
});
document.addEventListener('change',event=>{
  const input=event.target;
  if(input.matches('[data-all-months]'))state.months=input.checked?new Set(allMonths()):new Set();
  else if(input.matches('[data-month]'))input.checked?state.months.add(Number(input.dataset.month)):state.months.delete(Number(input.dataset.month));
  else if(input.matches('[data-all-categories]'))state.categories=input.checked?new Set(Object.keys(cfg.categories)):new Set();
  else if(input.matches('[data-category]'))input.checked?state.categories.add(input.dataset.category):state.categories.delete(input.dataset.category);
  else if(input.matches('[data-select]')){const item=events.find(e=>e.id===input.dataset.select);if(item)item.selected=input.checked}
  else if(input.matches('[data-price]')){const item=events.find(e=>e.id===input.dataset.price);if(item)item.price=Math.max(0,Number(input.value)||0)}
  else if(input.matches('[data-unit]')){const item=events.find(e=>e.id===input.dataset.unit);if(item){const amountInKrw=asKrw(item.price,item.unit);item.unit=input.value;item.price=input.value==='KRW'?amountInKrw:amountInKrw*(cfg.rates[input.value]||1)}}
  else return;
  render();
});
$('allCountries').onclick=()=>{state.countries=new Set(cfg.countries.map(c=>c[0]));render()};
$('clearCountries').onclick=()=>{state.countries.clear();render()};
$('nickname').oninput=persist;
$('done').onclick=()=>{$('receipt').hidden=!$('receipt').hidden;$('done').textContent=$('receipt').hidden?'완료':'공연 목록 수정';if(!$('receipt').hidden)$('receipt').scrollIntoView({behavior:'smooth'})};
$('share').onclick=async()=>{const selected=events.filter(e=>e.selected).map(e=>[e.id,e.grade,e.price,e.unit]);const url=location.href.split('#')[0]+'#'+encodeURIComponent(JSON.stringify({events:selected,nickname:$('nickname').value}));try{await navigator.clipboard.writeText(url);alert('공유 링크를 복사했어요.')}catch(_){prompt('공유 링크를 복사해 주세요.',url)}};
(async()=>{try{const response=await fetch('data/events.json');if(!response.ok)throw Error('schedule unavailable');cfg=await response.json();expandEvents();state.countries=new Set(cfg.countries.map(c=>c[0]));state.categories=new Set(Object.keys(cfg.categories));const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(saved){saved.events?.forEach(data=>{const event=events.find(e=>e.id===data.id);if(event)Object.assign(event,{selected:!!data.selected,grade:Number(data.grade)||0,price:Number(data.price)||0,unit:data.unit||event.currency})});$('nickname').value=saved.nickname||''}selectFromShare();render()}catch(error){$('events').innerHTML='<div class="empty">일정 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</div>';console.error(error)}})();
