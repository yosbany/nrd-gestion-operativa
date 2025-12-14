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
      const date = new Date(order.createdAt);
      item.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(order.clientName || 'Cliente desconocido')}</div>
          <div class="text-base sm:text-lg font-light">$${parseFloat(order.total || 0).toFixed(2)}</div>
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Fecha: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
          <div>Estado: ${escapeHtml(order.status || 'Pendiente')}</div>
          <div>Productos: ${order.items ? order.items.length : 0}</div>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <button class="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white border border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-xs font-light view-order" data-id="${id}">Ver</button>
          <button class="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-xs font-light delete-order" data-id="${id}">Eliminar</button>
        </div>
      `;
      ordersList.appendChild(item);
    });

    // Attach event listeners
    document.querySelectorAll('.view-order').forEach(btn => {
      btn.addEventListener('click', (e) => viewOrder(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-order').forEach(btn => {
      btn.addEventListener('click', (e) => deleteOrderHandler(e.target.dataset.id));
    });
  });
}

// Show new order form
function showNewOrderForm() {
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
  updateOrderTotal();
  loadClientsForOrder();
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

// Add product to order
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
    div.className = 'flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center py-2 sm:py-3 border border-gray-200 rounded p-2 sm:p-3 bg-gray-50';
    const productTotal = (product.price * item.quantity).toFixed(2);
    
    div.innerHTML = `
      <select onchange="updateOrderProduct(${index}, 'productId', this.value)" required 
        class="flex-1 sm:flex-2 px-2 py-2 border border-gray-300 focus:outline-none focus:border-red-600 bg-white text-sm sm:text-base rounded">
        ${products.map(p => 
          `<option value="${p.id}" ${p.id === item.productId ? 'selected' : ''}>${escapeHtml(p.name)} - $${parseFloat(p.price).toFixed(2)}</option>`
        ).join('')}
      </select>
      <div class="flex items-center gap-2">
        <label class="text-xs text-gray-600 sm:hidden">Cant:</label>
        <input type="number" min="1" value="${item.quantity}" onchange="updateOrderProduct(${index}, 'quantity', this.value)" required 
          class="flex-1 sm:flex-none sm:max-w-20 px-2 py-2 border border-gray-300 focus:outline-none focus:border-red-600 bg-white text-center text-sm sm:text-base rounded">
      </div>
      <div class="flex-1 text-left sm:text-right font-light text-sm sm:text-base text-red-600 font-medium">$${productTotal}</div>
      <button type="button" class="self-start sm:self-auto px-3 py-1.5 border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors text-base sm:text-lg font-light rounded remove-product" onclick="removeProductFromOrder(${index})">×</button>
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

    // Create order
    const orderData = {
      clientId,
      clientName: client.name,
      createdAt: Date.now(),
      status: 'Pendiente',
      items,
      total
    };

    await createOrder(orderData);
    hideNewOrderForm();
    await showSuccess('Pedido guardado exitosamente');
  } catch (error) {
    await showError('Error al guardar pedido: ' + error.message);
  }
}

// View order detail
async function viewOrder(orderId) {
  try {
    const snapshot = await getOrder(orderId);
    const order = snapshot.val();
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
      <div class="flex justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-red-600 text-lg sm:text-xl font-light">
        <span>Total:</span>
        <span>$${parseFloat(order.total).toFixed(2)}</span>
      </div>
    `;

    // Store order data for WhatsApp and print
    document.getElementById('order-detail').dataset.orderId = orderId;
    document.getElementById('order-detail').dataset.orderData = JSON.stringify(order);
  } catch (error) {
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

  try {
    await deleteOrder(orderId);
  } catch (error) {
    await showError('Error al eliminar pedido: ' + error.message);
  }
}

// Send WhatsApp message
async function sendWhatsAppMessage() {
  const orderDetail = document.getElementById('order-detail');
  const orderData = JSON.parse(orderDetail.dataset.orderData);
  const orderId = orderDetail.dataset.orderId;

  try {
    // Get client data
    const clientSnapshot = await getClient(orderData.clientId);
    const client = clientSnapshot.val();
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
    message += `\n*Total: $${parseFloat(orderData.total).toFixed(2)}*\n`;
    message += `\nFecha: ${new Date(orderData.createdAt).toLocaleString()}`;

    // Clean phone number (remove spaces, dashes, etc.)
    const phone = client.phone.replace(/\D/g, '');
    
    // Open WhatsApp
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  } catch (error) {
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
document.getElementById('add-product-to-order').addEventListener('click', addProductToOrder);
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

