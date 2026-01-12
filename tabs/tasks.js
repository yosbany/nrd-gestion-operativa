// Task management

let tasksListener = null;
let allTasks = {}; // Store all tasks for filtering
let taskProcessMap = {}; // Store process names for tasks
let taskRoleMap = {}; // Store role names for tasks

// Calculate task cost based on roles and employees
// Cost is calculated as: average monthly salary of employees with task roles / minutes per month * estimated time
// Assumes 160 working hours per month = 9600 minutes
async function calculateTaskCost(task, taskId = null) {
  try {
    // Calculate cost based on roles deduced from processes
    // Get task ID from parameter or task object
    const id = taskId || task.id || task.key || task.$id;
    if (!id) {
      return null;
    }
    
    // Get all processes to find roles for this task
    let allProcesses = await nrd.processes.getAll();
    
    // Convert array to object if needed
    const convertToObject = (data) => {
      if (Array.isArray(data)) {
        const obj = {};
        data.forEach((item, index) => {
          const itemId = item.id || item.key || item.$id || index.toString();
          obj[itemId] = item;
        });
        return obj;
      }
      return data || {};
    };
    
    allProcesses = convertToObject(allProcesses);
    
    // Find roleIds from process activities
    const roleIds = new Set();
    Object.values(allProcesses).forEach(process => {
      if (process.activities && Array.isArray(process.activities)) {
        process.activities.forEach(activity => {
          // Find activities that use this task
          if (activity.taskId === id && activity.roleId) {
            roleIds.add(activity.roleId);
          }
        });
      }
    });
    
    // Note: task.roleIds is deprecated, roles are now configured in process activities
    // Keep this for backward compatibility with existing data
    const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
    taskRoleIds.forEach(roleId => roleIds.add(roleId));
    
    if (roleIds.size === 0) {
      return null;
    }
    
    // Get estimated time
    const estimatedTime = task.estimatedTime || 0;
    if (estimatedTime === 0) {
      return null;
    }
    
    // Load all employees
    const allEmployees = await nrd.employees.getAll();
    
    // For each role, get employees with that role and their salaries
    const roleCosts = [];
    
    for (const roleId of Array.from(roleIds)) {
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
      const processName = normalizeSearchText(taskProcessMap[id] || '');
      const roleNames = normalizeSearchText(taskRoleMap[id] || '');
    
    const frequency = normalizeSearchText(task.frequency || '');
    return name.includes(term) || description.includes(term) || processName.includes(term) || 
           roleNames.includes(term) || frequency.includes(term);
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No se encontraron tareas</p>';
    return;
  }

  // Calculate costs for all tasks
  const costPromises = filteredTasks.map(([id, task]) => calculateTaskCost(task, id));
  const calculatedCosts = await Promise.all(costPromises);
  
  filteredTasks.forEach(([id, task], index) => {
    const item = document.createElement('div');
    item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
    item.dataset.taskId = id;
    const processName = taskProcessMap[id] || 'Sin proceso';
    const calculatedCost = calculatedCosts[index];
    const roleName = taskRoleMap[id] || 'Sin rol';
    
    item.innerHTML = `
      <div class="flex justify-between items-center mb-2 sm:mb-3">
        <div class="text-base sm:text-lg font-light">${escapeHtml(task.name)}</div>
        <div class="flex items-center gap-2">
          ${calculatedCost !== null ? `<span class="text-xs sm:text-sm text-gray-600">$${calculatedCost.toFixed(2)}</span>` : ''}
        </div>
      </div>
      ${task.description ? `
      <div class="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
        Descripción: <span class="font-light">${escapeHtml(task.description)}</span>
      </div>
      ` : ''}
      <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
        ${roleName !== 'Sin rol' ? `<div>Roles: ${escapeHtml(roleName)}</div>` : ''}
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
    tasksListener();
    tasksListener = null;
  }

  // Listen for tasks using NRD Data Access
  tasksListener = nrd.tasks.onValue(async (data) => {
    if (!tasksList) return;
    // If onValue returns array, convert to object with IDs as keys
    if (Array.isArray(data)) {
      const tasksObj = {};
      data.forEach((task, index) => {
        const id = task.id || task.key || task.$id || index.toString();
        tasksObj[id] = task;
      });
      allTasks = tasksObj;
    } else {
      allTasks = data || {};
    }

    // Load processes and roles to deduce task associations
    let processes = await nrd.processes.getAll();
    let roles = await nrd.roles.getAll();
    
    // Convert arrays to objects with IDs as keys if needed
    const convertToObject = (data) => {
      if (Array.isArray(data)) {
        const obj = {};
        data.forEach((item, index) => {
          const id = item.id || item.key || item.$id || index.toString();
          obj[id] = item;
    });
        return obj;
      }
      return data || {};
    };
    
    processes = convertToObject(processes);
    roles = convertToObject(roles);
    
    // Build role name map
    const roleNameMap = {};
    Object.entries(roles).forEach(([id, role]) => {
      roleNameMap[id] = role.name;
    });
    
    // Deduce processes and roles for each task from process activities
    taskProcessMap = {}; // taskId -> array of process names
    taskRoleMap = {}; // taskId -> array of role names
    
    Object.keys(allTasks).forEach(taskId => {
      const processNames = [];
      const roleNames = new Set();
      
      // Search through all processes for activities using this task
      Object.entries(processes).forEach(([processId, process]) => {
        if (process.activities && Array.isArray(process.activities)) {
          // New structure: check activities
          const activitiesUsingTask = process.activities.filter(activity => activity.taskId === taskId);
          if (activitiesUsingTask.length > 0) {
            processNames.push(process.name);
            // Collect roleIds from activities
            activitiesUsingTask.forEach(activity => {
              if (activity.roleId && roleNameMap[activity.roleId]) {
                roleNames.add(roleNameMap[activity.roleId]);
              }
            });
          }
        } else if (process.taskIds && Array.isArray(process.taskIds)) {
          // Backward compatibility: check taskIds
          if (process.taskIds.includes(taskId)) {
            processNames.push(process.name);
          }
        }
      });
      
      taskProcessMap[taskId] = processNames.length > 0 ? processNames.join(', ') : 'Sin proceso';
      taskRoleMap[taskId] = Array.from(roleNames).length > 0 ? Array.from(roleNames).join(', ') : 'Sin rol';
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
    
    // Calculate and display cost if editing
  if (taskId) {
    nrd.tasks.getById(taskId).then(async task => {
    if (task) {
      const calculatedCost = await calculateTaskCost(task);
      const costInput = document.getElementById('task-cost');
      if (costInput) {
        costInput.value = calculatedCost !== null ? `$${calculatedCost.toFixed(2)} (calculado)` : 'No calculable';
      }
      }
    });
    } else {
      const costInput = document.getElementById('task-cost');
      if (costInput) {
        costInput.value = 'Se calculará automáticamente al guardar';
      }
    }

  const subtitle = document.getElementById('task-form-subtitle');
  const saveBtn = document.getElementById('save-task-btn');
  
  if (taskId) {
    if (title) title.textContent = 'Editar Tarea';
    if (subtitle) subtitle.textContent = 'Modifique la información de la tarea';
    // Cambiar color del header a azul para edición
    const formHeader = document.getElementById('task-form-header');
    if (formHeader) {
      formHeader.classList.remove('bg-green-600', 'bg-gray-600');
      formHeader.classList.add('bg-blue-600');
    }
    // Cambiar color del botón guardar a azul
    if (saveBtn) {
      saveBtn.classList.remove('bg-green-600', 'border-green-600', 'hover:bg-green-700');
      saveBtn.classList.add('bg-blue-600', 'border-blue-600', 'hover:bg-blue-700');
    }
    nrd.tasks.getById(taskId).then(async task => {
      if (task) {
        document.getElementById('task-name').value = task.name || '';
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-frequency').value = task.frequency || '';
        document.getElementById('task-estimated-time').value = task.estimatedTime || '';
        // Calculate and display cost
        const calculatedCost = await calculateTaskCost(task, taskId);
        document.getElementById('task-cost').value = calculatedCost !== null ? `$${calculatedCost.toFixed(2)} (calculado)` : 'No calculable';
        document.getElementById('task-execution-steps').value = task.executionSteps ? task.executionSteps.join('\n') : '';
        document.getElementById('task-success-criteria').value = task.successCriteria ? (Array.isArray(task.successCriteria) ? task.successCriteria.join('\n') : task.successCriteria) : '';
        document.getElementById('task-common-errors').value = task.commonErrors ? task.commonErrors.join('\n') : '';
      }
    });
  } else {
    if (title) title.textContent = 'Nueva Tarea';
    if (subtitle) subtitle.textContent = 'Cree una nueva tarea dentro de un proceso';
    // Cambiar color del header a verde para nuevo
    const formHeader = document.getElementById('task-form-header');
    if (formHeader) {
      formHeader.classList.remove('bg-blue-600', 'bg-gray-600');
      formHeader.classList.add('bg-green-600');
    }
    // Cambiar color del botón guardar a verde
    if (saveBtn) {
      saveBtn.classList.remove('bg-blue-600', 'border-blue-600', 'hover:bg-blue-700');
      saveBtn.classList.add('bg-green-600', 'border-green-600', 'hover:bg-green-700');
    }
    const costInput = document.getElementById('task-cost');
    if (costInput) {
      costInput.value = 'Se calculará automáticamente al guardar';
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
    return nrd.tasks.update(taskId, taskData);
  } else {
    return nrd.tasks.create(taskData);
  }
}

// View task detail
async function viewTask(taskId) {
  if (!taskId) {
    await showError('ID de tarea no válido');
    return;
  }
  
  showSpinner('Cargando tarea...');
  try {
    let [task, allProcesses, allRoles] = await Promise.all([
      nrd.tasks.getById(taskId),
      nrd.processes.getAll(),
      nrd.roles.getAll()
    ]);
    
    // Convert arrays to objects with IDs as keys if needed
    const convertToObject = (data, name) => {
      if (Array.isArray(data)) {
        const obj = {};
        data.forEach((item, index) => {
          const id = item.id || item.key || item.$id || index.toString();
          obj[id] = item;
        });
        return obj;
      }
      return data || {};
    };
    
    allProcesses = convertToObject(allProcesses, 'processes');
    allRoles = convertToObject(allRoles, 'roles');
    
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

    // Deduce processes and roles from process activities configuration
    const processesUsingTask = [];
    const roleIdsFromProcesses = new Set();
    
    Object.entries(allProcesses).forEach(([processId, process]) => {
      if (process.activities && Array.isArray(process.activities)) {
        // New structure: check activities
        const activitiesUsingTask = process.activities.filter(activity => activity.taskId === taskId);
        if (activitiesUsingTask.length > 0) {
          processesUsingTask.push({
            id: processId,
            name: process.name,
            activities: activitiesUsingTask
          });
          // Collect roleIds from activities
          activitiesUsingTask.forEach(activity => {
            if (activity.roleId) {
              roleIdsFromProcesses.add(activity.roleId);
            }
          });
        }
      } else if (process.taskIds && Array.isArray(process.taskIds)) {
        // Backward compatibility: check taskIds
        if (process.taskIds.includes(taskId)) {
          processesUsingTask.push({
            id: processId,
            name: process.name,
            activities: []
          });
        }
      }
    });
    
    // Get role names from deduced roleIds
    let roleNames = 'Sin rol';
    if (roleIdsFromProcesses.size > 0) {
      const roleNamesArray = Array.from(roleIdsFromProcesses)
        .map(roleId => allRoles[roleId]?.name)
        .filter(name => name !== undefined);
      roleNames = roleNamesArray.length > 0 ? roleNamesArray.join(', ') : 'Sin rol';
    }

    // Calculate task cost
    const calculatedCost = await calculateTaskCost(task, taskId);

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
        ${processesUsingTask.length > 0 ? `
        <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Procesos que usan esta tarea:</h4>
          <div class="space-y-2">
            ${processesUsingTask.map(process => `
              <div class="border border-gray-200 p-2 sm:p-3 hover:border-red-600 transition-colors cursor-pointer" onclick="viewProcess('${process.id}')">
                <div class="font-light text-sm sm:text-base">${escapeHtml(process.name)}</div>
                ${process.activities && process.activities.length > 0 ? `
                  <div class="text-xs text-gray-500 mt-1">
                    ${process.activities.map(activity => escapeHtml(activity.name || 'Actividad sin nombre')).join(', ')}
                  </div>
                ` : ''}
        </div>
            `).join('')}
        </div>
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
    await nrd.tasks.delete(taskId);
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
    const frequency = document.getElementById('task-frequency').value.trim() || null;
    const estimatedTime = parseInt(document.getElementById('task-estimated-time').value) || null;
    // Cost is calculated automatically, not stored
    // Type and roles are now configured in processes, not in tasks
    
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

    showSpinner('Guardando tarea...');
    try {
      const taskData = { 
        name,
        description: description || null,
        frequency,
        estimatedTime,
        // Cost is calculated automatically, not stored
        cost: null,
        executionSteps,
        successCriteria,
        commonErrors
        // Type and roles are now configured in processes, not stored in tasks
      };
      
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

// Close task detail button
const closeTaskDetailBtn = document.getElementById('close-task-detail-btn');
if (closeTaskDetailBtn) {
  closeTaskDetailBtn.addEventListener('click', () => {
    backToTasks();
  });
}

// Load tasks for select
function loadTasksForSelect() {
  return nrd.tasks.getAll().then(tasks => {
    return Object.entries(tasks || {}).map(([id, task]) => ({ id, ...task }));
  });
}

// Make functions available globally
window.viewTask = viewTask;
