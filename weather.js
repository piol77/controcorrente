(function () {
  'use strict';
  var card = document.querySelector('[data-weather-card]');
  if (!card) return;
  var forecast = null;
  var pending = false;
  var lastAttempt = 0;
  var mode = 'restaurant';
  var dayOffset = 0;
  var calendarDay = null;
  var requestId = 0;
  var providerCache = {};
  var liveRaw = null;
  var liveFetchedAt = null;
  var livePosition = null;
  var lastLiveAttempt = 0;
  var restaurantForecast = null;
  var gpsButton = card.querySelector('[data-weather-gps]');
  var restaurantButton = card.querySelector('[data-weather-restaurant]');
  var status = card.querySelector('[data-weather-status]');
  var dayButton = card.querySelector('[data-weather-day]');
  var rows = card.querySelector('.weather-card__rows');
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
  function dateAtOffset(now, offset) {
    // Calendar arithmetic avoids 23/25-hour day errors around daylight saving changes.
    var date = new Date(localDate(now) + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  }
  function unavailable(message) {
    ['lunch', 'dinner'].forEach(function (service) {
      card.querySelector('[data-weather-' + service + ']').textContent = 'Previsione non disponibile';
    });
    card.querySelector('[data-weather-updated]').textContent = message;
  }
  function render() {
    var now = new Date();
    var today = localDate(now);
    if (calendarDay && calendarDay !== today) dayOffset = 0;
    calendarDay = today;
    var selectedDate = dateAtOffset(now, dayOffset);
    dayButton.textContent = dayOffset ? '←' : '→';
    dayButton.setAttribute('aria-label', dayOffset ? 'Torna al meteo di oggi' : 'Mostra il meteo di domani');
    dayButton.title = dayOffset ? 'Torna a oggi' : 'Mostra domani';
    if (liveRaw) {
      try { forecast = summarize(liveRaw, liveFetchedAt); }
      catch (_) { liveRaw = null; forecast = null; message('Previsione da aggiornare: premi GPS o Controcorrente.'); }
    }
    card.querySelector('[data-weather-date]').textContent = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'UTC', day: 'numeric', month: 'long'
    }).format(new Date(selectedDate + 'T12:00:00Z'));
    ['lunch', 'dinner'].forEach(function (service) {
      card.querySelector('[data-weather-' + service + ']').parentElement.querySelector('small').textContent =
        service === 'lunch' ? '12:00–14:30' : '19:00–22:30';
    });
    var day = forecast && forecast.days.find(function (d) { return d.date === selectedDate; });
    if (!day || now - new Date(forecast.fetched_at) > 48 * 3600000) {
      unavailable('In attesa dell’aggiornamento meteo');
      return;
    }
    ['lunch', 'dinner'].forEach(function (service) {
      var target = card.querySelector('[data-weather-' + service + ']');
      var value = day[service];
      var hours = target.parentElement.querySelector('small');
      hours.textContent = !dayOffset && value && value.period_label ? value.period_label
        : service === 'lunch' ? '12:00–14:30' : '19:00–22:30';
      target.textContent = '';
      if (!value) {
        target.textContent = 'Previsione non disponibile';
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
        archived.textContent = 'Previsione delle ' + new Intl.DateTimeFormat('it-IT', {
          timeZone: timezone(), hour: '2-digit', minute: '2-digit'
        }).format(new Date(value.forecast_at));
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
      if (mode === 'restaurant' && !liveRaw) { forecast = data; render(); }
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
  function summarize(raw, fetchedAt) {
    var now = new Date();
    if (!raw.properties || !Number.isFinite(Date.parse(raw.properties.meta.updated_at)) ||
        Math.abs(now - new Date(raw.properties.meta.updated_at)) > 86400000) throw new Error('Stale forecast');
    var points = raw.properties.timeseries;
    if (!Array.isArray(points)) throw new Error('Invalid forecast');
    var formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone(), year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    var clock = formatter.formatToParts(now);
    function current(type) { return Number(clock.find(function (p) { return p.type === type; }).value); }
    var currentHour = current('hour') + current('minute') / 60;
    var today = localDate(now);
    var tomorrow = new Date(Date.UTC(current('year'), current('month') - 1, current('day') + 1)).toISOString().slice(0, 10);
    function timeLabel(hour) {
      return String(Math.floor(hour)).padStart(2, '0') + ':' + String(Math.round((hour % 1) * 60)).padStart(2, '0');
    }
    function period(date, start, end, refreshToday) {
      // Preserve the existing click refresh for completed/running services on today's view.
      if (refreshToday && currentHour >= end) date = tomorrow;
      if (refreshToday && date === today) start = Math.max(start, currentHour);
      var temperatures = [], conditions = [], precipitation = 0, covered = 0;
      points.forEach(function (point, index) {
        var at = new Date(point.time);
        if (localDate(at) !== date) return;
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
      if (!conditions.length || Math.abs(covered - (end - start)) > 0.001) return null;
      var worst = conditions.reduce(function (a, b) { return a[1] >= b[1] ? a : b; });
      return { condition: worst[2], icon: worst[3], min_c: Math.round(Math.min.apply(null, temperatures)),
        max_c: Math.round(Math.max.apply(null, temperatures)), precipitation_mm: Math.round(precipitation * 10) / 10,
        service_date: date, period_label: (date === today ? 'Oggi ' : 'Domani ') + timeLabel(start) + '–' + timeLabel(end) };
    }
    return { fetched_at: fetchedAt || now.toISOString(), days: [
      { date: today, lunch: period(today, 12, 14.5, true), dinner: period(today, 19, 22.5, true) },
      { date: tomorrow, lunch: period(tomorrow, 12, 14.5, false), dinner: period(tomorrow, 19, 22.5, false) }
    ] };
  }
  function refreshPosition(lat, lon, nextMode, id) {
    lastLiveAttempt = Date.now();
    var key = lat + ',' + lon;
    var cached = providerCache[key];
    var result = cached && Date.now() < cached.expires
      ? Promise.resolve(cached)
      : fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + lat + '&lon=' + lon, {
          credentials: 'omit', signal: AbortSignal.timeout(15000)
        }).then(function (response) {
          if (!response.ok) throw new Error('Weather unavailable');
          var expires = Date.parse(response.headers.get('Expires'));
          return response.json().then(function (raw) {
            var entry = { raw: raw, fetchedAt: new Date().toISOString(),
              expires: Math.max(Date.now() + 3600000, expires || 0) };
            providerCache[key] = entry;
            return entry;
          });
        });
    message('Aggiornamento del meteo…');
    return result.then(function (entry) {
      if (id !== requestId) return;
      var previousMode = mode;
      mode = nextMode;
      var data;
      try { data = summarize(entry.raw, entry.fetchedAt); }
      finally { mode = previousMode; }
      select(nextMode);
      liveRaw = entry.raw;
      livePosition = { lat: lat, lon: lon, mode: nextMode };
      liveFetchedAt = entry.fetchedAt;
      forecast = data;
      render();
      message('');
    }).catch(function () {
      if (id === requestId) message('Aggiornamento meteo non disponibile. Riprova tra poco.');
    }).finally(function () { if (id === requestId) gpsButton.disabled = false; });
  }
  dayButton.addEventListener('click', function () {
    dayOffset = dayOffset ? 0 : 1;
    render();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && rows.animate) {
      rows.getAnimations().forEach(function (animation) { animation.cancel(); });
      rows.animate([
        { transform: 'translateX(' + (dayOffset ? '28px' : '-28px') + ')', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ], { duration: 240, easing: 'ease-out' });
    }
    // Older cached JSON may not yet include tomorrow after midnight.
    var selectedDate = dateAtOffset(new Date(), dayOffset);
    if (mode === 'restaurant' && (!forecast || !forecast.days.some(function (day) { return day.date === selectedDate; }))) {
      refreshPosition('45.0641', '7.6525', 'restaurant', ++requestId);
    }
  });
  gpsButton.addEventListener('click', function () {
    if (!navigator.geolocation) { message('GPS non disponibile su questo dispositivo.'); return; }
    var id = ++requestId;
    gpsButton.disabled = true;
    message('Ricerca della posizione…');
    navigator.geolocation.getCurrentPosition(function (position) {
      if (id !== requestId) return;
      var lat = position.coords.latitude.toFixed(4);
      var lon = position.coords.longitude.toFixed(4);
      refreshPosition(lat, lon, 'gps', id);
    }, function (error) {
      if (id !== requestId) return;
      gpsButton.disabled = false;
      message(error.code === 1 ? 'Accesso alla posizione non consentito. Puoi abilitarlo nei permessi del browser o scegliere Controcorrente.'
        : 'Posizione non disponibile. Riprova o scegli Controcorrente.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });
  restaurantButton.addEventListener('click', function () {
    var id = ++requestId;
    gpsButton.disabled = false;
    select('restaurant');
    liveRaw = null;
    liveFetchedAt = null;
    forecast = restaurantForecast;
    message('');
    render();
    refreshPosition('45.0641', '7.6525', 'restaurant', id);
  });
  function check() {
    if (document.hidden) return;
    render();
    // Refresh an explicitly selected position without asking for GPS again.
    if (livePosition && livePosition.mode === mode && Date.now() - lastLiveAttempt >= 3 * 3600000) {
      refreshPosition(livePosition.lat, livePosition.lon, mode, ++requestId);
    }
    // The fixed restaurant forecast keeps its existing local JSON updates.
    if (mode === 'restaurant' && Date.now() - lastAttempt >= 300000) load();
  }
  render();
  load();
  document.addEventListener('visibilitychange', check);
  window.setInterval(check, 60000);
})();
