// Organigrama management

let organigramaEditMode = false;
let organigramaData = null;

// Load and display organigrama
async function loadOrganigrama(editMode = false) {
  const content = document.getElementById('organigrama-content');
  if (!content) return;

  organigramaEditMode = editMode;
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

    // Store data for editing
    organigramaData = {
      areas,
      roles,
      employees,
      structure: organigramaStructure
    };

    // Generate HTML
    let organigramaHTML = `
      <div class="mb-4 flex justify-end">
        <button id="toggle-organigrama-edit-btn" class="px-4 sm:px-6 py-2 ${editMode ? 'bg-gray-600 text-white border border-gray-600 hover:bg-gray-700' : 'border border-gray-300 hover:border-gray-400'} transition-colors uppercase tracking-wider text-xs sm:text-sm font-light">
          ${editMode ? 'Cancelar Edición' : 'Editar Organigrama'}
        </button>
      </div>
      <div class="space-y-6">
    `;
    
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
                      ${editMode ? `
                        <div class="space-y-2">
                          <label class="block text-xs uppercase tracking-wider text-gray-600 mb-2">Empleados con este rol:</label>
                          <div class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 p-3 bg-white rounded">
                            ${Object.entries(employees).map(([empId, employee]) => {
                              const employeeRoleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
                              const hasRole = employeeRoleIds.includes(roleId);
                              return `
                                <label class="flex items-center gap-2 cursor-pointer py-1">
                                  <input type="checkbox" 
                                    class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 employee-role-checkbox"
                                    data-employee-id="${empId}"
                                    data-role-id="${roleId}"
                                    ${hasRole ? 'checked' : ''}>
                                  <span class="text-xs sm:text-sm font-light">
                                    ${escapeHtml(employee.name || 'Empleado sin nombre')}
                                    ${employee.email ? `<span class="text-gray-500 text-xs"> - ${escapeHtml(employee.email)}</span>` : ''}
                                  </span>
                                </label>
                              `;
                            }).join('')}
                          </div>
                        </div>
                      ` : roleEmployees.length === 0 ? `
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
    if (editMode) {
      organigramaHTML += `
        <div class="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-4">
          <button id="cancel-organigrama-edit-btn" class="px-4 sm:px-6 py-2 border border-gray-300 hover:border-gray-400 transition-colors uppercase tracking-wider text-xs sm:text-sm font-light">
            Cancelar
          </button>
          <button id="save-organigrama-btn" class="px-4 sm:px-6 py-2 bg-green-600 text-white border border-green-600 hover:bg-green-700 transition-colors uppercase tracking-wider text-xs sm:text-sm font-light">
            Guardar Cambios
          </button>
        </div>
      `;
    }
    content.innerHTML = organigramaHTML;
    
    // Attach event listeners
    if (editMode) {
      const toggleBtn = document.getElementById('toggle-organigrama-edit-btn');
      const cancelBtn = document.getElementById('cancel-organigrama-edit-btn');
      const saveBtn = document.getElementById('save-organigrama-btn');
      
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          loadOrganigrama(false);
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          loadOrganigrama(false);
        });
      }
      
      if (saveBtn) {
        saveBtn.addEventListener('click', saveOrganigramaChanges);
      }
    } else {
      const toggleBtn = document.getElementById('toggle-organigrama-edit-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          loadOrganigrama(true);
        });
      }
    }
    
    hideSpinner();
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar organigrama: ' + error.message);
    content.innerHTML = '<p class="text-center text-red-600 py-8">Error al cargar el organigrama</p>';
  }
}

// Save organigrama changes
async function saveOrganigramaChanges() {
  if (!organigramaData) return;

  showSpinner('Guardando cambios...');
  try {
    // Collect all roles that appear in the organigrama
    const organigramaRoleIds = new Set();
    Object.values(organigramaData.structure).forEach(areaData => {
      Object.keys(areaData.roles).forEach(roleId => {
        organigramaRoleIds.add(roleId);
      });
    });
    
    // Collect all checkbox states and group by employee
    const checkboxes = document.querySelectorAll('.employee-role-checkbox');
    const employeeRoleMap = {};
    
    // For each checkbox, add the role to the employee's role list if checked
    checkboxes.forEach(checkbox => {
      const employeeId = checkbox.dataset.employeeId;
      const roleId = checkbox.dataset.roleId;
      
      if (!employeeRoleMap[employeeId]) {
        employeeRoleMap[employeeId] = [];
      }
      
      if (checkbox.checked) {
        employeeRoleMap[employeeId].push(roleId);
      }
    });
    
    // Update all employees with their new roleIds
    // Preserve roles that are not in the organigrama
    const updatePromises = Object.entries(organigramaData.employees).map(([employeeId, employee]) => {
      const currentRoleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
      
      // Keep roles that are NOT in the organigrama
      const preservedRoleIds = currentRoleIds.filter(roleId => !organigramaRoleIds.has(roleId));
      
      // Add roles from organigrama that are checked
      const organigramaRoleIdsForEmployee = employeeRoleMap[employeeId] || [];
      
      // Combine preserved and new roles
      const newRoleIds = [...preservedRoleIds, ...organigramaRoleIdsForEmployee];
      
      return updateEmployee(employeeId, {
        roleIds: newRoleIds.length > 0 ? newRoleIds : null,
        roleId: null // Remove old field
      });
    });
    
    await Promise.all(updatePromises);
    
    hideSpinner();
    await showSuccess('Cambios guardados exitosamente');
    loadOrganigrama(false); // Reload in view mode
  } catch (error) {
    hideSpinner();
    await showError('Error al guardar cambios: ' + error.message);
  }
}
