(() => {
  const selectedEvents=document.getElementById('selectedEvents');
  const monthlySummary=document.getElementById('monthlySummary');
  const eventList=document.getElementById('events');
  const saveButton=document.getElementById('saveReceiptImage');
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
      const group=groups.get(title)||{title,visits:[],total:0};
      group.visits.push({date,month:Number(date.slice(0,2)),amount});group.total+=amount;groups.set(title,group);
    });
    selectedEvents.innerHTML=[...groups.values()].map(group=>{
      const data=encodeURIComponent(JSON.stringify(group.visits));
      const dates=group.visits.map(visit=>`<time class="group-date" datetime="2026-${escapeHtml(visit.date)}">${escapeHtml(visit.date)}</time>`).join('');
      return `<article class="selected-line grouped-line" data-visits="${data}"><div class="group-heading"><strong class="group-title">${escapeHtml(group.title)}</strong><span class="group-count">${group.visits.length}회 관람</span></div><div class="group-dates">${dates}</div><div class="group-total"><small>공연 지출 합계</small><strong>${money(group.total)}</strong></div></article>`;
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
    eventList?.querySelectorAll('.event').forEach(card=>{
      if(!card.querySelector('[data-select]')?.checked)return;
      (card.querySelector('.event-members')?.dataset.members||'').split('|').map(name=>name.trim()).filter(Boolean).forEach(name=>{
        if(counts.has(name))counts.set(name,counts.get(name)+1);
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
    const canvas=document.createElement('canvas'),width=1080,padding=76,right=width-padding,contentWidth=right-padding;
    const measure=canvas.getContext('2d');if(!measure)return;
    measure.font='700 48px sans-serif';const titleLines=wrapText(measure,'2026 나의 공연 리캡',contentWidth);
    measure.font='22px sans-serif';
    const memberLayouts=counts.map(([name,count])=>({name,count,width:measure.measureText(`${name}  ${count}회`).width+36}));
    const memberGap=12,memberCols=3,memberCellW=(contentWidth-memberGap*(memberCols-1))/memberCols;
    const memberRows=Math.ceil(memberLayouts.length/memberCols);
    const eventLayouts=[];
    const eventGroups=new Map();
    rows.forEach(row=>{const group=eventGroups.get(row.title)||{title:row.title,dates:[],count:0,total:0};group.dates.push(row.date);group.count++;group.total+=row.amount;eventGroups.set(row.title,group)});
    measure.font='22px sans-serif';
    for(const group of eventGroups.values()){
      const title=wrapText(measure,group.title,contentWidth-190);
      measure.font='17px sans-serif';
      const dateRows=[];let currentRow=[],currentWidth=0;
      group.dates.filter(Boolean).forEach(date=>{
        const chipWidth=measure.measureText(date).width+26;
        if(currentRow.length&&currentWidth+chipWidth+8>contentWidth-36){dateRows.push(currentRow);currentRow=[];currentWidth=0}
        currentRow.push({date,width:chipWidth});currentWidth+=chipWidth+(currentRow.length>1?8:0);
      });
      if(currentRow.length)dateRows.push(currentRow);
      eventLayouts.push({title,dateRows,count:group.count,total:group.total,height:20+title.length*30+12+Math.max(1,dateRows.length)*36+12+1+42+16});
      measure.font='22px sans-serif';
    }
    const monthlyRows=Math.ceil(monthly.length/3);
    const height=620+titleLines.length*60+memberRows*48+monthlyRows*55+eventLayouts.reduce((sum,row)=>sum+row.height+14,0)+120;
    canvas.width=width;canvas.height=Math.max(920,height);
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.fillStyle='#f3f5f0';ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle='#ffffff';ctx.fillRect(48,42,width-96,canvas.height-84);
    let y=110;
    ctx.textAlign='center';ctx.fillStyle='#514b40';ctx.font='700 21px sans-serif';ctx.fillText('SEVENTEEN  /  2026',width/2,y);y+=70;
    ctx.fillStyle='#20251f';ctx.font='700 48px sans-serif';titleLines.forEach(line=>{ctx.fillText(line,width/2,y);y+=60});y+=12;

    ctx.fillStyle='#f3f7f2';ctx.strokeStyle='#dfe8df';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(padding,y,contentWidth,126,14);ctx.fill();ctx.stroke();
    ctx.textAlign='left';ctx.fillStyle='#526457';ctx.font='600 21px sans-serif';ctx.fillText('총 지출 · KRW 환산',padding+24,y+39);
    ctx.fillStyle='#244a35';ctx.font='700 48px sans-serif';ctx.fillText(total,padding+24,y+96);y+=150;

    const cardGap=18,cardW=(contentWidth-cardGap)/2,cardH=112,left=padding;
    [left,left+cardW+cardGap].forEach(x=>{ctx.fillStyle='#f8faf7';ctx.beginPath();ctx.roundRect(x,y,cardW,cardH,12);ctx.fill();ctx.strokeStyle='#e1e8df';ctx.stroke()});
    ctx.fillStyle='#315d4b';ctx.font='700 50px sans-serif';ctx.fillText(String(rows.length),left+cardW/2,y+61);ctx.fillText(String(countries),left+cardW+cardGap+cardW/2,y+61);
    ctx.fillStyle='#637267';ctx.font='21px sans-serif';ctx.fillText('공연 관람',left+cardW/2,y+91);ctx.fillText('방문 국가',left+cardW+cardGap+cardW/2,y+91);y+=cardH+34;

    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 25px sans-serif';ctx.fillText('함께한 멤버',padding,y);y+=34;
    if(memberLayouts.length){
      memberLayouts.forEach((member,index)=>{
        const row=Math.floor(index/memberCols),col=index%memberCols,x=padding+col*(memberCellW+memberGap),top=y+row*48;
        ctx.fillStyle='#f8faf7';ctx.strokeStyle='#e1e7df';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,top,memberCellW,38,8);ctx.fill();ctx.stroke();
        ctx.textAlign='center';ctx.fillStyle='#303a32';ctx.font='700 17px sans-serif';ctx.fillText(member.name,x+memberCellW/2,top+24);
        ctx.textAlign='right';ctx.fillStyle='#315d4b';ctx.font='600 15px sans-serif';ctx.fillText(`${member.count}회`,x+memberCellW-8,top+24);
      });
      y+=memberRows*48+12;
    }else{ctx.fillStyle='#777064';ctx.font='17px sans-serif';ctx.fillText('함께한 멤버 기록이 없습니다.',padding,y+10);y+=36}

    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 25px sans-serif';ctx.fillText('월별 관람',padding,y);y+=18;
    const monthGap=10,monthW=(contentWidth-monthGap*2)/3;
    monthly.forEach((item,index)=>{
      const row=Math.floor(index/3),col=index%3,x=padding+col*(monthW+monthGap),top=y+row*48;
      ctx.fillStyle='#f8faf7';ctx.strokeStyle='#e1e7df';ctx.beginPath();ctx.roundRect(x,top,monthW,38,8);ctx.fill();ctx.stroke();
      ctx.textAlign='left';ctx.fillStyle='#303a32';ctx.font='700 16px sans-serif';ctx.fillText(monthName(item.month),x+8,top+24);
      ctx.textAlign='center';ctx.fillStyle='#637267';ctx.font='15px sans-serif';ctx.fillText(`${item.count}회`,x+monthW/2,top+24);
      ctx.textAlign='right';ctx.fillStyle='#315d4b';ctx.font='700 15px sans-serif';ctx.fillText(money(item.spend),x+monthW-8,top+24);
    });
    y+=monthlyRows*48+26;

    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 25px sans-serif';ctx.fillText('함께한 공연',padding,y);y+=16;
    eventLayouts.forEach(group=>{
      const cardX=padding,cardY=y+14,cardW=contentWidth,cardH=group.height;
      ctx.fillStyle='#fbfcfa';ctx.strokeStyle='#e3e9e1';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,cardH,14);ctx.fill();ctx.stroke();
      ctx.textAlign='left';ctx.fillStyle='#303a32';ctx.font='700 22px sans-serif';
      group.title.forEach((line,index)=>ctx.fillText(line,cardX+20,cardY+34+index*30));
      const badgeW=128,badgeH=34,badgeX=cardX+cardW-20-badgeW,badgeY=cardY+16;
      ctx.fillStyle='#e8f0e9';ctx.beginPath();ctx.roundRect(badgeX,badgeY,badgeW,badgeH,17);ctx.fill();
      ctx.textAlign='center';ctx.fillStyle='#315d4b';ctx.font='700 16px sans-serif';ctx.fillText(`${group.count}회 관람`,badgeX+badgeW/2,badgeY+23);
      let chipY=cardY+20+group.title.length*30+10;
      group.dateRows.forEach(row=>{
        let chipX=cardX+20;
        row.forEach(chip=>{
          const chipH=28;ctx.fillStyle='#ffffff';ctx.strokeStyle='#e1e7df';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(chipX,chipY,chip.width,chipH,7);ctx.fill();ctx.stroke();
          ctx.textAlign='center';ctx.fillStyle='#667166';ctx.font='15px sans-serif';ctx.fillText(chip.date,chipX+chip.width/2,chipY+19);
          chipX+=chip.width+8;
        });
        chipY+=36;
      });
      const footerY=cardY+cardH-54;ctx.strokeStyle='#dfe5dd';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(cardX+20,footerY);ctx.lineTo(cardX+cardW-20,footerY);ctx.stroke();ctx.setLineDash([]);
      ctx.textAlign='left';ctx.fillStyle='#737a70';ctx.font='16px sans-serif';ctx.fillText('공연 지출 합계',cardX+20,footerY+31);
      ctx.textAlign='right';ctx.fillStyle='#315d4b';ctx.font='700 20px sans-serif';ctx.fillText(money(group.total),cardX+cardW-20,footerY+33);
      y+=cardH+14;
    });
    y+=24;ctx.textAlign='center';ctx.fillStyle='#637267';ctx.font='17px sans-serif';ctx.fillText('당신의 2026년 공연 기록',width/2,y);

    canvas.toBlob(blob=>{
      const link=document.createElement('a');link.download='seventeen-concert-recap-2026.png';
      link.href=blob?URL.createObjectURL(blob):canvas.toDataURL('image/png');link.click();
      if(blob)setTimeout(()=>URL.revokeObjectURL(link.href),1500);
    },'image/png');
  }

  addStyles();
  if(selectedEvents)new MutationObserver(()=>{groupReceiptEvents();renderHighlights();renderMonthlySummary()}).observe(selectedEvents,{childList:true,subtree:true,characterData:true});
  if(eventList)new MutationObserver(renderHighlights).observe(eventList,{childList:true,subtree:true});
  document.addEventListener('change',event=>{if(event.target.matches('#events [data-select]'))renderHighlights()});
  groupReceiptEvents();renderHighlights();renderMonthlySummary();saveButton?.addEventListener('click',drawReceiptImage);
})();
