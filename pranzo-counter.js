(function () {
  'use strict';

  // Il numero e condiviso tra tutti i visitatori, senza dati personali.
  // Una chiave diversa per ogni giorno permette il reset alle 15:00 (Torino).
  const API = 'https://countapi.mileshilliard.com/api/v1';
  const confirmedApi = 'https://nchtaewykddmnjolcebs.supabase.co/functions/v1/controcorrente-coperti';
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

  window.ControcorrentePranzoCounter = {};

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

  const status = document.querySelector('[data-lunch-count-status]');
  const storageKey = 'controcorrente-coperti-confermati';
  let latest, running = false;
  function valid(data, day) {
    return data?.date === day && Number.isSafeInteger(data.confirmed) && data.confirmed >= 0
      && Number.isFinite(Date.parse(data.synced_at));
  }
  function cached(day) {
    if (valid(latest, day)) return latest;
    try {
      const item = JSON.parse(localStorage.getItem(storageKey + day));
      return valid(item, day) ? item : null;
    } catch (_) {
      return null;
    }
  }
  function draw(data, day, disconnected = false) {
    const date = day.split('-').reverse().join('/');
    value.textContent = data ? data.confirmed.toLocaleString('it-IT') : '—';
    if (!status) return;
    const stale = data && (disconnected || Date.now() - Date.parse(data.synced_at) > 240000);
    status.textContent = !data ? 'Dato del ' + date + ' in attesa di sincronizzazione.'
      : stale ? 'Ultimo dato disponibile per il ' + date + ' · aggiornamento in attesa.'
      : 'Prenotazioni del ' + date + '. Il giorno di riferimento cambia alle 15:00.';
  }
  async function refresh() {
    if (running) return;
    running = true;
    const day = activeDay(), previous = cached(day);
    draw(previous, day);
    try {
      const response = await fetch(confirmedApi + '?date=' + encodeURIComponent(day), {
        method:'GET', cache:'default', credentials:'omit',
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(7000) : undefined
      });
      if (day !== activeDay()) return;
      if (!response.ok) throw new Error('Dati temporaneamente non disponibili');
      const data = await response.json();
      if (day !== activeDay()) return;
      if (!valid(data, day)) {
        draw(previous, day, true);
        return;
      }
      latest = !previous || Date.parse(data.synced_at) >= Date.parse(previous.synced_at) ? data : previous;
      try {
        localStorage.setItem(storageKey + day, JSON.stringify(latest));
        const yesterday = new Date(day + 'T12:00:00Z');
        yesterday.setUTCDate(yesterday.getUTCDate() - 2);
        localStorage.removeItem(storageKey + yesterday.toISOString().slice(0,10));
      } catch (_) {}
      draw(latest, day);
    } catch (_) {
      if (day === activeDay()) draw(previous, day, true);
    } finally {
      running = false;
      if (day !== activeDay()) void refresh();
    }
  }

  window.ccWatchPanel(refresh, 60000);
})();
