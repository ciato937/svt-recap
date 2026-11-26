const $=id=>document.getElementById(id);
let cfg,events=[];
const state={countries:new Set(),months:new Set(Array.from({length:12},(_,i)=>i+1)),categories:new Set()};
const STORAGE_KEY='svt-modular-state-v2';
const money=(n,c)=>new Intl.NumberFormat('ko-KR',{style:'currency',currency:c,maximumFractionDigits:c==='KRW'?0:2}).format(Number(n)||0);
const asKrw=(amount,unit)=>unit==='KRW'?(Number(amount)||0):(Number(amount)||0)/(cfg.rates[unit]||1);
const month=e=>Number(e.date.slice(5,7));
const country=id=>cfg.countries.find(c=>c[0]===id);
const allMonths=()=>Array.from({length:12},(_,i)=>i+1);
const TEAM_MEMBERS=['에스쿱스','조슈아','준','디에잇','민규','도겸','승관','버논','디노'];
const MEMBERS_BY_TITLE={
  'CxM [DOUBLE UP] LIVE PARTY':['에스쿱스','민규'],
  'SEVENTEEN WORLD TOUR [NEW_]':TEAM_MEMBERS,
  'SEVENTEEN WORLD TOUR [NEW_] ENCORE':TEAM_MEMBERS,
  'DxS [소야곡] ON STAGE':['도겸','승관'],
  "SEVENTEEN 2026 JAPAN FANMEETING 'YAKUSOKU'":TEAM_MEMBERS,
  '제18회 서울재즈페스티벌 2026 (DAY 1)':['도겸','승관'],
  '2026 SVT 10TH FAN MEETING 〈SEVENTEEN in CARAT LAND〉':TEAM_MEMBERS,
  '2026 VERNON THE8 [V8] LIVE':['디에잇','버논'],
  '2026 디노X피철인 [吉BOARD SHOW]':['디노'],
  'MADLY MEDLEY 2026 (DAY 2)':['디노'],
  'JEONGHAN X JOSHUA JOURNEY INTO [DREAMING]':['정한','조슈아']
};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function membersForGroup(group,title){
  if(Array.isArray(group[8])&&group[8].length)return [...group[8]];
  if(Array.isArray(MEMBERS_BY_TITLE[title]))return [...MEMBERS_BY_TITLE[title]];
  const artist=String(group[3]||'');
  if(group[2]==='WORLD_TOUR'||group[2]==='FAN_MEETING'||title.includes('CARAT LAND'))return [...TEAM_MEMBERS];
  if(title.includes('서울재즈페스티벌')||artist.includes('도겸X승관'))return ['도겸','승관'];
  if(artist.includes('에스쿱스X민규'))return ['에스쿱스','민규'];
  if(artist.includes('버논X디에잇'))return ['디에잇','버논'];
  if(artist.includes('정한X조슈아'))return ['정한','조슈아'];
  if(artist.includes('디노')||title.includes('MADLY MEDLEY'))return ['디노'];
  return [];
}
function expandEvents(){
  events=[];
  cfg.events.forEach(group=>group[0].split(',').forEach(md=>{
    const [mm,dd]=md.split('-');
    const options=group[7].split(',').map(label=>{const colon=label.lastIndexOf(':');return{name:label.slice(0,colon),price:Number(label.slice(colon+1))||0}});
    const title=group[4],members=membersForGroup(group,title);
    events.push({id:`${group[1]}-${md}-${events.length}`,date:`2026-${mm}-${dd}`,country:group[1],category:group[2],artist:group[3],title,venue:group[5],currency:group[6],options,grade:0,price:options[0].price,unit:group[6],members,selected:false,editing:false});
  }));
}
function visibleEvents(){return events.filter(item=>Array.isArray(item.members)&&item.members.length>0&&state.countries.has(item.country)&&state.months.has(month(item))&&state.categories.has(item.category))}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({events:events.map(item=>({id:item.id,selected:item.selected,grade:item.grade,price:item.price,unit:item.unit})),nickname:$('nickname').value}))}catch(_){}}
function renderFilters(){
  $('countries').innerHTML=cfg.countries.map(c=>`<button class="country" data-country="${escapeHtml(c[0])}" aria-pressed="${state.countries.has(c[0])}">${escapeHtml(c[2])} ${escapeHtml(c[1])}</button>`).join('');
  $('months').innerHTML=`<label class="option"><input type="checkbox" data-all-months ${state.months.size===12?'checked':''}>전체 선택</label>`+allMonths().map(m=>`<label class="option"><input type="checkbox" data-month="${m}" ${state.months.has(m)?'checked':''}>${m}월</label>`).join('');
  $('categories').innerHTML=`<label class="option"><input type="checkbox" data-all-categories ${state.categories.size===Object.keys(cfg.categories).length?'checked':''}>전체 선택</label>`+Object.entries(cfg.categories).map(([key,label])=>`<label class="option"><input type="checkbox" data-category="${escapeHtml(key)}" ${state.categories.has(key)?'checked':''}>${escapeHtml(label)}</label>`).join('');
  const months=[...state.months].sort((a,b)=>a-b),categories=[...state.categories];
  $('monthSummary').textContent=months.length===12?'전체 12개월':months.length?months.map(m=>`${m}월`).join(', '):'월 선택 안 함';
  $('categorySummary').textContent=categories.length===Object.keys(cfg.categories).length?'전체 유형':categories.length?categories.map(key=>cfg.categories[key]).join(', '):'유형 선택 안 함';
}
function renderEvents(){
  const list=visibleEvents();
  $('count').textContent=`표시 ${list.length}건 · 선택 ${events.filter(item=>item.selected).length}건`;
  $('events').innerHTML=list.length?list.map(item=>{
    const c=country(item.country),memberList=item.members;
    return `<article class="event ${item.selected?'selected':''}"><input type="checkbox" data-select="${escapeHtml(item.id)}" ${item.selected?'checked':''} aria-label="공연 선택"><div><div class="date">${escapeHtml(item.date)} · ${escapeHtml(c?.[2]||'')} ${escapeHtml(c?.[1]||'')}</div><div class="title">${escapeHtml(item.title)}</div><div class="meta">${escapeHtml(item.artist)} · ${escapeHtml(cfg.categories[item.category])}</div><div class="venue">${escapeHtml(item.venue)}</div><div class="event-members" data-members="${escapeHtml(memberList.join('|'))}">참여 멤버 · ${memberList.map(escapeHtml).join(', ')}</div><div class="ticket-heading"><div class="grades">${item.options.map((option,index)=>`<button type="button" class="grade ${item.grade===index?'active':''}" data-grade="${escapeHtml(item.id)}" data-index="${index}">${escapeHtml(option.name)}${option.price?` · ${money(option.price,item.currency)}`:''}</button>`).join('')}</div></div></div></article>`;
  }).join(''):'<div class="empty">선택한 필터에 해당하는 공연이 없습니다.</div>';
}
function renderReceipt(){
  const picked=events.filter(item=>item.selected),total=picked.reduce((sum,item)=>sum+asKrw(item.price,item.unit),0);
  $('total').textContent=money(total,'KRW');$('stickyTotal').textContent=money(total,'KRW');$('stickyCount').textContent=`선택한 공연 ${picked.length}회`;
  $('visitCount').textContent=`관람 ${picked.length}회 · 국가 ${new Set(picked.map(item=>item.country)).size}개`;
  $('selectedEvents').innerHTML=picked.length?picked.map(item=>`<div class="selected-line"><span>${escapeHtml(item.date.slice(5))} · ${escapeHtml(item.title)}</span><b>${money(asKrw(item.price,item.unit),'KRW')}</b></div>`).join(''):'<p>선택한 공연이 없습니다.</p>';
}
function render(){renderFilters();renderEvents();renderReceipt();persist()}

