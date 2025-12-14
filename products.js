// Product management

let productsListener = null;

// Load products
function loadProducts() {
  const productsList = document.getElementById('products-list');
  if (!productsList) return;
  
  productsList.innerHTML = '';

  // Remove previous listener
  if (productsListener) {
    getProductsRef().off('value', productsListener);
    productsListener = null;
  }

  // Listen for products
  productsListener = getProductsRef().on('value', (snapshot) => {
    if (!productsList) return;
    productsList.innerHTML = '';
    const products = snapshot.val() || {};

    if (Object.keys(products).length === 0) {
      productsList.innerHTML = `
        <div class="text-center py-8 sm:py-12 border border-gray-200 p-4 sm:p-8">
          <p class="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">No hay productos registrados</p>
          <button id="auto-init-products" class="px-4 sm:px-6 py-2 bg-red-600 text-white border border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-xs sm:text-sm font-light">
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
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.productId = id;
      item.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light flex-1">${escapeHtml(product.name)}</div>
          <span class="px-2 sm:px-3 py-0.5 sm:py-1 text-xs uppercase tracking-wider border ${product.active ? 'border-red-600 text-red-600' : 'border-gray-300 text-gray-600'}">
            ${product.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div class="text-xs sm:text-sm text-gray-600">
          Precio: <span class="text-red-600 font-medium">$${parseFloat(product.price || 0).toFixed(2)}</span>
        </div>
      `;
      item.addEventListener('click', () => viewProduct(id));
      productsList.appendChild(item);
    });
  });
}

// Show product form
function showProductForm(productId = null) {
  const form = document.getElementById('product-form');
  const list = document.getElementById('products-list');
  const header = document.querySelector('#products-view .flex.flex-col');
  const title = document.getElementById('product-form-title');
  const formElement = document.getElementById('product-form-element');
  
  form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  
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
  const form = document.getElementById('product-form');
  const list = document.getElementById('products-list');
  const header = document.querySelector('#products-view .flex.flex-col');
  
  form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
}

// Save product
function saveProduct(productId, productData) {
  if (productId) {
    return updateProduct(productId, productData);
  } else {
    return createProduct(productData);
  }
}

