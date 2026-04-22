self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
// Tüm istekleri tarayıcıya bırak — CSP engelini önlemek için fetch yapmıyoruz
self.addEventListener('fetch', () => {});
