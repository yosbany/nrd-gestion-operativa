// Task management

let tasksListener = null;
let allTasks = {}; // Store all tasks for filtering
let taskProcessMap = {}; // Store process names for tasks
let taskRoleMap = {}; // Store role names for tasks

const taskTypeLabels = {
  'with_role': 'Con rol',
  'without_role': 'Sin rol',
  'voluntary': 'Voluntaria',
  'unpaid': 'No remunerada',
  'exchange': 'Canje'
};

// Filter and display tasks
async function filterAndDisplayTasks(searchTerm = '') {
  const tasksList = document.getElementById('tasks-list');
  if (!tasksList) return;
  
  tasksList.innerHTML = '';
  
  const term = searchTerm.toLowerCase().trim();
  const filteredTasks = Object.entries(allTasks).filter(([id, task]) => {
    if (!term) return true;
    const name = (task.name || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    const processName = (taskProcessMap[task.processId] || '').toLowerCase();
    const roleName = (taskRoleMap[task.roleId] || '').toLowerCase();
    const frequency = (task.frequency || '').toLowerCase();
    const typeLabel = (taskTypeLabels[task.type] || '').toLowerCase();
    return name.includes(term) || description.includes(term) || processName.includes(term) || 
           roleName.includes(term) || frequency.includes(term) || typeLabel.includes(term);
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No se encontraron tareas</p>';
    return;
  }

  filteredTasks.forEach(([id, task]) => {
    const item = document.createElement('div');
    item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
    item.dataset.taskId = id;
    const processName = task.processId ? (taskProcessMap[task.processId] || 'Proceso desconocido') : 'Sin proceso';
    const roleName = task.roleId ? (taskRoleMap[task.roleId] || 'Rol desconocido') : 'Sin rol';
    
    item.innerHTML = `
      <div class="flex justify-between items-center mb-2 sm:mb-3">
        <div class="text-base sm:text-lg font-light">${escapeHtml(task.name)}</div>
        <div class="flex items-center gap-2">
          ${task.cost ? `<span class="text-xs sm:text-sm text-gray-600">$${parseFloat(task.cost).toFixed(2)}</span>` : ''}
          <span class="text-xs px-2 py-0.5 bg-gray-100 rounded">${taskTypeLabels[task.type] || task.type || 'Sin tipo'}</span>
        </div>
      </div>
      <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
        <div>Proceso: ${escapeHtml(processName)}</div>
        ${task.roleId ? `<div>Rol: ${escapeHtml(roleName)}</div>` : ''}
        ${task.estimatedTime ? `<div>Tiempo estimado: ${task.estimatedTime} min</div>` : ''}
        ${task.frequency ? `<div>Frecuencia: ${escapeHtml(task.frequency)}</div>` : ''}
      </div>
    `;
    item.addEventListener('click', () => viewTask(id));
    tasksList.appendChild(item);
  });
}

// Load tasks
function loadTasks() {
  const tasksList = document.getElementById('tasks-list');
  if (!tasksList) return;
  
  tasksList.innerHTML = '';

  // Remove previous listener
  if (tasksListener) {
    getTasksRef().off('value', tasksListener);
    tasksListener = null;
  }

  // Listen for tasks
  tasksListener = getTasksRef().on('value', async (snapshot) => {
    if (!tasksList) return;
    allTasks = snapshot.val() || {};

    // Load processes and roles for display
    const processesSnapshot = await getProcessesRef().once('value');
    const processes = processesSnapshot.val() || {};
    taskProcessMap = {};
    Object.entries(processes).forEach(([id, process]) => {
      taskProcessMap[id] = process.name;
    });

    const rolesSnapshot = await getRolesRef().once('value');
    const roles = rolesSnapshot.val() || {};
    taskRoleMap = {};
    Object.entries(roles).forEach(([id, role]) => {
      taskRoleMap[id] = role.name;
    });
    
    // Get search term and filter
    const searchInput = document.getElementById('tasks-search');
    const searchTerm = searchInput ? searchInput.value : '';
    await filterAndDisplayTasks(searchTerm);
  });
  
  // Add search input listener
  const searchInput = document.getElementById('tasks-search');
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      await filterAndDisplayTasks(e.target.value);
    });
  }
}

