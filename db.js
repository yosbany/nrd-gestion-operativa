// Database helper functions

// Get user reference
function getUserRef() {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return database.ref(`users/${user.uid}`);
}

// ========== OPERATIONAL SYSTEM DATABASE FUNCTIONS ==========

// Areas
function getAreasRef() {
  return database.ref('areas');
}

function getArea(areaId) {
  return getAreasRef().child(areaId).once('value');
}

function createArea(areaData) {
  return getAreasRef().push(areaData);
}

function updateArea(areaId, areaData) {
  return getAreasRef().child(areaId).update(areaData);
}

function deleteArea(areaId) {
  return getAreasRef().child(areaId).remove();
}

// Processes
function getProcessesRef() {
  return database.ref('processes');
}

function getProcess(processId) {
  return getProcessesRef().child(processId).once('value');
}

function createProcess(processData) {
  return getProcessesRef().push(processData);
}

function updateProcess(processId, processData) {
  return getProcessesRef().child(processId).update(processData);
}

function deleteProcess(processId) {
  return getProcessesRef().child(processId).remove();
}

// Tasks
function getTasksRef() {
  return database.ref('tasks');
}

function getTask(taskId) {
  return getTasksRef().child(taskId).once('value');
}

function createTask(taskData) {
  return getTasksRef().push(taskData);
}

function updateTask(taskId, taskData) {
  return getTasksRef().child(taskId).update(taskData);
}

function deleteTask(taskId) {
  return getTasksRef().child(taskId).remove();
}

// Roles
function getRolesRef() {
  return database.ref('roles');
}

function getRole(roleId) {
  return getRolesRef().child(roleId).once('value');
}

function createRole(roleData) {
  return getRolesRef().push(roleData);
}

function updateRole(roleId, roleData) {
  return getRolesRef().child(roleId).update(roleData);
}

function deleteRole(roleId) {
  return getRolesRef().child(roleId).remove();
}

// Employees
function getEmployeesRef() {
  return database.ref('employees');
}

function getEmployee(employeeId) {
  return getEmployeesRef().child(employeeId).once('value');
}

function createEmployee(employeeData) {
  return getEmployeesRef().push(employeeData);
}

function updateEmployee(employeeId, employeeData) {
  return getEmployeesRef().child(employeeId).update(employeeData);
}

function deleteEmployee(employeeId) {
  return getEmployeesRef().child(employeeId).remove();
}

// Task Executions
function getTaskExecutionsRef() {
  return database.ref('taskExecutions');
}

function getTaskExecution(executionId) {
  return getTaskExecutionsRef().child(executionId).once('value');
}

function createTaskExecution(executionData) {
  return getTaskExecutionsRef().push(executionData);
}

function updateTaskExecution(executionId, executionData) {
  return getTaskExecutionsRef().child(executionId).update(executionData);
}

function deleteTaskExecution(executionId) {
  return getTaskExecutionsRef().child(executionId).remove();
}

// Company Information
function getCompanyInfoRef() {
  return database.ref('companyInfo');
}

function getCompanyInfo() {
  return getCompanyInfoRef().once('value');
}

function updateCompanyInfo(companyData) {
  return getCompanyInfoRef().set(companyData);
}

// Incidents
function getIncidentsRef() {
  return database.ref('incidents');
}

function getIncident(incidentId) {
  return getIncidentsRef().child(incidentId).once('value');
}

function createIncident(incidentData) {
  return getIncidentsRef().push(incidentData);
}

function updateIncident(incidentId, incidentData) {
  return getIncidentsRef().child(incidentId).update(incidentData);
}

function deleteIncident(incidentId) {
  return getIncidentsRef().child(incidentId).remove();
}

