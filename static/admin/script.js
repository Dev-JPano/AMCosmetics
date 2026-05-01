(() => {
  const root = window;
  const ns = root.AMCHubAdmin = root.AMCHubAdmin || {};

  ns.config = {
    mount: {
      header: '[data-admin-header]',
      section: '[data-admin-section]',
      footer: '[data-admin-footer]'
    },
    images: {
      productFallback: '/images/product/product_fallback.png'
    }
  };

  ns.api = {
    endpoints: {
      config: '/api/config',
      admin: '/api/admins',
      orders: '/api/orders',
      payments: '/api/payments',
      products: '/api/products',
      reviews: '/api/reviews',
      imageUpload: '/api/images/upload'
    },

    async getConfig() {
      return ns.api.request(ns.api.endpoints.config);
    },

    async getAdmins() {
      return ns.api.request(ns.api.endpoints.admin);
    },

    async getOrders() {
      return ns.api.request(ns.api.endpoints.orders);
    },

    async getPayments() {
      return ns.api.request(ns.api.endpoints.payments);
    },

    async getProducts() {
      return ns.api.request(ns.api.endpoints.products);
    },

    async getReviews() {
      return ns.api.request(ns.api.endpoints.reviews);
    },

    async createProduct(payload) {
      return ns.api.request(ns.api.endpoints.products, {
        method: 'POST',
        body: payload
      });
    },

    async updateProductEntry(productID, payload) {
      return ns.api.request(`${ns.api.endpoints.products}/${encodeURIComponent(productID)}`, {
        method: 'PATCH',
        body: payload
      });
    },

    async deleteProductEntry(productID) {
      return ns.api.request(`${ns.api.endpoints.products}/${encodeURIComponent(productID)}`, {
        method: 'DELETE'
      });
    },

    async clearProducts() {
      return ns.api.request(ns.api.endpoints.products, {
        method: 'DELETE'
      });
    },

    async validateImageUrl(url, folder = 'product') {
      return ns.api.request(ns.api.endpoints.imageUpload, {
        method: 'POST',
        body: {
          folder,
          url
        }
      });
    },

    async updatePaymentStatus(paymentID, status) {
      return ns.api.request(`${ns.api.endpoints.payments}/${encodeURIComponent(paymentID)}`, {
        method: 'PATCH',
        body: { status }
      });
    },

    async updateProductStock(productID, payload) {
      return ns.api.request(`${ns.api.endpoints.products}/${encodeURIComponent(productID)}`, {
        method: 'PATCH',
        body: payload
      });
    },

    async replyReview(reviewID, payload) {
      return ns.api.request(`${ns.api.endpoints.reviews}/${encodeURIComponent(reviewID)}/reply`, {
        method: 'POST',
        body: payload
      });
    },

    async request(url, options = {}) {
      const settings = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };

      if (options.body) settings.body = JSON.stringify(options.body);

      const response = await fetch(url, settings);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed: ${response.status}`);
      }

      return data;
    }
  };

  ns.utils = {

    escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    },

    money(value) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(Number(value || 0));
    },

    randomToken(length = 16) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    },

    imageUrl(value, fallback = ns.config.images.productFallback) {
      const image = String(value || '').trim();

      if (!image) return fallback;
      if (/^https?:\/\//i.test(image)) return image;
      if (image.startsWith('/images/')) return image;
      if (image.startsWith('/')) return image;

      return `/images/product/${encodeURIComponent(image)}`;
    },

    normalizeProducts(products, productMap) {
      return (products || []).map(item => {
        const ref = productMap.get(item.id) || {};
        const images = ref.images || [];

        return {
          ...item,
          name: ref.name || item.name || item.id,
          image: images[0] || ns.config.images.productFallback
        };
      });
    }
  };

  ns.events = {
    bus: new EventTarget(),

    on(name, handler) {
      ns.events.bus.addEventListener(name, handler);
    },

    emit(name, detail = {}) {
      ns.events.bus.dispatchEvent(new CustomEvent(name, { detail }));
    }
  };

  ns.store = {
    state: {
      activeView: 'products',
      adminName: 'Administrator',
      pendingOrders: [],
      orderedOrders: [],
      reviews: [],
      products: [],
      orderedFilter: 'all'
    },

    setState(patch = {}) {
      ns.store.state = { ...ns.store.state, ...patch };
      ns.render();
    }
  };

  ns.UI = {
    confirm({ title, message, confirmText = 'Confirm', onConfirm }) {
      const escapeHtml = ns.utils.escapeHtml;

      const modal = ns.UI.modalShell(escapeHtml(title), `
    <p class="amc-modal-copy">${escapeHtml(message)}</p>
    <div class="amc-modal-actions">
      <button type="button" class="amc-btn amc-btn--ghost" data-close-modal>Cancel</button>
      <button type="button" class="amc-btn amc-btn--approve" data-confirm-modal>${escapeHtml(confirmText)}</button>
    </div>
  `);

      modal.querySelector('[data-confirm-modal]')?.addEventListener('click', async () => {
        await onConfirm?.();
        ns.UI.closeModal();
      });
    },

    promptReply(review) {
      const escapeHtml = ns.utils.escapeHtml;

      const modal = ns.UI.modalShell('Review Details', `
        <div class="amc-modal-stack">
          <p><strong>Order:</strong> ${escapeHtml(review.orderID || '-')}</p>
          <p><strong>Product:</strong> ${escapeHtml(review.productID || '-')}</p>
          <p><strong>Name:</strong> ${escapeHtml(review.customerName || 'Anonymous')}</p>
          <p><strong>Rating:</strong> ${escapeHtml(review.rating || 0)}</p>
          <p class="amc-modal-copy">${escapeHtml(review.text || 'No review text.')}</p>
          <textarea class="amc-modal-textarea" rows="4" placeholder="Write your reply here...">${escapeHtml(review.reply || '')}</textarea>
          <div class="amc-modal-actions">
            <button type="button" class="amc-btn amc-btn--ghost" data-close-modal>Close</button>
            <button type="button" class="amc-btn amc-btn--approve" data-save-reply>Save</button>
          </div>
        </div>
      `);

      modal.querySelector('[data-save-reply]')?.addEventListener('click', async () => {
        const reply = modal.querySelector('.amc-modal-textarea')?.value?.trim() || '';
        await ns.actions.saveReviewReply(review.id, reply);
        ns.UI.closeModal();
      });
    },

    modalShell(title, content) {
      ns.UI.closeModal();

      const wrapper = document.createElement('div');
      wrapper.className = 'amc-modal-backdrop';
      wrapper.innerHTML = `
        <div class="amc-modal glass-panel">
          <div class="amc-modal-head">
            <h3>${ns.utils.escapeHtml(title)}</h3>
            <button type="button" class="amc-icon-btn" data-close-modal aria-label="Close modal">×</button>
          </div>
          <div class="amc-modal-body">${content}</div>
        </div>
      `;

      document.body.appendChild(wrapper);

      wrapper.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', () => ns.UI.closeModal());
      });

      return wrapper;
    },

    closeModal() {
      document.querySelector('.amc-modal-backdrop')?.remove();
    }
  };

  ns.actions = {
    async refreshAll() {
      await ns.bootstrap();
    },

    async updateOrder(orderID, nextStatus) {
      const order = [...ns.store.state.pendingOrders, ...ns.store.state.orderedOrders]
        .find(item => item.id === orderID);

      if (!order?.paymentID) return;

      await ns.api.updatePaymentStatus(order.paymentID, nextStatus);

      if (String(nextStatus).toLowerCase() === 'accepted') {
        for (const product of order.products || []) {
          await ns.api.updateProductStock(product.id, {
            delta: Number(product.quantity || 0),
            soldDelta: Number(product.quantity || 0)
          });
        }
      }

      await ns.bootstrap();
    },

    async approveAllPending() {
      const pending = ns.store.state.pendingOrders
        .filter(item => (item.paymentStatus || '').toLowerCase() === 'pending');

      for (const order of pending) {
        await ns.actions.updateOrder(order.id, 'Accepted');
      }
    },

    async rejectAllPending() {
      const token = ns.utils.randomToken();

      const modal = ns.UI.modalShell('Reject all pending orders', `
        <div class="amc-modal-stack">
          <p class="amc-modal-copy">Type the generated token to continue.</p>
          <div class="amc-token-box">${token}</div>
          <input class="amc-modal-input" type="text" placeholder="Enter token">
          <div class="amc-modal-actions">
            <button type="button" class="amc-btn amc-btn--ghost" data-close-modal>Cancel</button>
            <button type="button" class="amc-btn amc-btn--danger" data-confirm-bulk-reject>Reject All</button>
          </div>
        </div>
      `);

      modal.querySelector('[data-confirm-bulk-reject]')?.addEventListener('click', async () => {
        const value = modal.querySelector('.amc-modal-input')?.value?.trim();

        if (value !== token) return;

        const pending = ns.store.state.pendingOrders
          .filter(item => (item.paymentStatus || '').toLowerCase() === 'pending');

        for (const order of pending) {
          await ns.actions.updateOrder(order.id, 'Rejected');
        }

        ns.UI.closeModal();
      });
    },

    openReview(reviewID) {
      const review = ns.store.state.reviews.find(item => item.id === reviewID);
      if (review) ns.UI.promptReply(review);
    },

    async saveReviewReply(reviewID, reply) {
      await ns.api.replyReview(reviewID, {
        reply,
        admin: ns.store.state.adminName
      });

      await ns.bootstrap();
    }
  };

  ns.transform = {
    admins(data) {
      return data?.admins || data || [];
    },

    products(data) {
      return data?.products || data || [];
    },

    payments(data) {
      return data?.payments || data || [];
    },

    orders(data) {
      return data?.orders || data || [];
    },

    reviews(data) {
      return data?.reviews || [];
    },

    reviewsFromProducts(products) {
      return products.flatMap(product => (product.reviews || []).map(review => ({
        ...review,
        productID: product.id,
        productName: product.name,
        image: (product.images || [])[0] || ns.config.images.productFallback
      })));
    },

    mergeOrdersWithPayments(orders, payments, productMap) {
      const paymentMap = new Map(payments.map(payment => [payment.id, payment]));

      return orders.map(order => {
        const payment = paymentMap.get(order.paymentID) || {};

        return {
          ...order,
          paymentStatus: payment.status || 'Pending',
          paid: payment.paid || 0,
          method: payment.method || 'Unknown',
          products: ns.utils.normalizeProducts(order.products, productMap)
        };
      });
    }
  };

  ns.render = function render() {
    const headerTarget = document.querySelector(ns.config.mount.header);
    const sectionTarget = document.querySelector(ns.config.mount.section);
    const footerTarget = document.querySelector(ns.config.mount.footer);
    const state = ns.store.state;

    ns.Header?.render(headerTarget, state);

    if (footerTarget) {
      footerTarget.innerHTML = '<p>AM Cosmetic Hub · Admin workspace</p>';
    }

    const viewMap = {
      pending: ns.Pending,
      ordered: ns.Ordered,
      reviews: ns.Reviews,
      products: ns.Products
    };

    viewMap[state.activeView]?.render(sectionTarget, state);
  };

  ns.bootstrap = async function bootstrap() {
    try {
      const [configRaw, adminsRaw, productsRaw, paymentsRaw, ordersRaw, reviewsRaw] = await Promise.all([
        ns.api.getConfig(),
        ns.api.getAdmins(),
        ns.api.getProducts(),
        ns.api.getPayments(),
        ns.api.getOrders(),
        ns.api.getReviews()
      ]);

      const admins = ns.transform.admins(adminsRaw);
      const products = ns.transform.products(productsRaw);
      const payments = ns.transform.payments(paymentsRaw);
      const orders = ns.transform.orders(ordersRaw);
      const reviews = ns.transform.reviews(reviewsRaw);

      if (configRaw?.images?.productFallback) {
        ns.config.images.productFallback = configRaw.images.productFallback;
      }

      const productMap = new Map(products.map(product => [product.id, product]));
      const mergedOrders = ns.transform.mergeOrdersWithPayments(orders, payments, productMap);

      ns.store.state = {
        ...ns.store.state,
        adminName: admins.find(item => String(item.status).toLowerCase() === 'online')?.name || admins[0]?.name || 'Administrator',
        products,
        pendingOrders: mergedOrders.filter(order => String(order.paymentStatus).toLowerCase() === 'pending'),
        orderedOrders: mergedOrders.filter(order => String(order.paymentStatus).toLowerCase() !== 'pending'),
        reviews: reviews.length ? reviews : ns.transform.reviewsFromProducts(products)
      };

      ns.render();
    } catch (error) {
      const sectionTarget = document.querySelector(ns.config.mount.section);

      if (sectionTarget) {
        sectionTarget.className = 'amc-admin-view';
        sectionTarget.innerHTML = `
          <div class="amc-admin-empty glass-panel">
            <p>Failed to load admin data.</p>
            <p class="amc-admin-muted">${error.message}</p>
          </div>
        `;
      }
    }
  };

  ns.events.on('logout', () => {
    root.location.href = '/';
  });

  document.addEventListener('DOMContentLoaded', () => {
    ns.bootstrap();
  });
})();