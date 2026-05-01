(() => {
    const API = {
        config: '/api/config',
        products: '/api/products',
        orders: '/api/orders',
        track: (reference) => `/api/orders/${encodeURIComponent(reference)}`,
        payments: '/api/payments',
        images: (name) => `/images/${encodeURIComponent(name)}`,
        productImage: (name) => `/images/product/${encodeURIComponent(name)}`,
        brandImage: (name) => `/images/brand/${encodeURIComponent(name)}`
    };

    const STATE = {
        theme: 'light',
        online: navigator.onLine
    };

    function qs(selector, scope = document) {
        return scope.querySelector(selector);
    }

    function qsa(selector, scope = document) {
        return Array.from(scope.querySelectorAll(selector));
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function imageUrl(value, fallback = '', folder = 'product') {
        const image = String(value || '').trim();
        const fallbackImage = String(fallback || '').trim();

        if (image) {
            if (/^https?:\/\//i.test(image)) return image;
            if (image.startsWith('/images/')) return image;
            if (image.startsWith('/')) return image;

            return folder === 'brand'
                ? API.brandImage(image)
                : API.productImage(image);
        }

        if (fallbackImage) {
            if (/^https?:\/\//i.test(fallbackImage)) return fallbackImage;
            if (fallbackImage.startsWith('/images/')) return fallbackImage;
            if (fallbackImage.startsWith('/')) return fallbackImage;

            return folder === 'brand'
                ? API.brandImage(fallbackImage)
                : API.productImage(fallbackImage);
        }

        return '';
    }

    function applyTheme(nextTheme) {
        STATE.theme = nextTheme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', STATE.theme);
        localStorage.setItem('amch-theme', STATE.theme);
    }

    function restoreTheme() {
        const saved = localStorage.getItem('amch-theme') || 'light';
        applyTheme(saved);
    }

    function setConnectionState() {
        STATE.online = navigator.onLine;
        document.documentElement.dataset.connection = STATE.online ? 'online' : 'offline';

        const labels = qsa('[data-connection-label]');
        labels.forEach((node) => {
            node.textContent = STATE.online ? 'Online' : 'Offline';
        });
    }

    function formatMoney(value, currency = 'PHP') {
        const amount = Number(value || 0);

        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency
        }).format(Number.isFinite(amount) ? amount : 0);
    }

    function formatDateTime(date = new Date()) {
        const pad = (n) => String(n).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return {
            date: `${months[date.getMonth()]} ${pad(date.getDate())} ${date.getFullYear()}`,
            time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
        };
    }

    function openBasicModal({ title = 'Notice', content = '', actions = [], escapeContent = false } = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'amch-overlay';

        overlay.innerHTML = `
            <div class="amch-modal">
                <div class="amch-modal__header">
                    <h3>${escapeHtml(title)}</h3>
                    <button type="button" class="amch-icon-btn" data-close-modal>&times;</button>
                </div>
                <div class="amch-modal__body">${escapeContent ? escapeHtml(content) : content}</div>
                <div class="amch-modal__footer"></div>
            </div>
        `;

        const footer = overlay.querySelector('.amch-modal__footer');

        if (!actions.length) {
            actions = [
                {
                    label: 'Close',
                    className: 'amch-btn amch-btn--soft',
                    onClick: () => overlay.remove()
                }
            ];
        }

        actions.forEach((action) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = action.className || 'amch-btn';
            btn.textContent = action.label || 'Okay';
            btn.addEventListener('click', () => {
                if (typeof action.onClick === 'function') action.onClick(overlay);
            });
            footer.appendChild(btn);
        });

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay || event.target.hasAttribute('data-close-modal')) {
                overlay.remove();
            }
        });

        document.body.appendChild(overlay);
        return overlay;
    }

    function ensureFooterYear() {
        const footer = qs('.footer-inner');
        if (!footer) return;
        footer.dataset.ready = 'true';
    }

    function boot() {
        restoreTheme();
        setConnectionState();
        ensureFooterYear();

        window.addEventListener('online', setConnectionState);
        window.addEventListener('offline', setConnectionState);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.AMCH = window.AMCH || {};
    window.AMCH.API = API;
    window.AMCH.STATE = STATE;
    window.AMCH.qs = qs;
    window.AMCH.qsa = qsa;
    window.AMCH.escapeHtml = escapeHtml;
    window.AMCH.imageUrl = imageUrl;
    window.AMCH.applyTheme = applyTheme;
    window.AMCH.formatMoney = formatMoney;
    window.AMCH.formatDateTime = formatDateTime;
    window.AMCH.openBasicModal = openBasicModal;
})();