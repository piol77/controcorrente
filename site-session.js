(() => {
  const counterUrl = 'https://hitscounter.dev/api/hit?url=https%3A%2F%2Fpiol77.github.io%2Fcontrocorrente%2F&label=Accessi&icon=people-fill&color=%23082a43&message=&style=flat&tz=Europe%2FRome';
  const key = 'controcorrente-visit-counted-day';
  const badge = document.querySelector('[data-visitor-counter]');
  const badgeKey = `${key}-badge`;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
  const svgSrc = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  let countedDay = '';
  let cachedBadge = '';
  let badgeDay = '';
  try {
    countedDay = localStorage.getItem(key) || '';
    cachedBadge = localStorage.getItem(badgeKey) || '';
    badgeDay = localStorage.getItem(`${badgeKey}-day`) || '';
  } catch (_) {}

  if (countedDay === today) {
    if (badge && cachedBadge && badgeDay === today) badge.src = svgSrc(cachedBadge);
    return;
  }

  fetch(counterUrl)
    .then((response) => response.text())
    .then((svg) => {
      try {
        localStorage.setItem(key, today);
        localStorage.setItem(badgeKey, svg);
        localStorage.setItem(`${badgeKey}-day`, today);
      } catch (_) {}
      if (badge) badge.src = svgSrc(svg);
    })
    .catch(() => { if (badge) badge.src = counterUrl; });
})();
