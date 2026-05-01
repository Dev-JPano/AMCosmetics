(() => {
    const CONFIG = {
        rootId: 'amch-background',
        petalCount: 22,
        minSize: 18,
        maxSize: 46,
        minDuration: 10,
        maxDuration: 22,
        drift: 160,
        swayDuration: 3.4
    };

    let initialized = false;

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createPetal(index) {
        const petal = document.createElement('span');
        petal.className = 'amch-petal';

        const size = randomBetween(CONFIG.minSize, CONFIG.maxSize);
        const left = randomBetween(-8, 100);
        const delay = randomBetween(-20, 0);
        const duration = randomBetween(CONFIG.minDuration, CONFIG.maxDuration);
        const rotate = randomBetween(-180, 180);
        const sway = randomBetween(-CONFIG.drift, CONFIG.drift);
        const opacity = randomBetween(0.34, 0.9);

        petal.style.width = `${size}px`;
        petal.style.height = `${size * 0.82}px`;
        petal.style.left = `${left}vw`;
        petal.style.top = `-${size * 2}px`;
        petal.style.opacity = opacity.toFixed(2);
        petal.style.animationDuration = `${duration}s, ${randomBetween(2.6, 5.4)}s, ${randomBetween(2.4, 4.8)}s`;
        petal.style.animationDelay = `${delay}s, ${delay / 2}s, ${delay / 3}s`;
        petal.style.setProperty('--amch-rotate-start', `${rotate}deg`);
        petal.style.setProperty('--amch-rotate-end', `${rotate + randomBetween(160, 360)}deg`);
        petal.style.setProperty('--amch-drift', `${sway}px`);
        petal.style.zIndex = String(1 + (index % 4));
        petal.setAttribute('aria-hidden', 'true');

        return petal;
    }

    function mount() {
        if (initialized) return;
        const root = document.getElementById(CONFIG.rootId);
        if (!root) return;

        root.classList.add('amch-background-ready');
        const layer = document.createElement('div');
        layer.className = 'amch-petal-layer';

        for (let i = 0; i < CONFIG.petalCount; i += 1) {
            layer.appendChild(createPetal(i));
        }

        root.appendChild(layer);
        initialized = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }

    window.AMCHBackground = {
        mount
    };
})();
