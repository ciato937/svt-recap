(() => {
  const selectedEvents=document.getElementById('selectedEvents');
  const monthlySummary=document.getElementById('monthlySummary');
  const saveButton=document.getElementById('saveReceiptImage');
  const money=value=>`₩${Math.round(value).toLocaleString('ko-KR')}`;
  const monthName=month=>`${String(month).padStart(2,'0')}월`;
  const members=['에스쿱스','정한','조슈아','준','호시','원우','우지','디에잇','민규','도겸','승관','버논','디노'];
  const getEventMembers=id=>document.querySelector(`[data-select="${CSS.escape(id)}"]`)?.closest('.event')?.querySelector('.event-members')?.dataset.members?.split('|')||[];

  function readRows(){
    return [...(selectedEvents?.querySelectorAll('.selected-line')||[])].map(row=>{
      const label=row.querySelector('span')?.textContent?.trim()||'';
      const month=Number(label.match(/^(\d{2})[-.]/)?.[1]);
      const amount=Number((row.querySelector('b')?.textContent||'').replace(/[^\d.-]/g,''))||0;
      return{label,month,amount};
    }).filter(row=>row.month>=1&&row.month<=12);
  }
  function getStats(){
    const rows=readRows(),selected=[...document.querySelectorAll('#events [data-select]:checked')];
    const countries=Number((document.getElementById('visitCount')?.textContent||'').match(/국가\s*(\d+)개/)?.[1])||0;
    const counts=new Map(members.map(name=>[name,0]));
    selected.forEach(input=>getEventMembers(input.dataset.select).forEach(name=>{if(counts.has(name))counts.set(name,counts.get(name)+1)}));
    return{rows,countries,counts:[...counts].filter(([,count])=>count>0)};
  }
  function renderHighlights(){
    const totalPanel=document.querySelector('#receipt .receipt-total');if(!totalPanel)return;
    let summary=document.getElementById('memberSummary');
    if(!summary){summary=document.createElement('section');summary.id='memberSummary';summary.className='member-summary';summary.innerHTML='<h3>함께한 멤버</h3><div class="member-counts"></div>';totalPanel.insertAdjacentElement('afterend',summary)}
    const {rows,countries,counts}=getStats();
    let highlights=document.getElementById('recapHighlights');
    if(!highlights){highlights=document.createElement('div');highlights.id='recapHighlights';highlights.className='recap-highlights';summary.insertAdjacentElement('beforebegin',highlights)}
    highlights.innerHTML=`<div class="recap-stat"><strong>${rows.length}</strong><span>공연 관람</span></div><div class="recap-stat"><strong>${countries}</strong><span>방문 국가</span></div>`;
    summary.querySelector('.member-counts').innerHTML=counts.length?counts.map(([name,count])=>`<span class="member-count"><b>${name}</b><strong>${count}회</strong></span>`).join(''):'<p class="monthly-empty">선택한 공연의 참여 멤버가 표시돼요.</p>';
  }
  function getMonthlyTotals(){
    const months=new Map();readRows().forEach(row=>{const current=months.get(row.month)||{count:0,amount:0};current.count+=1;current.amount+=row.amount;months.set(row.month,current)});
    return[...months.entries()].sort((a,b)=>a[0]-b[0]).map(([month,stats])=>({month,...stats}));
  }
  function renderMonthlySummary(){
    if(!monthlySummary)return;const months=getMonthlyTotals();
    monthlySummary.innerHTML=months.length?months.map(({month,count,amount})=>`<div class="monthly-row"><span class="monthly-name">${monthName(month)}</span><span>${count}회</span><strong>${money(amount)}</strong></div>`).join(''):'<p class="monthly-empty">공연을 선택하면 월별 관람 횟수와 지출이 여기에 표시돼요.</p>';
  }
  function addStyles(){
    if(document.getElementById('recapVisualStyles'))return;const style=document.createElement('style');style.id='recapVisualStyles';
    style.textContent='.recap-highlights{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 16px}.recap-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:78px;padding:10px;border:1px solid #e2ddd3;background:#f7f4ed;text-align:center}.recap-stat strong{font:700 29px/1.1 Georgia,"Noto Serif KR",serif;color:#514b40}.recap-stat span{margin-top:5px;font-size:11px;color:#777064}.receipt-total{padding:9px 4px!important}.receipt-total>strong{font-size:25px!important;font-weight:500!important;color:#777064!important}.receipt-total>span{font-size:11px;color:#888071}.receipt-total>small{font-size:11px;color:#777064}.member-summary{margin:0 0 16px;text-align:left}.member-summary h3{margin:0 0 7px!important;font-size:13px}.member-counts{display:flex;flex-wrap:wrap;gap:6px}.member-count{display:inline-flex;gap:7px;align-items:center;padding:5px 9px;border:1px solid #e2ddd3;background:#f7f4ed;font-size:11px}.member-count strong{color:#514b40}.event-members{margin-top:6px;color:#777064;font-size:11px}';document.head.append(style);
  }
  function wrapText(ctx,text,maxWidth){const lines=[];let line='';for(const char of String(text)){const candidate=line+char;if(line&&ctx.measureText(candidate).width>maxWidth){lines.push(line);line=char}else line=candidate}if(line)lines.push(line);return lines.length?lines:['']}
  function drawReceiptImage(){
    const {rows,countries,counts}=getStats(),monthly=getMonthlyTotals();const total=rows.reduce((sum,row)=>sum+row.amount,0);const nickname=document.getElementById('nickname')?.value?.trim()||'CARAT';
    const canvas=document.createElement('canvas'),width=1080,padding=76,right=width-padding,measure=canvas.getContext('2d');if(!measure)return;
    measure.font='700 48px sans-serif';const titles=wrapText(measure,`${nickname}의 공연 리캡`,width-padding*2);measure.font='23px sans-serif';const items=rows.map(row=>({label:row.label.replace(/^\d{2}[-.]\d{2}\s*[·-]\s*/,''),amount:row.amount}));const layouts=items.map(row=>({...row,lines:wrapText(measure,row.label,width-padding*2-250)}));
    canvas.width=width;canvas.height=Math.max(920,1050+titles.length*58+monthly.length*58+counts.length*38+layouts.reduce((sum,row)=>sum+Math.max(58,row.lines.length*31+22),0));const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.fillStyle='#f1eee7';ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle='#fffefa';ctx.fillRect(48,42,width-96,canvas.height-84);let y=110;
    ctx.textAlign='center';ctx.fillStyle='#514b40';ctx.font='700 21px sans-serif';ctx.fillText('SEVENTEEN  /  2026',width/2,y);y+=78;ctx.fillStyle='#24221e';ctx.font='700 48px sans-serif';titles.forEach(line=>{ctx.fillText(line,width/2,y);y+=58});y+=20;
    const cardW=390,cardH=120,gap=24,left=(width-cardW*2-gap)/2;[left,left+cardW+gap].forEach(x=>{ctx.fillStyle='#f7f4ed';ctx.fillRect(x,y,cardW,cardH);ctx.strokeStyle='#e2ddd3';ctx.strokeRect(x,y,cardW,cardH)});
    ctx.fillStyle='#514b40';ctx.font='700 54px sans-serif';ctx.fillText(String(rows.length),left+cardW/2,y+68);ctx.fillText(String(countries),left+cardW+gap+cardW/2,y+68);ctx.fillStyle='#777064';ctx.font='22px sans-serif';ctx.fillText('공연 관람',left+cardW/2,y+101);ctx.fillText('방문 국가',left+cardW+gap+cardW/2,y+101);y+=cardH+48;
    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 27px sans-serif';ctx.fillText('함께한 멤버 · 만난 횟수',padding,y);y+=32;
    if(counts.length){counts.forEach(([name,count])=>{y+=31;ctx.font='21px sans-serif';ctx.fillText(name,padding+10,y);ctx.textAlign='right';ctx.fillText(`${count}회`,right-10,y);ctx.textAlign='left'})}else{y+=30;ctx.fillStyle='#777064';ctx.font='20px sans-serif';ctx.fillText('선택한 공연이 없습니다.',padding+10,y)}
    y+=38;ctx.textAlign='center';ctx.fillStyle='#888071';ctx.font='21px sans-serif';ctx.fillText(`총 지출 · ${money(total)}`,width/2,y);y+=48;ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 27px sans-serif';ctx.fillText('월별 관람',padding,y);y+=32;
    monthly.forEach(row=>{y+=38;ctx.font='700 22px sans-serif';ctx.fillText(monthName(row.month),padding+10,y);ctx.font='21px sans-serif';ctx.fillText(`${row.count}회`,padding+220,y);ctx.textAlign='right';ctx.fillText(money(row.amount),right-10,y);ctx.textAlign='left';y+=12});
    y+=35;ctx.font='700 27px sans-serif';ctx.fillText('함께한 공연',padding,y);y+=22;layouts.forEach(row=>{y+=34;ctx.font='21px sans-serif';row.lines.forEach((line,index)=>ctx.fillText(line,padding+10,y+index*29));ctx.textAlign='right';ctx.fillStyle='#888071';ctx.font='20px sans-serif';ctx.fillText(money(row.amount),right-10,y);ctx.textAlign='left';ctx.fillStyle='#39362f';y+=Math.max(58,row.lines.length*31+22)});
    canvas.toBlob(blob=>{const link=document.createElement('a');link.download='seventeen-concert-recap-2026.png';link.href=blob?URL.createObjectURL(blob):canvas.toDataURL('image/png');link.click();if(blob)setTimeout(()=>URL.revokeObjectURL(link.href),1500)},'image/png');
  }
  addStyles();
  if(selectedEvents)new MutationObserver(()=>{renderHighlights();renderMonthlySummary()}).observe(selectedEvents,{childList:true,subtree:true,characterData:true});
  const eventList=document.getElementById('events');if(eventList)new MutationObserver(renderHighlights).observe(eventList,{childList:true,subtree:true});
  document.addEventListener('change',event=>{if(event.target.matches('#events [data-select]'))renderHighlights()});
  renderHighlights();renderMonthlySummary();saveButton?.addEventListener('click',drawReceiptImage);
})();
