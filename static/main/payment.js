(function () {
  'use strict';

  const moduleState = {
    state: null,
    helpers: null,
    submitCheckout: null,
    cartOpen: false,
    checkoutOpen: false,
    checkoutMethod: 'GCash',
    checkoutMapOpen: false,
    paymentStatusMap: {},
    checkoutFormData: {
      customerName: '',
      customerLandmark: '',
      customerAddress: '',
      customerNumber: '',
      customerEmail: '',
      customerRequest: '',
      cardNumber: '',
      cardExp: '',
      cardPw: ''
    },
    successOpen: false,
    successData: null
  };

  function init(deps) {
    Object.assign(moduleState, deps);
    bindEvents();
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const cartTrigger = event.target.closest('[data-cart-canvas-toggle]');
      if (cartTrigger) toggleCartCanvas();

      const rowToggle = event.target.closest('[data-cart-check]');
      if (rowToggle) {
        const entry = moduleState.helpers.cartEntryById(rowToggle.dataset.cartCheck);
        if (!entry) return;
        entry.checked = !entry.checked;
        moduleState.helpers.saveCart();
        renderCartCanvas();
      }

      const increment = event.target.closest('[data-cart-inc]');
      if (increment) updateQuantity(increment.dataset.cartInc, 1);

      const decrement = event.target.closest('[data-cart-dec]');
      if (decrement) updateQuantity(decrement.dataset.cartDec, -1);

      const remove = event.target.closest('[data-cart-remove-selected]');
      if (remove) removeSelected();

      const checkout = event.target.closest('[data-cart-checkout]');
      if (checkout) openCheckoutModal();

      const closeCheckout = event.target.closest('[data-checkout-close]');
      if (closeCheckout) closeCheckoutModal();

      const orderNow = event.target.closest('[data-order-now]');
      if (orderNow) handleCheckoutSubmit();

      const mapToggle = event.target.closest('[data-map-toggle]');
      if (mapToggle) {
        moduleState.checkoutMapOpen = !moduleState.checkoutMapOpen;
        renderCheckoutModal();
      }

      const successClose = event.target.closest('[data-success-close]');
      if (successClose) closeSuccessModal();
    });

    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-cart-qty-input]')) {
        const id = event.target.dataset.cartQtyInput;
        const entry = moduleState.helpers.cartEntryById(id);
        if (!entry) return;
        const next = Number(event.target.value || 0);
        entry.quantity = Number.isFinite(next) ? next : entry.quantity;
        return;
      }

      if (event.target.matches('[name="paymentMethod"]')) {
        moduleState.checkoutMethod = event.target.value;
        renderCheckoutModal();
        return;
      }

      if (event.target.matches('[data-checkout-field]')) {
        moduleState.checkoutFormData[event.target.name] = event.target.value;
      }
    });

    document.addEventListener('blur', (event) => {
      if (!event.target.matches('[data-cart-qty-input]')) return;
      const id = event.target.dataset.cartQtyInput;
      const entry = moduleState.helpers.cartEntryById(id);
      if (!entry) return;
      const product = moduleState.helpers.productById(id);
      const max = product ? product.stock : entry.stock;
      entry.quantity = Math.max(0, Math.min(Number(entry.quantity || 0), Number(max || 0)));
      if (entry.quantity === 0) {
        moduleState.state.cart = moduleState.state.cart.filter((item) => item.id !== id);
      } else {
        recalculateEntry(entry);
      }
      moduleState.helpers.saveCart();
      renderCartCanvas();
      window.AMCHMainHeader.render();
    }, true);
  }

  function toggleCartCanvas(forceValue) {
    moduleState.cartOpen = typeof forceValue === 'boolean' ? forceValue : !moduleState.cartOpen;
    renderCartCanvas();
  }

  function updateQuantity(id, step) {
    const entry = moduleState.helpers.cartEntryById(id);
    const product = moduleState.helpers.productById(id);
    if (!entry || !product) return;

    const before = entry.quantity;
    entry.quantity = Math.max(0, Math.min(entry.quantity + step, product.stock));
    const diff = entry.quantity - before;

    if (entry.quantity === 0) {
      moduleState.state.cart = moduleState.state.cart.filter((item) => item.id !== id);
    } else {
      recalculateEntry(entry);
    }

    if (diff !== 0 && moduleState.helpers.syncCartCount) {
      moduleState.helpers.syncCartCount(id, diff);
    }

    product.cartAddedCount = Math.max(0, Number(product.cartAddedCount || 0) + diff);

    moduleState.helpers.saveCart();
    renderCartCanvas();
    window.AMCHMainHeader.render();
    window.AMCHMainProducts?.render?.();
  }

  function recalculateEntry(entry) {
    entry.total = entry.quantity * entry.displayPrice;
    entry.saved = entry.quantity * Math.max(0, entry.realPrice - entry.displayPrice);
  }

  function removeSelected() {
    moduleState.state.cart = moduleState.state.cart.filter((item) => !item.checked);
    moduleState.helpers.saveCart();
    renderCartCanvas();
    window.AMCHMainHeader.render();
  }

  function resetCheckoutForm() {
    moduleState.checkoutFormData = {
      customerName: '',
      customerLandmark: '',
      customerAddress: '',
      customerNumber: '',
      customerEmail: '',
      customerRequest: '',
      cardNumber: '',
      cardExp: '',
      cardPw: ''
    };
    moduleState.checkoutMethod = 'GCash';
    moduleState.checkoutMapOpen = false;
  }

  function openCheckoutModal() {
    const selectedItems = moduleState.state.cart.filter((item) => item.checked);
    if (!selectedItems.length) {
      moduleState.helpers.notify('Please select at least one item.', 'error');
      return;
    }

    moduleState.checkoutOpen = true;
    renderCheckoutModal();
  }

  function closeCheckoutModal() {
    moduleState.checkoutOpen = false;
    renderCheckoutModal();
  }

  function openSuccessModal(data) {
    moduleState.successOpen = true;
    moduleState.successData = data;
    renderSuccessModal();
  }

  function closeSuccessModal() {
    moduleState.successOpen = false;
    moduleState.successData = null;
    renderSuccessModal();
  }

  function getSelectedCart() {
    return moduleState.state.cart.filter((item) => item.checked);
  }

  function getCheckoutTotals() {
    const subtotal = getSelectedCart().reduce((sum, item) => sum + Number(item.total || 0), 0);
    const feePercent = moduleState.helpers.getFeePercent(moduleState.checkoutMethod);
    const feeAmount = subtotal * (feePercent / 100);
    return {
      subtotal,
      feePercent,
      feeAmount,
      total: subtotal + feeAmount
    };
  }

  async function handleCheckoutSubmit() {
    const formData = moduleState.checkoutFormData;
    const name = String(formData.customerName || '').trim();
    const landmark = String(formData.customerLandmark || '').trim();
    const address = String(formData.customerAddress || '').trim();
    const number = String(formData.customerNumber || '').trim();
    const email = String(formData.customerEmail || '').trim();
    const request = String(formData.customerRequest || '').trim();

    if (!name || !address || !number || !email) {
      moduleState.helpers.notify('Name, address, number, and email are required.', 'error');
      return;
    }

    if (moduleState.checkoutMethod === 'Credit Card') {
      const cardNumber = String(formData.cardNumber || '').replace(/\s+/g, '');
      const cardExp = String(formData.cardExp || '').trim();
      const cardPw = String(formData.cardPw || '').trim();

      if (cardNumber.length < 12 || cardExp.length < 4 || cardPw.length < 3) {
        moduleState.helpers.notify('Credit card information looks incomplete.', 'error');
        return;
      }
    }

    const now = moduleState.helpers.dateTime();
    const totals = getCheckoutTotals();
    const reference = `${moduleState.state.config?.tracking?.prefix || 'AMCH'}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const orderId = `ORD-${Date.now()}`;
    const paymentId = `PAY-${Date.now()}`;

    const payload = {
      id: orderId,
      time: now.time,
      date: now.date,
      paymentID: paymentId,
      reference,
      customer: {
        ip: moduleState.state.ipAddress,
        name,
        address,
        landmark,
        number,
        email
      },
      products: getSelectedCart().map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.displayPrice,
        total: item.total,
        request
      })),
      payment: {
        id: paymentId,
        amount: totals.subtotal,
        method: moduleState.checkoutMethod,
        status: 'Pending',
        paid: totals.total
      }
    };

    const result = await moduleState.submitCheckout(payload);
    if (!result) return;

    moduleState.paymentStatusMap[paymentId] = 'Pending';
    moduleState.checkoutOpen = false;
    renderCheckoutModal();
    renderCartCanvas();

    openSuccessModal({
      orderId,
      paymentId,
      reference,
      time: now.time,
      date: now.date,
      method: moduleState.checkoutMethod,
      subtotal: totals.subtotal,
      feePercent: totals.feePercent,
      feeAmount: totals.feeAmount,
      total: totals.total,
      customer: {
        name,
        landmark,
        address,
        number,
        email
      }
    });

    resetCheckoutForm();
  }

  function renderCartCanvas() {
    let host = document.querySelector('[data-cart-canvas-host]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-cart-canvas-host', '');
      document.body.appendChild(host);
    }

    const subtotal = moduleState.helpers.subtotal(true);
    const saved = moduleState.helpers.totalSaved(true);

    host.innerHTML = `
      <aside class="am-cart-canvas ${moduleState.cartOpen ? 'is-open' : ''}" data-cart-canvas>
        <div class="am-cart-panel">
          <div class="am-cart-head">
            <button class="am-close-icon" data-cart-canvas-toggle>&times;</button>
            <div>
              <h3>Your Cart</h3>
              <p>Update quantity, select items, and continue to checkout.</p>
            </div>
          </div>

          <div class="am-cart-body">
            ${moduleState.state.cart.length ? moduleState.state.cart.map(renderCartRow).join('') : '<div class="am-empty-box">Your cart is currently empty.</div>'}
          </div>

          <div class="am-cart-foot">
            <div class="am-cart-summary-line"><span>Total Price</span><b>${moduleState.helpers.currency(subtotal)}</b></div>
            <div class="am-cart-summary-line"><span>Total Saved</span><b>${moduleState.helpers.currency(saved)}</b></div>
            <div class="am-cart-actions">
              <button class="am-button am-button-danger" data-cart-remove-selected>Delete</button>
              <button class="am-button am-button-primary" data-cart-checkout>Check Out</button>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  function renderCartRow(item) {
    return `
      <article class="am-cart-card">
        <div class="am-cart-top-row">
          <label class="am-cart-check-wrap">
            <input class="p-5" type="checkbox" ${item.checked ? 'checked' : ''} hidden />
            <button type="button" class="am-check-toggle ${item.checked ? 'is-checked' : ''}" data-cart-check="${item.id}"></button>
          </label>
          <img
            src="${moduleState.helpers.getImage(item.image)}"
            alt="${moduleState.helpers.escapeHtml(item.name)}"
            class="am-cart-thumb"
          />
          <div class="am-cart-main-copy">
            <h4>${moduleState.helpers.escapeHtml(item.name)}</h4>
            <div class="am-cart-small-row"><span>Saved</span><b>${moduleState.helpers.currency(item.saved)}</b></div>
            <div class="am-cart-small-row"><span>Total Initial Price</span><b>${moduleState.helpers.currency(item.total)}</b></div>
          </div>
        </div>
        <div class="am-cart-bottom-row">
          <button type="button" class="am-stepper" data-cart-dec="${item.id}">-</button>
          <input class="p-5 am-qty-input" data-cart-qty-input="${moduleState.helpers.escapeHtml(item.id)}" type="number" min="0" max="${Number(item.stock || 0)}" value="${Number(item.quantity || 0)}" />
          <button type="button" class="am-stepper" data-cart-inc="${item.id}">+</button>
        </div>
      </article>
    `;
  }

  function renderCheckoutModal() {
    let host = document.querySelector('[data-checkout-modal-host]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-checkout-modal-host', '');
      document.body.appendChild(host);
    }

    const now = moduleState.helpers.dateTime();
    const totals = getCheckoutTotals();
    const qr = moduleState.state.config?.images?.qrcode || 'qr.png';
    const showQr = ['GCash', 'Over the Counter'].includes(moduleState.checkoutMethod);
    const showCard = moduleState.checkoutMethod === 'Credit Card';
    const formData = moduleState.checkoutFormData;

    host.innerHTML = `
      <div class="am-modal-wrap ${moduleState.checkoutOpen ? 'is-open' : ''}" data-payment-modal>
        <div class="am-modal-panel am-payment-panel">
          <div class="am-modal-head">
            <div>
              <h3>Checkout & Payment</h3>
              <p>Finalize your order details and preferred payment method.</p>
            </div>
            <button class="am-close-icon" data-checkout-close>&times;</button>
          </div>

          <div class="am-payment-grid">
            <div class="am-payment-meta">
              <div class="am-meta-pill"><span>Time</span><b>${now.time}</b></div>
              <div class="am-meta-pill"><span>Date</span><b>${now.date}</b></div>
              <div class="am-meta-pill"><span>IP</span><b>${moduleState.state.ipAddress}</b></div>
            </div>

            <label><span>Name</span><input  class="p-5" data-checkout-field name="customerName" type="text" placeholder="Enter full name" value="${escapeHtml(formData.customerName)}" /></label>
            <label><span>Landmark</span><input  class="p-5" data-checkout-field name="customerLandmark" type="text" placeholder="Near the mall, gate, or street sign" value="${escapeHtml(formData.customerLandmark)}" /></label>
            <label class="am-wide-field"><span>Address</span><textarea  class="p-5"  data-checkout-field name="customerAddress" rows="3" placeholder="Enter full address">${escapeHtml(formData.customerAddress)}</textarea></label>
            <button type="button" class="am-link-button am-left-button" data-map-toggle>${moduleState.checkoutMapOpen ? 'Hide Map' : 'Open Map'}</button>
            ${moduleState.checkoutMapOpen ? '<div class="am-map-box">Map preview placeholder. Connect this later to backend or online maps.</div>' : ''}
            <label><span>Number</span><input  class="p-5" data-checkout-field name="customerNumber" type="text" placeholder="09XXXXXXXXX" value="${escapeHtml(formData.customerNumber)}" /></label>
            <label><span>Email</span><input  class="p-5" data-checkout-field name="customerEmail" type="email" placeholder="you@example.com" value="${escapeHtml(formData.customerEmail)}" /></label>
            <label class="am-wide-field"><span>Request</span><textarea  class="p-5" data-checkout-field name="customerRequest" rows="2" placeholder="Special request, shade, or notes">${escapeHtml(formData.customerRequest)}</textarea></label>

            <div class="am-wide-field">
              <span>Method</span>
              <div class="am-payment-methods">
                ${['GCash', 'Cash On Delivery', 'Credit Card', 'Over the Counter'].map((method) => `
                  <label class="am-method-chip ${moduleState.checkoutMethod === method ? 'is-active' : ''}">
                    <input class="p-5"  type="radio" name="paymentMethod" value="${method}" ${moduleState.checkoutMethod === method ? 'checked' : ''} hidden />
                    <span>${method}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            ${showQr ? `
              <div class="am-wide-field am-qr-box">
                <img src="${moduleState.helpers.getImage(qr, 'qr.png')}" alt="QR Code" />
                <div>
                  <h4>Scan to pay</h4>
                  <p>The selected method adds ${totals.feePercent}% to the order total.</p>
                </div>
              </div>
            ` : ''}

            ${showCard ? `
              <div class="am-wide-field am-card-grid">
                <label><span>Card Number</span><input  class="p-5" data-checkout-field name="cardNumber" inputmode="numeric" maxlength="19" placeholder="1234 5678 9012 3456" value="${escapeHtml(formData.cardNumber)}" /></label>
                <label><span>EXP</span><input  class="p-5" data-checkout-field name="cardExp" placeholder="MM/YY" maxlength="5" value="${escapeHtml(formData.cardExp)}" /></label>
                <label><span>PW</span><input  class="p-5" data-checkout-field name="cardPw" type="password" maxlength="4" placeholder="***" value="${escapeHtml(formData.cardPw)}" /></label>
              </div>
            ` : ''}

            <div class="am-wide-field am-payment-total-box">
              <div><span>Subtotal</span><b>${moduleState.helpers.currency(totals.subtotal)}</b></div>
              <div><span>Fee (${totals.feePercent}%)</span><b>${moduleState.helpers.currency(totals.feeAmount)}</b></div>
              <div><span>Total</span><b>${moduleState.helpers.currency(totals.total)}</b></div>
            </div>
          </div>

          <div class="am-modal-actions">
            <button type="button" class="am-button am-button-muted" data-checkout-close>Close</button>
            <button type="button" class="am-button am-button-primary" data-order-now>Order Now</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderSuccessModal() {
    let host = document.querySelector('[data-success-modal-host]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-success-modal-host', '');
      document.body.appendChild(host);
    }

    if (!moduleState.successOpen || !moduleState.successData) {
      host.innerHTML = '';
      return;
    }

    const data = moduleState.successData;

    host.innerHTML = `
      <div class="am-modal-wrap is-open" data-success-modal>
        <div class="am-modal-panel am-success-panel">
          <div class="am-modal-head">
            <div>
              <h3>Order Submitted Successfully</h3>
              <p>Please save your order details and reference number.</p>
            </div>
            <button class="am-close-icon" data-success-close>&times;</button>
          </div>

          <div class="am-success-body">
            <div class="am-success-highlight">
              <span>Reference Number</span>
              <strong>${escapeHtml(data.reference)}</strong>
            </div>

            <div class="am-success-grid">
              <div class="am-success-card">
                <span>Order ID</span>
                <b>${escapeHtml(data.orderId)}</b>
              </div>
              <div class="am-success-card">
                <span>Payment ID</span>
                <b>${escapeHtml(data.paymentId)}</b>
              </div>
              <div class="am-success-card">
                <span>Date</span>
                <b>${escapeHtml(data.date)}</b>
              </div>
              <div class="am-success-card">
                <span>Time</span>
                <b>${escapeHtml(data.time)}</b>
              </div>
              <div class="am-success-card">
                <span>Method</span>
                <b>${escapeHtml(data.method)}</b>
              </div>
              <div class="am-success-card">
                <span>Status</span>
                <b>Pending</b>
              </div>
            </div>

            <div class="am-success-summary">
              <div><span>Name</span><b>${escapeHtml(data.customer.name)}</b></div>
              <div><span>Address</span><b>${escapeHtml(data.customer.address)}</b></div>
              <div><span>Landmark</span><b>${escapeHtml(data.customer.landmark || '-')}</b></div>
              <div><span>Number</span><b>${escapeHtml(data.customer.number)}</b></div>
              <div><span>Email</span><b>${escapeHtml(data.customer.email)}</b></div>
              <div><span>Subtotal</span><b>${moduleState.helpers.currency(data.subtotal)}</b></div>
              <div><span>Fee (${data.feePercent}%)</span><b>${moduleState.helpers.currency(data.feeAmount)}</b></div>
              <div><span>Total</span><b>${moduleState.helpers.currency(data.total)}</b></div>
            </div>

            <p class="am-success-note">
              Keep your <strong>reference number</strong> safe. You can use it in the Track section to check your order status.
            </p>
          </div>

          <div class="am-modal-actions">
            <button type="button" class="am-button am-button-primary" data-success-close>Done</button>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  window.AMCHMainPayment = {
    state: moduleState,
    init,
    toggleCartCanvas,
    renderCartCanvas,
    renderCheckoutModal,
    closeCheckoutModal
  };
})();