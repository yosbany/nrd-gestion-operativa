// Dashboard and business health indicators

// Calculate documentation health
async function calculateDocumentationHealth() {
  try {
    const [tasksSnapshot, processesSnapshot, areasSnapshot] = await Promise.all([
      getTasksRef().once('value'),
      getProcessesRef().once('value'),
      getAreasRef().once('value')
    ]);

    const tasks = tasksSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};
    const areas = areasSnapshot.val() || {};

    const totalTasks = Object.keys(tasks).length;
    const totalProcesses = Object.keys(processes).length;
    const totalAreas = Object.keys(areas).length;

    // Tasks documentation metrics
    let tasksWithDescription = 0;
    let tasksWithSteps = 0;
    let tasksWithCriteria = 0;
    let tasksWithErrors = 0;
    let tasksFullyDocumented = 0;

    Object.values(tasks).forEach(task => {
      if (task.description) tasksWithDescription++;
      if (task.executionSteps && task.executionSteps.length > 0) tasksWithSteps++;
      if (task.successCriteria) tasksWithCriteria++;
      if (task.commonErrors && task.commonErrors.length > 0) tasksWithErrors++;
      if (task.description && task.executionSteps && task.executionSteps.length > 0 && 
          task.successCriteria && task.commonErrors && task.commonErrors.length > 0) {
        tasksFullyDocumented++;
      }
    });

    // Processes documentation metrics
    let processesWithObjective = 0;
    let processesWithTasks = 0;

    Object.values(processes).forEach(process => {
      if (process.objective) processesWithObjective++;
      // Check if process has tasks
      const hasTasks = Object.values(tasks).some(task => task.processId === process.id);
      if (hasTasks) processesWithTasks++;
    });

    // Areas documentation metrics
    let areasWithDescription = 0;
    let areasWithProcesses = 0;

    Object.values(areas).forEach(area => {
      if (area.description) areasWithDescription++;
      // Check if area has processes
      const hasProcesses = Object.values(processes).some(process => process.areaId === area.id);
      if (hasProcesses) areasWithProcesses++;
    });

    return {
      tasks: {
        total: totalTasks,
        withDescription: tasksWithDescription,
        withSteps: tasksWithSteps,
        withCriteria: tasksWithCriteria,
        withErrors: tasksWithErrors,
        fullyDocumented: tasksFullyDocumented,
        documentationRate: totalTasks > 0 ? Math.round((tasksFullyDocumented / totalTasks) * 100) : 0
      },
      processes: {
        total: totalProcesses,
        withObjective: processesWithObjective,
        withTasks: processesWithTasks,
        documentationRate: totalProcesses > 0 ? Math.round((processesWithObjective / totalProcesses) * 100) : 0,
        systematizationRate: totalProcesses > 0 ? Math.round((processesWithTasks / totalProcesses) * 100) : 0
      },
      areas: {
        total: totalAreas,
        withDescription: areasWithDescription,
        withProcesses: areasWithProcesses,
        documentationRate: totalAreas > 0 ? Math.round((areasWithDescription / totalAreas) * 100) : 0,
        systematizationRate: totalAreas > 0 ? Math.round((areasWithProcesses / totalAreas) * 100) : 0
      }
    };
  } catch (error) {
    console.error('Error calculating documentation health:', error);
    throw error;
  }
}

