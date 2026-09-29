(() => {
  const counterUrl = 'https://hitscounter.dev/api/hit?url=https%3A%2F%2Fpiol77.github.io%2Fcontrocorrente%2F&label=Accessi&icon=people-fill&color=%23082a43&message=&style=flat&tz=Europe%2FRome';
  const key = 'controcorrente-visit-counted';
  const badge = document.querySelector('[data-visitor-counter]');
  let counted = false;
  try { counted = sessionStorage.getItem(key) === '1'; } catch (_) {}
  if (!counted) {
    try { sessionStorage.setItem(key, '1'); } catch (_) {}
    const pixel = badge || new Image();
    pixel.src = counterUrl;
    if (!badge) {
      pixel.alt = '';
      pixel.width = 1;
      pixel.height = 1;
      pixel.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';
      document.body.appendChild(pixel);
    }
  } else if (badge) {
    badge.replaceWith(Object.assign(document.createElement('span'), {
      className: 'counter-confirmation',
      textContent: 'Accesso già registrato'
    }));
  }
})();
