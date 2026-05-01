(() => {
  const root = window;
  const ns = root.AMCHubAdmin = root.AMCHubAdmin || {};
  
  function getProductImage(value) {
    return ns.utils?.imageUrl?.(value) || value || ns.config?.images?.productFallback || '';
  }

  ns.Reviews = {
    render(section, state = {}) {
      if (!section) return;
      const reviews = state.reviews || [];

      section.className = 'amc-admin-view';
      section.innerHTML = `
        <div class="amc-admin-view__head">
          <div>
            <p class="amc-admin-eyebrow">Customer Reviews</p>
            <h2>Moderate and reply</h2>
          </div>
          <div class="amc-admin-inline-actions">
            <button type="button" class="amc-btn amc-btn--ghost" data-action="refresh-reviews">Refresh</button>
          </div>
        </div>

        <div class="amc-admin-card-grid">
          ${reviews.length ? reviews.map(review => `
            <article class="amc-admin-card glass-panel">
              <div class="amc-admin-card__head">
                <div>
                  <p class="amc-admin-strong">${review.orderID || 'No Order ID'}</p>
                  <p class="amc-admin-muted">${review.productID || 'No Product ID'}</p>
                </div>
                <span class="amc-pill">⭐ ${review.rating || 0}</span>
              </div>
              <div class="amc-admin-card__scroll">
                <div class="amc-admin-review-top">
                  <img src="${getProductImage(review.image)}" alt="${review.productName || review.productID || 'Product'}">
                  <div>
                    <p class="amc-admin-muted">${review.date || 'No date'} | ${review.time || '--:--'}</p>
                    <p>${review.visible ? review.customerName : 'Anonymous'}</p>
                  </div>
                </div>
                <p class="amc-admin-review-body">${review.text || 'No review text.'}</p>
                ${review.reply ? `<div class="amc-admin-reply-box"><strong>${review.replyAdmin || 'Admin'}:</strong> ${review.reply}</div>` : ''}
              </div>
              <div class="amc-admin-card__actions">
                <button type="button" class="amc-btn amc-btn--ghost" data-expand-review="${review.id}">Expand</button>
              </div>
            </article>
          `).join('') : `
            <div class="amc-admin-empty glass-panel">
              <p>No reviews found.</p>
            </div>
          `}
        </div>
      `;

      section.querySelector('[data-action="refresh-reviews"]')?.addEventListener('click', () => ns.actions?.refreshAll());
      section.querySelectorAll('[data-expand-review]').forEach(button => {
        button.addEventListener('click', () => ns.actions?.openReview(button.dataset.expandReview));
      });
    }
  };
})();