// Calculate standardization health
async function calculateStandardizationHealth() {
  try {
    const [tasksSnapshot, processesSnapshot, employeesSnapshot, rolesSnapshot] = await Promise.all([
      getTasksRef().once('value'),
      getProcessesRef().once('value'),
      getEmployeesRef().once('value'),
      getRolesRef().once('value')
    ]);

    const tasks = tasksSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};
    const employees = employeesSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};

    const totalTasks = Object.keys(tasks).length;
    const totalProcesses = Object.keys(processes).length;
    const totalEmployees = Object.keys(employees).length;
    const totalRoles = Object.keys(roles).length;

    // Tasks standardization
    let tasksWithRole = 0;
    let tasksWithProcess = 0;
    let tasksWithOrder = 0;
    let tasksWithTime = 0;
    let tasksStandardized = 0;

    Object.values(tasks).forEach(task => {
      if (task.roleId) tasksWithRole++;
      if (task.processId) tasksWithProcess++;
      if (task.order !== null && task.order !== undefined) tasksWithOrder++;
      if (task.estimatedTime) tasksWithTime++;
      if (task.roleId && task.processId && task.order !== null && task.order !== undefined && task.estimatedTime) {
        tasksStandardized++;
      }
    });

    // Processes standardization
    let processesWithArea = 0;
    let processesStandardized = 0;

    Object.values(processes).forEach(process => {
      if (process.areaId) processesWithArea++;
      // Check if process has area and tasks
      const hasTasks = Object.values(tasks).some(task => task.processId === process.id);
      if (process.areaId && hasTasks) processesStandardized++;
    });

    // Employees standardization
    let employeesWithRole = 0;

    Object.values(employees).forEach(employee => {
      const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
      if (roleIds.length > 0) employeesWithRole++;
    });

    return {
      tasks: {
        total: totalTasks,
        withRole: tasksWithRole,
        withProcess: tasksWithProcess,
        withOrder: tasksWithOrder,
        withTime: tasksWithTime,
        standardized: tasksStandardized,
        standardizationRate: totalTasks > 0 ? Math.round((tasksStandardized / totalTasks) * 100) : 0
      },
      processes: {
        total: totalProcesses,
        withArea: processesWithArea,
        standardized: processesStandardized,
        standardizationRate: totalProcesses > 0 ? Math.round((processesStandardized / totalProcesses) * 100) : 0
      },
      employees: {
        total: totalEmployees,
        withRole: employeesWithRole,
        standardizationRate: totalEmployees > 0 ? Math.round((employeesWithRole / totalEmployees) * 100) : 0
      },
      roles: {
        total: totalRoles
      }
    };
  } catch (error) {
    console.error('Error calculating standardization health:', error);
    throw error;
  }
}

// Calculate systematization health
async function calculateSystematizationHealth() {
  try {
    const [tasksSnapshot, processesSnapshot, areasSnapshot] = await Promise.all([
      getTasksRef().once('value'),
      getProcessesRef().once('value'),
      getAreasRef().once('value')
    ]);

    const tasks = tasksSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};
    const areas = areasSnapshot.val() || {};

    // Tasks without process
    const tasksWithoutProcess = Object.entries(tasks)
      .filter(([id, task]) => !task.processId)
      .map(([id, task]) => ({ id, name: task.name }));

    // Processes without area
    const processesWithoutArea = Object.entries(processes)
      .filter(([id, process]) => !process.areaId)
      .map(([id, process]) => ({ id, name: process.name }));

    // Processes without tasks
    const processesWithoutTasks = Object.entries(processes)
      .filter(([id, process]) => {
        return !Object.values(tasks).some(task => task.processId === id);
      })
      .map(([id, process]) => ({ id, name: process.name }));

    // Areas without processes
    const areasWithoutProcesses = Object.entries(areas)
      .filter(([id, area]) => {
        return !Object.values(processes).some(process => process.areaId === id);
      })
      .map(([id, area]) => ({ id, name: area.name }));

    const totalTasks = Object.keys(tasks).length;
    const totalProcesses = Object.keys(processes).length;
    const totalAreas = Object.keys(areas).length;

    return {
      tasks: {
        total: totalTasks,
        withoutProcess: tasksWithoutProcess.length,
        systematizationRate: totalTasks > 0 ? Math.round(((totalTasks - tasksWithoutProcess.length) / totalTasks) * 100) : 0
      },
      processes: {
        total: totalProcesses,
        withoutArea: processesWithoutArea.length,
        withoutTasks: processesWithoutTasks.length,
        systematizationRate: totalProcesses > 0 ? Math.round(((totalProcesses - processesWithoutArea.length - processesWithoutTasks.length) / totalProcesses) * 100) : 0
      },
      areas: {
        total: totalAreas,
        withoutProcesses: areasWithoutProcesses.length,
        systematizationRate: totalAreas > 0 ? Math.round(((totalAreas - areasWithoutProcesses.length) / totalAreas) * 100) : 0
      },
      details: {
        tasksWithoutProcess,
        processesWithoutArea,
        processesWithoutTasks,
        areasWithoutProcesses
      }
    };
  } catch (error) {
    console.error('Error calculating systematization health:', error);
    throw error;
  }
}

