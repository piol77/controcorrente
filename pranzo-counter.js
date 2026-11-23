(function () {
  'use strict';

  // Il numero e condiviso tra tutti i visitatori, senza dati personali.
  // Una chiave diversa per ogni giorno permette il reset alle 15:00 (Torino).
  const API = 'https://countapi.mileshilliard.com/api/v1';
  const PREFIX = 'controcorrente_pranzo_persone_v1_';
  // Separate, permanent keys for the Christmas lunch. These never depend on the day.
  // Paolo's first request (8 adults and 4 children) predates this counter.
  const CHRISTMAS = {
    adults: {key: 'controcorrente_natale_2026_adulti_v1', initial: 8},
    kids: {key: 'controcorrente_natale_2026_bimbi_v1', initial: 4}
  };
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  function romeNow() {
    const parts = formatter.formatToParts(new Date());
    const part = type => parts.find(item => item.type === type).value;
    return {
      date: part('year') + '-' + part('month') + '-' + part('day'),
      minutes: Number(part('hour')) * 60 + Number(part('minute'))
    };
  }

  function activeDay() {
    const now = romeNow();
    if (now.minutes < 15 * 60) return now.date;
    const next = new Date(now.date + 'T12:00:00Z');
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString().slice(0, 10);
  }

  function counterKey(day) {
    return PREFIX + day.replace(/-/g, '');
  }

  async function recordLunchRequest(people, requestedDay) {
    const count = Number(people);
    if (!Number.isInteger(count) || count < 1 || count > 30 || requestedDay !== activeDay()) return;
    const url = API + '/hit/' + counterKey(requestedDay);

    // Un incremento per ogni persona, senza trasmettere nome, piatti o note.
    // Richieste indipendenti per non perdere i conteggi concorrenti.
    await Promise.allSettled(Array.from({length: count}, (_, index) =>
      fetch(url + '?req=' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2), {
        method: 'GET', cache: 'no-store', credentials: 'omit', keepalive: true
      })
    ));
  }

  window.ControcorrentePranzoCounter = {recordLunchRequest};

  async function recordChristmasRequest(adults, kids) {
    const quantities = [Number(adults), Number(kids)];
    if (quantities.some(n => !Number.isInteger(n) || n < 0) ||
        quantities[0] + quantities[1] < 1 || quantities[0] + quantities[1] > 25) return;
    await Promise.allSettled(Object.values(CHRISTMAS).flatMap((entry, type) =>
      Array.from({length: quantities[type]}, (_, index) =>
        fetch(API + '/hit/' + entry.key + '?req=' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2), {
          method: 'GET', cache: 'no-store', credentials: 'omit', keepalive: true
        })
      )
    ));
  }
  window.ControcorrentePranzoCounter.recordChristmasRequest = recordChristmasRequest;

  const christmasValue = document.querySelector('[data-christmas-requests-count]');
  if (christmasValue) {
    async function refreshChristmas() {
      const entries = Object.values(CHRISTMAS);
      const counts = await Promise.all(entries.map(async entry => {
        try {
          const response = await fetch(API + '/get/' + entry.key + '?t=' + Date.now(), {
            method: 'GET', cache: 'no-store', credentials: 'omit',
            signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined
          });
          if (response.status === 404) return entry.initial;
          if (!response.ok) throw new Error('counter temporarily unavailable');
          const data = await response.json();
          const extra = Number(data.value);
          if (!Number.isSafeInteger(extra) || extra < 0) throw new Error('invalid counter');
          return entry.initial + extra;
        } catch (_) { return null; }
      }));
      if (counts.includes(null)) {
        christmasValue.textContent = '—';
        return;
      }
      christmasValue.textContent = counts[0] + ' adulti · ' + counts[1] + ' bimbi e ragazzi · ' +
        (counts[0] + counts[1]) + ' persone';
    }
    window.ccWatchPanel(refreshChristmas, 20000);
  }

  const value = document.querySelector('[data-lunch-requests-count]');
  if (!value) return;

  let displayedDay = null;
  async function refresh() {
    const day = activeDay();
    if (displayedDay !== day) {
      displayedDay = day;
      value.textContent = '0';
    }
    try {
      const response = await fetch(
        API + '/get/' + counterKey(day) + '?t=' + Date.now(),
        {
          method:'GET', cache:'no-store', credentials:'omit',
          signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined
        }
      );
      if (day !== activeDay()) return;
      if (response.status === 404) {
        value.textContent = '0';
        return;
      }
      if (!response.ok) throw new Error('counter temporarily unavailable');
      const data = await response.json();
      const people = Number(data.value);
      if (!Number.isSafeInteger(people) || people < 0) throw new Error('invalid counter');
      value.textContent = people.toLocaleString('it-IT');
    } catch (_) {
      if (day === activeDay()) value.textContent = '—';
    }
  }

  window.ccWatchPanel(refresh, 20000);
})();
