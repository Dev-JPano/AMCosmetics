(function () {
  'use strict';

  const moduleState = {
    state: null,
    helpers: null,
    reviewIndex: 0,
    reviewTimer: null
  };

  function init(deps) {
    Object.assign(moduleState, deps);
  }

  function render() {
    const host = moduleState.helpers.qs('[data-main-home]');
    if (!host) return;

    const highlights = computeHighlights();
    const rotatingBrands = shuffle(moduleState.helpers.clone(moduleState.state.brands)).slice(0, 12);

    host.innerHTML = `
      <div class="am-home-grid">
        <section class="am-home-hero glass-panel">
          <p class="am-kicker">Harkov Corporation Presents</p>
          <h2>Luxury-inspired beauty shopping with smooth and simple ordering.</h2>
          <p>
            Discover mixed-brand cosmetics, review product feedback, save items in your cart,
            and track your order status using one reference number.
          </p>
          <div class="am-home-tags">
            <span>Mixed Brands</span>
            <span>No Login Needed</span>
            <span>Frontend Driven</span>
          </div>
        </section>

        <section class="am-home-highlight-stack">
          <article class="glass-panel am-highlight-card">
            <div class="am-highlight-head"><span>Most Added to Cart</span><b>#1</b></div>
            ${renderProductHighlight(highlights.mostAdded)}
          </article>
          <article class="glass-panel am-highlight-card">
            <div class="am-highlight-head"><span>Most Ordered</span><b>#2</b></div>
            ${renderProductHighlight(highlights.mostOrdered)}
          </article>
          <article class="glass-panel am-highlight-card">
            <div class="am-highlight-head"><span>Good Review</span><b>#3</b></div>
            ${renderReviewHighlight(highlights.goodReviews)}
          </article>
        </section>
      </div>

      <section class="am-brand-belt glass-panel">
        <div class="am-brand-belt-track">
          ${rotatingBrands.concat(rotatingBrands).map((brand) => `
            <div class="am-brand-belt-item">
              <img
                src="${moduleState.helpers.getBrandImage(brand.img, moduleState.state.config?.images?.brandFallback)}"
                alt="${moduleState.helpers.escapeHtml(brand.name || 'Brand')}"
              />
              <span>${moduleState.helpers.escapeHtml(brand.name || 'Brand')}</span>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    startReviewSlider(highlights.goodReviews);
  }

  function computeHighlights() {
    const sortedByCart = [...moduleState.state.products].sort((a, b) => b.cartAddedCount - a.cartAddedCount);
    const sortedBySold = [...moduleState.state.products].sort((a, b) => b.sold - a.sold);
    const reviewProducts = moduleState.state.products.filter((product) => product.reviews.length).sort((a, b) => moduleState.helpers.computeRating(b) - moduleState.helpers.computeRating(a));

    return {
      mostAdded: sortedByCart[0] || null,
      mostOrdered: sortedBySold[0] || null,
      goodReviews: reviewProducts.slice(0, 6)
    };
  }

  function renderProductHighlight(product) {
    if (!product) return '<div class="am-empty-box">No available product highlight yet.</div>';

    return `
    <div class="am-highlight-product">
      <img
        src="${moduleState.helpers.getImage(product.images[0])}"
        alt="${moduleState.helpers.escapeHtml(product.name)}"
      />
      <div>
        <h3>${moduleState.helpers.escapeHtml(product.name)}</h3>
        <p>${moduleState.helpers.escapeHtml(product.description)}</p>
        <div class="am-highlight-stats">
          <span>Cart Added: ${Number(product.cartAddedCount || 0)}</span>
          <span>Sold: ${Number(product.sold || 0)}</span>
        </div>
      </div>
    </div>
  `;
  }

  function renderReviewHighlight(products) {
    if (!products.length) return '<div class="am-empty-box">No review showcase yet.</div>';

    const current = products[moduleState.reviewIndex % products.length];
    const review = current.reviews[moduleState.reviewIndex % current.reviews.length];

    return `
    <div class="am-review-slide">
      <img
        src="${moduleState.helpers.getImage(current.images[0])}"
        alt="${moduleState.helpers.escapeHtml(current.name)}"
      />
      <div>
        <h3>${moduleState.helpers.escapeHtml(current.name)}</h3>
        <div class="am-rating-line">
          ${'★'.repeat(Math.max(1, Number(review.rating || 0)))}
          <span>${moduleState.helpers.escapeHtml(review.customerName || 'Anonymous')}</span>
        </div>
        <p>${moduleState.helpers.escapeHtml(review.text || 'No review text.')}</p>
      </div>
    </div>
  `;
  }

  function startReviewSlider(products) {
    clearInterval(moduleState.reviewTimer);
    if (!products.length) return;
    moduleState.reviewTimer = setInterval(() => {
      moduleState.reviewIndex += 1;
      const host = moduleState.helpers.qs('.am-highlight-card:last-child');
      if (!host) return;
      host.innerHTML = `
        <div class="am-highlight-head"><span>Good Review</span><b>#3</b></div>
        ${renderReviewHighlight(products)}
      `;
    }, 5000);
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  window.AMCHMainHome = { init, render };
})();
