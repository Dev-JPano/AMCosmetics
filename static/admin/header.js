(() => {
  const root = window;
  const ns = root.AMCHubAdmin = root.AMCHubAdmin || {};
  const localState = {
    menuOpen: false
  };

  function navItems() {
    return [
      { key: 'products', label: 'Products' },
      { key: 'pending', label: 'Pending' },
      { key: 'ordered', label: 'Ordered' },
      { key: 'reviews', label: 'Reviews' }
    ];
  }

  function render(target, state = {}) {
    if (!target) return;

    target.className = 'amc-admin-header-shell';
    target.innerHTML = `
      <div class="amc-admin-header glass-panel">
        <div class="amc-admin-header__top">
          <button
            class="amc-admin-menu-btn"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded="${localState.menuOpen ? 'true' : 'false'}"
            data-admin-menu-toggle
          >
            <span></span><span></span><span></span>
          </button>

          <div class="amc-admin-brand">
            <p class="amc-admin-eyebrow">AM Cosmetic Hub</p>
            <h1 class="amc-admin-title">Administrator Panel</h1>
          </div>

          <div class="amc-admin-session">
            <div class="amc-admin-user-chip">
              <span class="amc-admin-user-chip__dot"></span>
              <span>${state.adminName || 'Administrator'}</span>
            </div>
            <button class="amc-admin-logout-btn" type="button" data-admin-logout>Log Out</button>
          </div>
        </div>

        <nav class="amc-admin-nav" data-open="${localState.menuOpen ? 'true' : 'false'}">
          ${navItems().map(item => `
            <button
              type="button"
              class="amc-admin-nav__item ${item.key === state.activeView ? 'is-active' : ''}"
              data-view="${item.key}"
            >${item.label}</button>
          `).join('')}
        </nav>
      </div>
    `;

    const nav = target.querySelector('.amc-admin-nav');
    const menuBtn = target.querySelector('[data-admin-menu-toggle]');
    const logoutBtn = target.querySelector('[data-admin-logout]');

    menuBtn?.addEventListener('click', () => {
      localState.menuOpen = !localState.menuOpen;
      nav.dataset.open = localState.menuOpen ? 'true' : 'false';
      menuBtn.setAttribute('aria-expanded', localState.menuOpen ? 'true' : 'false');
    });

    target.querySelectorAll('[data-view]').forEach(button => {
      button.addEventListener('click', () => {
        localState.menuOpen = false;
        ns.store?.setState({ activeView: button.dataset.view });
      });
    });

    logoutBtn?.addEventListener('click', () => {
      ns.UI?.confirm({
        title: 'Log out?',
        message: 'Do you want to log out from the administrator panel?',
        confirmText: 'Log Out',
        onConfirm: () => ns.events?.emit('logout')
      });
    });
  }

  ns.Header = { render };
})();
