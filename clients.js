// Client management

let clientsListener = null;

// Load clients
function loadClients() {
  const clientsList = document.getElementById('clients-list');
  if (!clientsList) return;
  
  clientsList.innerHTML = '';

  // Remove previous listener
  if (clientsListener) {
    getClientsRef().off('value', clientsListener);
    clientsListener = null;
  }

  // Listen for clients
  clientsListener = getClientsRef().on('value', (snapshot) => {
    if (!clientsList) return;
    clientsList.innerHTML = '';
    const clients = snapshot.val() || {};

    if (Object.keys(clients).length === 0) {
      clientsList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No hay clientes registrados</p>';
      return;
    }

    Object.entries(clients).forEach(([id, client]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.clientId = id;
      item.innerHTML = `
        <div class="flex justify-between items-center mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(client.name)}</div>
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Teléfono: ${escapeHtml(client.phone || 'N/A')}</div>
          <div>Dirección: ${escapeHtml(client.address || 'N/A')}</div>
        </div>
      `;
      item.addEventListener('click', () => viewClient(id));
      clientsList.appendChild(item);
    });
  });
}

// Show client form
function showClientForm(clientId = null) {
  const form = document.getElementById('client-form');
  const list = document.getElementById('clients-list');
  const header = document.querySelector('#clients-view .flex.flex-col');
  const detail = document.getElementById('client-detail');
  const title = document.getElementById('client-form-title');
  const formElement = document.getElementById('client-form-element');
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  
  if (formElement) {
    formElement.reset();
    const clientIdInput = document.getElementById('client-id');
    if (clientIdInput) clientIdInput.value = clientId || '';
  }

  if (clientId) {
    if (title) title.textContent = 'Editar Cliente';
    getClient(clientId).then(snapshot => {
      const client = snapshot.val();
      if (client) {
        const nameInput = document.getElementById('client-name');
        const phoneInput = document.getElementById('client-phone');
        const addressInput = document.getElementById('client-address');
        if (nameInput) nameInput.value = client.name || '';
        if (phoneInput) phoneInput.value = client.phone || '';
        if (addressInput) addressInput.value = client.address || '';
      }
    });
  } else {
    if (title) title.textContent = 'Nuevo Cliente';
  }
}

// Hide client form
function hideClientForm() {
  const form = document.getElementById('client-form');
  const list = document.getElementById('clients-list');
  const header = document.querySelector('#clients-view .flex.flex-col');
  const detail = document.getElementById('client-detail');
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
}

// Save client
function saveClient(clientId, clientData) {
  if (clientId) {
    return updateClient(clientId, clientData);
  } else {
    return createClient(clientData);
  }
}

// View client detail
async function viewClient(clientId) {
  showSpinner('Cargando cliente...');
  try {
    const snapshot = await getClient(clientId);
    const client = snapshot.val();
    hideSpinner();
    if (!client) {
      await showError('Cliente no encontrado');
      return;
    }

    const list = document.getElementById('clients-list');
    const header = document.querySelector('#clients-view .flex.flex-col');
    const form = document.getElementById('client-form');
    const detail = document.getElementById('client-detail');
    const detailContent = document.getElementById('client-detail-content');
    
    if (!detail || !detailContent) {
      await showError('Error: Elemento de detalle no encontrado. Por favor, recarga la página.');
      return;
    }
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');

    detailContent.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(client.name)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Teléfono:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(client.phone || 'N/A')}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Dirección:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(client.address || 'N/A')}</span>
        </div>
      </div>
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-client-detail-btn');
    const deleteBtn = document.getElementById('delete-client-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showClientForm(clientId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteClientHandler(clientId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar cliente: ' + error.message);
  }
}

// Back to clients list
function backToClients() {
  const list = document.getElementById('clients-list');
  const header = document.querySelector('#clients-view .flex.flex-col');
  const detail = document.getElementById('client-detail');
  const form = document.getElementById('client-form');
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
}

// Edit client
function editClient(clientId) {
  showClientForm(clientId);
}

// Delete client handler
async function deleteClientHandler(clientId) {
  const confirmed = await showConfirm('Eliminar Cliente', '¿Está seguro de eliminar este cliente?');
  if (!confirmed) return;

  showSpinner('Eliminando cliente...');
  try {
    await deleteClient(clientId);
    hideSpinner();
    backToClients();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar cliente: ' + error.message);
  }
}

// Client form submit
document.getElementById('client-form-element').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const clientId = document.getElementById('client-id').value;
  const name = document.getElementById('client-name').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const address = document.getElementById('client-address').value.trim();

  if (!name || !phone) {
    await showError('Por favor complete todos los campos requeridos');
    return;
  }

  const isFromOrder = sessionStorage.getItem('creatingClientFromOrder') === 'true';
  
  showSpinner('Guardando cliente...');
  try {
    const result = await saveClient(clientId || null, { name, phone, address });
    hideSpinner();
    
    // If coming from order form, return to order form with client selected
    if (isFromOrder) {
      sessionStorage.removeItem('creatingClientFromOrder');
      
      // Get the new client ID (if it's a new client, result.key will have the ID)
      let newClientId = clientId;
      if (!clientId && result && result.key) {
        newClientId = result.key;
      }
      
      // Switch back to orders view
      if (typeof switchView === 'function') {
        switchView('orders');
      }
      
      // Show new order form
      if (typeof showNewOrderForm === 'function') {
        await showNewOrderForm();
        
        // Wait a bit for the form to render and clients to load
        setTimeout(() => {
          // Reload clients and select the new client
          loadClientsForOrder();
          setTimeout(() => {
            const select = document.getElementById('order-client-select');
            if (select && newClientId) {
              select.value = newClientId;
              // Trigger change event to update currentOrderClient
              const event = new Event('change', { bubbles: true });
              select.dispatchEvent(event);
            }
          }, 300);
        }, 100);
      }
    } else {
      hideClientForm();
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al guardar cliente: ' + error.message);
  }
});

// New client button
document.getElementById('new-client-btn').addEventListener('click', () => {
  showClientForm();
});

// Cancel client form
document.getElementById('cancel-client-btn').addEventListener('click', () => {
  hideClientForm();
});

// Close client form button
document.getElementById('close-client-form').addEventListener('click', () => {
  hideClientForm();
});

// Back to clients button
document.getElementById('back-to-clients').addEventListener('click', () => {
  backToClients();
});

// Load clients for order form
function loadClientsForOrder() {
  const select = document.getElementById('order-client-select');
  select.innerHTML = '<option value="">Seleccionar cliente</option>';

  getClientsRef().once('value', (snapshot) => {
    const clients = snapshot.val() || {};
    Object.entries(clients).forEach(([id, client]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = client.name;
      select.appendChild(option);
    });
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