// Show task form
function showTaskForm(taskId = null) {
  const form = document.getElementById('task-form');
  const list = document.getElementById('tasks-list');
  const header = document.querySelector('#tasks-view .flex.flex-col');
  const detail = document.getElementById('task-detail');
  const title = document.getElementById('task-form-title');
  const formElement = document.getElementById('task-form-element');
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  
  if (formElement) {
    formElement.reset();
    const taskIdInput = document.getElementById('task-id');
    if (taskIdInput) taskIdInput.value = taskId || '';
  }

  // Load processes and roles for selects
  Promise.all([
    getProcessesRef().once('value'),
    getRolesRef().once('value')
  ]).then(([processesSnapshot, rolesSnapshot]) => {
    const processes = processesSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};
    
    // Process select
    const processSelect = document.getElementById('task-process-select');
    if (processSelect) {
      processSelect.innerHTML = '<option value="">Sin proceso</option>';
      Object.entries(processes).forEach(([id, process]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = process.name;
        processSelect.appendChild(option);
      });
    }
    
    // Role select
    const roleSelect = document.getElementById('task-role-select');
    if (roleSelect) {
      roleSelect.innerHTML = '<option value="">Sin rol</option>';
      Object.entries(roles).forEach(([id, role]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = role.name;
        roleSelect.appendChild(option);
      });
    }
  });

  if (taskId) {
    if (title) title.textContent = 'Editar Tarea';
    getTask(taskId).then(snapshot => {
      const task = snapshot.val();
      if (task) {
        document.getElementById('task-name').value = task.name || '';
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-type').value = task.type || 'with_role';
        document.getElementById('task-process-select').value = task.processId || '';
        document.getElementById('task-role-select').value = task.roleId || '';
        document.getElementById('task-frequency').value = task.frequency || '';
        document.getElementById('task-estimated-time').value = task.estimatedTime || '';
        document.getElementById('task-cost').value = task.cost || '';
        document.getElementById('task-order').value = task.order || '';
        document.getElementById('task-execution-steps').value = task.executionSteps ? task.executionSteps.join('\n') : '';
        document.getElementById('task-success-criteria').value = task.successCriteria || '';
        document.getElementById('task-common-errors').value = task.commonErrors ? task.commonErrors.join('\n') : '';
        
        // Update role select visibility based on type
        updateRoleSelectVisibility(task.type);
      }
    });
  } else {
    if (title) title.textContent = 'Nueva Tarea';
    document.getElementById('task-type').value = 'with_role';
    updateRoleSelectVisibility('with_role');
  }
  
  // Add event listener for type change
  const typeSelect = document.getElementById('task-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      updateRoleSelectVisibility(e.target.value);
    });
  }
}

// Update role select visibility based on task type
function updateRoleSelectVisibility(taskType) {
  const roleSelectContainer = document.getElementById('task-role-select-container');
  const roleSelect = document.getElementById('task-role-select');
  
  if (roleSelectContainer && roleSelect) {
    if (taskType === 'with_role') {
      roleSelectContainer.style.display = 'block';
      roleSelect.required = true;
    } else {
      roleSelectContainer.style.display = 'none';
      roleSelect.required = false;
      roleSelect.value = '';
    }
  }
}

// Hide task form
function hideTaskForm() {
  const form = document.getElementById('task-form');
  const list = document.getElementById('tasks-list');
  const header = document.querySelector('#tasks-view .flex.flex-col');
  const detail = document.getElementById('task-detail');
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
}

// Save task
function saveTask(taskId, taskData) {
  if (taskId) {
    return updateTask(taskId, taskData);
  } else {
    return createTask(taskData);
  }
}

// View task detail
async function viewTask(taskId) {
  showSpinner('Cargando tarea...');
  try {
    const snapshot = await getTask(taskId);
    const task = snapshot.val();
    hideSpinner();
    if (!task) {
      await showError('Tarea no encontrada');
      return;
    }

    const list = document.getElementById('tasks-list');
    const header = document.querySelector('#tasks-view .flex.flex-col');
    const form = document.getElementById('task-form');
    const detail = document.getElementById('task-detail');
    const detailContent = document.getElementById('task-detail-content');
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');

    // Get process and role names
    let processName = 'Sin proceso';
    if (task.processId) {
      const processSnapshot = await getProcess(task.processId);
      const process = processSnapshot.val();
      if (process) processName = process.name;
    }

    let roleName = 'Sin rol';
    if (task.roleId) {
      const roleSnapshot = await getRole(task.roleId);
      const role = roleSnapshot.val();
      if (role) roleName = role.name;
    }

    const taskTypeLabels = {
      'with_role': 'Con rol asignado',
      'without_role': 'Sin rol asignado',
      'voluntary': 'Voluntaria',
      'unpaid': 'No remunerada',
      'exchange': 'Canje por beneficios'
    };

    detailContent.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(task.name)}</span>
        </div>
        ${task.description ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Descripción:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(task.description)}</span>
        </div>
        ` : ''}
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Tipo:</span>
          <span class="font-light text-sm sm:text-base">${taskTypeLabels[task.type] || task.type || 'Sin tipo'}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Proceso:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(processName)}</span>
        </div>
        ${task.roleId ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Rol:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(roleName)}</span>
        </div>
        ` : ''}
        ${task.frequency ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Frecuencia:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(task.frequency)}</span>
        </div>
        ` : ''}
        ${task.estimatedTime ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Tiempo estimado:</span>
          <span class="font-light text-sm sm:text-base">${task.estimatedTime} minutos</span>
        </div>
        ` : ''}
        ${task.cost ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Costo/Pago:</span>
          <span class="font-light text-sm sm:text-base">$${parseFloat(task.cost).toFixed(2)}</span>
        </div>
        ` : ''}
        ${task.order ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Orden:</span>
          <span class="font-light text-sm sm:text-base">${task.order}</span>
        </div>
        ` : ''}
      </div>
      ${task.executionSteps && task.executionSteps.length > 0 ? `
      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Pasos de Ejecución:</h4>
        <ol class="list-decimal list-inside space-y-2">
          ${task.executionSteps.map(step => `<li class="text-sm sm:text-base font-light">${escapeHtml(step)}</li>`).join('')}
        </ol>
      </div>
      ` : ''}
      ${task.successCriteria ? `
      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Criterios de Ejecución Correcta:</h4>
        <p class="text-sm sm:text-base font-light">${escapeHtml(task.successCriteria)}</p>
      </div>
      ` : ''}
      ${task.commonErrors && task.commonErrors.length > 0 ? `
      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Errores Comunes:</h4>
        <ul class="list-disc list-inside space-y-2">
          ${task.commonErrors.map(error => `<li class="text-sm sm:text-base font-light">${escapeHtml(error)}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-task-detail-btn');
    const deleteBtn = document.getElementById('delete-task-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showTaskForm(taskId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteTaskHandler(taskId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar tarea: ' + error.message);
  }
}

