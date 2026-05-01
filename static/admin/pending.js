(() => {
  const root = window;
  const ns = root.AMCHubAdmin = root.AMCHubAdmin || {};

  function money(value) {
    return ns.utils?.money(value) || `₱${Number(value || 0).toFixed(2)}`;
  }

  function getProductImage(value) {
    return ns.utils?.imageUrl?.(value) || value || ns.config?.images?.productFallback || '';
  }

  function buildProducts(order) {
    return (order.products || []).map(product => `
      <div class="amc-admin-card__row">
        <div class="amc-admin-product-mini">
          <img src="${getProductImage(product.image)}" alt="${product.name || product.id}">
          <div>
            <p class="amc-admin-strong">${product.name || product.id || 'Unknown Product'}</p>
            <p class="amc-admin-muted">${product.id || ''}</p>
            <p class="amc-admin-muted">Qty: ${product.quantity || 0}</p>
          </div>
        </div>
        <div class="amc-admin-align-right">
          <p>${money(product.price)}</p>
          <p class="amc-admin-muted">${product.request || 'No request'}</p>
        </div>
      </div>
    `).join('');
  }

  ns.Pending = {
    render(section, state = {}) {
      if (!section) return;
      const orders = (state.pendingOrders || []).filter(order => (order.paymentStatus || '').toLowerCase() === 'pending');

      section.className = 'amc-admin-view';
      section.innerHTML = `
        <div class="amc-admin-view__head">
          <div>
            <p class="amc-admin-eyebrow">Pending Orders</p>
            <h2>Needs admin action</h2>
          </div>
          <div class="amc-admin-inline-actions">
            <button type="button" class="amc-btn amc-btn--ghost" data-action="refresh-pending">Refresh</button>
            <button type="button" class="amc-btn amc-btn--approve-all">Approve All</button>
            <button type="button" class="amc-btn amc-btn--danger" data-action="reject-all">Reject All</button>
          </div>
        </div>

        <div class="amc-admin-card-grid">
          ${orders.length ? orders.map(order => `
            <article class="amc-admin-card glass-panel">
              <div class="amc-admin-card__head">
                <div>
                  <p class="amc-admin-strong">${order.id || 'No Order ID'}</p>
                  <p class="amc-admin-muted">Ref: ${order.reference || '-'}</p>
                </div>
                <span class="amc-pill amc-pill--pending">Pending</span>
              </div>
              <div class="amc-admin-card__scroll">
                <div class="amc-admin-card__meta">
                  <p>${order.time || '--:--'} | ${order.date || 'No date'}</p>
                  <p>${order.customer?.name || 'No name'}</p>
                  <p>${order.customer?.number || 'No number'}</p>
                </div>
                ${buildProducts(order)}
              </div>
              <div class="amc-admin-card__actions">
                <button type="button" class="amc-btn amc-btn--approve" data-approve="${order.id}">Approve</button>
                <button type="button" class="amc-btn amc-btn--danger" data-reject="${order.id}">Reject</button>
              </div>
            </article>
          `).join('') : `
            <div class="amc-admin-empty glass-panel">
              <p>No pending orders found.</p>
            </div>
          `}
        </div>
      `;

      section.querySelector('[data-action="refresh-pending"]')?.addEventListener('click', () => ns.actions?.refreshAll());
      section.querySelector('.amc-btn--approve-all')?.addEventListener('click', () => ns.actions?.approveAllPending());
      section.querySelector('[data-action="reject-all"]')?.addEventListener('click', () => ns.actions?.rejectAllPending());

      section.querySelectorAll('[data-approve]').forEach(button => {
        button.addEventListener('click', () => ns.actions?.updateOrder(button.dataset.approve, 'Accepted'));
      });

      section.querySelectorAll('[data-reject]').forEach(button => {
        button.addEventListener('click', () => ns.actions?.updateOrder(button.dataset.reject, 'Rejected'));
      });
    }
  };
})();
