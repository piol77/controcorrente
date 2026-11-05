/* Controcorrente Radio Premi — sola vista pubblica.
 * Nessuna generazione, modifica o convalida di voucher nel browser.
 * Il registro pubblico mostra SOLTANTO codici già riservati, confermati o utilizzati.
 * Codici annunciati ma ancora liberi restano segreti fino alla prenotazione.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-radio-premi]');
  if (!root) return;
  const status = root.querySelector('[data-radio-premi-status]');
  const body = root.querySelector('[data-radio-premi-rows]');
  const updated = root.querySelector('[data-radio-premi-updated]');
  const inactiveNote = root.querySelector('[data-radio-premi-inactive]');
  const stamp = value => {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? new Intl.DateTimeFormat('it-IT',{
      timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric',
      hour:'2-digit',minute:'2-digit'
    }).format(d) : '—';
  };
  const onlyPublic = item => item && typeof item === 'object' &&
    /^(?:[0-9]{5}|[A-HJ-NP-Z2-9]{5})$/.test(item.code) &&
    ['held','confirmed','used','void'].includes(item.status);
  async function refresh() {
    let data;
    try {
      const response = await fetch('https://lgjijnhhnjioiyvfmkvy.supabase.co/functions/v1/radio-premi', {
        cache:'no-store', credentials:'omit'
      });
      if (!response.ok) throw new Error('No public ledger');
      data = await response.json();
      if (!data || typeof data.active !== 'boolean' || !Array.isArray(data.records)) throw new Error('Invalid ledger');
    } catch (_) {
      status.textContent = 'Stato temporaneamente non disponibile. Non si possono verificare premi.';
      updated.textContent = 'Ultimo controllo non disponibile';
      return;
    }
    if (inactiveNote) inactiveNote.hidden = data.active;
    status.textContent = data.paused_today
      ? 'Annunci radio terminati per oggi. Le prenotazioni già confermate restano valide.'
      : data.active
        ? (data.code_released_today === true
          ? 'Il codice di oggi è di nuovo disponibile! Accendi la radio per visualizzarlo.'
          : 'Promozione attiva: accendi la radio per vedere il codice quando appare.')
        : 'Promozione sospesa: nuovi codici non disponibili.';
    updated.textContent = 'Registro aggiornato: ' + stamp(data.server_time);
    body.replaceChildren();
    const valid = data.records.filter(onlyPublic).slice()
      .sort((a,b) => String(b.issued_at || '').localeCompare(String(a.issued_at || '')))
      .slice(0,60);
    if (!valid.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.textContent = 'Nessun codice ancora prenotato.';
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    for (const item of valid) {
      const tr = document.createElement('tr');
      const vals = [
        item.code,
        stamp(item.status==='used' ? item.used_at : item.status==='confirmed' ? item.confirmed_at : item.status==='void' ? item.updated_at : (item.held_at || item.issued_at)),
        ({held:'Riservato, in attesa di conferma',confirmed:'Prenotazione confermata',
          used:'Sconto utilizzato',void:'Annullato · non più valido'})[item.status]
      ];
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
  window.setInterval(() => { if (!document.hidden) refresh(); }, 5000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
