// Role management

let rolesListener = null;
let allRoles = {}; // Store all roles for filtering

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

// Filter and display roles
function filterAndDisplayRoles(searchTerm = '') {
  const rolesList = document.getElementById('roles-list');
  if (!rolesList) return;
  
  rolesList.innerHTML = '';
  
  const term = normalizeSearchText(searchTerm.trim());
  const filteredRoles = Object.entries(allRoles).filter(([id, role]) => {
    if (!term) return true;
    const name = normalizeSearchText(role.name || '');
    const description = normalizeSearchText(role.description || '');
    return name.includes(term) || description.includes(term);
  });

  if (filteredRoles.length === 0) {
    rolesList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No se encontraron roles</p>';
    return;
  }

  filteredRoles.forEach(([id, role]) => {
    const item = document.createElement('div');
    item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
    item.dataset.roleId = id;
    item.innerHTML = `
      <div class="text-base sm:text-lg font-light mb-2 sm:mb-3">${escapeHtml(role.name)}</div>
      ${role.description ? `<div class="text-xs sm:text-sm text-gray-600">${escapeHtml(role.description)}</div>` : ''}
    `;
    item.addEventListener('click', () => viewRole(id));
    rolesList.appendChild(item);
  });
}

// Load roles
function loadRoles() {
  const rolesList = document.getElementById('roles-list');
  if (!rolesList) return;
  
  rolesList.innerHTML = '';

  // Remove previous listener
  if (rolesListener) {
    rolesListener();
    rolesListener = null;
  }

  // Listen for roles using NRD Data Access
  rolesListener = nrd.roles.onValue(async (data) => {
    if (!rolesList) return;
    // If onValue returns array, convert to object with IDs as keys
    if (Array.isArray(data)) {
      const rolesObj = {};
      data.forEach((role, index) => {
        const id = role.id || role.key || role.$id || index.toString();
        rolesObj[id] = role;
      });
      allRoles = rolesObj;
    } else {
      allRoles = data || {};
    }
    
    // Get search term and filter
    const searchInput = document.getElementById('roles-search');
    const searchTerm = searchInput ? searchInput.value : '';
    filterAndDisplayRoles(searchTerm);
  });
  
  // Add search input listener
  const searchInput = document.getElementById('roles-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterAndDisplayRoles(e.target.value);
    });
  }
}

// Show role form
function showRoleForm(roleId = null) {
  const form = document.getElementById('role-form');
  const list = document.getElementById('roles-list');
  const header = document.querySelector('#roles-view .flex.flex-col');
  const detail = document.getElementById('role-detail');
  const title = document.getElementById('role-form-title');
  const formElement = document.getElementById('role-form-element');
  const searchContainer = document.querySelector('#roles-search')?.parentElement;
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'none';
  
  if (formElement) {
    formElement.reset();
    const roleIdInput = document.getElementById('role-id');
    if (roleIdInput) roleIdInput.value = roleId || '';
  }

  const formHeader = document.getElementById('role-form-header');
  const subtitle = document.getElementById('role-form-subtitle');
  const saveBtn = document.getElementById('save-role-btn');
  
  if (roleId) {
    if (title) title.textContent = 'Editar Rol';
    if (subtitle) subtitle.textContent = 'Modifique la información del rol';
    // Cambiar color del header a azul para edición
    if (formHeader) {
      formHeader.classList.remove('bg-green-600', 'bg-gray-600');
      formHeader.classList.add('bg-blue-600');
    }
    // Cambiar color del botón guardar a azul
    if (saveBtn) {
      saveBtn.classList.remove('bg-green-600', 'border-green-600', 'hover:bg-green-700');
      saveBtn.classList.add('bg-blue-600', 'border-blue-600', 'hover:bg-blue-700');
    }
        nrd.roles.getById(roleId).then(role => {
      if (role) {
        const nameInput = document.getElementById('role-name');
        const descInput = document.getElementById('role-description');
        if (nameInput) nameInput.value = role.name || '';
        if (descInput) descInput.value = role.description || '';
      }
    });
  } else {
    if (title) title.textContent = 'Nuevo Rol';
    if (subtitle) subtitle.textContent = 'Defina un nuevo rol organizacional';
    // Cambiar color del header a verde para nuevo
    if (formHeader) {
      formHeader.classList.remove('bg-blue-600', 'bg-gray-600');
      formHeader.classList.add('bg-green-600');
    }
    // Cambiar color del botón guardar a verde
    if (saveBtn) {
      saveBtn.classList.remove('bg-blue-600', 'border-blue-600', 'hover:bg-blue-700');
      saveBtn.classList.add('bg-green-600', 'border-green-600', 'hover:bg-green-700');
    }
  }
}

