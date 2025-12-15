// Process management

let processesListener = null;

// Load processes
function loadProcesses() {
  const processesList = document.getElementById('processes-list');
  if (!processesList) return;
  
  processesList.innerHTML = '';

  // Remove previous listener
  if (processesListener) {
    getProcessesRef().off('value', processesListener);
    processesListener = null;
  }

  // Listen for processes
  processesListener = getProcessesRef().on('value', async (snapshot) => {
    if (!processesList) return;
    processesList.innerHTML = '';
    const processes = snapshot.val() || {};

    if (Object.keys(processes).length === 0) {
      processesList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No hay procesos registrados</p>';
      return;
    }

    // Load areas for display
    const areasSnapshot = await getAreasRef().once('value');
    const areas = areasSnapshot.val() || {};
    const areaMap = {};
    Object.entries(areas).forEach(([id, area]) => {
      areaMap[id] = area.name;
    });

    Object.entries(processes).forEach(([id, process]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.processId = id;
      const areaName = process.areaId ? (areaMap[process.areaId] || 'Área desconocida') : 'Sin área';
      
      item.innerHTML = `
        <div class="flex justify-between items-center mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(process.name)}</div>
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Área: ${escapeHtml(areaName)}</div>
          ${process.objective ? `<div>Objetivo: ${escapeHtml(process.objective)}</div>` : ''}
        </div>
      `;
      item.addEventListener('click', () => viewProcess(id));
      processesList.appendChild(item);
    });
  });
}

// Show process form
function showProcessForm(processId = null) {
  const form = document.getElementById('process-form');
  const list = document.getElementById('processes-list');
  const header = document.querySelector('#processes-view .flex.flex-col');
  const detail = document.getElementById('process-detail');
  const title = document.getElementById('process-form-title');
  const formElement = document.getElementById('process-form-element');
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  
  if (formElement) {
    formElement.reset();
    const processIdInput = document.getElementById('process-id');
    if (processIdInput) processIdInput.value = processId || '';
  }

  // Load areas for select
  loadAreasForProcess().then(areas => {
    const areaSelect = document.getElementById('process-area-select');
    if (areaSelect) {
      areaSelect.innerHTML = '<option value="">Sin área</option>';
      areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.name;
        areaSelect.appendChild(option);
      });
    }
  });

  if (processId) {
    if (title) title.textContent = 'Editar Proceso';
    getProcess(processId).then(snapshot => {
      const process = snapshot.val();
      if (process) {
        const nameInput = document.getElementById('process-name');
        const objectiveInput = document.getElementById('process-objective');
        const areaSelect = document.getElementById('process-area-select');
        if (nameInput) nameInput.value = process.name || '';
        if (objectiveInput) objectiveInput.value = process.objective || '';
        if (areaSelect) areaSelect.value = process.areaId || '';
      }
    });
  } else {
    if (title) title.textContent = 'Nuevo Proceso';
  }
}

// Hide process form
function hideProcessForm() {
  const form = document.getElementById('process-form');
  const list = document.getElementById('processes-list');
  const header = document.querySelector('#processes-view .flex.flex-col');
  const detail = document.getElementById('process-detail');
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
}

// Save process
function saveProcess(processId, processData) {
  if (processId) {
    return updateProcess(processId, processData);
  } else {
    return createProcess(processData);
  }
}

