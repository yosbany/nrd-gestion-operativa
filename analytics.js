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

// Calculate incidents by employee (based on inspections with moderate/critical severity)
async function calculateIncidentsByEmployee() {
  try {
    const [inspectionsSnapshot, tasksSnapshot, employeesSnapshot, rolesSnapshot] = await Promise.all([
      getInspectionsRef().once('value'),
      getTasksRef().once('value'),
      getEmployeesRef().once('value'),
      getRolesRef().once('value')
    ]);

    const inspections = inspectionsSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};
    const employees = employeesSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};

    // Filter inspections with moderate or critical severity
    const incidents = Object.entries(inspections)
      .filter(([id, inspection]) => inspection.severity === 'moderada' || inspection.severity === 'critica')
      .map(([id, inspection]) => ({ id, ...inspection }));

    // Build incidents map by employee
    const incidentsMap = {};

    Object.entries(employees).forEach(([employeeId, employee]) => {
      incidentsMap[employeeId] = {
        employeeName: employee.name,
        roleId: employee.roleId,
        totalIncidents: 0,
        moderate: 0,
        critical: 0,
        tasks: {}
      };
    });

    // Count incidents per employee through their role
    incidents.forEach(inspection => {
      if (inspection.taskId && tasks[inspection.taskId]) {
        const task = tasks[inspection.taskId];
        if (task.roleId) {
          Object.entries(employees).forEach(([employeeId, employee]) => {
            if (employee.roleId === task.roleId) {
              if (!incidentsMap[employeeId]) {
                incidentsMap[employeeId] = {
                  employeeName: employee.name,
                  roleId: employee.roleId,
                  totalIncidents: 0,
                  moderate: 0,
                  critical: 0,
                  tasks: {}
                };
              }
              incidentsMap[employeeId].totalIncidents++;
              if (inspection.severity === 'moderada') {
                incidentsMap[employeeId].moderate++;
              } else if (inspection.severity === 'critica') {
                incidentsMap[employeeId].critical++;
              }
              // Track incidents by task
              if (!incidentsMap[employeeId].tasks[inspection.taskId]) {
                incidentsMap[employeeId].tasks[inspection.taskId] = {
                  taskName: task.name,
                  count: 0
                };
              }
              incidentsMap[employeeId].tasks[inspection.taskId].count++;
            }
          });
        }
      }
    });

    return Object.entries(incidentsMap)
      .filter(([id, data]) => data.totalIncidents > 0)
      .map(([employeeId, data]) => ({
        employeeId,
        ...data
      }));
  } catch (error) {
    console.error('Error calculating incidents by employee:', error);
    throw error;
  }
}

// Calculate incidents by task
async function calculateIncidentsByTask() {
  try {
    const [inspectionsSnapshot, tasksSnapshot] = await Promise.all([
      getInspectionsRef().once('value'),
      getTasksRef().once('value')
    ]);

    const inspections = inspectionsSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};

    // Filter inspections with moderate or critical severity
    const incidents = Object.entries(inspections)
      .filter(([id, inspection]) => inspection.severity === 'moderada' || inspection.severity === 'critica')
      .map(([id, inspection]) => ({ id, ...inspection }));

    // Build incidents map by task
    const incidentsMap = {};

    incidents.forEach(inspection => {
      if (inspection.taskId && tasks[inspection.taskId]) {
        const task = tasks[inspection.taskId];
        if (!incidentsMap[inspection.taskId]) {
          incidentsMap[inspection.taskId] = {
            taskId: inspection.taskId,
            taskName: task.name,
            totalIncidents: 0,
            moderate: 0,
            critical: 0
          };
        }
        incidentsMap[inspection.taskId].totalIncidents++;
        if (inspection.severity === 'moderada') {
          incidentsMap[inspection.taskId].moderate++;
        } else if (inspection.severity === 'critica') {
          incidentsMap[inspection.taskId].critical++;
        }
      }
    });

    return Object.entries(incidentsMap).map(([taskId, data]) => ({
      taskId,
      ...data
    }));
  } catch (error) {
    console.error('Error calculating incidents by task:', error);
    throw error;
  }
}

