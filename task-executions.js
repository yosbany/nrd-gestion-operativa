// Task execution management

let taskExecutionsListener = null;

// Load task executions
function loadTaskExecutions() {
  const executionsList = document.getElementById('task-executions-list');
  if (!executionsList) return;
  
  executionsList.innerHTML = '';

  // Remove previous listener
  if (taskExecutionsListener) {
    getTaskExecutionsRef().off('value', taskExecutionsListener);
    taskExecutionsListener = null;
  }

  // Listen for task executions
  taskExecutionsListener = getTaskExecutionsRef().on('value', async (snapshot) => {
    if (!executionsList) return;
    executionsList.innerHTML = '';
    const executions = snapshot.val() || {};

    if (Object.keys(executions).length === 0) {
      executionsList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No hay ejecuciones registradas</p>';
      return;
    }

    // Load tasks and employees for display
    const tasksSnapshot = await getTasksRef().once('value');
    const tasks = tasksSnapshot.val() || {};
    const taskMap = {};
    Object.entries(tasks).forEach(([id, task]) => {
      taskMap[id] = task.name;
    });

    const employeesSnapshot = await getEmployeesRef().once('value');
    const employees = employeesSnapshot.val() || {};
    const employeeMap = {};
    Object.entries(employees).forEach(([id, employee]) => {
      employeeMap[id] = employee.name;
    });

    // Sort by date (newest first)
    const sortedExecutions = Object.entries(executions).sort((a, b) => {
      const dateA = a[1].executionDate || 0;
      const dateB = b[1].executionDate || 0;
      return dateB - dateA;
    });

    sortedExecutions.forEach(([id, execution]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.executionId = id;
      const taskName = execution.taskId ? (taskMap[execution.taskId] || 'Tarea desconocida') : 'Sin tarea';
      const employeeName = execution.employeeId ? (employeeMap[execution.employeeId] || 'Empleado desconocido') : 'Sin empleado';
      
      const resultColors = {
        'OK': 'bg-green-600',
        'OBSERVADO': 'bg-yellow-600',
        'ERROR': 'bg-red-600'
      };
      
      const resultLabels = {
        'OK': 'OK',
        'OBSERVADO': 'OBSERVADO',
        'ERROR': 'ERROR'
      };
      
      const paymentLabels = {
        'paid': 'Remunerada',
        'unpaid': 'No remunerada',
        'exchange': 'Canje'
      };
      
      const executionDate = execution.executionDate ? new Date(execution.executionDate) : null;
      const dateStr = executionDate ? formatDate24h(executionDate) + ' ' + formatTime24h(executionDate) : 'Sin fecha';
      
      item.innerHTML = `
        <div class="flex justify-between items-center mb-2 sm:mb-3">
          <div class="text-base sm:text-lg font-light">${escapeHtml(taskName)}</div>
          <span class="px-2 py-0.5 text-xs text-white rounded ${resultColors[execution.result] || 'bg-gray-600'}">
            ${resultLabels[execution.result] || execution.result || 'Sin resultado'}
          </span>
        </div>
        <div class="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
          <div>Empleado: ${escapeHtml(employeeName)}</div>
          <div>Fecha: ${dateStr}</div>
          ${execution.paymentType ? `<div>Modalidad: ${paymentLabels[execution.paymentType] || execution.paymentType}</div>` : ''}
          ${execution.observations ? `<div>Observaciones: ${escapeHtml(execution.observations)}</div>` : ''}
        </div>
      `;
      item.addEventListener('click', () => viewTaskExecution(id));
      executionsList.appendChild(item);
    });
  });
}

