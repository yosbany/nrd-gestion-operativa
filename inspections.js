// Inspection management

let inspectionsListener = null;

// Load inspections
function loadInspections() {
  const inspectionsList = document.getElementById('inspections-list');
  if (!inspectionsList) return;
  
  inspectionsList.innerHTML = '';

  // Remove previous listener
  if (inspectionsListener) {
    getInspectionsRef().off('value', inspectionsListener);
    inspectionsListener = null;
  }

  // Listen for inspections
  inspectionsListener = getInspectionsRef().on('value', async (snapshot) => {
    if (!inspectionsList) return;
    inspectionsList.innerHTML = '';
    const inspections = snapshot.val() || {};

    if (Object.keys(inspections).length === 0) {
      inspectionsList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No hay inspecciones registradas</p>';
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
    const sortedInspections = Object.entries(inspections).sort((a, b) => {
      const dateA = a[1].inspectionDate || 0;
      const dateB = b[1].inspectionDate || 0;
      return dateB - dateA;
    });

    sortedInspections.forEach(([id, inspection]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.inspectionId = id;
      const taskName = inspection.taskId ? (taskMap[inspection.taskId] || 'Tarea desconocida') : 'Sin tarea';
      
      const severityColors = {
        'leve': 'bg-yellow-600',
        'moderada': 'bg-orange-600',
        'critica': 'bg-red-600'
      };
      
      const inspectionDate = inspection.inspectionDate ? new Date(inspection.inspectionDate) : null;
      const dateStr = inspectionDate ? formatDate24h(inspectionDate) + ' ' + formatTime24h(inspectionDate) : 'Sin fecha';
      
      item.innerHTML = `
        <div class="flex justify-between items-center mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(taskName)}</div>
          ${inspection.severity ? `
          <span class="px-2 py-0.5 text-xs text-white rounded ${severityColors[inspection.severity] || 'bg-gray-600'}">
            ${inspection.severity.toUpperCase()}
          </span>
          ` : ''}
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Fecha: ${dateStr}</div>
          ${inspection.observations ? `<div>Observaciones: ${escapeHtml(inspection.observations.substring(0, 100))}${inspection.observations.length > 100 ? '...' : ''}</div>` : ''}
        </div>
      `;
      item.addEventListener('click', () => viewInspection(id));
      inspectionsList.appendChild(item);
    });
  });
}

// Show inspection form
function showInspectionForm(inspectionId = null) {
  const form = document.getElementById('inspection-form');
  const list = document.getElementById('inspections-list');
  const header = document.querySelector('#inspections-view .flex.flex-col');
  const detail = document.getElementById('inspection-detail');
  const title = document.getElementById('inspection-form-title');
  const formElement = document.getElementById('inspection-form-element');
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  
  if (formElement) {
    formElement.reset();
    const inspectionIdInput = document.getElementById('inspection-id');
    if (inspectionIdInput) inspectionIdInput.value = inspectionId || '';
  }

  // Load tasks for select
  loadTasksForSelect().then(tasks => {
    const taskSelect = document.getElementById('inspection-task-select');
    if (taskSelect) {
      taskSelect.innerHTML = '<option value="">Seleccionar tarea</option>';
      tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.name;
        taskSelect.appendChild(option);
      });
      
      // Add change listener to load task help info
      taskSelect.addEventListener('change', async (e) => {
        const taskId = e.target.value;
        const helpContainer = document.getElementById('inspection-task-help');
        const helpContent = document.getElementById('inspection-task-help-content');
        
        if (!taskId || !helpContainer || !helpContent) {
          if (helpContainer) helpContainer.classList.add('hidden');
          return;
        }
        
        try {
          const taskSnapshot = await getTask(taskId);
          const task = taskSnapshot.val();
          
          if (!task) {
            helpContainer.classList.add('hidden');
            return;
          }
          
          let helpHTML = '';
          
          if (task.successCriteria) {
            helpHTML += `
              <div class="mb-3 sm:mb-4">
                <h4 class="text-xs uppercase tracking-wider text-gray-600 mb-2 font-medium">Criterios de Ejecución Correcta:</h4>
                <p class="text-sm sm:text-base font-light text-gray-800">${escapeHtml(task.successCriteria)}</p>
              </div>
            `;
          }
          
          if (task.commonErrors && task.commonErrors.length > 0) {
            helpHTML += `
              <div>
                <h4 class="text-xs uppercase tracking-wider text-gray-600 mb-2 font-medium">Errores Comunes:</h4>
                <ul class="list-disc list-inside space-y-1">
                  ${task.commonErrors.map(error => `<li class="text-sm sm:text-base font-light text-gray-800">${escapeHtml(error)}</li>`).join('')}
                </ul>
              </div>
            `;
          }
          
          if (helpHTML) {
            helpContent.innerHTML = helpHTML;
            helpContainer.classList.remove('hidden');
          } else {
            helpContainer.classList.add('hidden');
          }
        } catch (error) {
          console.error('Error loading task help:', error);
          helpContainer.classList.add('hidden');
        }
      });
    }
  });

  // Set default date/time to now
  const dateInput = document.getElementById('inspection-date');
  const timeInput = document.getElementById('inspection-time');
  if (dateInput && timeInput) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    timeInput.value = `${hours}:${minutes}`;
  }

  if (inspectionId) {
    if (title) title.textContent = 'Editar Inspección';
    getInspection(inspectionId).then(async snapshot => {
      const inspection = snapshot.val();
      if (inspection) {
        const taskSelect = document.getElementById('inspection-task-select');
        taskSelect.value = inspection.taskId || '';
        document.getElementById('inspection-severity').value = inspection.severity || 'leve';
        document.getElementById('inspection-observations').value = inspection.observations || '';
        
        if (inspection.inspectionDate) {
          const inspDate = new Date(inspection.inspectionDate);
          const year = inspDate.getFullYear();
          const month = String(inspDate.getMonth() + 1).padStart(2, '0');
          const day = String(inspDate.getDate()).padStart(2, '0');
          const hours = String(inspDate.getHours()).padStart(2, '0');
          const minutes = String(inspDate.getMinutes()).padStart(2, '0');
          document.getElementById('inspection-date').value = `${year}-${month}-${day}`;
          document.getElementById('inspection-time').value = `${hours}:${minutes}`;
        }
        
        // Trigger change event to load task help if task is selected
        if (inspection.taskId && taskSelect) {
          taskSelect.dispatchEvent(new Event('change'));
        }
      }
    });
  } else {
    if (title) title.textContent = 'Nueva Inspección';
    document.getElementById('inspection-severity').value = 'leve';
    // Hide help when creating new inspection
    const helpContainer = document.getElementById('inspection-task-help');
    if (helpContainer) helpContainer.classList.add('hidden');
  }
}

