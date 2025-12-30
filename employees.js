// Employee management

let employeesListener = null;
let allEmployees = {}; // Store all employees for filtering

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

// Filter and display employees
async function filterAndDisplayEmployees(searchTerm = '') {
  const employeesList = document.getElementById('employees-list');
  if (!employeesList) return;
  
  employeesList.innerHTML = '';
  
  const term = normalizeSearchText(searchTerm.trim());
  
  // Load roles for filtering by role names
  const roles = await nrd.roles.getAll();
  const roleMap = {};
  Object.entries(roles).forEach(([id, role]) => {
    roleMap[id] = role.name;
  });
  
  const filteredEmployees = Object.entries(allEmployees).filter(([id, employee]) => {
    if (!term) return true;
    const name = normalizeSearchText(employee.name || '');
    const email = normalizeSearchText(employee.email || '');
    const phone = normalizeSearchText(employee.phone || '');
    
    // Check role names
    const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
    const roleNames = normalizeSearchText(roleIds.map(rid => roleMap[rid] || '').join(' '));
    
    return name.includes(term) || email.includes(term) || phone.includes(term) || roleNames.includes(term);
  });

  if (filteredEmployees.length === 0) {
    employeesList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No se encontraron empleados</p>';
    return;
  }

  filteredEmployees.forEach(([id, employee]) => {
    const item = document.createElement('div');
    item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
    item.dataset.employeeId = id;
    
    // Get role names (support both old roleId and new roleIds)
    const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
    let roleNamesText = 'Sin roles';
    
    if (roleIds.length > 0) {
      const roleNames = roleIds.map(rid => roleMap[rid]).filter(n => n !== undefined);
      roleNamesText = roleNames.length > 0 ? roleNames.join(', ') : 'Sin roles';
    }
    
    item.innerHTML = `
      <div class="flex justify-between items-center mb-2 sm:mb-3">
        <div class="text-base sm:text-lg font-light">${escapeHtml(employee.name)}</div>
        ${employee.salary ? `<span class="text-xs sm:text-sm text-gray-600">$${parseFloat(employee.salary).toFixed(2)}</span>` : ''}
      </div>
      <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
        <div>Roles: <span class="role-names">${escapeHtml(roleNamesText)}</span></div>
        ${employee.email ? `<div>Email: ${escapeHtml(employee.email)}</div>` : ''}
        ${employee.phone ? `<div>Teléfono: ${escapeHtml(employee.phone)}</div>` : ''}
      </div>
    `;
    item.addEventListener('click', () => viewEmployee(id));
    employeesList.appendChild(item);
  });
}

// Load employees
function loadEmployees() {
  const employeesList = document.getElementById('employees-list');
  if (!employeesList) return;
  
  employeesList.innerHTML = '';

  // Remove previous listener
  if (employeesListener) {
    employeesListener();
    employeesListener = null;
  }

  // Listen for employees using NRD Data Access
  employeesListener = nrd.employees.onValue(async (data) => {
    if (!employeesList) return;
    allEmployees = data || {};
    
    // Get search term and filter
    const searchInput = document.getElementById('employees-search');
    const searchTerm = searchInput ? searchInput.value : '';
    await filterAndDisplayEmployees(searchTerm);
  });
  
  // Add search input listener
  const searchInput = document.getElementById('employees-search');
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      await filterAndDisplayEmployees(e.target.value);
    });
  }
}

