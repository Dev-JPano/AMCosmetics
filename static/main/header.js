(function () {
  'use strict';

  const moduleState = {
    state: null,
    helpers: null,
    navigateTo: null,
    onAdminLogin: null,
    toggleCartCanvas: null,
    isMenuOpen: false,
    adminModalOpen: false
  };

  function init(deps) {
    Object.assign(moduleState, deps);
    bindEvents();
    bindKeyboard();
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const navButton = event.target.closest('[data-nav-target]');
      if (navButton) {
        moduleState.navigateTo(navButton.dataset.navTarget);
        moduleState.isMenuOpen = false;
        render();
        return;
      }

      if (event.target.closest('[data-cart-toggle]')) {
        moduleState.toggleCartCanvas();
        return;
      }

      if (event.target.closest('[data-menu-toggle]')) {
        moduleState.isMenuOpen = !moduleState.isMenuOpen;
        render();
        return;
      }

      if (event.target.closest('[data-admin-open]')) {
        openAdminModal();
        return;
      }

      if (
        event.target.closest('[data-admin-cancel]') ||
        event.target.closest('[data-admin-overlay]')
      ) {
        closeAdminModal();
        return;
      }

      const submit = event.target.closest('[data-admin-submit]');
      if (submit) {
        const root = document.querySelector('[data-admin-modal]');
        if (!root) return;

        const username = root.querySelector('[name="username"]')?.value.trim() || '';
        const password = root.querySelector('[name="password"]')?.value || '';
        moduleState.onAdminLogin({ username, password });
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!moduleState.adminModalOpen) return;

      if (event.key === 'Escape') {
        closeAdminModal();
        return;
      }

      if (event.key === 'Enter') {
        const root = document.querySelector('[data-admin-modal]');
        if (!root) return;

        const active = document.activeElement;
        if (active && root.contains(active)) {
          const username = root.querySelector('[name="username"]')?.value.trim() || '';
          const password = root.querySelector('[name="password"]')?.value || '';
          moduleState.onAdminLogin({ username, password });
        }
      }
    });
  }

  function bindKeyboard() {}

  function syncResponsiveState() {
    if (window.innerWidth >= 960) {
      moduleState.isMenuOpen = false;
      render();
    }
  }

  function updateActiveNav() {
    const current = moduleState.state.activeSection;
    moduleState.helpers.qsa('[data-nav-target]').forEach((button) => {
      button.classList.toggle('is-active-nav', button.dataset.navTarget === current);
    });
  }

  function openAdminModal() {
    moduleState.adminModalOpen = true;
    renderAdminModal();
  }

  function closeAdminModal() {
    moduleState.adminModalOpen = false;
    const modalHost = document.querySelector('[data-admin-modal-host]');
    if (!modalHost) return;

    modalHost.classList.remove('is-open');

    const panel = modalHost.querySelector('.am-admin-modal-panel');
    if (panel) panel.classList.remove('is-open');

    setTimeout(() => {
      modalHost.remove();
    }, 180);
  }

  function renderAdminModal() {
    document.querySelector('[data-admin-modal-host]')?.remove();

    if (!moduleState.adminModalOpen) return;

    const modalHost = document.createElement('div');
    modalHost.setAttribute('data-admin-modal-host', '');
    modalHost.className = 'am-admin-modal-wrap is-open';

    modalHost.innerHTML = `
      <div class="am-admin-modal-overlay" data-admin-overlay></div>

      <div class="am-admin-modal-panel is-open" data-admin-modal>
        <div class="am-admin-modal-head">
          <div>
            <p class="am-kicker">Restricted Access</p>
            <h3>Administrator Access</h3>
            <p>Use your username and password to continue.</p>
          </div>
          <button type="button" class="am-close-icon" data-admin-cancel>&times;</button>
        </div>

        <div class="am-admin-form-grid">
          <label>
            <span>Username</span>
            <input class="p-5" name="username" type="text" placeholder="admin-useername" autocomplete="username" />
          </label>

          <label>
            <span>Password</span>
            <input class="p-5" name="password" type="password" placeholder="••••••••" autocomplete="current-password" />
          </label>
        </div>

        <div class="am-admin-modal-note">
          <span>Authorized administrators only.</span>
        </div>

        <div class="am-admin-modal-actions">
          <button type="button" class="am-button am-button-muted" data-admin-cancel>Cancel</button>
          <button type="button" class="am-button am-button-primary" data-admin-submit>Log In</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalHost);

    const usernameInput = modalHost.querySelector('[name="username"]');
    setTimeout(() => usernameInput?.focus(), 30);
  }

  function render() {
    const host = moduleState.helpers.qs('[data-main-header]');
    if (!host) return;

    const cartCount = moduleState.state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    host.innerHTML = `
      <div class="am-main-shell am-main-header-shell">
        <div class="am-brand-block">
          <button class="am-menu-button lg:hidden" data-menu-toggle aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>

          <div>
            <h1 class="am-brand-title">AM Cosmetic Hub</h1>
            <p class="am-brand-subtitle">Multi-brand beauty essentials in one elegant space.</p>
          </div>
        </div>

        <nav class="am-main-nav ${moduleState.isMenuOpen ? 'is-open' : ''}">
          <button class="am-nav-link" data-nav-target="home">Home</button>
          <button class="am-nav-link" data-nav-target="products">Products</button>
          <button class="am-nav-link" data-nav-target="track">Track</button>
          <button class="am-nav-link am-nav-link-admin" data-admin-open>Administrator</button>
        </nav>

        <div class="am-header-tools">
          <div class="am-ip-pill" title="Current IP Address">${moduleState.state.ipAddress}</div>
          <button class="am-cart-button" data-cart-toggle>
            <span>Cart</span>
            <b>${cartCount}</b>
          </button>
        </div>
      </div>
    `;

    updateActiveNav();
  }

  window.AMCHMainHeader = {
    init,
    render,
    updateActiveNav,
    closeAdminModal,
    syncResponsiveState,
    openAdminModal
  };
})();