(() => {
  'use strict';
  const header = document.querySelector('header.top');
  if (!header || document.getElementById('cc-notification-toggle')) return;
  const root = new URL('.', document.currentScript.src);
  const pushService = 'https://controcorrente-notifiche.superlion129.chatgpt.site';
  // Regenerated menu pages also receive the manifest through the shared loader.
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest'; link.href = new URL('manifest.webmanifest', root).href;
    document.head.appendChild(link);
  }
  const style = document.createElement('style');
  style.textContent = `
    #cc-notification-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:8px;min-height:36px}
    #cc-notification-actions #cc-jazz-toggle{margin:0!important;flex:none}
    #cc-notification-toggle{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:5px 10px;border:1px solid var(--line,#294256);border-radius:18px;background:transparent;color:var(--muted,#b6c6d2);font:12px/1.4 Arial,sans-serif;white-space:nowrap}
    #cc-notification-toggle:hover{border-color:var(--gold,#bfa77c);color:var(--gold,#bfa77c)}
    #cc-notification-toggle svg{width:15px;height:15px;flex:none}
    #cc-notification-panel{max-width:440px;margin:10px 0 0 auto;padding:14px;border:1px solid var(--line,#294256);border-radius:4px;background:var(--panel,#0e2940);color:var(--muted,#b6c6d2);font-size:13px;line-height:1.6}
    #cc-notification-panel p{margin:0 0 8px}
    #cc-notification-panel .cc-notification-close{display:block;margin-left:auto;padding:4px 8px;color:var(--gold,#bfa77c);background:transparent;border:1px solid var(--line,#294256);font-size:12px}
  `;
  document.head.appendChild(style);
  const row = document.createElement('div');
  row.id = 'cc-notification-actions';
  const button = document.createElement('button');
  button.id = 'cc-notification-toggle'; button.type = 'button';
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>Notifiche</span>';
  row.appendChild(button);
  const radio = header.querySelector('#cc-jazz-toggle');
  if (radio) { radio.before(row); row.appendChild(radio); }
  else header.querySelector('.brand-row').insertAdjacentElement('afterend', row);
  const panel = document.createElement('div');
  panel.id = 'cc-notification-panel'; panel.hidden = true;
  const status = document.createElement('p');
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'cc-notification-close'; close.textContent = 'Chiudi';
  close.addEventListener('click', () => { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); button.focus(); });
  panel.append(status, close); row.after(panel);
  button.setAttribute('aria-controls', panel.id); button.setAttribute('aria-expanded', 'false');
  function message(text) {
    status.textContent = text; panel.hidden = false; button.setAttribute('aria-expanded', 'true');
  }
  const manualPermissionHelp = 'Su Chrome per Android, tocca il simbolo con i due cursori a sinistra dell’indirizzo (prima di “piol77”), poi Autorizzazioni → Notifiche → Consenti. Torna al sito, ricarica la pagina e premi Notifiche per completare l’attivazione. Su iPhone, dopo aver aggiunto il sito alla schermata Home, usa Impostazioni → Notifiche → Controcorrente.';
  let owner = window;
  try { if (window.top.location.origin === location.origin) owner = window.top; } catch (_) {}
  // The outer document stays alive while the radio navigates between sections.
  // Permission requests are made synchronously within the click's user activation.
  if (!owner.ccNotifications || typeof owner.ccNotifications.subscribe !== 'function') {
    let registrationPromise, subscriptionPromise;
    let subscribed = false;
    const optOutKey = 'cc-notifications-disabled-v1';
    const optedOut = () => {
      try { return owner.localStorage.getItem(optOutKey) === '1'; }
      catch (_) { return false; }
    };
    const setOptedOut = value => {
      try {
        if (value) owner.localStorage.setItem(optOutKey, '1');
        else owner.localStorage.removeItem(optOutKey);
      } catch (_) {}
    };
    const controller = {
      permission: () => 'Notification' in owner ? owner.Notification.permission : 'unsupported',
      needsHome: () => (/iPad|iPhone|iPod/.test(owner.navigator.userAgent) ||
        (owner.navigator.platform === 'MacIntel' && owner.navigator.maxTouchPoints > 1)) &&
        !(owner.matchMedia('(display-mode: standalone)').matches || owner.navigator.standalone === true),
      supported: () => owner.isSecureContext && 'Notification' in owner && 'serviceWorker' in owner.navigator,
      prepare() {
        if (!registrationPromise) {
          registrationPromise = owner.navigator.serviceWorker.register(new URL('notifications-sw.js', root).href, {scope:root.pathname})
            .then(registration => new Promise((resolve, reject) => {
              if (registration.active) { resolve(registration); return; }
              const timer = owner.setTimeout(() => reject(new Error('Activation timeout')), 12000);
              function check() {
                if (registration.active) { owner.clearTimeout(timer); resolve(registration); }
              }
              const worker = registration.installing || registration.waiting;
              if (worker) worker.addEventListener('statechange', check);
              check();
            })).catch(error => { registrationPromise = null; throw error; });
        }
        return registrationPromise;
      },
      request: () => owner.Notification.requestPermission(),
      subscribed: () => subscribed,
      optedOut,
      setOptedOut,
      async unsubscribe() {
        // Store this BEFORE cancelling: returning to the website must not re-enrol.
        setOptedOut(true);
        if (subscriptionPromise) await subscriptionPromise.catch(() => {});
        const registration = await controller.prepare();
        const subscription = await registration.pushManager?.getSubscription();
        if (subscription) {
          // Best effort server-side removal. Browser-side unsubscribe is essential
          // and still proceeds if the server does not provide this endpoint.
          try {
            await owner.fetch(pushService + '/unsubscribe', {
              method:'POST',credentials:'omit',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({endpoint:subscription.endpoint}),
              signal:AbortSignal.timeout(6000)
            });
          } catch (_) {}
          const removed = await subscription.unsubscribe();
          if (!removed) throw new Error('Browser unsubscribe failed');
        }
        subscribed = false;
        subscriptionPromise = null;
      },
      async subscribe() {
        if (subscriptionPromise) return subscriptionPromise;
        subscriptionPromise = (async () => {
          if (controller.permission() !== 'granted') throw new Error('Permission required');
          const registration = await controller.prepare();
          if (!registration.pushManager) throw new Error('Push not supported');
          const response = await owner.fetch(pushService + '/config', {credentials:'omit',cache:'no-store'});
          if (!response.ok) throw new Error('Configuration unavailable');
          const config = await response.json();
          const base64 = config.publicKey.replace(/-/g,'+').replace(/_/g,'/');
          const bytes = Uint8Array.from(owner.atob(base64 + '='.repeat((4-base64.length%4)%4)), ch => ch.charCodeAt(0));
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) subscription = await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
          const saved = await owner.fetch(pushService + '/subscribe', {
            method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({endpoint:subscription.endpoint})
          });
          if (!saved.ok) throw new Error('Subscription unavailable');
          subscribed = true;
        })().catch(error => { subscriptionPromise = null; throw error; });
        return subscriptionPromise;
      }
    };
    owner.ccNotifications = controller;
  }
  const controller = owner.ccNotifications;
  function render() {
    const granted = controller.permission() === 'granted';
    const disabled = controller.optedOut();
    const active = granted && controller.subscribed() && !disabled;
    button.querySelector('span').textContent = active ? 'Notifiche ✓' : disabled ? 'Notifiche OFF' : 'Notifiche';
    const label = active ? 'Disattiva le notifiche' : disabled ? 'Riattiva le notifiche' : granted ? 'Completa attivazione notifiche' : 'Attiva le notifiche';
    button.title = label; button.setAttribute('aria-label', label);
  }
  render();
  if (controller.supported() && !controller.needsHome()) {
    controller.prepare().catch(() => {});
    // Existing consent is enough to attempt enrolment on the next visit.
    // Registration and page loads never send a test notification.
    if (controller.permission() === 'granted' && !controller.optedOut()) controller.subscribe().then(render).catch(() => {});
  }
  button.addEventListener('click', async () => {
    // A second tap unsubscribes; it does not merely hide this button.
    if (controller.subscribed() && !controller.optedOut()) {
      button.disabled = true;
      try {
        await controller.unsubscribe();
        message('Notifiche disattivate su questo browser. Non riceverai più avvisi. Premi Notifiche OFF per riattivarle.');
      } catch (_) {
        message('Non è stato possibile disattivare completamente le notifiche. Riprova.');
      } finally { button.disabled = false; render(); }
      return;
    }
    if (controller.needsHome()) {
      message('Su iPhone e iPad: apri questo sito in Safari, tocca Condividi e scegli “Aggiungi alla schermata Home”. Se compare “Apri come app web”, lascialo attivo. Poi apri Controcorrente dalla nuova icona e premi di nuovo Notifiche. È necessario iOS/iPadOS 16.4 o successivo.');
      return;
    }
    if (!controller.supported()) {
      message('Questo browser non consente le notifiche del sito. Apri il link nel browser del telefono, per esempio Chrome su Android, e riprova.');
      return;
    }
    if (controller.permission() === 'denied') {
      message('Le notifiche sono bloccate. ' + manualPermissionHelp);
      return;
    }
    button.disabled = true;
    const restoring = controller.optedOut();
    let permission;
    try {
      if (controller.permission() !== 'granted') {
        message('Se non compare la richiesta di consenso, puoi attivare le notifiche manualmente. ' + manualPermissionHelp);
      }
      // No await or registration before this call: Safari requires a direct tap.
      const request = controller.permission() === 'granted' ? Promise.resolve('granted') : controller.request();
      permission = await request;
      render();
      if (permission === 'denied') {
        message('Consenso non accordato. Se vuoi attivare le notifiche manualmente: ' + manualPermissionHelp);
      } else if (permission !== 'granted') {
        message('Notifiche non attivate. Se la richiesta è stata chiusa oppure non è comparsa, puoi attivarle manualmente. ' + manualPermissionHelp);
      } else {
        controller.setOptedOut(false);
        await controller.subscribe();
        message('Notifiche attive. Riceverai al massimo un avviso al giorno su questo browser. Premi di nuovo Notifiche ✓ per disattivarle.');
      }
    } catch (_) {
      if (restoring) controller.setOptedOut(true);
      message(permission === 'granted' || controller.permission() === 'granted'
        ? 'Il permesso è accordato, ma non è stato possibile completare l’attivazione degli avvisi. Controlla la connessione e premi di nuovo Notifiche per riprovare.'
        : 'Non è stato possibile richiedere il permesso. ' + manualPermissionHelp);
    } finally { button.disabled = false; render(); }
  });
  window.addEventListener('focus', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})();
