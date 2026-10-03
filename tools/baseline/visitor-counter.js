(() => {
  'use strict';
  // Every page opening counts. All pages share the same server-side counter.
  const endpoint = 'https://hitscounter.dev/api/hit?url=https%3A%2F%2Fpiol77.github.io%2Fcontrocorrente%2F&label=Oggi%20%2F%20Totale&icon=people-fill&color=%23082a43&style=flat&tz=Europe%2FRome';
  function countAccess() {
    const badge = document.querySelector('[data-visitor-counter]');
    const image = badge || document.createElement('img');
    if (!badge) {
      image.hidden = true;
      image.alt = '';
      image.onload = image.onerror = () => image.remove();
      document.body.append(image);
    } else {
      image.alt = 'Accessi di oggi / accessi totali';
      image.onerror = () => { image.alt = 'Contatore temporaneamente non disponibile'; };
    }
    // Change only the request URL, never the shared tracking key.
    image.src = endpoint + '&request=' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }
  countAccess();
  window.addEventListener('pageshow', event => {
    if (event.persisted) countAccess();
  });
})();
