// Employee management

let employeesListener = null;

// Load employees
function loadEmployees() {
  const employeesList = document.getElementById('employees-list');
  if (!employeesList) return;
  
  employeesList.innerHTML = '';

  // Remove previous listener
  if (employeesListener) {
    getEmployeesRef().off('value', employeesListener);
    employeesListener = null;
  }

  // Listen for employees
  employeesListener = getEmployeesRef().on('value', (snapshot) => {
    if (!employeesList) return;
    employeesList.innerHTML = '';
    const employees = snapshot.val() || {};

    if (Object.keys(employees).length === 0) {
      employeesList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No hay empleados registrados</p>';
      return;
    }

    Object.entries(employees).forEach(([id, employee]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.employeeId = id;
      
      // Get role name
      let roleName = 'Sin rol';
      if (employee.roleId) {
        getRole(employee.roleId).then(snapshot => {
          const role = snapshot.val();
          if (role) {
            const roleSpan = item.querySelector('.role-name');
            if (roleSpan) roleSpan.textContent = role.name;
          }
        });
      }
      
      item.innerHTML = `
        <div class="flex justify-between items-center mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(employee.name)}</div>
          ${employee.salary ? `<span class="text-xs sm:text-sm text-gray-600">$${parseFloat(employee.salary).toFixed(2)}</span>` : ''}
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Rol: <span class="role-name">${roleName}</span></div>
          ${employee.email ? `<div>Email: ${escapeHtml(employee.email)}</div>` : ''}
          ${employee.phone ? `<div>Teléfono: ${escapeHtml(employee.phone)}</div>` : ''}
        </div>
      `;
      item.addEventListener('click', () => viewEmployee(id));
      employeesList.appendChild(item);
    });
  });
}

// Show employee form
function showEmployeeForm(employeeId = null) {
  const form = document.getElementById('employee-form');
  const list = document.getElementById('employees-list');
  const header = document.querySelector('#employees-view .flex.flex-col');
  const detail = document.getElementById('employee-detail');
  const title = document.getElementById('employee-form-title');
  const formElement = document.getElementById('employee-form-element');
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  
  if (formElement) {
    formElement.reset();
    const employeeIdInput = document.getElementById('employee-id');
    if (employeeIdInput) employeeIdInput.value = employeeId || '';
  }

  // Load roles for select
  loadRolesForSelect().then(roles => {
    const roleSelect = document.getElementById('employee-role-select');
    if (roleSelect) {
      roleSelect.innerHTML = '<option value="">Sin rol</option>';
      roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        roleSelect.appendChild(option);
      });
    }
  });

  if (employeeId) {
    if (title) title.textContent = 'Editar Empleado';
    getEmployee(employeeId).then(snapshot => {
      const employee = snapshot.val();
      if (employee) {
        const nameInput = document.getElementById('employee-name');
        const emailInput = document.getElementById('employee-email');
        const phoneInput = document.getElementById('employee-phone');
        const roleSelect = document.getElementById('employee-role-select');
        const salaryInput = document.getElementById('employee-salary');
        if (nameInput) nameInput.value = employee.name || '';
        if (emailInput) emailInput.value = employee.email || '';
        if (phoneInput) phoneInput.value = employee.phone || '';
        if (roleSelect) roleSelect.value = employee.roleId || '';
        if (salaryInput) salaryInput.value = employee.salary || '';
      }
    });
  } else {
    if (title) title.textContent = 'Nuevo Empleado';
  }
}

// Hide employee form
function hideEmployeeForm() {
  const form = document.getElementById('employee-form');
  const list = document.getElementById('employees-list');
  const header = document.querySelector('#employees-view .flex.flex-col');
  const detail = document.getElementById('employee-detail');
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
}

// Save employee
function saveEmployee(employeeId, employeeData) {
  if (employeeId) {
    return updateEmployee(employeeId, employeeData);
  } else {
    return createEmployee(employeeData);
  }
}

// View employee detail
async function viewEmployee(employeeId) {
  showSpinner('Cargando empleado...');
  try {
    const snapshot = await getEmployee(employeeId);
    const employee = snapshot.val();
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
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');

    // Get role name
    let roleName = 'Sin rol';
    if (employee.roleId) {
      const roleSnapshot = await getRole(employee.roleId);
      const role = roleSnapshot.val();
      if (role) roleName = role.name;
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
          <span class="text-gray-600 font-light text-sm sm:text-base">Rol:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(roleName)}</span>
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
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
}

// Delete employee handler
async function deleteEmployeeHandler(employeeId) {
  const confirmed = await showConfirm('Eliminar Empleado', '¿Está seguro de eliminar este empleado?');
  if (!confirmed) return;

  showSpinner('Eliminando empleado...');
  try {
    await deleteEmployee(employeeId);
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
    const roleId = document.getElementById('employee-role-select').value || null;
    const salary = parseFloat(document.getElementById('employee-salary').value) || null;

    if (!name) {
      await showError('Por favor complete el nombre del empleado');
      return;
    }

    showSpinner('Guardando empleado...');
    try {
      await saveEmployee(employeeId || null, { 
        name, 
        email: email || null, 
        phone: phone || null,
        roleId: roleId || null,
        salary: salary || null
      });
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
  return getEmployeesRef().once('value').then(snapshot => {
    const employees = snapshot.val() || {};
    return Object.entries(employees).map(([id, employee]) => ({ id, ...employee }));
  });
}

// Make functions available globally
window.viewEmployee = viewEmployee;
