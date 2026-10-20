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
  const preferenceKey = 'cc-jazz-test-enabled-v1';
  let enabled = true;
  try { enabled = sessionStorage.getItem(preferenceKey) !== 'off'; } catch (_) {}
  let pending = false;
  let failed = false;
  const audio = document.createElement('audio');
  audio.preload = 'none';
  audio.volume = 0.25;
  audio.setAttribute('playsinline', '');
  const button = document.createElement('button');
  button.id = 'cc-jazz-toggle';
  button.type = 'button';
  button.style.cssText = 'display:block;margin:8px 0 0 auto;width:36px;height:36px;padding:0;border:1px solid var(--gold,#cba76d);border-radius:50%;background:var(--navy,#082a43);color:var(--gold,#cba76d);font-size:18px;line-height:1;cursor:pointer;';
  let activeButton = button;
  function render() {
    const playing = !audio.paused && !failed;
    button.textContent = playing ? '♫' : enabled ? '♪' : '×';
    const label = playing ? 'Spegni 1st Greek Jazz' : failed
      ? '1st Greek Jazz non disponibile: tocca per riprovare'
      : enabled ? 'Ascolta 1st Greek Jazz' : 'Riattiva 1st Greek Jazz';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(playing));
    button.title = label;
    if (activeButton !== button) {
      activeButton.textContent = button.textContent;
      for (const name of ['aria-label', 'aria-pressed', 'title']) {
        activeButton.setAttribute(name, button.getAttribute(name));
      }
    }
  }
  function remember() {
    try { sessionStorage.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch (_) {}
  }
  function stop() {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    pending = false;
    render();
  }
  function start() {
    if (!enabled || pending || (!audio.paused && !failed)) return;
    pending = true;
    failed = false;
    if (!audio.getAttribute('src')) {
      audio.src = 'https://cdn1.zetcast.net/flac';
    }
    try {
      const result = audio.play();
      if (result && typeof result.then === 'function') {
        result.then(() => { pending = false; render(); }).catch(error => {
          pending = false;
          failed = error.name !== 'NotAllowedError' && error.name !== 'AbortError';
          render();
        });
      } else { pending = false; }
    } catch (_) { pending = false; failed = true; render(); }
  }
  audio.addEventListener('playing', () => { pending = false; failed = false; render(); });
  audio.addEventListener('pause', render);
  audio.addEventListener('error', () => { pending = false; failed = true; render(); });
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
      frame.allow = 'autoplay';
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

