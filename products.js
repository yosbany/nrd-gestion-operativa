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
      productsList.innerHTML = `
        <div class="text-center py-12 border border-gray-200 p-8">
          <p class="text-gray-600 mb-4">No hay productos registrados</p>
          <button id="auto-init-products" class="px-6 py-2 bg-black text-white border border-black hover:bg-gray-800 transition-colors uppercase tracking-wider text-sm font-light">
            Cargar Productos por Defecto
          </button>
        </div>
      `;
      // Attach event listener to auto-init button
      setTimeout(() => {
        const autoInitBtn = document.getElementById('auto-init-products');
        if (autoInitBtn) {
          autoInitBtn.addEventListener('click', async () => {
            await initializeProducts();
            // The listener will automatically refresh the list
          });
        }
      }, 100);
      return;
    }

    Object.entries(products).forEach(([id, product]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-6 hover:border-black transition-colors';
      item.innerHTML = `
        <div class="flex justify-between items-center mb-3">
          <div class="text-lg font-light">${escapeHtml(product.name)}</div>
          <span class="px-3 py-1 text-xs uppercase tracking-wider border ${product.active ? 'border-black text-black' : 'border-gray-300 text-gray-600'}">
            ${product.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div class="text-sm text-gray-600">
          Precio: $${parseFloat(product.price || 0).toFixed(2)}
        </div>
        <div class="flex gap-3 mt-4 pt-4 border-t border-gray-200">
          <button class="px-4 py-2 border border-gray-300 hover:border-black transition-colors uppercase tracking-wider text-xs font-light edit-product" data-id="${id}">Editar</button>
          <button class="px-4 py-2 border border-gray-300 hover:border-black transition-colors uppercase tracking-wider text-xs font-light delete-product" data-id="${id}">Eliminar</button>
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

// Initialize default products
async function initializeProducts() {
  const defaultProducts = [
    'Sándwich Copetín (Blanco/Integral) Jamón y Queso',
    'Sándwich Copetín (Blanco/Integral) Jamón y Choclo',
    'Sándwich Copetín (Blanco/Integral) Atún y Tomate',
    'Sándwich Copetín (Blanco/Integral) Atún y Lechuga',
    'Sándwich Copetín (Blanco/Integral) Olímpicos',
    'Sándwich Copetín (Blanco/Integral) Jamón y Huevo Duro',
    'Sándwich Copetín (Blanco/Integral) Pollo y Jardinera',
    'Sándwich Copetín (Blanco/Integral) Pollo y Aceitunas',
    'Sándwich Copetín (Blanco/Integral) Lomito y Manteca',
    'Sándwich Copetín (Blanco/Integral) Bondiola y Manteca',
    'Sándwich Copetín (Blanco/Integral) Jamón y Tomate',
    'Sándwich Copetín (Blanco/Integral) Doble Queso y Manteca',
    'Sándwich Copetín (Blanco/Integral) Jamón y Palmito',
    'Sándwich Copetín (Blanco/Integral) Salme y Queso',
    'Bocaditos de Pizza',
    'Pebetes de Jamón y Queso',
    'Empanaditas de Carne',
    'Empanaditas de Pollo',
    'Empanaditas de Jamón y Queso',
    'Medialunitas de Jamón y Queso(Dulce o Salada)',
    'Medialunitas Dulces o Saladas Comunes',
    'Bocaditos de Tarta de Jamón y Queso',
    'Bocaditos de Tarta Pascualina',
    'Alemanitas',
    'Pan Tortuga de 65gr',
    'Pan Miñon Blando',
    'Pan Miñon Blando con Sesamo',
    'Pan de Pancho'
  ];

  if (!confirm(`¿Desea inicializar ${defaultProducts.length} productos? Los productos se crearán con precio $0.00 y podrá editarlos después.`)) {
    return;
  }

  try {
    // Check existing products
    const snapshot = await getProductsRef().once('value');
    const existingProducts = snapshot.val() || {};
    const existingNames = Object.values(existingProducts).map(p => p.name.toLowerCase());

    let added = 0;
    let skipped = 0;

    for (const productName of defaultProducts) {
      // Skip if product already exists
      if (existingNames.includes(productName.toLowerCase())) {
        skipped++;
        continue;
      }

      await createProduct({
        name: productName,
        price: 0,
        active: true
      });
      added++;
    }

    if (added > 0) {
      alert(`Se agregaron ${added} productos exitosamente.${skipped > 0 ? ` ${skipped} productos ya existían y fueron omitidos.` : ''}`);
    } else if (skipped > 0) {
      alert(`Todos los productos ya existen en la base de datos.`);
    }
  } catch (error) {
    alert('Error al inicializar productos: ' + error.message);
    console.error(error);
  }
}

// Initialize products button
document.getElementById('init-products-btn').addEventListener('click', () => {
  initializeProducts();
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

