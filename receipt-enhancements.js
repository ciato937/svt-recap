(() => {
  const selectedEvents=document.getElementById('selectedEvents');
  const monthlySummary=document.getElementById('monthlySummary');
  const eventList=document.getElementById('events');
  const saveButton=document.getElementById('saveReceiptImage');
  const downloadBox=document.getElementById('receiptImageDownloads');
  let receiptDownloadUrls=[];
  const money=value=>`₩${Math.round(value).toLocaleString('ko-KR')}`;
  const monthName=month=>`${String(month).padStart(2,'0')}월`;
  const memberNames=['에스쿱스','정한','조슈아','준','호시','원우','우지','디에잇','민규','도겸','승관','버논','디노'];
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function groupReceiptEvents(){
    if(!selectedEvents)return;
    const sourceRows=[...selectedEvents.querySelectorAll('.selected-line:not(.grouped-line)')];
    if(!sourceRows.length)return;
    const groups=new Map();
    sourceRows.forEach(row=>{
      const label=row.querySelector('span')?.textContent?.trim()||'';
      const match=label.match(/^(\d{2})[-.](\d{2})\s*[·-]\s*(.*)$/);
      const title=match?.[3]?.trim()||label;
      const date=match?`${match[1]}-${match[2]}`:'';
      const amount=Number((row.querySelector('b')?.textContent||'').replace(/[^\d.-]/g,''))||0;
      const group=groups.get(title)||{title,visits:[],total:0,members:new Map()};
      group.visits.push({date,month:Number(date.slice(0,2)),amount});group.total+=amount;
      (row.dataset.members||'').split('|').map(name=>name.trim()).filter(Boolean).forEach(name=>group.members.set(name,(group.members.get(name)||0)+1));
      groups.set(title,group);
    });
    selectedEvents.innerHTML=[...groups.values()].map(group=>{
      const data=encodeURIComponent(JSON.stringify(group.visits));
      const dates=group.visits.map(visit=>`<time class="group-date" datetime="2026-${escapeHtml(visit.date)}">${escapeHtml(visit.date)}</time>`).join('');
      const memberCounts=encodeURIComponent(JSON.stringify([...group.members]));
      return `<article class="selected-line grouped-line" data-visits="${data}" data-member-counts="${memberCounts}"><div class="group-heading"><strong class="group-title">${escapeHtml(group.title)}</strong><span class="group-count">${group.visits.length}회 관람</span></div><div class="group-dates">${dates}</div><div class="group-total"><small>공연 지출 합계</small><strong>${money(group.total)}</strong></div></article>`;
    }).join('');
  }

  function readRows(){
    const grouped=[...(selectedEvents?.querySelectorAll('.grouped-line')||[])];
    if(grouped.length)return grouped.flatMap(row=>{
      let visits=[];try{visits=JSON.parse(decodeURIComponent(row.dataset.visits||''))}catch(_){}
      const title=row.querySelector('.group-title')?.textContent?.trim()||'';
      return visits.map(visit=>({title,date:visit.date,month:Number(visit.month),amount:Number(visit.amount)||0}));
    }).filter(row=>row.month>=1&&row.month<=12);
    return [...(selectedEvents?.querySelectorAll('.selected-line')||[])].map(row=>{
      const label=row.querySelector('span')?.textContent?.trim()||'';
      const match=label.match(/^(\d{2})[-.](\d{2})\s*[·-]\s*(.*)$/);
      return{title:match?.[3]?.trim()||label,date:match?`${match[1]}-${match[2]}`:'',month:Number(match?.[1]),amount:Number((row.querySelector('b')?.textContent||'').replace(/[^\d.-]/g,''))||0};
    }).filter(row=>row.month>=1&&row.month<=12);
  }

  function readMemberCounts(){
    const counts=new Map(memberNames.map(name=>[name,0]));
    selectedEvents?.querySelectorAll('.grouped-line').forEach(group=>{
      let members=[];try{members=JSON.parse(decodeURIComponent(group.dataset.memberCounts||''))}catch(_){}
      members.forEach(([name,count])=>{
        if(counts.has(name))counts.set(name,counts.get(name)+Number(count||0));
      });
    });
    return[...counts].filter(([,count])=>count>0);
  }

  function getCountryCount(){
    const match=(document.getElementById('visitCount')?.textContent||'').match(/국가\s*(\d+)개/);
    return Number(match?.[1])||0;
  }

  function getMonthlyTotals(){
    const months=new Map();
    readRows().forEach(row=>{const current=months.get(row.month)||{count:0,spend:0};current.count+=1;current.spend+=row.amount;months.set(row.month,current)});
    return[...months.entries()].sort((a,b)=>a[0]-b[0]).map(([month,stats])=>({month,...stats}));
  }

  function renderHighlights(){
    const totalPanel=document.querySelector('#receipt .receipt-total');if(!totalPanel)return;
    let summary=document.getElementById('memberSummary');
    if(!summary){summary=document.createElement('section');summary.id='memberSummary';summary.className='member-summary';summary.innerHTML='<h3>함께한 멤버</h3><div class="member-counts"></div>';totalPanel.insertAdjacentElement('afterend',summary)}
    let highlights=document.getElementById('recapHighlights');
    if(!highlights){highlights=document.createElement('div');highlights.id='recapHighlights';highlights.className='recap-highlights';summary.insertAdjacentElement('beforebegin',highlights)}
    const rows=readRows(),counts=readMemberCounts();
    highlights.innerHTML=`<div class="recap-stat"><strong>${rows.length}</strong><span>공연 관람</span></div><div class="recap-stat"><strong>${getCountryCount()}</strong><span>방문 국가</span></div>`;
    summary.querySelector('.member-counts').innerHTML=counts.length?counts.map(([name,count])=>`<span class="member-count"><b>${escapeHtml(name)}</b><strong>${count}회</strong></span>`).join(''):'<p class="monthly-empty">선택한 공연에서 함께한 멤버가 표시돼요.</p>';
  }

  function renderMonthlySummary(){
    if(!monthlySummary)return;
    const months=getMonthlyTotals();
    monthlySummary.innerHTML=months.length?months.map(({month,count,spend})=>`<div class="monthly-row"><span class="monthly-name">${monthName(month)}</span><b class="monthly-count">${count}회</b><strong class="monthly-spend">${money(spend)}</strong></div>`).join(''):'<p class="monthly-empty">공연을 선택하면 월별 관람 횟수와 지출이 여기에 표시돼요.</p>';
  }

  function addStyles(){
    if(document.getElementById('receiptRecapStyles'))return;
    const style=document.createElement('style');style.id='receiptRecapStyles';
    style.textContent='.countries{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px}.recap-highlights{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 16px}.recap-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:78px;padding:10px;border:1px solid #e2ddd3;background:#f7f4ed;text-align:center}.recap-stat strong{font:700 29px/1.1 Georgia,"Noto Serif KR",serif;color:#514b40}.recap-stat span{margin-top:5px;font-size:11px;color:#777064}.receipt-total{padding:8px 4px!important}.receipt-total>strong{font-size:20px!important;font-weight:500!important;color:#777064!important}.receipt-total>span,.receipt-total>small{font-size:11px;color:#888071}.monthly-summary{margin:0 0 16px;text-align:left}.monthly-summary h3{margin:0 0 7px!important;font-size:13px}.monthly-summary #monthlySummary{display:flex;flex-wrap:wrap;gap:6px}.monthly-row{display:flex!important;flex:1 1 74px;align-items:center;justify-content:space-between;gap:6px;min-width:74px;padding:6px 8px!important;border:1px solid #e8e2d8!important;border-radius:4px;background:#faf9f6!important;font-size:10px!important}.monthly-name{font-weight:700;white-space:nowrap}.monthly-count{color:#514b40;white-space:nowrap}.member-summary{margin:0 0 16px;text-align:left}.member-summary h3{margin:0 0 7px!important;font-size:13px}.member-counts{display:flex;flex-wrap:wrap;gap:6px}.member-count{display:inline-flex;gap:7px;align-items:center;padding:5px 9px;border:1px solid #e2ddd3;background:#f7f4ed;font-size:11px}.member-count strong{color:#514b40}.grouped-line{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center}.grouped-line>span{display:flex;flex-direction:column;min-width:0}.group-title{font-size:12px}.group-dates{font-size:9px;color:#888071;line-height:1.4}.group-count{font-size:10px;white-space:nowrap;color:#514b40}.grouped-line>strong{font-size:10px;color:#888071;white-space:nowrap}@media(max-width:420px){.countries{gap:5px}.country{padding:7px 4px;font-size:11px}}';
    document.head.append(style);
  }

  function wrapText(ctx,text,maxWidth){
    const lines=[];let line='';
    for(const char of String(text)){const candidate=line+char;if(line&&ctx.measureText(candidate).width>maxWidth){lines.push(line);line=char}else line=candidate}
    if(line)lines.push(line);return lines.length?lines:[''];
  }

  function drawReceiptImage(){
    const rows=readRows(),monthly=getMonthlyTotals(),counts=readMemberCounts(),countries=getCountryCount();
    const total=document.getElementById('total')?.textContent?.trim()||'₩0';
    const width=1080,padding=76,contentWidth=width-padding*2;
    const page1=document.createElement('canvas'),page1Measure=page1.getContext('2d');if(!page1Measure)return;
    const memberCols=3,memberGap=12,memberCellW=(contentWidth-memberGap*(memberCols-1))/memberCols,memberRowH=48;
    const memberRows=Math.ceil(counts.length/memberCols),monthCols=3,monthGap=12,monthRowH=64;
    const monthCellW=(contentWidth-monthGap*(monthCols-1))/monthCols,monthRows=Math.ceil(monthly.length/monthCols);
    const page1Height=82+52+58+18+132+22+112+30+34+memberRows*memberRowH+22+34+monthRows*monthRowH+100;
    page1.width=width;page1.height=Math.max(700,page1Height);
    const ctx=page1.getContext('2d');if(!ctx)return;
    paintPage(ctx,page1);
    let y=82;
    ctx.textAlign='center';ctx.fillStyle='#617363';ctx.font='700 20px sans-serif';ctx.fillText('SEVENTEEN  ·  2026',width/2,y);y+=52;
    ctx.fillStyle='#20251f';ctx.font='700 48px sans-serif';ctx.fillText('나의 공연 리캡',width/2,y);y+=76;

    ctx.fillStyle='#f3f7f2';ctx.strokeStyle='#dfe8df';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(padding,y,contentWidth,132,18);ctx.fill();ctx.stroke();
    ctx.textAlign='left';ctx.fillStyle='#526457';ctx.font='600 20px sans-serif';ctx.fillText('총 지출 · KRW 환산',padding+24,y+40);
    ctx.fillStyle='#244a35';ctx.font='700 48px sans-serif';ctx.fillText(total,padding+24,y+100);y+=154;

    const statGap=18,statW=(contentWidth-statGap)/2,statH=112;
    [0,1].forEach(index=>{const x=padding+index*(statW+statGap);ctx.fillStyle='#f8faf7';ctx.strokeStyle='#e1e8df';ctx.beginPath();ctx.roundRect(x,y,statW,statH,14);ctx.fill();ctx.stroke()});
    ctx.textAlign='center';ctx.fillStyle='#315d4b';ctx.font='700 46px sans-serif';ctx.fillText(String(rows.length),padding+statW/2,y+55);ctx.fillText(String(countries),padding+statW+statGap+statW/2,y+55);
    ctx.fillStyle='#637267';ctx.font='20px sans-serif';ctx.fillText('공연 관람',padding+statW/2,y+86);ctx.fillText('방문 국가',padding+statW+statGap+statW/2,y+86);y+=statH+30;

    drawSectionTitle(ctx,'함께한 멤버',padding,y);y+=34;
    if(counts.length){
      counts.forEach(([name,count],index)=>{
        const row=Math.floor(index/memberCols),column=index%memberCols,x=padding+column*(memberCellW+memberGap),top=y+row*memberRowH;
        roundedCard(ctx,x,top,memberCellW,38,'#f8faf7','#e1e7df',9);
        ctx.textAlign='left';ctx.fillStyle='#303a32';ctx.font='700 17px sans-serif';ctx.fillText(name,x+12,top+24);
        ctx.textAlign='right';ctx.fillStyle='#315d4b';ctx.font='600 15px sans-serif';ctx.fillText(`${count}회`,x+memberCellW-12,top+24);
      });
      y+=memberRows*memberRowH+22;
    }else{ctx.textAlign='left';ctx.fillStyle='#777064';ctx.font='17px sans-serif';ctx.fillText('선택한 공연에서 함께한 멤버가 없습니다.',padding,y+12);y+=40}

    drawSectionTitle(ctx,'월별 관람 · 지출',padding,y);y+=34;
    monthly.forEach((item,index)=>{
      const row=Math.floor(index/monthCols),column=index%monthCols,x=padding+column*(monthCellW+monthGap),top=y+row*monthRowH;
      roundedCard(ctx,x,top,monthCellW,54,'#f8faf7','#e1e7df',10);
      ctx.textAlign='left';ctx.fillStyle='#303a32';ctx.font='700 16px sans-serif';ctx.fillText(monthName(item.month),x+12,top+22);
      ctx.textAlign='right';ctx.fillStyle='#637267';ctx.font='14px sans-serif';ctx.fillText(`${item.count}회`,x+monthCellW-12,top+22);
      ctx.textAlign='left';ctx.fillStyle='#315d4b';ctx.font='700 16px sans-serif';ctx.fillText(money(item.spend),x+12,top+44);
    });
    y+=monthRows*monthRowH+28;
    drawPageFooter(ctx,width,page1.height,'1 / 2');

    const page2=document.createElement('canvas'),measure=page2.getContext('2d');if(!measure)return;
    const eventCols=2,eventGap=18,eventCardW=(contentWidth-eventGap)/eventCols,eventLayouts=[];
    const grouped=new Map();
    rows.forEach(row=>{const group=grouped.get(row.title)||{title:row.title,dates:[],count:0,total:0};group.dates.push(row.date);group.count++;group.total+=row.amount;grouped.set(row.title,group)});
    for(const group of grouped.values()){
      measure.font='700 20px sans-serif';const title=wrapText(measure,group.title,eventCardW-36);
      measure.font='16px sans-serif';const dateRows=[];let currentRow=[],currentWidth=0;
      group.dates.filter(Boolean).forEach(date=>{
        const chipWidth=measure.measureText(date).width+22;
        if(currentRow.length&&currentWidth+chipWidth+8>eventCardW-36){dateRows.push(currentRow);currentRow=[];currentWidth=0}
        currentRow.push({date,width:chipWidth});currentWidth+=chipWidth+(currentRow.length>1?8:0);
      });
      if(currentRow.length)dateRows.push(currentRow);
      const height=14+title.length*25+6+28+6+Math.max(1,dateRows.length)*30+10+44+12;
      eventLayouts.push({title,dateRows,count:group.count,total:group.total,height});
    }
    const eventRowHeights=[];
    for(let index=0;index<eventLayouts.length;index+=eventCols)eventRowHeights.push(Math.max(...eventLayouts.slice(index,index+eventCols).map(group=>group.height)));
    const eventsTop=196,eventRowsHeight=eventRowHeights.reduce((sum,rowHeight)=>sum+rowHeight+14,0);
    const emptyHeight=eventLayouts.length?0:100;
    page2.width=width;page2.height=Math.max(360,eventsTop+(eventRowsHeight||emptyHeight)+64);
    const ctx2=page2.getContext('2d');if(!ctx2)return;
    paintPage(ctx2,page2);
    ctx2.textAlign='center';ctx2.fillStyle='#617363';ctx2.font='700 20px sans-serif';ctx2.fillText('SEVENTEEN  ·  2026',width/2,82);
    ctx2.fillStyle='#20251f';ctx2.font='700 38px sans-serif';ctx2.fillText('함께한 공연',width/2,139);
    ctx2.fillStyle='#737a70';ctx2.font='17px sans-serif';ctx2.fillText(`${rows.length}회 관람 · ${eventLayouts.length}개 공연`,width/2,169);
    if(eventLayouts.length){
      let rowY=eventsTop;
      for(let index=0;index<eventLayouts.length;index+=eventCols){
        const rowGroups=eventLayouts.slice(index,index+eventCols),cardH=eventRowHeights[index/eventCols];
        rowGroups.forEach((group,column)=>{
          const x=padding+column*(eventCardW+eventGap),top=rowY;
          roundedCard(ctx2,x,top,eventCardW,cardH,'#fbfcfa','#e3e9e1',14);
          ctx2.textAlign='left';ctx2.fillStyle='#303a32';ctx2.font='700 20px sans-serif';
          group.title.forEach((line,lineIndex)=>ctx2.fillText(line,x+18,top+27+lineIndex*25));
          const badgeY=top+14+group.title.length*25+4,badgeW=112,badgeH=28;
          roundedCard(ctx2,x+18,badgeY,badgeW,badgeH,'#e8f0e9','#e8f0e9',14);
          ctx2.textAlign='center';ctx2.fillStyle='#315d4b';ctx2.font='700 14px sans-serif';ctx2.fillText(`${group.count}회 관람`,x+18+badgeW/2,badgeY+19);
          let chipY=badgeY+34;
          group.dateRows.forEach(dateRow=>{
            let chipX=x+18;
            dateRow.forEach(chip=>{
              roundedCard(ctx2,chipX,chipY,chip.width,24,'#fff','#e1e7df',6);
              ctx2.textAlign='center';ctx2.fillStyle='#667166';ctx2.font='13px sans-serif';ctx2.fillText(chip.date,chipX+chip.width/2,chipY+17);
              chipX+=chip.width+8;
            });
            chipY+=30;
          });
          const footerY=top+cardH-44;
          ctx2.strokeStyle='#dfe5dd';ctx2.setLineDash([5,5]);ctx2.beginPath();ctx2.moveTo(x+18,footerY);ctx2.lineTo(x+eventCardW-18,footerY);ctx2.stroke();ctx2.setLineDash([]);
          ctx2.textAlign='left';ctx2.fillStyle='#737a70';ctx2.font='14px sans-serif';ctx2.fillText('공연 지출 합계',x+18,footerY+27);
          ctx2.textAlign='right';ctx2.fillStyle='#315d4b';ctx2.font='700 17px sans-serif';ctx2.fillText(money(group.total),x+eventCardW-18,footerY+28);
        });
        rowY+=cardH+14;
      }
    }else{ctx2.textAlign='center';ctx2.fillStyle='#737a70';ctx2.font='18px sans-serif';ctx2.fillText('선택한 공연이 없습니다.',width/2,eventsTop+42)}
    drawPageFooter(ctx2,width,page2.height,'2 / 2');

    receiptDownloadUrls.forEach(url=>URL.revokeObjectURL(url));receiptDownloadUrls=[];
    if(!downloadBox)return;
    downloadBox.hidden=false;
    downloadBox.innerHTML='<p>이미지를 각각 눌러 저장해 주세요.</p><span>이미지를 만드는 중…</span>';
    downloadBox.scrollIntoView({block:'nearest',behavior:'smooth'});
    Promise.all([page1,page2].map(page=>new Promise((resolve,reject)=>page.toBlob(blob=>blob?resolve(blob):reject(Error('이미지를 만들지 못했습니다.')),'image/png'))))
      .then(blobs=>{
        downloadBox.innerHTML='<p>각 페이지를 눌러 PNG 파일로 저장할 수 있어요.</p>';
        blobs.forEach((blob,index)=>{
          const url=URL.createObjectURL(blob);receiptDownloadUrls.push(url);
          const link=document.createElement('a');link.href=url;link.download=`seventeen-concert-recap-2026-${index+1}.png`;link.textContent=`${index+1}페이지 저장`;
          downloadBox.append(link);
        });
      })
      .catch(error=>{downloadBox.innerHTML='<p>이미지를 만들지 못했습니다. 다시 눌러 주세요.</p>';console.error('영수증 이미지 생성 실패:',error)});
  }

  function paintPage(ctx,canvas){
    ctx.fillStyle='#f3f5f0';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(38,36,canvas.width-76,canvas.height-72,24);ctx.fill();
  }
  function roundedCard(ctx,x,y,width,height,fill,stroke,radius){
    ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y,width,height,radius);ctx.fill();ctx.stroke();
  }
  function drawSectionTitle(ctx,title,padding,y){
    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 24px sans-serif';ctx.fillText(title,padding,y);
  }
  function drawPageFooter(ctx,width,height,label){
    ctx.textAlign='center';ctx.fillStyle='#879186';ctx.font='15px sans-serif';ctx.fillText(`CARAT MEMORY  ·  2026  ·  ${label}`,width/2,height-48);
  }

  addStyles();
  if(selectedEvents)new MutationObserver(()=>{groupReceiptEvents();renderHighlights();renderMonthlySummary()}).observe(selectedEvents,{childList:true,subtree:true,characterData:true});
  if(eventList)new MutationObserver(renderHighlights).observe(eventList,{childList:true,subtree:true});
  document.addEventListener('change',event=>{if(event.target.matches('#events [data-select]'))renderHighlights()});
  groupReceiptEvents();renderHighlights();renderMonthlySummary();saveButton?.addEventListener('click',drawReceiptImage);
})();
