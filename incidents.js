// Incident management

let incidentsListener = null;

// Load incidents
function loadIncidents() {
  const incidentsList = document.getElementById('incidents-list');
  if (!incidentsList) return;
  
  incidentsList.innerHTML = '';

  // Remove previous listener
  if (incidentsListener) {
    getIncidentsRef().off('value', incidentsListener);
    incidentsListener = null;
  }

  // Listen for incidents
  incidentsListener = getIncidentsRef().on('value', async (snapshot) => {
    if (!incidentsList) return;
    incidentsList.innerHTML = '';
    const incidents = snapshot.val() || {};

    if (Object.keys(incidents).length === 0) {
      incidentsList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No hay incidencias registradas</p>';
      return;
    }

    // Load tasks for display
    const tasksSnapshot = await getTasksRef().once('value');
    const tasks = tasksSnapshot.val() || {};
    const taskMap = {};
    Object.entries(tasks).forEach(([id, task]) => {
      taskMap[id] = task.name;
    });

    // Sort by date (newest first)
    const sortedIncidents = Object.entries(incidents).sort((a, b) => {
      const dateA = a[1].createdDate || 0;
      const dateB = b[1].createdDate || 0;
      return dateB - dateA;
    });

    sortedIncidents.forEach(([id, incident]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.incidentId = id;
      const taskName = incident.taskId ? (taskMap[incident.taskId] || 'Tarea desconocida') : 'Sin tarea';
      
      const statusColors = {
        'pending': 'bg-yellow-600',
        'corrected': 'bg-green-600'
      };
      
      const statusLabels = {
        'pending': 'PENDIENTE',
        'corrected': 'CORREGIDA'
      };
      
      const createdDate = incident.createdDate ? new Date(incident.createdDate) : null;
      const dateStr = createdDate ? formatDate24h(createdDate) : 'Sin fecha';
      
      item.innerHTML = `
        <div class="flex justify-between items-center mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(taskName)}</div>
          <span class="px-2 py-0.5 text-xs text-white rounded ${statusColors[incident.status] || 'bg-gray-600'}">
            ${statusLabels[incident.status] || incident.status || 'Sin estado'}
          </span>
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Fecha: ${dateStr}</div>
          ${incident.description ? `<div>Descripción: ${escapeHtml(incident.description.substring(0, 100))}${incident.description.length > 100 ? '...' : ''}</div>` : ''}
        </div>
      `;
      item.addEventListener('click', () => viewIncident(id));
      incidentsList.appendChild(item);
    });
  });
}

// Show incident form
function showIncidentForm(incidentId = null, taskId = null, inspectionId = null) {
  const form = document.getElementById('incident-form');
  const list = document.getElementById('incidents-list');
  const header = document.querySelector('#incidents-view .flex.flex-col');
  const detail = document.getElementById('incident-detail');
  const title = document.getElementById('incident-form-title');
  const formElement = document.getElementById('incident-form-element');
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  
  if (formElement) {
    formElement.reset();
    const incidentIdInput = document.getElementById('incident-id');
    if (incidentIdInput) incidentIdInput.value = incidentId || '';
    
    const inspectionIdInput = document.getElementById('incident-inspection-id');
    if (inspectionIdInput) inspectionIdInput.value = inspectionId || '';
  }

  // Load tasks for select
  loadTasksForSelect().then(tasks => {
    const taskSelect = document.getElementById('incident-task-select');
    if (taskSelect) {
      taskSelect.innerHTML = '<option value="">Seleccionar tarea</option>';
      tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.name;
        if (taskId && task.id === taskId) {
          option.selected = true;
        }
        taskSelect.appendChild(option);
      });
    }
  });

  if (incidentId) {
    if (title) title.textContent = 'Editar Incidencia';
    getIncident(incidentId).then(snapshot => {
      const incident = snapshot.val();
      if (incident) {
        document.getElementById('incident-task-select').value = incident.taskId || '';
        document.getElementById('incident-description').value = incident.description || '';
        document.getElementById('incident-status').value = incident.status || 'pending';
        const inspectionIdInput = document.getElementById('incident-inspection-id');
        if (inspectionIdInput) inspectionIdInput.value = incident.inspectionId || '';
      }
    });
  } else {
    if (title) title.textContent = 'Nueva Incidencia';
    document.getElementById('incident-status').value = 'pending';
    if (taskId) {
      document.getElementById('incident-task-select').value = taskId;
    }
  }
}

// Hide incident form
function hideIncidentForm() {
  const form = document.getElementById('incident-form');
  const list = document.getElementById('incidents-list');
  const header = document.querySelector('#incidents-view .flex.flex-col');
  const detail = document.getElementById('incident-detail');
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
}

// Save incident
function saveIncident(incidentId, incidentData) {
  if (incidentId) {
    return updateIncident(incidentId, incidentData);
  } else {
    return createIncident(incidentData);
  }
}

