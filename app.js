// Main app controller

// Navigation
let currentView = null;

function switchView(viewName) {
  // Prevent duplicate loading
  if (currentView === viewName) {
    return;
  }
  currentView = viewName;

  // Hide all views
  const views = ['areas', 'processes', 'tasks', 'roles', 'employees', 'inspections', 'analytics'];
  views.forEach(view => {
    const viewElement = document.getElementById(`${view}-view`);
    if (viewElement) {
      viewElement.classList.add('hidden');
    }
  });

  // Show selected view
  const selectedView = document.getElementById(`${viewName}-view`);
  if (selectedView) {
    selectedView.classList.remove('hidden');
  }

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
    btn.classList.add('border-transparent', 'text-gray-600');
  });
  const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-gray-600');
    activeBtn.classList.add('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
  }

  // Load data for the view
  if (viewName === 'areas') {
    loadAreas();
  } else if (viewName === 'processes') {
    loadProcesses();
  } else if (viewName === 'tasks') {
    loadTasks();
  } else if (viewName === 'roles') {
    loadRoles();
  } else if (viewName === 'employees') {
    loadEmployees();
  } else if (viewName === 'inspections') {
    loadInspections();
  } else if (viewName === 'analytics') {
    loadAnalytics();
  }
}

// Nav button handlers
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    switchView(view);
  });
});

// Initialize app
auth.onAuthStateChanged((user) => {
  if (user) {
    // Default to areas view
    switchView('areas');
  }
});

