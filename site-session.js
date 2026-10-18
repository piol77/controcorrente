(() => {
  'use strict';

  // Migliora la leggibilità dei soli link di navigazione, senza toccare gli altri testi.
  const navStyle = document.createElement('style');
  navStyle.textContent = 'header.top nav a{font-size:16px}';
  document.head.append(navStyle);

  // Tutte le pagine condividono lo stesso contatore, ma ogni sessione della scheda
  // deve incrementarlo una sola volta, indipendentemente dalla pagina visitata.
  const endpoint = 'https://hitscounter.dev/api/hit?url=https%3A%2F%2Fpiol77.github.io%2Fcontrocorrente%2F&label=Oggi%20%2F%20Totale&icon=people-fill&color=%23082a43&style=flat&tz=Europe%2FRome';
  const countedKey = 'controcorrente-visitor-counted-v1';
  const badgeKey = 'controcorrente-visitor-badge-v1';

  function getSessionItem(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function setSessionItem(key, value) {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function showBadge(src) {
    const badge = document.querySelector('[data-visitor-counter]');
    if (!badge || !src) return;
    badge.alt = 'Accessi di oggi / accessi totali';
    badge.onerror = () => { badge.alt = 'Contatore temporaneamente non disponibile'; };
    badge.src = src;
  }

  async function countAccessOnce() {
    const cachedBadge = getSessionItem(badgeKey);

    // Se questa sessione è già stata conteggiata, non contattare di nuovo
    // l'endpoint che incrementa il contatore. In Home riusa il badge salvato.
    if (getSessionItem(countedKey) === '1') {
      showBadge(cachedBadge);
      return;
    }

    const requestUrl = endpoint + '&request=' + Date.now() + '-' + Math.random().toString(36).slice(2);

    try {
      const response = await fetch(requestUrl, {
        cache: 'no-store',
        credentials: 'omit'
      });
      if (!response.ok) throw new Error('Counter request failed');

      const svg = await response.text();
      const badgeData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

      // Segna la sessione come conteggiata solo dopo una risposta valida.
      // Il badge viene conservato nella sessione per poterlo mostrare in Home
      // senza produrre un secondo accesso al servizio esterno.
      if (setSessionItem(badgeKey, badgeData)) {
        setSessionItem(countedKey, '1');
      }
      showBadge(badgeData);
    } catch (_) {
      const badge = document.querySelector('[data-visitor-counter]');
      if (badge) {
        badge.alt = 'Contatore temporaneamente non disponibile';
      }
    }
  }

  countAccessOnce();
})();

// BEGIN CONTROCORRENTE RADIO TEST 2026-10-18
// Rollback: remove only this marked block. The original counter above is unchanged.
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
      audio.src = 'https://stream.newageradio.gr/listen/jazz/radio.flac';
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

