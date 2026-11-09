// Service worker minimale: serve a rendere l'app installabile.
// Non fa cache: tutte le richieste vanno in rete come prima.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