// Load inicio view
async function loadInicio() {
  const inicioContent = document.getElementById('inicio-content');
  if (!inicioContent) return;

  showSpinner('Calculando indicadores de salud...');
  try {
    const [docHealth, stdHealth, sysHealth, companyInfoSnapshot] = await Promise.all([
      calculateDocumentationHealth(),
      calculateStandardizationHealth(),
      calculateSystematizationHealth(),
      getCompanyInfo()
    ]);

    const companyInfo = companyInfoSnapshot.val() || {};
    
    // Check all required fields
    const hasLegalName = companyInfo.legalName && companyInfo.legalName.trim().length > 0;
    const hasTradeName = companyInfo.tradeName && companyInfo.tradeName.trim().length > 0;
    const hasRut = companyInfo.rut && companyInfo.rut.trim().length > 0;
    const hasAddress = companyInfo.address && companyInfo.address.trim().length > 0;
    const hasPhone = companyInfo.phone && companyInfo.phone.trim().length > 0;
    const hasMobile = companyInfo.mobile && companyInfo.mobile.trim().length > 0;
    const hasEmail = companyInfo.email && companyInfo.email.trim().length > 0;
    const hasMission = companyInfo.mission && companyInfo.mission.trim().length > 0;
    const hasVision = companyInfo.vision && companyInfo.vision.trim().length > 0;
    
    const totalFields = 9;
    const completedFields = [hasLegalName, hasTradeName, hasRut, hasAddress, hasPhone, hasMobile, hasEmail, hasMission, hasVision].filter(Boolean).length;
    const companyInfoRate = Math.round((completedFields / totalFields) * 100);
    const companyInfoComplete = completedFields === totalFields;

    hideSpinner();

    // Helper function to get color based on percentage
    const getHealthColor = (percentage) => {
      if (percentage >= 80) return 'text-green-600';
      if (percentage >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getHealthBgColor = (percentage) => {
      if (percentage >= 80) return 'bg-green-50 border-green-200';
      if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
      return 'bg-red-50 border-red-200';
    };

    // Calculate overall completion percentage
    const docAvg = (docHealth.tasks.documentationRate + docHealth.processes.documentationRate + docHealth.areas.documentationRate) / 3;
    const stdAvg = (stdHealth.tasks.standardizationRate + stdHealth.processes.standardizationRate + stdHealth.employees.standardizationRate) / 3;
    const sysAvg = (sysHealth.tasks.systematizationRate + sysHealth.processes.systematizationRate + sysHealth.areas.systematizationRate) / 3;
    const overallCompletion = isNaN(companyInfoRate) || isNaN(docAvg) || isNaN(stdAvg) || isNaN(sysAvg) 
      ? 0 
      : Math.round((companyInfoRate + docAvg + stdAvg + sysAvg) / 4);
    
    const getProgressColor = (percentage) => {
      if (percentage >= 80) return 'bg-green-600';
      if (percentage >= 60) return 'bg-yellow-600';
      return 'bg-red-600';
    };

    inicioContent.innerHTML = `
      <div class="space-y-6">
        <div class="text-center mb-6">
          <h1 class="text-2xl sm:text-3xl font-light mb-2">Indicadores de Salud</h1>
          <p class="text-sm sm:text-base text-gray-600 mb-4">Documentación, Estandarización y Sistematización</p>
          
          <!-- Overall Progress Bar -->
          <div class="max-w-2xl mx-auto">
            <div class="flex items-center justify-end mb-2">
              <span class="text-lg sm:text-xl font-medium ${getHealthColor(overallCompletion)}">
                ${overallCompletion}%
              </span>
            </div>
            <div class="w-full bg-gray-200 h-4 sm:h-5 overflow-hidden">
              <div class="h-full ${getProgressColor(overallCompletion)} transition-all duration-500" style="width: ${overallCompletion}%"></div>
            </div>
          </div>
        </div>

        <!-- INFORMACIÓN DE LA EMPRESA -->
        <div class="border-2 border-gray-300 p-4 sm:p-6">
          <h2 class="text-xl sm:text-2xl font-light mb-4 text-gray-800 uppercase tracking-wider">Información de la Empresa</h2>
          
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Información Básica</h3>
              <span class="text-2xl font-light ${getHealthColor(companyInfoRate)}">
                ${companyInfoRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Razón Social:</span>
                <span class="font-light ${hasLegalName ? 'text-green-600' : 'text-red-600'}">
                  ${hasLegalName ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Nombre Fantasía:</span>
                <span class="font-light ${hasTradeName ? 'text-green-600' : 'text-red-600'}">
                  ${hasTradeName ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Número de Rut:</span>
                <span class="font-light ${hasRut ? 'text-green-600' : 'text-red-600'}">
                  ${hasRut ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Dirección Fiscal:</span>
                <span class="font-light ${hasAddress ? 'text-green-600' : 'text-red-600'}">
                  ${hasAddress ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Teléfono:</span>
                <span class="font-light ${hasPhone ? 'text-green-600' : 'text-red-600'}">
                  ${hasPhone ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Celular:</span>
                <span class="font-light ${hasMobile ? 'text-green-600' : 'text-red-600'}">
                  ${hasMobile ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Correo Electrónico:</span>
                <span class="font-light ${hasEmail ? 'text-green-600' : 'text-red-600'}">
                  ${hasEmail ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Misión:</span>
                <span class="font-light ${hasMission ? 'text-green-600' : 'text-red-600'}">
                  ${hasMission ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Visión:</span>
                <span class="font-light ${hasVision ? 'text-green-600' : 'text-red-600'}">
                  ${hasVision ? '✓ Completada' : '✗ Pendiente'}
                </span>
              </div>
              <div class="flex justify-between pt-2 border-t border-gray-200">
                <span class="font-medium">Estado general:</span>
                <span class="font-medium ${companyInfoComplete ? 'text-green-600' : 'text-red-600'}">
                  ${completedFields}/${totalFields} campos completados
                </span>
              </div>
            </div>
            ${!companyInfoComplete ? `
            <div class="mt-4 pt-4 border-t border-gray-200">
              <a href="#" onclick="switchView('informacion'); return false;" class="text-sm text-red-600 hover:text-red-700 underline">
                Completar información de la empresa →
              </a>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- DOCUMENTACIÓN -->
        <div class="border-2 border-gray-300 p-4 sm:p-6">
          <h2 class="text-xl sm:text-2xl font-light mb-4 text-gray-800 uppercase tracking-wider">Documentación</h2>
          
          <!-- Tareas -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Documentación de Tareas</h3>
              <span class="text-2xl font-light ${getHealthColor(docHealth.tasks.documentationRate)}">
                ${docHealth.tasks.documentationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de tareas:</span>
                <span class="font-light">${docHealth.tasks.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con descripción:</span>
                <span class="font-light">${docHealth.tasks.withDescription} (${docHealth.tasks.total > 0 ? Math.round((docHealth.tasks.withDescription / docHealth.tasks.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con pasos de ejecución:</span>
                <span class="font-light">${docHealth.tasks.withSteps} (${docHealth.tasks.total > 0 ? Math.round((docHealth.tasks.withSteps / docHealth.tasks.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con criterios de éxito:</span>
                <span class="font-light">${docHealth.tasks.withCriteria} (${docHealth.tasks.total > 0 ? Math.round((docHealth.tasks.withCriteria / docHealth.tasks.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con errores comunes:</span>
                <span class="font-light">${docHealth.tasks.withErrors} (${docHealth.tasks.total > 0 ? Math.round((docHealth.tasks.withErrors / docHealth.tasks.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-gray-200">
                <span class="font-medium">Totalmente documentadas:</span>
                <span class="font-medium">${docHealth.tasks.fullyDocumented}</span>
              </div>
            </div>
          </div>

          <!-- Procesos -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Documentación de Procesos</h3>
              <span class="text-2xl font-light ${getHealthColor(docHealth.processes.documentationRate)}">
                ${docHealth.processes.documentationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de procesos:</span>
                <span class="font-light">${docHealth.processes.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con objetivo definido:</span>
                <span class="font-light">${docHealth.processes.withObjective} (${docHealth.processes.total > 0 ? Math.round((docHealth.processes.withObjective / docHealth.processes.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con tareas asignadas:</span>
                <span class="font-light">${docHealth.processes.withTasks} (${docHealth.processes.total > 0 ? Math.round((docHealth.processes.withTasks / docHealth.processes.total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          <!-- Áreas -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Documentación de Áreas</h3>
              <span class="text-2xl font-light ${getHealthColor(docHealth.areas.documentationRate)}">
                ${docHealth.areas.documentationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de áreas:</span>
                <span class="font-light">${docHealth.areas.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con descripción:</span>
                <span class="font-light">${docHealth.areas.withDescription} (${docHealth.areas.total > 0 ? Math.round((docHealth.areas.withDescription / docHealth.areas.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con procesos asignados:</span>
                <span class="font-light">${docHealth.areas.withProcesses} (${docHealth.areas.total > 0 ? Math.round((docHealth.areas.withProcesses / docHealth.areas.total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ESTANDARIZACIÓN -->
        <div class="border-2 border-gray-300 p-4 sm:p-6">
          <h2 class="text-xl sm:text-2xl font-light mb-4 text-gray-800 uppercase tracking-wider">Estandarización</h2>
          
          <!-- Tareas -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Estandarización de Tareas</h3>
              <span class="text-2xl font-light ${getHealthColor(stdHealth.tasks.standardizationRate)}">
                ${stdHealth.tasks.standardizationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de tareas:</span>
                <span class="font-light">${stdHealth.tasks.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con rol asignado:</span>
                <span class="font-light">${stdHealth.tasks.withRole} (${stdHealth.tasks.total > 0 ? Math.round((stdHealth.tasks.withRole / stdHealth.tasks.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Asociadas a proceso:</span>
                <span class="font-light">${stdHealth.tasks.withProcess} (${stdHealth.tasks.total > 0 ? Math.round((stdHealth.tasks.withProcess / stdHealth.tasks.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con orden definido:</span>
                <span class="font-light">${stdHealth.tasks.withOrder} (${stdHealth.tasks.total > 0 ? Math.round((stdHealth.tasks.withOrder / stdHealth.tasks.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con tiempo estimado:</span>
                <span class="font-light">${stdHealth.tasks.withTime} (${stdHealth.tasks.total > 0 ? Math.round((stdHealth.tasks.withTime / stdHealth.tasks.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-gray-200">
                <span class="font-medium">Totalmente estandarizadas:</span>
                <span class="font-medium">${stdHealth.tasks.standardized}</span>
              </div>
            </div>
          </div>

          <!-- Procesos -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Estandarización de Procesos</h3>
              <span class="text-2xl font-light ${getHealthColor(stdHealth.processes.standardizationRate)}">
                ${stdHealth.processes.standardizationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de procesos:</span>
                <span class="font-light">${stdHealth.processes.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Asociados a área:</span>
                <span class="font-light">${stdHealth.processes.withArea} (${stdHealth.processes.total > 0 ? Math.round((stdHealth.processes.withArea / stdHealth.processes.total) * 100) : 0}%)</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-gray-200">
                <span class="font-medium">Totalmente estandarizados:</span>
                <span class="font-medium">${stdHealth.processes.standardized}</span>
              </div>
            </div>
          </div>

          <!-- Empleados -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Estandarización de Empleados</h3>
              <span class="text-2xl font-light ${getHealthColor(stdHealth.employees.standardizationRate)}">
                ${stdHealth.employees.standardizationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de empleados:</span>
                <span class="font-light">${stdHealth.employees.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Con rol asignado:</span>
                <span class="font-light">${stdHealth.employees.withRole} (${stdHealth.employees.total > 0 ? Math.round((stdHealth.employees.withRole / stdHealth.employees.total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SISTEMATIZACIÓN -->
        <div class="border-2 border-gray-300 p-4 sm:p-6">
          <h2 class="text-xl sm:text-2xl font-light mb-4 text-gray-800 uppercase tracking-wider">Sistematización</h2>
          
          <!-- Tareas -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Sistematización de Tareas</h3>
              <span class="text-2xl font-light ${getHealthColor(sysHealth.tasks.systematizationRate)}">
                ${sysHealth.tasks.systematizationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de tareas:</span>
                <span class="font-light">${sysHealth.tasks.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Sin proceso asignado:</span>
                <span class="font-light text-red-600">${sysHealth.tasks.withoutProcess}</span>
              </div>
              ${sysHealth.details.tasksWithoutProcess.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Tareas sin proceso:</div>
                ${sysHealth.details.tasksWithoutProcess.slice(0, 5).map(task => `
                  <div class="text-xs">• ${escapeHtml(task.name)}</div>
                `).join('')}
                ${sysHealth.details.tasksWithoutProcess.length > 5 ? `<div class="text-xs text-gray-500 mt-1">... y ${sysHealth.details.tasksWithoutProcess.length - 5} más</div>` : ''}
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Procesos -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Sistematización de Procesos</h3>
              <span class="text-2xl font-light ${getHealthColor(sysHealth.processes.systematizationRate)}">
                ${sysHealth.processes.systematizationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de procesos:</span>
                <span class="font-light">${sysHealth.processes.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Sin área asignada:</span>
                <span class="font-light text-red-600">${sysHealth.processes.withoutArea}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Sin tareas asignadas:</span>
                <span class="font-light text-red-600">${sysHealth.processes.withoutTasks}</span>
              </div>
              ${sysHealth.details.processesWithoutArea.length > 0 || sysHealth.details.processesWithoutTasks.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                ${sysHealth.details.processesWithoutArea.length > 0 ? `
                <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Procesos sin área:</div>
                ${sysHealth.details.processesWithoutArea.slice(0, 3).map(process => `
                  <div class="text-xs">• ${escapeHtml(process.name)}</div>
                `).join('')}
                ${sysHealth.details.processesWithoutArea.length > 3 ? `<div class="text-xs text-gray-500 mt-1">... y ${sysHealth.details.processesWithoutArea.length - 3} más</div>` : ''}
                ` : ''}
                ${sysHealth.details.processesWithoutTasks.length > 0 ? `
                <div class="text-xs uppercase tracking-wider text-gray-500 mb-1 mt-2">Procesos sin tareas:</div>
                ${sysHealth.details.processesWithoutTasks.slice(0, 3).map(process => `
                  <div class="text-xs">• ${escapeHtml(process.name)}</div>
                `).join('')}
                ${sysHealth.details.processesWithoutTasks.length > 3 ? `<div class="text-xs text-gray-500 mt-1">... y ${sysHealth.details.processesWithoutTasks.length - 3} más</div>` : ''}
                ` : ''}
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Áreas -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-light">Sistematización de Áreas</h3>
              <span class="text-2xl font-light ${getHealthColor(sysHealth.areas.systematizationRate)}">
                ${sysHealth.areas.systematizationRate}%
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total de áreas:</span>
                <span class="font-light">${sysHealth.areas.total}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Sin procesos asignados:</span>
                <span class="font-light text-red-600">${sysHealth.areas.withoutProcesses}</span>
              </div>
              ${sysHealth.details.areasWithoutProcesses.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Áreas sin procesos:</div>
                ${sysHealth.details.areasWithoutProcesses.slice(0, 3).map(area => `
                  <div class="text-xs">• ${escapeHtml(area.name)}</div>
                `).join('')}
                ${sysHealth.details.areasWithoutProcesses.length > 3 ? `<div class="text-xs text-gray-500 mt-1">... y ${sysHealth.details.areasWithoutProcesses.length - 3} más</div>` : ''}
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar indicadores: ' + error.message);
  }
}
