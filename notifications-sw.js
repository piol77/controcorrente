'use strict';
// Permission/local-notification test only. No caching, interception or remote subscription.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const home = new URL('index.html', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients => {
    const client = clients.find(client => client.url.startsWith(self.registration.scope));
    if (client) return client.focus();
    return self.clients.openWindow(home);
  }));
});
