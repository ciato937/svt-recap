const $=id=>document.getElementById(id);
let cfg,events=[];
const state={countries:new Set(),months:new Set(Array.from({length:12},(_,i)=>i+1)),categories:new Set()};
const STORAGE_KEY='svt-modular-state-v2';
const HOME_LOCATION_KEY='recap_home_loc';
const money=(n,c)=>new Intl.NumberFormat('ko-KR',{style:'currency',currency:c,maximumFractionDigits:c==='KRW'?0:2}).format(Number(n)||0);
const asKrw=(amount,unit)=>unit==='KRW'?(Number(amount)||0):(Number(amount)||0)/(cfg.rates[unit]||1);
const month=e=>Number(e.date.slice(5,7));
const country=id=>cfg.countries.find(c=>c[0]===id);
const allMonths=()=>Array.from({length:12},(_,i)=>i+1);
const point=(lat,lng,precision,label)=>({lat,lng,precision,label});
const VENUE_COORDS=Object.freeze({
  venue:{
    'KSPO DOME':point(37.5193,127.1273,'venue','KSPO DOME'),
    '올림픽 체조경기장':point(37.5193,127.1273,'venue','KSPO DOME'),
    '고척스카이돔':point(37.4982,126.8671,'venue','고척스카이돔'),
    '올림픽공원':point(37.5209,127.1214,'venue','올림픽공원'),
    '서재페':point(37.5209,127.1214,'venue','올림픽공원'),
    '잠실실내체육관':point(37.5148,127.0736,'venue','잠실'),
    '인천아시아드주경기장':point(37.5476,126.6666,'venue','인천아시아드주경기장'),
    '인스파이어 아레나':point(37.4665,126.3905,'venue','인스파이어 아레나'),
    '도쿄 돔':point(35.7056,139.7519,'venue','도쿄 돔'),
    'ベルーナドーム':point(35.7684,139.4205,'venue','베루나 돔'),
    '베루나 돔':point(35.7684,139.4205,'venue','베루나 돔'),
    'K-아레나':point(35.4646,139.6305,'venue','K-아레나 요코하마'),
    '교세라 돔':point(34.6693,135.4761,'venue','교세라 돔 오사카'),
    '마쿠하리 멧세':point(35.6483,140.0347,'venue','마쿠하리 멧세'),
    'Philippine Sports Stadium':point(14.7942,120.8799,'venue','Philippine Sports Stadium')
  },
  city:{
    '서울':point(37.5148,127.0736,'city','서울'),
    '잠실':point(37.5148,127.0736,'city','잠실'),
    '인천':point(37.5476,126.6666,'city','인천'),
    '군포':point(37.3617,126.9352,'city','군포'),
    '과천':point(37.4292,126.9876,'city','과천'),
    '성남':point(37.4201,127.1262,'city','성남'),
    '수원':point(37.2636,127.0286,'city','수원'),
    '부산':point(35.1796,129.0756,'city','부산'),
    '대구':point(35.8714,128.6014,'city','대구'),
    '대전':point(36.3504,127.3845,'city','대전'),
    '광주':point(35.1595,126.8526,'city','광주'),
    '고양':point(37.6584,126.832,'city','고양'),
    '도쿄':point(35.7056,139.7519,'city','도쿄'),
    '사이타마':point(35.7684,139.4205,'city','사이타마'),
    '요코하마':point(35.4646,139.6305,'city','요코하마'),
    '오사카':point(34.6693,135.4761,'city','오사카'),
    '아이치':point(35.186,136.9474,'city','나고야'),
    '나고야':point(35.186,136.9474,'city','나고야'),
    '치바':point(35.6483,140.0347,'city','치바'),
    '마쿠하리':point(35.6483,140.0347,'city','마쿠하리'),
    '후쿠오카':point(33.5953,130.3621,'city','후쿠오카'),
    '마카오':point(22.1987,113.5439,'city','마카오'),
    '방콕':point(13.7563,100.5018,'city','방콕'),
    '싱가포르':point(1.3521,103.8198,'city','싱가포르'),
    '마닐라':point(14.5995,120.9842,'city','마닐라'),
    '불라칸':point(14.7942,120.8799,'city','불라칸'),
    '가오슝':point(22.6273,120.3014,'city','가오슝'),
    '타이베이':point(25.033,121.5654,'city','타이베이'),
    '홍콩':point(22.3193,114.1694,'city','홍콩'),
    '자카르타':point(-6.2088,106.8456,'city','자카르타'),
    'LA':point(34.0522,-118.2437,'city','Los Angeles'),
    'Los Angeles':point(34.0522,-118.2437,'city','Los Angeles'),
    '뉴욕':point(40.7128,-74.006,'city','뉴욕'),
    'New York':point(40.7128,-74.006,'city','New York')
  },
  country:{
    'KR':point(37.5665,126.978,'country','대한민국'),'대한민국':point(37.5665,126.978,'country','대한민국'),
    'JP':point(35.6762,139.6503,'country','일본'),'일본':point(35.6762,139.6503,'country','일본'),
    'HK':point(22.3193,114.1694,'country','홍콩'),'홍콩':point(22.3193,114.1694,'country','홍콩'),
    'MO':point(22.1987,113.5439,'country','마카오'),'마카오':point(22.1987,113.5439,'country','마카오'),
    'TW':point(25.033,121.5654,'country','대만'),'대만':point(25.033,121.5654,'country','대만'),
    'SG':point(1.3521,103.8198,'country','싱가포르'),'싱가포르':point(1.3521,103.8198,'country','싱가포르'),
    'TH':point(13.7563,100.5018,'country','태국'),'태국':point(13.7563,100.5018,'country','태국'),
    'PH':point(14.5995,120.9842,'country','필리핀'),'필리핀':point(14.5995,120.9842,'country','필리핀')
  }
});
const HOME_ADDRESS_COORDS=Object.freeze(Object.fromEntries([
  [['서울특별시','서울시','서울','Seoul'],37.5148,127.0736,'서울'],
  [['종로구','서울 종로구','서울특별시 종로구'],37.5735,126.9788,'서울 종로구'],
  [['서울 중구','서울특별시 중구'],37.5636,126.9976,'서울 중구'],
  [['용산구','서울 용산구'],37.5326,126.990,'서울 용산구'],
  [['성동구','서울 성동구'],37.5634,127.0369,'서울 성동구'],
  [['광진구','서울 광진구'],37.5385,127.0823,'서울 광진구'],
  [['동대문구','서울 동대문구'],37.5744,127.0396,'서울 동대문구'],
  [['중랑구','서울 중랑구'],37.6063,127.0925,'서울 중랑구'],
  [['성북구','서울 성북구'],37.5894,127.0167,'서울 성북구'],
  [['강북구','서울 강북구'],37.6396,127.0257,'서울 강북구'],
  [['도봉구','서울 도봉구'],37.6688,127.0471,'서울 도봉구'],
  [['노원구','서울 노원구'],37.6542,127.0568,'서울 노원구'],
  [['은평구','서울 은평구'],37.6027,126.9291,'서울 은평구'],
  [['서대문구','서울 서대문구'],37.5791,126.9368,'서울 서대문구'],
  [['마포구','서울 마포구'],37.5663,126.9019,'서울 마포구'],
  [['양천구','서울 양천구'],37.5170,126.8665,'서울 양천구'],
  [['서울 강서구','서울특별시 강서구'],37.5509,126.8495,'서울 강서구'],
  [['구로구','서울 구로구'],37.4954,126.8874,'서울 구로구'],
  [['금천구','서울 금천구'],37.4569,126.8955,'서울 금천구'],
  [['영등포구','서울 영등포구'],37.5264,126.8963,'서울 영등포구'],
  [['동작구','서울 동작구'],37.5124,126.9393,'서울 동작구'],
  [['관악구','서울 관악구'],37.4784,126.9516,'서울 관악구'],
  [['서초구','서울 서초구'],37.4837,127.0324,'서울 서초구'],
  [['강남구','서울 강남구'],37.5172,127.0473,'서울 강남구'],
  [['송파구','서울 송파구'],37.5148,127.1059,'서울 송파구'],
  [['강동구','서울 강동구'],37.5301,127.1238,'서울 강동구'],
  [['군포시','군포','Gunpo'],37.3617,126.9352,'군포'],
  [['과천시','과천','Gwacheon'],37.4292,126.9876,'과천'],
  [['성남시','성남','Seongnam'],37.4201,127.1262,'성남'],
  [['성남시 분당구','성남 분당구','분당구'],37.3650,127.1060,'성남 분당구'],
  [['성남시 수정구','성남 수정구','수정구'],37.4500,127.1450,'성남 수정구'],
  [['성남시 중원구','성남 중원구','중원구'],37.4305,127.1375,'성남 중원구'],
  [['수원시','수원','Suwon'],37.2636,127.0286,'수원'],
  [['수원시 장안구','수원 장안구','장안구'],37.3038,127.0107,'수원 장안구'],
  [['수원시 권선구','수원 권선구','권선구'],37.2578,126.9710,'수원 권선구'],
  [['수원시 팔달구','수원 팔달구','팔달구'],37.2814,127.0213,'수원 팔달구'],
  [['수원시 영통구','수원 영통구','영통구'],37.2596,127.0465,'수원 영통구'],
  [['고양시','고양','Goyang'],37.6584,126.8320,'고양'],
  [['고양시 덕양구','고양 덕양구','덕양구'],37.6375,126.8320,'고양 덕양구'],
  [['고양시 일산동구','고양 일산동구','일산동구'],37.6580,126.7750,'고양 일산동구'],
  [['고양시 일산서구','고양 일산서구','일산서구'],37.6750,126.7500,'고양 일산서구'],
  [['용인시','용인','Yongin'],37.2411,127.1776,'용인'],
  [['용인시 수지구','용인 수지구','수지구'],37.3220,127.0970,'용인 수지구'],
  [['용인시 기흥구','용인 기흥구','기흥구'],37.2800,127.1150,'용인 기흥구'],
  [['용인시 처인구','용인 처인구','처인구'],37.2340,127.2010,'용인 처인구'],
  [['부천시','부천','Bucheon'],37.5034,126.7660,'부천'],
  [['안산시','안산','Ansan'],37.3219,126.8309,'안산'],
  [['안산시 상록구','안산 상록구','상록구'],37.3010,126.8460,'안산 상록구'],
  [['안산시 단원구','안산 단원구','단원구'],37.3210,126.8150,'안산 단원구'],
  [['안양시','안양','Anyang'],37.3943,126.9568,'안양'],
  [['안양시 동안구','안양 동안구','동안구'],37.3920,126.9510,'안양 동안구'],
  [['안양시 만안구','안양 만안구','만안구'],37.3867,126.9320,'안양 만안구'],
  [['남양주시','남양주'],37.6360,127.2165,'남양주'],
  [['화성시','화성'],37.1995,126.8312,'화성'],
  [['평택시','평택'],36.9921,127.1129,'평택'],
  [['의정부시','의정부'],37.7381,127.0337,'의정부'],
  [['시흥시','시흥'],37.3800,126.8029,'시흥'],
  [['김포시','김포'],37.6153,126.7156,'김포'],
  [['파주시','파주'],37.7599,126.7800,'파주'],
  [['광명시','광명'],37.4786,126.8644,'광명'],
  [['오산시','오산'],37.1498,127.0772,'오산'],
  [['이천시','이천'],37.2720,127.4350,'이천'],
  [['안성시','안성'],37.0080,127.2797,'안성'],
  [['양주시','양주'],37.7853,127.0458,'양주'],
  [['구리시','구리'],37.5943,127.1296,'구리'],
  [['의왕시','의왕'],37.3447,126.9683,'의왕'],
  [['하남시','하남'],37.5393,127.2148,'하남'],
  [['동두천시','동두천'],37.9035,127.0606,'동두천'],
  [['여주시','여주'],37.2983,127.6375,'여주'],
  [['포천시','포천'],37.8949,127.2003,'포천'],
  [['인천광역시','인천시','인천','Incheon'],37.5476,126.6666,'인천'],
  [['인천광역시 중구','인천 중구'],37.4738,126.6218,'인천 중구'],
  [['인천광역시 동구','인천 동구'],37.4750,126.6432,'인천 동구'],
  [['미추홀구','인천 미추홀구'],37.4637,126.6500,'인천 미추홀구'],
  [['연수구','인천 연수구'],37.4100,126.6780,'인천 연수구'],
  [['남동구','인천 남동구'],37.4473,126.7313,'인천 남동구'],
  [['부평구','인천 부평구'],37.5070,126.7219,'인천 부평구'],
  [['계양구','인천 계양구'],37.5374,126.7378,'인천 계양구'],
  [['인천광역시 서구','인천 서구'],37.5454,126.6759,'인천 서구'],
  [['강화군','인천 강화군'],37.7467,126.4878,'인천 강화군'],
  [['옹진군','인천 옹진군'],37.4466,126.6368,'인천 옹진군'],
  [['부산광역시','부산시','부산','Busan'],35.1796,129.0756,'부산'],
  [['해운대구','부산 해운대구'],35.1631,129.1635,'부산 해운대구'],
  [['부산진구','부산 부산진구'],35.1629,129.0532,'부산 부산진구'],
  [['부산 남구','부산광역시 남구'],35.1366,129.0842,'부산 남구'],
  [['동래구','부산 동래구'],35.2048,129.0837,'부산 동래구'],
  [['부산 북구','부산광역시 북구'],35.1972,128.9901,'부산 북구'],
  [['사하구','부산 사하구'],35.1045,128.9748,'부산 사하구'],
  [['연제구','부산 연제구'],35.1762,129.0798,'부산 연제구'],
  [['금정구','부산 금정구'],35.2429,129.0922,'부산 금정구'],
  [['수영구','부산 수영구'],35.1457,129.1132,'부산 수영구'],
  [['사상구','부산 사상구'],35.1526,128.9913,'부산 사상구'],
  [['부산 강서구','부산광역시 강서구'],35.2122,128.9803,'부산 강서구'],
  [['기장군','부산 기장군'],35.2445,129.2223,'부산 기장군'],
  [['대구광역시','대구시','대구','Daegu'],35.8714,128.6014,'대구'],
  [['수성구','대구 수성구'],35.8583,128.6308,'대구 수성구'],
  [['달서구','대구 달서구'],35.8299,128.5327,'대구 달서구'],
  [['대구 북구','대구광역시 북구'],35.8858,128.5828,'대구 북구'],
  [['대구 중구','대구광역시 중구'],35.8694,128.6062,'대구 중구'],
  [['대구 동구','대구광역시 동구'],35.8867,128.6355,'대구 동구'],
  [['달성군','대구 달성군'],35.7747,128.4314,'대구 달성군'],
  [['대전광역시','대전시','대전','Daejeon'],36.3504,127.3845,'대전'],
  [['유성구','대전 유성구'],36.3623,127.3562,'대전 유성구'],
  [['대전 서구','대전광역시 서구'],36.3553,127.3833,'대전 서구'],
  [['대전 중구','대전광역시 중구'],36.3250,127.4210,'대전 중구'],
  [['대전 동구','대전광역시 동구'],36.3120,127.4540,'대전 동구'],
  [['대덕구','대전 대덕구'],36.3467,127.4155,'대전 대덕구'],
  [['광주광역시','광주시','광주','Gwangju'],35.1595,126.8526,'광주'],
  [['광주 동구','광주광역시 동구'],35.1460,126.9230,'광주 동구'],
  [['광주 서구','광주광역시 서구'],35.1520,126.8900,'광주 서구'],
  [['광주 남구','광주광역시 남구'],35.1330,126.9020,'광주 남구'],
  [['광주 북구','광주광역시 북구'],35.1740,126.9110,'광주 북구'],
  [['광산구','광주 광산구'],35.1390,126.7930,'광주 광산구'],
  [['울산광역시','울산시','울산'],35.5384,129.3114,'울산'],
  [['울산 중구','울산광역시 중구'],35.5690,129.3320,'울산 중구'],
  [['울산 남구','울산광역시 남구'],35.5440,129.3300,'울산 남구'],
  [['울산 동구','울산광역시 동구'],35.5050,129.4160,'울산 동구'],
  [['울산 북구','울산광역시 북구'],35.5820,129.3610,'울산 북구'],
  [['청주시','청주'],36.6424,127.4890,'청주'],
  [['충주시','충주'],36.9910,127.9259,'충주'],
  [['제천시','제천'],37.1326,128.1910,'제천'],
  [['천안시','천안'],36.8151,127.1139,'천안'],
  [['아산시','아산'],36.7898,127.0018,'아산'],
  [['서산시','서산'],36.7845,126.4503,'서산'],
  [['공주시','공주'],36.4465,127.1190,'공주'],
  [['논산시','논산'],36.1872,127.0987,'논산'],
  [['당진시','당진'],36.8898,126.6459,'당진'],
  [['보령시','보령'],36.3334,126.6129,'보령'],
  [['전주시','전주'],35.8242,127.1480,'전주'],
  [['군산시','군산'],35.9676,126.7369,'군산'],
  [['익산시','익산'],35.9483,126.9577,'익산'],
  [['남원시','남원'],35.4164,127.3904,'남원'],
  [['김제시','김제'],35.8036,126.8809,'김제'],
  [['목포시','목포'],34.8118,126.3922,'목포'],
  [['여수시','여수'],34.7604,127.6622,'여수'],
  [['순천시','순천'],34.9506,127.4872,'순천'],
  [['광양시','광양'],34.9407,127.6959,'광양'],
  [['나주시','나주'],35.0160,126.7108,'나주'],
  [['포항시','포항'],36.0190,129.3435,'포항'],
  [['경주시','경주'],35.8562,129.2247,'경주'],
  [['구미시','구미'],36.1195,128.3446,'구미'],
  [['안동시','안동'],36.5684,128.7294,'안동'],
  [['영주시','영주'],36.8057,128.6240,'영주'],
  [['상주시','상주'],36.4109,128.1591,'상주'],
  [['김천시','김천'],36.1398,128.1136,'김천'],
  [['창원시','창원'],35.2285,128.6811,'창원'],
  [['김해시','김해'],35.2285,128.8894,'김해'],
  [['양산시','양산'],35.3350,129.0372,'양산'],
  [['진주시','진주'],35.1798,128.1076,'진주'],
  [['거제시','거제'],34.8806,128.6211,'거제'],
  [['통영시','통영'],34.8544,128.4332,'통영'],
  [['사천시','사천'],35.0038,128.0642,'사천'],
  [['춘천시','춘천'],37.8813,127.7298,'춘천'],
  [['원주시','원주'],37.3422,127.9202,'원주'],
  [['강릉시','강릉'],37.7519,128.8761,'강릉'],
  [['속초시','속초'],38.2070,128.5918,'속초'],
  [['동해시','동해'],37.5247,129.1143,'동해'],
  [['청주시 상당구','청주 상당구','상당구'],36.6357,127.4914,'청주 상당구'],
  [['청주시 서원구','청주 서원구','서원구'],36.6250,127.4730,'청주 서원구'],
  [['청주시 흥덕구','청주 흥덕구','흥덕구'],36.6424,127.4310,'청주 흥덕구'],
  [['제주특별자치도','제주도','제주시','제주'],33.4996,126.5312,'제주'],
  [['서귀포시','서귀포'],33.2541,126.5601,'서귀포']
].flatMap(([aliases,lat,lng,label])=>aliases.map(alias=>[alias,point(lat,lng,'address',label)]))));
let homeLocation=null;
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
    events.push({id:group[9]||`${group[1]}-${md}-${events.length}`,date:`2026-${mm}-${dd}`,country:group[1],category:group[2],artist:group[3],title,venue:group[5],currency:group[6],options,grade:0,price:options[0].price,unit:group[6],members,selected:false,editing:false});
  }));
}
function visibleEvents(){return events.filter(item=>Array.isArray(item.members)&&item.members.length>0&&state.countries.has(item.country)&&state.months.has(month(item))&&state.categories.has(item.category)).sort((a,b)=>a.date.localeCompare(b.date))}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({events:events.map(item=>({id:item.id,selected:item.selected,grade:item.grade,price:item.price,unit:item.unit}))}))}catch(_){}}
function renderFilters(){
  $('countries').innerHTML=cfg.countries.map(c=>`<button class="country" data-country="${escapeHtml(c[0])}" aria-pressed="${state.countries.has(c[0])}">${escapeHtml(c[2])} ${escapeHtml(c[1])}</button>`).join('');
  const allCountriesSelected=cfg.countries.every(c=>state.countries.has(c[0]));
  $('allCountries').textContent=allCountriesSelected?'지역 선택 해제':'지역 모두 선택';
  $('months').innerHTML=`<label class="option"><input type="checkbox" data-all-months ${state.months.size===12?'checked':''}>전체 선택</label>`+allMonths().map(m=>`<label class="option"><input type="checkbox" data-month="${m}" ${state.months.has(m)?'checked':''}>${m}월</label>`).join('');
  const categoryEntries=Object.entries(cfg.categories);
  const allCategoriesSelected=state.categories.size===categoryEntries.length;
  $('categories').innerHTML=`<button type="button" class="filter-chip" data-all-categories aria-pressed="${allCategoriesSelected}">전체</button>`+categoryEntries.map(([key,label])=>`<button type="button" class="filter-chip" data-category="${escapeHtml(key)}" aria-pressed="${state.categories.has(key)}">${escapeHtml(label)}</button>`).join('');
  const months=[...state.months].sort((a,b)=>a-b);
  $('monthSummary').textContent=months.length===12?'전체 12개월':months.length?months.map(m=>`${m}월`).join(', '):'월 선택 안 함';
}
function loadTravelLocation(){
  try{
    const saved=JSON.parse(localStorage.getItem(HOME_LOCATION_KEY)||'null');
    if(Number.isFinite(saved?.lat)&&saved.lat>=-90&&saved.lat<=90&&Number.isFinite(saved?.lng)&&saved.lng>=-180&&saved.lng<=180&&typeof saved.label==='string')homeLocation=saved;
  }catch(error){console.warn('저장된 위치 정보를 읽지 못했습니다.',error)}
  $('homeAddressInput').value=homeLocation?.label||'';
}
function venueKey(item){return`${item.country}|${item.venue}`}
function distanceInKm(from,to){
  const radians=value=>value*Math.PI/180;
  const latitudeDelta=radians(to.lat-from.lat),longitudeDelta=radians(to.lng-from.lng);
  const arc=Math.min(1,Math.sin(latitudeDelta/2)**2+Math.cos(radians(from.lat))*Math.cos(radians(to.lat))*Math.sin(longitudeDelta/2)**2);
  return 6371*2*Math.atan2(Math.sqrt(arc),Math.sqrt(1-arc));
}
function normalizeLocationText(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/[\s·,./_()-]/g,'')}
function coordinateAliasRank(alias){
  const normalized=normalizeLocationText(alias);
  if(/[구군읍면동리]$/.test(normalized))return 2;
  if(/시$/.test(normalized))return 1;
  return 0;
}
function findCoordinate(value,dictionary){
  const normalized=normalizeLocationText(value);
  if(!normalized)return null;
  const match=Object.entries(dictionary)
    .sort((a,b)=>coordinateAliasRank(b[0])-coordinateAliasRank(a[0])||normalizeLocationText(b[0]).length-normalizeLocationText(a[0]).length)
    .find(([alias])=>normalized.includes(normalizeLocationText(alias)));
  return match?{...match[1],label:match[1].label||match[0]}:null;
}
function coordinatesForEvent(item){
  const [city,...venueParts]=String(item.venue||'').split(' · ');
  const venueName=venueParts.join(' · ')||item.venue;
  const exactVenue=findCoordinate(venueName,VENUE_COORDS.venue)||findCoordinate(item.venue,VENUE_COORDS.venue);
  if(exactVenue)return exactVenue;
  const cityCoordinates=findCoordinate(city,VENUE_COORDS.city);
  if(cityCoordinates)return cityCoordinates;
  const countryName=country(item.country)?.[1]||'';
  return findCoordinate(`${item.country} ${countryName}`,VENUE_COORDS.country);
}
function calcTravelDetails(attendedEvents,origin){
  let domesticKm=0,intlKm=0,intlTrips=0,calculatedEvents=0;
  let farthest={name:'-',km:0},closest={name:'-',km:Infinity};
  attendedEvents.forEach(event=>{
    const venue=coordinatesForEvent(event);
    if(!venue)return;
    const oneWay=distanceInKm(origin,venue),roundTrip=oneWay*2;
    const name=venue.label||event.venue;
    calculatedEvents++;
    if(event.country==='KR')domesticKm+=roundTrip;
    else{intlKm+=roundTrip;intlTrips++}
    if(oneWay>farthest.km)farthest={name,km:oneWay};
    if(oneWay<closest.km)closest={name,km:oneWay};
  });
  const totalKm=domesticKm+intlKm;
  const domesticMins=Math.round(domesticKm/55*60);
  const flightMins=Math.round(intlKm/780*60);
  const formatTime=mins=>`${Math.floor(mins/60)?`${Math.floor(mins/60)}시간 `:''}${mins%60}분`;
  return{
    totalKm,domesticKm,intlKm,
    domesticRatio:totalKm?Math.round(domesticKm/totalKm*100):0,
    intlRatio:totalKm?Math.round(intlKm/totalKm*100):0,
    totalTravelTime:formatTime(domesticMins+flightMins),
    flightTime:formatTime(flightMins),
    estimatedMiles:Math.round(intlKm*0.621371),
    flightTakeoffs:intlTrips*2,
    avgKmPerEvent:calculatedEvents?Math.round(totalKm/calculatedEvents):0,
    farthest,
    closest:closest.km===Infinity?{name:'-',km:0}:closest,
    calculatedEvents
  };
}
function locationLabel(data,fallback){
  const address=data?.address||data||{};
  const city=address.city||address.town||address.village||address.locality||address.municipality||address.county||address.state||'';
  const district=address.district||address.borough||address.suburb||'';
  return[city,district].filter(Boolean).join(' ')||data?.name||fallback;
}
let lastNominatimRequestAt=0;
async function nominatimAddressSearch(query){
  const wait=Math.max(0,1000-(Date.now()-lastNominatimRequestAt));
  if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
  lastNominatimRequestAt=Date.now();
  const url=new URL('https://nominatim.openstreetmap.org/search');
  url.search=new URLSearchParams({format:'jsonv2',addressdetails:'1',limit:'1',q:query}).toString();
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  let response;
  try{response=await fetch(url,{headers:{'Accept-Language':'ko,en'},signal:controller.signal})}
  finally{clearTimeout(timeout)}
  if(!response.ok)throw Error(`OpenStreetMap 검색 실패 (HTTP ${response.status})`);
  const result=(await response.json())[0];
  if(!result)return null;
  const lat=Number(result.lat),lng=Number(result.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lng))throw Error('OpenStreetMap 좌표 응답이 올바르지 않습니다.');
  return{lat,lng,label:locationLabel(result,query)};
}
function renderTravelSummary(){
  const summary=$('travelSummary');
  if($('receipt').hidden)return;
  if(!homeLocation){summary.textContent='출발지를 설정하면 선택한 공연장까지의 거리를 계산합니다.';$('routeStatusMsg').textContent='출발지를 설정하면 선택한 공연장까지의 거리를 계산합니다.';return}
  const selected=events.filter(item=>item.selected);
  if(!selected.length){summary.textContent='공연을 선택하면 왕복 거리를 계산합니다.';$('routeStatusMsg').textContent=`출발지: ${homeLocation.label}`;return}
  const locations=[...new Map(selected.map(item=>[venueKey(item),item])).values()];
  const results=locations.map(item=>({key:venueKey(item),coords:coordinatesForEvent(item)}));
  const resolved=new Map(results.map(result=>[result.key,result.coords]));
  const failures=results.filter(result=>!result.coords);
  const calculated=selected.filter(item=>resolved.has(venueKey(item))&&resolved.get(venueKey(item))).length;
  const details=calcTravelDetails(selected,homeLocation);
  const cityFallbacks=results.filter(result=>result.coords?.precision==='city').length;
  const countryFallbacks=results.filter(result=>result.coords?.precision==='country').length;
  const detailLines=[
    `계산 완료: ${calculated}/${selected.length}개 일정 · 왕복 약 ${details.totalKm.toFixed(1)} km${failures.length?' (일부 제외)':''}`,
    `국내 ${details.domesticKm.toFixed(1)} km (${details.domesticRatio}%) · 해외 ${details.intlKm.toFixed(1)} km (${details.intlRatio}%)`,
    `예상 이동 시간 ${details.totalTravelTime} · 비행 시간 ${details.flightTime} · 해외 왕복 비행 ${details.flightTakeoffs}회`,
    `해외 이동 환산 ${details.estimatedMiles.toLocaleString('ko-KR')} mi · 공연당 평균 ${details.avgKmPerEvent} km`,
    `가장 먼 공연 ${details.farthest.name} (${details.farthest.km.toFixed(1)} km) · 가장 가까운 공연 ${details.closest.name} (${details.closest.km.toFixed(1)} km)`
  ];
  summary.textContent=detailLines.join('\n');
  if(failures.length){
    const failedVenues=[...new Set(failures.map(item=>item.key.split('|')[1]))];
    $('routeStatusMsg').textContent=`내장 좌표를 찾지 못했습니다: ${failedVenues.join(', ')}`;
  }
  else $('routeStatusMsg').textContent=`${homeLocation.label} 출발 직선거리${cityFallbacks?` · 도시 좌표 사용 ${cityFallbacks}곳`:''}${countryFallbacks?` · 국가 좌표 대체 ${countryFallbacks}곳`:''}`;
}
function renderEvents(){
  const list=visibleEvents();
  const selectedVisible=list.filter(item=>item.selected).length;
  const selectVisibleButton=$('selectVisibleEvents');
  $('count').textContent=`현재 목록 ${list.length}건 · 선택 ${selectedVisible}건`;
  selectVisibleButton.textContent=list.length>0&&selectedVisible===list.length?'현재 목록 선택 해제':'현재 목록 모두 선택';
  selectVisibleButton.disabled=list.length===0;
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
  const preset=findCoordinate(query,HOME_ADDRESS_COORDS);
  if(preset){
    storeHomeLocation({label:`${preset.label} (내장 좌표)`,lat:preset.lat,lng:preset.lng});
    return;
  }
  $('routeStatusMsg').textContent='입력한 출발지 주소를 확인하는 중...';
  try{
    const result=await nominatimAddressSearch(query);
    if(!result){$('routeStatusMsg').textContent='주소 검색 결과가 없습니다. 주소를 확인하거나 국내 주요 도시·구 이름을 입력해 주세요.';return}
    const location={label:`${result.label} (주소 검색)`,lat:result.lat,lng:result.lng};
    if(!Number.isFinite(location.lat)||location.lat< -90||location.lat>90||!Number.isFinite(location.lng)||location.lng< -180||location.lng>180)throw Error('주소 좌표 응답이 올바르지 않습니다.');
    storeHomeLocation(location);
  }catch(error){
    console.error('출발지 주소 검색 실패:',error);
    $('routeStatusMsg').textContent=`주소 검색에 실패했습니다 (${error.message}). 국내 주요 도시·구는 내장 좌표로 입력할 수 있습니다.`;
  }
}
function useCurrentGPSLocation(){
  const statusEl=$('routeStatusMsg');
  if(!navigator.geolocation){statusEl.textContent='이 브라우저에서는 현재 위치 기능을 지원하지 않습니다.';return}
  statusEl.textContent='📡 현재 GPS 위치를 확인하는 중...';
  navigator.geolocation.getCurrentPosition(position=>{
    const {latitude:lat,longitude:lng}=position.coords;
    storeHomeLocation({label:'현재 위치 (GPS)',lat,lng});
  },error=>{
    if(error.code===1)statusEl.textContent='위치 권한이 차단되었습니다. 브라우저 설정에서 허용하거나 주소를 직접 입력해 주세요.';
    else statusEl.textContent='현재 위치를 확인하지 못했습니다. 주소를 직접 입력해 주세요.';
  },{enableHighAccuracy:false,timeout:8000,maximumAge:60000});
}
loadTravelLocation();
$('setHomeAddress').addEventListener('click',updateHomeFromAddress);
$('currentGpsButton').addEventListener('click',useCurrentGPSLocation);
$('homeAddressInput').addEventListener('keydown',event=>{if(event.key==='Enter')updateHomeFromAddress()});
document.addEventListener('click',event=>{
  const target=event.target,countryButton=target.closest('[data-country]'),categoryButton=target.closest('#categories [data-category], #categories [data-all-categories]'),gradeButton=target.closest('[data-grade]');
  if(countryButton){const id=countryButton.dataset.country;state.countries.has(id)?state.countries.delete(id):state.countries.add(id);render()}
  if(categoryButton){if(categoryButton.hasAttribute('data-all-categories')){const allSelected=state.categories.size===Object.keys(cfg.categories).length;state.categories=allSelected?new Set():new Set(Object.keys(cfg.categories))}else{const id=categoryButton.dataset.category;state.categories.has(id)?state.categories.delete(id):state.categories.add(id)}render()}
  if(gradeButton){const item=events.find(event=>event.id===gradeButton.dataset.grade);if(item){item.grade=Number(gradeButton.dataset.index);item.price=item.options[item.grade].price;item.unit=item.currency;item.editing=false;render()}}
  if(target.closest('#selectVisibleEvents')){const list=visibleEvents(),clear=list.length>0&&list.every(item=>item.selected);list.forEach(item=>item.selected=!clear);render()}
});
document.addEventListener('change',event=>{
  const input=event.target;
  if(input.matches('[data-all-months]'))state.months=input.checked?new Set(allMonths()):new Set();
  else if(input.matches('[data-month]'))input.checked?state.months.add(Number(input.dataset.month)):state.months.delete(Number(input.dataset.month));
  else if(input.matches('[data-select]')){const item=events.find(event=>event.id===input.dataset.select);if(item)item.selected=input.checked}
  else return;
  render();
});
$('allCountries').onclick=()=>{const allSelected=cfg.countries.every(item=>state.countries.has(item[0]));state.countries=allSelected?new Set():new Set(cfg.countries.map(item=>item[0]));render()};
$('done').onclick=()=>{$('receipt').hidden=!$('receipt').hidden;$('done').textContent=$('receipt').hidden?'완료':'공연 목록 수정';if(!$('receipt').hidden){$('receipt').scrollIntoView({behavior:'smooth'});renderTravelSummary()}};
(async()=>{
  try{
    if(location.protocol==='file:')throw Error('HTML 파일을 직접 열면 브라우저가 JSON을 불러올 수 없습니다. 로컬 웹 서버에서 실행해 주세요.');
    const scheduleUrl=new URL('data/events.json',document.baseURI);
    const response=await fetch(scheduleUrl.href);
    if(!response.ok)throw Error(`${scheduleUrl.pathname} 요청 실패 (HTTP ${response.status})`);
    try{cfg=await response.json()}catch(error){throw Error(`${scheduleUrl.pathname} JSON 파싱 실패: ${error.message}`)}
    if(!cfg||!Array.isArray(cfg.countries)||!cfg.categories||!cfg.rates||!Array.isArray(cfg.events))throw Error(`${scheduleUrl.pathname} 데이터 형식이 올바르지 않습니다.`);
    expandEvents();state.countries=new Set(cfg.countries.map(item=>item[0]));state.categories=new Set(Object.keys(cfg.categories));const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(saved){saved.events?.forEach(data=>{const item=events.find(event=>event.id===data.id);if(item)Object.assign(item,{selected:!!data.selected,grade:Number(data.grade)||0,price:Number(data.price)||0,unit:data.unit||item.currency})})}render()
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    $('events').innerHTML=`<div class="empty">일정 데이터를 불러오지 못했습니다. ${escapeHtml(message)}</div>`;
    console.error('일정 데이터 로딩 실패:',error);
  }
})();
