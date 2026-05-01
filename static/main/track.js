(function () {
  'use strict';

  const moduleState = {
    state: null,
    helpers: null,
    onTrackReference: null
  };

  function init(deps) {
    Object.assign(moduleState, deps);
    bindEvents();
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-track-submit]');
      if (!trigger) return;
      const input = document.querySelector('[data-track-input]');
      moduleState.onTrackReference(input?.value || '');
    });
  }

  function render() {
    const host = moduleState.helpers.qs('[data-main-track]');
    if (!host) return;

    host.innerHTML = `
      <div class="glass-panel am-track-shell">
        <div class="am-track-copy">
          <p class="am-kicker">Track Your Order</p>
          <h2>Enter your reference number to view your order details.</h2>
          <p>The status is based on payment review and administrator action.</p>
        </div>
        <div class="am-track-form">
          <input class="p-5" data-track-input type="text" placeholder="Enter reference number" />
          <button class="am-button am-button-primary" data-track-submit>Track</button>
        </div>
        <div class="am-track-result-area">
          ${renderTrackResult()}
        </div>
      </div>
    `;
  }

  function renderTrackResult() {
    const result = moduleState.state.trackResult;
    if (!result) return '<div class="am-empty-box">No tracking result yet.</div>';

    const paymentStatus = moduleState.helpers.getPaymentStatus(result);
    const statusClass = `is-${String(paymentStatus).toLowerCase()}`;
    const escapeHtml = moduleState.helpers.escapeHtml;

    return `
      <article class="am-track-card ${escapeHtml(statusClass)}">
        <div class="am-track-card-head">
          <div>
            <h3>${escapeHtml(result.reference || '-')}</h3>
            <p>${escapeHtml(result.date || 'No date')} | ${escapeHtml(result.time || '--:--')}</p>
          </div>
          <span class="am-status-pill ${escapeHtml(statusClass)}">${escapeHtml(paymentStatus)}</span>
        </div>

        <div class="am-track-grid">
          <div>
            <h4>Customer</h4>
            <p>${escapeHtml(result.customer?.name || '')}</p>
            <p>${escapeHtml(result.customer?.address || '')}</p>
            <p>${escapeHtml(result.customer?.landmark || '')}</p>
            <p>${escapeHtml(result.customer?.number || '')}</p>
            <p>${escapeHtml(result.customer?.email || '')}</p>
          </div>

          <div>
            <h4>Payment</h4>
            <p>Payment ID: ${escapeHtml(result.paymentID || '-')}</p>
            <p>IP: ${escapeHtml(result.customer?.ip || '-')}</p>
          </div>
        </div>

        <div class="am-track-products">
          ${(result.products || []).map((item) => `
            <div class="am-track-product-row">
              <span>${escapeHtml(item.id || '')}</span>
              <span>Qty: ${Number(item.quantity || 0)}</span>
              <span>${moduleState.helpers.currency(item.price)}</span>
              <span>${moduleState.helpers.currency(item.total)}</span>
              <span>${escapeHtml(item.request || 'No request')}</span>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  }

  window.AMCHMainTrack = { init, render };
})();
