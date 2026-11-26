(() => {
  const selectedEvents = document.getElementById('selectedEvents');
  const monthlySummary = document.getElementById('monthlySummary');
  const eventList = document.getElementById('events');
  const pages = document.getElementById('receiptPages');
  const saveButton = document.getElementById('saveReceiptImage');
  const shareButton = document.getElementById('shareReceiptImages');
  const downloadBox = document.getElementById('receiptImageDownloads');
  const shareStatus = document.getElementById('receiptShareStatus');
  let receiptDownloadUrls = [];

  const money = value => `₩${Math.round(value).toLocaleString('ko-KR')}`;
  const monthName = month => `${String(month).padStart(2, '0')}월`;
  const memberNames = ['에스쿱스', '정한', '조슈아', '준', '호시', '원우', '우지', '디에잇', '민규', '도겸', '승관', '버논', '디노'];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  const formatDistance = value => {
    const match = String(value || '').match(/([\d,.]+)\s*km/i);
    if (!match) return value || '계산 전';
    const distance = Number(match[1].replace(/,/g, ''));
    return Number.isFinite(distance) ? `${distance.toLocaleString('ko-KR', {maximumFractionDigits: 1})}km` : value;
  };

  function groupReceiptEvents() {
    if (!selectedEvents) return;
    const sourceRows = [...selectedEvents.querySelectorAll('.selected-line:not(.grouped-line)')];
    if (!sourceRows.length) return;
    const groups = new Map();
    sourceRows.forEach(row => {
      const label = row.querySelector('span')?.textContent?.trim() || '';
      const match = label.match(/^(\d{2})[-.](\d{2})\s*[·-]\s*(.*)$/);
      const title = match?.[3]?.trim() || label;
      const date = match ? `${match[1]}-${match[2]}` : '';
      const amount = Number((row.querySelector('b')?.textContent || '').replace(/[^\d.-]/g, '')) || 0;
      const group = groups.get(title) || {title, visits: [], total: 0, members: new Map()};
      group.visits.push({date, month: Number(date.slice(0, 2)), amount});
      group.total += amount;
      (row.dataset.members || '').split('|').map(name => name.trim()).filter(Boolean).forEach(name => {
        group.members.set(name, (group.members.get(name) || 0) + 1);
      });
      groups.set(title, group);
    });
    selectedEvents.innerHTML = [...groups.values()].map(group => {
      const data = encodeURIComponent(JSON.stringify(group.visits));
      const dates = group.visits.map(visit => `<time class="group-date" datetime="2026-${escapeHtml(visit.date)}">${escapeHtml(visit.date)}</time>`).join('');
      const memberCounts = encodeURIComponent(JSON.stringify([...group.members]));
      return `<article class="selected-line grouped-line" data-visits="${data}" data-member-counts="${memberCounts}"><div class="group-heading"><strong class="group-title">${escapeHtml(group.title)}</strong><span class="group-count">${group.visits.length}회 관람</span></div><div class="group-dates">${dates}</div><div class="group-total"><small>공연 지출 합계</small><strong>${money(group.total)}</strong></div></article>`;
    }).join('');
  }

  function readRows() {
    const grouped = [...(selectedEvents?.querySelectorAll('.grouped-line') || [])];
    if (grouped.length) return grouped.flatMap(row => {
      let visits = [];
      try {
        visits = JSON.parse(decodeURIComponent(row.dataset.visits || ''));
      } catch (error) {
        console.error('영수증 공연 날짜를 읽지 못했습니다.', error);
      }
      const title = row.querySelector('.group-title')?.textContent?.trim() || '';
      return visits.map(visit => ({title, date: visit.date, month: Number(visit.month), amount: Number(visit.amount) || 0}));
    }).filter(row => row.month >= 1 && row.month <= 12);
    return [...(selectedEvents?.querySelectorAll('.selected-line') || [])].map(row => {
      const label = row.querySelector('span')?.textContent?.trim() || '';
      const match = label.match(/^(\d{2})[-.](\d{2})\s*[·-]\s*(.*)$/);
      return {
        title: match?.[3]?.trim() || label,
        date: match ? `${match[1]}-${match[2]}` : '',
        month: Number(match?.[1]),
        amount: Number((row.querySelector('b')?.textContent || '').replace(/[^\d.-]/g, '')) || 0
      };
    }).filter(row => row.month >= 1 && row.month <= 12);
  }

  function readMemberCounts() {
    const counts = new Map(memberNames.map(name => [name, 0]));
    selectedEvents?.querySelectorAll('.grouped-line').forEach(group => {
      let members = [];
      try {
        members = JSON.parse(decodeURIComponent(group.dataset.memberCounts || ''));
      } catch (error) {
        console.error('영수증 멤버 기록을 읽지 못했습니다.', error);
      }
      members.forEach(([name, count]) => {
        if (counts.has(name)) counts.set(name, counts.get(name) + Number(count || 0));
      });
    });
    return [...counts];
  }

  function getCountryCount() {
    const match = (document.getElementById('visitCount')?.textContent || '').match(/국가\s*(\d+)개/);
    return Number(match?.[1]) || 0;
  }

  function getMonthlyTotals() {
    const months = new Map();
    readRows().forEach(row => {
      const current = months.get(row.month) || {count: 0, spend: 0};
      current.count += 1;
      current.spend += row.amount;
      months.set(row.month, current);
    });
    return [...months.entries()].sort((a, b) => a[0] - b[0]).map(([month, stats]) => ({month, ...stats}));
  }

  function getArchive() {
    const grouped = new Map();
    readRows().forEach(row => {
      const group = grouped.get(row.title) || {title: row.title, dates: [], count: 0, total: 0};
      if (row.date) group.dates.push(row.date);
      group.count += 1;
      group.total += row.amount;
      grouped.set(row.title, group);
    });
    return [...grouped.values()];
  }

  function getTravelData() {
    const summary = document.getElementById('travelSummary');
    const distance = formatDistance(summary?.querySelector('.travel-distance-value')?.textContent?.trim());
    const items = [...(summary?.querySelectorAll('.travel-detail-item') || [])]
      .filter(item => !item.classList.contains('wide'))
      .map(item => ({
        label: item.querySelector('span')?.textContent?.trim() || '',
        value: item.querySelector('strong')?.textContent?.trim() || ''
      }));
    const farthest = [...(summary?.querySelectorAll('.travel-detail-item.wide') || [])]
      .find(item => item.querySelector('span')?.textContent?.includes('가장 먼'));
    const closest = [...(summary?.querySelectorAll('.travel-detail-item.wide') || [])]
      .find(item => item.querySelector('span')?.textContent?.includes('가장 가까운'));
    return {
      distance,
      items: [...items, ...[farthest, closest].filter(Boolean).map(item => ({
        label: item.querySelector('span')?.textContent?.trim() || '',
        value: item.querySelector('strong')?.textContent?.trim() || ''
      }))]
    };
  }

  function renderHighlights() {
    const totalPanel = document.querySelector('#receipt .receipt-total');
    if (!totalPanel) return;
    let summary = document.getElementById('memberSummary');
    if (!summary) {
      summary = document.createElement('section');
      summary.id = 'memberSummary';
      summary.className = 'member-summary';
      summary.innerHTML = '<h3>함께한 멤버</h3><div class="member-counts"></div>';
      totalPanel.insertAdjacentElement('afterend', summary);
    }
    let highlights = document.getElementById('recapHighlights');
    if (!highlights) {
      highlights = document.createElement('div');
      highlights.id = 'recapHighlights';
      highlights.className = 'recap-highlights';
      summary.insertAdjacentElement('beforebegin', highlights);
    }
    const rows = readRows();
    highlights.innerHTML = `<div class="recap-stat"><strong>${rows.length}</strong><span>공연 관람</span></div><div class="recap-stat"><strong>${getCountryCount()}</strong><span>방문 국가</span></div>`;
    summary.querySelector('.member-counts').innerHTML = readMemberCounts().map(([name, count]) =>
      `<span class="member-count"><b>${escapeHtml(name)}</b><strong>${count}회</strong></span>`
    ).join('');
  }

  function renderMonthlySummary() {
    if (!monthlySummary) return;
    const months = getMonthlyTotals();
    monthlySummary.innerHTML = months.length
      ? months.map(({month, count, spend}) => `<div class="monthly-row"><span class="monthly-name">${monthName(month)}</span><b class="monthly-count">${count}회</b><strong class="monthly-spend">${money(spend)}</strong></div>`).join('')
      : '<p class="monthly-empty">공연을 선택하면 월별 관람 횟수와 지출이 여기에 표시돼요.</p>';
  }

  function renderPages() {
    if (!pages) return;
    const rows = readRows();
    const members = readMemberCounts();
    const monthly = getMonthlyTotals();
    const archive = getArchive();
    const total = document.getElementById('total')?.textContent?.trim() || '₩0';
    const countryCount = getCountryCount();
    const mostMet = [...members].sort((a, b) => b[1] - a[1])[0];
    const travel = getTravelData();
    const travelMetrics = [
      ...travel.items.filter(item => !item.label.includes('가장 먼') && !item.label.includes('가장 가까운')),
      ...travel.items.filter(item => item.label.includes('가장 먼') || item.label.includes('가장 가까운'))
    ];

    pages.innerHTML = `
      <section class="receipt-page page-summary" aria-label="1페이지 요약 및 이동 거리">
        <header class="editorial-heading"><span class="editorial-year">2026</span><div class="editorial-heading-row"><h3>2026년 공연 리캡</h3><p class="editorial-visit-count"><strong>${rows.length}</strong><span>회</span></p></div></header>
        <div class="summary-stats">
          <div class="summary-stat"><span class="editorial-label">( 총 지출 )</span><strong>${escapeHtml(total)}</strong></div>
          <div class="summary-stat"><span class="editorial-label">( 방문 국가 )</span><strong>${countryCount}<small>개국</small></strong></div>
          <div class="summary-stat"><span class="editorial-label">( 공연 수 )</span><strong>${archive.length}<small>개</small></strong></div>
        </div>
        <section class="travel-editorial"><span class="editorial-label">( 선택 일정 왕복 직선거리 )</span><strong class="travel-editorial-distance">${escapeHtml(travel.distance)}</strong>
          <div class="travel-editorial-grid">${travelMetrics.map(item => `<div class="travel-editorial-item"><span class="editorial-label">( ${escapeHtml(item.label)} )</span><strong>${escapeHtml(item.value)}</strong></div>`).join('') || '<p>출발지를 설정하면 이동 거리 정보를 확인할 수 있습니다.</p>'}</div>
        </section>
        ${pageFooter('1/3')}
      </section>
      <section class="receipt-page page-members" aria-label="2페이지 함께한 멤버 및 월별 관람">
        <header class="editorial-heading editorial-heading-compact"><span class="editorial-word">MEMORY</span><div class="editorial-heading-row"><h3>함께한 멤버 · 월별 기록</h3><span>${rows.length}회 관람</span></div></header>
        <section class="most-met-member"><span class="editorial-label">( 가장 많이 만난 멤버 )</span><strong>${mostMet?.[1] ? `${escapeHtml(mostMet[0])} · ${mostMet[1]}회` : '아직 기록이 없습니다'}</strong></section>
        <section class="member-list"><h4>함께한 멤버</h4><div class="member-grid" style="--member-rows:${Math.ceil(members.length / 2)}">${members.map(([name, count]) => `<div class="member-row"><strong>${escapeHtml(name)}</strong><span>${count}<small>회</small></span></div>`).join('')}</div></section>
        <section class="monthly-list"><h4>월별 관람 · 지출</h4><div>${monthly.map(item => `<div class="monthly-editorial-row"><strong>${monthName(item.month)}</strong><span>${item.count}<small>회</small></span><b>${money(item.spend)}</b></div>`).join('') || '<p class="empty-editorial">선택한 공연이 없습니다.</p>'}</div></section>
        ${pageFooter('2/3')}
      </section>
      <section class="receipt-page page-archive" aria-label="3페이지 함께한 공연 아카이브">
        <header class="editorial-heading editorial-heading-compact"><span class="editorial-word">ARCHIVE</span><div class="editorial-heading-row"><h3>함께한 공연</h3><span>${rows.length}회 관람 · ${archive.length}개 공연</span></div></header>
        <div class="archive-list">${archive.map(group => `<article class="archive-row"><div class="archive-info"><strong>${escapeHtml(group.title)}</strong><p>${group.count}회 관람 <span>·</span> ${group.dates.map(escapeHtml).join(' · ')}</p></div><strong class="archive-total">${money(group.total)}</strong></article>`).join('') || '<p class="empty-editorial">선택한 공연이 없습니다.</p>'}</div>
        <section class="archive-visual"><span class="editorial-label">( 관람한 공연의 기록 )</span><div class="archive-bars" role="img" aria-label="공연별 관람 횟수를 나타내는 티켓 스텁 그래프">${archive.map((group, index) => `<div class="archive-bar-column"><div class="archive-bar" data-visits="${group.count}" aria-label="${escapeHtml(group.title)} ${group.count}회">${Array.from({length: group.count}, () => `<i class="ticket-stub ${index % 2 ? 'stub-blue' : ''}"></i>`).join('')}</div><span>${String(index + 1).padStart(2, '0')}</span></div>`).join('')}</div></section>
        ${pageFooter('3/3')}
      </section>`;
  }

  function pageFooter(label) {
    return `<footer class="editorial-footer">CARAT MEMORY · 2026 · ${label}</footer>`;
  }

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const char of String(text)) {
      const candidate = line + char;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = char;
      } else line = candidate;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function drawLabel(ctx, label, x, y, size = 22) {
    ctx.fillStyle = '#574A4E';
    ctx.font = `500 ${size}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`( ${label} )`, x, y);
  }

  function drawRule(ctx, x, y, width) {
    ctx.strokeStyle = 'rgba(35,31,32,.24)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
  }

  function createPageCanvas(height = 1600) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw Error('이미지 캔버스를 초기화하지 못했습니다.');
    ctx.fillStyle = '#F6D5DA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#231F20';
    ctx.textBaseline = 'alphabetic';
    return {canvas, ctx};
  }

  function drawPageOne(data) {
    const {canvas, ctx} = createPageCanvas();
    const left = 78, width = canvas.width - left * 2;
    ctx.fillStyle = '#40566F';
    ctx.textAlign = 'left';
    ctx.font = '900 270px sans-serif';
    ctx.letterSpacing = '-8px';
    ctx.fillText('2026', left - 12, 300);
    ctx.letterSpacing = '0px';
    drawRule(ctx, left, 350, width);
    ctx.fillStyle = '#231F20';
    ctx.font = '700 32px sans-serif';
    ctx.fillText('2026년 공연 리캡', left, 410);
    ctx.textAlign = 'right';
    ctx.font = '900 110px sans-serif';
    ctx.fillText(String(data.rows.length), left + width - 18, 445);
    ctx.font = '700 30px sans-serif';
    ctx.fillText('회', left + width, 445);

    const statY = 500, statW = width / 3;
    drawRule(ctx, left, statY, width);
    drawRule(ctx, left, statY + 155, width);
    const stats = [
      ['총 지출', data.total],
      ['방문 국가', `${data.countryCount}개국`],
      ['공연 수', `${data.archive.length}개`]
    ];
    stats.forEach(([label, value], index) => {
      const x = left + index * statW + 12;
      drawLabel(ctx, label, x, statY + 42, 18);
      ctx.fillStyle = '#231F20';
      ctx.textAlign = 'left';
      ctx.font = index === 0 ? '800 34px sans-serif' : '800 44px sans-serif';
      ctx.fillText(value, x, statY + 112, statW - 28);
      if (index) {
        ctx.strokeStyle = 'rgba(35,31,32,.24)';
        ctx.beginPath();
        ctx.moveTo(left + index * statW, statY + 18);
        ctx.lineTo(left + index * statW, statY + 138);
        ctx.stroke();
      }
    });

    drawLabel(ctx, '선택 일정 왕복 직선거리', left, 740, 22);
    ctx.fillStyle = '#231F20';
    ctx.textAlign = 'left';
    ctx.font = '900 88px sans-serif';
    ctx.fillText(data.travel.distance, left, 850);
    drawRule(ctx, left, 900, width);
    const metricRows = Math.ceil(data.travelMetrics.length / 2);
    const rowHeight = 112;
    data.travelMetrics.forEach((item, index) => {
      const row = Math.floor(index / 2), column = index % 2;
      const x = left + column * (width / 2) + 12;
      const y = 950 + row * rowHeight;
      if (column) {
        ctx.strokeStyle = 'rgba(35,31,32,.18)';
        ctx.beginPath();
        ctx.moveTo(left + width / 2, y - 28);
        ctx.lineTo(left + width / 2, y + 72);
        ctx.stroke();
      }
      drawLabel(ctx, item.label, x, y, 17);
      ctx.fillStyle = '#231F20';
      ctx.font = '800 26px sans-serif';
      const lines = wrapText(ctx, item.value, width / 2 - 38).slice(0, 2);
      lines.forEach((line, lineIndex) => ctx.fillText(line, x, y + 42 + lineIndex * 32));
      if (row < metricRows - 1) drawRule(ctx, left, y + 82, width);
    });
    drawPageFooter(ctx, canvas, '1/3');
    return canvas;
  }

  function drawPageTwo(data) {
    const {canvas, ctx} = createPageCanvas();
    const left = 78, width = canvas.width - left * 2;
    ctx.fillStyle = '#40566F';
    ctx.textAlign = 'left';
    ctx.font = '900 176px sans-serif';
    ctx.letterSpacing = '-6px';
    ctx.fillText('MEMORY', left - 8, 250);
    ctx.letterSpacing = '0px';
    drawRule(ctx, left, 295, width);
    ctx.fillStyle = '#231F20';
    ctx.font = '700 28px sans-serif';
    ctx.fillText('함께한 멤버 · 월별 기록', left, 355);
    drawLabel(ctx, '가장 많이 만난 멤버', left, 440, 20);
    ctx.font = '800 42px sans-serif';
    ctx.fillText(data.mostMet?.[1] ? `${data.mostMet[0]} · ${data.mostMet[1]}회` : '아직 기록이 없습니다', left, 505);
    drawRule(ctx, left, 535, width);

    ctx.font = '800 28px sans-serif';
    ctx.fillText('함께한 멤버', left, 585);
    const memberTop = 625, memberHeight = 38, memberRows = Math.ceil(data.members.length / 2);
    data.members.forEach(([name, count], index) => {
      const column = Math.floor(index / memberRows), row = index % memberRows;
      const cellLeft = left + column * (width / 2), cellWidth = width / 2;
      const y = memberTop + row * memberHeight;
      ctx.fillStyle = '#231F20';
      ctx.font = '700 21px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name, cellLeft, y + 24);
      ctx.textAlign = 'right';
      ctx.font = '700 20px sans-serif';
      ctx.fillText(`${count}회`, cellLeft + cellWidth - 14, y + 24);
      drawRule(ctx, cellLeft, y + memberHeight - 2, cellWidth - 14);
    });

    const monthsTop = memberTop + memberRows * memberHeight + 70;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#231F20';
    ctx.font = '800 28px sans-serif';
    ctx.fillText('월별 관람 · 지출', left, monthsTop);
    drawRule(ctx, left, monthsTop + 18, width);
    const monthTop = monthsTop + 52, columns = 2, cellW = width / columns, monthHeight = 60;
    data.monthly.forEach((item, index) => {
      const row = Math.floor(index / columns), column = index % columns;
      const x = left + column * cellW + 8, y = monthTop + row * monthHeight;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#231F20';
      ctx.font = '800 22px sans-serif';
      ctx.fillText(monthName(item.month), x, y + 25);
      ctx.textAlign = 'right';
      ctx.font = '600 19px sans-serif';
      ctx.fillText(`${item.count}회`, x + cellW - 22, y + 25);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#574A4E';
      ctx.font = '600 19px sans-serif';
      ctx.fillText(money(item.spend), x, y + 50);
      if (column) {
        ctx.strokeStyle = 'rgba(35,31,32,.18)';
        ctx.beginPath();
        ctx.moveTo(left + cellW, y + 4);
        ctx.lineTo(left + cellW, y + 53);
        ctx.stroke();
      }
      if (column === 1 || index === data.monthly.length - 1) drawRule(ctx, left, y + monthHeight - 3, width);
    });
    drawPageFooter(ctx, canvas, '2/3');
    return canvas;
  }

  function drawPageThree(data) {
    const rowTop = 425, rowHeight = 100;
    const graphTop = Math.max(rowTop + data.archive.length * rowHeight + 28, 1320);
    const {canvas, ctx} = createPageCanvas(Math.max(1600, graphTop + 162 + 90));
    const left = 78, width = canvas.width - left * 2;
    ctx.fillStyle = '#40566F';
    ctx.textAlign = 'left';
    ctx.font = '900 156px sans-serif';
    ctx.letterSpacing = '-6px';
    ctx.fillText('ARCHIVE', left - 8, 245);
    ctx.letterSpacing = '0px';
    drawRule(ctx, left, 290, width);
    ctx.fillStyle = '#231F20';
    ctx.font = '800 36px sans-serif';
    ctx.fillText('함께한 공연', left, 355);
    ctx.textAlign = 'right';
    ctx.font = '600 21px sans-serif';
    ctx.fillStyle = '#574A4E';
    ctx.fillText(`${data.rows.length}회 관람 · ${data.archive.length}개 공연`, left + width, 355);
    drawRule(ctx, left, 390, width);

    data.archive.forEach((group, index) => {
      const y = rowTop + index * rowHeight;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#231F20';
      ctx.font = '800 25px sans-serif';
      const titleLines = wrapText(ctx, group.title, width - 310).slice(0, 2);
      titleLines.forEach((line, lineIndex) => ctx.fillText(line, left, y + 28 + lineIndex * 30));
      ctx.fillStyle = '#574A4E';
      ctx.font = '500 16px sans-serif';
      const details = `${group.count}회 관람 · ${group.dates.join(' · ')}`;
      wrapText(ctx, details, width - 310).slice(0, 2).forEach((line, lineIndex) => ctx.fillText(line, left, y + 68 + lineIndex * 21));
      ctx.textAlign = 'right';
      ctx.fillStyle = '#231F20';
      ctx.font = '800 23px sans-serif';
      ctx.fillText(money(group.total), left + width, y + 38);
      drawRule(ctx, left, y + rowHeight - 3, width);
    });

    drawLabel(ctx, '관람한 공연의 기록', left, graphTop, 18);
    const graphBottom = graphTop + 162;
    const gap = 16, columnWidth = data.archive.length ? (width - gap * (data.archive.length - 1)) / data.archive.length : width;
    const maxVisits = Math.max(1, ...data.archive.map(group => group.count));
    data.archive.forEach((group, index) => {
      const x = left + index * (columnWidth + gap);
      const stubHeight = Math.max(12, 112 / maxVisits);
      for (let visit = 0; visit < group.count; visit++) {
        const y = graphBottom - 26 - (visit + 1) * stubHeight;
        ctx.fillStyle = visit % 2 ? '#526B88' : '#E8BFC7';
        ctx.fillRect(x, y, columnWidth, Math.max(2, stubHeight - 2));
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#574A4E';
      ctx.font = '600 15px sans-serif';
      ctx.fillText(String(index + 1).padStart(2, '0'), x + columnWidth / 2, graphBottom);
    });
    drawPageFooter(ctx, canvas, '3/3');
    return canvas;
  }

  function drawPageFooter(ctx, canvas, label) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#574A4E';
    ctx.font = '500 16px sans-serif';
    ctx.fillText(`CARAT MEMORY · 2026 · ${label}`, canvas.width / 2, canvas.height - 42);
  }

  function buildCanvases() {
    const rows = readRows();
    const members = readMemberCounts();
    const monthly = getMonthlyTotals();
    const archive = getArchive();
    const travel = getTravelData();
    const mostMet = [...members].sort((a, b) => b[1] - a[1])[0];
    const data = {
      rows,
      members,
      monthly,
      archive,
      mostMet,
      total: document.getElementById('total')?.textContent?.trim() || '₩0',
      countryCount: getCountryCount(),
      travel,
      travelMetrics: [
        ...travel.items.filter(item => !item.label.includes('가장 먼') && !item.label.includes('가장 가까운')),
        ...travel.items.filter(item => item.label.includes('가장 먼') || item.label.includes('가장 가까운'))
      ]
    };
    return [drawPageOne(data), drawPageTwo(data), drawPageThree(data)];
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('PNG 이미지를 만들지 못했습니다.')), 'image/png');
    });
  }

  function clearDownloadUrls() {
    receiptDownloadUrls.forEach(url => URL.revokeObjectURL(url));
    receiptDownloadUrls = [];
  }

  async function createImageBlobs() {
    return Promise.all(buildCanvases().map(canvasToBlob));
  }

  async function downloadImages() {
    if (!downloadBox) return;
    clearDownloadUrls();
    downloadBox.hidden = false;
    downloadBox.innerHTML = '<p>3장의 PNG 이미지를 준비하고 있습니다…</p>';
    if (shareStatus) shareStatus.textContent = '';
    try {
      const blobs = await createImageBlobs();
      downloadBox.innerHTML = '<p>각 페이지를 눌러 PNG 파일로 저장할 수 있어요.</p>';
      blobs.forEach((blob, index) => {
        const url = URL.createObjectURL(blob);
        receiptDownloadUrls.push(url);
        const link = document.createElement('a');
        link.href = url;
        link.download = `carat-memory-2026-${index + 1}.png`;
        link.textContent = `${index + 1}페이지 저장`;
        downloadBox.append(link);
      });
    } catch (error) {
      downloadBox.innerHTML = '<p>이미지를 만들지 못했습니다. 다시 시도해 주세요.</p>';
      console.error('영수증 이미지 생성 실패:', error);
    }
  }

  async function shareImages() {
    if (!shareStatus) return;
    if (!navigator.share || !navigator.canShare || typeof File === 'undefined') {
      shareStatus.textContent = '이 브라우저는 이미지 공유를 지원하지 않습니다. 이미지 3장 저장을 이용해 주세요.';
      return;
    }
    shareStatus.textContent = '이미지 3장을 준비하고 있습니다…';
    try {
      const blobs = await createImageBlobs();
      const files = blobs.map((blob, index) => new File([blob], `carat-memory-2026-${index + 1}.png`, {type: 'image/png'}));
      if (!navigator.canShare({files})) {
        shareStatus.textContent = '이 브라우저는 이미지 공유를 지원하지 않습니다. 이미지 3장 저장을 이용해 주세요.';
        return;
      }
      await navigator.share({title: 'CARAT MEMORY · 2026', text: '2026년 공연 리캡', files});
      shareStatus.textContent = '이미지 3장을 공유했습니다.';
    } catch (error) {
      if (error.name === 'AbortError') {
        shareStatus.textContent = '이미지 공유를 취소했습니다.';
        return;
      }
      shareStatus.textContent = '이미지를 공유하지 못했습니다. 다시 시도해 주세요.';
      console.error('영수증 이미지 공유 실패:', error);
    }
  }

  if (selectedEvents) new MutationObserver(() => {
    groupReceiptEvents();
    renderHighlights();
    renderMonthlySummary();
    renderPages();
  }).observe(selectedEvents, {childList: true, subtree: true, characterData: true});
  if (eventList) new MutationObserver(() => {
    renderHighlights();
    renderPages();
  }).observe(eventList, {childList: true, subtree: true});
  document.addEventListener('change', event => {
    if (event.target.matches('#events [data-select]')) {
      renderHighlights();
      renderPages();
    }
  });
  saveButton?.addEventListener('click', downloadImages);
  shareButton?.addEventListener('click', shareImages);
  renderHighlights();
  renderMonthlySummary();
  renderPages();
})();
