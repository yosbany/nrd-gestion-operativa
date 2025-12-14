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
  const views = ['orders', 'clients', 'products'];
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
    btn.classList.remove('border-red-600', 'text-red-600');
    btn.classList.add('border-transparent', 'text-gray-600');
  });
  const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-gray-600');
    activeBtn.classList.add('border-red-600', 'text-red-600');
  }

  // Load data for the view
  if (viewName === 'orders') {
    loadOrders();
    const ordersList = document.getElementById('orders-list');
    if (ordersList) {
      ordersList.style.display = 'block';
    }
    const orderDetail = document.getElementById('order-detail');
    if (orderDetail) {
      orderDetail.classList.add('hidden');
    }
    const newOrderForm = document.getElementById('new-order-form');
    if (newOrderForm) {
      newOrderForm.classList.add('hidden');
    }
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

