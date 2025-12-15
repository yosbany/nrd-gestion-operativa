// Analytics and workload analysis

// Calculate workload by employee
async function calculateWorkloadByEmployee() {
  try {
    // Load all data
    const [tasksSnapshot, employeesSnapshot] = await Promise.all([
      getTasksRef().once('value'),
      getEmployeesRef().once('value')
    ]);

    const tasks = tasksSnapshot.val() || {};
    const employees = employeesSnapshot.val() || {};

    // Build workload map
    const workloadMap = {};

    Object.entries(employees).forEach(([employeeId, employee]) => {
      workloadMap[employeeId] = {
        employeeName: employee.name,
        roleId: employee.roleId,
        totalTasks: 0,
        totalEstimatedTime: 0,
        tasks: []
      };
    });

    // Calculate workload from tasks assigned to roles
    Object.entries(tasks).forEach(([taskId, task]) => {
      if (task.roleId && task.estimatedTime) {
        Object.entries(employees).forEach(([employeeId, employee]) => {
          if (employee.roleId === task.roleId) {
            if (!workloadMap[employeeId]) {
              workloadMap[employeeId] = {
                employeeName: employee.name,
                roleId: employee.roleId,
                totalTasks: 0,
                totalEstimatedTime: 0,
                tasks: []
              };
            }
            workloadMap[employeeId].totalTasks++;
            workloadMap[employeeId].totalEstimatedTime += task.estimatedTime || 0;
            workloadMap[employeeId].tasks.push({
              taskId,
              taskName: task.name,
              estimatedTime: task.estimatedTime
            });
          }
        });
      }
    });

    return Object.entries(workloadMap).map(([employeeId, data]) => ({
      employeeId,
      ...data
    }));
  } catch (error) {
    console.error('Error calculating workload by employee:', error);
    throw error;
  }
}

// Calculate workload by role
async function calculateWorkloadByRole() {
  try {
    const [tasksSnapshot, rolesSnapshot, employeesSnapshot] = await Promise.all([
      getTasksRef().once('value'),
      getRolesRef().once('value'),
      getEmployeesRef().once('value')
    ]);

    const tasks = tasksSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};
    const employees = employeesSnapshot.val() || {};

    const workloadMap = {};

    Object.entries(roles).forEach(([roleId, role]) => {
      workloadMap[roleId] = {
        roleName: role.name,
        totalTasks: 0,
        totalEstimatedTime: 0,
        employeesCount: 0,
        tasks: []
      };
    });

    // Count employees per role
    Object.entries(employees).forEach(([employeeId, employee]) => {
      if (employee.roleId && workloadMap[employee.roleId]) {
        workloadMap[employee.roleId].employeesCount++;
      }
    });

    // Calculate workload from tasks
    Object.entries(tasks).forEach(([taskId, task]) => {
      if (task.roleId && workloadMap[task.roleId]) {
        workloadMap[task.roleId].totalTasks++;
        workloadMap[task.roleId].totalEstimatedTime += task.estimatedTime || 0;
        workloadMap[task.roleId].tasks.push({
          taskId,
          taskName: task.name,
          estimatedTime: task.estimatedTime
        });
      }
    });

    return Object.entries(workloadMap).map(([roleId, data]) => ({
      roleId,
      ...data
    }));
  } catch (error) {
    console.error('Error calculating workload by role:', error);
    throw error;
  }
}

