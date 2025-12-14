// Order management

let ordersListener = null;
let currentOrderProducts = [];
let currentOrderClient = null;
let selectedFilterDate = new Date(); // Default to today

// Predefined orders templates
const predefinedOrders = {
  'oferta-5': {
    name: 'Oferta para 5 personas',
    items: [
      { productName: 'SANDWICH COPETIN - JAMON Y QUESO', quantity: 16 },
      { productName: 'SANDWICH COPETIN - ATUN Y TOMATE', quantity: 16 },
      { productName: 'SANDWICH COPETIN - POLLO Y JARDINERA', quantity: 16 },
      { productName: 'SANDWICH COPETIN - LOMITO Y MANTECA', quantity: 16 },
      { productName: 'BOCADITOS DE PIZZA', quantity: 10 },
      { productName: 'EMPANADITAS - POLLO', quantity: 10 },
      { productName: 'MEDIALUNITAS - JAMON Y QUESO', quantity: 8 },
      { productName: 'ALEMANITAS', quantity: 8 }
    ]
  },
  'oferta-10': {
    name: 'Oferta para 10 personas',
    items: [
      { productName: 'SANDWICH COPETIN - JAMON Y CHOCLO', quantity: 32 },
      { productName: 'SANDWICH COPETIN - OLIMPICO', quantity: 32 },
      { productName: 'SANDWICH COPETIN - BONDIOLA Y MANTECA', quantity: 32 },
      { productName: 'SANDWICH COPETIN - JAMON Y PALMITOS', quantity: 32 },
      { productName: 'BOCADITOS DE PIZZA', quantity: 20 },
      { productName: 'EMPANADITAS - CARNE', quantity: 20 },
      { productName: 'BOCADITOS DE TARTA - JAMON Y QUESO', quantity: 20 },
      { productName: 'Yoyocitos', quantity: 12 }
    ]
  },
  'oferta-15': {
    name: 'Oferta para 15 personas',
    items: [
      { productName: 'SANDWICH COPETIN - JAMON Y QUESO', quantity: 48 },
      { productName: 'SANDWICH COPETIN - ATUN Y TOMATE', quantity: 48 },
      { productName: 'SANDWICH COPETIN - JAMON Y HUEVO', quantity: 48 },
      { productName: 'SANDWICH COPETIN - LOMITO Y MANTECA', quantity: 48 },
      { productName: 'BOCADITOS DE PIZZA', quantity: 30 },
      { productName: 'MEDIALUNITAS - JAMON Y QUESO', quantity: 24 },
      { productName: 'Brochetitas Pollo', quantity: 30 },
      { productName: 'Donitas', quantity: 24 }
    ]
  }
};

// Format date in 24-hour format
function formatDate24h(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format time in 24-hour format
function formatTime24h(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Load orders
function loadOrders() {
  const ordersList = document.getElementById('orders-list');
  if (!ordersList) return;
  
  ordersList.innerHTML = '';

  // Remove previous listener
  if (ordersListener) {
    getOrdersRef().off('value', ordersListener);
    ordersListener = null;
  }

  // Listen for orders
  ordersListener = getOrdersRef().on('value', (snapshot) => {
    if (!ordersList) return;
    ordersList.innerHTML = '';
    const orders = snapshot.val() || {};

    if (Object.keys(orders).length === 0) {
      ordersList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No hay pedidos registrados</p>';
      return;
    }

    // Sort by creation date (newest first)
    const sortedOrders = Object.entries(orders).sort((a, b) => {
      const dateA = a[1].createdAt || 0;
      const dateB = b[1].createdAt || 0;
      return dateB - dateA;
    });

    // Filter orders by date if filter is active
    let ordersToShow = sortedOrders;
    if (selectedFilterDate) {
      const filterDateStart = new Date(selectedFilterDate.getFullYear(), selectedFilterDate.getMonth(), selectedFilterDate.getDate(), 0, 0, 0, 0).getTime();
      const filterDateEnd = new Date(selectedFilterDate.getFullYear(), selectedFilterDate.getMonth(), selectedFilterDate.getDate(), 23, 59, 59, 999).getTime();
      
      ordersToShow = sortedOrders.filter(([id, order]) => {
        if (!order.deliveryDate) return false;
        const deliveryDate = order.deliveryDate;
        return deliveryDate >= filterDateStart && deliveryDate <= filterDateEnd;
      });
    }
    
    sortedOrders.forEach(([id, order]) => {
      // Check if delivery date has passed and update status automatically
      const currentStatus = order.status || 'Pendiente';
      if (currentStatus === 'Pendiente' && order.deliveryDate) {
        const deliveryDate = new Date(order.deliveryDate);
        const now = new Date();
        if (deliveryDate < now) {
          // Update status to Completado (async, don't wait)
          updateOrder(id, { status: 'Completado' }).catch(error => {
            console.error('Error updating order status:', error);
          });
          order.status = 'Completado';
        }
      }
    });
    
    // Show filtered orders
    if (ordersToShow.length === 0) {
      ordersList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No hay pedidos para la fecha seleccionada</p>';
      return;
    }
    
    ordersToShow.forEach(([id, order]) => {

      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors relative';
      item.dataset.orderId = id;
      const date = new Date(order.createdAt);
      const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
      const status = order.status || 'Pendiente';
      const statusColor = status === 'Completado' ? 'text-green-600' : 'text-red-600';
      
      // Format delivery date
      let deliveryDateStr = 'No especificada';
      if (deliveryDate) {
        deliveryDateStr = `${formatDate24h(deliveryDate)} ${formatTime24h(deliveryDate)}`;
      }
      
      item.innerHTML = `
        ${status === 'Pendiente' ? `
        <button class="complete-order-card-btn absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-green-600 text-white rounded shadow-md hover:bg-green-700 transition-colors uppercase tracking-wider text-xs font-light z-10"
                data-order-id="${id}"
                onclick="event.stopPropagation(); toggleOrderStatus('${id}', '${status}')">
          ✓
        </button>
        ` : ''}
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(order.clientName || 'Cliente desconocido')}</div>
          <div class="hidden sm:block text-base sm:text-lg font-light text-red-600">$${parseFloat(order.total || 0).toFixed(2)}</div>
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Fecha entrega: ${deliveryDateStr}</div>
          <div>
            <span class="px-2 py-0.5 ${status === 'Completado' ? 'bg-green-600' : 'bg-red-600'} text-white text-xs font-medium uppercase rounded">
              ${status === 'Completado' ? 'COMPLETADO' : 'PENDIENTE'}
            </span>
          </div>
          <div>Productos: ${order.items ? order.items.length : 0}</div>
          <div class="sm:hidden text-base font-light text-red-600">$${parseFloat(order.total || 0).toFixed(2)}</div>
        </div>
      `;
      
      // Make the card clickable (except for the complete button)
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.complete-order-card-btn')) {
          viewOrder(id);
        }
      });
      
      ordersList.appendChild(item);
    });
  });
}

