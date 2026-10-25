'use strict';
const PUSH_SERVICE = 'https://controcorrente-notifiche.superlion129.chatgpt.site';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
// Suppress repeat notifications on the same local calendar day (Europe/Rome).
// The independent cache survives browser/service-worker restarts.
const DAILY_CACHE = 'cc-push-daily-limit-v1';
let pendingPush = Promise.resolve();
self.addEventListener('push', event => {
  const task = pendingPush.catch(() => {}).then(async () => {
    const cache = await caches.open(DAILY_CACHE);
    const marker = new URL('push-last-notification', self.registration.scope).href;
    const today = new Intl.DateTimeFormat('sv-SE', {
      timeZone:'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit'
    }).format(new Date());
    const previous = await cache.match(marker);
    if (previous && (await previous.text()) === today) return;
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
      tag:'cc-daily-' + today.replace(/-/g, ''),
      renotify:false,
      timestamp:current ? notice.createdAt : Date.now(),
      data:{url:target}
    });
    await cache.put(marker, new Response(today));
  });
  pendingPush = task.catch(() => {});
  event.waitUntil(task);
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
