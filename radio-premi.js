/* Controcorrente Radio Premi — sola vista pubblica.
 * Nessuna generazione, modifica o convalida di voucher nel browser.
 * L'archivio pubblico contiene SOLO codici riscattati/scaduti.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-radio-premi]');
  if (!root) return;
  const status = root.querySelector('[data-radio-premi-status]');
  const body = root.querySelector('[data-radio-premi-rows]');
  const updated = root.querySelector('[data-radio-premi-updated]');
  const stamp = value => {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? new Intl.DateTimeFormat('it-IT',{
      timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric',
      hour:'2-digit',minute:'2-digit'
    }).format(d) : '—';
  };
  const onlyPublic = item => item && typeof item === 'object' &&
    /^[A-HJ-NP-Z2-9]{5}$/.test(item.code) &&
    (item.status === 'used' || item.status === 'expired');
  async function refresh() {
    let data;
    try {
      const response = await fetch(new URL('radio-premi-public.json', location.href), {
        cache:'no-store', credentials:'omit'
      });
      if (!response.ok) throw new Error('No public ledger');
      data = await response.json();
      if (!data || data.version !== 1 || !Array.isArray(data.records)) throw new Error('Invalid ledger');
    } catch (_) {
      status.textContent = 'Stato temporaneamente non disponibile. Non si possono verificare premi.';
      updated.textContent = 'Ultimo controllo non disponibile';
      return;
    }
    status.textContent = data.active
      ? 'Promozione attiva: ascolta la radio per conoscere il codice del giorno.'
      : 'Promozione in preparazione: nessun codice è ancora riscattabile.';
    updated.textContent = data.updated_at ? 'Registro aggiornato: ' + stamp(data.updated_at)
      : 'Nessun codice ancora emesso';
    body.replaceChildren();
    const valid = data.records.filter(onlyPublic).slice()
      .sort((a,b) => String(b.issued_at || '').localeCompare(String(a.issued_at || '')))
      .slice(0,60);
    if (!valid.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = 'Nessun codice riscattato o scaduto.';
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    for (const item of valid) {
      const tr = document.createElement('tr');
      const vals = [item.code, stamp(item.issued_at), stamp(item.expires_at),
        item.status === 'used' ? 'Già utilizzato' : 'Scaduto'];
      vals.forEach((value,i) => {
        const td = document.createElement('td');
        td.textContent = value;
        if (i === 0) { const strong = document.createElement('strong'); strong.textContent=value;
          td.replaceChildren(strong); }
        tr.appendChild(td);
      });
      body.appendChild(tr);
    }
  }
  refresh();
  window.setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
