(() => {
  const root = window;
  const ns = root.AMCHubAdmin = root.AMCHubAdmin || {};

  function money(value) {
    return ns.utils?.money(value) || `₱${Number(value || 0).toFixed(2)}`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function nextProductId(products = []) {
    const max = products.reduce((highest, item) => {
      const match = String(item.id || '').match(/P(\d+)/i);
      if (!match) return highest;
      return Math.max(highest, Number(match[1] || 0));
    }, 0);

    return `P${String(max + 1).padStart(4, '0')}`;
  }

  function getProductImage(value) {
    return ns.utils?.imageUrl?.(value) || value || ns.config?.images?.productFallback || '';
  }

  function normalizePayload(form, existing = {}) {
    const realPrice = Number(form.realPrice?.value || 0);
    const displayPrice = Number(form.displayPrice?.value || 0);
    const stock = Number(form.stock?.value || 0);
    const imageUrl = String(form.imageUrl?.value || '').trim();
    const brandID = String(form.brandID?.value || '').trim();

    return {
      id: existing.id || String(form.productId?.value || '').trim(),
      brandID,
      name: String(form.name?.value || '').trim(),
      description: String(form.description?.value || '').trim(),
      stock,
      pricing: {
        realPrice,
        displayPrice
      },
      images: imageUrl ? [imageUrl] : [],
      sold: Number(existing.sold || 0),
      cartAddedCount: Number(existing.cartAddedCount || 0),
      reviews: existing.reviews || [],
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function imageCell(product) {
    const imageUrl = product.images?.[0] || '';
    const finalUrl = getProductImage(imageUrl);

    return `
      <div class="amc-product-image-cell">
        <span class="amc-product-image-name">${escapeHtml(imageUrl || 'No image URL')}</span>
        <div class="amc-product-image-preview">
          <img src="${escapeHtml(finalUrl)}" alt="${escapeHtml(product.name || product.id || 'Preview')}">
        </div>
      </div>
    `;
  }

  function renderTable(products) {
    if (!products.length) {
      return `
        <div class="amc-admin-empty glass-panel">
          <p>No products found.</p>
        </div>
      `;
    }

    return `
      <div class="amc-products-table-wrap glass-panel">
        <table class="amc-products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Real Price</th>
              <th>Price</th>
              <th>Image URL</th>
              <th>EDIT</th>
              <th>DELETE</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((product) => `
              <tr>
                <td>${escapeHtml(product.id)}</td>
                <td>${escapeHtml(product.name)}</td>
                <td class="amc-products-desc-cell">${escapeHtml(product.description)}</td>
                <td>${Number(product.stock || 0)}</td>
                <td>${money(product.pricing?.realPrice || 0)}</td>
                <td>${money(product.pricing?.displayPrice || 0)}</td>
                <td>${imageCell(product)}</td>
                <td>
                  <button type="button" class="amc-btn amc-btn--ghost" data-edit-product="${escapeHtml(product.id)}">Edit</button>
                </td>
                <td>
                  <button type="button" class="amc-btn amc-btn--danger" data-delete-product="${escapeHtml(product.id)}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function buildForm(product = null, products = []) {
    const draft = product || {
      id: nextProductId(products),
      brandID: 'B0001',
      name: '',
      description: '',
      stock: 0,
      pricing: { realPrice: 0, displayPrice: 0 },
      images: []
    };

    const currentImageUrl = draft.images?.[0] || '';

    return `
      <form class="amc-product-form" data-product-form>
        <div class="amc-modal-stack">
          <label>
            <span>ID</span>
            <input class="amc-modal-input" name="productId" type="text" value="${escapeHtml(draft.id)}" readonly>
          </label>

          <label>
            <span>Brand ID</span>
            <input class="amc-modal-input" name="brandID" type="text" value="${escapeHtml(draft.brandID || draft.brandId || 'B0001')}" placeholder="B0001">
          </label>

          <label>
            <span>Name</span>
            <input class="amc-modal-input" name="name" type="text" value="${escapeHtml(draft.name || '')}" placeholder="Product name">
          </label>

          <label>
            <span>Description</span>
            <textarea class="amc-modal-textarea" name="description" rows="4" placeholder="Product description">${escapeHtml(draft.description || '')}</textarea>
          </label>

          <label>
            <span>Quantity</span>
            <input class="amc-modal-input" name="stock" type="number" min="0" value="${Number(draft.stock || 0)}">
          </label>

          <label>
            <span>Real Price</span>
            <input class="amc-modal-input" name="realPrice" type="number" min="0" step="0.01" value="${Number(draft.pricing?.realPrice || 0)}">
          </label>

          <label>
            <span>Price</span>
            <input class="amc-modal-input" name="displayPrice" type="number" min="0" step="0.01" value="${Number(draft.pricing?.displayPrice || 0)}">
          </label>

          <label>
            <span>Image URL</span>
            <input class="amc-modal-input" name="imageUrl" type="url" value="${escapeHtml(currentImageUrl)}" placeholder="https://res.cloudinary.com/.../product.png">
          </label>

          <p class="amc-admin-muted">
            Upload the image first to Cloudinary, Supabase Storage, or any image host, then paste the public URL here.
          </p>

          <div class="amc-product-modal-preview">
            <img src="${escapeHtml(getProductImage(currentImageUrl))}" alt="${escapeHtml(draft.name || 'Preview')}" data-product-preview>
          </div>

          <div class="amc-modal-actions">
            <button type="button" class="amc-btn amc-btn--ghost" data-close-modal>Cancel</button>
            <button type="submit" class="amc-btn amc-btn--approve">${product ? 'Save' : 'Add Product'}</button>
          </div>
        </div>
      </form>
    `;
  }

  async function validateImageUrlIfNeeded(form) {
    const imageUrl = String(form.imageUrl?.value || '').trim();

    if (!imageUrl) return '';

    const result = await ns.api.validateImageUrl(imageUrl, 'product');

    if (!result?.ok) {
      throw new Error(result?.message || 'Invalid image URL.');
    }

    return result.url || imageUrl;
  }

  function bindPreview(form) {
    const imageUrl = form.querySelector('[name="imageUrl"]');
    const preview = form.querySelector('[data-product-preview]');

    const refresh = () => {
      if (!preview) return;
      preview.src = getProductImage(imageUrl?.value?.trim() || '');
    };

    imageUrl?.addEventListener('input', refresh);
  }

  function attachProductFormSubmit(form, mode, currentState, existingProduct = null) {
    bindPreview(form);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const validImageUrl = await validateImageUrlIfNeeded(form);

        if (validImageUrl) {
          form.imageUrl.value = validImageUrl;
        }

        const payload = normalizePayload(form, existingProduct || null);

        const okay = window.confirm(
          mode === 'edit'
            ? `Save changes for ${payload.name || payload.id}?`
            : `Add ${payload.name || payload.id} to products?`
        );

        if (!okay) return;

        if (mode === 'edit') {
          await ns.api.updateProductEntry(existingProduct.id, payload);
        } else {
          await ns.api.createProduct(payload);
        }

        ns.UI?.closeModal();
        await ns.actions?.refreshAll();
      } catch (error) {
        alert(error.message || 'Failed to save product.');
      }
    });
  }

  function openAddModal(state) {
    const modal = ns.UI?.modalShell('Add Product', buildForm(null, state.products || []));
    const form = modal?.querySelector('[data-product-form]');

    if (!form) return;

    attachProductFormSubmit(form, 'add', state, null);
  }

  function openEditModal(product, state) {
    const modal = ns.UI?.modalShell(`Edit ${product.id}`, buildForm(product, state.products || []));
    const form = modal?.querySelector('[data-product-form]');

    if (!form) return;

    attachProductFormSubmit(form, 'edit', state, product);
  }

  function openDeleteConfirm(product) {
    ns.UI?.confirm({
      title: 'Delete Product',
      message: `Delete ${product.name || product.id}? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await ns.api.deleteProductEntry(product.id);
        await ns.actions?.refreshAll();
      }
    });
  }

  function openClearConfirm(products) {
    const token = ns.utils?.randomToken?.(16) || Math.random().toString(36).slice(2, 18);

    const modal = ns.UI?.modalShell('Clear Products', `
      <div class="amc-modal-stack">
        <p class="amc-modal-copy">This will remove all products from the table. Type the token below to continue.</p>
        <div class="amc-token-box">${token}</div>
        <input class="amc-modal-input" type="text" placeholder="Enter token" data-clear-token-input>
        <div class="amc-modal-actions">
          <button type="button" class="amc-btn amc-btn--ghost" data-close-modal>Cancel</button>
          <button type="button" class="amc-btn amc-btn--danger" data-confirm-clear-products>Clear</button>
        </div>
      </div>
    `);

    const trigger = modal?.querySelector('[data-confirm-clear-products]');

    trigger?.addEventListener('click', async () => {
      const value = modal.querySelector('[data-clear-token-input]')?.value?.trim();

      if (value !== token) return;

      await ns.api.clearProducts();
      ns.UI?.closeModal();
      await ns.actions?.refreshAll();
    });
  }

  function bindActions(section, state) {
    section.querySelector('[data-add-product]')?.addEventListener('click', () => openAddModal(state));
    section.querySelector('[data-clear-products]')?.addEventListener('click', () => openClearConfirm(state.products || []));

    section.querySelectorAll('[data-edit-product]').forEach((button) => {
      button.addEventListener('click', () => {
        const product = (state.products || []).find((item) => item.id === button.dataset.editProduct);
        if (product) openEditModal(product, state);
      });
    });

    section.querySelectorAll('[data-delete-product]').forEach((button) => {
      button.addEventListener('click', () => {
        const product = (state.products || []).find((item) => item.id === button.dataset.deleteProduct);
        if (product) openDeleteConfirm(product);
      });
    });
  }

  ns.Products = {
    render(section, state = {}) {
      if (!section) return;

      const products = state.products || [];

      section.className = 'amc-admin-view';
      section.innerHTML = `
        <div class="amc-admin-view__head">
          <div>
            <p class="amc-admin-eyebrow">Products</p>
            <h2>Manage product records</h2>
          </div>
          <div class="amc-admin-inline-actions">
            <button type="button" class="amc-btn amc-btn--ghost" data-clear-products>CLEAR</button>
            <button type="button" class="amc-btn amc-btn--approve" data-add-product>ADD PRODUCT</button>
          </div>
        </div>
        ${renderTable(products)}
      `;

      bindActions(section, state);
    }
  };
})();