// Calculate incidents by process
async function calculateIncidentsByProcess() {
  try {
    const [inspectionsSnapshot, tasksSnapshot, processesSnapshot] = await Promise.all([
      getInspectionsRef().once('value'),
      getTasksRef().once('value'),
      getProcessesRef().once('value')
    ]);

    const inspections = inspectionsSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};

    // Filter inspections with moderate or critical severity
    const incidents = Object.entries(inspections)
      .filter(([id, inspection]) => inspection.severity === 'moderada' || inspection.severity === 'critica')
      .map(([id, inspection]) => ({ id, ...inspection }));

    // Build incidents map by process
    const incidentsMap = {};

    Object.entries(processes).forEach(([processId, process]) => {
      incidentsMap[processId] = {
        processId,
        processName: process.name,
        totalIncidents: 0,
        moderate: 0,
        critical: 0,
        tasks: {}
      };
    });

    incidents.forEach(inspection => {
      if (inspection.taskId && tasks[inspection.taskId]) {
        const task = tasks[inspection.taskId];
        if (task.processId && incidentsMap[task.processId]) {
          incidentsMap[task.processId].totalIncidents++;
          if (inspection.severity === 'moderada') {
            incidentsMap[task.processId].moderate++;
          } else if (inspection.severity === 'critica') {
            incidentsMap[task.processId].critical++;
          }
          // Track incidents by task
          if (!incidentsMap[task.processId].tasks[inspection.taskId]) {
            incidentsMap[task.processId].tasks[inspection.taskId] = {
              taskName: task.name,
              count: 0
            };
          }
          incidentsMap[task.processId].tasks[inspection.taskId].count++;
        }
      }
    });

    return Object.entries(incidentsMap)
      .filter(([id, data]) => data.totalIncidents > 0)
      .map(([processId, data]) => ({
        processId,
        ...data
      }));
  } catch (error) {
    console.error('Error calculating incidents by process:', error);
    throw error;
  }
}

// Calculate incidents by area
async function calculateIncidentsByArea() {
  try {
    const [inspectionsSnapshot, tasksSnapshot, processesSnapshot, areasSnapshot] = await Promise.all([
      getInspectionsRef().once('value'),
      getTasksRef().once('value'),
      getProcessesRef().once('value'),
      getAreasRef().once('value')
    ]);

    const inspections = inspectionsSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};
    const areas = areasSnapshot.val() || {};

    // Filter inspections with moderate or critical severity
    const incidents = Object.entries(inspections)
      .filter(([id, inspection]) => inspection.severity === 'moderada' || inspection.severity === 'critica')
      .map(([id, inspection]) => ({ id, ...inspection }));

    // Build incidents map by area
    const incidentsMap = {};

    Object.entries(areas).forEach(([areaId, area]) => {
      incidentsMap[areaId] = {
        areaId,
        areaName: area.name,
        totalIncidents: 0,
        moderate: 0,
        critical: 0,
        processes: {}
      };
    });

    incidents.forEach(inspection => {
      if (inspection.taskId && tasks[inspection.taskId]) {
        const task = tasks[inspection.taskId];
        if (task.processId && processes[task.processId]) {
          const process = processes[task.processId];
          if (process.areaId && incidentsMap[process.areaId]) {
            incidentsMap[process.areaId].totalIncidents++;
            if (inspection.severity === 'moderada') {
              incidentsMap[process.areaId].moderate++;
            } else if (inspection.severity === 'critica') {
              incidentsMap[process.areaId].critical++;
            }
            // Track incidents by process
            if (!incidentsMap[process.areaId].processes[task.processId]) {
              incidentsMap[process.areaId].processes[task.processId] = {
                processName: process.name,
                count: 0
              };
            }
            incidentsMap[process.areaId].processes[task.processId].count++;
          }
        }
      }
    });

    return Object.entries(incidentsMap)
      .filter(([id, data]) => data.totalIncidents > 0)
      .map(([areaId, data]) => ({
        areaId,
        ...data
      }));
  } catch (error) {
    console.error('Error calculating incidents by area:', error);
    throw error;
  }
}

