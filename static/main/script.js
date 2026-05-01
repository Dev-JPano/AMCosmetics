(function () {
  'use strict';

  const API = {
    products: '/api/products',
    orders: '/api/orders',
    payments: '/api/payments',
    brands: '/api/brands',
    config: '/api/config',
    admins: '/api/admins',
    adminLogin: '/api/admin/login',
    ip: '/api/ip',
    track(reference) {
      return `/api/orders/${encodeURIComponent(reference)}`;
    },
    productCart(productId) {
      return `/api/products/${encodeURIComponent(productId)}/cart`;
    },
    images: {
      product(name) {
        return `/images/product/${encodeURIComponent(name)}`;
      },
      brand(name) {
        return `/images/brand/${encodeURIComponent(name)}`;
      }
    }
  };

  const SELECTORS = {
    header: '[data-main-header]',
    home: '[data-main-home]',
    products: '[data-main-products]',
    track: '[data-main-track]',
    footer: '[data-main-footer]',
    appStatus: '[data-app-status]'
  };

  const STORE_KEY = 'AMCH_CART_V1';
  const SECTION_KEY = 'AMCH_SECTION_V1';

  const state = {
    api: API,
    config: null,
    brands: [],
    products: [],
    orders: [],
    activeSection: 'home',
    ipAddress: 'Detecting...',
    cart: [],
    trackResult: null,
    admin: { loggedIn: false, name: '' }
  };

  const helpers = {
    qs(selector, root = document) { return root.querySelector(selector); },
    qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); },
    uid(prefix = 'id') { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; },
    currency(value) {
      const numeric = Number(value || 0);
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: (state.config && state.config.app && state.config.app.currency) || 'PHP'
      }).format(Number.isFinite(numeric) ? numeric : 0);
    },
    syncCartCount(productId, delta) {
      const now = Date.now();

      // 1. Immediate UI Update (Optimistic UI)
      // We update the local data immediately so the user sees the change instantly
      const product = helpers.productById(productId);
      if (product) {
        product.cartAddedCount = (Number(product.cartAddedCount) || 0) + Number(delta);
        window.AMCHMainProducts?.render?.();
      }

      // 2. Immediate API Call
      // No more localStorage checks or "withinMinute" gates
      fetch(API.productCart(productId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: Number(delta) })
      })
        .then((res) => res.json())
        .then((payload) => {
          if (!payload?.ok) return;

          // 3. Sync with Server Reality
          // If the server returns a specific count, we update to ensure accuracy
          if (product && payload.cartAddedCount !== undefined) {
            product.cartAddedCount = Number(payload.cartAddedCount);
            window.AMCHMainProducts?.render?.();
          }
        })
        .catch((err) => {
          console.error("Failed to sync cart:", err);
          // Optional: Roll back the UI change if the request fails
        });
    },
    dateTime(now = new Date()) {
      return {
        date: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour12: false })
      };
    },
    clone(value) { return JSON.parse(JSON.stringify(value)); },
    getFeePercent(method) {
      const fees = state.config?.fees || {};
      if (method === 'Cash On Delivery') return Number(fees.codPercent || 0);
      if (method === 'Credit Card') return Number(fees.cardPercent || 0);
      if (method === 'Over the Counter') return Number(fees.counterPercent || 0);
      return Number(fees.ewalletPercent || 0);
    },
    escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    },

    imageUrl(value, fallback = '') {
      const image = String(value || '').trim();
      const fallbackImage = String(fallback || '').trim();

      if (image) {
        if (/^https?:\/\//i.test(image)) return image;
        if (image.startsWith('/images/')) return image;
        if (image.startsWith('/')) return image;
        return API.images.product(image);
      }

      if (fallbackImage) {
        if (/^https?:\/\//i.test(fallbackImage)) return fallbackImage;
        if (fallbackImage.startsWith('/images/')) return fallbackImage;
        if (fallbackImage.startsWith('/')) return fallbackImage;
        return API.images.product(fallbackImage);
      }

      return '';
    },

    getProductImage(name, fallback) {
      return helpers.imageUrl(
        name,
        fallback || state.config?.images?.productFallback || 'product_fallback.png'
      );
    },

    getBrandImage(name, fallback) {
      const image = String(name || '').trim();
      const fallbackImage = fallback || state.config?.images?.brandFallback || 'brand_fallback.png';

      if (image) {
        if (/^https?:\/\//i.test(image)) return image;
        if (image.startsWith('/images/')) return image;
        if (image.startsWith('/')) return image;
        return API.images.brand(image);
      }

      if (/^https?:\/\//i.test(fallbackImage)) return fallbackImage;
      if (String(fallbackImage).startsWith('/images/')) return fallbackImage;
      if (String(fallbackImage).startsWith('/')) return fallbackImage;

      return API.images.brand(fallbackImage);
    },

    getImage(name, fallback = 'product_fallback.png') {
      return helpers.getProductImage(name, fallback);
    },
    saveCart() { localStorage.setItem(STORE_KEY, JSON.stringify(state.cart)); },
    loadCart() {
      try { state.cart = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
      catch (_) { state.cart = []; }
    },
    saveSection() { sessionStorage.setItem(SECTION_KEY, state.activeSection); },
    loadSection() { state.activeSection = sessionStorage.getItem(SECTION_KEY) || 'home'; },
    normalizeProduct(raw) {
      const images = raw.images?.img || raw.images || [];
      const reviewList = raw.reviews?.review ? [].concat(raw.reviews.review) : [].concat(raw.reviews || []);
      return {
        id: raw.id || helpers.uid('PRD'),
        brandID: raw.brandID || '',
        name: raw.name || 'Untitled Product',
        description: raw.description || '',
        stock: Number(raw.stock || 0),
        sold: Number(raw.sold || 0),
        cartAddedCount: Number(raw.cartAddedCount || 0),
        createdAt: raw.createdAt || '',
        updatedAt: raw.updatedAt || '',
        pricing: {
          realPrice: Number(raw.pricing?.realPrice || 0),
          displayPrice: Number(raw.pricing?.displayPrice || raw.pricing?.realPrice || 0)
        },
        images: Array.isArray(images) ? images : [images].filter(Boolean),
        reviews: reviewList.map((review) => ({
          id: review.id || helpers.uid('REV'),
          orderID: review.orderID || '',
          customerName: review.customerName || 'Anonymous',
          visible: String(review.visible).toLowerCase() === 'true',
          rating: Number(review.rating || 0),
          text: review.text || '',
          reply: review.reply || '',
          replyAdmin: review.replyAdmin || '',
          like: Number(review.like || 0),
          dislike: Number(review.dislike || 0),
          date: review.date || '',
          time: review.time || '',
          createdAt: review.createdAt || '',
          status: review.status || 'visible'
        }))
      };
    },
    normalizeBrand(raw) {
      return {
        id: raw.id || helpers.uid('BRD'),
        name: raw.name || '',
        img: raw.img || raw.imageUrl || raw.image_url || ''
      };
    }, normalizeOrder(raw) {
      return {
        id: raw.id || '',
        time: raw.time || '',
        date: raw.date || '',
        paymentID: raw.paymentID || '',
        reference: raw.reference || '',
        customer: {
          ip: raw.customer?.ip || '',
          name: raw.customer?.name || '',
          address: raw.customer?.address || '',
          landmark: raw.customer?.landmark || '',
          number: raw.customer?.number || '',
          email: raw.customer?.email || ''
        },
        products: [].concat(raw.products?.product || raw.products || []).map((item) => ({
          id: item.id || '', quantity: Number(item.quantity || 0), price: Number(item.price || 0), total: Number(item.total || 0), request: item.request || ''
        }))
      };
    },
    normalizePayment(raw) { return { id: raw.id || '', amount: Number(raw.amount || 0), method: raw.method || '', status: raw.status || 'Pending', paid: Number(raw.paid || 0) }; },
    computeRating(product) {
      if (!product.reviews.length) return 0;
      const total = product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
      return total / product.reviews.length;
    },
    productById(id) { return state.products.find((product) => product.id === id) || null; },
    cartEntryById(id) { return state.cart.find((item) => item.id === id) || null; },
    subtotal(selectedOnly = true) {
      return state.cart.reduce((sum, item) => {
        if (selectedOnly && !item.checked) return sum;
        return sum + Number(item.total || 0);
      }, 0);
    },
    totalSaved(selectedOnly = true) {
      return state.cart.reduce((sum, item) => {
        if (selectedOnly && !item.checked) return sum;
        return sum + Number(item.saved || 0);
      }, 0);
    },
    getPaymentStatus(order) {
      const paymentMap = window.AMCHMainPayment?.state?.paymentStatusMap || {};
      return paymentMap[order.paymentID] || 'Pending';
    },
    notify(message, type = 'info') {
      const host = helpers.qs(SELECTORS.appStatus);
      if (!host) return;
      host.textContent = message;
      host.dataset.type = type;
      host.classList.add('is-visible');
      clearTimeout(host._timer);
      host._timer = setTimeout(() => host.classList.remove('is-visible'), 2400);
    }
  };

  async function request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const type = response.headers.get('content-type') || '';
    const data = type.includes('application/json')
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => '');

    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }

    return data;
  }

  async function boot() {
    helpers.loadCart();
    helpers.loadSection();
    await Promise.all([loadConfig(), loadBrands(), loadProducts(), loadOrders(), detectIP()]);
    window.AMCHMainHeader?.init?.({ state, helpers, navigateTo, onAdminLogin, toggleCartCanvas });
    window.AMCHMainHome?.init?.({ state, helpers });
    window.AMCHMainProducts?.init?.({ state, helpers, onAddToCart, onBuyNow, openReviewsModal });
    window.AMCHMainTrack?.init?.({ state, helpers, onTrackReference });
    window.AMCHMainPayment?.init?.({ state, helpers, submitCheckout });
    renderAll();
    window.addEventListener('resize', () => window.AMCHMainHeader?.syncResponsiveState?.());
  }

  async function loadConfig() {
    try { state.config = await request(API.config); }
    catch (_) {
      state.config = {
        app: { title: 'AM Cosmetic Hub', currency: 'PHP', theme: 'light', acceptMode: 'AUTO' },
        fees: { codPercent: 3, ewalletPercent: 2, counterPercent: 2, cardPercent: 0 },
        images: {
          qrcode: '/images/product/qr.png',
          productFallback: '/images/product/product_fallback.png',
          brandFallback: '/images/brand/brand_fallback.png'
        },
        tracking: { prefix: 'AMCH' }
      };
    }
  }

  async function loadBrands() {
    try {
      const payload = await request(API.brands);
      const brands = [].concat(payload?.brands || payload?.brand || payload || []);
      state.brands = brands.map(helpers.normalizeBrand);
    } catch (_) { state.brands = []; }
  }

  async function loadProducts() {
    try {
      const payload = await request(API.products);
      const products = [].concat(payload?.products || payload?.product || payload || []);
      state.products = products.map(helpers.normalizeProduct);
    } catch (_) { state.products = []; }
  }

  async function loadOrders() {
    try {
      const payload = await request(API.orders);
      const orders = [].concat(payload?.orders || payload?.order || payload || []);
      state.orders = orders.map(helpers.normalizeOrder);
    } catch (_) { state.orders = []; }
  }

  async function detectIP() {
    try {
      const payload = await request(API.ip);
      state.ipAddress = payload?.ip || 'Unavailable';
    } catch (_) { state.ipAddress = 'Unavailable'; }
  }

  function renderAll() {
    window.AMCHMainHeader?.render?.();
    window.AMCHMainHome?.render?.();
    window.AMCHMainProducts?.render?.();
    window.AMCHMainTrack?.render?.();
    window.AMCHMainPayment?.renderCartCanvas?.();
    updateSectionVisibility();
  }

  function updateSectionVisibility() {
    helpers.qsa('[data-section-name]').forEach((section) => {
      const active = section.dataset.sectionName === state.activeSection;
      section.classList.toggle('is-active-section', active);
      section.hidden = !active;
    });
    window.AMCHMainHeader?.updateActiveNav?.();
  }

  function navigateTo(sectionName) {
    state.activeSection = sectionName;
    helpers.saveSection();
    updateSectionVisibility();
  }

  function onAddToCart(productId) {
    const product = helpers.productById(productId);
    if (!product) return;
    let entry = helpers.cartEntryById(productId);
    if (!entry) {
      entry = {
        id: product.id,
        name: product.name,
        image: product.images[0] || '',
        quantity: 1,
        stock: product.stock,
        realPrice: product.pricing.realPrice,
        displayPrice: product.pricing.displayPrice,
        saved: Math.max(0, product.pricing.realPrice - product.pricing.displayPrice),
        total: product.pricing.displayPrice,
        checked: true
      };
      state.cart.push(entry);
    } else if (entry.quantity < product.stock) {
      entry.quantity += 1;
      entry.total = entry.quantity * entry.displayPrice;
      entry.saved = entry.quantity * Math.max(0, entry.realPrice - entry.displayPrice);
    }
    helpers.saveCart();
    helpers.syncCartCount(productId, 1);
    window.AMCHMainHeader?.render?.();
    window.AMCHMainPayment?.renderCartCanvas?.();
    helpers.notify(`${product.name} added to cart.`, 'success');
  }


  function onBuyNow(productId) {
    onAddToCart(productId);
    window.AMCHMainPayment?.toggleCartCanvas?.(true);
  }

  function openReviewsModal() { return true; }

  async function onTrackReference(reference) {
    const clean = String(reference || '').trim();
    if (!clean) {
      helpers.notify('Please enter your reference number.', 'error');
      return;
    }
    try {
      const payload = await request(API.track(clean));
      state.trackResult = payload?.order || null;
      try {
        const paymentPayload = await request(API.payments);
        const paymentsList = [].concat(paymentPayload?.payments || paymentPayload || []).map(helpers.normalizePayment);
        const paymentMap = {};
        paymentsList.forEach((item) => { paymentMap[item.id] = item.status; });
        if (window.AMCHMainPayment?.state) window.AMCHMainPayment.state.paymentStatusMap = paymentMap;
      } catch (_) { }
      window.AMCHMainTrack?.render?.();
    } catch (_) {
      state.trackResult = null;
      window.AMCHMainTrack?.render?.();
      helpers.notify('Reference number not found.', 'error');
    }
  }

  async function onAdminLogin(credentials) {
    try {
      const payload = await request(API.adminLogin, { method: 'POST', body: credentials });
      if (payload?.ok) {
        state.admin.loggedIn = true;
        state.admin.name = payload.admin?.name || 'Administrator';
        helpers.notify('Admin login successful.', 'success');
        window.location.href = '/admin';
        return;
      }
    } catch (_) { }
    helpers.notify('Invalid admin login.', 'error');
  }

  function toggleCartCanvas(forceValue) { window.AMCHMainPayment?.toggleCartCanvas?.(forceValue); }

  async function submitCheckout(payload) {
    try {
      const paymentResult = await request(API.payments, { method: 'POST', body: payload.payment });
      const orderPayload = {
        id: payload.id,
        time: payload.time,
        date: payload.date,
        paymentID: paymentResult?.id || payload.paymentID,
        reference: payload.reference,
        customer: payload.customer,
        products: payload.products
      };
      const orderResult = await request(API.orders, { method: 'POST', body: orderPayload });
      const purchasedIds = new Set(payload.products.map((item) => item.id));
      state.cart = state.cart.filter((item) => !item.checked || !purchasedIds.has(item.id));
      helpers.saveCart();
      await loadOrders();
      window.AMCHMainHeader?.render?.();
      window.AMCHMainPayment?.renderCartCanvas?.();
      helpers.notify(`Order placed successfully. Ref: ${orderResult?.reference || payload.reference}`, 'success');
      return orderResult;
    } catch (error) {
      helpers.notify(error.message || 'Checkout failed.', 'error');
      return null;
    }
  }

  window.AMCHMain = { state, helpers, request, navigateTo, renderAll };
  document.addEventListener('DOMContentLoaded', boot);
})();
