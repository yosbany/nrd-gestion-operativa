// Database helper functions using NRD Data Access Library

// Initialize NRD Data Access Library
// Esta librería maneja la inicialización de Firebase y el acceso a datos para todas las entidades
const nrd = new NRDDataAccess();

// Store active listeners for proper cleanup
// Map: callback -> unsubscribe function
const activeListeners = new Map();

// Helper function to create Firebase-compatible reference wrapper
function createRefWrapper(service, path) {
  const wrapper = {
    on: function(event, callback) {
      if (event === 'value') {
        // Store unsubscribe function associated with this callback
        const unsubscribe = service.onValue((data) => {
          // Convert data format to Firebase snapshot format
          // NRD Data Access returns an object with IDs as keys
          const snapshot = {
            val: () => data || {}
          };
          callback(snapshot);
        });
        
        // Store the unsubscribe function with the callback as key
        activeListeners.set(callback, unsubscribe);
        
        // Return the callback (Firebase pattern: off uses the return value of on)
        return callback;
      }
    },
    off: function(event, callback) {
      if (event === 'value' && callback) {
        // Find and call the unsubscribe function for this callback
        const unsubscribe = activeListeners.get(callback);
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
          activeListeners.delete(callback);
        }
      }
    },
    once: function(event) {
      if (event === 'value') {
        return service.getAll().then(data => {
          return {
            val: () => data || {}
          };
        });
      }
      return Promise.resolve({ val: () => null });
    },
    push: function(data) {
      return service.create(data).then(id => {
        return {
          key: id,
          then: function(callback) {
            if (callback) callback(this);
            return Promise.resolve(this);
          }
        };
      });
    },
    child: function(childPath) {
      // For child operations, we need the ID
      const childId = childPath;
      return {
        once: function(event) {
          if (event === 'value') {
            return service.getById(childId).then(item => {
              return {
                val: () => item || null
              };
            });
          }
          return Promise.resolve({ val: () => null });
        },
        update: function(data) {
          return service.update(childId, data);
        },
        remove: function() {
          return service.delete(childId);
        },
        set: function(data) {
          return service.update(childId, data);
        }
      };
    }
  };
}

// ========== OPERATIONAL SYSTEM DATABASE FUNCTIONS ==========

// Areas
function getAreasRef() {
  return createRefWrapper(nrd.areas, 'areas');
}

function getArea(areaId) {
  return nrd.areas.getById(areaId).then(area => {
    return {
      val: () => area || null
    };
  });
}

function createArea(areaData) {
  return nrd.areas.create(areaData).then(id => {
    return {
      key: id,
      then: function(callback) {
        if (callback) callback(this);
        return Promise.resolve(this);
      }
    };
  });
}

function updateArea(areaId, areaData) {
  return nrd.areas.update(areaId, areaData);
}

function deleteArea(areaId) {
  return nrd.areas.delete(areaId);
}

// Processes
function getProcessesRef() {
  return createRefWrapper(nrd.processes, 'processes');
}

function getProcess(processId) {
  return nrd.processes.getById(processId).then(process => {
    return {
      val: () => process || null
    };
  });
}

function createProcess(processData) {
  return nrd.processes.create(processData).then(id => {
    return {
      key: id,
      then: function(callback) {
        if (callback) callback(this);
        return Promise.resolve(this);
      }
    };
  });
}

function updateProcess(processId, processData) {
  return nrd.processes.update(processId, processData);
}

function deleteProcess(processId) {
  return nrd.processes.delete(processId);
}

// Tasks
function getTasksRef() {
  return createRefWrapper(nrd.tasks, 'tasks');
}

function getTask(taskId) {
  return nrd.tasks.getById(taskId).then(task => {
    return {
      val: () => task || null
    };
  });
}

function createTask(taskData) {
  return nrd.tasks.create(taskData).then(id => {
    return {
      key: id,
      then: function(callback) {
        if (callback) callback(this);
        return Promise.resolve(this);
      }
    };
  });
}

function updateTask(taskId, taskData) {
  return nrd.tasks.update(taskId, taskData);
}

function deleteTask(taskId) {
  return nrd.tasks.delete(taskId);
}

// Roles
function getRolesRef() {
  return createRefWrapper(nrd.roles, 'roles');
}

function getRole(roleId) {
  return nrd.roles.getById(roleId).then(role => {
    return {
      val: () => role || null
    };
  });
}

function createRole(roleData) {
  return nrd.roles.create(roleData).then(id => {
    return {
      key: id,
      then: function(callback) {
        if (callback) callback(this);
        return Promise.resolve(this);
      }
    };
  });
}

function updateRole(roleId, roleData) {
  return nrd.roles.update(roleId, roleData);
}

function deleteRole(roleId) {
  return nrd.roles.delete(roleId);
}

// Employees
function getEmployeesRef() {
  return createRefWrapper(nrd.employees, 'employees');
}

function getEmployee(employeeId) {
  return nrd.employees.getById(employeeId).then(employee => {
    return {
      val: () => employee || null
    };
  });
}

function createEmployee(employeeData) {
  return nrd.employees.create(employeeData).then(id => {
    return {
      key: id,
      then: function(callback) {
        if (callback) callback(this);
        return Promise.resolve(this);
      }
    };
  });
}

function updateEmployee(employeeId, employeeData) {
  return nrd.employees.update(employeeId, employeeData);
}

function deleteEmployee(employeeId) {
  return nrd.employees.delete(employeeId);
}

// Company Information
function getCompanyInfoRef() {
  // CompanyInfo is a special service in NRD Data Access
  return {
    once: function(event) {
      if (event === 'value') {
        return nrd.companyInfo.get().then(info => {
          return {
            val: () => info || {}
          };
        });
      }
      return Promise.resolve({ val: () => {} });
    },
    set: function(data) {
      return nrd.companyInfo.set(data);
    }
  };
}

function getCompanyInfo() {
  return nrd.companyInfo.get().then(info => {
    return {
      val: () => info || {}
    };
  });
}

function updateCompanyInfo(companyData) {
  return nrd.companyInfo.set(companyData);
}

// Contracts and Permits
function getContractsRef() {
  return createRefWrapper(nrd.contracts, 'contracts');
}

function getContract(contractId) {
  return nrd.contracts.getById(contractId).then(contract => {
    return {
      val: () => contract || null
    };
  });
}

function createContract(contractData) {
  return nrd.contracts.create(contractData).then(id => {
    return {
      key: id,
      then: function(callback) {
        if (callback) callback(this);
        return Promise.resolve(this);
      }
    };
  });
}

function updateContract(contractId, contractData) {
  return nrd.contracts.update(contractId, contractData);
}

function deleteContract(contractId) {
  return nrd.contracts.delete(contractId);
}
