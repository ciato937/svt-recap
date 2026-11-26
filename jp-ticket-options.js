// Normalize ticket options before app.js loads the compact event data.
(() => {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (!requestUrl || !requestUrl.includes('data/events.json') || !response.ok) return response;

    const data = await response.clone().json();
    if (!Array.isArray(data.events)) return response;

    const onlineOptionEventIds = new Set();
    let eventIndex = 0;
    data.events.forEach(group => {
      const dates = String(group[0] || '').split(',');
      const eventIds = dates.map(date => `${group[1]}-${date}-${eventIndex++}`);
      const options = String(group[7] || '').split(',').filter(Boolean);
      const filtered = options.filter(option => !option.includes('온라인 라이브'));
      if (filtered.length !== options.length) {
        eventIds.forEach(id => onlineOptionEventIds.add(id));
        group[7] = filtered.join(',');
      }

      if (group[1] === 'JP') {
        // Applies to Japanese unit shows (including JxJ) and Japan fan meetings.
        // CUSTOM/direct entry is intentionally omitted.
        group[7] = '지정석:15000,아레나석:22000';
      }
    });

    // Migrate saved Japanese ticket grade/price pairs to the corrected order/prices,
    // and move any saved online-live ticket selection to the remaining offline ticket.
    try {
      const key = 'svt-modular-state-v2';
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved?.events) {
        saved.events.forEach(ticket => {
          if (ticket.id?.startsWith('JP-') && (ticket.grade === 0 || ticket.grade === 1)) {
            ticket.price = ticket.grade === 0 ? 15000 : 22000;
            ticket.unit = 'JPY';
          }
          if (onlineOptionEventIds.has(ticket.id)) {
            ticket.grade = 0;
            ticket.price = 143000;
            ticket.unit = 'KRW';
          }
        });
        localStorage.setItem(key, JSON.stringify(saved));
      }
    } catch (_) {}

    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  };
})();
