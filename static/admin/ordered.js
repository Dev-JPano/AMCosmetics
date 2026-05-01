(() => {
  const root = window;
  const ns = root.AMCHubAdmin = root.AMCHubAdmin || {};

  function money(value) {
    return ns.utils?.money(value) || `₱${Number(value || 0).toFixed(2)}`;
  }

  function statusClass(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'accepted' || normalized === 'approved') return 'amc-pill--approved';
    if (normalized === 'rejected') return 'amc-pill--rejected';
    return 'amc-pill--pending';
  }

  ns.Ordered = {
    render(section, state = {}) {
      if (!section) return;
      const items = state.orderedOrders || [];
      const filter = state.orderedFilter || 'all';
      const filtered = items.filter(item => filter === 'all' ? true : (item.paymentStatus || '').toLowerCase() === filter);

      section.className = 'amc-admin-view';
      section.innerHTML = `
        <div class="amc-admin-view__head">
          <div>
            <p class="amc-admin-eyebrow">Processed Orders</p>
            <h2>Approved and rejected</h2>
          </div>
          <div class="amc-admin-inline-actions">
            <label class="amc-filter">
              <span>Status</span>
              <select data-filter="ordered-status">
                <option value="all" ${filter === 'all' ? 'selected' : ''}>All</option>
                <option value="accepted" ${filter === 'accepted' ? 'selected' : ''}>Accepted</option>
                <option value="rejected" ${filter === 'rejected' ? 'selected' : ''}>Rejected</option>
              </select>
            </label>
            <button type="button" class="amc-btn amc-btn--ghost" data-action="refresh-ordered">Refresh</button>
          </div>
        </div>

        <div class="amc-admin-card-grid">
          ${filtered.length ? filtered.map(order => `
            <article class="amc-admin-card glass-panel">
              <div class="amc-admin-card__head">
                <div>
                  <p class="amc-admin-strong">${order.id || 'No Order ID'}</p>
                  <p class="amc-admin-muted">Payment: ${order.paymentID || '-'}</p>
                </div>
                <span class="amc-pill ${statusClass(order.paymentStatus)}">${order.paymentStatus || 'Pending'}</span>
              </div>
              <div class="amc-admin-card__scroll">
                <p class="amc-admin-muted">${order.time || '--:--'} | ${order.date || 'No date'}</p>
                <p class="amc-admin-muted">${order.customer?.name || 'No name'} · ${order.customer?.email || 'No email'}</p>
                ${(order.products || []).map(product => `
                  <div class="amc-admin-card__row">
                    <span>${product.name || product.id || 'Product'}</span>
                    <span>${money(product.total)}</span>
                  </div>
                `).join('')}
              </div>
            </article>
          `).join('') : `
            <div class="amc-admin-empty glass-panel">
              <p>No ordered records match this filter.</p>
            </div>
          `}
        </div>
      `;

      section.querySelector('[data-action="refresh-ordered"]')?.addEventListener('click', () => ns.actions?.refreshAll());
      section.querySelector('[data-filter="ordered-status"]')?.addEventListener('change', (event) => {
        ns.store?.setState({ orderedFilter: event.target.value });
      });
    }
  };
})();
