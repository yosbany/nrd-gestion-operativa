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
    let [areas, roles, employees, processes] = await Promise.all([
      nrd.areas.getAll(),
      nrd.roles.getAll(),
      nrd.employees.getAll(),
      nrd.processes.getAll()
    ]);

    // Convert arrays to objects with IDs as keys if needed
    const convertToObject = (data, name) => {
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
    
    areas = convertToObject(areas, 'areas');
    roles = convertToObject(roles, 'roles');
    employees = convertToObject(employees, 'employees');
    processes = convertToObject(processes, 'processes');

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
    let tasks = await nrd.tasks.getAll();
    tasks = Array.isArray(tasks) ? (() => {
      const obj = {};
      tasks.forEach((item, index) => {
        const id = item.id || item.key || item.$id || index.toString();
        obj[id] = item;
      });
      return obj;
    })() : (tasks || {});

    // Map roles to areas through processes and tasks
    // First, map through processes' activities (new structure)
    Object.entries(processes).forEach(([processId, process]) => {
      if (process.areaId && process.activities && Array.isArray(process.activities)) {
        process.activities.forEach(activity => {
          const task = tasks[activity.taskId];
          if (task) {
            const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
            if (taskRoleIds.length > 0) {
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
        });
      }
    });
    
    // Also support backward compatibility: tasks with processId/processIds
    Object.entries(tasks).forEach(([taskId, task]) => {
      const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
      
      if (taskRoleIds.length > 0) {
        // Get all process IDs for this task (support both singular and plural)
        const taskProcessIds = task.processIds || (task.processId ? [task.processId] : []);
        
        taskProcessIds.forEach(processId => {
          const process = processes[processId];
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
        });
      }
    });

    // Track which roles have employees assigned
    const rolesWithEmployees = new Set();
    Object.entries(employees).forEach(([employeeId, employee]) => {
      const employeeRoleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
      employeeRoleIds.forEach(roleId => {
        rolesWithEmployees.add(roleId);
      });
    });

    // For roles that have employees but are not yet in any area,
    // deduce the area by finding processes where employees with that role are assigned to tasks
    const rolesNotInOrganigrama = new Set();
    rolesWithEmployees.forEach(roleId => {
      let roleInAnyArea = false;
      Object.keys(organigramaStructure).forEach(areaId => {
        if (organigramaStructure[areaId].roles[roleId]) {
          roleInAnyArea = true;
        }
      });
      if (!roleInAnyArea && roles[roleId]) {
        rolesNotInOrganigrama.add(roleId);
      }
    });

    // Deduce area for unmapped roles by finding processes where employees with that role work
    rolesNotInOrganigrama.forEach(roleId => {
      // Find employees with this role
      const employeesWithRole = Object.entries(employees).filter(([employeeId, employee]) => {
        const employeeRoleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
        return employeeRoleIds.includes(roleId);
      }).map(([employeeId]) => employeeId);

      // Find areas where these employees work (through assigned tasks in processes)
      const areasForRole = new Set();
      employeesWithRole.forEach(employeeId => {
        // First, find through processes' activities (new structure)
        Object.entries(processes).forEach(([processId, process]) => {
          if (process.activities && Array.isArray(process.activities)) {
            process.activities.forEach(activity => {
              const task = tasks[activity.taskId];
              if (task && task.assignedEmployeeId === employeeId && process.areaId) {
                areasForRole.add(process.areaId);
              }
            });
          }
        });
        
        // Also support backward compatibility: tasks with processId/processIds
        Object.entries(tasks).forEach(([taskId, task]) => {
          if (task.assignedEmployeeId === employeeId) {
            const taskProcessIds = task.processIds || (task.processId ? [task.processId] : []);
            taskProcessIds.forEach(processId => {
              const process = processes[processId];
              if (process && process.areaId) {
                areasForRole.add(process.areaId);
              }
            });
          }
        });
      });

      // Add role to the deduced areas
      areasForRole.forEach(areaId => {
        if (!organigramaStructure[areaId]) {
          organigramaStructure[areaId] = {
            area: areas[areaId] || { name: 'Área desconocida' },
            roles: {}
          };
        }
        if (!organigramaStructure[areaId].roles[roleId]) {
          organigramaStructure[areaId].roles[roleId] = {
            role: roles[roleId] || { name: 'Rol desconocido' },
            employees: []
          };
        }
      });
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

    // Generate HTML with hierarchical chart design
    let organigramaHTML = `
      <div class="organigrama-container">
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
      // Generate organigrama for each area separately for better visual hierarchy
      sortedAreas.forEach(([areaId, areaData]) => {
        const area = areaData.area;
        const rolesData = areaData.roles;
        
        // Sort roles by name
        const sortedRoles = Object.entries(rolesData).sort((a, b) => {
          const nameA = a[1].role.name || '';
          const nameB = b[1].role.name || '';
          return nameA.localeCompare(nameB);
        });

        // Get manager name if exists
        let managerName = '';
        if (area.managerEmployeeId && employees[area.managerEmployeeId]) {
          managerName = employees[area.managerEmployeeId].name;
        }
        
        organigramaHTML += `
          <div class="organigrama-area-section mb-8">
            <!-- Level 1: Area (Top level - Red like the app theme) -->
            <div class="flex justify-center mb-6">
              <div class="organigrama-box-area">
                <div class="bg-red-600 text-white px-8 py-4 rounded-lg shadow-lg min-w-[250px] text-center">
                  <div class="font-medium text-base sm:text-lg">${escapeHtml(area.name || 'Área sin nombre')}</div>
                  ${area.description ? `<div class="text-red-100 text-xs mt-1 font-light">${escapeHtml(area.description)}</div>` : ''}
                  ${managerName ? `<div class="text-red-100 text-xs mt-2 font-light border-t border-red-500 pt-2">Encargado: ${escapeHtml(managerName)}</div>` : ''}
                </div>
              </div>
            </div>
        `;

        if (sortedRoles.length > 0) {
          // Level 2: Roles (Medium level - Dark blue)
          organigramaHTML += `
            <div class="organigrama-level-2 flex flex-wrap justify-center gap-4 mb-4">
              ${sortedRoles.map(([roleId, roleData]) => {
                const role = roleData.role;
                const roleEmployees = roleData.employees.sort((a, b) => {
                  const nameA = a.name || '';
                  const nameB = b.name || '';
                  return nameA.localeCompare(nameB);
                });
                
                return `
                  <div class="organigrama-box-role flex flex-col items-center">
                    <!-- Role Box -->
                    <div class="bg-blue-700 text-white px-5 py-3 rounded-lg shadow-md min-w-[200px] text-center mb-3">
                      <div class="font-medium text-sm">${escapeHtml(role.name || 'Rol sin nombre')}</div>
                      ${role.description ? `<div class="text-blue-200 text-xs mt-1 font-light">${escapeHtml(role.description)}</div>` : ''}
                    </div>
                    ${roleEmployees.length > 0 || editMode ? `
                      <!-- Level 3: Employees (Light blue) -->
                      <div class="organigrama-level-3 flex flex-wrap justify-center gap-2">
                        ${editMode ? `
                          ${Object.entries(employees).map(([empId, employee]) => {
                            const employeeRoleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
                            const hasRole = employeeRoleIds.includes(roleId);
                            return `
                              <div class="organigrama-box-employee" data-employee-id="${empId}" data-role-id="${roleId}">
                                <label class="cursor-pointer block">
                                  <input type="checkbox" 
                                    class="employee-role-checkbox hidden"
                                    data-employee-id="${empId}"
                                    data-role-id="${roleId}"
                                    ${hasRole ? 'checked' : ''}>
                                  <div class="${hasRole ? 'bg-blue-300 text-blue-900 border-blue-500' : 'bg-blue-100 text-blue-700 border-blue-300'} px-3 py-2 rounded-lg shadow-sm text-center border-2 hover:border-blue-400 transition-all">
                                    <div class="font-light text-xs">${escapeHtml(employee.name || 'Empleado sin nombre')}</div>
                                    ${employee.email ? `<div class="text-xs mt-1 opacity-75 truncate max-w-[140px]">${escapeHtml(employee.email)}</div>` : ''}
                                  </div>
                                </label>
                              </div>
                            `;
                          }).join('')}
                        ` : `
                          ${roleEmployees.map(employee => `
                            <div class="organigrama-box-employee">
                              <div class="bg-blue-200 text-blue-900 px-3 py-2 rounded-lg shadow-sm min-w-[140px] text-center">
                                <div class="font-light text-xs">${escapeHtml(employee.name || 'Empleado sin nombre')}</div>
                                ${employee.email ? `<div class="text-blue-700 text-[10px] mt-1 truncate max-w-[140px]">${escapeHtml(employee.email)}</div>` : ''}
                              </div>
                            </div>
                          `).join('')}
                        `}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        } else {
          organigramaHTML += `
            <div class="text-center text-gray-500 text-sm italic py-4">
              No hay roles asignados a esta área
            </div>
          `;
        }
        
        organigramaHTML += `</div>`;
      });
    }

    organigramaHTML += '</div>';
    
    // Add CSS styles for the organigrama
    if (!document.getElementById('organigrama-styles')) {
      const style = document.createElement('style');
      style.id = 'organigrama-styles';
      style.textContent = `
        .organigrama-container {
          font-family: inherit;
          padding: 1rem;
        }
        .organigrama-area-section {
          margin-bottom: 3rem;
        }
        .organigrama-box-area {
          position: relative;
        }
        .organigrama-box-role {
          position: relative;
          margin-bottom: 1rem;
        }
        .organigrama-box-employee {
          position: relative;
        }
        .organigrama-level-2 {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .organigrama-level-3 {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
        }
        @media (max-width: 640px) {
          .organigrama-level-2 {
            flex-direction: column;
            align-items: center;
            gap: 2rem;
          }
          .organigrama-level-3 {
            width: 100%;
          }
          .organigrama-box-area > div,
          .organigrama-box-role > div:first-child {
            min-width: 100%;
          }
        }
      `;
      document.head.appendChild(style);
    }
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
      const cancelBtn = document.getElementById('cancel-organigrama-edit-btn');
      const saveBtn = document.getElementById('save-organigrama-btn');
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          loadOrganigrama(false);
        });
      }
      
      if (saveBtn) {
        saveBtn.addEventListener('click', saveOrganigramaChanges);
      }
      
      // Update visual state of checkboxes
      document.querySelectorAll('.employee-role-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          const employeeBox = this.closest('.organigrama-employee');
          if (this.checked) {
            employeeBox.classList.add('selected');
            const boxDiv = employeeBox.querySelector('div');
            boxDiv.classList.remove('bg-blue-100', 'text-blue-700', 'border-transparent');
            boxDiv.classList.add('bg-blue-300', 'text-blue-900', 'border-blue-500');
          } else {
            employeeBox.classList.remove('selected');
            const boxDiv = employeeBox.querySelector('div');
            boxDiv.classList.remove('bg-blue-300', 'text-blue-900', 'border-blue-500');
            boxDiv.classList.add('bg-blue-100', 'text-blue-700', 'border-transparent');
          }
        });
      });
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
      
      return nrd.employees.update(employeeId, {
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
