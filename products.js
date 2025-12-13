// Product management

let productsListener = null;

// Load products
function loadProducts() {
  const productsList = document.getElementById('products-list');
  productsList.innerHTML = '';

  // Remove previous listener
  if (productsListener) {
    getProductsRef().off('value', productsListener);
  }

  // Listen for products
  productsListener = getProductsRef().on('value', (snapshot) => {
    productsList.innerHTML = '';
    const products = snapshot.val() || {};

    if (Object.keys(products).length === 0) {
      productsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay productos registrados</p>';
      return;
    }

    Object.entries(products).forEach(([id, product]) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="list-item-header">
          <div class="list-item-title">${escapeHtml(product.name)}</div>
          <span class="status-badge ${product.active ? 'active' : 'inactive'}">
            ${product.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div class="list-item-meta">
          Precio: $${parseFloat(product.price || 0).toFixed(2)}
        </div>
        <div class="list-item-actions">
          <button class="btn-secondary btn-small edit-product" data-id="${id}">Editar</button>
          <button class="btn-danger btn-small delete-product" data-id="${id}">Eliminar</button>
        </div>
      `;
      productsList.appendChild(item);
    });

    // Attach event listeners
    document.querySelectorAll('.edit-product').forEach(btn => {
      btn.addEventListener('click', (e) => editProduct(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-product').forEach(btn => {
      btn.addEventListener('click', (e) => deleteProductHandler(e.target.dataset.id));
    });
  });
}

// Show product form
function showProductForm(productId = null) {
  const form = document.getElementById('product-form');
  const title = document.getElementById('product-form-title');
  const formElement = document.getElementById('product-form-element');
  
  form.classList.remove('hidden');
  formElement.reset();
  document.getElementById('product-id').value = productId || '';

  if (productId) {
    title.textContent = 'Editar Producto';
    getProduct(productId).then(snapshot => {
      const product = snapshot.val();
      if (product) {
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-active').checked = product.active !== false;
      }
    });
  } else {
    title.textContent = 'Nuevo Producto';
    document.getElementById('product-active').checked = true;
  }
}

// Hide product form
function hideProductForm() {
  document.getElementById('product-form').classList.add('hidden');
}

// Save product
function saveProduct(productId, productData) {
  if (productId) {
    return updateProduct(productId, productData);
  } else {
    return createProduct(productData);
  }
}

// Edit product
function editProduct(productId) {
  showProductForm(productId);
}

// Delete product handler
async function deleteProductHandler(productId) {
  if (!confirm('¿Está seguro de eliminar este producto?')) return;

  try {
    await deleteProduct(productId);
  } catch (error) {
    alert('Error al eliminar producto: ' + error.message);
  }
}

// Product form submit
document.getElementById('product-form-element').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const productId = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const active = document.getElementById('product-active').checked;

  if (!name || isNaN(price) || price < 0) {
    alert('Por favor complete todos los campos correctamente');
    return;
  }

  try {
    await saveProduct(productId || null, { name, price, active });
    hideProductForm();
  } catch (error) {
    alert('Error al guardar producto: ' + error.message);
  }
});

// New product button
document.getElementById('new-product-btn').addEventListener('click', () => {
  showProductForm();
});

// Cancel product form
document.getElementById('cancel-product-btn').addEventListener('click', () => {
  hideProductForm();
});

// Load products for order form
function loadProductsForOrder() {
  return getProductsRef().once('value').then(snapshot => {
    const products = snapshot.val() || {};
    return Object.entries(products)
      .filter(([id, product]) => product.active !== false)
      .map(([id, product]) => ({ id, ...product }));
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

