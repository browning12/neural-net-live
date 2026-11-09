// Neural Net Live service worker: network first for the page itself so the morning board always loads fresh, cached copy
// as the offline fallback. ESPN calls are never intercepted or cached.
const C = 'nn-live-v3';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.webmanifest'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { const w = ws.find(x => 'focus' in x); return w ? w.focus() : clients.openWindow('./'); })); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;
  // GitHub Pages tells browsers to keep the page for 10 minutes; go past that cache so a refresh always gets the latest board.
  const fresh = e.request.mode === 'navigate' || /\.(html|webmanifest|js)$/.test(u.pathname) || u.pathname.endsWith('/') ? new Request(e.request, { cache: 'no-store' }) : e.request;
  e.respondWith(fetch(fresh).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
});