// Show new order form
async function showNewOrderForm() {
  // First show modal to select predefined order or start blank
  const selectedPredefined = await showPredefinedOrdersModal();
  
  const form = document.getElementById('new-order-form');
  const list = document.getElementById('orders-list');
  const header = document.querySelector('#orders-view .flex.flex-col');
  const dateFilter = document.getElementById('date-filter-container');
  
  form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (dateFilter) dateFilter.style.display = 'none';
  
  // Clear editing state
  delete form.dataset.editingOrderId;
  
  // Reset form title
  const formTitle = document.querySelector('#new-order-form h3');
  if (formTitle) {
    formTitle.textContent = 'Nuevo Pedido';
  }
  
  // Reset save button text
  const saveBtn = document.getElementById('save-order-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Guardar';
  }
  
  currentOrderProducts = [];
  currentOrderClient = null;
  document.getElementById('order-client-select').value = '';
  document.getElementById('order-products-list').innerHTML = '';
  document.getElementById('product-search-input').value = '';
  document.getElementById('product-search-results').classList.add('hidden');
  document.getElementById('order-notes').value = '';
  
  // Set default delivery date (tomorrow)
  const deliveryDateInput = document.getElementById('order-delivery-date');
  const deliveryTimeInput = document.getElementById('order-delivery-time');
  
  if (deliveryDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Format for date input (YYYY-MM-DD)
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    deliveryDateInput.value = `${year}-${month}-${day}`;
  }
  
  // Set default delivery time (12:00)
  if (deliveryTimeInput) {
    deliveryTimeInput.value = '12:00';
  }
  
  await loadAvailableProducts();
  
  // If predefined order selected, load its products
  // Empty string means create empty order, null means cancelled
  if (selectedPredefined === null) {
    // User cancelled, don't show form
    hideNewOrderForm();
    return;
  }
  
  if (selectedPredefined && predefinedOrders[selectedPredefined]) {
    await loadPredefinedOrder(selectedPredefined);
  } else {
    // Empty order (selectedPredefined === '')
    updateOrderTotal();
  }
  
  loadClientsForOrder();
  
  // Setup product search input - remove old listeners first
  const searchInput = document.getElementById('product-search-input');
  const resultsDiv = document.getElementById('product-search-results');
  
  if (searchInput) {
    // Remove previous listener if exists
    if (searchInputHandler) {
      searchInput.removeEventListener('input', searchInputHandler);
    }
    
    // Add new listener
    searchInputHandler = (e) => {
      clearTimeout(productSearchTimeout);
      productSearchTimeout = setTimeout(() => {
        searchProducts(e.target.value);
      }, 200);
    };
    searchInput.addEventListener('input', searchInputHandler);
    
    // Scroll to top when focusing on mobile to avoid keyboard covering the input
    searchInput.addEventListener('focus', () => {
      // Small delay to ensure the keyboard animation starts
      setTimeout(() => {
        // Scroll to the top of the page or header to ensure input is fully visible
        const header = document.querySelector('header');
        if (header) {
          header.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback: scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    });
    
    // Keyboard navigation for product search
    if (keyboardHandler) {
      searchInput.removeEventListener('keydown', keyboardHandler);
    }
    
    keyboardHandler = (e) => {
      const items = document.querySelectorAll('.product-search-item');
      
      if (items.length === 0) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedProductIndex = (selectedProductIndex + 1) % items.length;
        updateProductSelection(items);
        scrollToSelectedItem(items[selectedProductIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedProductIndex = selectedProductIndex <= 0 ? items.length - 1 : selectedProductIndex - 1;
        updateProductSelection(items);
        scrollToSelectedItem(items[selectedProductIndex]);
      } else if (e.key === 'Enter' && selectedProductIndex >= 0) {
        e.preventDefault();
        const selectedItem = items[selectedProductIndex];
        if (selectedItem) {
          addProductFromSearch(selectedItem);
        }
      } else if (e.key === 'Escape') {
        resultsDiv.classList.add('hidden');
        selectedProductIndex = -1;
      }
    };
    
    searchInput.addEventListener('keydown', keyboardHandler);
    
    // Remove previous click outside handler if exists
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler);
    }
    
    // Close dropdown when clicking outside
    clickOutsideHandler = (e) => {
      if (resultsDiv && !searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
        resultsDiv.classList.add('hidden');
        selectedProductIndex = -1;
      }
    };
    document.addEventListener('click', clickOutsideHandler);
  }
}

// Update product selection highlighting
function updateProductSelection(items) {
  items.forEach((item, index) => {
    if (index === selectedProductIndex) {
      item.classList.add('bg-red-50', 'border-red-200');
      item.classList.remove('hover:bg-gray-50');
    } else {
      item.classList.remove('bg-red-50', 'border-red-200');
      item.classList.add('hover:bg-gray-50');
    }
  });
}

// Scroll to selected item in dropdown
function scrollToSelectedItem(item) {
  if (!item) return;
  const resultsDiv = document.getElementById('product-search-results');
  if (!resultsDiv) return;
  
  const itemTop = item.offsetTop;
  const itemBottom = itemTop + item.offsetHeight;
  const containerTop = resultsDiv.scrollTop;
  const containerBottom = containerTop + resultsDiv.offsetHeight;
  
  if (itemTop < containerTop) {
    resultsDiv.scrollTop = itemTop;
  } else if (itemBottom > containerBottom) {
    resultsDiv.scrollTop = itemBottom - resultsDiv.offsetHeight;
  }
}

// Load predefined order
async function loadPredefinedOrder(orderId) {
  const predefined = predefinedOrders[orderId];
  if (!predefined) return;
  
  showSpinner('Cargando productos...');
  try {
    // Load all products
    const products = await loadProductsForOrder();
    const productMap = {};
    products.forEach(p => {
      productMap[p.name.toLowerCase()] = p;
    });
    
    // Match predefined items with actual products
    currentOrderProducts = [];
    for (const item of predefined.items) {
      // Try to find product by name (case insensitive, partial match)
      const productNameLower = item.productName.toLowerCase();
      let foundProduct = null;
      
      // First try exact match
      if (productMap[productNameLower]) {
        foundProduct = productMap[productNameLower];
      } else {
        // Try partial match
        for (const [key, product] of Object.entries(productMap)) {
          if (productNameLower.includes(key) || key.includes(productNameLower)) {
            foundProduct = product;
            break;
          }
        }
      }
      
      if (foundProduct) {
        currentOrderProducts.push({
          productId: foundProduct.id,
          quantity: item.quantity
        });
      } else {
        console.warn('Product not found:', item.productName);
      }
    }
    
    // Render products
    await renderOrderProducts();
    await updateOrderTotal();
    hideSpinner();
  } catch (error) {
    hideSpinner();
    console.error('Error loading predefined order:', error);
    await showError('Error al cargar pedido precargado: ' + error.message);
  }
}

// Hide new order form
function hideNewOrderForm() {
  const form = document.getElementById('new-order-form');
  const list = document.getElementById('orders-list');
  const header = document.querySelector('#orders-view .flex.flex-col');
  const dateFilter = document.getElementById('date-filter-container');
  
  form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (dateFilter) dateFilter.style.display = 'flex';
}

// Product search functionality
let availableProducts = [];
let productSearchTimeout = null;
let searchInputHandler = null;
let clickOutsideHandler = null;
let keyboardHandler = null;
let selectedProductIndex = -1;
let filteredProducts = [];

// Load available products for search
async function loadAvailableProducts() {
  try {
    availableProducts = await loadProductsForOrder();
    console.log('Products loaded for search:', availableProducts.length);
  } catch (error) {
    console.error('Error loading products for search:', error);
    availableProducts = [];
  }
}

// Search products
function searchProducts(query) {
  const searchInput = document.getElementById('product-search-input');
  const resultsDiv = document.getElementById('product-search-results');
  
  if (!searchInput || !resultsDiv) {
    console.error('Search elements not found');
    return;
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  if (searchTerm.length === 0) {
    resultsDiv.classList.add('hidden');
    return;
  }
  
  // Filter products
  const filtered = availableProducts.filter(product => 
    product.name && product.name.toLowerCase().includes(searchTerm)
  );
  
  console.log('Search query:', searchTerm, 'Found:', filtered.length, 'products');
  
  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">No se encontraron productos</div>';
    resultsDiv.classList.remove('hidden');
    return;
  }
  
  // Store filtered products for keyboard navigation
  filteredProducts = filtered;
  selectedProductIndex = -1;
  
  // Show results
  resultsDiv.innerHTML = filtered.map((product, index) => `
    <div class="product-search-item px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === selectedProductIndex ? 'bg-red-50 border-red-200' : ''}" 
         data-product-id="${product.id}" 
         data-product-name="${escapeHtml(product.name)}" 
         data-product-price="${product.price}"
         data-index="${index}">
      <div class="font-light text-sm">${escapeHtml(product.name)}</div>
      <div class="text-xs text-gray-600">$${parseFloat(product.price || 0).toFixed(2)}</div>
    </div>
  `).join('');
  
  resultsDiv.classList.remove('hidden');
  
  // Attach click handlers
  document.querySelectorAll('.product-search-item').forEach(item => {
    item.addEventListener('click', () => {
      addProductFromSearch(item);
    });
  });
}

// Add product from search (used by both click and keyboard)
function addProductFromSearch(item) {
  const productId = item.dataset.productId;
  const productName = item.dataset.productName;
  const productPrice = parseFloat(item.dataset.productPrice);
  
  // Check if product already added
  if (currentOrderProducts.find(p => p.productId === productId)) {
    showError('Este producto ya está en el pedido');
    return;
  }
  
  // Add product
  currentOrderProducts.push({
    productId,
    quantity: 1
  });
  
  renderOrderProducts();
  updateOrderTotal();
  
  // Clear search
  const searchInput = document.getElementById('product-search-input');
  const resultsDiv = document.getElementById('product-search-results');
  if (searchInput) searchInput.value = '';
  if (resultsDiv) resultsDiv.classList.add('hidden');
  selectedProductIndex = -1;
}

// Add product to order (kept for compatibility)
async function addProductToOrder() {
  const products = await loadProductsForOrder();
  if (products.length === 0) {
    await showError('No hay productos activos disponibles');
    return;
  }

  const productId = products[0].id;
  currentOrderProducts.push({
    productId,
    quantity: 1
  });
  renderOrderProducts();
  updateOrderTotal();
}

// Remove product from order
function removeProductFromOrder(index) {
  currentOrderProducts.splice(index, 1);
  renderOrderProducts();
  updateOrderTotal();
}

// Update product in order
function updateOrderProduct(index, field, value) {
  if (field === 'productId') {
    currentOrderProducts[index].productId = value;
  } else if (field === 'quantity') {
    const qty = parseInt(value) || 1;
    currentOrderProducts[index].quantity = qty > 0 ? qty : 1;
  }
  renderOrderProducts();
  updateOrderTotal();
}

// Render order products
async function renderOrderProducts() {
  const container = document.getElementById('order-products-list');
  container.innerHTML = '';

  const products = await loadProductsForOrder();
  const productMap = {};
  products.forEach(p => productMap[p.id] = p);

  currentOrderProducts.forEach((item, index) => {
    const product = productMap[item.productId];
    if (!product) return;

    const div = document.createElement('div');
    div.className = 'flex flex-col gap-2 sm:gap-3 py-2 sm:py-3 border border-gray-200 rounded p-2 sm:p-3 bg-gray-50';
    const productTotal = (product.price * item.quantity).toFixed(2);
    
    div.innerHTML = `
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
        <select onchange="updateOrderProduct(${index}, 'productId', this.value)" required 
          class="flex-1 sm:flex-2 px-2 py-2 border border-gray-300 focus:outline-none focus:border-red-600 bg-white text-sm sm:text-base rounded">
          ${products.map(p => 
            `<option value="${p.id}" ${p.id === item.productId ? 'selected' : ''}>${escapeHtml(p.name)} - $${parseFloat(p.price).toFixed(2)}</option>`
          ).join('')}
        </select>
        <input type="number" min="1" value="${item.quantity}" onchange="updateOrderProduct(${index}, 'quantity', this.value)" required 
          class="flex-1 sm:flex-none sm:max-w-20 px-2 py-2 border border-gray-300 focus:outline-none focus:border-red-600 bg-white text-center text-sm sm:text-base rounded">
        <div class="flex-1 text-left sm:text-right font-light text-sm sm:text-base text-red-600 font-medium">$${productTotal}</div>
      </div>
      <button type="button" class="w-full px-4 py-2 border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors text-sm sm:text-base font-light rounded remove-product" onclick="removeProductFromOrder(${index})">Quitar Producto</button>
    `;
    container.appendChild(div);
  });
}

// Update order total
async function updateOrderTotal() {
  const products = await loadProductsForOrder();
  const productMap = {};
  products.forEach(p => productMap[p.id] = p);

  let total = 0;
  currentOrderProducts.forEach(item => {
    const product = productMap[item.productId];
    if (product) {
      total += product.price * item.quantity;
    }
  });

  document.getElementById('order-total').textContent = `$${total.toFixed(2)}`;
}

// Save order
async function saveOrder() {
  const form = document.getElementById('new-order-form');
  const isEditing = form.dataset.editingOrderId;
  
  const clientId = document.getElementById('order-client-select').value;
  if (!clientId) {
    await showError('Por favor seleccione un cliente');
    return;
  }

  if (currentOrderProducts.length === 0) {
    await showError('Por favor agregue al menos un producto');
    return;
  }

  try {
    // Get client data
    const clientSnapshot = await getClient(clientId);
    const client = clientSnapshot.val();
    if (!client) {
      await showError('Cliente no encontrado');
      return;
    }

    // Get products data
    const products = await loadProductsForOrder();
    const productMap = {};
    products.forEach(p => productMap[p.id] = p);

    // Build order items
    const items = currentOrderProducts.map(item => {
      const product = productMap[item.productId];
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price
      };
    });

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get observations
    const notes = document.getElementById('order-notes').value.trim();
    
    // Get delivery date and time
    const deliveryDateInput = document.getElementById('order-delivery-date');
    const deliveryTimeInput = document.getElementById('order-delivery-time');
    let deliveryDate = null;
    
    if (deliveryDateInput && deliveryDateInput.value) {
      const dateValue = deliveryDateInput.value;
      const timeValue = deliveryTimeInput ? deliveryTimeInput.value : '12:00';
      
      // Combine date and time
      const dateTimeString = `${dateValue}T${timeValue}`;
      deliveryDate = new Date(dateTimeString).getTime();
    }

    if (isEditing) {
      // Update existing order
      const orderId = isEditing;
      // Get existing order to preserve createdAt
      const existingOrderSnapshot = await getOrder(orderId);
      const existingOrder = existingOrderSnapshot.val();
      
      const orderData = {
        clientId,
        clientName: client.name,
        createdAt: existingOrder.createdAt, // Preserve original creation date
        status: existingOrder.status || 'Pendiente', // Preserve status
        items,
        total,
        notes: notes || null,
        deliveryDate: deliveryDate
      };

      showSpinner('Actualizando pedido...');
      await updateOrder(orderId, orderData);
      hideSpinner();
      hideNewOrderForm();
      await showSuccess('Pedido actualizado exitosamente');
    } else {
      // Create new order
      const orderData = {
        clientId,
        clientName: client.name,
        createdAt: Date.now(),
        status: 'Pendiente',
        items,
        total,
        notes: notes || null,
        deliveryDate: deliveryDate
      };

      showSpinner('Guardando pedido...');
      await createOrder(orderData);
      hideSpinner();
      hideNewOrderForm();
      await showSuccess('Pedido guardado exitosamente');
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al guardar pedido: ' + error.message);
  }
}

// View order detail
async function viewOrder(orderId) {
  showSpinner('Cargando pedido...');
  try {
    const snapshot = await getOrder(orderId);
    const order = snapshot.val();
    hideSpinner();
    if (!order) {
      await showError('Pedido no encontrado');
      return;
    }

    const list = document.getElementById('orders-list');
    const header = document.querySelector('#orders-view .flex.flex-col');
    const form = document.getElementById('new-order-form');
    const dateFilter = document.getElementById('date-filter-container');
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (dateFilter) dateFilter.style.display = 'none';
    document.getElementById('order-detail').classList.remove('hidden');

    const date = new Date(order.createdAt);
    const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
    
    // Get status and related variables
    const status = order.status || 'Pendiente';
    const statusColor = status === 'Completado' ? 'text-green-600' : 'text-red-600';
    const canEdit = status === 'Pendiente';
    
    // Format delivery date and time for display
    let deliveryDateStr = 'No especificada';
    if (deliveryDate) {
      deliveryDateStr = `${formatDate24h(deliveryDate)} ${formatTime24h(deliveryDate)}`;
    }
    
    const itemsHtml = order.items.map(item => `
      <div class="flex justify-between py-3 sm:py-4 border-b border-gray-200">
        <div class="flex-1">
          <div class="font-light text-sm sm:text-base">${escapeHtml(item.productName)}</div>
          <div class="text-xs sm:text-sm text-gray-600">
            ${item.quantity} x $${parseFloat(item.price).toFixed(2)}
          </div>
        </div>
        <div class="font-light text-sm sm:text-base">$${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');

    document.getElementById('order-detail-content').innerHTML = `
      <div class="py-4 sm:py-6 mb-4 sm:mb-6">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200 text-sm sm:text-base">
          <span class="text-gray-600 font-light">Cliente:</span>
          <span class="font-light">${escapeHtml(order.clientName)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200 text-sm sm:text-base">
          <span class="text-gray-600 font-light">Fecha de Creación:</span>
          <span class="font-light">${formatDate24h(date)} ${formatTime24h(date)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200 text-sm sm:text-base">
          <span class="text-gray-600 font-light">Fecha de Entrega:</span>
          <span class="font-light">${deliveryDateStr}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200 text-sm sm:text-base">
          <span class="text-gray-600 font-light">Estado:</span>
          <span class="font-light ${statusColor} font-medium">${escapeHtml(status)}</span>
        </div>
      </div>
      <div class="mt-4 sm:mt-6">
        <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Productos:</h4>
        ${itemsHtml}
      </div>
      ${order.notes ? `
      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h4 class="mb-2 sm:mb-3 text-xs uppercase tracking-wider text-gray-600">Observaciones:</h4>
        <p class="text-sm sm:text-base font-light text-gray-700 whitespace-pre-wrap">${escapeHtml(order.notes)}</p>
      </div>
      ` : ''}
      <div class="flex justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 text-sm sm:text-base font-light text-gray-600">
        <span>Total:</span>
        <span class="text-gray-700">$${parseFloat(order.total).toFixed(2)}</span>
      </div>
    `;

    // Store order data for WhatsApp and print
    document.getElementById('order-detail').dataset.orderId = orderId;
    document.getElementById('order-detail').dataset.orderData = JSON.stringify(order);
    
    // Show/hide edit button based on status
    const editBtn = document.getElementById('edit-order-btn');
    if (editBtn) {
      if (canEdit) {
        editBtn.classList.remove('hidden');
        editBtn.onclick = () => editOrder(orderId, order);
      } else {
        editBtn.classList.add('hidden');
      }
    }
    
    // Attach delete button handler
    const deleteBtn = document.getElementById('delete-order-detail-btn');
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteOrderHandler(orderId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar pedido: ' + error.message);
  }
}

// Back to orders list
function backToOrders() {
  const list = document.getElementById('orders-list');
  const header = document.querySelector('#orders-view .flex.flex-col');
  const detail = document.getElementById('order-detail');
  const dateFilter = document.getElementById('date-filter-container');
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (dateFilter) dateFilter.style.display = 'flex';
}

// Toggle order status (Pendiente/Completado)
async function toggleOrderStatus(orderId, currentStatus) {
  const newStatus = currentStatus === 'Pendiente' ? 'Completado' : 'Pendiente';
  
  showSpinner('Actualizando estado...');
  try {
    await updateOrder(orderId, { status: newStatus });
    hideSpinner();
    await showSuccess(`Estado actualizado a ${newStatus}`);
    // Reload orders to reflect the change in the list
    loadOrders();
    // If viewing order detail, reload it
    const orderDetail = document.getElementById('order-detail');
    if (orderDetail && !orderDetail.classList.contains('hidden')) {
      await viewOrder(orderId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al actualizar estado: ' + error.message);
  }
}

// Edit order
async function editOrder(orderId, order) {
  // Hide detail view and show form
  document.getElementById('order-detail').classList.add('hidden');
  
  const form = document.getElementById('new-order-form');
  const list = document.getElementById('orders-list');
  const header = document.querySelector('#orders-view .flex.flex-col');
  
  form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  
  // Set form title to indicate editing
  const formTitle = document.querySelector('#new-order-form h3');
  if (formTitle) {
    formTitle.textContent = 'Editar Pedido';
  }
  
  // Store order ID for update
  form.dataset.editingOrderId = orderId;
  
  // Load client
  document.getElementById('order-client-select').value = order.clientId;
  currentOrderClient = order.clientId;
  
  // Load products
  currentOrderProducts = order.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity
  }));
  await renderOrderProducts();
  await updateOrderTotal();
  
  // Load notes
  document.getElementById('order-notes').value = order.notes || '';
  
  // Load delivery date and time
  const deliveryDateInput = document.getElementById('order-delivery-date');
  const deliveryTimeInput = document.getElementById('order-delivery-time');
  
  if (order.deliveryDate && deliveryDateInput && deliveryTimeInput) {
    const deliveryDate = new Date(order.deliveryDate);
    const year = deliveryDate.getFullYear();
    const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
    const day = String(deliveryDate.getDate()).padStart(2, '0');
    const hours = String(deliveryDate.getHours()).padStart(2, '0');
    const minutes = String(deliveryDate.getMinutes()).padStart(2, '0');
    
    deliveryDateInput.value = `${year}-${month}-${day}`;
    deliveryTimeInput.value = `${hours}:${minutes}`;
  }
  
  // Change save button text
  const saveBtn = document.getElementById('save-order-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Actualizar Pedido';
  }
}

// Delete order handler
async function deleteOrderHandler(orderId) {
  const confirmed = await showConfirm('Eliminar Pedido', '¿Está seguro de eliminar este pedido?');
  if (!confirmed) return;

  showSpinner('Eliminando pedido...');
  try {
    await deleteOrder(orderId);
    hideSpinner();
    backToOrders();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar pedido: ' + error.message);
  }
}

// Send WhatsApp message
async function sendWhatsAppMessage() {
  const orderDetail = document.getElementById('order-detail');
  const orderData = JSON.parse(orderDetail.dataset.orderData);
  const orderId = orderDetail.dataset.orderId;

  showSpinner('Preparando mensaje...');
  try {
    // Get client data
    const clientSnapshot = await getClient(orderData.clientId);
    const client = clientSnapshot.val();
    hideSpinner();
    if (!client || !client.phone) {
      await showError('El cliente no tiene teléfono registrado');
      return;
    }

    // Build message
    // Format delivery date with day of week
    let deliveryDateStr = 'No especificada';
    if (orderData.deliveryDate) {
      const deliveryDate = new Date(orderData.deliveryDate);
      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = daysOfWeek[deliveryDate.getDay()];
      const dateStr = deliveryDate.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
      const timeStr = deliveryDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      deliveryDateStr = `${dayName} ${dateStr} ${timeStr}`;
    }
    
    // Build message with new format
    let message = `Pedido para: ${escapeHtml(orderData.clientName)}\n`;
    message += `Fecha entrega: ${deliveryDateStr}\n`;
    
    // Add products
    orderData.items.forEach(item => {
      message += `• ${item.quantity} ${escapeHtml(item.productName)}\n`;
    });
    
    // Add observations if they exist
    if (orderData.notes && orderData.notes.trim()) {
      message += `\n${escapeHtml(orderData.notes)}`;
    }

    // Clean and format phone number
    let phone = client.phone.replace(/\D/g, ''); // Remove all non-digits
    
    // Check if phone starts with +598 or 598
    if (phone.startsWith('598')) {
      phone = phone.substring(3); // Remove 598 prefix
    } else if (phone.startsWith('+598')) {
      phone = phone.substring(4); // Remove +598 prefix
    }
    
    // Remove leading 0 if present
    if (phone.startsWith('0')) {
      phone = phone.substring(1);
    }
    
    // Add +598 prefix
    phone = '598' + phone;
    
    // Validate phone number
    if (!phone || phone.length < 8) {
      await showError('El número de teléfono no es válido');
      return;
    }
    
    // Open WhatsApp
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  } catch (error) {
    hideSpinner();
    await showError('Error al generar mensaje de WhatsApp: ' + error.message);
  }
}

// Print order as PDF (optimized for 80mm thermal printer)
async function printOrder() {
  const orderDetail = document.getElementById('order-detail');
  const orderData = JSON.parse(orderDetail.dataset.orderData);
  
  try {
    // Format delivery date with day of week (same as WhatsApp)
    let deliveryDateStr = 'No especificada';
    if (orderData.deliveryDate) {
      const deliveryDate = new Date(orderData.deliveryDate);
      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = daysOfWeek[deliveryDate.getDay()];
      const dateStr = deliveryDate.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
      const timeStr = formatTime24h(deliveryDate);
      deliveryDateStr = `${dayName} ${dateStr} ${timeStr}`;
    }
    
    // Create PDF using jsPDF - 80mm width (thermal printer size)
    const { jsPDF } = window.jspdf;
    // 80mm = 226.77 points (1mm = 2.83465 points)
    const width = 80 * 2.83465; // 226.77 points
    const height = 297; // A4 height in points (will adjust automatically)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [width, height]
    });
    
    // Set margins for 80mm paper (narrow margins)
    const margin = 10;
    const maxWidth = width - (margin * 2); // Available width
    let yPos = margin + 10;
    const lineHeight = 10;
    const fontSize = 9;
    
    // Helper function to split long text into multiple lines
    function splitText(text, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = doc.getTextWidth(testLine);
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    }
    
    // Title
    doc.setFontSize(fontSize + 2);
    doc.setFont(undefined, 'bold');
    const titleLines = splitText('Pedido para: ' + orderData.clientName, maxWidth);
    titleLines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });
    yPos += 3;
    
    // Delivery date
    doc.setFontSize(fontSize);
    doc.setFont(undefined, 'bold');
    const dateLines = splitText('Fecha entrega: ' + deliveryDateStr, maxWidth);
    dateLines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });
    yPos += 5;
    
    // Products
    doc.setFontSize(fontSize);
    doc.setFont(undefined, 'bold');
    orderData.items.forEach(item => {
      const productText = '• ' + item.quantity + ' ' + item.productName;
      const productLines = splitText(productText, maxWidth);
      productLines.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });
      
      // Check if we need a new page
      if (yPos > height - 30) {
        doc.addPage();
        yPos = margin + 10;
        doc.setFont(undefined, 'bold'); // Keep bold on new page
      }
    });
    
    // Observations
    if (orderData.notes && orderData.notes.trim()) {
      yPos += lineHeight;
      doc.setFont(undefined, 'bold');
      const notesLines = splitText(orderData.notes, maxWidth);
      notesLines.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += lineHeight;
        
        // Check if we need a new page
        if (yPos > height - 30) {
          doc.addPage();
          yPos = margin + 10;
          doc.setFont(undefined, 'bold'); // Keep bold on new page
        }
      });
    }
    
    // Generate filename
    const date = new Date(orderData.createdAt);
    const filename = `Pedido_${orderData.clientName}_${formatDate24h(date).replace(/\//g, '-')}.pdf`;
    
    // Save PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    await showError('Error al generar PDF: ' + error.message);
  }
}

// Generate product summary report
async function generateProductReport() {
  // Show report modal with date picker and action buttons
  const result = await showReportModal();
  
  if (!result) {
    return; // User cancelled
  }
  
  const { selectedDate, action } = result;
  
  showSpinner('Generando reporte...');
  try {
    // Get all orders
    const snapshot = await getOrdersRef().once('value');
    const orders = snapshot.val() || {};
    
    if (Object.keys(orders).length === 0) {
      hideSpinner();
      await showInfo('No hay pedidos para generar el reporte');
      return;
    }
    
    // Parse selected date (YYYY-MM-DD)
    const selectedDateObj = new Date(selectedDate);
    const selectedDateStart = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 0, 0, 0, 0).getTime();
    const selectedDateEnd = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 23, 59, 59, 999).getTime();
    
    // Filter orders by delivery date
    const filteredOrders = Object.values(orders).filter(order => {
      if (!order.deliveryDate) return false;
      const deliveryDate = order.deliveryDate;
      return deliveryDate >= selectedDateStart && deliveryDate <= selectedDateEnd;
    });
    
    if (filteredOrders.length === 0) {
      hideSpinner();
      await showInfo('No hay pedidos con fecha de entrega ' + formatDate24h(selectedDateObj));
      return;
    }
    
    // Aggregate products by name
    const productSummary = {};
    
    filteredOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productName = item.productName;
          if (productSummary[productName]) {
            productSummary[productName] += item.quantity;
          } else {
            productSummary[productName] = item.quantity;
          }
        });
      }
    });
    
    // Sort products by name
    const sortedProducts = Object.entries(productSummary)
      .sort((a, b) => a[0].localeCompare(b[0]));
    
    // Calculate total items
    const totalItems = Object.values(productSummary).reduce((sum, qty) => sum + qty, 0);
    
    hideSpinner();
    
    // Generate PDF if action is print
    if (action === 'print') {
      showSpinner('Generando PDF...');
      const { jsPDF } = window.jspdf;
      // 80mm width for thermal printer
      const width = 80 * 2.83465; // 226.77 points
      const height = 297; // A4 height
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [width, height]
      });
    
      // Set margins
      const margin = 10;
      const maxWidth = width - (margin * 2);
      let yPos = margin + 10;
      const lineHeight = 10;
      const fontSize = 9;
      
      // Helper function to split long text
      function splitText(text, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = doc.getTextWidth(testLine);
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
        return lines;
      }
      
      // Title
      doc.setFontSize(fontSize + 3);
      doc.setFont(undefined, 'bold');
      const titleLines = splitText('REPORTE DE PRODUCTOS', maxWidth);
      titleLines.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });
      yPos += 5;
      
      // Delivery date only
      doc.setFontSize(fontSize);
      doc.setFont(undefined, 'bold');
      const deliveryDateText = `Fecha entrega: ${formatDate24h(selectedDateObj)}`;
      doc.text(deliveryDateText, margin, yPos);
      yPos += lineHeight + 5;
      
      // Products summary
      doc.setFontSize(fontSize);
      doc.setFont(undefined, 'bold');
      
      sortedProducts.forEach(([productName, quantity]) => {
        const productText = `${quantity} x ${productName}`;
        const productLines = splitText(productText, maxWidth);
        productLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });
        
        // Check if we need a new page
        if (yPos > height - 30) {
          doc.addPage();
          yPos = margin + 10;
          doc.setFont(undefined, 'bold');
        }
      });
      
      // Total
      yPos += lineHeight;
      doc.setFontSize(fontSize + 1);
      doc.setFont(undefined, 'bold');
      const totalText = `TOTAL: ${totalItems} productos`;
      doc.text(totalText, margin, yPos);
      
      // Generate filename
      const filename = `Reporte_Productos_${formatDate24h(selectedDateObj).replace(/\//g, '-')}.pdf`;
      
      // Save PDF
      doc.save(filename);
      hideSpinner();
      
      // Small delay to ensure PDF download starts
      await new Promise(resolve => setTimeout(resolve, 300));
      await showSuccess('Reporte generado exitosamente');
    }
    
    // Generate WhatsApp message if action is whatsapp
    if (action === 'whatsapp') {
      // Generate WhatsApp message with same format as PDF
      let message = `REPORTE DE PRODUCTOS\n`;
      message += `Fecha entrega: ${formatDate24h(selectedDateObj)}\n\n`;
      
      // Add products
      sortedProducts.forEach(([productName, quantity]) => {
        message += `${quantity} x ${productName}\n`;
      });
      
      message += `\nTOTAL: ${totalItems} productos`;
      
      // Open WhatsApp (user needs to select contact)
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      await showSuccess('Reporte generado y WhatsApp abierto');
    }
  } catch (error) {
    hideSpinner();
    console.error('Error generating report:', error);
    await showError('Error al generar reporte: ' + error.message);
  }
}

