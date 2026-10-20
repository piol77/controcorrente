(function () {
  'use strict';
  var card = document.querySelector('[data-weather-card]');
  if (!card) return;
  var forecast = null;
  var fetched = false;
  var pending = false;
  var lastAttempt = 0;
  function localDate(now) {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    function part(type) { return parts.find(function (p) { return p.type === type; }).value; }
    return part('year') + '-' + part('month') + '-' + part('day');
  }
  function unavailable(message) {
    ['lunch', 'dinner'].forEach(function (service) {
      card.querySelector('[data-weather-' + service + ']').textContent = 'Previsione non disponibile';
    });
    card.querySelector('[data-weather-updated]').textContent = message;
  }
  function render() {
    var now = new Date();
    card.querySelector('[data-weather-date]').textContent = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome', day: 'numeric', month: 'long'
    }).format(now);
    var day = forecast && forecast.days.find(function (d) { return d.date === localDate(now); });
    if (!day || now - new Date(forecast.fetched_at) > 48 * 3600000) {
      unavailable('In attesa dell’aggiornamento del mattino');
      return;
    }
    ['lunch', 'dinner'].forEach(function (service) {
      var target = card.querySelector('[data-weather-' + service + ']');
      var value = day[service];
      target.textContent = '';
      if (!value) { target.textContent = 'Previsione non disponibile'; return; }
      target.appendChild(document.createTextNode(value.icon + ' ' + value.condition));
      var details = document.createElement('span');
      var temperature = value.min_c === value.max_c ? value.min_c : value.min_c + '–' + value.max_c;
      details.textContent = temperature + ' °C · ' + new Intl.NumberFormat('it-IT', {
        maximumFractionDigits: 1
      }).format(value.precipitation_mm) + ' mm previsti';
      target.appendChild(details);
    });
    card.querySelector('[data-weather-updated]').textContent = 'Agg. ' + new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(new Date(forecast.fetched_at));
  }
  function load() {
    if (pending) return;
    pending = true;
    lastAttempt = Date.now();
    fetch('weather.json', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('Weather unavailable');
      return response.json();
    }).then(function (data) {
      if (!Array.isArray(data.days) || !Number.isFinite(Date.parse(data.fetched_at))) throw new Error('Invalid weather');
      forecast = data;
      fetched = true;
      render();
    }).catch(function () {
      if (forecast) render();
      else unavailable('Meteo temporaneamente non disponibile');
    }).finally(function () { pending = false; });
  }
  function check() {
    if (document.hidden) return;
    render();
    // Only read the small local JSON; visitors never contact the weather provider.
    // Refresh open tabs after the daily update, and retry a failed read after 5 minutes.
    var today = localDate(new Date());
    var refreshedToday = forecast && localDate(new Date(forecast.fetched_at)) === today;
    var hour = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', hour: '2-digit', hourCycle: 'h23'
    }).format(new Date()));
    if ((!fetched || (!refreshedToday && hour >= 8)) && Date.now() - lastAttempt >= 300000) load();
  }
  render();
  load();
  document.addEventListener('visibilitychange', check);
  window.setInterval(check, 60000);
})();
