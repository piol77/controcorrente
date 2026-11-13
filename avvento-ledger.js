(() => {
  const ledger = document.getElementById('avvento-confermati');
  if (!ledger) return;
  const api = window.CCAvvento;
  const status = ledger.querySelector('[role=status]');
  const body = ledger.querySelector('tbody');

  async function refresh() {
    const result = await api.request('confirmed');
    if (!result.ok || !Array.isArray(result.records)) {
      status.textContent = api.message(result.reason);
      if (body.querySelector('[colspan]')) body.replaceChildren();
      return;
    }
    const rows = document.createDocumentFragment();
    for (const entry of result.records) {
      const row = document.createElement('tr');
      const code = document.createElement('strong');
      code.textContent = entry.code;
      row.insertCell().append(code);
      row.insertCell().textContent = api.prizeName(entry.prize);
      row.insertCell().textContent = entry.state === 'used' ? 'Utilizzato' : 'Confermato';
      rows.append(row);
    }
    if (!result.records.length) {
      const row = document.createElement('tr');
      const cell = row.insertCell();
      cell.colSpan = 3;
      cell.textContent = 'Nessun codice Avvento confermato.';
      rows.append(row);
    }
    body.replaceChildren(rows);
    status.textContent = '';
  }
  const poll = window.ccWatchPanel(refresh);
  document.addEventListener('avvento:updated', poll.refresh);
})();
