const $=id=>document.getElementById(id);
let cfg,events=[];
const state={countries:new Set(),months:new Set(Array.from({length:12},(_,i)=>i+1)),categories:new Set()};
const STORAGE_KEY='svt-modular-state-v2';
const HOME_LOCATION_KEY='recap_home_loc';
const VENUE_COORDINATES_KEY='recap_venue_coords_v2';
const money=(n,c)=>new Intl.NumberFormat('ko-KR',{style:'currency',currency:c,maximumFractionDigits:c==='KRW'?0:2}).format(Number(n)||0);
const asKrw=(amount,unit)=>unit==='KRW'?(Number(amount)||0):(Number(amount)||0)/(cfg.rates[unit]||1);
const month=e=>Number(e.date.slice(5,7));
const country=id=>cfg.countries.find(c=>c[0]===id);
const allMonths=()=>Array.from({length:12},(_,i)=>i+1);
let homeLocation=null;
let venueCoordinates=new Map();
const pendingVenueLookups=new Map();
let travelRenderId=0;
let nominatimQueue=Promise.resolve();
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
function loadTravelLocation(){
  try{
    const saved=JSON.parse(localStorage.getItem(HOME_LOCATION_KEY)||'null');
    if(Number.isFinite(saved?.lat)&&saved.lat>=-90&&saved.lat<=90&&Number.isFinite(saved?.lng)&&saved.lng>=-180&&saved.lng<=180&&typeof saved.label==='string')homeLocation=saved;
    const cached=JSON.parse(localStorage.getItem(VENUE_COORDINATES_KEY)||'{}');
    venueCoordinates=new Map(Object.entries(cached).filter(([,coords])=>Number.isFinite(coords?.lat)&&Number.isFinite(coords?.lng)));
  }catch(error){console.warn('저장된 위치 정보를 읽지 못했습니다.',error)}
  $('homeAddressInput').value=homeLocation?.label||'';
}
function saveVenueCoordinates(){
  try{localStorage.setItem(VENUE_COORDINATES_KEY,JSON.stringify(Object.fromEntries(venueCoordinates)))}
  catch(error){console.warn('공연장 좌표를 저장하지 못했습니다.',error)}
}
function venueKey(item){return`${item.country}|${item.venue}`}
function distanceInKm(from,to){
  const radians=value=>value*Math.PI/180;
  const latitudeDelta=radians(to.lat-from.lat),longitudeDelta=radians(to.lng-from.lng);
  const arc=Math.min(1,Math.sin(latitudeDelta/2)**2+Math.cos(radians(from.lat))*Math.cos(radians(to.lat))*Math.sin(longitudeDelta/2)**2);
  return 6371*2*Math.atan2(Math.sqrt(arc),Math.sqrt(1-arc));
}
function locationLabel(data,fallback){
  const address=data?.address||data||{};
  const city=address.city||address.town||address.village||address.locality||address.municipality||address.county||address.state||'';
  const district=address.district||address.borough||address.suburb||'';
  return[city,district].filter(Boolean).join(' ')||data?.name||fallback;
}
async function photonSearch(query){
  const url=new URL('https://photon.komoot.io/api/');
  url.search=new URLSearchParams({q:query,limit:'5'}).toString();
  const response=await fetch(url);
  if(!response.ok)throw Error(`좌표 검색 실패 (HTTP ${response.status})`);
  const data=await response.json();
  return(data.features||[]).flatMap(feature=>{
    const [lng,lat]=feature.geometry?.coordinates||[];
    return Number.isFinite(lat)&&Number.isFinite(lng)?[{lat,lng,properties:feature.properties||{}}]:[];
  });
}
function requestNominatim(url){
  const request=nominatimQueue.then(()=>fetch(url,{headers:{'Accept-Language':'ko,en'}}));
  nominatimQueue=request.then(()=>new Promise(resolve=>setTimeout(resolve,1100)),()=>new Promise(resolve=>setTimeout(resolve,1100)));
  return request;
}
async function nominatimSearch(query){
  const url=new URL('https://nominatim.openstreetmap.org/search');
  url.search=new URLSearchParams({format:'jsonv2',addressdetails:'1',limit:'1',q:query}).toString();
  const response=await requestNominatim(url);
  if(!response.ok)throw Error(`OpenStreetMap 검색 실패 (HTTP ${response.status})`);
  const result=(await response.json())[0];
  if(!result)return null;
  const lat=Number(result.lat),lng=Number(result.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lng))throw Error('OpenStreetMap 좌표 응답이 올바르지 않습니다.');
  return{lat,lng,label:locationLabel(result,query)};
}
function featureLabel(feature){
  const properties=feature.properties||{};
  return properties.name||properties.city||properties.locality||'';
}
function venueFeatureMatches(feature,venueName){
  const props=feature.properties||{};
  const normalized=value=>String(value||'').toLowerCase().replace(/\s/g,'');
  const searchName=normalized(venueName),resultName=normalized([props.name,props.name_ko,props.name_en].filter(Boolean).join(' '));
  const namedMatch=searchName.length>=3&&resultName.includes(searchName);
  const featureType=`${props.osm_key||''} ${props.osm_value||''} ${props.type||''}`.toLowerCase();
  return namedMatch||/(stadium|arena|sports|theatre|theater|concert|conference|exhibition|event_venue|hall)/.test(featureType);
}
async function lookupVenueCoordinatesDirect(item){
  const [city,venueName]=item.venue.split(' · ');
  const countryName=country(item.country)?.[1]||item.country;
  const venueQuery=[venueName||item.venue,city,countryName].filter(Boolean).join(', ');
  const cityQuery=[city||item.venue,countryName].join(', ');
  let venueResults=[],venueError;
  try{venueResults=await photonSearch(venueQuery)}
  catch(error){venueError=error}
  const venueResult=venueResults.find(result=>venueFeatureMatches(result,venueName||item.venue));
  if(venueResult)return{...venueResult,precision:'venue',label:featureLabel(venueResult)||item.venue};
  let cityResults=[],cityError;
  try{cityResults=await photonSearch(cityQuery)}
  catch(error){
    cityError=error;
  }
  if(cityResults[0])return{...cityResults[0],precision:'city',label:city||item.venue};
  if(!cityError&&venueResults[0])return{...venueResults[0],precision:'approx',label:featureLabel(venueResults[0])||item.venue};
  const fallbackErrors=[];
  for(const [query,precision,fallback] of [[venueQuery,'approx',item.venue],[cityQuery,'city',city||item.venue]]){
    try{
      const coords=await nominatimSearch(query);
      if(coords)return{...coords,precision,label:precision==='city'?fallback:coords.label};
    }catch(error){fallbackErrors.push(error.message)}
  }
  const errors=[venueError?.message,cityError?.message,...fallbackErrors].filter(Boolean);
  if(errors.length)throw Error(`Photon·OpenStreetMap 좌표 검색에 실패했습니다: ${errors[errors.length-1]}`);
  return null;
}
function lookupVenueCoordinates(item){
  const key=venueKey(item);
  if(venueCoordinates.has(key))return Promise.resolve(venueCoordinates.get(key));
  if(pendingVenueLookups.has(key))return pendingVenueLookups.get(key);
  const request=lookupVenueCoordinatesDirect(item).then(coords=>{
    if(coords){venueCoordinates.set(key,coords);saveVenueCoordinates()}
    return coords;
  });
  const pending=request.finally(()=>pendingVenueLookups.delete(key));
  pendingVenueLookups.set(key,pending);
  return pending;
}
async function renderTravelSummary(){
  const renderId=++travelRenderId,summary=$('travelSummary');
  if($('receipt').hidden)return;
  if(!homeLocation){summary.textContent='출발지를 설정하면 선택한 공연장까지의 거리를 계산합니다.';$('routeStatusMsg').textContent='출발지를 설정하면 선택한 공연장까지의 거리를 계산합니다.';return}
  const selected=events.filter(item=>item.selected);
  if(!selected.length){summary.textContent='공연을 선택하면 왕복 거리를 계산합니다.';$('routeStatusMsg').textContent=`출발지: ${homeLocation.label}`;return}
  summary.textContent='공연장 좌표를 확인하고 있습니다...';
  const locations=[...new Map(selected.map(item=>[venueKey(item),item])).values()];
  const results=new Array(locations.length);
  let nextLocation=0;
  await Promise.all(Array.from({length:Math.min(4,locations.length)},async()=>{
    while(nextLocation<locations.length){
      const index=nextLocation++,item=locations[index];
      if(renderId===travelRenderId)$('routeStatusMsg').textContent=`공연장 좌표 검색 중 (${index+1}/${locations.length})...`;
      try{results[index]={key:venueKey(item),coords:await lookupVenueCoordinates(item)}}
      catch(error){results[index]={key:venueKey(item),error}}
    }
  }));
  if(renderId!==travelRenderId)return;
  const resolved=new Map(results.map(result=>[result.key,result.coords]));
  const failures=results.filter(result=>result.error||!result.coords);
  const totalRoundTrip=selected.reduce((total,item)=>{
    const coords=resolved.get(venueKey(item));
    return coords?total+distanceInKm(homeLocation,coords)*2:total;
  },0);
  const calculated=selected.filter(item=>resolved.has(venueKey(item))&&resolved.get(venueKey(item))).length;
  const cityFallbacks=new Set(results.filter(result=>result.coords?.precision==='city').map(result=>result.key)).size;
  const approximate=new Set(results.filter(result=>result.coords?.precision==='approx').map(result=>result.key)).size;
  summary.textContent=`계산 완료: ${calculated}/${selected.length}개 일정 · 왕복 약 ${totalRoundTrip.toFixed(1)} km${failures.length?' (일부 제외)':''}`;
  if(failures.length){
    const failedVenues=[...new Set(failures.map(item=>item.key.split('|')[1]))];
    const firstError=failures.find(item=>item.error)?.error;
    $('routeStatusMsg').textContent=firstError?`좌표 검색 오류: ${firstError.message}`:`좌표를 찾지 못했습니다: ${failedVenues.join(', ')}`;
  }
  else $('routeStatusMsg').textContent=`${homeLocation.label} 출발 직선거리${cityFallbacks?` · 도시 중심 대체 ${cityFallbacks}곳`:''}${approximate?` · 대략 좌표 ${approximate}곳`:''}`;
}
function renderEvents(){
  const list=visibleEvents();
  $('count').textContent=`표시 ${list.length}건 · 선택 ${events.filter(item=>item.selected).length}건`;
  $('events').innerHTML=list.length?list.map(item=>{
    const c=country(item.country),memberList=item.members;
    return `<article class="event ${item.selected?'selected':''}"><input type="checkbox" data-select="${escapeHtml(item.id)}" ${item.selected?'checked':''} aria-label="공연 선택"><div><div class="date">${escapeHtml(item.date)} · ${escapeHtml(c?.[2]||'')} ${escapeHtml(c?.[1]||'')}</div><div class="title">${escapeHtml(item.title)}</div><div class="meta">${escapeHtml(item.artist)} · ${escapeHtml(cfg.categories[item.category])}</div><div class="venue">${escapeHtml(item.venue)}</div><div class="event-members" data-members="${escapeHtml(memberList.join('|'))}" hidden></div><div class="ticket-heading"><div class="grades">${item.options.map((option,index)=>`<button type="button" class="grade ${item.grade===index?'active':''}" data-grade="${escapeHtml(item.id)}" data-index="${index}">${escapeHtml(option.name)}${option.price?` · ${money(option.price,item.currency)}`:''}</button>`).join('')}</div></div></div></article>`;
  }).join(''):'<div class="empty">선택한 필터에 해당하는 공연이 없습니다.</div>';
}
function renderReceipt(){
  const picked=events.filter(item=>item.selected),total=picked.reduce((sum,item)=>sum+asKrw(item.price,item.unit),0);
  $('total').textContent=money(total,'KRW');$('stickyTotal').textContent=money(total,'KRW');$('stickyCount').textContent=`선택한 공연 ${picked.length}회`;
  $('visitCount').textContent=`관람 ${picked.length}회 · 국가 ${new Set(picked.map(item=>item.country)).size}개`;
  $('selectedEvents').innerHTML=picked.length?picked.map(item=>`<div class="selected-line"><span>${escapeHtml(item.date.slice(5))} · ${escapeHtml(item.title)}</span><b>${money(asKrw(item.price,item.unit),'KRW')}</b></div>`).join(''):'<p>선택한 공연이 없습니다.</p>';
  $('downloadTicketExpenses').disabled=!picked.length;
}
function render(){renderFilters();renderEvents();renderReceipt();persist();renderTravelSummary()}

