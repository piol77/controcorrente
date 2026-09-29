(() => {
  const counterUrl = 'https://hitscounter.dev/api/hit?url=https%3A%2F%2Fpiol77.github.io%2Fcontrocorrente%2F&label=Accessi&icon=people-fill&color=%23082a43&message=&style=flat&tz=Europe%2FRome';
  const key = 'controcorrente-visit-counted';
  const badge = document.querySelector('[data-visitor-counter]');
  const badgeKey = `${key}-badge`;
  let cachedBadge = '';
  try { cachedBadge = sessionStorage.getItem(badgeKey) || ''; } catch (_) {}
  if (cachedBadge) {
    if (badge) badge.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cachedBadge)}`;
    return;
  }
  fetch(counterUrl)
    .then((response) => response.text())
    .then((svg) => {
      try {
        sessionStorage.setItem(key, '1');
        sessionStorage.setItem(badgeKey, svg);
      } catch (_) {}
      if (badge) badge.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    })
    .catch(() => { if (badge) badge.src = counterUrl; });
})();
