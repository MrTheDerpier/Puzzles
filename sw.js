const BASE = new URL('./', self.location.href);
const CACHE = 'pocket-puzzles-v2';
const ASSETS = [
  new URL('./', BASE).href,
  new URL('./index.html', BASE).href,
  new URL('./src/styles.css', BASE).href,
  new URL('./src/app.js', BASE).href,
  new URL('./manifest.webmanifest', BASE).href,
  new URL('./icons/icon-192.svg', BASE).href,
  new URL('./icons/icon-512.svg', BASE).href
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => { if (event.request.method === 'GET') event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))); });
