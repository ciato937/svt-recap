(() => {
  const receipt = document.getElementById('receipt');
  const backdrop = document.getElementById('receiptBackdrop');
  const done = document.getElementById('done');
  const close = document.querySelector('.receipt-close');
  let previouslyFocused = null;

  function syncReceipt(open) {
    if (!receipt || !backdrop || !done) return;
    receipt.hidden = !open;
    backdrop.hidden = !open;
    document.body.classList.toggle('receipt-open', open);
    done.textContent = open ? '공연 목록으로' : '영수증 보기';
    if (open) {
      previouslyFocused = document.activeElement;
      requestAnimationFrame(() => close?.focus());
    } else {
      previouslyFocused?.focus?.();
      previouslyFocused = null;
    }
  }

  // app.js toggles the receipt on the button's target handler; observe the final state.
  done?.addEventListener('click', () => requestAnimationFrame(() => syncReceipt(!receipt.hidden)));
  close?.addEventListener('click', () => done?.click());
  backdrop?.addEventListener('click', () => done?.click());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && receipt && !receipt.hidden) {
      event.preventDefault();
      done?.click();
    }
  });
})();
