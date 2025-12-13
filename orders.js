// Order management

let ordersListener = null;
let currentOrderProducts = [];
let currentOrderClient = null;

// Load orders
function loadOrders() {
  const ordersList = document.getElementById('orders-list');
  ordersList.innerHTML = '';

  // Remove previous listener
  if (ordersListener) {
    getOrdersRef().off('value', ordersListener);
  }

  // Listen for orders
  ordersListener = getOrdersRef().on('value', (snapshot) => {
    ordersList.innerHTML = '';
    const orders = snapshot.val() || {};

    if (Object.keys(orders).length === 0) {
      ordersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay pedidos registrados</p>';
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
      item.className = 'list-item';
      const date = new Date(order.createdAt);
      item.innerHTML = `
        <div class="list-item-header">
          <div class="list-item-title">${escapeHtml(order.clientName || 'Cliente desconocido')}</div>
          <div>$${parseFloat(order.total || 0).toFixed(2)}</div>
        </div>
        <div class="list-item-meta">
          <div>Fecha: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
          <div>Estado: ${escapeHtml(order.status || 'Pendiente')}</div>
          <div>Productos: ${order.items ? order.items.length : 0}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-primary btn-small view-order" data-id="${id}">Ver</button>
          <button class="btn-danger btn-small delete-order" data-id="${id}">Eliminar</button>
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
  form.classList.remove('hidden');
  currentOrderProducts = [];
  currentOrderClient = null;
  document.getElementById('order-client-select').value = '';
  document.getElementById('order-products-list').innerHTML = '';
  updateOrderTotal();
  loadClientsForOrder();
}

// Hide new order form
function hideNewOrderForm() {
  document.getElementById('new-order-form').classList.add('hidden');
}

// Add product to order
async function addProductToOrder() {
  const products = await loadProductsForOrder();
  if (products.length === 0) {
    alert('No hay productos activos disponibles');
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
    div.className = 'order-product-item';
    const productTotal = (product.price * item.quantity).toFixed(2);
    
    div.innerHTML = `
      <select onchange="updateOrderProduct(${index}, 'productId', this.value)" required>
        ${products.map(p => 
          `<option value="${p.id}" ${p.id === item.productId ? 'selected' : ''}>${escapeHtml(p.name)} - $${parseFloat(p.price).toFixed(2)}</option>`
        ).join('')}
      </select>
      <input type="number" min="1" value="${item.quantity}" onchange="updateOrderProduct(${index}, 'quantity', this.value)" required>
      <div class="product-total">$${productTotal}</div>
      <button type="button" class="remove-product" onclick="removeProductFromOrder(${index})">×</button>
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
    alert('Por favor seleccione un cliente');
    return;
  }

  if (currentOrderProducts.length === 0) {
    alert('Por favor agregue al menos un producto');
    return;
  }

  try {
    // Get client data
    const clientSnapshot = await getClient(clientId);
    const client = clientSnapshot.val();
    if (!client) {
      alert('Cliente no encontrado');
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
    alert('Pedido guardado exitosamente');
  } catch (error) {
    alert('Error al guardar pedido: ' + error.message);
  }
}

// View order detail
async function viewOrder(orderId) {
  try {
    const snapshot = await getOrder(orderId);
    const order = snapshot.val();
    if (!order) {
      alert('Pedido no encontrado');
      return;
    }

    document.getElementById('orders-list').style.display = 'none';
    document.getElementById('new-order-form').classList.add('hidden');
    document.getElementById('order-detail').classList.remove('hidden');

    const date = new Date(order.createdAt);
    const itemsHtml = order.items.map(item => `
      <div class="order-item">
        <div>
          <div>${escapeHtml(item.productName)}</div>
          <div style="font-size: 0.9rem; color: var(--text-secondary);">
            ${item.quantity} x $${parseFloat(item.price).toFixed(2)}
          </div>
        </div>
        <div>$${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');

    document.getElementById('order-detail-content').innerHTML = `
      <div class="order-info">
        <div class="order-info-row">
          <span>Cliente:</span>
          <span>${escapeHtml(order.clientName)}</span>
        </div>
        <div class="order-info-row">
          <span>Fecha:</span>
          <span>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
        </div>
        <div class="order-info-row">
          <span>Estado:</span>
          <span>${escapeHtml(order.status)}</span>
        </div>
      </div>
      <div class="order-items">
        <h4>Productos:</h4>
        ${itemsHtml}
      </div>
      <div class="order-total-row">
        <span>Total:</span>
        <span>$${parseFloat(order.total).toFixed(2)}</span>
      </div>
    `;

    // Store order data for WhatsApp and print
    document.getElementById('order-detail').dataset.orderId = orderId;
    document.getElementById('order-detail').dataset.orderData = JSON.stringify(order);
  } catch (error) {
    alert('Error al cargar pedido: ' + error.message);
  }
}

// Back to orders list
function backToOrders() {
  document.getElementById('orders-list').style.display = 'block';
  document.getElementById('order-detail').classList.add('hidden');
}

// Delete order handler
async function deleteOrderHandler(orderId) {
  if (!confirm('¿Está seguro de eliminar este pedido?')) return;

  try {
    await deleteOrder(orderId);
  } catch (error) {
    alert('Error al eliminar pedido: ' + error.message);
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
      alert('El cliente no tiene teléfono registrado');
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
    alert('Error al generar mensaje de WhatsApp: ' + error.message);
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

