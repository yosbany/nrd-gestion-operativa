// Client management

let clientsListener = null;

// Load clients
function loadClients() {
  const clientsList = document.getElementById('clients-list');
  clientsList.innerHTML = '';

  // Remove previous listener
  if (clientsListener) {
    getClientsRef().off('value', clientsListener);
  }

  // Listen for clients
  clientsListener = getClientsRef().on('value', (snapshot) => {
    clientsList.innerHTML = '';
    const clients = snapshot.val() || {};

    if (Object.keys(clients).length === 0) {
      clientsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay clientes registrados</p>';
      return;
    }

    Object.entries(clients).forEach(([id, client]) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="list-item-header">
          <div class="list-item-title">${escapeHtml(client.name)}</div>
        </div>
        <div class="list-item-meta">
          <div>Teléfono: ${escapeHtml(client.phone || 'N/A')}</div>
          <div>Dirección: ${escapeHtml(client.address || 'N/A')}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-secondary btn-small edit-client" data-id="${id}">Editar</button>
          <button class="btn-danger btn-small delete-client" data-id="${id}">Eliminar</button>
        </div>
      `;
      clientsList.appendChild(item);
    });

    // Attach event listeners
    document.querySelectorAll('.edit-client').forEach(btn => {
      btn.addEventListener('click', (e) => editClient(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-client').forEach(btn => {
      btn.addEventListener('click', (e) => deleteClientHandler(e.target.dataset.id));
    });
  });
}

// Show client form
function showClientForm(clientId = null) {
  const form = document.getElementById('client-form');
  const title = document.getElementById('client-form-title');
  const formElement = document.getElementById('client-form-element');
  
  form.classList.remove('hidden');
  formElement.reset();
  document.getElementById('client-id').value = clientId || '';

  if (clientId) {
    title.textContent = 'Editar Cliente';
    getClient(clientId).then(snapshot => {
      const client = snapshot.val();
      if (client) {
        document.getElementById('client-name').value = client.name || '';
        document.getElementById('client-phone').value = client.phone || '';
        document.getElementById('client-address').value = client.address || '';
      }
    });
  } else {
    title.textContent = 'Nuevo Cliente';
  }
}

// Hide client form
function hideClientForm() {
  document.getElementById('client-form').classList.add('hidden');
}

// Save client
function saveClient(clientId, clientData) {
  if (clientId) {
    return updateClient(clientId, clientData);
  } else {
    return createClient(clientData);
  }
}

// Edit client
function editClient(clientId) {
  showClientForm(clientId);
}

// Delete client handler
async function deleteClientHandler(clientId) {
  if (!confirm('¿Está seguro de eliminar este cliente?')) return;

  try {
    await deleteClient(clientId);
  } catch (error) {
    alert('Error al eliminar cliente: ' + error.message);
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
    alert('Por favor complete todos los campos requeridos');
    return;
  }

  try {
    await saveClient(clientId || null, { name, phone, address });
    hideClientForm();
  } catch (error) {
    alert('Error al guardar cliente: ' + error.message);
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

