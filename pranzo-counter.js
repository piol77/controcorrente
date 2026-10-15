(function () {
  'use strict';

  // Il numero e condiviso tra tutti i visitatori, senza dati personali.
  // Una chiave diversa per ogni giorno permette il reset alle 15:00 (Torino).
  const API = 'https://countapi.mileshilliard.com/api/v1';
  const PREFIX = 'controcorrente_pranzo_persone_v1_';
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

  const value = document.querySelector('[data-lunch-requests-count]');
  if (!value) return;

  let displayedDay = null;
  let refreshId = 0;
  async function refresh() {
    const day = activeDay();
    const id = ++refreshId;
    if (displayedDay !== day) {
      displayedDay = day;
      value.textContent = '0';
    }
    try {
      const response = await fetch(
        API + '/get/' + counterKey(day) + '?t=' + Date.now(),
        {method: 'GET', cache: 'no-store', credentials: 'omit'}
      );
      if (id !== refreshId || day !== activeDay()) return;
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
      if (id === refreshId && day === activeDay()) value.textContent = '—';
    }
  }

  refresh();
  setInterval(refresh, 20000);
  document.addEventListener('visibilitychange', () => {if (!document.hidden) refresh();});
  window.addEventListener('pageshow', refresh);
})();
