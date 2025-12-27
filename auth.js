// Authentication state management
let currentUser = null;

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  try {
    currentUser = user;
    if (user) {
      showAppScreen();
    } else {
      showLoginScreen();
      // Hide initialize button when logged out
      const initializeBtn = document.getElementById('initialize-btn');
      if (initializeBtn) initializeBtn.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error in auth state change:', error);
    // Fallback: show login screen
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appScreen) appScreen.classList.add('hidden');
  }
});

// Show login screen
function showLoginScreen() {
  try {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appScreen) appScreen.classList.add('hidden');
  } catch (error) {
    console.error('Error showing login screen:', error);
  }
}

// Show app screen
function showAppScreen() {
  try {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.remove('hidden');
    
    // Show/hide initialize button based on user email
    checkInitializeButtonVisibility();
  } catch (error) {
    console.error('Error showing app screen:', error);
  }
}

// Check if initialize button should be visible
function checkInitializeButtonVisibility() {
  try {
    const initializeBtn = document.getElementById('initialize-btn');
    if (!initializeBtn) return;
    
    if (currentUser && currentUser.email === 'yosbany@nrd.com') {
      initializeBtn.classList.remove('hidden');
    } else {
      initializeBtn.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking initialize button visibility:', error);
  }
}

// Login form handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById('login-email')?.value;
      const password = document.getElementById('login-password')?.value;
      const errorDiv = document.getElementById('login-error');

      if (!email || !password) {
        if (errorDiv) errorDiv.textContent = 'Por favor complete todos los campos';
        return;
      }

      if (errorDiv) errorDiv.textContent = '';
      showSpinner('Iniciando sesión...');

      await auth.signInWithEmailAndPassword(email, password);
      hideSpinner();
    } catch (error) {
      hideSpinner();
      const errorDiv = document.getElementById('login-error');
      if (errorDiv) {
        errorDiv.textContent = error.message || 'Error al iniciar sesión';
      }
      console.error('Login error:', error);
    }
  });
}

// Logout handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      showSpinner('Cerrando sesión...');
      await auth.signOut();
      hideSpinner();
    } catch (error) {
      hideSpinner();
      console.error('Error al cerrar sesión:', error);
    }
  });
}


// Get current user
function getCurrentUser() {
  return currentUser;
}

