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
      return `<div class="selected-line grouped-line" data-visits="${data}"><span><b class="group-title">${escapeHtml(group.title)}</b><small class="group-dates">${escapeHtml(group.visits.map(v=>v.date).filter(Boolean).join(' · '))}</small></span><b class="group-count">${group.visits.length}회</b><strong>${money(group.total)}</strong></div>`;
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
    readRows().forEach(row=>{const current=months.get(row.month)||{count:0};current.count+=1;months.set(row.month,current)});
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
    monthlySummary.innerHTML=months.length?months.map(({month,count})=>`<div class="monthly-row"><span class="monthly-name">${monthName(month)}</span><b class="monthly-count">${count}회</b></div>`).join(''):'<p class="monthly-empty">공연을 선택하면 월별 관람 횟수가 여기에 표시돼요.</p>';
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
    const nickname=document.getElementById('nickname')?.value?.trim()||'CARAT';
    const canvas=document.createElement('canvas'),width=1080,padding=76,right=width-padding,contentWidth=right-padding;
    const measure=canvas.getContext('2d');if(!measure)return;
    measure.font='700 48px sans-serif';const titleLines=wrapText(measure,`${nickname}의 공연 리캡`,contentWidth);
    measure.font='22px sans-serif';
    const memberLayouts=counts.map(([name,count])=>({name,count,width:measure.measureText(`${name}  ${count}회`).width+36}));
    const memberGap=12,memberCols=3,memberCellW=(contentWidth-memberGap*(memberCols-1))/memberCols;
    const memberRows=Math.ceil(memberLayouts.length/memberCols);
    const eventLayouts=[];
    const eventGroups=new Map();
    rows.forEach(row=>{const group=eventGroups.get(row.title)||{title:row.title,dates:[],count:0};group.dates.push(row.date);group.count++;eventGroups.set(row.title,group)});
    measure.font='22px sans-serif';
    for(const group of eventGroups.values()){
      const title=wrapText(measure,group.title,contentWidth-120);
      const dates=wrapText(measure,group.dates.filter(Boolean).join(' · '),contentWidth-120);
      eventLayouts.push({title,dates,count:group.count,height:Math.max(title.length*30+dates.length*24+18,66)});
    }
    const monthlyRows=Math.ceil(monthly.length/3);
    const height=460+titleLines.length*60+memberRows*48+monthlyRows*55+eventLayouts.reduce((sum,row)=>sum+row.height,0)+120;
    canvas.width=width;canvas.height=Math.max(920,height);
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.fillStyle='#f1eee7';ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle='#fffefa';ctx.fillRect(48,42,width-96,canvas.height-84);
    let y=110;
    ctx.textAlign='center';ctx.fillStyle='#514b40';ctx.font='700 21px sans-serif';ctx.fillText('SEVENTEEN  /  2026',width/2,y);y+=70;
    ctx.fillStyle='#24221e';ctx.font='700 48px sans-serif';titleLines.forEach(line=>{ctx.fillText(line,width/2,y);y+=60});y+=12;

    const cardGap=18,cardW=(contentWidth-cardGap)/2,cardH=112,left=padding;
    [left,left+cardW+cardGap].forEach(x=>{ctx.fillStyle='#f7f4ed';ctx.fillRect(x,y,cardW,cardH);ctx.strokeStyle='#e2ddd3';ctx.strokeRect(x,y,cardW,cardH)});
    ctx.fillStyle='#514b40';ctx.font='700 50px sans-serif';ctx.fillText(String(rows.length),left+cardW/2,y+61);ctx.fillText(String(countries),left+cardW+cardGap+cardW/2,y+61);
    ctx.fillStyle='#777064';ctx.font='21px sans-serif';ctx.fillText('공연 관람',left+cardW/2,y+91);ctx.fillText('방문 국가',left+cardW+cardGap+cardW/2,y+91);y+=cardH+34;

    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 25px sans-serif';ctx.fillText('함께한 멤버',padding,y);y+=34;
    if(memberLayouts.length){
      memberLayouts.forEach((member,index)=>{
        const row=Math.floor(index/memberCols),col=index%memberCols,x=padding+col*(memberCellW+memberGap),top=y+row*48;
        ctx.fillStyle='#f7f4ed';ctx.strokeStyle='#e2ddd3';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,top,memberCellW,38,5);ctx.fill();ctx.stroke();
        ctx.textAlign='center';ctx.fillStyle='#39362f';ctx.font='700 17px sans-serif';ctx.fillText(member.name,x+memberCellW/2,top+24);
        ctx.textAlign='right';ctx.fillStyle='#514b40';ctx.font='15px sans-serif';ctx.fillText(`${member.count}회`,x+memberCellW-8,top+24);
      });
      y+=memberRows*48+12;
    }else{ctx.fillStyle='#777064';ctx.font='17px sans-serif';ctx.fillText('함께한 멤버 기록이 없습니다.',padding,y+10);y+=36}

    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 25px sans-serif';ctx.fillText('월별 관람',padding,y);y+=18;
    const monthGap=10,monthW=(contentWidth-monthGap*2)/3;
    monthly.forEach((item,index)=>{
      const row=Math.floor(index/3),col=index%3,x=padding+col*(monthW+monthGap),top=y+row*48;
      ctx.fillStyle='#faf9f6';ctx.strokeStyle='#e8e2d8';ctx.beginPath();ctx.roundRect(x,top,monthW,38,4);ctx.fill();ctx.stroke();
      ctx.textAlign='left';ctx.fillStyle='#514b40';ctx.font='700 16px sans-serif';ctx.fillText(monthName(item.month),x+8,top+24);
      ctx.textAlign='right';ctx.fillText(`${item.count}회`,x+monthW-8,top+24);
    });
    y+=monthlyRows*48+26;

    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 25px sans-serif';ctx.fillText('함께한 공연',padding,y);y+=16;
    eventLayouts.forEach(group=>{
      const top=y+16;ctx.fillStyle='#39362f';ctx.textAlign='left';ctx.font='700 18px sans-serif';
      group.title.forEach((line,index)=>ctx.fillText(line,padding+8,top+index*26));
      ctx.textAlign='right';ctx.fillStyle='#514b40';ctx.font='700 16px sans-serif';ctx.fillText(`${group.count}회`,right-8,top);
      ctx.textAlign='left';ctx.fillStyle='#777064';ctx.font='14px sans-serif';
      group.dates.forEach((line,index)=>ctx.fillText(line,padding+8,top+group.title.length*26+index*20));
      y+=group.height;
      ctx.strokeStyle='#e7e2d9';ctx.beginPath();ctx.moveTo(padding,y);ctx.lineTo(right,y);ctx.stroke();
    });
    y+=24;ctx.textAlign='center';ctx.fillStyle='#6f6a60';ctx.font='17px sans-serif';ctx.fillText('당신의 2026년 공연 기록',width/2,y);

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