// Calculate workload by area
async function calculateWorkloadByArea() {
  try {
    const [areasSnapshot, processesSnapshot, tasksSnapshot] = await Promise.all([
      getAreasRef().once('value'),
      getProcessesRef().once('value'),
      getTasksRef().once('value')
    ]);

    const areas = areasSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};

    const workloadMap = {};

    Object.entries(areas).forEach(([areaId, area]) => {
      workloadMap[areaId] = {
        areaName: area.name,
        processesCount: 0,
        tasksCount: 0,
        totalEstimatedTime: 0,
        processes: []
      };
    });

    // Count processes per area
    Object.entries(processes).forEach(([processId, process]) => {
      if (process.areaId && workloadMap[process.areaId]) {
        workloadMap[process.areaId].processesCount++;
        workloadMap[process.areaId].processes.push({
          processId,
          processName: process.name
        });
      }
    });

    // Count tasks and time per area
    Object.entries(tasks).forEach(([taskId, task]) => {
      if (task.processId) {
        const process = processes[task.processId];
        if (process && process.areaId && workloadMap[process.areaId]) {
          workloadMap[process.areaId].tasksCount++;
          workloadMap[process.areaId].totalEstimatedTime += task.estimatedTime || 0;
        }
      }
    });

    return Object.entries(workloadMap).map(([areaId, data]) => ({
      areaId,
      ...data
    }));
  } catch (error) {
    console.error('Error calculating workload by area:', error);
    throw error;
  }
}

// Load analytics view
async function loadAnalytics() {
  const analyticsContent = document.getElementById('analytics-content');
  if (!analyticsContent) return;

  showSpinner('Calculando análisis...');
  try {
    const [employeeWorkload, roleWorkload, areaWorkload] = await Promise.all([
      calculateWorkloadByEmployee(),
      calculateWorkloadByRole(),
      calculateWorkloadByArea()
    ]);

    hideSpinner();

    // Sort by total estimated time (descending)
    employeeWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);
    roleWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);
    areaWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);

    analyticsContent.innerHTML = `
      <div class="space-y-6">
        <!-- Employee Workload -->
        <div class="border border-gray-200 p-4 sm:p-6">
          <h3 class="text-lg sm:text-xl font-light mb-4">Carga de Trabajo por Empleado</h3>
          ${employeeWorkload.length === 0 ? '<p class="text-gray-600 text-sm">No hay datos disponibles</p>' : `
          <div class="space-y-3">
            ${employeeWorkload.map(workload => `
              <div class="border border-gray-200 p-3">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-light text-sm sm:text-base">${escapeHtml(workload.employeeName)}</span>
                  <span class="text-xs sm:text-sm text-gray-600">${workload.totalEstimatedTime} min estimados</span>
                </div>
                <div class="text-xs text-gray-600">
                  Tareas asignadas: ${workload.totalTasks}
                </div>
              </div>
            `).join('')}
          </div>
          `}
        </div>

        <!-- Role Workload -->
        <div class="border border-gray-200 p-4 sm:p-6">
          <h3 class="text-lg sm:text-xl font-light mb-4">Carga de Trabajo por Rol</h3>
          ${roleWorkload.length === 0 ? '<p class="text-gray-600 text-sm">No hay datos disponibles</p>' : `
          <div class="space-y-3">
            ${roleWorkload.map(workload => `
              <div class="border border-gray-200 p-3">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-light text-sm sm:text-base">${escapeHtml(workload.roleName)}</span>
                  <span class="text-xs sm:text-sm text-gray-600">${workload.totalEstimatedTime} min estimados</span>
                </div>
                <div class="text-xs text-gray-600">
                  Tareas: ${workload.totalTasks} | Empleados: ${workload.employeesCount}
                </div>
              </div>
            `).join('')}
          </div>
          `}
        </div>

        <!-- Area Workload -->
        <div class="border border-gray-200 p-4 sm:p-6">
          <h3 class="text-lg sm:text-xl font-light mb-4">Carga de Trabajo por Área</h3>
          ${areaWorkload.length === 0 ? '<p class="text-gray-600 text-sm">No hay datos disponibles</p>' : `
          <div class="space-y-3">
            ${areaWorkload.map(workload => `
              <div class="border border-gray-200 p-3">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-light text-sm sm:text-base">${escapeHtml(workload.areaName)}</span>
                  <span class="text-xs sm:text-sm text-gray-600">${workload.totalEstimatedTime} min estimados</span>
                </div>
                <div class="text-xs text-gray-600">
                  Procesos: ${workload.processesCount} | Tareas: ${workload.tasksCount}
                </div>
              </div>
            `).join('')}
          </div>
          `}
        </div>
      </div>
    `;
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar análisis: ' + error.message);
  }
}