// Hide role form
function hideRoleForm() {
  const form = document.getElementById('role-form');
  const list = document.getElementById('roles-list');
  const header = document.querySelector('#roles-view .flex.flex-col');
  const detail = document.getElementById('role-detail');
  const searchContainer = document.querySelector('#roles-search')?.parentElement;
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Save role
function saveRole(roleId, roleData) {
  if (roleId) {
    return nrd.roles.update(roleId, roleData);
  } else {
    return nrd.roles.create(roleData);
  }
}

// View role detail
async function viewRole(roleId) {
  if (!roleId) {
    await showError('ID de rol no válido');
    return;
  }
  
  showSpinner('Cargando rol...');
  try {
    const role = await nrd.roles.getById(roleId);
    hideSpinner();
    if (!role) {
      await showError('Rol no encontrado');
      return;
    }

    const list = document.getElementById('roles-list');
    const header = document.querySelector('#roles-view .flex.flex-col');
    const form = document.getElementById('role-form');
    const detail = document.getElementById('role-detail');
    const detailContent = document.getElementById('role-detail-content');
    
    const searchContainer = document.querySelector('#roles-search')?.parentElement;
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');
    if (searchContainer) searchContainer.style.display = 'none';

    // Load tasks, processes, and employees for this role
    let [allTasks, allProcesses, allEmployees] = await Promise.all([
      nrd.tasks.getAll(),
      nrd.processes.getAll(),
      nrd.employees.getAll()
    ]);
    
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
    
    allTasks = convertToObject(allTasks);
    allProcesses = convertToObject(allProcesses);
    allEmployees = convertToObject(allEmployees);
    
    // Create process map
    const processMap = {};
    Object.entries(allProcesses).forEach(([id, process]) => {
      processMap[id] = process.name;
    });
    
    // Deduce tasks for this role from process activities
    const roleTasks = [];
    Object.entries(allProcesses).forEach(([processId, process]) => {
      if (process.activities && Array.isArray(process.activities)) {
        process.activities.forEach(activity => {
          if (activity.roleId === roleId && activity.taskId) {
            const task = allTasks[activity.taskId];
            if (task && !roleTasks.find(t => t.id === activity.taskId)) {
              roleTasks.push({
                id: activity.taskId,
                ...task,
                processId: processId,
                processName: process.name,
                activityName: activity.name
              });
            }
          }
        });
      }
    });
    
    // Also check tasks with roleIds (backward compatibility)
    Object.entries(allTasks).forEach(([id, task]) => {
        const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
      if (taskRoleIds.includes(roleId) && !roleTasks.find(t => t.id === id)) {
        roleTasks.push({ id, ...task });
      }
    });

    // Get employees with this role
    const roleEmployees = Object.entries(allEmployees)
      .filter(([id, employee]) => {
        const employeeRoleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
        return employeeRoleIds.includes(roleId);
      })
      .map(([id, employee]) => ({ id, ...employee }));

    // Build tasks list HTML
    let tasksListHTML = '';
    if (roleTasks.length > 0) {
      tasksListHTML = `
        <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Tareas Asociadas: ${roleTasks.length}</h4>
          <div class="space-y-2">
            ${roleTasks.map(task => {
              // Get process name (from deduced data or fallback)
              const processName = task.processName || (task.processId ? processMap[task.processId] : null) || 'Sin proceso';
              const activityName = task.activityName ? ` - ${task.activityName}` : '';
              
              return `
                <div class="border border-gray-200 p-2 sm:p-3 hover:border-red-600 transition-colors cursor-pointer" onclick="viewTask('${task.id}')">
                  <div class="font-light text-sm sm:text-base">${escapeHtml(task.name || 'Tarea sin nombre')}${escapeHtml(activityName)}</div>
                  <div class="text-xs text-gray-600 mt-1">Proceso: ${escapeHtml(processName)}</div>
                  ${task.description ? `<div class="text-xs text-gray-500 mt-1 line-clamp-2">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</div>` : ''}
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
          <span class="font-light text-sm sm:text-base">${escapeHtml(role.name)}</span>
        </div>
        ${role.description ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Descripción:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(role.description)}</span>
        </div>
        ` : ''}
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Empleados:</span>
          <span class="font-light text-sm sm:text-base">${roleEmployees.length}</span>
        </div>
      </div>
      ${tasksListHTML}
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-role-detail-btn');
    const deleteBtn = document.getElementById('delete-role-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showRoleForm(roleId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteRoleHandler(roleId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar rol: ' + error.message);
  }
}

// Back to roles list
function backToRoles() {
  const list = document.getElementById('roles-list');
  const header = document.querySelector('#roles-view .flex.flex-col');
  const detail = document.getElementById('role-detail');
  const form = document.getElementById('role-form');
  const searchContainer = document.querySelector('#roles-search')?.parentElement;
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Delete role handler
async function deleteRoleHandler(roleId) {
  // Check if role has tasks or employees
  let tasks = await nrd.tasks.getAll();
  let employees = await nrd.employees.getAll();
  
  // Convert arrays to objects if needed
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
  
  tasks = convertToObject(tasks);
  employees = convertToObject(employees);
  
  // Check for tasks with this role (from process activities or task.roleIds)
  let hasTasks = false;
  
  // Check process activities
  const processes = await nrd.processes.getAll();
  const processesObj = convertToObject(processes);
  Object.values(processesObj).forEach(process => {
    if (process.activities && Array.isArray(process.activities)) {
      if (process.activities.some(activity => activity.roleId === roleId)) {
        hasTasks = true;
      }
    }
  });
  
  // Check tasks with roleIds (backward compatibility)
  if (!hasTasks) {
    hasTasks = Object.values(tasks).some(t => {
      const taskRoleIds = t.roleIds || (t.roleId ? [t.roleId] : []);
      return taskRoleIds.includes(roleId);
    });
  }
  
  // Check employees with this role
  const hasEmployees = Object.values(employees).some(e => {
    const employeeRoleIds = e.roleIds || (e.roleId ? [e.roleId] : []);
    return employeeRoleIds.includes(roleId);
  });
  
  if (hasTasks || hasEmployees) {
    await showError('No se puede eliminar un rol que tiene tareas o empleados asociados');
    return;
  }

  const confirmed = await showConfirm('Eliminar Rol', '¿Está seguro de eliminar este rol?');
  if (!confirmed) return;

  showSpinner('Eliminando rol...');
  try {
    await nrd.roles.delete(roleId);
    hideSpinner();
    backToRoles();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar rol: ' + error.message);
  }
}

// Role form submit
const roleFormElement = document.getElementById('role-form-element');
if (roleFormElement) {
  roleFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roleId = document.getElementById('role-id').value;
    const name = document.getElementById('role-name').value.trim();
    const description = document.getElementById('role-description').value.trim();

    if (!name) {
      await showError('Por favor complete el nombre del rol');
      return;
    }

    showSpinner('Guardando rol...');
    try {
      await saveRole(roleId || null, { name, description: description || null });
      hideSpinner();
      hideRoleForm();
      await showSuccess('Rol guardado exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar rol: ' + error.message);
    }
  });
}

// New role button
const newRoleBtn = document.getElementById('new-role-btn');
if (newRoleBtn) {
  newRoleBtn.addEventListener('click', () => {
    showRoleForm();
  });
}

// Cancel role form
const cancelRoleBtn = document.getElementById('cancel-role-btn');
if (cancelRoleBtn) {
  cancelRoleBtn.addEventListener('click', () => {
    hideRoleForm();
  });
}

// Close role form button
const closeRoleFormBtn = document.getElementById('close-role-form');
if (closeRoleFormBtn) {
  closeRoleFormBtn.addEventListener('click', () => {
    hideRoleForm();
  });
}

// Back to roles button
const backToRolesBtn = document.getElementById('back-to-roles');
if (backToRolesBtn) {
  backToRolesBtn.addEventListener('click', () => {
    backToRoles();
  });
}

// Close role detail button
const closeRoleDetailBtn = document.getElementById('close-role-detail-btn');
if (closeRoleDetailBtn) {
  closeRoleDetailBtn.addEventListener('click', () => {
    backToRoles();
  });
}

// Load roles for task/employee forms
function loadRolesForSelect() {
  return nrd.roles.getAll().then(roles => {
    // Convert array to object if needed
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
    
    const rolesObj = convertToObject(roles);
    return Object.entries(rolesObj).map(([id, role]) => ({ id, ...role }));
  });
}

// Make functions available globally
window.viewRole = viewRole;
