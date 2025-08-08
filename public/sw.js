
// Minimal service worker for PWA install (no caching strategy in MVP)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