// Show task execution form
function showTaskExecutionForm(executionId = null) {
  const form = document.getElementById('task-execution-form');
  const list = document.getElementById('task-executions-list');
  const header = document.querySelector('#task-executions-view .flex.flex-col');
  const detail = document.getElementById('task-execution-detail');
  const title = document.getElementById('task-execution-form-title');
  const formElement = document.getElementById('task-execution-form-element');
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  
  if (formElement) {
    formElement.reset();
    const executionIdInput = document.getElementById('task-execution-id');
    if (executionIdInput) executionIdInput.value = executionId || '';
  }

  // Load tasks and employees for selects
  Promise.all([
    loadTasksForSelect(),
    loadEmployeesForSelect()
  ]).then(([tasks, employees]) => {
    // Task select
    const taskSelect = document.getElementById('task-execution-task-select');
    if (taskSelect) {
      taskSelect.innerHTML = '<option value="">Seleccionar tarea</option>';
      tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.name;
        taskSelect.appendChild(option);
      });
    }
    
    // Employee select
    const employeeSelect = document.getElementById('task-execution-employee-select');
    if (employeeSelect) {
      employeeSelect.innerHTML = '<option value="">Seleccionar empleado</option>';
      employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
      });
    }
  });

  // Set default date/time to now
  const dateInput = document.getElementById('task-execution-date');
  const timeInput = document.getElementById('task-execution-time');
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

  if (executionId) {
    if (title) title.textContent = 'Editar Ejecución';
    getTaskExecution(executionId).then(snapshot => {
      const execution = snapshot.val();
      if (execution) {
        document.getElementById('task-execution-task-select').value = execution.taskId || '';
        document.getElementById('task-execution-employee-select').value = execution.employeeId || '';
        document.getElementById('task-execution-result').value = execution.result || 'OK';
        document.getElementById('task-execution-observations').value = execution.observations || '';
        document.getElementById('task-execution-payment-type').value = execution.paymentType || 'paid';
        
        if (execution.executionDate) {
          const execDate = new Date(execution.executionDate);
          const year = execDate.getFullYear();
          const month = String(execDate.getMonth() + 1).padStart(2, '0');
          const day = String(execDate.getDate()).padStart(2, '0');
          const hours = String(execDate.getHours()).padStart(2, '0');
          const minutes = String(execDate.getMinutes()).padStart(2, '0');
          document.getElementById('task-execution-date').value = `${year}-${month}-${day}`;
          document.getElementById('task-execution-time').value = `${hours}:${minutes}`;
        }
      }
    });
  } else {
    if (title) title.textContent = 'Nueva Ejecución';
    document.getElementById('task-execution-result').value = 'OK';
    document.getElementById('task-execution-payment-type').value = 'paid';
  }
}

// Hide task execution form
function hideTaskExecutionForm() {
  const form = document.getElementById('task-execution-form');
  const list = document.getElementById('task-executions-list');
  const header = document.querySelector('#task-executions-view .flex.flex-col');
  const detail = document.getElementById('task-execution-detail');
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
}

// Save task execution
function saveTaskExecution(executionId, executionData) {
  if (executionId) {
    return updateTaskExecution(executionId, executionData);
  } else {
    return createTaskExecution(executionData);
  }
}

// View task execution detail
async function viewTaskExecution(executionId) {
  showSpinner('Cargando ejecución...');
  try {
    const snapshot = await getTaskExecution(executionId);
    const execution = snapshot.val();
    hideSpinner();
    if (!execution) {
      await showError('Ejecución no encontrada');
      return;
    }

    const list = document.getElementById('task-executions-list');
    const header = document.querySelector('#task-executions-view .flex.flex-col');
    const form = document.getElementById('task-execution-form');
    const detail = document.getElementById('task-execution-detail');
    const detailContent = document.getElementById('task-execution-detail-content');
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');

    // Get task and employee names
    let taskName = 'Sin tarea';
    if (execution.taskId) {
      const taskSnapshot = await getTask(execution.taskId);
      const task = taskSnapshot.val();
      if (task) taskName = task.name;
    }

    let employeeName = 'Sin empleado';
    if (execution.employeeId) {
      const employeeSnapshot = await getEmployee(execution.employeeId);
      const employee = employeeSnapshot.val();
      if (employee) employeeName = employee.name;
    }

    const resultColors = {
      'OK': 'text-green-600',
      'OBSERVADO': 'text-yellow-600',
      'ERROR': 'text-red-600'
    };
    
    const resultLabels = {
      'OK': 'OK',
      'OBSERVADO': 'OBSERVADO',
      'ERROR': 'ERROR'
    };
    
    const paymentLabels = {
      'paid': 'Remunerada',
      'unpaid': 'No remunerada',
      'exchange': 'Canje'
    };
    
    const executionDate = execution.executionDate ? new Date(execution.executionDate) : null;
    const dateStr = executionDate ? formatDate24h(executionDate) + ' ' + formatTime24h(executionDate) : 'Sin fecha';

    detailContent.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Tarea:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(taskName)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Empleado:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(employeeName)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Fecha y Hora:</span>
          <span class="font-light text-sm sm:text-base">${dateStr}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Resultado:</span>
          <span class="font-light text-sm sm:text-base ${resultColors[execution.result] || ''} font-medium">
            ${resultLabels[execution.result] || execution.result || 'Sin resultado'}
          </span>
        </div>
        ${execution.paymentType ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Modalidad:</span>
          <span class="font-light text-sm sm:text-base">${paymentLabels[execution.paymentType] || execution.paymentType}</span>
        </div>
        ` : ''}
        ${execution.observations ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Observaciones:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(execution.observations)}</span>
        </div>
        ` : ''}
      </div>
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-task-execution-detail-btn');
    const deleteBtn = document.getElementById('delete-task-execution-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showTaskExecutionForm(executionId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteTaskExecutionHandler(executionId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar ejecución: ' + error.message);
  }
}

