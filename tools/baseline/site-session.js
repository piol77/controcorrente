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