// Event listeners
document.getElementById('new-order-btn').addEventListener('click', showNewOrderForm);
document.getElementById('cancel-order-btn').addEventListener('click', hideNewOrderForm);
document.getElementById('save-order-btn').addEventListener('click', saveOrder);
document.getElementById('back-to-orders').addEventListener('click', backToOrders);
document.getElementById('close-order-form').addEventListener('click', hideNewOrderForm);
document.getElementById('whatsapp-order-btn').addEventListener('click', sendWhatsAppMessage);
document.getElementById('print-order-btn').addEventListener('click', printOrder);
document.getElementById('report-orders-btn').addEventListener('click', generateProductReport);

// Date filter handlers
function updateDateFilterDisplay() {
  const display = document.getElementById('filter-date-display');
  if (!display) return;
  
  if (selectedFilterDate) {
    // Check if it's today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filterDate = new Date(selectedFilterDate);
    filterDate.setHours(0, 0, 0, 0);
    
    if (filterDate.getTime() === today.getTime()) {
      display.textContent = 'Hoy';
    } else {
      display.textContent = formatDate24h(selectedFilterDate);
    }
  } else {
    display.textContent = 'Todas';
  }
}

function setToday() {
  selectedFilterDate = new Date();
  selectedFilterDate.setHours(0, 0, 0, 0);
  updateDateFilterDisplay();
  loadOrders();
}

