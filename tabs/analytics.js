// Analytics and workload analysis

// Calculate workload by employee
async function calculateWorkloadByEmployee() {
  try {
    // Load all data
    const [tasks, employees] = await Promise.all([
      nrd.tasks.getAll(),
      nrd.employees.getAll()
    ]);

    // Build workload map
    const workloadMap = {};

    Object.entries(employees).forEach(([employeeId, employee]) => {
      const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
      workloadMap[employeeId] = {
        employeeName: employee.name,
        roleIds: roleIds,
        totalTasks: 0,
        totalEstimatedTime: 0,
        tasks: []
      };
    });

    // Calculate workload from tasks assigned to roles
    Object.entries(tasks).forEach(([taskId, task]) => {
      const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
      if (taskRoleIds.length > 0 && task.estimatedTime) {
        Object.entries(employees).forEach(([employeeId, employee]) => {
          const employeeRoleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
          // Check if employee has any role that matches task roles
          const hasMatchingRole = employeeRoleIds.some(empRoleId => taskRoleIds.includes(empRoleId));
          if (hasMatchingRole) {
            if (!workloadMap[employeeId]) {
              workloadMap[employeeId] = {
                employeeName: employee.name,
                roleIds: employeeRoleIds,
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
    const [tasks, roles, employees] = await Promise.all([
      nrd.tasks.getAll(),
      nrd.roles.getAll(),
      nrd.employees.getAll()
    ]);

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
      const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
      roleIds.forEach(roleId => {
        if (workloadMap[roleId]) {
          workloadMap[roleId].employeesCount++;
        }
      });
    });

    // Calculate workload from tasks
    Object.entries(tasks).forEach(([taskId, task]) => {
      const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
      if (taskRoleIds.length > 0) {
        taskRoleIds.forEach(roleId => {
          if (workloadMap[roleId]) {
            workloadMap[roleId].totalTasks++;
            workloadMap[roleId].totalEstimatedTime += task.estimatedTime || 0;
            workloadMap[roleId].tasks.push({
              taskId,
              taskName: task.name,
              estimatedTime: task.estimatedTime
            });
          }
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
    const [areas, processes, tasks] = await Promise.all([
      nrd.areas.getAll(),
      nrd.processes.getAll(),
      nrd.tasks.getAll()
    ]);

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

// Calculate incidents by employee
async function calculateIncidentsByEmployee() {
  try {
    // Inspecciones eliminadas - retornar array vacío
    return [];
  } catch (error) {
    console.error('Error calculating incidents by employee:', error);
    throw error;
  }
}

// Calculate incidents by task
async function calculateIncidentsByTask() {
  try {
    // Inspecciones eliminadas - retornar array vacío
    return [];
  } catch (error) {
    console.error('Error calculating incidents by task:', error);
    throw error;
  }
}

// Calculate incidents by process
async function calculateIncidentsByProcess() {
  try {
    // Inspecciones eliminadas - retornar array vacío
    return [];
  } catch (error) {
    console.error('Error calculating incidents by process:', error);
    throw error;
  }
}

// Calculate incidents by area
async function calculateIncidentsByArea() {
  try {
    // Inspecciones eliminadas - retornar array vacío
    return [];
  } catch (error) {
    console.error('Error calculating incidents by area:', error);
    throw error;
  }
}

// Calculate incidents by role
async function calculateIncidentsByRole() {
  try {
    // Inspecciones eliminadas - retornar array vacío
    return [];
  } catch (error) {
    console.error('Error calculating incidents by role:', error);
    throw error;
  }
}

// Calculate cost by employee
async function calculateCostByEmployee() {
  try {
    const employees = await nrd.employees.getAll();

    return Object.entries(employees)
      .filter(([id, employee]) => employee.salary)
      .map(([employeeId, employee]) => {
        const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
        return {
          employeeId,
          employeeName: employee.name,
          cost: parseFloat(employee.salary) || 0,
          roleIds: roleIds.length > 0 ? roleIds : null
        };
      })
      .sort((a, b) => b.cost - a.cost);
  } catch (error) {
    console.error('Error calculating cost by employee:', error);
    throw error;
  }
}

// Calculate cost by role
async function calculateCostByRole() {
  try {
    const [employees, roles] = await Promise.all([
      nrd.employees.getAll(),
      nrd.roles.getAll()
    ]);

    const costMap = {};

    // Initialize cost map for all roles
    Object.entries(roles).forEach(([roleId, role]) => {
      costMap[roleId] = {
        roleId,
        roleName: role.name,
        totalCost: 0,
        employeesCount: 0
      };
    });

    // Sum costs by role
    Object.entries(employees).forEach(([employeeId, employee]) => {
      const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
      if (employee.salary && roleIds.length > 0) {
        roleIds.forEach(roleId => {
          if (costMap[roleId]) {
            costMap[roleId].totalCost += parseFloat(employee.salary) || 0;
            costMap[roleId].employeesCount++;
          }
        });
      }
    });

    return Object.entries(costMap)
      .filter(([id, data]) => data.totalCost > 0)
      .map(([roleId, data]) => ({
        roleId,
        ...data
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  } catch (error) {
    console.error('Error calculating cost by role:', error);
    throw error;
  }
}

// Calculate cost by area
async function calculateCostByArea() {
  try {
    const [areas, processes, tasks, employees, roles] = await Promise.all([
      nrd.areas.getAll(),
      nrd.processes.getAll(),
      nrd.tasks.getAll(),
      nrd.employees.getAll(),
      nrd.roles.getAll()
    ]);

    // Data already loaded from Promise.all above

    const costMap = {};

    // Initialize cost map for all areas
    Object.entries(areas).forEach(([areaId, area]) => {
      costMap[areaId] = {
        areaId,
        areaName: area.name,
        totalCost: 0,
        taskCosts: 0,
        employeeCosts: 0
      };
    });

    // Build process to area map
    const processAreaMap = {};
    Object.entries(processes).forEach(([processId, process]) => {
      if (process.areaId) {
        processAreaMap[processId] = process.areaId;
      }
    });

    // Calculate costs from tasks with direct cost (tasks without role)
    Object.entries(tasks).forEach(([taskId, task]) => {
      if (task.cost && task.processId && processAreaMap[task.processId]) {
        const areaId = processAreaMap[task.processId];
        if (costMap[areaId]) {
          costMap[areaId].taskCosts += parseFloat(task.cost) || 0;
        }
      }
    });

    // Calculate costs from employees whose roles are associated with tasks in this area
    // Build role to area map through tasks
    const roleAreaMap = {};
    Object.entries(tasks).forEach(([taskId, task]) => {
      const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
      if (taskRoleIds.length > 0 && task.processId && processAreaMap[task.processId]) {
        const areaId = processAreaMap[task.processId];
        taskRoleIds.forEach(roleId => {
          if (!roleAreaMap[roleId]) {
            roleAreaMap[roleId] = new Set();
          }
          roleAreaMap[roleId].add(areaId);
        });
      }
    });

    // Sum employee costs by area through roles
    Object.entries(employees).forEach(([employeeId, employee]) => {
      const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
      if (employee.salary && roleIds.length > 0) {
        roleIds.forEach(roleId => {
          if (roleAreaMap[roleId]) {
            roleAreaMap[roleId].forEach(areaId => {
              if (costMap[areaId]) {
                costMap[areaId].employeeCosts += parseFloat(employee.salary) || 0;
              }
            });
          }
        });
      }
    });

    // Calculate total cost per area
    Object.keys(costMap).forEach(areaId => {
      costMap[areaId].totalCost = costMap[areaId].taskCosts + costMap[areaId].employeeCosts;
    });

    return Object.entries(costMap)
      .filter(([id, data]) => data.totalCost > 0)
      .map(([areaId, data]) => ({
        areaId,
        ...data
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  } catch (error) {
    console.error('Error calculating cost by area:', error);
    throw error;
  }
}

// Load analytics view
async function loadAnalytics() {
  const analyticsContent = document.getElementById('analytics-content');
  if (!analyticsContent) return;

  showSpinner('Calculando análisis...');
  try {
    const [employeeWorkload, roleWorkload, areaWorkload, employeeCosts, roleCosts, areaCosts] = await Promise.all([
      calculateWorkloadByEmployee(),
      calculateWorkloadByRole(),
      calculateWorkloadByArea(),
      calculateCostByEmployee(),
      calculateCostByRole(),
      calculateCostByArea()
    ]);

    hideSpinner();

    // Sort by total estimated time (descending)
    employeeWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);
    roleWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);
    areaWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);

    // Calculate totals for costs
    const totalEmployeeCosts = employeeCosts.reduce((sum, cost) => sum + cost.cost, 0);
    const totalRoleCosts = roleCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
    const totalAreaCosts = areaCosts.reduce((sum, cost) => sum + cost.totalCost, 0);

    analyticsContent.innerHTML = `
      <div class="space-y-6">
        <!-- INDICADORES DE CARGA SECTION -->
        <div class="border-t-2 border-gray-300 pt-6">
          <h2 class="text-xl sm:text-2xl font-light mb-6 text-gray-700 uppercase tracking-wider">Indicadores de Carga</h2>
          
          <!-- Employee Workload -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
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
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
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
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
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

        <!-- INDICADORES DE COSTO SECTION -->
        <div class="border-t-2 border-green-600 pt-6">
          <h2 class="text-xl sm:text-2xl font-light mb-6 text-green-600 uppercase tracking-wider">Indicadores de Costo</h2>
          
          <!-- Cost by Employee -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 class="text-lg sm:text-xl font-light mb-4">Costo por Empleado</h3>
            ${employeeCosts.length === 0 ? '<p class="text-gray-600 text-sm">No hay costos registrados</p>' : `
            <div class="space-y-3">
              ${employeeCosts.map(cost => `
                <div class="border border-gray-200 p-3">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-light text-sm sm:text-base">${escapeHtml(cost.employeeName)}</span>
                    <span class="text-xs sm:text-sm font-medium text-green-600">
                      $${cost.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              `).join('')}
              <div class="border-t-2 border-green-600 pt-3 mt-4">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-sm sm:text-base uppercase tracking-wider">Total:</span>
                  <span class="text-sm sm:text-base font-bold text-green-600">
                    $${totalEmployeeCosts.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            `}
          </div>

          <!-- Cost by Role -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 class="text-lg sm:text-xl font-light mb-4">Costo por Rol</h3>
            ${roleCosts.length === 0 ? '<p class="text-gray-600 text-sm">No hay costos registrados</p>' : `
            <div class="space-y-3">
              ${roleCosts.map(cost => `
                <div class="border border-gray-200 p-3">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-light text-sm sm:text-base">${escapeHtml(cost.roleName)}</span>
                    <span class="text-xs sm:text-sm font-medium text-green-600">
                      $${cost.totalCost.toFixed(2)}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600">
                    Empleados: ${cost.employeesCount}
                  </div>
                </div>
              `).join('')}
              <div class="border-t-2 border-green-600 pt-3 mt-4">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-sm sm:text-base uppercase tracking-wider">Total:</span>
                  <span class="text-sm sm:text-base font-bold text-green-600">
                    $${totalRoleCosts.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            `}
          </div>

          <!-- Cost by Area -->
          <div class="border border-gray-200 p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-light mb-4">Costo por Área</h3>
            ${areaCosts.length === 0 ? '<p class="text-gray-600 text-sm">No hay costos registrados</p>' : `
            <div class="space-y-3">
              ${areaCosts.map(cost => `
                <div class="border border-gray-200 p-3">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-light text-sm sm:text-base">${escapeHtml(cost.areaName)}</span>
                    <span class="text-xs sm:text-sm font-medium text-green-600">
                      $${cost.totalCost.toFixed(2)}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600">
                    ${cost.employeeCosts > 0 ? `Costos salariales: $${cost.employeeCosts.toFixed(2)}` : ''}
                    ${cost.employeeCosts > 0 && cost.taskCosts > 0 ? ' | ' : ''}
                    ${cost.taskCosts > 0 ? `Costos por tareas: $${cost.taskCosts.toFixed(2)}` : ''}
                  </div>
                </div>
              `).join('')}
              <div class="border-t-2 border-green-600 pt-3 mt-4">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-sm sm:text-base uppercase tracking-wider">Total:</span>
                  <span class="text-sm sm:text-base font-bold text-green-600">
                    $${totalAreaCosts.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            `}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar análisis: ' + error.message);
  }
}