// View incident detail
async function viewIncident(incidentId) {
  showSpinner('Cargando incidencia...');
  try {
    const snapshot = await getIncident(incidentId);
    const incident = snapshot.val();
    hideSpinner();
    if (!incident) {
      await showError('Incidencia no encontrada');
      return;
    }

    const list = document.getElementById('incidents-list');
    const header = document.querySelector('#incidents-view .flex.flex-col');
    const form = document.getElementById('incident-form');
    const detail = document.getElementById('incident-detail');
    const detailContent = document.getElementById('incident-detail-content');
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');

    // Get task name
    let taskName = 'Sin tarea';
    let taskRoleId = null;
    if (incident.taskId) {
      const taskSnapshot = await getTask(incident.taskId);
      const task = taskSnapshot.val();
      if (task) {
        taskName = task.name;
        taskRoleId = task.roleId;
      }
    }

    // Get role and employee info
    let roleName = null;
    let employeeName = null;
    if (taskRoleId) {
      const roleSnapshot = await getRole(taskRoleId);
      const role = roleSnapshot.val();
      if (role) roleName = role.name;
    }

    const statusLabels = {
      'pending': 'Pendiente',
      'corrected': 'Corregida'
    };
    
    const statusColors = {
      'pending': 'text-yellow-600',
      'corrected': 'text-green-600'
    };
    
    const createdDate = incident.createdDate ? new Date(incident.createdDate) : null;
    const dateStr = createdDate ? formatDate24h(createdDate) : 'Sin fecha';

    detailContent.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Tarea:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(taskName)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Fecha:</span>
          <span class="font-light text-sm sm:text-base">${dateStr}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Estado:</span>
          <span class="font-light text-sm sm:text-base ${statusColors[incident.status] || ''} font-medium">
            ${statusLabels[incident.status] || incident.status || 'Sin estado'}
          </span>
        </div>
        ${roleName ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Rol responsable:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(roleName)}</span>
        </div>
        ` : ''}
        ${incident.description ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Descripción:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(incident.description)}</span>
        </div>
        ` : ''}
      </div>
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-incident-detail-btn');
    const deleteBtn = document.getElementById('delete-incident-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showIncidentForm(incidentId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteIncidentHandler(incidentId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar incidencia: ' + error.message);
  }
}

// Back to incidents list
function backToIncidents() {
  const list = document.getElementById('incidents-list');
  const header = document.querySelector('#incidents-view .flex.flex-col');
  const detail = document.getElementById('incident-detail');
  const form = document.getElementById('incident-form');
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
}

// Delete incident handler
async function deleteIncidentHandler(incidentId) {
  const confirmed = await showConfirm('Eliminar Incidencia', '¿Está seguro de eliminar esta incidencia?');
  if (!confirmed) return;

  showSpinner('Eliminando incidencia...');
  try {
    await deleteIncident(incidentId);
    hideSpinner();
    backToIncidents();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar incidencia: ' + error.message);
  }
}

// Incident form submit
const incidentFormElement = document.getElementById('incident-form-element');
if (incidentFormElement) {
  incidentFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const incidentId = document.getElementById('incident-id').value;
    const taskId = document.getElementById('incident-task-select').value;
    const description = document.getElementById('incident-description').value.trim();
    const status = document.getElementById('incident-status').value;
    const inspectionId = document.getElementById('incident-inspection-id').value || null;
    
    if (!taskId) {
      await showError('Por favor seleccione una tarea');
      return;
    }

    if (!description) {
      await showError('Por favor complete la descripción de la incidencia');
      return;
    }

    showSpinner('Guardando incidencia...');
    try {
      const incidentData = { 
        taskId,
        description,
        status,
        inspectionId: inspectionId || null,
        createdDate: Date.now()
      };
      
      // If updating, preserve original createdDate
      if (incidentId) {
        const existingSnapshot = await getIncident(incidentId);
        const existing = existingSnapshot.val();
        if (existing && existing.createdDate) {
          incidentData.createdDate = existing.createdDate;
        }
      }
      
      await saveIncident(incidentId || null, incidentData);
      hideSpinner();
      hideIncidentForm();
      await showSuccess('Incidencia guardada exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar incidencia: ' + error.message);
    }
  });
}

// New incident button
const newIncidentBtn = document.getElementById('new-incident-btn');
if (newIncidentBtn) {
  newIncidentBtn.addEventListener('click', () => {
    showIncidentForm();
  });
}

// Cancel incident form
const cancelIncidentBtn = document.getElementById('cancel-incident-btn');
if (cancelIncidentBtn) {
  cancelIncidentBtn.addEventListener('click', () => {
    hideIncidentForm();
  });
}

// Close incident form button
const closeIncidentFormBtn = document.getElementById('close-incident-form');
if (closeIncidentFormBtn) {
  closeIncidentFormBtn.addEventListener('click', () => {
    hideIncidentForm();
  });
}

// Back to incidents button
const backToIncidentsBtn = document.getElementById('back-to-incidents');
if (backToIncidentsBtn) {
  backToIncidentsBtn.addEventListener('click', () => {
    backToIncidents();
  });
}

// Format date in 24-hour format
function formatDate24h(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Make functions available globally
window.viewIncident = viewIncident;
window.showIncidentForm = showIncidentForm;