// View process detail
async function viewProcess(processId) {
  showSpinner('Cargando proceso...');
  try {
    const snapshot = await getProcess(processId);
    const process = snapshot.val();
    hideSpinner();
    if (!process) {
      await showError('Proceso no encontrado');
      return;
    }

    const list = document.getElementById('processes-list');
    const header = document.querySelector('#processes-view .flex.flex-col');
    const form = document.getElementById('process-form');
    const detail = document.getElementById('process-detail');
    const detailContent = document.getElementById('process-detail-content');
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');

    // Get area name
    let areaName = 'Sin área';
    if (process.areaId) {
      const areaSnapshot = await getArea(process.areaId);
      const area = areaSnapshot.val();
      if (area) areaName = area.name;
    }

    // Load tasks and roles for this process
    const [tasksSnapshot, rolesSnapshot] = await Promise.all([
      getTasksRef().once('value'),
      getRolesRef().once('value')
    ]);
    
    const allTasks = tasksSnapshot.val() || {};
    const allRoles = rolesSnapshot.val() || {};
    
    // Create role map
    const roleMap = {};
    Object.entries(allRoles).forEach(([id, role]) => {
      roleMap[id] = role.name;
    });
    
    const processTasks = Object.entries(allTasks)
      .filter(([id, task]) => task.processId === processId)
      .map(([id, task]) => ({ id, ...task }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Build flow visualization
    let flowHtml = '';
    if (processTasks.length > 0) {
      flowHtml = `
        <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Flujo del Proceso:</h4>
          <div class="space-y-2">
            ${processTasks.map((task, index) => {
              let roleName = 'Sin rol';
              if (task.roleId && roleMap[task.roleId]) {
                roleName = roleMap[task.roleId];
              }
              
              const taskTypeLabels = {
                'with_role': 'Con rol',
                'without_role': 'Sin rol',
                'voluntary': 'Voluntaria',
                'unpaid': 'No remunerada',
                'exchange': 'Canje'
              };
              
              return `
                <div class="border border-gray-200 p-2 sm:p-3 hover:border-red-600 transition-colors cursor-pointer" onclick="viewTask('${task.id}')">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-medium text-gray-500">${index + 1}</span>
                    <span class="font-light text-sm sm:text-base flex-1">${escapeHtml(task.name)}</span>
                    <span class="text-xs px-2 py-0.5 bg-gray-100 rounded">${taskTypeLabels[task.type] || task.type}</span>
                  </div>
                  ${task.roleId ? `<div class="text-xs text-gray-600 ml-6">Rol: ${escapeHtml(roleName)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    detailContent.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(process.name)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Área:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(areaName)}</span>
        </div>
        ${process.objective ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Objetivo:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(process.objective)}</span>
        </div>
        ` : ''}
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Tareas:</span>
          <span class="font-light text-sm sm:text-base">${processTasks.length}</span>
        </div>
      </div>
      ${flowHtml}
      ${processTasks.length > 0 ? `
      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Tareas del Proceso:</h4>
        <div class="space-y-2">
          ${processTasks.map(task => `
            <div class="border border-gray-200 p-2 sm:p-3 hover:border-red-600 transition-colors cursor-pointer" onclick="viewTask('${task.id}')">
              <div class="font-light text-sm sm:text-base">${escapeHtml(task.name)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-process-detail-btn');
    const deleteBtn = document.getElementById('delete-process-detail-btn');
    const diagramBtn = document.getElementById('view-process-diagram-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showProcessForm(processId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteProcessHandler(processId);
    }
    
    if (diagramBtn) {
      diagramBtn.onclick = () => {
        showProcessDiagram(processId, process.name, processTasks, roleMap);
      };
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar proceso: ' + error.message);
  }
}

// Back to processes list
function backToProcesses() {
  const list = document.getElementById('processes-list');
  const header = document.querySelector('#processes-view .flex.flex-col');
  const detail = document.getElementById('process-detail');
  const form = document.getElementById('process-form');
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
}

// Delete process handler
async function deleteProcessHandler(processId) {
  // Check if process has tasks
  const tasksSnapshot = await getTasksRef().once('value');
  const tasks = tasksSnapshot.val() || {};
  const hasTasks = Object.values(tasks).some(t => t.processId === processId);
  
  if (hasTasks) {
    await showError('No se puede eliminar un proceso que tiene tareas asociadas');
    return;
  }

  const confirmed = await showConfirm('Eliminar Proceso', '¿Está seguro de eliminar este proceso?');
  if (!confirmed) return;

  showSpinner('Eliminando proceso...');
  try {
    await deleteProcess(processId);
    hideSpinner();
    backToProcesses();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar proceso: ' + error.message);
  }
}

// Process form submit
const processFormElement = document.getElementById('process-form-element');
if (processFormElement) {
  processFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const processId = document.getElementById('process-id').value;
    const name = document.getElementById('process-name').value.trim();
    const objective = document.getElementById('process-objective').value.trim();
    const areaId = document.getElementById('process-area-select').value || null;

    if (!name) {
      await showError('Por favor complete el nombre del proceso');
      return;
    }

    showSpinner('Guardando proceso...');
    try {
      await saveProcess(processId || null, { 
        name, 
        objective: objective || null,
        areaId: areaId || null
      });
      hideSpinner();
      hideProcessForm();
      await showSuccess('Proceso guardado exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar proceso: ' + error.message);
    }
  });
}

// New process button
const newProcessBtn = document.getElementById('new-process-btn');
if (newProcessBtn) {
  newProcessBtn.addEventListener('click', () => {
    showProcessForm();
  });
}

// Cancel process form
const cancelProcessBtn = document.getElementById('cancel-process-btn');
if (cancelProcessBtn) {
  cancelProcessBtn.addEventListener('click', () => {
    hideProcessForm();
  });
}

// Close process form button
const closeProcessFormBtn = document.getElementById('close-process-form');
if (closeProcessFormBtn) {
  closeProcessFormBtn.addEventListener('click', () => {
    hideProcessForm();
  });
}

// Back to processes button
const backToProcessesBtn = document.getElementById('back-to-processes');
if (backToProcessesBtn) {
  backToProcessesBtn.addEventListener('click', () => {
    backToProcesses();
  });
}

// Close process diagram button
const closeProcessDiagramBtn = document.getElementById('close-process-diagram');
if (closeProcessDiagramBtn) {
  closeProcessDiagramBtn.addEventListener('click', () => {
    closeProcessDiagram();
  });
}

// Show process diagram
function showProcessDiagram(processId, processName, processTasks, roleMap) {
  const modal = document.getElementById('process-diagram-modal');
  const title = document.getElementById('process-diagram-title');
  const content = document.getElementById('process-diagram-content');
  
  if (!modal || !title || !content) return;
  
  title.textContent = `Diagrama: ${escapeHtml(processName)}`;
  
  if (!processTasks || processTasks.length === 0) {
    content.innerHTML = '<p class="text-center text-gray-600 py-8">No hay tareas en este proceso</p>';
    modal.classList.remove('hidden');
    return;
  }
  
  const taskTypeLabels = {
    'with_role': 'Con rol',
    'without_role': 'Sin rol',
    'voluntary': 'Voluntaria',
    'unpaid': 'No remunerada',
    'exchange': 'Canje'
  };
  
  const taskTypeColors = {
    'with_role': 'bg-blue-100 border-blue-300',
    'without_role': 'bg-gray-100 border-gray-300',
    'voluntary': 'bg-green-100 border-green-300',
    'unpaid': 'bg-yellow-100 border-yellow-300',
    'exchange': 'bg-purple-100 border-purple-300'
  };
  
  let diagramHTML = '<div class="flex flex-col items-center space-y-4">';
  
  processTasks.forEach((task, index) => {
    const roleName = task.roleId && roleMap[task.roleId] ? roleMap[task.roleId] : null;
    const taskTypeLabel = taskTypeLabels[task.type] || task.type;
    const taskTypeColor = taskTypeColors[task.type] || 'bg-gray-100 border-gray-300';
    
    // Task card
    diagramHTML += `
      <div class="w-full max-w-md">
        <div class="border-2 ${taskTypeColor} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onclick="viewTask('${task.id}'); closeProcessDiagram();">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-lg font-medium text-gray-700 bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-gray-400">${index + 1}</span>
              <h4 class="text-base sm:text-lg font-light text-gray-800">${escapeHtml(task.name)}</h4>
            </div>
            <span class="text-xs px-2 py-1 bg-white rounded border border-gray-300 text-gray-700 whitespace-nowrap">${taskTypeLabel}</span>
          </div>
          ${roleName ? `
            <div class="mt-2 pt-2 border-t border-gray-300">
              <span class="text-xs text-gray-600 uppercase tracking-wider">Rol:</span>
              <span class="text-sm font-light text-gray-800 ml-2">${escapeHtml(roleName)}</span>
            </div>
          ` : ''}
          ${task.description ? `
            <div class="mt-2 text-sm text-gray-600 font-light">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Arrow connector (except for last task)
    if (index < processTasks.length - 1) {
      diagramHTML += `
        <div class="flex items-center justify-center">
          <svg class="w-6 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      `;
    }
  });
  
  diagramHTML += '</div>';
  
  content.innerHTML = diagramHTML;
  modal.classList.remove('hidden');
}

// Close process diagram
function closeProcessDiagram() {
  const modal = document.getElementById('process-diagram-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Make functions available globally
window.viewProcess = viewProcess;
window.closeProcessDiagram = closeProcessDiagram;