// Back to task executions list
function backToTaskExecutions() {
  const list = document.getElementById('task-executions-list');
  const header = document.querySelector('#task-executions-view .flex.flex-col');
  const detail = document.getElementById('task-execution-detail');
  const form = document.getElementById('task-execution-form');
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
}

// Delete task execution handler
async function deleteTaskExecutionHandler(executionId) {
  const confirmed = await showConfirm('Eliminar Ejecución', '¿Está seguro de eliminar esta ejecución?');
  if (!confirmed) return;

  showSpinner('Eliminando ejecución...');
  try {
    await deleteTaskExecution(executionId);
    hideSpinner();
    backToTaskExecutions();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar ejecución: ' + error.message);
  }
}

// Task execution form submit
const taskExecutionFormElement = document.getElementById('task-execution-form-element');
if (taskExecutionFormElement) {
  taskExecutionFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const executionId = document.getElementById('task-execution-id').value;
    const taskId = document.getElementById('task-execution-task-select').value;
    const employeeId = document.getElementById('task-execution-employee-select').value;
    const result = document.getElementById('task-execution-result').value;
    const observations = document.getElementById('task-execution-observations').value.trim() || null;
    const paymentType = document.getElementById('task-execution-payment-type').value;
    
    const dateInput = document.getElementById('task-execution-date').value;
    const timeInput = document.getElementById('task-execution-time').value;
    
    if (!taskId) {
      await showError('Por favor seleccione una tarea');
      return;
    }

    if (!employeeId) {
      await showError('Por favor seleccione un empleado');
      return;
    }

    // Combine date and time
    let executionDate = Date.now();
    if (dateInput && timeInput) {
      const dateTimeString = `${dateInput}T${timeInput}`;
      executionDate = new Date(dateTimeString).getTime();
    }

    showSpinner('Guardando ejecución...');
    try {
      await saveTaskExecution(executionId || null, { 
        taskId,
        employeeId,
        result,
        observations,
        paymentType,
        executionDate
      });
      hideSpinner();
      hideTaskExecutionForm();
      await showSuccess('Ejecución guardada exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar ejecución: ' + error.message);
    }
  });
}

// New task execution button
const newTaskExecutionBtn = document.getElementById('new-task-execution-btn');
if (newTaskExecutionBtn) {
  newTaskExecutionBtn.addEventListener('click', () => {
    showTaskExecutionForm();
  });
}

// Cancel task execution form
const cancelTaskExecutionBtn = document.getElementById('cancel-task-execution-btn');
if (cancelTaskExecutionBtn) {
  cancelTaskExecutionBtn.addEventListener('click', () => {
    hideTaskExecutionForm();
  });
}

// Close task execution form button
const closeTaskExecutionFormBtn = document.getElementById('close-task-execution-form');
if (closeTaskExecutionFormBtn) {
  closeTaskExecutionFormBtn.addEventListener('click', () => {
    hideTaskExecutionForm();
  });
}

// Back to task executions button
const backToTaskExecutionsBtn = document.getElementById('back-to-task-executions');
if (backToTaskExecutionsBtn) {
  backToTaskExecutionsBtn.addEventListener('click', () => {
    backToTaskExecutions();
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
window.viewTaskExecution = viewTaskExecution;
