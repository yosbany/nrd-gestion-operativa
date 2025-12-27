// Organigrama management

// Load and display organigrama
async function loadOrganigrama() {
  const content = document.getElementById('organigrama-content');
  if (!content) return;

  showSpinner('Cargando organigrama...');
  try {
    // Load all data
    const [areasSnapshot, rolesSnapshot, employeesSnapshot, processesSnapshot] = await Promise.all([
      getAreasRef().once('value'),
      getRolesRef().once('value'),
      getEmployeesRef().once('value'),
      getProcessesRef().once('value')
    ]);

    const areas = areasSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};
    const employees = employeesSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};

    // Build structure: Area -> Roles -> Employees
    const organigramaStructure = {};

    // Initialize structure with all areas
    Object.entries(areas).forEach(([areaId, area]) => {
      organigramaStructure[areaId] = {
        area: area,
        roles: {}
      };
    });

    // Get tasks to find roles by process/area
    const tasksSnapshot = await getTasksRef().once('value');
    const tasks = tasksSnapshot.val() || {};

    // Map roles to areas through processes and tasks
    Object.entries(tasks).forEach(([taskId, task]) => {
      if (task.processId) {
        const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
        
        if (taskRoleIds.length > 0) {
          const process = processes[task.processId];
          if (process && process.areaId) {
            const areaId = process.areaId;
            if (!organigramaStructure[areaId]) {
              organigramaStructure[areaId] = {
                area: areas[areaId] || { name: 'Área desconocida' },
                roles: {}
              };
            }
            
            taskRoleIds.forEach(roleId => {
              if (!organigramaStructure[areaId].roles[roleId]) {
                organigramaStructure[areaId].roles[roleId] = {
                  role: roles[roleId] || { name: 'Rol desconocido' },
                  employees: []
                };
              }
            });
          }
        }
      }
    });

    // Map employees to roles in each area
    Object.entries(employees).forEach(([employeeId, employee]) => {
      const employeeRoleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
      
      if (employeeRoleIds.length > 0) {
        // For each role the employee has, find which areas use that role
        employeeRoleIds.forEach(roleId => {
          Object.keys(organigramaStructure).forEach(areaId => {
            if (organigramaStructure[areaId].roles[roleId]) {
              const existingEmployee = organigramaStructure[areaId].roles[roleId].employees.find(emp => emp.id === employeeId);
              if (!existingEmployee) {
                organigramaStructure[areaId].roles[roleId].employees.push({
                  id: employeeId,
                  ...employee
                });
              }
            }
          });
        });
      }
    });

    // Generate HTML
    let organigramaHTML = '<div class="space-y-6">';
    
    // Sort areas by name
    const sortedAreas = Object.entries(organigramaStructure).sort((a, b) => {
      const nameA = a[1].area.name || '';
      const nameB = b[1].area.name || '';
      return nameA.localeCompare(nameB);
    });

    if (sortedAreas.length === 0) {
      organigramaHTML += '<p class="text-center text-gray-600 py-8 text-sm sm:text-base">No hay áreas registradas</p>';
    } else {
      sortedAreas.forEach(([areaId, areaData]) => {
        const area = areaData.area;
        const rolesData = areaData.roles;
        
        // Sort roles by name
        const sortedRoles = Object.entries(rolesData).sort((a, b) => {
          const nameA = a[1].role.name || '';
          const nameB = b[1].role.name || '';
          return nameA.localeCompare(nameB);
        });

        organigramaHTML += `
          <div class="border-2 border-gray-300 p-4 sm:p-6">
            <h4 class="text-base sm:text-lg font-light mb-4 pb-2 border-b border-gray-200">
              ${escapeHtml(area.name || 'Área sin nombre')}
            </h4>
            ${area.description ? `
              <p class="text-sm text-gray-600 mb-4 font-light">${escapeHtml(area.description)}</p>
            ` : ''}
            ${sortedRoles.length === 0 ? `
              <p class="text-sm text-gray-500 italic">No hay roles asignados a esta área</p>
            ` : `
              <div class="space-y-4">
                ${sortedRoles.map(([roleId, roleData]) => {
                  const role = roleData.role;
                  const roleEmployees = roleData.employees.sort((a, b) => {
                    const nameA = a.name || '';
                    const nameB = b.name || '';
                    return nameA.localeCompare(nameB);
                  });
                  
                  return `
                    <div class="border border-gray-200 p-3 sm:p-4 bg-gray-50">
                      <h5 class="text-sm sm:text-base font-medium mb-3 pb-2 border-b border-gray-300">
                        ${escapeHtml(role.name || 'Rol sin nombre')}
                      </h5>
                      ${role.description ? `
                        <p class="text-xs text-gray-600 mb-3 font-light">${escapeHtml(role.description)}</p>
                      ` : ''}
                      ${roleEmployees.length === 0 ? `
                        <p class="text-xs text-gray-500 italic">No hay empleados asignados a este rol</p>
                      ` : `
                        <div class="space-y-2">
                          <p class="text-xs uppercase tracking-wider text-gray-600 mb-2">Empleados:</p>
                          <ul class="space-y-1">
                            ${roleEmployees.map(employee => `
                              <li class="text-xs sm:text-sm font-light pl-4 border-l-2 border-gray-300">
                                ${escapeHtml(employee.name || 'Empleado sin nombre')}
                                ${employee.email ? `<span class="text-gray-500 text-xs"> - ${escapeHtml(employee.email)}</span>` : ''}
                              </li>
                            `).join('')}
                          </ul>
                        </div>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        `;
      });
    }

    organigramaHTML += '</div>';
    content.innerHTML = organigramaHTML;
    hideSpinner();
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar organigrama: ' + error.message);
    content.innerHTML = '<p class="text-center text-red-600 py-8">Error al cargar el organigrama</p>';
  }
}
