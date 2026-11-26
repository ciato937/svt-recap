(() => {
  const selectedEvents=document.getElementById('selectedEvents');
  const monthlySummary=document.getElementById('monthlySummary');
  const saveButton=document.getElementById('saveReceiptImage');
  const money=value=>`₩${Math.round(value).toLocaleString('ko-KR')}`;
  const monthName=month=>`${String(month).padStart(2,'0')}월`;

  function readRows(){
    return [...(selectedEvents?.querySelectorAll('.selected-line')||[])].map(row=>{
      const label=row.querySelector('span')?.textContent?.trim()||'';
      const month=Number(label.match(/^(\d{2})[-.]/)?.[1]);
      const amount=Number((row.querySelector('b')?.textContent||'').replace(/[^\d.-]/g,''))||0;
      return{label,month,amount};
    }).filter(row=>row.month>=1&&row.month<=12);
  }

  function getStats(){
    const rows=readRows();
    const countryText=document.getElementById('visitCount')?.textContent||'';
    const countryCount=Number(countryText.match(/국가\s*(\d+)개/)?.[1])||0;
    const total=rows.reduce((sum,row)=>sum+row.amount,0);
    return{rows,countries:countryCount,total};
  }

  function renderHighlights(){
    const receipt=document.getElementById('receipt');
    const totalPanel=receipt?.querySelector('.receipt-total');
    if(!receipt||!totalPanel)return;
    let highlights=document.getElementById('recapHighlights');
    if(!highlights){
      highlights=document.createElement('div');highlights.id='recapHighlights';highlights.className='recap-highlights';
      totalPanel.insertAdjacentElement('afterend',highlights);
    }
    const {rows,countries}=getStats();
    highlights.innerHTML=`<div class="recap-stat"><strong>${rows.length}</strong><span>공연 관람</span></div><div class="recap-stat"><strong>${countries}</strong><span>방문 국가</span></div>`;
  }

  function getMonthlyTotals(){
    const months=new Map();
    readRows().forEach(row=>{
      const current=months.get(row.month)||{count:0,amount:0};
      current.count+=1;current.amount+=row.amount;months.set(row.month,current);
    });
    return[...months.entries()].sort((a,b)=>a[0]-b[0]).map(([month,stats])=>({month,...stats}));
  }

  function renderMonthlySummary(){
    if(!monthlySummary)return;
    const months=getMonthlyTotals();
    monthlySummary.innerHTML=months.length
      ?months.map(({month,count,amount})=>`<div class="monthly-row"><span class="monthly-name">${monthName(month)}</span><span>${count}회</span><strong>${money(amount)}</strong></div>`).join('')
      :'<p class="monthly-empty">공연을 선택하면 월별 관람 횟수와 지출이 여기에 표시돼요.</p>';
  }

  function addStyles(){
    if(document.getElementById('recapVisualStyles'))return;
    const style=document.createElement('style');style.id='recapVisualStyles';
    style.textContent='.recap-highlights{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 16px}.recap-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:78px;padding:10px;border:1px solid #e2ddd3;background:#f7f4ed;text-align:center}.recap-stat strong{font:700 29px/1.1 Georgia,"Noto Serif KR",serif;color:#514b40}.recap-stat span{margin-top:5px;font-size:11px;color:#777064}.receipt-total{padding:9px 4px!important}.receipt-total>strong{font-size:25px!important;font-weight:500!important;color:#777064!important}.receipt-total>span{font-size:11px;color:#888071}.receipt-total>small{font-size:11px;color:#777064}';
    document.head.append(style);
  }

  function wrapText(ctx,text,maxWidth){
    const lines=[];let line='';
    for(const char of String(text)){const candidate=line+char;if(line&&ctx.measureText(candidate).width>maxWidth){lines.push(line);line=char}else line=candidate}
    if(line)lines.push(line);return lines.length?lines:[''];
  }

  function drawReceiptImage(){
    const {rows,countries,total}=getStats();
    const monthly=getMonthlyTotals();
    const nickname=document.getElementById('nickname')?.value?.trim()||'CARAT';
    const canvas=document.createElement('canvas'),width=1080,padding=76,right=width-padding;
    const measure=canvas.getContext('2d');if(!measure)return;
    measure.font='700 48px sans-serif';const titleLines=wrapText(measure,`${nickname}의 공연 리캡`,width-padding*2);
    measure.font='23px sans-serif';
    const eventRows=rows.map(row=>({label:row.label.replace(/^\d{2}[-.]\d{2}\s*[·-]\s*/,''),amount:row.amount}));
    const eventLayouts=eventRows.map(row=>({...row,lines:wrapText(measure,row.label,width-padding*2-250)}));
    const eventHeight=eventLayouts.reduce((sum,row)=>sum+Math.max(58,row.lines.length*31+22),0);
    canvas.width=width;canvas.height=Math.max(920,950+titleLines.length*58+monthly.length*58+eventHeight);
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.fillStyle='#f1eee7';ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle='#fffefa';ctx.fillRect(48,42,width-96,canvas.height-84);
    let y=110;ctx.textAlign='center';ctx.fillStyle='#514b40';ctx.font='700 21px sans-serif';ctx.fillText('SEVENTEEN  /  2026',width/2,y);y+=78;
    ctx.fillStyle='#24221e';ctx.font='700 48px sans-serif';titleLines.forEach(line=>{ctx.fillText(line,width/2,y);y+=58});
    y+=18;
    // Make attendance and travel the hero metrics, with spending as a quieter detail.
    const cardY=y-5,cardWidth=390,cardHeight=120,gap=24,left=(width-(cardWidth*2+gap))/2;
    [left,left+cardWidth+gap].forEach(x=>{ctx.fillStyle='#f7f4ed';ctx.fillRect(x,cardY,cardWidth,cardHeight);ctx.strokeStyle='#e2ddd3';ctx.strokeRect(x,cardY,cardWidth,cardHeight)});
    ctx.fillStyle='#514b40';ctx.font='700 54px sans-serif';ctx.fillText(String(rows.length),left+cardWidth/2,cardY+68);ctx.fillText(String(countries),left+cardWidth+gap+cardWidth/2,cardY+68);
    ctx.fillStyle='#777064';ctx.font='22px sans-serif';ctx.fillText('공연 관람',left+cardWidth/2,cardY+101);ctx.fillText('방문 국가',left+cardWidth+gap+cardWidth/2,cardY+101);
    y=cardY+cardHeight+48;
    ctx.fillStyle='#888071';ctx.font='21px sans-serif';ctx.fillText(`총 지출 · ${money(total)}`,width/2,y);y+=38;
    ctx.strokeStyle='#c9c2b5';ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(padding,y);ctx.lineTo(right,y);ctx.stroke();ctx.setLineDash([]);y+=42;
    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 27px sans-serif';ctx.fillText('월별 관람',padding,y);y+=30;
    monthly.forEach(row=>{y+=39;ctx.font='700 22px sans-serif';ctx.fillText(monthName(row.month),padding+10,y);ctx.font='21px sans-serif';ctx.fillText(`${row.count}회`,padding+220,y);ctx.textAlign='right';ctx.fillText(money(row.amount),right-10,y);ctx.textAlign='left';y+=12;ctx.strokeStyle='#e7e2d9';ctx.beginPath();ctx.moveTo(padding,y);ctx.lineTo(right,y);ctx.stroke()});
    y+=40;ctx.fillStyle='#24221e';ctx.font='700 27px sans-serif';ctx.fillText('함께한 공연',padding,y);y+=22;
    if(eventLayouts.length){eventLayouts.forEach(row=>{y+=34;ctx.fillStyle='#39362f';ctx.font='21px sans-serif';row.lines.forEach((line,index)=>ctx.fillText(line,padding+10,y+index*29));ctx.textAlign='right';ctx.fillStyle='#888071';ctx.font='20px sans-serif';ctx.fillText(money(row.amount),right-10,y);ctx.textAlign='left';y+=Math.max(58,row.lines.length*31+22);ctx.strokeStyle='#e7e2d9';ctx.beginPath();ctx.moveTo(padding,y);ctx.lineTo(right,y);ctx.stroke()})}else{y+=35;ctx.fillStyle='#777064';ctx.font='20px sans-serif';ctx.fillText('선택한 공연이 없습니다.',padding+10,y)}
    y+=45;ctx.textAlign='center';ctx.fillStyle='#6f6a60';ctx.font='20px sans-serif';ctx.fillText('당신의 2026년 공연 기록',width/2,y);
    canvas.toBlob(blob=>{const link=document.createElement('a');link.download='seventeen-concert-recap-2026.png';link.href=blob?URL.createObjectURL(blob):canvas.toDataURL('image/png');link.click();if(blob)setTimeout(()=>URL.revokeObjectURL(link.href),1500)},'image/png');
  }

  addStyles();
  if(selectedEvents){
    new MutationObserver(()=>{renderHighlights();renderMonthlySummary()}).observe(selectedEvents,{childList:true,subtree:true,characterData:true});
    renderHighlights();renderMonthlySummary();
  }
  saveButton?.addEventListener('click',drawReceiptImage);
})();