// Compact the shared selection with a small LZ-style dictionary encoding.
function compressShareData(data){
  const input=JSON.stringify(data),dict=new Map(),output=[];
  let phrase='';
  for(const char of input){
    const next=phrase+char;
    if(dict.has(next)){phrase=next;continue}
    output.push(phrase?dict.get(phrase):char.charCodeAt(0));
    dict.set(next,256+dict.size);phrase=char;
  }
  if(phrase)output.push(dict.has(phrase)?dict.get(phrase):phrase.charCodeAt(0));
  const bytes=[];output.forEach(code=>{bytes.push(code&255,(code>>8)&255)});
  let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.slice(i,i+0x8000));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decompressShareData(encoded){
  const base64=encoded.replace(/-/g,'+').replace(/_/g,'/');
  const binary=atob(base64+'='.repeat((4-base64.length%4)%4)),codes=[];
  for(let i=0;i<binary.length;i+=2)codes.push(binary.charCodeAt(i)|(binary.charCodeAt(i+1)<<8));
  const dict=Array.from({length:256},(_,i)=>String.fromCharCode(i));
  let previous=String.fromCharCode(codes[0]),result=previous;
  for(let i=1;i<codes.length;i++){
    const code=codes[i],entry=dict[code]??(previous+previous[0]);
    result+=entry;dict.push(previous+entry[0]);previous=entry;
  }
  return JSON.parse(result);
}
function selectFromShare(){
  const hash=location.hash.slice(1);if(!hash)return;
  try{
    const data=hash.startsWith('s=')?decompressShareData(hash.slice(2)):JSON.parse(decodeURIComponent(hash));
    data.events?.forEach(([id,grade,price,unit])=>{const item=events.find(event=>event.id===id);if(item)Object.assign(item,{selected:true,grade:Number(grade)||0,price:Number(price)||0,unit:unit||item.currency})});
    $('nickname').value=data.nickname||'';
  }catch(error){console.warn('공유 정보를 읽지 못했습니다.',error)}
}
document.addEventListener('click',event=>{
  const target=event.target,countryButton=target.closest('[data-country]'),gradeButton=target.closest('[data-grade]');
  if(countryButton){const id=countryButton.dataset.country;state.countries.has(id)?state.countries.delete(id):state.countries.add(id);render()}
  if(gradeButton){const item=events.find(event=>event.id===gradeButton.dataset.grade);if(item){item.grade=Number(gradeButton.dataset.index);item.price=item.options[item.grade].price;item.unit=item.currency;item.editing=false;render()}}
  if(target.closest('#selectVisibleEvents')){visibleEvents().forEach(item=>item.selected=true);render()}
  if(target.closest('#clearVisibleEvents')){visibleEvents().forEach(item=>item.selected=false);render()}
});
document.addEventListener('change',event=>{
  const input=event.target;
  if(input.matches('[data-all-months]'))state.months=input.checked?new Set(allMonths()):new Set();
  else if(input.matches('[data-month]'))input.checked?state.months.add(Number(input.dataset.month)):state.months.delete(Number(input.dataset.month));
  else if(input.matches('[data-all-categories]'))state.categories=input.checked?new Set(Object.keys(cfg.categories)):new Set();
  else if(input.matches('[data-category]'))input.checked?state.categories.add(input.dataset.category):state.categories.delete(input.dataset.category);
  else if(input.matches('[data-select]')){const item=events.find(event=>event.id===input.dataset.select);if(item)item.selected=input.checked}
  else return;
  render();
});
$('allCountries').onclick=()=>{state.countries=new Set(cfg.countries.map(item=>item[0]));render()};
$('clearCountries').onclick=()=>{state.countries.clear();render()};
$('nickname').oninput=persist;
$('done').onclick=()=>{$('receipt').hidden=!$('receipt').hidden;$('done').textContent=$('receipt').hidden?'완료':'공연 목록 수정';if(!$('receipt').hidden)$('receipt').scrollIntoView({behavior:'smooth'})};
$('share').onclick=async()=>{
  const selected=events.filter(item=>item.selected).map(item=>[item.id,item.grade,item.price,item.unit]);
  const nickname=$('nickname').value;
  const compressed=compressShareData({events:selected,nickname});
  const url=`${location.href.split('#')[0]}#s=${compressed}`;
  try{await navigator.clipboard.writeText(url);alert('짧은 공유 링크를 복사했어요.')}catch(_){prompt('공유 링크를 복사해 주세요.',url)}
};
(async()=>{try{const response=await fetch('data/events.json');if(!response.ok)throw Error('schedule unavailable');cfg=await response.json();expandEvents();state.countries=new Set(cfg.countries.map(item=>item[0]));state.categories=new Set(Object.keys(cfg.categories));const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(saved){saved.events?.forEach(data=>{const item=events.find(event=>event.id===data.id);if(item)Object.assign(item,{selected:!!data.selected,grade:Number(data.grade)||0,price:Number(data.price)||0,unit:data.unit||item.currency})});$('nickname').value=saved.nickname||''}selectFromShare();render()}catch(error){$('events').innerHTML='<div class="empty">일정 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</div>';console.error(error)}})();
