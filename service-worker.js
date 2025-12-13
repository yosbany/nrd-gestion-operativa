// Service Worker for PWA offline support

const CACHE_NAME = 'nrd-pedidos-v1';
// Get base path from service worker location
const getBasePath = () => {
  const path = self.location.pathname;
  return path.substring(0, path.lastIndexOf('/') + 1);
};
const BASE_PATH = getBasePath();
const urlsToCache = [
  BASE_PATH + 'index.html',
  BASE_PATH + 'styles.css',
  BASE_PATH + 'app.js',
  BASE_PATH + 'firebase.js',
  BASE_PATH + 'auth.js',
  BASE_PATH + 'db.js',
  BASE_PATH + 'clients.js',
  BASE_PATH + 'products.js',
  BASE_PATH + 'orders.js',
  BASE_PATH + 'manifest.json',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both fail, return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(BASE_PATH + 'index.html');
        }
      })
  );
});