// View product detail
async function viewProduct(productId) {
  showSpinner('Cargando producto...');
  try {
    const snapshot = await getProduct(productId);
    const product = snapshot.val();
    hideSpinner();
    if (!product) {
      await showError('Producto no encontrado');
      return;
    }

    const list = document.getElementById('products-list');
    const header = document.querySelector('#products-view .flex.flex-col');
    const form = document.getElementById('product-form');
    const detail = document.getElementById('product-detail');
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');

    document.getElementById('product-detail-content').innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(product.name)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Precio:</span>
          <span class="font-light text-sm sm:text-base text-red-600 font-medium">$${parseFloat(product.price || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Estado:</span>
          <span class="px-2 sm:px-3 py-0.5 sm:py-1 text-xs uppercase tracking-wider border ${product.active ? 'border-red-600 text-red-600' : 'border-gray-300 text-gray-600'}">
            ${product.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-product-detail-btn');
    const deleteBtn = document.getElementById('delete-product-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showProductForm(productId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteProductHandler(productId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar producto: ' + error.message);
  }
}

// Back to products list
function backToProducts() {
  const list = document.getElementById('products-list');
  const header = document.querySelector('#products-view .flex.flex-col');
  const detail = document.getElementById('product-detail');
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
}

// Edit product
function editProduct(productId) {
  showProductForm(productId);
}

// Delete product handler
async function deleteProductHandler(productId) {
  const confirmed = await showConfirm('Eliminar Producto', '¿Está seguro de eliminar este producto?');
  if (!confirmed) return;

  showSpinner('Eliminando producto...');
  try {
    await deleteProduct(productId);
    hideSpinner();
    backToProducts();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar producto: ' + error.message);
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
    await showError('Por favor complete todos los campos correctamente');
    return;
  }

  showSpinner('Guardando producto...');
  try {
    await saveProduct(productId || null, { name, price, active });
    hideSpinner();
    hideProductForm();
  } catch (error) {
    hideSpinner();
    await showError('Error al guardar producto: ' + error.message);
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

// Close product form button
document.getElementById('close-product-form').addEventListener('click', () => {
  hideProductForm();
});

// Back to products button
document.getElementById('back-to-products').addEventListener('click', () => {
  backToProducts();
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
    { name: "SANDWICH COPETIN - JAMON Y QUESO", price: 13.00 },
    { name: "SANDWICH COPETIN - JAMON Y CHOCLO", price: 13.00 },
    { name: "SANDWICH COPETIN - ATUN Y TOMATE", price: 16.00 },
    { name: "SANDWICH COPETIN - ATUN Y LECHUGA", price: 16.00 },
    { name: "SANDWICH COPETIN - OLIMPICO", price: 16.00 },
    { name: "SANDWICH COPETIN - JAMON Y HUEVO", price: 13.00 },
    { name: "SANDWICH COPETIN - POLLO Y JARDINERA", price: 16.00 },
    { name: "SANDWICH COPETIN - POLLO Y ACEITUNAS", price: 16.00 },
    { name: "SANDWICH COPETIN - LOMITO Y MANTECA", price: 14.00 },
    { name: "SANDWICH COPETIN - BONDIOLA Y MANTECA", price: 14.00 },
    { name: "SANDWICH COPETIN - JAMON Y TOMATE", price: 13.00 },
    { name: "SANDWICH COPETIN - DOBLE QUESO", price: 14.00 },
    { name: "SANDWICH COPETIN - JAMON Y PALMITOS", price: 14.00 },
    { name: "SANDWICH COPETIN - SALAME Y QUESO", price: 13.00 },
    { name: "BOCADITOS DE PIZZA", price: 10.00 },
    { name: "PEBETE - JAMON Y QUESO", price: 10.00 },
    { name: "EMPANADITAS - CARNE", price: 15.00 },
    { name: "EMPANADITAS - POLLO", price: 15.00 },
    { name: "EMPANADITAS - JAMON Y QUESO", price: 15.00 },
    { name: "BOCADITOS DE TARTA - JAMON Y QUESO", price: 16.00 },
    { name: "BOCADITOS DE TARTA - PASCUALINA", price: 14.00 },
    { name: "MEDIALUNITAS - JAMON Y QUESO", price: 15.00 },
    { name: "MEDIALUNITAS - DULCES", price: 13.00 },
    { name: "MEDIALUNITAS - SALADAS", price: 13.00 },
    { name: "ALEMANITAS", price: 15.00 },
    { name: "PAN TORTUGA - 65 G", price: 0 },
    { name: "PAN MINON BLANDO", price: 0 },
    { name: "PAN MINON BLANDO CON SESAMO", price: 0 },
    { name: "PAN DE PANCHO", price: 0 }
  ];

  showSpinner('Inicializando productos...');
  try {
    // Get existing products
    const snapshot = await getProductsRef().once('value');
    const existingProducts = snapshot.val() || {};
    
    // Create a map of existing products by name (lowercase) to their IDs
    const existingProductsMap = {};
    Object.entries(existingProducts).forEach(([id, product]) => {
      existingProductsMap[product.name.toLowerCase()] = { id, ...product };
    });

    let added = 0;
    let updated = 0;

    for (const product of defaultProducts) {
      const productNameLower = product.name.toLowerCase();
      
      // If product exists, update only the price
      if (existingProductsMap[productNameLower]) {
        await updateProduct(existingProductsMap[productNameLower].id, {
          price: product.price
        });
        updated++;
      } else {
        // If product doesn't exist, create it
        await createProduct({
          name: product.name,
          price: product.price,
          active: true
        });
        added++;
      }
    }

    hideSpinner();
    let message = '';
    if (added > 0 && updated > 0) {
      message = `Se agregaron ${added} productos y se actualizaron ${updated} productos existentes.`;
    } else if (added > 0) {
      message = `Se agregaron ${added} productos exitosamente.`;
    } else if (updated > 0) {
      message = `Se actualizaron ${updated} productos existentes.`;
    }
    
    if (message) {
      await showSuccess(message);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al inicializar productos: ' + error.message);
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

