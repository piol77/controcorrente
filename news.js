(function () {
  'use strict';
  var root = document.querySelector('[data-headlines]');
  if (!root) return;
  var viewport = root.querySelector('[data-headline-window]');
  var updated = root.querySelector('[data-headline-updated]');
  var pause = root.querySelector('[data-headline-pause]');
  var slides = [], current = 0, data = null, busy = false, lastFetch = 0;
  var paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function controls() {
    pause.textContent = paused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Avvia scorrimento notizie' : 'Metti in pausa le notizie');
    pause.setAttribute('aria-pressed', String(paused));
  }
  function safeUrl(value) {
    try { var u = new URL(value); return u.protocol === 'https:' && /^(www\.)?rainews\.it$/.test(u.hostname); }
    catch (_) { return false; }
  }
  function unavailable() {
    slides = []; viewport.textContent = '';
    var p = document.createElement('p'); p.className = 'headlines__status';
    p.textContent = 'Notizie temporaneamente non disponibili'; viewport.appendChild(p);
    updated.textContent = 'In attesa di aggiornamento';
  }
  function updateLabel(delayed) {
    if (!data) return;
    var stamp = Date.parse(data.fetched_at);
    var dateLabel = new Intl.DateTimeFormat('it-IT', {timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(stamp));
    updated.textContent = (delayed || Date.now() - stamp > 24 * 3600000 ? 'Aggiornamento in ritardo · ' : 'Agg. ') + dateLabel;
  }
  function render() {
    if (!data) { unavailable(); return; }
    viewport.textContent = ''; current = 0;
    slides = data.items.slice(0, 5).map(function (item, index) {
      var a = document.createElement('a'); a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.className = 'headlines__slide' + (index === 0 ? ' is-current' : '');
      a.tabIndex = index === 0 ? 0 : -1; a.setAttribute('aria-hidden', String(index !== 0));
      var shade = 'linear-gradient(90deg,rgba(4,20,34,.91),rgba(4,20,34,.66))';
      a.style.backgroundImage = safeUrl(item.image) ? shade + ',url("' + item.image.replace(/["\\\n\r]/g, '') + '")' : shade + ',url("footer-onde.webp")';
      var meta = document.createElement('small'); meta.textContent = item.area + ' · ' + item.source + ' · ' + (index + 1) + '/5';
      var title = document.createElement('strong'); title.textContent = item.title;
      a.append(meta, title); viewport.appendChild(a); return a;
    });
    updateLabel(false);
  }
  function advance() {
    if (paused || document.hidden || root.matches(':hover') || viewport.contains(document.activeElement) || slides.length < 2) return;
    slides.forEach(function (a) { a.classList.remove('is-leaving'); });
    var old = slides[current]; old.classList.remove('is-current'); old.classList.add('is-leaving');
    old.tabIndex = -1; old.setAttribute('aria-hidden','true');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-current'); slides[current].tabIndex = 0; slides[current].setAttribute('aria-hidden','false');
  }
  function load() {
    if (busy || document.hidden) return;
    busy = true; lastFetch = Date.now();
    fetch('news.json', {cache:'no-store'}).then(function (r) { if (!r.ok) throw Error(); return r.json(); }).then(function (value) {
      if (!Number.isFinite(Date.parse(value.fetched_at)) || !Array.isArray(value.items) || value.items.length !== 5 ||
          !value.items.every(function (item) { return typeof item.title === 'string' && safeUrl(item.url); })) throw Error();
      if (!data || data.fetched_at !== value.fetched_at) { data = value; render(); }
      else updateLabel(false);
    }).catch(function () { if (!data) unavailable(); else updateLabel(true); })
    .finally(function () { busy = false; });
  }
  pause.addEventListener('click', function () { paused = !paused; controls(); });
  controls(); load();
  window.setInterval(advance, 8500);
  window.setInterval(function () { if (Date.now() - lastFetch >= 300000) load(); if(data) updateLabel(false); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && Date.now()-lastFetch>=300000) load(); });
})();
