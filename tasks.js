// Task management

let tasksListener = null;
let allTasks = {}; // Store all tasks for filtering
let taskProcessMap = {}; // Store process names for tasks
let taskRoleMap = {}; // Store role names for tasks

// Calculate task cost based on roles and employees
// Cost is calculated as: average monthly salary of employees with task roles / minutes per month * estimated time
// Assumes 160 working hours per month = 9600 minutes
async function calculateTaskCost(task) {
  try {
    // Only calculate cost for tasks with roles
    if (task.type !== 'with_role') {
      return null;
    }
    
    const roleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
    if (!roleIds || roleIds.length === 0) {
      return null;
    }
    
    // Get estimated time
    const estimatedTime = task.estimatedTime || 0;
    if (estimatedTime === 0) {
      return null;
    }
    
    // Load all employees
    const employeesSnapshot = await getEmployeesRef().once('value');
    const allEmployees = employeesSnapshot.val() || {};
    
    // For each role, get employees with that role and their salaries
    const roleCosts = [];
    
    for (const roleId of roleIds) {
      const employeesWithRole = Object.values(allEmployees).filter(emp => {
        const empRoleIds = emp.roleIds || (emp.roleId ? [emp.roleId] : []);
        return empRoleIds.includes(roleId);
      });
      
      if (employeesWithRole.length === 0) {
        continue;
      }
      
      // Get salaries (only employees with salary)
      const salaries = employeesWithRole
        .map(emp => emp.salary ? parseFloat(emp.salary) : null)
        .filter(s => s !== null && s > 0);
      
      if (salaries.length === 0) {
        continue;
      }
      
      // Calculate average salary for this role
      const avgSalary = salaries.reduce((sum, s) => sum + s, 0) / salaries.length;
      
      // Convert monthly salary to cost per minute
      // Assuming 160 working hours per month = 9600 minutes
      const costPerMinute = avgSalary / 9600;
      
      // Calculate cost for this role
      const roleCost = costPerMinute * estimatedTime;
      roleCosts.push(roleCost);
    }
    
    if (roleCosts.length === 0) {
      return null;
    }
    
    // Calculate average cost across all roles
    const avgCost = roleCosts.reduce((sum, c) => sum + c, 0) / roleCosts.length;
    
    return avgCost;
  } catch (error) {
    console.error('Error calculating task cost:', error);
    return null;
  }
}

const taskTypeLabels = {
  'with_role': 'Con rol',
  'without_role': 'Sin rol',
  'voluntary': 'Voluntaria',
  'unpaid': 'No remunerada',
  'exchange': 'Canje'
};

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

