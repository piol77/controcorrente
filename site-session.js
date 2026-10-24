(() => {
  'use strict';
  const navStyle = document.createElement('style');
  navStyle.textContent = 'header.top nav a{font-size:16px}';
  document.head.append(navStyle);

  // Shared anonymous counts; preserve the original once-per-tab session flag.
  const API = 'https://countapi.mileshilliard.com/api/v1/';
  const PREFIX = 'piol77_controcorrente_visits_6ae6fd00_';
  const countedKey = 'controcorrente-visitor-counted-v1';
  const valuesKey = 'controcorrente-visitor-values-v1';
  const get = key => { try { return sessionStorage.getItem(key); } catch (_) { return null; } };
  const set = (key, value) => { try { sessionStorage.setItem(key, value); } catch (_) {} };
  function dayKey() {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    return PREFIX + 'day_' + ['year','month','day'].map(type => parts.find(item => item.type === type).value).join('');
  }
  function show(data, failed = false) {
    const previous = document.querySelector('[data-visitor-counter]');
    if (!previous) return;
    let counter = previous;
    if (previous.tagName === 'IMG') {
      counter = document.createElement('span');
      counter.setAttribute('data-visitor-counter', '');
      counter.setAttribute('role', 'status');
      counter.style.cssText = 'display:inline-block;margin-top:8px;padding:6px 12px;border:1px solid var(--gold);border-radius:3px;color:var(--ink);font-size:1rem;line-height:1.5';
      previous.replaceWith(counter);
    }
    counter.textContent = data ? 'Oggi: ' + data.today_hits.toLocaleString('it-IT') +
      ' · Totale: ' + data.total_hits.toLocaleString('it-IT') :
      failed ? 'Contatore non raggiungibile. Riprova tra poco.' : 'Caricamento contatore…';
  }
  async function request(action, key) {
    const response = await fetch(API + action + '/' + key + '?request=' + Date.now(), {
      cache:'no-store', credentials:'omit',
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
    });
    if (action === 'get' && response.status === 404 && key.includes('_day_')) return 0;
    if (!response.ok) throw new Error('Counter unavailable');
    const json = await response.json();
    const value = Number(json.value);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid count');
    return value;
  }
  let pending = false;
  let retryScheduled = false;
  const today = dayKey();
  async function update(readOnly = false) {
    if (pending) return;
    pending = true;
    try {
      const alreadyCounted = get(countedKey) === '1';
      const keys = [PREFIX + 'total', today];
      const values = await Promise.all(keys.map(key => {
        const attemptedKey = 'cc-visit-attempt-v2-' + key;
        const action = readOnly || alreadyCounted || get(attemptedKey) === '1' ? 'get' : 'hit';
        // Never retry an uncertain increment: recovery only reads the values.
        if (action === 'hit') set(attemptedKey, '1');
        return request(action, key);
      }));
      const data = {total_hits:values[0], today_hits:values[1]};
      set(countedKey, '1');
      set(valuesKey, JSON.stringify(data));
      show(data);
    } catch (_) {
      let cached;
      try { cached = JSON.parse(get(valuesKey)); } catch (_) {}
      const valid = cached && Number.isSafeInteger(cached.total_hits) && Number.isSafeInteger(cached.today_hits);
      show(valid ? cached : null, true);
      if (!retryScheduled) {
        retryScheduled = true;
        window.setTimeout(() => update(true), 3000);
      }
    } finally { pending = false; }
  }
  show(null);
  update();
})();

