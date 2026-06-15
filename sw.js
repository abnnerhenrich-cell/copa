self.addEventListener('install',e=>e.waitUntil(caches.open('bolao-v1').then(c=>c.addAll(['./','index.html','style.css','app.js','firebase-config.js']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
