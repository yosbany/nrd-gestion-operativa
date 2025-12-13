// Main app controller

// Navigation
function switchView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
  });

  // Show selected view
  document.getElementById(`${viewName}-view`).classList.remove('hidden');

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

  // Load data for the view
  if (viewName === 'orders') {
    loadOrders();
    document.getElementById('orders-list').style.display = 'block';
    document.getElementById('order-detail').classList.add('hidden');
    document.getElementById('new-order-form').classList.add('hidden');
  } else if (viewName === 'clients') {
    loadClients();
    hideClientForm();
  } else if (viewName === 'products') {
    loadProducts();
    hideProductForm();
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
    // Default to orders view
    switchView('orders');
  }
});

