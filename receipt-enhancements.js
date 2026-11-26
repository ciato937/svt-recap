(() => {
  const selectedEvents=document.getElementById('selectedEvents');
  const monthlySummary=document.getElementById('monthlySummary');
  const saveButton=document.getElementById('saveReceiptImage');
  const money=value=>`₩${Math.round(value).toLocaleString('ko-KR')}`;
  const monthName=month=>`${String(month).padStart(2,'0')}월`;
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  // app.js still renders one row per selected date. Regroup those rows after each render.
  function groupReceiptRows(){
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
      const group=groups.get(title)||{title,visits:[],amount:0};
      group.visits.push({date,month:Number(date.slice(0,2)),amount});
      group.amount+=amount;
      groups.set(title,group);
    });
    selectedEvents.innerHTML=[...groups.values()].map(group=>{
      const encoded=encodeURIComponent(JSON.stringify(group.visits));
      return `<div class="selected-line grouped-line" data-visits="${encoded}"><span><b class="group-title">${escapeHtml(group.title)}</b><small>${group.visits.map(visit=>escapeHtml(visit.date)).filter(Boolean).join(' · ')}</small></span><b class="group-count">${group.visits.length}회</b><strong>${money(group.amount)}</strong></div>`;
    }).join('');
  }

  function readGroups(){
    return [...(selectedEvents?.querySelectorAll('.grouped-line')||[])].map(row=>{
      let visits=[];
      try{visits=JSON.parse(decodeURIComponent(row.dataset.visits||''))}catch(_){visits=[]}
      return {title:row.querySelector('.group-title')?.textContent?.trim()||'',visits,amount:Number((row.querySelector('strong')?.textContent||'').replace(/[^\d.-]/g,''))||0};
    });
  }

  function getMonthlyTotals(){
    const totals=new Map();
    readGroups().forEach(group=>group.visits.forEach(visit=>{
      if(visit.month<1||visit.month>12)return;
      const row=totals.get(visit.month)||{count:0,amount:0};
      row.count+=1;row.amount+=Number(visit.amount)||0;totals.set(visit.month,row);
    }));
    return [...totals.entries()].sort((a,b)=>a[0]-b[0]).map(([month,stats])=>({month,...stats}));
  }

  function renderMonthlySummary(){
    if(!monthlySummary)return;
    const months=getMonthlyTotals();
    monthlySummary.innerHTML=months.length?months.map(({month,count,amount})=>`<div class="monthly-row"><span class="monthly-name">${monthName(month)}</span><span>${count}회</span><strong>${money(amount)}</strong></div>`).join(''):'<p class="monthly-empty">공연을 선택하면 월별 관람 횟수와 지출이 여기에 표시돼요.</p>';
  }

  function addReceiptStyles(){
    if(document.getElementById('groupedReceiptStyles'))return;
    const style=document.createElement('style');style.id='groupedReceiptStyles';
    style.textContent='.grouped-line{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center}.grouped-line>span{display:flex;flex-direction:column;min-width:0}.grouped-line small{color:#888071;font-size:10px}.group-title{font-size:13px}.group-count{padding:2px 7px;border-radius:999px;background:#f0ede4;font-size:11px;white-space:nowrap}.grouped-line strong{white-space:nowrap;text-align:right}';
    document.head.append(style);
  }

  function wrapText(ctx,text,maxWidth){
    const lines=[];let line='';
    for(const char of String(text)){const candidate=line+char;if(line&&ctx.measureText(candidate).width>maxWidth){lines.push(line);line=char}else line=candidate}
    if(line)lines.push(line);return lines.length?lines:[''];
  }

  function drawReceiptImage(){
    const groups=readGroups(),monthly=getMonthlyTotals();
    const total=groups.reduce((sum,group)=>sum+group.amount,0);
    const visits=groups.reduce((sum,group)=>sum+group.visits.length,0);
    const nickname=document.getElementById('nickname')?.value?.trim()||'CARAT';
    const canvas=document.createElement('canvas'),width=1080,padding=76,right=width-padding;
    let measure=canvas.getContext('2d');if(!measure)return;
    measure.font='700 48px sans-serif';const titleLines=wrapText(measure,`${nickname}의 공연 리캡`,width-padding*2);
    measure.font='23px sans-serif';
    const layouts=groups.map(group=>({...group,lines:wrapText(measure,group.title,width-padding*2-260)}));
    const eventHeight=layouts.reduce((sum,row)=>sum+Math.max(58,row.lines.length*31+22),0);
    canvas.width=width;canvas.height=Math.max(920,900+titleLines.length*58+monthly.length*58+eventHeight);
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.fillStyle='#f1eee7';ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle='#fffefa';ctx.fillRect(48,42,width-96,canvas.height-84);
    let y=110;ctx.textAlign='center';ctx.fillStyle='#514b40';ctx.font='700 21px sans-serif';ctx.fillText('SEVENTEEN  /  2026',width/2,y);y+=78;
    ctx.fillStyle='#24221e';ctx.font='700 48px sans-serif';titleLines.forEach(line=>{ctx.fillText(line,width/2,y);y+=58});
    ctx.fillStyle='#6f6a60';ctx.font='23px sans-serif';ctx.fillText(`관람 ${visits}회 · 공연명 ${groups.length}종`,width/2,y);y+=70;
    ctx.fillStyle='#6f6a60';ctx.font='22px sans-serif';ctx.fillText('총 지출 · KRW 환산',width/2,y);y+=70;
    ctx.fillStyle='#24221e';ctx.font='700 62px sans-serif';ctx.fillText(money(total),width/2,y);y+=80;
    ctx.textAlign='left';ctx.fillStyle='#24221e';ctx.font='700 27px sans-serif';ctx.fillText('월별 관람 · 지출',padding,y);y+=34;
    monthly.forEach(row=>{y+=42;ctx.font='700 22px sans-serif';ctx.fillText(monthName(row.month),padding+10,y);ctx.font='21px sans-serif';ctx.fillText(`${row.count}회`,padding+220,y);ctx.textAlign='right';ctx.fillText(money(row.amount),right-10,y);ctx.textAlign='left';y+=18});
    y+=35;ctx.font='700 27px sans-serif';ctx.fillText('함께한 공연',padding,y);y+=22;
    layouts.forEach(row=>{y+=36;ctx.font='21px sans-serif';row.lines.forEach((line,index)=>ctx.fillText(line,padding+10,y+index*29));ctx.textAlign='right';ctx.font='700 20px sans-serif';ctx.fillText(`${row.visits.length}회 · ${money(row.amount)}`,right-10,y);ctx.textAlign='left';y+=Math.max(58,row.lines.length*31+22)});
    y+=35;ctx.textAlign='center';ctx.fillStyle='#6f6a60';ctx.font='20px sans-serif';ctx.fillText('당신의 2026년 공연 기록',width/2,y);
    canvas.toBlob(blob=>{const link=document.createElement('a');link.download='seventeen-concert-recap-2026.png';link.href=blob?URL.createObjectURL(blob):canvas.toDataURL('image/png');link.click();if(blob)setTimeout(()=>URL.revokeObjectURL(link.href),1500)},'image/png');
  }

  addReceiptStyles();
  if(selectedEvents){
    new MutationObserver(()=>{groupReceiptRows();renderMonthlySummary()}).observe(selectedEvents,{childList:true,subtree:true,characterData:true});
    groupReceiptRows();renderMonthlySummary();
  }
  saveButton?.addEventListener('click',drawReceiptImage);
})();