// Hide inspection form
function hideInspectionForm() {
  const form = document.getElementById('inspection-form');
  const list = document.getElementById('inspections-list');
  const header = document.querySelector('#inspections-view .flex.flex-col');
  const detail = document.getElementById('inspection-detail');
  const helpContainer = document.getElementById('inspection-task-help');
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (helpContainer) helpContainer.classList.add('hidden');
}

// Save inspection
function saveInspection(inspectionId, inspectionData) {
  if (inspectionId) {
    return updateInspection(inspectionId, inspectionData);
  } else {
    return createInspection(inspectionData);
  }
}

// View inspection detail
async function viewInspection(inspectionId) {
  showSpinner('Cargando inspección...');
  try {
    const snapshot = await getInspection(inspectionId);
    const inspection = snapshot.val();
    hideSpinner();
    if (!inspection) {
      await showError('Inspección no encontrada');
      return;
    }

    const list = document.getElementById('inspections-list');
    const header = document.querySelector('#inspections-view .flex.flex-col');
    const form = document.getElementById('inspection-form');
    const detail = document.getElementById('inspection-detail');
    const detailContent = document.getElementById('inspection-detail-content');
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');

    // Get task name
    let taskName = 'Sin tarea';
    if (inspection.taskId) {
      const taskSnapshot = await getTask(inspection.taskId);
      const task = taskSnapshot.val();
      if (task) taskName = task.name;
    }

    const severityLabels = {
      'leve': 'Leve',
      'moderada': 'Moderada',
      'critica': 'Crítica'
    };
    
    const severityColors = {
      'leve': 'text-yellow-600',
      'moderada': 'text-orange-600',
      'critica': 'text-red-600'
    };
    
    const inspectionDate = inspection.inspectionDate ? new Date(inspection.inspectionDate) : null;
    const dateStr = inspectionDate ? formatDate24h(inspectionDate) + ' ' + formatTime24h(inspectionDate) : 'Sin fecha';

    detailContent.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Tarea:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(taskName)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Fecha y Hora:</span>
          <span class="font-light text-sm sm:text-base">${dateStr}</span>
        </div>
        ${inspection.severity ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Severidad:</span>
          <span class="font-light text-sm sm:text-base ${severityColors[inspection.severity] || ''} font-medium">
            ${severityLabels[inspection.severity] || inspection.severity}
          </span>
        </div>
        ` : ''}
        ${inspection.observations ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Observaciones:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(inspection.observations)}</span>
        </div>
        ` : ''}
      </div>
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-inspection-detail-btn');
    const deleteBtn = document.getElementById('delete-inspection-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showInspectionForm(inspectionId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteInspectionHandler(inspectionId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar inspección: ' + error.message);
  }
}

