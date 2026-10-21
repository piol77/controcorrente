'use strict';
const PUSH_SERVICE = 'https://controcorrente-notifiche.superlion129.chatgpt.site';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    const home = new URL('index.html', self.registration.scope).href;
    let notice;
    try {
      const response = await fetch(PUSH_SERVICE + '/feed', {cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(12000)});
      if (response.ok) notice = (await response.json()).event;
    } catch (_) {}
    const current = notice && notice.expiresAt > Date.now();
    const target = current && typeof notice.url === 'string' && notice.url.startsWith(self.registration.scope) ? notice.url : home;
    await self.registration.showNotification('Ristorante Controcorrente', {
      body: current ? notice.body : 'È disponibile un aggiornamento dal ristorante. Apri il sito per leggerlo.',
      icon: new URL('notification-icon-192.png', self.registration.scope).href,
      tag: current && notice.kind === 'test' ? 'cc-saluto-unico' : 'cc-menu-updates',
      renotify:false,
      timestamp:current ? notice.createdAt : Date.now(),
      data:{url:target}
    });
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const home = new URL('index.html', self.registration.scope).href;
  const target = event.notification.data?.url;
  const url = typeof target === 'string' && target.startsWith(self.registration.scope) ? target : home;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients => {
    const client = clients.find(client => client.url.startsWith(self.registration.scope));
    if (client) { await client.navigate(url); return client.focus(); }
    return self.clients.openWindow(url);
  }));
});