// BEGIN CONTROCORRENTE RADIO TEST 2026-10-18
// Rollback radio: remove only this marked block.
(() => {
  'use strict';
  if (document.getElementById('cc-jazz-toggle')) return;
  const header = document.querySelector('header.top');
  if (!header) return;
  // Inject in every document, including internal pages attached to the shared player.
  const radioStyle = document.createElement('style');
  radioStyle.textContent = `
    #cc-jazz-toggle{position:relative;isolation:isolate}
    #cc-jazz-toggle::before,#cc-jazz-toggle::after{content:"";position:absolute;inset:-4px;border:2px solid currentColor;box-shadow:0 0 6px rgba(203,167,109,.7);border-radius:50%;pointer-events:none;opacity:0}
    #cc-jazz-toggle[data-music-state="on"]::before,#cc-jazz-toggle[data-music-state="on"]::after{animation:cc-radio-ripple 1s ease-in-out infinite}
    #cc-jazz-toggle[data-music-state="on"]::after{inset:-9px;animation-delay:.3s;animation-direction:reverse}
    @keyframes cc-radio-ripple{0%,100%{transform:scale(.96);opacity:.95}50%{transform:scale(1.13);opacity:.5}}
    @media(prefers-reduced-motion:reduce){#cc-jazz-toggle[data-music-state="on"]::before,#cc-jazz-toggle[data-music-state="on"]::after{animation:none;opacity:.45}#cc-jazz-toggle[data-music-state="on"]::after{inset:-9px}}
  `;
  document.head.appendChild(radioStyle);
  // The top document owns the stream; internal pages keep their normal scripts
  // and share that player instead of creating one on every navigation.
  let owner;
  try { if (window.parent !== window) owner = window.parent.ccJazzPlayer; } catch (_) {}
  if (owner) {
    const button = owner.button.cloneNode(true);
    button.addEventListener('click', owner.toggle);
    const row = header.querySelector('.brand-row');
    if (row) row.insertAdjacentElement('afterend', button);
    else header.appendChild(button);
    owner.attach(button, window);
    // Preserve the existing preorder redirect outside the persistent page frame.
    window.__DEMO_OPEN_WHATSAPP = url => { window.top.location.href = url; };
    return;
  }
  const preferenceKey = 'cc-jazz-session-enabled-v2';
  let enabled = false;
  try { enabled = sessionStorage.getItem(preferenceKey) === 'on'; } catch (_) {}
  let pending = false;
  let failed = false;
  let attempt = 0;
  let audible = false;
  const audio = document.createElement('audio');
  audio.preload = 'none';
  audio.volume = 0.25;
  audio.setAttribute('playsinline', '');
  const button = document.createElement('button');
  button.id = 'cc-jazz-toggle';
  button.type = 'button';
  button.style.cssText = 'display:block;margin:8px 0 0 auto;width:44px;height:44px;padding:4px;border:1px solid var(--gold,#cba76d);border-radius:50%;background:var(--navy,#082a43);color:var(--gold,#cba76d);font-size:18px;line-height:1;cursor:pointer;';
  let activeButton = button;
  function render() {
    const playing = enabled && audible && !audio.paused && !failed;
    const label = playing ? 'OFF · Spegni la musica' : pending
      ? 'OFF · Annulla avvio della musica' : failed
      ? 'ON · Radio non disponibile: tocca per riprovare'
      : 'ON · Accendi la musica';
    const icon = '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false" style="display:block;margin:0 auto;pointer-events:none">'
      + '<path d="M9 18V5l12-2v13M9 8l12-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<ellipse cx="6" cy="18" rx="3" ry="2.5" fill="currentColor"/><ellipse cx="18" cy="16" rx="3" ry="2.5" fill="currentColor"/>'
      + (playing || pending ? '<path d="M3 3l18 18" stroke="var(--navy,#082a43)" stroke-width="5"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '') + '</svg>';
    for (const target of new Set([button, activeButton])) {
      target.innerHTML = icon + '<span aria-hidden="true" style="display:block;font:700 9px/1.1 system-ui;letter-spacing:.04em;pointer-events:none">' + (playing || pending ? 'OFF' : 'ON') + '</span>';
      target.setAttribute('aria-label', label);
      target.setAttribute('aria-pressed', String(playing));
      target.setAttribute('data-music-state', playing ? 'on' : 'off');
      target.title = label;
      target.style.boxShadow = playing ? '0 0 0 2px var(--gold,#cba76d)' : 'none';
    }
  }
  function remember() {
    try { sessionStorage.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch (_) {}
  }
  function stop() {
    attempt++;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    pending = false;
    render();
  }
  function start() {
    if (!enabled || pending || (!audio.paused && !failed)) return;
    pending = true;
    const currentAttempt = ++attempt;
    failed = false;
    render();
    if (!audio.getAttribute('src')) {
      audio.src = 'https://cdn1.zetcast.net/flac';
    }
    try {
      const result = audio.play();
      if (result && typeof result.then === 'function') {
        result.then(() => { if (currentAttempt !== attempt) return; pending = false; render(); }).catch(error => {
          if (currentAttempt !== attempt) return;
          pending = false;
          failed = error.name !== 'NotAllowedError' && error.name !== 'AbortError';
          render();
        });
      } else { pending = false; }
    } catch (_) { pending = false; failed = true; render(); }
  }
  audio.addEventListener('playing', () => { audible = true; pending = false; failed = false; render(); });
  audio.addEventListener('pause', () => { audible = false; render(); });
  audio.addEventListener('waiting', () => { audible = false; pending = enabled; render(); });
  audio.addEventListener('stalled', () => { audible = false; pending = enabled; render(); });
  audio.addEventListener('ended', () => { audible = false; pending = false; render(); });
  audio.addEventListener('error', () => { audible = false; pending = false; failed = true; render(); });
  function toggle() {
    if (enabled && (pending || (!audio.paused && !failed))) {
      enabled = false;
      remember();
      stop();
    } else {
      enabled = true;
      remember();
      failed = false;
      // Release any failed stream before an explicit retry.
      audio.removeAttribute('src');
      audio.load();
      start();
    }
    render();
  }
  button.addEventListener('click', toggle);
  const brandRow = header.querySelector('.brand-row');
  if (brandRow) brandRow.insertAdjacentElement('afterend', button);
  else header.appendChild(button);
  render();
  const siteRoot = new URL('.', location.href);
  let frame = null;
  function navigate(url, push = true) {
    if (!frame) {
      frame = document.createElement('iframe');
      frame.title = 'Controcorrente';
      frame.allow = 'autoplay; geolocation';
      frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;background:var(--navy,#082a43);z-index:2147483647';
      frame.addEventListener('load', () => {
        try {
          document.title = frame.contentDocument.title;
          const url = frame.contentWindow.location.href;
          if (url !== 'about:blank' && url !== location.href) history.pushState(null, '', url);
        } catch (_) {}
      });
      frame.src = url;
      document.body.appendChild(frame);
      // Keep the original document alive for its audio, but remove it from
      // keyboard/screen-reader navigation and prevent a second scrollbar.
      for (const child of document.body.children) {
        if (child !== frame) { child.hidden = true; child.inert = true; }
      }
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      // Only the outer history owns cross-page entries (Back/Forward).
      frame.contentWindow.location.replace(url);
    }
    if (push) history.pushState(null, '', url);
  }
  function bindNavigation(view) {
    view.document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey ||
          event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest && event.target.closest('a[href]');
      if (!link || link.hasAttribute('download') ||
          (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, view.location.href);
      const current = new URL(view.location.href);
      if (url.origin !== siteRoot.origin || !url.pathname.startsWith(siteRoot.pathname) ||
          !(/\.html$/.test(url.pathname) || url.pathname === siteRoot.pathname) ||
          (url.pathname === current.pathname && url.search === current.search)) return;
      event.preventDefault();
      navigate(url.href);
    });
    function onGesture(event) {
      if (!event.isTrusted || event.target.closest?.('#cc-jazz-toggle') || failed) return;
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      start();
    }
    view.document.addEventListener('click', onGesture, { capture: true, passive: true });
    view.document.addEventListener('keydown', onGesture, { capture: true, passive: true });
  }
  window.ccJazzPlayer = {
    button, toggle,
    attach(nextButton, view) {
      activeButton = nextButton;
      render();
      bindNavigation(view);
    }
  };
  bindNavigation(window);
  window.addEventListener('popstate', () => {
    if (frame) navigate(location.href, false);
  });
  window.addEventListener('pagehide', stop);
})();
// END CONTROCORRENTE RADIO TEST 2026-10-18



// BEGIN SITE SHARING 2026-10-24 — shared across all pages, anonymous counts
(() => {
  'use strict';
  if (document.querySelector('[data-cc-share-button]')) return;
  const endpoint = 'https://countapi.mileshilliard.com/api/v1/';
  // New counters: the previous totals counted repeated taps and cannot be repaired retrospectively.
  const clickKey = 'piol77_controcorrente_share_unique_browsers_v2';
  const referralKey = 'piol77_controcorrente_referral_unique_browsers_v2';
  const clickFlag = 'cc-share-used-browser-v2';
  const referralFlag = 'cc-share-referred-browser-v2';
  function firstTime(key) {
    // Only two anonymous boolean markers: one per browser, across sessions when possible.
    // If storage is unavailable entirely, do not increment: duplicates would be misleading.
    try {
      if (localStorage.getItem(key) === '1') return false;
      localStorage.setItem(key, '1');
      return true;
    } catch (_) {
      try {
        if (sessionStorage.getItem(key) === '1') return false;
        sessionStorage.setItem(key, '1');
        return true;
      } catch (_) { return false; }
    }
  }
  function recordOnce(key, flag) {
    if (firstTime(flag)) counter('hit', key).then(refresh).catch(() => {});
  }
  let stats = null;
  const style = document.createElement('style');
  style.textContent = '.cc-share-button{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:5px 10px;border:1px solid var(--gold,#cba76d);border-radius:18px;background:transparent;color:var(--gold,#cba76d);font:12px/1.4 Arial,sans-serif;cursor:pointer;white-space:nowrap}.cc-share-button:hover,.cc-share-button:focus-visible{background:var(--gold,#cba76d);color:var(--navy,#081c30)}.cc-share-home{margin-top:9px;padding-top:9px;border-top:1px solid var(--line,#294256)}.cc-share-stats{display:block;margin-top:7px;color:var(--muted,#b6c6d2);font-size:.75rem;line-height:1.55}.cc-share-feedback{font:11px/1.5 Arial,sans-serif;color:var(--muted,#b6c6d2);margin-left:7px}#cc-notification-actions .cc-share-button{border-color:var(--line,#294256);color:var(--muted,#b6c6d2)}#cc-notification-actions .cc-share-button:hover{border-color:var(--gold,#cba76d);color:var(--gold,#cba76d);background:transparent}';
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cc-share-button';
  button.setAttribute('data-cc-share-button','');
  button.setAttribute('aria-label','Condividi questa pagina');
  button.title = 'Condividi questa pagina';
  button.textContent = '↗ Condividi';
  const feedback = document.createElement('span');
  feedback.className = 'cc-share-feedback';
  feedback.setAttribute('role','status');

  function shareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('menu');
    url.searchParams.delete('cc_share');
    if (url.hash) {
      let realAnchor = false;
      try { realAnchor = !!document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (_) {}
      if (!realAnchor) url.hash = '';
    }
    url.searchParams.set('cc_share','1');
    return url.href;
  }
  async function counter(action,key) {
    const response = await fetch(endpoint + action + '/' + key + '?t=' + Date.now(), {
      cache:'no-store',credentials:'omit',
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    });
    if (action === 'get' && response.status === 404) return 0;
    if (!response.ok) throw new Error('Counter unavailable');
    const data = await response.json();
    const value = Number(data.value);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid counter');
    return value;
  }
  async function refresh() {
    if (!stats || document.hidden) return;
    try {
      const counts = await Promise.all([counter('get',clickKey),counter('get',referralKey)]);
      stats.textContent = 'Browser che hanno usato Condividi: ' + counts[0].toLocaleString('it-IT') +
        ' · Browser arrivati da link condivisi: ' + counts[1].toLocaleString('it-IT');
    } catch (_) {
      stats.textContent = 'Statistiche condivisioni temporaneamente non disponibili';
    }
  }
  async function copy(url) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        input.style.cssText='position:fixed;left:-9999px;top:0';
        document.body.appendChild(input);
        input.select();
        const ok = document.execCommand('copy');
        input.remove();
        if (!ok) throw new Error('Copy unavailable');
      }
      feedback.textContent = 'Link copiato';
      return true;
    } catch (_) {
      window.prompt('Copia questo link:',url);
      feedback.textContent = 'Link pronto da copiare';
      return false; // The manual copy cannot be confirmed.
    }
  }
  button.addEventListener('click',() => {
    const url = shareUrl();
    feedback.textContent = '';
    let shared = null;
    if (typeof navigator.share === 'function') {
      try { shared = navigator.share({title:'Controcorrente',text:document.title,url}); }
      catch (error) { shared = Promise.reject(error); }
    }
    // Do not count cancelled share sheets or repeat shares from the same browser.
    // The browser cannot confirm final delivery within WhatsApp.
    if (shared) {
      Promise.resolve(shared).then(() => recordOnce(clickKey, clickFlag)).catch(error => {
        if (error && error.name === 'AbortError') return;
        return copy(url).then(copied => { if (copied) recordOnce(clickKey, clickFlag); });
      });
    } else {
      copy(url).then(copied => { if (copied) recordOnce(clickKey, clickFlag); });
    }
  });

  const homeCounter = document.querySelector('[data-notification-counter]');
  if (homeCounter && homeCounter.parentElement) {
    const home = document.createElement('div');
    home.className = 'cc-share-home';
    stats = document.createElement('small');
    stats.className = 'cc-share-stats';
    stats.setAttribute('role','status');
    stats.textContent = 'Statistiche condivisioni: caricamento…';
    home.append(button,feedback,stats);
    homeCounter.parentElement.appendChild(home);
    refresh();
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',() => { if (!document.hidden) refresh(); });
  } else {
    const header = document.querySelector('header.top');
    if (header) {
      function mount() {
        const controls = document.getElementById('cc-notification-actions');
        if (!controls) return false;
        controls.insertBefore(button,controls.firstChild);
        controls.appendChild(feedback);
        return true;
      }
      if (!mount()) {
        const observer = new MutationObserver(() => {
          if (mount()) observer.disconnect();
        });
        observer.observe(header,{childList:true,subtree:true});
        window.setTimeout(() => {
          observer.disconnect();
          if (!button.isConnected) {
            const brand = header.querySelector('.brand-row');
            if (brand) brand.insertAdjacentElement('afterend',button);
            else header.appendChild(button);
          }
        },4000);
      }
    }
  }
  if (new URLSearchParams(window.location.search).get('cc_share') === '1') {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('cc_share');
      history.replaceState(history.state,'',url.pathname + url.search + url.hash);
    } catch (_) {}
    recordOnce(referralKey, referralFlag);
  }
})();
// END SITE SHARING 2026-10-24
