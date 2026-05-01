(function () {
  'use strict';

  const moduleState = {
    state: null,
    helpers: null,
    onAddToCart: null,
    onBuyNow: null,
    openReviewsModal: null,
    reviewsProduct: null
  };

  function init(deps) {
    Object.assign(moduleState, deps);
    bindEvents();
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const add = event.target.closest('[data-add-to-cart]');
      if (add) moduleState.onAddToCart(add.dataset.addToCart);

      const buy = event.target.closest('[data-buy-now]');
      if (buy) moduleState.onBuyNow(buy.dataset.buyNow);

      const reviews = event.target.closest('[data-open-reviews]');
      if (reviews) openReviewsModal(moduleState.helpers.productById(reviews.dataset.openReviews));

      const close = event.target.closest('[data-reviews-close]');
      if (close) closeReviewsModal();
    });
  }

  function render() {
    const host = moduleState.helpers.qs('[data-main-products]');
    if (!host) return;

    host.innerHTML = `
      <div class="am-products-head glass-panel">
        <div>
          <p class="am-kicker">Product Collection</p>
          <h2>Choose your favorites and build your cart instantly.</h2>
        </div>
        <div class="am-products-counter">${moduleState.state.products.length} items</div>
      </div>

      <div class="am-products-grid">
        ${moduleState.state.products.map(renderProductCard).join('') || '<div class="am-empty-box">No products available.</div>'}
      </div>
    `;
  }

  function renderProductCard(product) {
    const rating = moduleState.helpers.computeRating(product);
    const discounted = product.pricing.displayPrice !== product.pricing.realPrice;

    return `
      <article class="glass-panel am-product-card">
        <div class="am-product-image-wrap">
          <img
            src="${moduleState.helpers.getImage(product.images[0])}"
            alt="${moduleState.helpers.escapeHtml(product.name)}"
            class="am-product-image"
          />
          <span class="am-floating-count">${Number(product.cartAddedCount || 0)}</span>
        </div>

        <div class="am-product-title-row">
          <h3>${moduleState.helpers.escapeHtml(product.name)}</h3>
          <span>Stock: ${Number(product.stock || 0)}</span>
        </div>

        <p class="am-product-copy">${moduleState.helpers.escapeHtml(product.description)}</p>

        <div class="am-product-price-row">
          <div class="am-price-stack">
            ${discounted ? `<span class="am-old-price">${moduleState.helpers.currency(product.pricing.realPrice)}</span>` : ''}
            <b>${moduleState.helpers.currency(product.pricing.displayPrice)}</b>
          </div>
          <div class="am-rating-chip">${rating ? rating.toFixed(1) : '0.0'} ★</div>
        </div>

        <div class="am-product-actions">
          <button class="am-button am-button-muted" data-open-reviews="${moduleState.helpers.escapeHtml(product.id)}">Reviews</button>
          <button class="am-button am-button-primary" data-buy-now="${moduleState.helpers.escapeHtml(product.id)}">Buy Now</button>
          <button class="am-button am-button-soft" data-add-to-cart="${moduleState.helpers.escapeHtml(product.id)}">Add to Cart</button>
        </div>
      </article>
    `;
  }

  function openReviewsModal(product) {
    moduleState.reviewsProduct = product;

    let host = document.querySelector('[data-reviews-modal-host]');

    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-reviews-modal-host', '');
      document.body.appendChild(host);
    }

    host.innerHTML = `
      <div class="am-modal-wrap is-open" data-reviews-modal>
        <div class="am-modal-panel am-reviews-panel">
          <div class="am-modal-head">
            <div>
              <h3>${moduleState.helpers.escapeHtml(product?.name || 'Reviews')}</h3>
              <p>Read customer feedback and administrator replies.</p>
            </div>
            <button class="am-close-icon" data-reviews-close>&times;</button>
          </div>

          <div class="am-reviews-list">
            ${product?.reviews?.length ? product.reviews.map(renderReviewCard).join('') : '<div class="am-empty-box">No reviews yet.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  function renderReviewCard(review) {
    return `
      <article class="am-review-card">
        <div class="am-review-meta">
          <b>${review.visible ? moduleState.helpers.escapeHtml(review.customerName || 'Anonymous') : 'Anonymous'}</b>
          <span>
            ${moduleState.helpers.escapeHtml(review.orderID || '-')}
            |
            ${moduleState.helpers.escapeHtml(review.time || '--:--')}
            |
            ${moduleState.helpers.escapeHtml(review.date || 'No date')}
          </span>
        </div>

        <p class="am-review-text">${moduleState.helpers.escapeHtml(review.text || 'No review text.')}</p>

        <div class="am-review-foot">
          <span>${'★'.repeat(Math.max(1, Number(review.rating || 0)))}</span>
          <span>Like ${Number(review.like || 0)}</span>
          <span>Dislike ${Number(review.dislike || 0)}</span>
        </div>

        ${review.reply ? `
          <div class="am-review-reply">
            Reply by ${moduleState.helpers.escapeHtml(review.replyAdmin || 'Admin')}:
            ${moduleState.helpers.escapeHtml(review.reply)}
          </div>
        ` : ''}
      </article>
    `;
  }

  function closeReviewsModal() {
    const host = document.querySelector('[data-reviews-modal-host]');
    if (host) host.innerHTML = '';
  }

  window.AMCHMainProducts = {
    init,
    render,
    openReviewsModal
  };
})();

// 213