// Show employee form
function showEmployeeForm(employeeId = null) {
  const form = document.getElementById('employee-form');
  const list = document.getElementById('employees-list');
  const header = document.querySelector('#employees-view .flex.flex-col');
  const detail = document.getElementById('employee-detail');
  const title = document.getElementById('employee-form-title');
  const formElement = document.getElementById('employee-form-element');
  const searchContainer = document.querySelector('#employees-search')?.parentElement;
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'none';
  
  if (formElement) {
    formElement.reset();
    const employeeIdInput = document.getElementById('employee-id');
    if (employeeIdInput) employeeIdInput.value = employeeId || '';
  }

  // Load roles for checkboxes and employee data in parallel
  Promise.all([
    loadRolesForSelect(),
    employeeId ? nrd.employees.getById(employeeId) : Promise.resolve(null)
  ]).then(([roles, employee]) => {
    const rolesContainer = document.getElementById('employee-roles-container');
    if (rolesContainer) {
      rolesContainer.innerHTML = '';
      if (roles.length === 0) {
        rolesContainer.innerHTML = '<p class="text-sm text-gray-500">No hay roles disponibles</p>';
        return;
      }
      
      // Get employee roleIds if editing
      const roleIds = employee 
        ? (employee.roleIds || (employee.roleId ? [employee.roleId] : []))
        : [];
      
      roles.forEach(role => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = role.id;
        checkbox.className = 'w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500';
        checkbox.dataset.roleId = role.id;
        // Mark as checked if this role is in the employee's roleIds
        checkbox.checked = roleIds.includes(role.id);
        const span = document.createElement('span');
        span.className = 'text-sm font-light';
        span.textContent = role.name;
        label.appendChild(checkbox);
        label.appendChild(span);
        rolesContainer.appendChild(label);
      });
    }
    
    // Load other employee fields if editing
    if (employeeId && employee) {
      if (title) title.textContent = 'Editar Empleado';
      if (employee) {
        const nameInput = document.getElementById('employee-name');
        const emailInput = document.getElementById('employee-email');
        const phoneInput = document.getElementById('employee-phone');
        const salaryInput = document.getElementById('employee-salary');
        if (nameInput) nameInput.value = employee.name || '';
        if (emailInput) emailInput.value = employee.email || '';
        if (phoneInput) phoneInput.value = employee.phone || '';
        if (salaryInput) salaryInput.value = employee.salary || '';
      }
    } else {
      if (title) title.textContent = 'Nuevo Empleado';
    }
  });
}

