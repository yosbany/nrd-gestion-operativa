// Process management

let processesListener = null;
let allProcesses = {}; // Store all processes for filtering
let processAreaMap = {}; // Store area names for processes

// Normalize text for search (remove accents, ñ->n, b->v, c->s)
function normalizeSearchText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/ñ/g, 'n')
    .replace(/b/g, 'v')
    .replace(/c/g, 's');
}

// Filter and display processes
async function filterAndDisplayProcesses(searchTerm = '') {
  const processesList = document.getElementById('processes-list');
  if (!processesList) return;
  
  processesList.innerHTML = '';
  
  const term = normalizeSearchText(searchTerm.trim());
  const filteredProcesses = Object.entries(allProcesses).filter(([id, process]) => {
    if (!term) return true;
    const name = normalizeSearchText(process.name || '');
    const objective = normalizeSearchText(process.objective || '');
    const areaName = normalizeSearchText(processAreaMap[process.areaId] || '');
    return name.includes(term) || objective.includes(term) || areaName.includes(term);
  });

  if (filteredProcesses.length === 0) {
    processesList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No se encontraron procesos</p>';
    return;
  }

  filteredProcesses.forEach(([id, process]) => {
    const item = document.createElement('div');
    item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
    item.dataset.processId = id;
    const areaName = process.areaId ? (processAreaMap[process.areaId] || 'Área desconocida') : 'Sin área';
    
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
}

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
    allProcesses = snapshot.val() || {};

    // Load areas for display
    const areasSnapshot = await getAreasRef().once('value');
    const areas = areasSnapshot.val() || {};
    processAreaMap = {};
    Object.entries(areas).forEach(([id, area]) => {
      processAreaMap[id] = area.name;
    });
    
    // Get search term and filter
    const searchInput = document.getElementById('processes-search');
    const searchTerm = searchInput ? searchInput.value : '';
    await filterAndDisplayProcesses(searchTerm);
  });
  
  // Add search input listener
  const searchInput = document.getElementById('processes-search');
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      await filterAndDisplayProcesses(e.target.value);
    });
  }
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
      
      // After loading areas, load process data if editing
      if (processId) {
        if (title) title.textContent = 'Editar Proceso';
        getProcess(processId).then(snapshot => {
          const process = snapshot.val();
          if (process) {
            const nameInput = document.getElementById('process-name');
            const objectiveInput = document.getElementById('process-objective');
            if (nameInput) nameInput.value = process.name || '';
            if (objectiveInput) objectiveInput.value = process.objective || '';
            // Set area after options are loaded
            if (areaSelect) {
              areaSelect.value = process.areaId || '';
            }
          }
        });
      } else {
        if (title) title.textContent = 'Nuevo Proceso';
      }
    }
  });
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
    const flowEditBtn = document.getElementById('edit-process-flow-btn');
    
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
    
    if (flowEditBtn) {
      flowEditBtn.onclick = () => {
        showProcessFlowEdit(processId, process.name, processTasks, roleMap);
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

// Process flow edit buttons
const saveProcessFlowBtn = document.getElementById('save-process-flow-btn');
const cancelProcessFlowEditBtn = document.getElementById('cancel-process-flow-edit-btn');
const closeProcessFlowEditBtn = document.getElementById('close-process-flow-edit');

if (saveProcessFlowBtn) {
  saveProcessFlowBtn.addEventListener('click', () => {
    saveProcessFlow();
  });
}

if (cancelProcessFlowEditBtn) {
  cancelProcessFlowEditBtn.addEventListener('click', () => {
    closeProcessFlowEdit();
  });
}

if (closeProcessFlowEditBtn) {
  closeProcessFlowEditBtn.addEventListener('click', () => {
    closeProcessFlowEdit();
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
        <div class="border-2 ${taskTypeColor} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onclick="closeProcessDiagram(); setTimeout(() => viewTask('${task.id}'), 100);">
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

// Show process flow edit modal
async function showProcessFlowEdit(processId, processName, processTasks, roleMap) {
  const modal = document.getElementById('process-flow-edit-modal');
  const title = document.getElementById('process-flow-edit-title');
  const content = document.getElementById('process-flow-edit-content');
  
  if (!modal || !title || !content) return;
  
  title.textContent = `Editar Flujo: ${escapeHtml(processName)}`;
  
  // Load all tasks to show available tasks
  showSpinner('Cargando tareas...');
  try {
    const allTasksSnapshot = await getTasksRef().once('value');
    const allTasks = allTasksSnapshot.val() || {};
    
    // Get task IDs already in process
    const processTaskIds = new Set(processTasks.map(t => t.id));
    
    // Separate tasks: in process and available
    const tasksInProcess = [...processTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const availableTasks = Object.entries(allTasks)
      .filter(([id, task]) => !processTaskIds.has(id))
      .map(([id, task]) => ({ id, ...task }));
    
    hideSpinner();
    
    // Build HTML for flow edit
    let flowEditHTML = `
      <div class="space-y-6">
        <div>
          <h4 class="text-sm sm:text-base font-light mb-3 uppercase tracking-wider text-gray-600">Tareas en el Proceso (Ordenadas)</h4>
          <div id="process-tasks-list" class="space-y-2">
            ${tasksInProcess.map((task, index) => {
              const roleName = task.roleId && roleMap[task.roleId] ? roleMap[task.roleId] : null;
              return `
                <div class="border border-gray-200 p-3 flex items-center gap-3 bg-gray-50" data-task-id="${task.id}">
                  <div class="flex items-center gap-2 flex-1">
                    <span class="text-sm font-medium text-gray-500 w-6">${index + 1}</span>
                    <div class="flex-1">
                      <div class="font-light text-sm sm:text-base">${escapeHtml(task.name)}</div>
                      ${roleName ? `<div class="text-xs text-gray-600">Rol: ${escapeHtml(roleName)}</div>` : ''}
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <button onclick="moveTaskUp('${task.id}')" ${index === 0 ? 'disabled' : ''} class="px-2 py-1 text-xs border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Mover arriba">↑</button>
                    <button onclick="moveTaskDown('${task.id}')" ${index === tasksInProcess.length - 1 ? 'disabled' : ''} class="px-2 py-1 text-xs border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Mover abajo">↓</button>
                    <button onclick="removeTaskFromProcess('${task.id}')" class="px-2 py-1 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors" title="Quitar del proceso">×</button>
                  </div>
                </div>
              `;
            }).join('')}
            ${tasksInProcess.length === 0 ? '<p class="text-sm text-gray-600 text-center py-4">No hay tareas en el proceso</p>' : ''}
          </div>
        </div>
        
        <div>
          <h4 class="text-sm sm:text-base font-light mb-3 uppercase tracking-wider text-gray-600">Tareas Disponibles (Agregar al Proceso)</h4>
          <div id="available-tasks-list" class="space-y-2">
            ${availableTasks.map(task => {
              const roleName = task.roleId && roleMap[task.roleId] ? roleMap[task.roleId] : null;
              return `
                <div class="border border-gray-200 p-3 flex items-center gap-3">
                  <div class="flex-1">
                    <div class="font-light text-sm sm:text-base">${escapeHtml(task.name)}</div>
                    ${roleName ? `<div class="text-xs text-gray-600">Rol: ${escapeHtml(roleName)}</div>` : ''}
                  </div>
                  <button onclick="addTaskToProcess('${task.id}')" class="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors" title="Agregar al proceso">+ Agregar</button>
                </div>
              `;
            }).join('')}
            ${availableTasks.length === 0 ? '<p class="text-sm text-gray-600 text-center py-4">No hay tareas disponibles</p>' : ''}
          </div>
        </div>
      </div>
    `;
    
    content.innerHTML = flowEditHTML;
    
    // Store current state
    window.currentProcessFlowEdit = {
      processId,
      tasks: tasksInProcess.map(t => ({ id: t.id, order: t.order || 0 }))
    };
    
    modal.classList.remove('hidden');
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar tareas: ' + error.message);
  }
}

// Move task up in process flow
function moveTaskUp(taskId) {
  const tasks = window.currentProcessFlowEdit.tasks;
  const index = tasks.findIndex(t => t.id === taskId);
  if (index > 0) {
    [tasks[index], tasks[index - 1]] = [tasks[index - 1], tasks[index]];
    updateProcessFlowDisplay();
  }
}

// Move task down in process flow
function moveTaskDown(taskId) {
  const tasks = window.currentProcessFlowEdit.tasks;
  const index = tasks.findIndex(t => t.id === taskId);
  if (index < tasks.length - 1) {
    [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
    updateProcessFlowDisplay();
  }
}

// Remove task from process
function removeTaskFromProcess(taskId) {
  window.currentProcessFlowEdit.tasks = window.currentProcessFlowEdit.tasks.filter(t => t.id !== taskId);
  updateProcessFlowDisplay();
}

// Add task to process
function addTaskToProcess(taskId) {
  const maxOrder = window.currentProcessFlowEdit.tasks.length > 0 
    ? Math.max(...window.currentProcessFlowEdit.tasks.map(t => t.order || 0))
    : -1;
  window.currentProcessFlowEdit.tasks.push({ id: taskId, order: maxOrder + 1 });
  updateProcessFlowDisplay();
}

// Update process flow display
async function updateProcessFlowDisplay() {
  const content = document.getElementById('process-flow-edit-content');
  if (!content || !window.currentProcessFlowEdit) return;
  
  const { tasks } = window.currentProcessFlowEdit;
  
  // Load all tasks and roles
  const [allTasksSnapshot, rolesSnapshot] = await Promise.all([
    getTasksRef().once('value'),
    getRolesRef().once('value')
  ]);
  
  const allTasks = allTasksSnapshot.val() || {};
  const allRoles = rolesSnapshot.val() || {};
  const roleMap = {};
  Object.entries(allRoles).forEach(([id, role]) => {
    roleMap[id] = role.name;
  });
  
  // Get task IDs in process
  const processTaskIds = new Set(tasks.map(t => t.id));
  
  // Separate tasks
  const tasksInProcess = tasks.map(({ id, order }) => {
    const task = allTasks[id];
    return task ? { id, order, ...task } : null;
  }).filter(t => t !== null);
  
  const availableTasks = Object.entries(allTasks)
    .filter(([id, task]) => !processTaskIds.has(id))
    .map(([id, task]) => ({ id, ...task }));
  
  // Rebuild HTML
  let flowEditHTML = `
    <div class="space-y-6">
      <div>
        <h4 class="text-sm sm:text-base font-light mb-3 uppercase tracking-wider text-gray-600">Tareas en el Proceso (Ordenadas)</h4>
        <div id="process-tasks-list" class="space-y-2">
          ${tasksInProcess.map((task, index) => {
            const roleName = task.roleId && roleMap[task.roleId] ? roleMap[task.roleId] : null;
            return `
              <div class="border border-gray-200 p-3 flex items-center gap-3 bg-gray-50" data-task-id="${task.id}">
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-sm font-medium text-gray-500 w-6">${index + 1}</span>
                  <div class="flex-1">
                    <div class="font-light text-sm sm:text-base">${escapeHtml(task.name)}</div>
                    ${roleName ? `<div class="text-xs text-gray-600">Rol: ${escapeHtml(roleName)}</div>` : ''}
                  </div>
                </div>
                <div class="flex gap-1">
                  <button onclick="moveTaskUp('${task.id}')" ${index === 0 ? 'disabled' : ''} class="px-2 py-1 text-xs border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Mover arriba">↑</button>
                  <button onclick="moveTaskDown('${task.id}')" ${index === tasksInProcess.length - 1 ? 'disabled' : ''} class="px-2 py-1 text-xs border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Mover abajo">↓</button>
                  <button onclick="removeTaskFromProcess('${task.id}')" class="px-2 py-1 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors" title="Quitar del proceso">×</button>
                </div>
              </div>
            `;
          }).join('')}
          ${tasksInProcess.length === 0 ? '<p class="text-sm text-gray-600 text-center py-4">No hay tareas en el proceso</p>' : ''}
        </div>
      </div>
      
      <div>
        <h4 class="text-sm sm:text-base font-light mb-3 uppercase tracking-wider text-gray-600">Tareas Disponibles (Agregar al Proceso)</h4>
        <div id="available-tasks-list" class="space-y-2">
          ${availableTasks.map(task => {
            const roleName = task.roleId && roleMap[task.roleId] ? roleMap[task.roleId] : null;
            return `
              <div class="border border-gray-200 p-3 flex items-center gap-3">
                <div class="flex-1">
                  <div class="font-light text-sm sm:text-base">${escapeHtml(task.name)}</div>
                  ${roleName ? `<div class="text-xs text-gray-600">Rol: ${escapeHtml(roleName)}</div>` : ''}
                </div>
                <button onclick="addTaskToProcess('${task.id}')" class="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors" title="Agregar al proceso">+ Agregar</button>
              </div>
            `;
          }).join('')}
          ${availableTasks.length === 0 ? '<p class="text-sm text-gray-600 text-center py-4">No hay tareas disponibles</p>' : ''}
        </div>
      </div>
    </div>
  `;
  
  content.innerHTML = flowEditHTML;
}

// Save process flow changes
async function saveProcessFlow() {
  if (!window.currentProcessFlowEdit) return;
  
  const { processId, tasks } = window.currentProcessFlowEdit;
  
  showSpinner('Guardando cambios...');
  try {
    // Update each task's processId and order
    const updatePromises = tasks.map((task, index) => {
      return updateTask(task.id, {
        processId: processId,
        order: index
      });
    });
    
    // Remove processId from tasks that were removed
    const allTasksSnapshot = await getTasksRef().once('value');
    const allTasks = allTasksSnapshot.val() || {};
    const currentTaskIds = new Set(tasks.map(t => t.id));
    
    const removePromises = [];
    Object.entries(allTasks).forEach(([id, task]) => {
      if (task.processId === processId && !currentTaskIds.has(id)) {
        removePromises.push(updateTask(id, {
          processId: null,
          order: null
        }));
      }
    });
    
    // Apply all updates
    await Promise.all([...updatePromises, ...removePromises]);
    
    hideSpinner();
    closeProcessFlowEdit();
    await showSuccess('Flujo del proceso guardado exitosamente');
    
    // Reload process detail
    viewProcess(processId);
  } catch (error) {
    hideSpinner();
    await showError('Error al guardar flujo: ' + error.message);
  }
}

// Close process flow edit modal
function closeProcessFlowEdit() {
  const modal = document.getElementById('process-flow-edit-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  window.currentProcessFlowEdit = null;
}

// Make functions available globally
window.moveTaskUp = moveTaskUp;
window.moveTaskDown = moveTaskDown;
window.removeTaskFromProcess = removeTaskFromProcess;
window.addTaskToProcess = addTaskToProcess;

// Make functions available globally
window.viewProcess = viewProcess;
window.closeProcessDiagram = closeProcessDiagram;
