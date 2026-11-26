(() => {
  const selectedEvents = document.getElementById('selectedEvents');
  const monthlySummary = document.getElementById('monthlySummary');
  const saveButton = document.getElementById('saveReceiptImage');
  const money = value => `₩${Math.round(value).toLocaleString('ko-KR')}`;

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
      ? months.map(({ month, count, amount }) => `<div class="monthly-row"><span class="monthly-name">${String(month).padStart(2, '0')}월</span><span>${count}회</span><strong>${money(amount)}</strong></div>`).join('')
      : '<p class="monthly-empty">공연을 선택하면 월별 관람 횟수와 지출이 여기에 표시돼요.</p>';
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
    canvas.width = 1200;
    canvas.height = 1500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f5f1e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#b99a5c';
    ctx.fillRect(0, 0, canvas.width, 16);
    roundedRect(ctx, 64, 64, 1072, 1372, 34);
    ctx.fillStyle = '#fffefa';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#88764e';
    ctx.font = '700 24px sans-serif';
    ctx.fillText('CARAT MEMORY · 2026', 600, 132);
    ctx.fillStyle = '#a78a4c';
    ctx.font = '48px sans-serif';
    ctx.fillText('✦', 600, 205);
    ctx.fillStyle = '#302b20';
    ctx.font = '700 52px sans-serif';
    ctx.fillText(`${nickname}의 공연 리캡`, 600, 278);
    ctx.fillStyle = '#777064';
    ctx.font = '26px sans-serif';
    ctx.fillText(`관람 ${rows.length}회 · ${monthly.length}개월`, 600, 330);

    roundedRect(ctx, 112, 374, 976, 190, 24);
    ctx.fillStyle = '#f8f6f0';
    ctx.fill();
    ctx.fillStyle = '#777064';
    ctx.font = '26px sans-serif';
    ctx.fillText('총 지출 · KRW 환산', 600, 425);
    ctx.fillStyle = '#302b20';
    ctx.font = '700 68px sans-serif';
    ctx.fillText(money(total), 600, 510);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#302b20';
    ctx.font = '700 30px sans-serif';
    ctx.fillText('월별 관람 · 지출', 128, 632);
    let y = 684;
    ctx.font = '26px sans-serif';
    monthly.forEach(({ month, count, amount }) => {
      ctx.fillStyle = '#f8f6f0';
      roundedRect(ctx, 112, y - 34, 976, 62, 14);
      ctx.fill();
      ctx.fillStyle = '#514b3d';
      ctx.font = '700 25px sans-serif';
      ctx.fillText(`${String(month).padStart(2, '0')}월`, 140, y + 7);
      ctx.font = '24px sans-serif';
      ctx.fillText(`${count}회`, 400, y + 7);
      ctx.textAlign = 'right';
      ctx.font = '700 25px sans-serif';
      ctx.fillText(money(amount), 1056, y + 7);
      ctx.textAlign = 'left';
      y += 72;
    });

    if (!monthly.length) {
      ctx.fillStyle = '#777064';
      ctx.font = '24px sans-serif';
      ctx.fillText('선택한 공연이 없습니다.', 128, y + 4);
      y += 54;
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#9a927f';
    ctx.font = '22px sans-serif';
    ctx.fillText('당신의 2026년을 함께한 순간들 ✦', 600, 1370);
    canvas.toBlob(blob => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = 'seventeen-concert-recap-2026.png';
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, 'image/png');
  }

  saveButton?.addEventListener('click', drawReceiptImage);
  if (selectedEvents && monthlySummary) {
    new MutationObserver(renderMonthlySummary).observe(selectedEvents, { childList: true, subtree: true, characterData: true });
    renderMonthlySummary();
  }
})();