// Hide employee form
function hideEmployeeForm() {
  const form = document.getElementById('employee-form');
  const list = document.getElementById('employees-list');
  const header = document.querySelector('#employees-view .flex.flex-col');
  const detail = document.getElementById('employee-detail');
  const searchContainer = document.querySelector('#employees-search')?.parentElement;
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Save employee
function saveEmployee(employeeId, employeeData) {
  if (employeeId) {
    return nrd.employees.update(employeeId, employeeData);
  } else {
    return nrd.employees.create(employeeData);
  }
}

// View employee detail
async function viewEmployee(employeeId) {
  showSpinner('Cargando empleado...');
  try {
    const employee = await nrd.employees.getById(employeeId);
    hideSpinner();
    if (!employee) {
      await showError('Empleado no encontrado');
      return;
    }

    const list = document.getElementById('employees-list');
    const header = document.querySelector('#employees-view .flex.flex-col');
    const form = document.getElementById('employee-form');
    const detail = document.getElementById('employee-detail');
    const detailContent = document.getElementById('employee-detail-content');
    
    const searchContainer = document.querySelector('#employees-search')?.parentElement;
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');
    if (searchContainer) searchContainer.style.display = 'none';

    // Get role names (support both old roleId and new roleIds)
    const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
    let roleNames = 'Sin roles';
    
    if (roleIds.length > 0) {
      const rolePromises = roleIds.map(roleId => nrd.roles.getById(roleId).then(role => {
        // role already loaded from nrd.roles.getById above
        return role ? role.name : null;
      }));
      const roleNamesArray = await Promise.all(rolePromises);
      const validNames = roleNamesArray.filter(n => n !== null);
      roleNames = validNames.length > 0 ? validNames.join(', ') : 'Sin roles';
    }

    detailContent.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(employee.name)}</span>
        </div>
        ${employee.email ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Email:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(employee.email)}</span>
        </div>
        ` : ''}
        ${employee.phone ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Teléfono:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(employee.phone)}</span>
        </div>
        ` : ''}
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Roles:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(roleNames)}</span>
        </div>
        ${employee.salary ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Costo Salarial:</span>
          <span class="font-light text-sm sm:text-base">$${parseFloat(employee.salary).toFixed(2)}</span>
        </div>
        ` : ''}
      </div>
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-employee-detail-btn');
    const deleteBtn = document.getElementById('delete-employee-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showEmployeeForm(employeeId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteEmployeeHandler(employeeId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar empleado: ' + error.message);
  }
}

// Back to employees list
function backToEmployees() {
  const list = document.getElementById('employees-list');
  const header = document.querySelector('#employees-view .flex.flex-col');
  const detail = document.getElementById('employee-detail');
  const form = document.getElementById('employee-form');
  const searchContainer = document.querySelector('#employees-search')?.parentElement;
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Delete employee handler
async function deleteEmployeeHandler(employeeId) {
  const confirmed = await showConfirm('Eliminar Empleado', '¿Está seguro de eliminar este empleado?');
  if (!confirmed) return;

  showSpinner('Eliminando empleado...');
  try {
    await nrd.employees.delete(employeeId);
    hideSpinner();
    backToEmployees();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar empleado: ' + error.message);
  }
}

// Employee form submit
const employeeFormElement = document.getElementById('employee-form-element');
if (employeeFormElement) {
  employeeFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const employeeId = document.getElementById('employee-id').value;
    const name = document.getElementById('employee-name').value.trim();
    const email = document.getElementById('employee-email').value.trim();
    const phone = document.getElementById('employee-phone').value.trim();
    const salary = parseFloat(document.getElementById('employee-salary').value) || null;
    
    // Get selected roles
    const roleCheckboxes = document.querySelectorAll('#employee-roles-container input[type="checkbox"]:checked');
    const roleIds = Array.from(roleCheckboxes).map(cb => cb.value);

    if (!name) {
      await showError('Por favor complete el nombre del empleado');
      return;
    }

    showSpinner('Guardando empleado...');
    try {
      const employeeData = { 
        name, 
        email: email || null, 
        phone: phone || null,
        salary: salary || null
      };
      
      // Store roleIds as array (or null if empty)
      if (roleIds.length > 0) {
        employeeData.roleIds = roleIds;
        // Remove old roleId if exists (for migration)
        employeeData.roleId = null;
      } else {
        employeeData.roleIds = null;
        employeeData.roleId = null;
      }
      
      await saveEmployee(employeeId || null, employeeData);
      hideSpinner();
      hideEmployeeForm();
      await showSuccess('Empleado guardado exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar empleado: ' + error.message);
    }
  });
}

// New employee button
const newEmployeeBtn = document.getElementById('new-employee-btn');
if (newEmployeeBtn) {
  newEmployeeBtn.addEventListener('click', () => {
    showEmployeeForm();
  });
}

// Cancel employee form
const cancelEmployeeBtn = document.getElementById('cancel-employee-btn');
if (cancelEmployeeBtn) {
  cancelEmployeeBtn.addEventListener('click', () => {
    hideEmployeeForm();
  });
}

// Close employee form button
const closeEmployeeFormBtn = document.getElementById('close-employee-form');
if (closeEmployeeFormBtn) {
  closeEmployeeFormBtn.addEventListener('click', () => {
    hideEmployeeForm();
  });
}

// Back to employees button
const backToEmployeesBtn = document.getElementById('back-to-employees');
if (backToEmployeesBtn) {
  backToEmployeesBtn.addEventListener('click', () => {
    backToEmployees();
  });
}

// Load employees for select
function loadEmployeesForSelect() {
  return nrd.employees.getAll().then(employees => {
    // employees already loaded from nrd.employees.getAll above
    return Object.entries(employees).map(([id, employee]) => ({ id, ...employee }));
  });
}

// Make functions available globally
window.viewEmployee = viewEmployee;
