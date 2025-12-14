// Order management

let ordersListener = null;
let currentOrderProducts = [];
let currentOrderClient = null;

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

    sortedOrders.forEach(([id, order]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.orderId = id;
      const date = new Date(order.createdAt);
      item.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(order.clientName || 'Cliente desconocido')}</div>
          <div class="text-base sm:text-lg font-light text-red-600">$${parseFloat(order.total || 0).toFixed(2)}</div>
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Fecha: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
          <div>Estado: ${escapeHtml(order.status || 'Pendiente')}</div>
          <div>Productos: ${order.items ? order.items.length : 0}</div>
        </div>
      `;
      item.addEventListener('click', () => viewOrder(id));
      ordersList.appendChild(item);
    });
  });
}

// Show new order form
async function showNewOrderForm() {
  const form = document.getElementById('new-order-form');
  const list = document.getElementById('orders-list');
  const header = document.querySelector('#orders-view .flex.flex-col');
  
  form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  
  currentOrderProducts = [];
  currentOrderClient = null;
  document.getElementById('order-client-select').value = '';
  document.getElementById('order-products-list').innerHTML = '';
  document.getElementById('product-search-input').value = '';
  document.getElementById('product-search-results').classList.add('hidden');
  document.getElementById('order-notes').value = '';
  
  await loadAvailableProducts();
  updateOrderTotal();
  loadClientsForOrder();
  
  // Setup product search input
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(productSearchTimeout);
      productSearchTimeout = setTimeout(() => {
        searchProducts(e.target.value);
      }, 200);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !document.getElementById('product-search-results').contains(e.target)) {
        document.getElementById('product-search-results').classList.add('hidden');
      }
    });
  }
}

// Hide new order form
function hideNewOrderForm() {
  const form = document.getElementById('new-order-form');
  const list = document.getElementById('orders-list');
  const header = document.querySelector('#orders-view .flex.flex-col');
  
  form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
}

// Product search functionality
let availableProducts = [];
let productSearchTimeout = null;

// Load available products for search
async function loadAvailableProducts() {
  availableProducts = await loadProductsForOrder();
}

// Search products
function searchProducts(query) {
  const searchInput = document.getElementById('product-search-input');
  const resultsDiv = document.getElementById('product-search-results');
  
  if (!searchInput || !resultsDiv) return;
  
  const searchTerm = query.toLowerCase().trim();
  
  if (searchTerm.length === 0) {
    resultsDiv.classList.add('hidden');
    return;
  }
  
  // Filter products
  const filtered = availableProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm)
  );
  
  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">No se encontraron productos</div>';
    resultsDiv.classList.remove('hidden');
    return;
  }
  
  // Show results
  resultsDiv.innerHTML = filtered.map(product => `
    <div class="product-search-item px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
         data-product-id="${product.id}" 
         data-product-name="${escapeHtml(product.name)}" 
         data-product-price="${product.price}">
      <div class="font-light text-sm">${escapeHtml(product.name)}</div>
      <div class="text-xs text-gray-600">$${parseFloat(product.price).toFixed(2)}</div>
    </div>
  `).join('');
  
  resultsDiv.classList.remove('hidden');
  
  // Attach click handlers
  document.querySelectorAll('.product-search-item').forEach(item => {
    item.addEventListener('click', () => {
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
      searchInput.value = '';
      resultsDiv.classList.add('hidden');
    });
  });
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

    // Create order
    const orderData = {
      clientId,
      clientName: client.name,
      createdAt: Date.now(),
      status: 'Pendiente',
      items,
      total,
      notes: notes || null
    };

    showSpinner('Guardando pedido...');
    await createOrder(orderData);
    hideSpinner();
    hideNewOrderForm();
    await showSuccess('Pedido guardado exitosamente');
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
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    document.getElementById('order-detail').classList.remove('hidden');

    const date = new Date(order.createdAt);
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
          <span class="text-gray-600 font-light">Fecha:</span>
          <span class="font-light">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200 text-sm sm:text-base">
          <span class="text-gray-600 font-light">Estado:</span>
          <span class="font-light">${escapeHtml(order.status)}</span>
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
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
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
    let message = `*Pedido - ${escapeHtml(orderData.clientName)}*\n\n`;
    message += `*Productos:*\n`;
    orderData.items.forEach(item => {
      message += `• ${escapeHtml(item.productName)} - ${item.quantity} x $${parseFloat(item.price).toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    if (orderData.notes) {
      message += `\n*Observaciones:*\n${escapeHtml(orderData.notes)}\n`;
    }
    message += `\n*Total: $${parseFloat(orderData.total).toFixed(2)}*\n`;
    message += `\nFecha: ${new Date(orderData.createdAt).toLocaleString()}`;

    // Clean phone number (remove spaces, dashes, etc.)
    const phone = client.phone.replace(/\D/g, '');
    
    // Open WhatsApp
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  } catch (error) {
    hideSpinner();
    await showError('Error al generar mensaje de WhatsApp: ' + error.message);
  }
}

// Print order
function printOrder() {
  window.print();
}

// Event listeners
document.getElementById('new-order-btn').addEventListener('click', showNewOrderForm);
document.getElementById('cancel-order-btn').addEventListener('click', hideNewOrderForm);
document.getElementById('save-order-btn').addEventListener('click', saveOrder);
document.getElementById('back-to-orders').addEventListener('click', backToOrders);
document.getElementById('close-order-form').addEventListener('click', hideNewOrderForm);
document.getElementById('whatsapp-order-btn').addEventListener('click', sendWhatsAppMessage);
document.getElementById('print-order-btn').addEventListener('click', printOrder);

// Make functions available globally for inline handlers
window.updateOrderProduct = updateOrderProduct;
window.removeProductFromOrder = removeProductFromOrder;

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