// Calculate incidents by role
async function calculateIncidentsByRole() {
  try {
    const [inspectionsSnapshot, tasksSnapshot, rolesSnapshot] = await Promise.all([
      getInspectionsRef().once('value'),
      getTasksRef().once('value'),
      getRolesRef().once('value')
    ]);

    const inspections = inspectionsSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};

    // Filter inspections with moderate or critical severity
    const incidents = Object.entries(inspections)
      .filter(([id, inspection]) => inspection.severity === 'moderada' || inspection.severity === 'critica')
      .map(([id, inspection]) => ({ id, ...inspection }));

    // Build incidents map by role
    const incidentsMap = {};

    Object.entries(roles).forEach(([roleId, role]) => {
      incidentsMap[roleId] = {
        roleId,
        roleName: role.name,
        totalIncidents: 0,
        moderate: 0,
        critical: 0,
        tasks: {}
      };
    });

    incidents.forEach(inspection => {
      if (inspection.taskId && tasks[inspection.taskId]) {
        const task = tasks[inspection.taskId];
        if (task.roleId && incidentsMap[task.roleId]) {
          incidentsMap[task.roleId].totalIncidents++;
          if (inspection.severity === 'moderada') {
            incidentsMap[task.roleId].moderate++;
          } else if (inspection.severity === 'critica') {
            incidentsMap[task.roleId].critical++;
          }
          // Track incidents by task
          if (!incidentsMap[task.roleId].tasks[inspection.taskId]) {
            incidentsMap[task.roleId].tasks[inspection.taskId] = {
              taskName: task.name,
              count: 0
            };
          }
          incidentsMap[task.roleId].tasks[inspection.taskId].count++;
        }
      }
    });

    return Object.entries(incidentsMap)
      .filter(([id, data]) => data.totalIncidents > 0)
      .map(([roleId, data]) => ({
        roleId,
        ...data
      }));
  } catch (error) {
    console.error('Error calculating incidents by role:', error);
    throw error;
  }
}

// Calculate cost by employee
async function calculateCostByEmployee() {
  try {
    const employeesSnapshot = await getEmployeesRef().once('value');
    const employees = employeesSnapshot.val() || {};

    return Object.entries(employees)
      .filter(([id, employee]) => employee.salary)
      .map(([employeeId, employee]) => ({
        employeeId,
        employeeName: employee.name,
        cost: parseFloat(employee.salary) || 0,
        roleId: employee.roleId || null
      }))
      .sort((a, b) => b.cost - a.cost);
  } catch (error) {
    console.error('Error calculating cost by employee:', error);
    throw error;
  }
}

