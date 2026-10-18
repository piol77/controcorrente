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
  function render() {
    const playing = !audio.paused && !failed;
    button.textContent = playing ? '♫' : enabled ? '♪' : '×';
    const label = playing ? 'Spegni 1st Greek Jazz' : failed
      ? '1st Greek Jazz non disponibile: tocca per riprovare'
      : enabled ? 'Ascolta 1st Greek Jazz' : 'Riattiva 1st Greek Jazz';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(playing));
    button.title = label;
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
  button.addEventListener('click', () => {
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
  });
  const brandRow = header.querySelector('.brand-row');
  if (brandRow) brandRow.insertAdjacentElement('afterend', button);
  else header.appendChild(button);
  render();
  // No preventDefault/propagation changes: navigation, ordering and counter stay independent.
  // A browser may require a new gesture after navigating to a different HTML page.
  function onGesture(event) {
    if (!event.isTrusted || button.contains(event.target) || failed) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    start();
  }
  document.addEventListener('click', onGesture, { capture: true, passive: true });
  document.addEventListener('keydown', onGesture, { capture: true, passive: true });
  window.addEventListener('pagehide', stop);
})();
// END CONTROCORRENTE RADIO TEST 2026-10-18