function storeHomeLocation(location){
  homeLocation=location;
  $('homeAddressInput').value=location.label;
  try{localStorage.setItem(HOME_LOCATION_KEY,JSON.stringify(location))}
  catch(error){console.warn('출발지 위치를 저장하지 못했습니다.',error);$('routeStatusMsg').textContent='출발지는 설정했지만 브라우저에 저장하지 못했습니다.'}
  render();
}
async function updateHomeFromAddress(){
  const query=$('homeAddressInput').value.trim();
  if(!query){$('routeStatusMsg').textContent='출발지 주소나 동네 이름을 입력해 주세요.';return}
  $('routeStatusMsg').textContent='입력한 출발지 주소를 확인하는 중...';
  try{
    const result=(await photonSearch(query))[0];
    if(!result){$('routeStatusMsg').textContent='입력한 주소를 찾지 못했습니다. 동네 이름이나 주소를 확인해 주세요.';return}
    const location={label:locationLabel(result.properties,query),lat:result.lat,lng:result.lng};
    if(!Number.isFinite(location.lat)||location.lat< -90||location.lat>90||!Number.isFinite(location.lng)||location.lng< -180||location.lng>180)throw Error('주소 좌표 응답이 올바르지 않습니다.');
    storeHomeLocation(location);
  }catch(error){
    console.error('출발지 주소 검색 실패:',error);
    $('routeStatusMsg').textContent=`출발지 주소를 확인하지 못했습니다: ${error.message}`;
  }
}
function useCurrentGPSLocation(){
  const statusEl=$('routeStatusMsg');
  if(!navigator.geolocation){statusEl.textContent='이 브라우저에서는 현재 위치 기능을 지원하지 않습니다.';return}
  statusEl.textContent='📡 현재 GPS 위치를 확인하는 중...';
  navigator.geolocation.getCurrentPosition(async position=>{
    const {latitude:lat,longitude:lng}=position.coords;
    let label='현재 위치 (GPS)';
    try{
      const url=new URL('https://photon.komoot.io/reverse');
      url.search=new URLSearchParams({lat:String(lat),lon:String(lng)}).toString();
      const response=await fetch(url);
      if(!response.ok)throw Error(`현재 위치 이름 확인 실패 (HTTP ${response.status})`);
      const result=(await response.json()).features?.[0];
      if(result)label=locationLabel(result.properties,label);
    }catch(error){console.warn('GPS 위치의 주소 변환을 완료하지 못했습니다.',error)}
    storeHomeLocation({label,lat,lng});
  },error=>{
    if(error.code===1)statusEl.textContent='위치 권한이 차단되었습니다. 브라우저 설정에서 허용하거나 주소를 직접 입력해 주세요.';
    else statusEl.textContent='현재 위치를 확인하지 못했습니다. 주소를 직접 입력해 주세요.';
  },{enableHighAccuracy:false,timeout:8000,maximumAge:60000});
}
function downloadTicketExpenses(){
  const picked=events.filter(item=>item.selected);
  if(!picked.length)return;
  const total=picked.reduce((sum,item)=>sum+asKrw(item.price,item.unit),0);
  const lines=[
    '2026 SEVENTEEN 공연 티켓 지출 내역',
    `선택 공연: ${picked.length}회`,
    `총 지출 (KRW 환산): ${money(total,'KRW')}`,
    '',
    ...picked.flatMap((item,index)=>[
      `${index+1}. ${item.date} | ${item.title}`,
      `   장소: ${item.venue}`,
      `   티켓 금액: ${money(item.price,item.unit)} (KRW 환산 ${money(asKrw(item.price,item.unit),'KRW')})`,
      ''
    ])
  ];
  const blob=new Blob(['\uFEFF',lines.join('\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='seventeen-ticket-expenses-2026.txt';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
loadTravelLocation();
$('setHomeAddress').addEventListener('click',updateHomeFromAddress);
$('currentGpsButton').addEventListener('click',useCurrentGPSLocation);
$('homeAddressInput').addEventListener('keydown',event=>{if(event.key==='Enter')updateHomeFromAddress()});
$('downloadTicketExpenses').addEventListener('click',downloadTicketExpenses);
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
$('done').onclick=()=>{$('receipt').hidden=!$('receipt').hidden;$('done').textContent=$('receipt').hidden?'완료':'공연 목록 수정';if(!$('receipt').hidden){$('receipt').scrollIntoView({behavior:'smooth'});renderTravelSummary()}else travelRenderId++};
(async()=>{
  try{
    if(location.protocol==='file:')throw Error('HTML 파일을 직접 열면 브라우저가 JSON을 불러올 수 없습니다. 로컬 웹 서버에서 실행해 주세요.');
    const scheduleUrl=new URL('data/events.json',document.baseURI);
    const response=await fetch(scheduleUrl.href);
    if(!response.ok)throw Error(`${scheduleUrl.pathname} 요청 실패 (HTTP ${response.status})`);
    try{cfg=await response.json()}catch(error){throw Error(`${scheduleUrl.pathname} JSON 파싱 실패: ${error.message}`)}
    if(!cfg||!Array.isArray(cfg.countries)||!cfg.categories||!cfg.rates||!Array.isArray(cfg.events))throw Error(`${scheduleUrl.pathname} 데이터 형식이 올바르지 않습니다.`);
    expandEvents();state.countries=new Set(cfg.countries.map(item=>item[0]));state.categories=new Set(Object.keys(cfg.categories));const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(saved){saved.events?.forEach(data=>{const item=events.find(event=>event.id===data.id);if(item)Object.assign(item,{selected:!!data.selected,grade:Number(data.grade)||0,price:Number(data.price)||0,unit:data.unit||item.currency})});$('nickname').value=saved.nickname||''}render()
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    $('events').innerHTML=`<div class="empty">일정 데이터를 불러오지 못했습니다. ${escapeHtml(message)}</div>`;
    console.error('일정 데이터 로딩 실패:',error);
  }
})();
