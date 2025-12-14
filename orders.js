// Order management

let ordersListener = null;
let currentOrderProducts = [];
let currentOrderClient = null;

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
          <div>Fecha: ${formatDate24h(date)} ${formatTime24h(date)}</div>
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
  updateOrderTotal();
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
    
    // Remove previous click outside handler if exists
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler);
    }
    
    // Close dropdown when clicking outside
    clickOutsideHandler = (e) => {
      if (resultsDiv && !searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
        resultsDiv.classList.add('hidden');
      }
    };
    document.addEventListener('click', clickOutsideHandler);
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
let searchInputHandler = null;
let clickOutsideHandler = null;

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
  
  // Show results
  resultsDiv.innerHTML = filtered.map(product => `
    <div class="product-search-item px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
         data-product-id="${product.id}" 
         data-product-name="${escapeHtml(product.name)}" 
         data-product-price="${product.price}">
      <div class="font-light text-sm">${escapeHtml(product.name)}</div>
      <div class="text-xs text-gray-600">$${parseFloat(product.price || 0).toFixed(2)}</div>
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

    // Create order
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
    const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
    
    // Format delivery date and time for inputs
    let deliveryDateValue = '';
    let deliveryTimeValue = '12:00';
    if (deliveryDate) {
      const year = deliveryDate.getFullYear();
      const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
      const day = String(deliveryDate.getDate()).padStart(2, '0');
      const hours = String(deliveryDate.getHours()).padStart(2, '0');
      const minutes = String(deliveryDate.getMinutes()).padStart(2, '0');
      deliveryDateValue = `${year}-${month}-${day}`;
      deliveryTimeValue = `${hours}:${minutes}`;
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
        <div class="flex flex-col py-2 sm:py-3 border-b border-gray-200 text-sm sm:text-base gap-2">
          <div class="flex justify-between items-center">
            <span class="text-gray-600 font-light">Fecha de Entrega:</span>
            <input type="date" id="order-detail-delivery-date" value="${deliveryDateValue}"
              class="px-2 py-1 border border-gray-300 focus:outline-none focus:border-red-600 bg-white text-sm rounded">
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600 font-light">Hora de Entrega:</span>
            <input type="time" id="order-detail-delivery-time" value="${deliveryTimeValue}" step="60"
              class="px-2 py-1 border border-gray-300 focus:outline-none focus:border-red-600 bg-white text-sm rounded">
          </div>
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
    
    // Attach delivery date and time change handlers
    const deliveryDateInput = document.getElementById('order-detail-delivery-date');
    const deliveryTimeInput = document.getElementById('order-detail-delivery-time');
    
    const updateDeliveryDateTime = async () => {
      const dateValue = deliveryDateInput ? deliveryDateInput.value : '';
      const timeValue = deliveryTimeInput ? deliveryTimeInput.value : '12:00';
      
      let newDeliveryDate = null;
      if (dateValue) {
        const dateTimeString = `${dateValue}T${timeValue}`;
        newDeliveryDate = new Date(dateTimeString).getTime();
      }
      
      showSpinner('Actualizando fecha de entrega...');
      try {
        await updateOrder(orderId, { deliveryDate: newDeliveryDate });
        hideSpinner();
        // Update stored order data
        order.deliveryDate = newDeliveryDate;
        document.getElementById('order-detail').dataset.orderData = JSON.stringify(order);
        await showSuccess('Fecha de entrega actualizada');
      } catch (error) {
        hideSpinner();
        await showError('Error al actualizar fecha de entrega: ' + error.message);
      }
    };
    
    if (deliveryDateInput) {
      deliveryDateInput.addEventListener('change', updateDeliveryDateTime);
    }
    if (deliveryTimeInput) {
      deliveryTimeInput.addEventListener('change', updateDeliveryDateTime);
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
    
    // Aggregate products by name
    const productSummary = {};
    
    Object.values(orders).forEach(order => {
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
    
    // Generate PDF
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
    
    // Date
    doc.setFontSize(fontSize);
    const reportDate = new Date();
    const dateText = `Fecha: ${formatDate24h(reportDate)} ${formatTime24h(reportDate)}`;
    doc.text(dateText, margin, yPos);
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
    const filename = `Reporte_Productos_${formatDate24h(reportDate).replace(/\//g, '-')}.pdf`;
    
    // Save PDF
    doc.save(filename);
    await showSuccess('Reporte generado exitosamente');
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

// Make functions available globally for inline handlers
window.updateOrderProduct = updateOrderProduct;
window.removeProductFromOrder = removeProductFromOrder;

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

