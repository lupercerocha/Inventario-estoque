/* Cultivve Inventário — service worker (funciona offline) */
const CACHE = 'cvinv-v3.6.3';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/apple-touch-icon.png', './favicon.ico', './icons/favicon-32.png'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdn.jsdelivr.net/npm/barcode-detector@3.2.3/dist/iife/ponyfill.js',
  'https://fastly.jsdelivr.net/npm/zxing-wasm@3.1.6/dist/reader/zxing_reader.wasm',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // dados do Firestore nunca passam pelo cache
  if (url.hostname.endsWith('googleapis.com') && !url.hostname.startsWith('fonts')) return;
  const isApp = url.origin === location.origin;
  const isLib = LIBS.includes(req.url) || url.hostname.startsWith('fonts.');
  if (!isApp && !isLib) return;
  if (isApp && (req.mode === 'navigate' || url.pathname.endsWith('.html'))) {
    // página: rede primeiro (pega atualização), cache se offline
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => (hit && !(req.mode === 'cors' && hit.type === 'opaque')) ? hit : fetch(req).then(r => {
    if (r.ok || (r.type === 'opaque' && req.mode !== 'cors')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