// Back to tasks list
function backToTasks() {
  const list = document.getElementById('tasks-list');
  const header = document.querySelector('#tasks-view .flex.flex-col');
  const detail = document.getElementById('task-detail');
  const form = document.getElementById('task-form');
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
}

// Delete task handler
async function deleteTaskHandler(taskId) {
  // Check if task has executions
  const executionsSnapshot = await getTaskExecutionsRef().once('value');
  const executions = executionsSnapshot.val() || {};
  const hasExecutions = Object.values(executions).some(e => e.taskId === taskId);
  
  if (hasExecutions) {
    await showError('No se puede eliminar una tarea que tiene ejecuciones registradas');
    return;
  }

  const confirmed = await showConfirm('Eliminar Tarea', '¿Está seguro de eliminar esta tarea?');
  if (!confirmed) return;

  showSpinner('Eliminando tarea...');
  try {
    await deleteTask(taskId);
    hideSpinner();
    backToTasks();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar tarea: ' + error.message);
  }
}

// Task form submit
const taskFormElement = document.getElementById('task-form-element');
if (taskFormElement) {
  taskFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    const name = document.getElementById('task-name').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const type = document.getElementById('task-type').value;
    const processId = document.getElementById('task-process-select').value || null;
    const roleId = document.getElementById('task-role-select').value || null;
    const frequency = document.getElementById('task-frequency').value.trim() || null;
    const estimatedTime = parseInt(document.getElementById('task-estimated-time').value) || null;
    const cost = parseFloat(document.getElementById('task-cost').value) || null;
    const order = parseInt(document.getElementById('task-order').value) || null;
    
    // Parse execution steps (one per line)
    const executionStepsText = document.getElementById('task-execution-steps').value.trim();
    const executionSteps = executionStepsText ? executionStepsText.split('\n').filter(s => s.trim()) : null;
    
    const successCriteria = document.getElementById('task-success-criteria').value.trim() || null;
    
    // Parse common errors (one per line)
    const commonErrorsText = document.getElementById('task-common-errors').value.trim();
    const commonErrors = commonErrorsText ? commonErrorsText.split('\n').filter(s => s.trim()) : null;

    if (!name) {
      await showError('Por favor complete el nombre de la tarea');
      return;
    }

    if (type === 'with_role' && !roleId) {
      await showError('Las tareas con rol asignado deben tener un rol seleccionado');
      return;
    }

    showSpinner('Guardando tarea...');
    try {
      await saveTask(taskId || null, { 
        name,
        description: description || null,
        type,
        processId: processId || null,
        roleId: (type === 'with_role' && roleId) ? roleId : null,
        frequency,
        estimatedTime,
        cost: cost || null,
        order,
        executionSteps,
        successCriteria,
        commonErrors
      });
      hideSpinner();
      hideTaskForm();
      await showSuccess('Tarea guardada exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar tarea: ' + error.message);
    }
  });
}

// New task button
const newTaskBtn = document.getElementById('new-task-btn');
if (newTaskBtn) {
  newTaskBtn.addEventListener('click', () => {
    showTaskForm();
  });
}

// Cancel task form
const cancelTaskBtn = document.getElementById('cancel-task-btn');
if (cancelTaskBtn) {
  cancelTaskBtn.addEventListener('click', () => {
    hideTaskForm();
  });
}

// Close task form button
const closeTaskFormBtn = document.getElementById('close-task-form');
if (closeTaskFormBtn) {
  closeTaskFormBtn.addEventListener('click', () => {
    hideTaskForm();
  });
}

// Back to tasks button
const backToTasksBtn = document.getElementById('back-to-tasks');
if (backToTasksBtn) {
  backToTasksBtn.addEventListener('click', () => {
    backToTasks();
  });
}

// Load tasks for select
function loadTasksForSelect() {
  return getTasksRef().once('value').then(snapshot => {
    const tasks = snapshot.val() || {};
    return Object.entries(tasks).map(([id, task]) => ({ id, ...task }));
  });
}

// Make functions available globally
window.viewTask = viewTask;
