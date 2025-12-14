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
    btn.classList.remove('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
    btn.classList.add('border-transparent', 'text-gray-600');
  });
  const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-gray-600');
    activeBtn.classList.add('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
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
    const dateFilter = document.getElementById('date-filter-container');
    if (dateFilter) {
      dateFilter.style.display = 'flex';
    }
  } else if (viewName === 'clients') {
    loadClients();
    hideClientForm();
    const clientDetail = document.getElementById('client-detail');
    if (clientDetail) clientDetail.classList.add('hidden');
  } else if (viewName === 'products') {
    loadProducts();
    hideProductForm();
    const productDetail = document.getElementById('product-detail');
    if (productDetail) productDetail.classList.add('hidden');
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

