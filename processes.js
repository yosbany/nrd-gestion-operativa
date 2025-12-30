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
    processesListener();
    processesListener = null;
  }

  // Listen for processes using NRD Data Access
  processesListener = nrd.processes.onValue(async (data) => {
    if (!processesList) return;
    allProcesses = data || {};

    // Load areas for display
    const areas = await nrd.areas.getAll();
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
  const searchContainer = document.querySelector('#processes-search')?.parentElement;
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'none';
  
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
        nrd.processes.getById(processId).then(process => {
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
  const searchContainer = document.querySelector('#processes-search')?.parentElement;
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Save process
function saveProcess(processId, processData) {
  if (processId) {
    return nrd.processes.update(processId, processData);
  } else {
    return nrd.processes.create(processData);
  }
}

// View process detail
async function viewProcess(processId) {
  showSpinner('Cargando proceso...');
  try {
    const process = await nrd.processes.getById(processId);
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
    
    const searchContainer = document.querySelector('#processes-search')?.parentElement;
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');
    if (searchContainer) searchContainer.style.display = 'none';

    // Get area name
    let areaName = 'Sin área';
    if (process.areaId) {
      const area = await nrd.areas.getById(process.areaId);
      if (area) areaName = area.name;
    }

    // Load tasks, roles, and employees for this process
    const [allTasks, allRoles, allEmployees] = await Promise.all([
      nrd.tasks.getAll(),
      nrd.roles.getAll(),
      nrd.employees.getAll()
    ]);
    
    // Create role map and employee map
    const roleMap = {};
    Object.entries(allRoles).forEach(([id, role]) => {
      roleMap[id] = role.name;
    });
    
    const employeeMap = {};
    Object.entries(allEmployees).forEach(([id, employee]) => {
      employeeMap[id] = employee.name;
    });
    
    // Get activities from process.activities (new structure) or from process.taskIds (backward compatibility)
    const processActivities = process.activities || [];
    const activitiesWithTasks = [];
    
    // Process activities (new structure)
    if (processActivities.length > 0) {
      processActivities.forEach((activity, index) => {
        const taskId = activity.taskId;
        if (taskId && allTasks[taskId]) {
          activitiesWithTasks.push({
            activityName: activity.name,
            task: { id: taskId, ...allTasks[taskId] },
            roleId: activity.roleId || null,
            order: index
          });
        }
      });
    } else {
      // Backward compatibility: use process.taskIds
      const processTaskIds = process.taskIds || [];
      processTaskIds.forEach((taskId, index) => {
        if (allTasks[taskId]) {
          activitiesWithTasks.push({
            activityName: allTasks[taskId].name, // Use task name as activity name for backward compatibility
            task: { id: taskId, ...allTasks[taskId] },
            order: index
          });
        }
      });
      
      // Also check for tasks that have this processId (for backward compatibility)
      Object.entries(allTasks).forEach(([id, task]) => {
        // Support both processId (singular) and processIds (array)
        const taskProcessIds = task.processIds || (task.processId ? [task.processId] : []);
        if (taskProcessIds.includes(processId) && !activitiesWithTasks.find(a => a.task.id === id)) {
          activitiesWithTasks.push({
            activityName: task.name,
            task: { id, ...task },
            order: activitiesWithTasks.length
          });
        }
      });
    }

    // Build flow visualization
    let flowHtml = '';
    if (activitiesWithTasks.length > 0) {
      flowHtml = `
        <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Flujo del Proceso (${activitiesWithTasks.length} ${activitiesWithTasks.length === 1 ? 'actividad' : 'actividades'}):</h4>
          <div class="space-y-2">
            ${activitiesWithTasks.map((activityData, index) => {
              const task = activityData.task;
              const activityRoleId = activityData.roleId;
              const activityRoleName = activityRoleId ? (roleMap[activityRoleId] || 'Rol desconocido') : null;
              
              const taskTypeLabels = {
                'with_role': 'Con rol',
                'without_role': 'Sin rol',
                'voluntary': 'Voluntaria',
                'unpaid': 'No remunerada',
                'exchange': 'Canje'
              };
              
              return `
                <div class="border border-gray-200 p-2 sm:p-3 hover:border-red-600 transition-colors">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-medium text-gray-500">${index + 1}</span>
                    <div class="flex-1">
                      <div class="font-medium text-sm sm:text-base text-gray-800">${escapeHtml(activityData.activityName)}</div>
                      <div class="text-xs text-gray-500 mt-0.5 cursor-pointer hover:text-red-600" onclick="viewTask('${task.id}')">Tarea: ${escapeHtml(task.name)}</div>
                    </div>
                    <span class="text-xs px-2 py-0.5 bg-gray-100 rounded">${taskTypeLabels[task.type] || task.type}</span>
                  </div>
                  ${activityRoleName ? `<div class="text-xs text-gray-600 ml-6">Rol: ${escapeHtml(activityRoleName)}</div>` : ''}
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
      </div>
      ${flowHtml}
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
        showProcessDiagram(processId, process.name, activitiesWithTasks, roleMap, employeeMap);
      };
    }
    
    if (flowEditBtn) {
      flowEditBtn.onclick = () => {
        showProcessFlowEdit(processId, process.name, activitiesWithTasks, roleMap, employeeMap);
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
  const searchContainer = document.querySelector('#processes-search')?.parentElement;
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Delete process handler
async function deleteProcessHandler(processId) {
  // Check if process has tasks
  const tasks = await nrd.tasks.getAll();
  const hasTasks = Object.values(tasks || {}).some(t => t.processId === processId);
  
  if (hasTasks) {
    await showError('No se puede eliminar un proceso que tiene tareas asociadas');
    return;
  }

  const confirmed = await showConfirm('Eliminar Proceso', '¿Está seguro de eliminar este proceso?');
  if (!confirmed) return;

  showSpinner('Eliminando proceso...');
  try {
    await nrd.processes.delete(processId);
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
function showProcessDiagram(processId, processName, activitiesWithTasks, roleMap, employeeMap = {}) {
  const modal = document.getElementById('process-diagram-modal');
  const title = document.getElementById('process-diagram-title');
  const content = document.getElementById('process-diagram-content');
  
  if (!modal || !title || !content) return;
  
  title.textContent = `Diagrama: ${escapeHtml(processName)}`;
  
  if (!activitiesWithTasks || activitiesWithTasks.length === 0) {
    content.innerHTML = '<p class="text-center text-gray-600 py-8">No hay actividades en este proceso</p>';
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
  
  activitiesWithTasks.forEach((activityData, index) => {
    const task = activityData.task;
    const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
    const roleNames = taskRoleIds.map(rid => roleMap[rid]).filter(n => n !== undefined);
    const roleName = roleNames.length > 0 ? roleNames.join(', ') : null;
    const taskTypeLabel = taskTypeLabels[task.type] || task.type;
    const taskTypeColor = taskTypeColors[task.type] || 'bg-gray-100 border-gray-300';
    
    // Activity card
    diagramHTML += `
      <div class="w-full max-w-md">
        <div class="border-2 ${taskTypeColor} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2 flex-1">
              <span class="text-lg font-medium text-gray-700 bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-gray-400">${index + 1}</span>
              <div class="flex-1">
                <h4 class="text-base sm:text-lg font-medium text-gray-800">${escapeHtml(activityData.activityName)}</h4>
                <p class="text-xs text-gray-500 mt-0.5 cursor-pointer hover:text-red-600" onclick="closeProcessDiagram(); setTimeout(() => viewTask('${task.id}'), 100);">Tarea: ${escapeHtml(task.name)}</p>
              </div>
            </div>
            <span class="text-xs px-2 py-1 bg-white rounded border border-gray-300 text-gray-700 whitespace-nowrap">${taskTypeLabel}</span>
          </div>
          ${roleName ? `
            <div class="mt-2 pt-2 border-t border-gray-300">
              <span class="text-xs text-gray-600 uppercase tracking-wider">Roles:</span>
              <span class="text-sm font-light text-gray-800 ml-2">${escapeHtml(roleName)}</span>
            </div>
          ` : ''}
          ${task.description ? `
            <div class="mt-2 text-sm text-gray-600 font-light">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Arrow connector (except for last activity)
    if (index < activitiesWithTasks.length - 1) {
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
async function showProcessFlowEdit(processId, processName, activitiesWithTasks, roleMap, employeeMap = {}) {
  const modal = document.getElementById('process-flow-edit-modal');
  const title = document.getElementById('process-flow-edit-title');
  const content = document.getElementById('process-flow-edit-content');
  
  if (!modal || !title || !content) return;
  
  title.textContent = `Editar Flujo: ${escapeHtml(processName)}`;
  
  // Load all tasks, roles, and employees to show available tasks
  showSpinner('Cargando datos...');
  try {
    const [allTasks, allRoles, allEmployees] = await Promise.all([
      nrd.tasks.getAll(),
      nrd.roles.getAll(),
      nrd.employees.getAll()
    ]);
    const roleMap = {};
    Object.entries(allRoles).forEach(([id, role]) => {
      roleMap[id] = role.name;
    });
    
    // Get task IDs already in process
    const processTaskIds = new Set(activitiesWithTasks.map(a => a.task.id));
    
    // Separate activities: in process and available tasks
    const activitiesInProcess = activitiesWithTasks.map((a, index) => ({
      ...a,
      order: index,
      roleId: a.roleId || null // Get roleId from activity if exists
    }));
    const availableTasks = Object.entries(allTasks)
      .filter(([id, task]) => !processTaskIds.has(id))
      .map(([id, task]) => ({ id, ...task }));
    
    hideSpinner();
    
    // Build HTML for flow edit
    let flowEditHTML = `
      <div class="space-y-6">
        <div>
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-sm sm:text-base font-light uppercase tracking-wider text-gray-600">Actividades en el Proceso (Ordenadas)</h4>
            <button onclick="addNewActivity()" class="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors" title="Agregar nueva actividad">+ Nueva Actividad</button>
          </div>
          <div id="process-activities-list" class="space-y-2">
            ${activitiesInProcess.map((activityData, index) => {
              const task = activityData.task;
              const currentRoleId = activityData.roleId || '';
              
              return `
                <div class="border border-gray-200 p-2 bg-gray-50" data-activity-index="${index}">
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="text-xs font-medium text-gray-500 w-5">${index + 1}</span>
                    <div class="flex-1">
                      <label class="block text-xs text-gray-600 mb-0.5">Nombre de la Actividad:</label>
                      <input type="text" id="activity-name-${index}" value="${escapeHtml(activityData.activityName)}" class="w-full px-2 py-0.5 text-xs border border-gray-300 focus:outline-none focus:border-red-600 bg-white" onchange="updateActivityName(${index}, this.value)" />
                    </div>
                    <div class="flex gap-0.5">
                      <button onclick="moveActivityUp(${index})" ${index === 0 ? 'disabled' : ''} class="px-1.5 py-0.5 text-xs border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Mover arriba">↑</button>
                      <button onclick="moveActivityDown(${index})" ${index === activitiesInProcess.length - 1 ? 'disabled' : ''} class="px-1.5 py-0.5 text-xs border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Mover abajo">↓</button>
                      <button onclick="removeActivityFromProcess(${index})" class="px-1.5 py-0.5 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors" title="Quitar del proceso">×</button>
                    </div>
                  </div>
                  <div class="mt-1.5 pt-1.5 border-t border-gray-200">
                    <label class="block text-xs text-gray-600 mb-0.5">Tarea asociada:</label>
                    <select id="activity-task-${index}" class="w-full px-2 py-0.5 text-xs border border-gray-300 focus:outline-none focus:border-red-600 bg-white" onchange="updateActivityTask(${index}, this.value)">
                      <option value="">Seleccionar tarea...</option>
                      ${Object.entries(allTasks).map(([taskId, taskData]) => `
                        <option value="${taskId}" ${task.id === taskId ? 'selected' : ''}>${escapeHtml(taskData.name)}</option>
                      `).join('')}
                    </select>
                  </div>
                  <div class="mt-1.5 pt-1.5 border-t border-gray-200">
                    <label class="block text-xs text-gray-600 mb-0.5">Rol asociado:</label>
                    <select id="activity-role-${index}" class="w-full px-2 py-0.5 text-xs border border-gray-300 focus:outline-none focus:border-red-600 bg-white" onchange="updateActivityRole(${index}, this.value)">
                      <option value="">Seleccionar rol...</option>
                      ${Object.entries(allRoles).map(([roleId, roleData]) => `
                        <option value="${roleId}" ${currentRoleId === roleId ? 'selected' : ''}>${escapeHtml(roleData.name)}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>
              `;
            }).join('')}
            ${activitiesInProcess.length === 0 ? '<p class="text-sm text-gray-600 text-center py-4">No hay actividades en el proceso</p>' : ''}
          </div>
        </div>
      </div>
    `;
    
    content.innerHTML = flowEditHTML;
    
    // Store current state with activities and roles
    window.currentProcessFlowEdit = {
      processId,
      activities: activitiesInProcess.map(a => ({
        name: a.activityName,
        taskId: a.task.id,
        roleId: a.roleId || null,
        order: a.order
      })),
      allRoles: allRoles,
      allTasks: allTasks
    };
    
    modal.classList.remove('hidden');
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar tareas: ' + error.message);
  }
}

// Update activity name
function updateActivityName(index, name) {
  if (window.currentProcessFlowEdit && window.currentProcessFlowEdit.activities[index]) {
    window.currentProcessFlowEdit.activities[index].name = name;
  }
}

// Update activity task
function updateActivityTask(index, taskId) {
  if (window.currentProcessFlowEdit && window.currentProcessFlowEdit.activities[index]) {
    window.currentProcessFlowEdit.activities[index].taskId = taskId;
    updateProcessFlowDisplay();
  }
}

// Update activity role
function updateActivityRole(index, roleId) {
  if (window.currentProcessFlowEdit && window.currentProcessFlowEdit.activities[index]) {
    window.currentProcessFlowEdit.activities[index].roleId = roleId || null;
  }
}

// Add new empty activity
function addNewActivity() {
  if (!window.currentProcessFlowEdit) return;
  
  window.currentProcessFlowEdit.activities.push({
    name: '',
    taskId: '',
    roleId: null,
    order: window.currentProcessFlowEdit.activities.length
  });
  updateProcessFlowDisplay();
}


// Move activity up in process flow
function moveActivityUp(index) {
  const activities = window.currentProcessFlowEdit.activities;
  if (index > 0) {
    [activities[index], activities[index - 1]] = [activities[index - 1], activities[index]];
    updateProcessFlowDisplay();
  }
}

// Move activity down in process flow
function moveActivityDown(index) {
  const activities = window.currentProcessFlowEdit.activities;
  if (index < activities.length - 1) {
    [activities[index], activities[index + 1]] = [activities[index + 1], activities[index]];
    updateProcessFlowDisplay();
  }
}

// Remove activity from process
function removeActivityFromProcess(index) {
  window.currentProcessFlowEdit.activities.splice(index, 1);
  updateProcessFlowDisplay();
}

// Add activity to process (from available tasks list)
function addActivityToProcess(taskId) {
  const task = Object.values(window.allTasksForFlowEdit || {}).find(t => t.id === taskId);
  if (!task) return;
  
  window.currentProcessFlowEdit.activities.push({
    name: task.name, // Use task name as default activity name
    taskId: taskId,
    roleId: null,
    order: window.currentProcessFlowEdit.activities.length
  });
  updateProcessFlowDisplay();
}

// Update process flow display
async function updateProcessFlowDisplay() {
  const content = document.getElementById('process-flow-edit-content');
  if (!content || !window.currentProcessFlowEdit) return;
  
  const { activities } = window.currentProcessFlowEdit;
  
  // Load all tasks, roles, and employees
  const [allTasks, allRoles, allEmployees] = await Promise.all([
    nrd.tasks.getAll(),
    nrd.roles.getAll(),
    nrd.employees.getAll()
  ]);
  
  window.allTasksForFlowEdit = allTasks || {}; // Store for addActivityToProcess
  const roleMap = {};
  Object.entries(allRoles).forEach(([id, role]) => {
    roleMap[id] = role.name;
  });
  
  // Get task IDs already in process
  const processTaskIds = new Set(activities.map(a => a.taskId));
  
  // Build activities with task data (handle activities without taskId)
  const activitiesInProcess = activities.map((activity, index) => {
    const task = activity.taskId ? allTasks[activity.taskId] : null;
    return {
      ...activity,
      task: task ? { id: activity.taskId, ...task } : null
    };
  });
  
  const availableTasks = Object.entries(allTasks)
    .filter(([id, task]) => !processTaskIds.has(id))
    .map(([id, task]) => ({ id, ...task }));
  
  // Rebuild HTML
  let flowEditHTML = `
    <div class="space-y-6">
      <div>
        <div class="flex justify-between items-center mb-3">
          <h4 class="text-sm sm:text-base font-light uppercase tracking-wider text-gray-600">Actividades en el Proceso (Ordenadas)</h4>
          <button onclick="addNewActivity()" class="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors" title="Agregar nueva actividad">+ Nueva Actividad</button>
        </div>
        <div id="process-activities-list" class="space-y-2">
          ${activitiesInProcess.map((activityData, index) => {
            const task = activityData.task || null;
            const currentRoleId = activityData.roleId || '';
            
            return `
              <div class="border border-gray-200 p-2 bg-gray-50" data-activity-index="${index}">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-xs font-medium text-gray-500 w-5">${index + 1}</span>
                  <div class="flex-1">
                    <label class="block text-xs text-gray-600 mb-0.5">Nombre de la Actividad:</label>
                    <input type="text" id="activity-name-${index}" value="${escapeHtml(activityData.name || '')}" class="w-full px-2 py-0.5 text-xs border border-gray-300 focus:outline-none focus:border-red-600 bg-white" onchange="updateActivityName(${index}, this.value)" />
                  </div>
                  <div class="flex gap-0.5">
                    <button onclick="moveActivityUp(${index})" ${index === 0 ? 'disabled' : ''} class="px-1.5 py-0.5 text-xs border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Mover arriba">↑</button>
                    <button onclick="moveActivityDown(${index})" ${index === activitiesInProcess.length - 1 ? 'disabled' : ''} class="px-1.5 py-0.5 text-xs border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Mover abajo">↓</button>
                    <button onclick="removeActivityFromProcess(${index})" class="px-1.5 py-0.5 text-xs border border-red-300 text-red-600 hover:bg-red-50 transition-colors" title="Quitar del proceso">×</button>
                  </div>
                </div>
                <div class="mt-1.5 pt-1.5 border-t border-gray-200">
                  <label class="block text-xs text-gray-600 mb-0.5">Tarea asociada:</label>
                  <select id="activity-task-${index}" class="w-full px-2 py-0.5 text-xs border border-gray-300 focus:outline-none focus:border-red-600 bg-white" onchange="updateActivityTask(${index}, this.value)">
                    <option value="">Seleccionar tarea...</option>
                    ${Object.entries(allTasks).map(([taskId, taskData]) => `
                      <option value="${taskId}" ${task && task.id === taskId ? 'selected' : ''}>${escapeHtml(taskData.name)}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="mt-1.5 pt-1.5 border-t border-gray-200">
                  <label class="block text-xs text-gray-600 mb-0.5">Rol asociado:</label>
                  <select id="activity-role-${index}" class="w-full px-2 py-0.5 text-xs border border-gray-300 focus:outline-none focus:border-red-600 bg-white" onchange="updateActivityRole(${index}, this.value)">
                    <option value="">Seleccionar rol...</option>
                    ${Object.entries(allRoles).map(([roleId, roleData]) => `
                      <option value="${roleId}" ${currentRoleId === roleId ? 'selected' : ''}>${escapeHtml(roleData.name)}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            `;
          }).join('')}
          ${activitiesInProcess.length === 0 ? '<p class="text-sm text-gray-600 text-center py-4">No hay actividades en el proceso</p>' : ''}
        </div>
      </div>
    </div>
  `;
  
  content.innerHTML = flowEditHTML;
  
  // Update stored activities with current order
  window.currentProcessFlowEdit.activities = activities.map((a, index) => ({
    name: a.name || '',
    taskId: a.taskId || '',
    roleId: a.roleId || null,
    order: index
  }));
}

// Save process flow changes
async function saveProcessFlow() {
  if (!window.currentProcessFlowEdit) return;
  
  // Get current employee assignments and activity names from form elements
  const { processId, activities } = window.currentProcessFlowEdit;
  
  // Update activities from form elements before saving
  const updatedActivities = activities.map((activity, index) => {
    const nameInput = document.getElementById(`activity-name-${index}`);
    const taskSelect = document.getElementById(`activity-task-${index}`);
    const roleSelect = document.getElementById(`activity-role-${index}`);
    
    return {
      name: nameInput ? nameInput.value : activity.name,
      taskId: taskSelect ? taskSelect.value : activity.taskId,
      roleId: roleSelect ? (roleSelect.value || null) : (activity.roleId || null),
      order: index
    };
  });
  
  showSpinner('Guardando cambios...');
  try {
    // Update process with activities array
    const activitiesToSave = updatedActivities.map(a => ({
      name: a.name,
      taskId: a.taskId,
      roleId: a.roleId
    }));
    
    await nrd.processes.update(processId, {
      activities: activitiesToSave
    });
    
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
window.updateActivityName = updateActivityName;
window.updateActivityTask = updateActivityTask;
window.updateActivityRole = updateActivityRole;
window.addNewActivity = addNewActivity;
window.moveActivityUp = moveActivityUp;
window.moveActivityDown = moveActivityDown;
window.removeActivityFromProcess = removeActivityFromProcess;
window.addActivityToProcess = addActivityToProcess;

// Make functions available globally
window.viewProcess = viewProcess;
window.closeProcessDiagram = closeProcessDiagram;