// Back to inspections list
function backToInspections() {
  const list = document.getElementById('inspections-list');
  const header = document.querySelector('#inspections-view .flex.flex-col');
  const detail = document.getElementById('inspection-detail');
  const form = document.getElementById('inspection-form');
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
}

// Delete inspection handler
async function deleteInspectionHandler(inspectionId) {
  const confirmed = await showConfirm('Eliminar Inspección', '¿Está seguro de eliminar esta inspección?');
  if (!confirmed) return;

  showSpinner('Eliminando inspección...');
  try {
    await deleteInspection(inspectionId);
    hideSpinner();
    backToInspections();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar inspección: ' + error.message);
  }
}

// Inspection form submit
const inspectionFormElement = document.getElementById('inspection-form-element');
if (inspectionFormElement) {
  inspectionFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const inspectionId = document.getElementById('inspection-id').value;
    const taskId = document.getElementById('inspection-task-select').value;
    const severity = document.getElementById('inspection-severity').value;
    const observations = document.getElementById('inspection-observations').value.trim() || null;
    
    const dateInput = document.getElementById('inspection-date').value;
    const timeInput = document.getElementById('inspection-time').value;
    
    if (!taskId) {
      await showError('Por favor seleccione una tarea');
      return;
    }

    // Combine date and time
    let inspectionDate = Date.now();
    if (dateInput && timeInput) {
      const dateTimeString = `${dateInput}T${timeInput}`;
      inspectionDate = new Date(dateTimeString).getTime();
    }

    showSpinner('Guardando inspección...');
    try {
      await saveInspection(inspectionId || null, { 
        taskId,
        severity,
        observations,
        inspectionDate
      });
      hideSpinner();
      hideInspectionForm();
      await showSuccess('Inspección guardada exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar inspección: ' + error.message);
    }
  });
}

// New inspection button
const newInspectionBtn = document.getElementById('new-inspection-btn');
if (newInspectionBtn) {
  newInspectionBtn.addEventListener('click', () => {
    showInspectionForm();
  });
}

// Cancel inspection form
const cancelInspectionBtn = document.getElementById('cancel-inspection-btn');
if (cancelInspectionBtn) {
  cancelInspectionBtn.addEventListener('click', () => {
    hideInspectionForm();
  });
}

// Close inspection form button
const closeInspectionFormBtn = document.getElementById('close-inspection-form');
if (closeInspectionFormBtn) {
  closeInspectionFormBtn.addEventListener('click', () => {
    hideInspectionForm();
  });
}

// Back to inspections button
const backToInspectionsBtn = document.getElementById('back-to-inspections');
if (backToInspectionsBtn) {
  backToInspectionsBtn.addEventListener('click', () => {
    backToInspections();
  });
}

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

// Make functions available globally
window.viewInspection = viewInspection;