function setFilterDate(date) {
  selectedFilterDate = date;
  updateDateFilterDisplay();
  loadOrders(); // Reload orders with new filter
}

function prevDate() {
  if (!selectedFilterDate) {
    // If no filter, start with today
    selectedFilterDate = new Date();
    selectedFilterDate.setHours(0, 0, 0, 0);
  } else {
    // Go to previous day
    const prev = new Date(selectedFilterDate);
    prev.setDate(prev.getDate() - 1);
    prev.setHours(0, 0, 0, 0);
    selectedFilterDate = prev;
  }
  updateDateFilterDisplay();
  loadOrders();
}

function nextDate() {
  if (!selectedFilterDate) {
    // If no filter, start with today
    selectedFilterDate = new Date();
    selectedFilterDate.setHours(0, 0, 0, 0);
  } else {
    // Go to next day
    const next = new Date(selectedFilterDate);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    selectedFilterDate = next;
  }
  updateDateFilterDisplay();
  loadOrders();
}

function clearDateFilter() {
  selectedFilterDate = null;
  updateDateFilterDisplay();
  loadOrders();
}

// Initialize date filter display on load
document.addEventListener('DOMContentLoaded', () => {
  // Set default to today
  if (selectedFilterDate) {
    selectedFilterDate.setHours(0, 0, 0, 0);
    updateDateFilterDisplay();
  }
});

document.getElementById('today-date-btn').addEventListener('click', setToday);
document.getElementById('prev-date-btn').addEventListener('click', prevDate);
document.getElementById('next-date-btn').addEventListener('click', nextDate);
document.getElementById('clear-date-filter-btn').addEventListener('click', clearDateFilter);

// Add new client from order form
const addNewClientFromOrderBtn = document.getElementById('add-new-client-from-order-btn');
if (addNewClientFromOrderBtn) {
  addNewClientFromOrderBtn.addEventListener('click', () => {
    // Mark that we're coming from order form
    sessionStorage.setItem('creatingClientFromOrder', 'true');
    // Switch to clients view
    if (typeof switchView === 'function') {
      switchView('clients');
    }
    // Show new client form
    if (typeof showClientForm === 'function') {
      showClientForm();
    }
  });
}

// Make functions available globally for inline handlers
window.updateOrderProduct = updateOrderProduct;
window.removeProductFromOrder = removeProductFromOrder;
window.toggleOrderStatus = toggleOrderStatus;

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

