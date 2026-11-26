(() => {
  const selectedEvents = document.getElementById('selectedEvents');
  const monthlySummary = document.getElementById('monthlySummary');
  const saveButton = document.getElementById('saveReceiptImage');
  const money = value => `₩${Math.round(value).toLocaleString('ko-KR')}`;
  const monthNames = month => `${String(month).padStart(2, '0')}월`;

  function readReceiptRows() {
    return [...(selectedEvents?.querySelectorAll('.selected-line') || [])].map(row => {
      const label = row.querySelector('span')?.textContent?.trim() || '';
      const amountText = row.querySelector('b')?.textContent || '';
      const month = Number(label.match(/^(\d{2})[-.]/)?.[1]);
      const amount = Number(amountText.replace(/[^\d.-]/g, '')) || 0;
      return { label, month, amount };
    }).filter(row => row.month >= 1 && row.month <= 12);
  }

  function getMonthlyTotals() {
    const months = new Map();
    readReceiptRows().forEach(row => {
      const current = months.get(row.month) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += row.amount;
      months.set(row.month, current);
    });
    return [...months.entries()].sort((a, b) => a[0] - b[0]).map(([month, stats]) => ({ month, ...stats }));
  }

  function renderMonthlySummary() {
    if (!monthlySummary) return;
    const months = getMonthlyTotals();
    monthlySummary.innerHTML = months.length
      ? months.map(({ month, count, amount }) => `<div class="monthly-row"><span class="monthly-name">${monthNames(month)}</span><span>${count}회</span><strong>${money(amount)}</strong></div>`).join('')
      : '<p class="monthly-empty">공연을 선택하면 월별 관람 횟수와 지출이 여기에 표시돼요.</p>';
  }

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const char of String(text)) {
      const candidate = line + char;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }

  function drawReceiptImage() {
    const rows = readReceiptRows();
    const monthly = getMonthlyTotals();
    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    const nickname = document.getElementById('nickname')?.value?.trim() || 'CARAT';
    const canvas = document.createElement('canvas');
    const width = 1080;
    const padding = 76;
    const right = width - padding;
    const contentWidth = right - padding;
    const lineRows = monthly.length ? monthly : [];
    const eventRows = rows.map(row => {
      const label = row.label.replace(/^\d{2}[-.]\d{2}\s*[·-]\s*/, '');
      return { label, amount: money(row.amount) };
    });

    // Measure wrapped lines first; canvas grows to fit all selected events.
    let measure = canvas.getContext('2d');
    if (!measure) return;
    measure.font = '700 48px sans-serif';
    const titleLines = wrapText(measure, `${nickname}의 공연 리캡`, contentWidth);
    measure.font = '23px sans-serif';
    const eventLayouts = eventRows.map(row => ({
      ...row,
      lines: wrapText(measure, row.label, contentWidth - 250)
    }));
    const eventBlockHeight = eventLayouts.reduce((sum, row) => sum + Math.max(54, row.lines.length * 31 + 18), 0);
    const monthlyBlockHeight = Math.max(lineRows.length, 1) * 58;
    const headerHeight = 120 + titleLines.length * 58 + 28;
    const totalHeight = headerHeight + 238 + monthlyBlockHeight + 200 + eventBlockHeight + 150;

    canvas.width = width;
    canvas.height = Math.max(920, totalHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f1eee7';
    ctx.fillRect(0, 0, width, canvas.height);
    roundedRect(ctx, 48, 42, width - 96, canvas.height - 84, 5);
    ctx.fillStyle = '#fffefa';
    ctx.fill();

    let y = 110;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#514b40';
    ctx.font = '700 21px sans-serif';
    ctx.fillText('SEVENTEEN  /  2026', width / 2, y);
    y += 78;
    ctx.fillStyle = '#24221e';
    ctx.font = '700 48px sans-serif';
    titleLines.forEach(line => { ctx.fillText(line, width / 2, y); y += 58; });
    ctx.fillStyle = '#6f6a60';
    ctx.font = '23px sans-serif';
    ctx.fillText(`관람 ${rows.length}회  ·  ${monthly.length}개월`, width / 2, y + 2);
    y += 55;

    ctx.strokeStyle = '#c9c2b5';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(right, y); ctx.stroke();
    ctx.setLineDash([]);
    y += 48;

    ctx.fillStyle = '#6f6a60';
    ctx.font = '22px sans-serif';
    ctx.fillText('총 지출  ·  KRW 환산', width / 2, y);
    y += 74;
    ctx.fillStyle = '#24221e';
    ctx.font = '700 62px sans-serif';
    ctx.fillText(money(total), width / 2, y);
    y += 52;
    ctx.fillStyle = '#6f6a60';
    ctx.font = '21px sans-serif';
    ctx.fillText(document.getElementById('visitCount')?.textContent || `관람 ${rows.length}회`, width / 2, y);
    y += 55;

    ctx.strokeStyle = '#c9c2b5';
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(right, y); ctx.stroke();
    ctx.setLineDash([]);
    y += 48;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#24221e';
    ctx.font = '700 27px sans-serif';
    ctx.fillText('월별 관람 · 지출', padding, y);
    y += 34;
    ctx.font = '22px sans-serif';
    if (monthly.length) {
      monthly.forEach(({ month, count, amount }) => {
        y += 44;
        ctx.fillStyle = '#24221e';
        ctx.font = '700 22px sans-serif';
        ctx.fillText(monthNames(month), padding + 10, y);
        ctx.font = '21px sans-serif';
        ctx.fillText(`${count}회`, padding + 220, y);
        ctx.textAlign = 'right';
        ctx.font = '700 22px sans-serif';
        ctx.fillText(money(amount), right - 10, y);
        ctx.textAlign = 'left';
        y += 14;
        ctx.strokeStyle = '#e7e2d9';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(right, y); ctx.stroke();
      });
    } else {
      y += 44;
      ctx.fillStyle = '#6f6a60';
      ctx.fillText('선택한 공연이 없습니다.', padding + 10, y);
    }
    y += 52;

    ctx.fillStyle = '#24221e';
    ctx.font = '700 27px sans-serif';
    ctx.fillText('선택한 공연', padding, y);
    y += 22;
    if (eventLayouts.length) {
      eventLayouts.forEach(row => {
        const blockHeight = Math.max(54, row.lines.length * 31 + 18);
        y += 34;
        ctx.fillStyle = '#39362f';
        ctx.font = '21px sans-serif';
        row.lines.forEach((line, index) => ctx.fillText(line, padding + 10, y + index * 29));
        ctx.textAlign = 'right';
        ctx.fillStyle = '#24221e';
        ctx.font = '700 20px sans-serif';
        ctx.fillText(row.amount, right - 10, y);
        ctx.textAlign = 'left';
        y += blockHeight - 22;
        ctx.strokeStyle = '#e7e2d9';
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(right, y); ctx.stroke();
      });
    } else {
      y += 40;
      ctx.fillStyle = '#6f6a60';
      ctx.font = '21px sans-serif';
      ctx.fillText('선택한 공연이 없습니다.', padding + 10, y);
      y += 24;
    }

    y += 66;
    ctx.strokeStyle = '#c9c2b5';
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(right, y); ctx.stroke();
    ctx.setLineDash([]);
    y += 48;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6f6a60';
    ctx.font = '20px sans-serif';
    ctx.fillText('당신의 2026년 공연 기록', width / 2, y);

    canvas.toBlob(blob => {
      if (!blob) {
        const link = document.createElement('a');
        link.download = 'seventeen-concert-recap-2026.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        return;
      }
      const link = document.createElement('a');
      link.download = 'seventeen-concert-recap-2026.png';
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    }, 'image/png');
  }

  saveButton?.addEventListener('click', drawReceiptImage);
  if (selectedEvents && monthlySummary) {
    new MutationObserver(renderMonthlySummary).observe(selectedEvents, { childList: true, subtree: true, characterData: true });
    renderMonthlySummary();
  }
})();