// Calculate cost by role
async function calculateCostByRole() {
  try {
    const [employeesSnapshot, rolesSnapshot] = await Promise.all([
      getEmployeesRef().once('value'),
      getRolesRef().once('value')
    ]);

    const employees = employeesSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};

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
      if (employee.roleId && employee.salary && costMap[employee.roleId]) {
        costMap[employee.roleId].totalCost += parseFloat(employee.salary) || 0;
        costMap[employee.roleId].employeesCount++;
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
    const [areasSnapshot, processesSnapshot, tasksSnapshot, employeesSnapshot, rolesSnapshot] = await Promise.all([
      getAreasRef().once('value'),
      getProcessesRef().once('value'),
      getTasksRef().once('value'),
      getEmployeesRef().once('value'),
      getRolesRef().once('value')
    ]);

    const areas = areasSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};
    const employees = employeesSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};

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
      if (task.roleId && task.processId && processAreaMap[task.processId]) {
        const areaId = processAreaMap[task.processId];
        if (!roleAreaMap[task.roleId]) {
          roleAreaMap[task.roleId] = new Set();
        }
        roleAreaMap[task.roleId].add(areaId);
      }
    });

    // Sum employee costs by area through roles
    Object.entries(employees).forEach(([employeeId, employee]) => {
      if (employee.roleId && employee.salary && roleAreaMap[employee.roleId]) {
        roleAreaMap[employee.roleId].forEach(areaId => {
          if (costMap[areaId]) {
            costMap[areaId].employeeCosts += parseFloat(employee.salary) || 0;
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
    const [employeeWorkload, roleWorkload, areaWorkload, employeeIncidents, taskIncidents, processIncidents, areaIncidents, roleIncidents, employeeCosts, roleCosts, areaCosts] = await Promise.all([
      calculateWorkloadByEmployee(),
      calculateWorkloadByRole(),
      calculateWorkloadByArea(),
      calculateIncidentsByEmployee(),
      calculateIncidentsByTask(),
      calculateIncidentsByProcess(),
      calculateIncidentsByArea(),
      calculateIncidentsByRole(),
      calculateCostByEmployee(),
      calculateCostByRole(),
      calculateCostByArea()
    ]);

    hideSpinner();

    // Sort by total estimated time (descending)
    employeeWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);
    roleWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);
    areaWorkload.sort((a, b) => b.totalEstimatedTime - a.totalEstimatedTime);

    // Sort incidents by total (descending)
    employeeIncidents.sort((a, b) => b.totalIncidents - a.totalIncidents);
    taskIncidents.sort((a, b) => b.totalIncidents - a.totalIncidents);
    processIncidents.sort((a, b) => b.totalIncidents - a.totalIncidents);
    areaIncidents.sort((a, b) => b.totalIncidents - a.totalIncidents);
    roleIncidents.sort((a, b) => b.totalIncidents - a.totalIncidents);

    analyticsContent.innerHTML = `
      <div class="space-y-6">
        <!-- COSTOS SECTION -->
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
            </div>
            `}
          </div>

          <!-- Cost by Area -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
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
            </div>
            `}
          </div>
        </div>

        <!-- INCIDENCIAS SECTION -->
        <div class="border-t-2 border-red-600 pt-6">
          <h2 class="text-xl sm:text-2xl font-light mb-6 text-red-600 uppercase tracking-wider">Indicadores de Incidencias</h2>
          
          <!-- Incidents by Employee -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 class="text-lg sm:text-xl font-light mb-4">Incidencias por Empleado</h3>
            ${employeeIncidents.length === 0 ? '<p class="text-gray-600 text-sm">No hay incidencias registradas</p>' : `
            <div class="space-y-3">
              ${employeeIncidents.map(incident => `
                <div class="border border-gray-200 p-3 ${incident.critical > 0 ? 'border-red-300 bg-red-50' : incident.moderate > 0 ? 'border-orange-300 bg-orange-50' : ''}">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-light text-sm sm:text-base">${escapeHtml(incident.employeeName)}</span>
                    <span class="text-xs sm:text-sm font-medium ${incident.critical > 0 ? 'text-red-600' : 'text-orange-600'}">
                      ${incident.totalIncidents} incidencia${incident.totalIncidents !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600 space-y-1">
                    <div>Moderadas: ${incident.moderate} | Críticas: <span class="${incident.critical > 0 ? 'text-red-600 font-medium' : ''}">${incident.critical}</span></div>
                    ${Object.keys(incident.tasks).length > 0 ? `
                    <div class="mt-2 pt-2 border-t border-gray-300">
                      <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Tareas con incidencias:</div>
                      ${Object.entries(incident.tasks).map(([taskId, taskData]) => `
                        <div class="text-xs">• ${escapeHtml(taskData.taskName)}: ${taskData.count} vez${taskData.count !== 1 ? 'es' : ''}</div>
                      `).join('')}
                    </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            `}
          </div>

          <!-- Incidents by Task -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 class="text-lg sm:text-xl font-light mb-4">Incidencias por Tarea (Tareas con más problemas)</h3>
            ${taskIncidents.length === 0 ? '<p class="text-gray-600 text-sm">No hay incidencias registradas</p>' : `
            <div class="space-y-3">
              ${taskIncidents.map(incident => `
                <div class="border border-gray-200 p-3 ${incident.critical > 0 ? 'border-red-300 bg-red-50' : incident.moderate > 0 ? 'border-orange-300 bg-orange-50' : ''}">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-light text-sm sm:text-base">${escapeHtml(incident.taskName)}</span>
                    <span class="text-xs sm:text-sm font-medium ${incident.critical > 0 ? 'text-red-600' : 'text-orange-600'}">
                      ${incident.totalIncidents} incidencia${incident.totalIncidents !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600">
                    Moderadas: ${incident.moderate} | Críticas: <span class="${incident.critical > 0 ? 'text-red-600 font-medium' : ''}">${incident.critical}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            `}
          </div>

          <!-- Incidents by Process -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 class="text-lg sm:text-xl font-light mb-4">Incidencias por Proceso</h3>
            ${processIncidents.length === 0 ? '<p class="text-gray-600 text-sm">No hay incidencias registradas</p>' : `
            <div class="space-y-3">
              ${processIncidents.map(incident => `
                <div class="border border-gray-200 p-3 ${incident.critical > 0 ? 'border-red-300 bg-red-50' : incident.moderate > 0 ? 'border-orange-300 bg-orange-50' : ''}">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-light text-sm sm:text-base">${escapeHtml(incident.processName)}</span>
                    <span class="text-xs sm:text-sm font-medium ${incident.critical > 0 ? 'text-red-600' : 'text-orange-600'}">
                      ${incident.totalIncidents} incidencia${incident.totalIncidents !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600 space-y-1">
                    <div>Moderadas: ${incident.moderate} | Críticas: <span class="${incident.critical > 0 ? 'text-red-600 font-medium' : ''}">${incident.critical}</span></div>
                    ${Object.keys(incident.tasks).length > 0 ? `
                    <div class="mt-2 pt-2 border-t border-gray-300">
                      <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Tareas con incidencias:</div>
                      ${Object.entries(incident.tasks).map(([taskId, taskData]) => `
                        <div class="text-xs">• ${escapeHtml(taskData.taskName)}: ${taskData.count} vez${taskData.count !== 1 ? 'es' : ''}</div>
                      `).join('')}
                    </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            `}
          </div>

          <!-- Incidents by Area -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 class="text-lg sm:text-xl font-light mb-4">Incidencias por Área</h3>
            ${areaIncidents.length === 0 ? '<p class="text-gray-600 text-sm">No hay incidencias registradas</p>' : `
            <div class="space-y-3">
              ${areaIncidents.map(incident => `
                <div class="border border-gray-200 p-3 ${incident.critical > 0 ? 'border-red-300 bg-red-50' : incident.moderate > 0 ? 'border-orange-300 bg-orange-50' : ''}">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-light text-sm sm:text-base">${escapeHtml(incident.areaName)}</span>
                    <span class="text-xs sm:text-sm font-medium ${incident.critical > 0 ? 'text-red-600' : 'text-orange-600'}">
                      ${incident.totalIncidents} incidencia${incident.totalIncidents !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600 space-y-1">
                    <div>Moderadas: ${incident.moderate} | Críticas: <span class="${incident.critical > 0 ? 'text-red-600 font-medium' : ''}">${incident.critical}</span></div>
                    ${Object.keys(incident.processes).length > 0 ? `
                    <div class="mt-2 pt-2 border-t border-gray-300">
                      <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Procesos con incidencias:</div>
                      ${Object.entries(incident.processes).map(([processId, processData]) => `
                        <div class="text-xs">• ${escapeHtml(processData.processName)}: ${processData.count} vez${processData.count !== 1 ? 'es' : ''}</div>
                      `).join('')}
                    </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            `}
          </div>

          <!-- Incidents by Role -->
          <div class="border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 class="text-lg sm:text-xl font-light mb-4">Incidencias por Rol</h3>
            ${roleIncidents.length === 0 ? '<p class="text-gray-600 text-sm">No hay incidencias registradas</p>' : `
            <div class="space-y-3">
              ${roleIncidents.map(incident => `
                <div class="border border-gray-200 p-3 ${incident.critical > 0 ? 'border-red-300 bg-red-50' : incident.moderate > 0 ? 'border-orange-300 bg-orange-50' : ''}">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-light text-sm sm:text-base">${escapeHtml(incident.roleName)}</span>
                    <span class="text-xs sm:text-sm font-medium ${incident.critical > 0 ? 'text-red-600' : 'text-orange-600'}">
                      ${incident.totalIncidents} incidencia${incident.totalIncidents !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div class="text-xs text-gray-600 space-y-1">
                    <div>Moderadas: ${incident.moderate} | Críticas: <span class="${incident.critical > 0 ? 'text-red-600 font-medium' : ''}">${incident.critical}</span></div>
                    ${Object.keys(incident.tasks).length > 0 ? `
                    <div class="mt-2 pt-2 border-t border-gray-300">
                      <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Tareas con incidencias:</div>
                      ${Object.entries(incident.tasks).map(([taskId, taskData]) => `
                        <div class="text-xs">• ${escapeHtml(taskData.taskName)}: ${taskData.count} vez${taskData.count !== 1 ? 'es' : ''}</div>
                      `).join('')}
                    </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            `}
          </div>
        </div>

        <!-- CARGA DE TRABAJO SECTION -->
        <div class="border-t-2 border-gray-300 pt-6">
          <h2 class="text-xl sm:text-2xl font-light mb-6 text-gray-700 uppercase tracking-wider">Carga de Trabajo</h2>
          
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
      </div>
    `;
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar análisis: ' + error.message);
  }
}
