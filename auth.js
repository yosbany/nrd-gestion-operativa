// Authentication state management
let currentUser = null;

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    showAppScreen();
  } else {
    showLoginScreen();
  }
});

// Show login screen
function showLoginScreen() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

// Show app screen
function showAppScreen() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
}

// Login form handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');

  errorDiv.textContent = '';

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    errorDiv.textContent = error.message || 'Error al iniciar sesión';
  }
});

// Logout handler
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
});

// Get current user
function getCurrentUser() {
  return currentUser;
}

