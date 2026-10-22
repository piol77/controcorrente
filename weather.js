(function () {
  'use strict';
  var card = document.querySelector('[data-weather-card]');
  if (!card) return;
  var forecast = null;
  var pending = false;
  var lastAttempt = 0;
  var mode = 'restaurant';
  var requestId = 0;
  var gpsCache = null;
  var restaurantForecast = null;
  var gpsButton = card.querySelector('[data-weather-gps]');
  var restaurantButton = card.querySelector('[data-weather-restaurant]');
  var status = card.querySelector('[data-weather-status]');
  function message(text) {
    status.textContent = text;
    status.hidden = !text;
  }
  function select(nextMode) {
    mode = nextMode;
    gpsButton.setAttribute('aria-pressed', String(mode === 'gps'));
    restaurantButton.setAttribute('aria-pressed', String(mode === 'restaurant'));
    card.querySelector('[data-weather-place]').textContent = mode === 'gps'
      ? 'La tua posizione GPS' : 'Controcorrente · via San Paolo 16, Torino';
  }
  function timezone() {
    return mode === 'gps' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Rome';
  }
  function localDate(now) {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone(), year: 'numeric', month: '2-digit', day: '2-digit'
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
      timeZone: timezone(), day: 'numeric', month: 'long'
    }).format(now);
    var day = forecast && forecast.days.find(function (d) { return d.date === localDate(now); });
    if (!day || now - new Date(forecast.fetched_at) > 48 * 3600000) {
      unavailable('In attesa dell’aggiornamento meteo');
      return;
    }
    ['lunch', 'dinner'].forEach(function (service) {
      var target = card.querySelector('[data-weather-' + service + ']');
      var value = day[service];
      target.textContent = '';
      if (!value) {
        var hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone(), hour: '2-digit', hourCycle: 'h23' }).format(now));
        target.textContent = mode === 'gps' && hour >= (service === 'lunch' ? 15 : 23)
          ? 'Fascia già trascorsa' : 'Previsione non disponibile';
        return;
      }
      target.appendChild(document.createTextNode(value.icon + ' ' + value.condition));
      var details = document.createElement('span');
      var temperature = value.min_c === value.max_c ? value.min_c : value.min_c + '–' + value.max_c;
      details.textContent = temperature + ' °C · ' + new Intl.NumberFormat('it-IT', {
        maximumFractionDigits: 1
      }).format(value.precipitation_mm) + ' mm previsti';
      target.appendChild(details);
      if (value.forecast_at) {
        var archived = document.createElement('small');
        archived.textContent = 'Previsione del mattino';
        target.appendChild(archived);
      }
    });
    card.querySelector('[data-weather-updated]').textContent = 'Agg. ' + new Intl.DateTimeFormat('it-IT', {
      timeZone: timezone(), day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(new Date(forecast.fetched_at));
  }
  function load() {
    if (pending || mode !== 'restaurant') return;
    pending = true;
    lastAttempt = Date.now();
    fetch('weather.json', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('Weather unavailable');
      return response.json();
    }).then(function (data) {
      if (!Array.isArray(data.days) || !Number.isFinite(Date.parse(data.fetched_at))) throw new Error('Invalid weather');
      restaurantForecast = data;
      if (mode === 'restaurant') { forecast = data; render(); }
    }).catch(function () {
      if (mode !== 'restaurant') return;
      if (forecast) render();
      else unavailable('Meteo temporaneamente non disponibile');
    }).finally(function () { pending = false; });
  }
  function condition(symbol) {
    var code = symbol.split('_')[0];
    var types = [
      ['thunder', 9, 'Temporali', '⛈'], ['snow', 8, 'Neve', '❄'],
      ['sleet', 7, 'Pioggia e neve', '🌨'], ['heavyrain', 6, 'Pioggia intensa', '🌧'],
      ['rainshowers', 5, 'Rovesci', '🌦'], ['lightrain', 4, 'Pioggia debole', '🌧'],
      ['rain', 5, 'Pioggia', '🌧'], ['fog', 3, 'Nebbia', '🌫'],
      ['cloudy', 2, 'Coperto', '☁'], ['partlycloudy', 1, 'Parzialmente nuvoloso', '⛅'],
      ['fair', 1, 'Parzialmente nuvoloso', '⛅'], ['clearsky', 0, 'Sereno', symbol.endsWith('_day') ? '☀' : '☾']
    ];
    // Exact cloud codes distinguish partlycloudy from cloudy.
    var match = types.find(function (type) {
      return ['fog', 'cloudy', 'partlycloudy', 'fair', 'clearsky'].includes(type[0])
        ? code === type[0] : code.includes(type[0]);
    });
    if (!match) throw new Error('Unknown weather condition');
    return match;
  }
  function summarize(raw) {
    var now = new Date();
    if (!raw.properties || !Number.isFinite(Date.parse(raw.properties.meta.updated_at)) ||
        Math.abs(now - new Date(raw.properties.meta.updated_at)) > 86400000) throw new Error('Stale forecast');
    var points = raw.properties.timeseries;
    if (!Array.isArray(points)) throw new Error('Invalid forecast');
    var formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone(), year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    function period(start, end) {
      var temperatures = [], conditions = [], precipitation = 0, covered = 0;
      points.forEach(function (point, index) {
        var at = new Date(point.time);
        if (localDate(at) !== localDate(now)) return;
        var parts = formatter.formatToParts(at);
        function part(type) { return Number(parts.find(function (p) { return p.type === type; }).value); }
        var hour = part('hour') + part('minute') / 60;
        var weight = Math.min(hour + 1, end) - Math.max(hour, start);
        if (weight <= 0) return;
        var next = points[index + 1];
        var hourly = point.data.next_1_hours;
        if (!hourly || !next || new Date(next.time) - at !== 3600000) return;
        var temp = point.data.instant.details.air_temperature;
        var nextTemp = next.data.instant.details.air_temperature;
        var amount = hourly.details.precipitation_amount;
        if (![temp, nextTemp, amount].every(Number.isFinite)) throw new Error('Invalid forecast values');
        temperatures.push(temp + (nextTemp - temp) * Math.max(0, start - hour));
        temperatures.push(temp + (nextTemp - temp) * Math.min(1, end - hour));
        conditions.push(condition(hourly.summary.symbol_code));
        precipitation += amount * weight;
        covered += weight;
      });
      // Do not present a partial forecast as a full lunch/dinner window.
      if (Math.abs(covered - (end - start)) > 0.01) return null;
      var worst = conditions.reduce(function (a, b) { return a[1] >= b[1] ? a : b; });
      return { condition: worst[2], icon: worst[3], min_c: Math.round(Math.min.apply(null, temperatures)),
        max_c: Math.round(Math.max.apply(null, temperatures)), precipitation_mm: Math.round(precipitation * 10) / 10 };
    }
    return { fetched_at: now.toISOString(), days: [{ date: localDate(now), lunch: period(12, 14.5), dinner: period(19, 22.5) }] };
  }
  gpsButton.addEventListener('click', function () {
    if (!navigator.geolocation) { message('GPS non disponibile su questo dispositivo.'); return; }
    var id = ++requestId;
    gpsButton.disabled = true;
    message('Ricerca della posizione…');
    navigator.geolocation.getCurrentPosition(function (position) {
      if (id !== requestId) return;
      var lat = position.coords.latitude.toFixed(4);
      var lon = position.coords.longitude.toFixed(4);
      var key = lat + ',' + lon;
      var result = gpsCache && gpsCache.key === key && Date.now() < gpsCache.expires && gpsCache.forecast.days[0].date === new Intl.DateTimeFormat('sv-SE').format(new Date())
        ? Promise.resolve(gpsCache.forecast)
        : fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + lat + '&lon=' + lon, { signal: AbortSignal.timeout(15000) })
          .then(function (response) {
            if (!response.ok) throw new Error('GPS weather unavailable');
            return response.json();
          }).then(function (raw) {
            if (id !== requestId) return null;
            // GPS service windows use the visitor's local time zone.
            var previousMode = mode;
            mode = 'gps';
            try { return summarize(raw); } finally { mode = previousMode; }
          });
      message('Caricamento del meteo GPS…');
      result.then(function (data) {
        if (id !== requestId || !data) return;
        gpsCache = { key: key, forecast: data, expires: Date.now() + 1800000 };
        select('gps');
        forecast = data;
        render();
        message('');
      }).catch(function () {
        if (id === requestId) message('Meteo GPS non disponibile. Riprova o scegli Controcorrente.');
      }).finally(function () { if (id === requestId) gpsButton.disabled = false; });
    }, function (error) {
      if (id !== requestId) return;
      gpsButton.disabled = false;
      message(error.code === 1 ? 'Accesso alla posizione non consentito. Puoi abilitarlo nei permessi del browser o scegliere Controcorrente.'
        : 'Posizione non disponibile. Riprova o scegli Controcorrente.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });
  restaurantButton.addEventListener('click', function () {
    requestId++;
    gpsButton.disabled = false;
    select('restaurant');
    forecast = restaurantForecast;
    message('');
    render();
    load();
  });
  function check() {
    if (document.hidden) return;
    render();
    // The fixed restaurant forecast keeps its existing local JSON updates.
    if (mode === 'restaurant' && Date.now() - lastAttempt >= 300000) load();
  }
  render();
  load();
  document.addEventListener('visibilitychange', check);
  window.setInterval(check, 60000);
})();