// Filter and display tasks
async function filterAndDisplayTasks(searchTerm = '') {
  const tasksList = document.getElementById('tasks-list');
  if (!tasksList) return;
  
  tasksList.innerHTML = '';
  
  const term = normalizeSearchText(searchTerm.trim());
  const filteredTasks = Object.entries(allTasks).filter(([id, task]) => {
    // Filter by search term
    if (!term) return true;
    
    const name = normalizeSearchText(task.name || '');
    const description = normalizeSearchText(task.description || '');
    const processName = normalizeSearchText(taskProcessMap[task.processId] || '');
    
    // Get all role names for search
    const roleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
    const roleNames = roleIds.map(rid => normalizeSearchText(taskRoleMap[rid] || '')).join(' ');
    
    const frequency = normalizeSearchText(task.frequency || '');
    const typeLabel = normalizeSearchText(taskTypeLabels[task.type] || '');
    return name.includes(term) || description.includes(term) || processName.includes(term) || 
           roleNames.includes(term) || frequency.includes(term) || typeLabel.includes(term);
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No se encontraron tareas</p>';
    return;
  }

  // Calculate costs for all tasks
  const costPromises = filteredTasks.map(([id, task]) => calculateTaskCost(task));
  const calculatedCosts = await Promise.all(costPromises);
  
  filteredTasks.forEach(([id, task], index) => {
    const item = document.createElement('div');
    item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
    item.dataset.taskId = id;
    const processName = task.processId ? (taskProcessMap[task.processId] || 'Proceso desconocido') : 'Sin proceso';
    const calculatedCost = calculatedCosts[index];
    
    // Get role names (support both old roleId and new roleIds)
    const roleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
    const roleNames = roleIds.map(rid => taskRoleMap[rid]).filter(n => n !== undefined);
    const roleName = roleNames.length > 0 ? roleNames.join(', ') : 'Sin rol';
    
    item.innerHTML = `
      <div class="flex justify-between items-center mb-2 sm:mb-3">
        <div class="text-base sm:text-lg font-light">${escapeHtml(task.name)}</div>
        <div class="flex items-center gap-2">
          ${calculatedCost !== null ? `<span class="text-xs sm:text-sm text-gray-600">$${calculatedCost.toFixed(2)}</span>` : ''}
          <span class="text-xs px-2 py-0.5 bg-gray-100 rounded">${taskTypeLabels[task.type] || task.type || 'Sin tipo'}</span>
        </div>
      </div>
      <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
        <div>Proceso: ${escapeHtml(processName)}</div>
        ${roleNames.length > 0 ? `<div>Roles: ${escapeHtml(roleName)}</div>` : ''}
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
    
    // Get search term
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
async function showTaskForm(taskId = null) {
  const form = document.getElementById('task-form');
  const list = document.getElementById('tasks-list');
  const header = document.querySelector('#tasks-view .flex.flex-col');
  const detail = document.getElementById('task-detail');
  const title = document.getElementById('task-form-title');
  const formElement = document.getElementById('task-form-element');
  const searchContainer = document.querySelector('#tasks-search')?.parentElement;
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'none';
  
  if (formElement) {
    formElement.reset();
    const taskIdInput = document.getElementById('task-id');
    if (taskIdInput) taskIdInput.value = taskId || '';
  }

  // Load roles for checkboxes
  Promise.all([
    getRolesRef().once('value'),
    taskId ? getTask(taskId) : Promise.resolve(null)
  ]).then(async ([rolesSnapshot, taskSnapshot]) => {
    const roles = rolesSnapshot.val() || {};
    const task = taskSnapshot && taskSnapshot.val() ? taskSnapshot.val() : null;
    
    // Calculate and display cost if editing
    if (task) {
      const calculatedCost = await calculateTaskCost(task);
      const costInput = document.getElementById('task-cost');
      if (costInput) {
        costInput.value = calculatedCost !== null ? `$${calculatedCost.toFixed(2)} (calculado)` : 'No calculable';
      }
    } else {
      const costInput = document.getElementById('task-cost');
      if (costInput) {
        costInput.value = 'Se calculará automáticamente al guardar';
      }
    }
    
    // Roles checkboxes
    const rolesContainer = document.getElementById('task-roles-container');
    if (rolesContainer) {
      rolesContainer.innerHTML = '';
      if (Object.keys(roles).length === 0) {
        rolesContainer.innerHTML = '<p class="text-sm text-gray-500">No hay roles disponibles</p>';
      } else {
        // Get task roleIds if editing
        const roleIds = task
          ? (task.roleIds || (task.roleId ? [task.roleId] : []))
          : [];
        
        Object.entries(roles).forEach(([roleId, role]) => {
          const label = document.createElement('label');
          label.className = 'flex items-center gap-2 cursor-pointer';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.value = roleId;
          checkbox.className = 'w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500';
          checkbox.dataset.roleId = roleId;
          // Mark as checked if this role is in the task's roleIds
          checkbox.checked = roleIds.includes(roleId);
          const span = document.createElement('span');
          span.className = 'text-sm font-light';
          span.textContent = role.name;
          label.appendChild(checkbox);
          label.appendChild(span);
          rolesContainer.appendChild(label);
        });
      }
    }
  });

  if (taskId) {
    if (title) title.textContent = 'Editar Tarea';
    getTask(taskId).then(async snapshot => {
      const task = snapshot.val();
      if (task) {
        document.getElementById('task-name').value = task.name || '';
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-type').value = task.type || 'with_role';
        document.getElementById('task-frequency').value = task.frequency || '';
        document.getElementById('task-estimated-time').value = task.estimatedTime || '';
        // Calculate and display cost
        const calculatedCost = await calculateTaskCost(task);
        document.getElementById('task-cost').value = calculatedCost !== null ? `$${calculatedCost.toFixed(2)} (calculado)` : 'No calculable';
        document.getElementById('task-execution-steps').value = task.executionSteps ? task.executionSteps.join('\n') : '';
        document.getElementById('task-success-criteria').value = task.successCriteria ? (Array.isArray(task.successCriteria) ? task.successCriteria.join('\n') : task.successCriteria) : '';
        document.getElementById('task-common-errors').value = task.commonErrors ? task.commonErrors.join('\n') : '';
        
        // Set checked roles (support both old roleId and new roleIds)
        const roleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
        const checkboxes = document.querySelectorAll('#task-roles-container input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = roleIds.includes(checkbox.value);
        });
        
        // Update role container visibility based on type
        updateRoleSelectVisibility(task.type);
      }
    });
  } else {
    if (title) title.textContent = 'Nueva Tarea';
    document.getElementById('task-type').value = 'with_role';
    updateRoleSelectVisibility('with_role');
    const costInput = document.getElementById('task-cost');
    if (costInput) {
      costInput.value = 'Se calculará automáticamente al guardar';
    }
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
  if (roleSelectContainer) {
    if (taskType === 'with_role') {
      roleSelectContainer.style.display = 'block';
    } else {
      roleSelectContainer.style.display = 'none';
      // Uncheck all checkboxes when hiding
      const checkboxes = document.querySelectorAll('#task-roles-container input[type="checkbox"]');
      checkboxes.forEach(checkbox => checkbox.checked = false);
    }
  }
}

// Hide task form
function hideTaskForm() {
  const form = document.getElementById('task-form');
  const list = document.getElementById('tasks-list');
  const header = document.querySelector('#tasks-view .flex.flex-col');
  const detail = document.getElementById('task-detail');
  const searchContainer = document.querySelector('#tasks-search')?.parentElement;
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
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
    
    const searchContainer = document.querySelector('#tasks-search')?.parentElement;
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');
    if (searchContainer) searchContainer.style.display = 'none';

    // Get process and role names
    let processName = 'Sin proceso';
    if (task.processId) {
      const processSnapshot = await getProcess(task.processId);
      const process = processSnapshot.val();
      if (process) processName = process.name;
    }

    // Get role names (support both old roleId and new roleIds)
    const roleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
    let roleNames = 'Sin rol';
    
    if (roleIds.length > 0) {
      const rolePromises = roleIds.map(roleId => getRole(roleId).then(snapshot => {
        const role = snapshot.val();
        return role ? role.name : null;
      }));
      const roleNamesArray = await Promise.all(rolePromises);
      const validNames = roleNamesArray.filter(n => n !== null);
      roleNames = validNames.length > 0 ? validNames.join(', ') : 'Sin rol';
    }

    const taskTypeLabels = {
      'with_role': 'Con rol asignado',
      'without_role': 'Sin rol asignado',
      'voluntary': 'Voluntaria',
      'unpaid': 'No remunerada',
      'exchange': 'Canje por beneficios'
    };

    // Calculate task cost
    const calculatedCost = await calculateTaskCost(task);

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
        ${roleIds.length > 0 ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Roles:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(roleNames)}</span>
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
        ${calculatedCost !== null ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Costo calculado:</span>
          <span class="font-light text-sm sm:text-base">$${calculatedCost.toFixed(2)}</span>
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
      ${task.successCriteria && (Array.isArray(task.successCriteria) ? task.successCriteria.length > 0 : task.successCriteria) ? `
      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Criterios de Ejecución Correcta:</h4>
        ${Array.isArray(task.successCriteria) ? `
        <ul class="list-disc list-inside space-y-2">
          ${task.successCriteria.map(criterion => `<li class="text-sm sm:text-base font-light">${escapeHtml(criterion)}</li>`).join('')}
        </ul>
        ` : `
        <p class="text-sm sm:text-base font-light">${escapeHtml(task.successCriteria)}</p>
        `}
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
  const searchContainer = document.querySelector('#tasks-search')?.parentElement;
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Delete task handler
async function deleteTaskHandler(taskId) {
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
    const frequency = document.getElementById('task-frequency').value.trim() || null;
    const estimatedTime = parseInt(document.getElementById('task-estimated-time').value) || null;
    // Cost is calculated automatically, not stored
    
    // Get selected roles
    const roleCheckboxes = document.querySelectorAll('#task-roles-container input[type="checkbox"]:checked');
    const roleIds = Array.from(roleCheckboxes).map(cb => cb.value);
    
    // Parse execution steps (one per line)
    const executionStepsText = document.getElementById('task-execution-steps').value.trim();
    const executionSteps = executionStepsText ? executionStepsText.split('\n').filter(s => s.trim()) : null;
    
    // Parse success criteria (one per line)
    const successCriteriaText = document.getElementById('task-success-criteria').value.trim();
    const successCriteria = successCriteriaText ? successCriteriaText.split('\n').filter(s => s.trim()) : null;
    
    // Parse common errors (one per line)
    const commonErrorsText = document.getElementById('task-common-errors').value.trim();
    const commonErrors = commonErrorsText ? commonErrorsText.split('\n').filter(s => s.trim()) : null;

    if (!name) {
      await showError('Por favor complete el nombre de la tarea');
      return;
    }

    if (type === 'with_role' && roleIds.length === 0) {
      await showError('Las tareas con rol asignado deben tener al menos un rol seleccionado');
      return;
    }

    showSpinner('Guardando tarea...');
    try {
      const taskData = { 
        name,
        description: description || null,
        type,
        frequency,
        estimatedTime,
        // Cost is calculated automatically, not stored
        cost: null,
        executionSteps,
        successCriteria,
        commonErrors
      };
      
      // Store roleIds as array (or null if empty or type is not with_role)
      if (type === 'with_role' && roleIds.length > 0) {
        taskData.roleIds = roleIds;
        // Remove old roleId if exists (for migration)
        taskData.roleId = null;
      } else {
        taskData.roleIds = null;
        taskData.roleId = null;
      }
      
      await saveTask(taskId || null, taskData);
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
