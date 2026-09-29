(function () {
  'use strict';
  const KEY = 'controcorrente-preordine-v1';
  const PHONE = '393272292006';
  const catalog = {
    antipasti: [
      ['Bruschetta al salmone affumicato', 10, 88, 32.5],
      ['Gamberetti* in salsa rosa', 10, 88, 52.3],
      ['Funghi champignon fritti', 10, 88, 72.3]
    ],
    primi: [
      ['Spaghetti ai frutti di mare', 15, 88, 29.4],
      ['Conchigliette verdure, zafferano e croccante di guanciale', 12.5, 88, 47.1],
      ['Risotto barbabietola e gorgonzola (minimo due porzioni)', 12.5, 88, 65.0],
      ['Linguine crema di zucchine, avocado e gamberetti*', 12.5, 88, 82.8]
    ],
    secondi: [
      ['Frittura mista di alici, calamari e gamberetti*', 20, 88, 30.8],
      ['Filetti di suino al bacon e fichi', 14, 88, 48.7],
      ['Filetto di branzino al limone', 14, 88, 66.4],
      ['Trancio di salmone all’arancia e pepe rosa', 14, 88, 84.0]
    ],
    'bibite-vini': [
      ['Acqua 1 litro', 2, 9, 40], ['Bibite in lattina 33 cl', 3, 27, 40],
      ['Birra Moretti / Peroni 66 cl', 4, 48, 40], ['Ceres 33 cl', 4, 65, 40],
      ['Amari', 4, 86, 40], ['Generoso', 20, 10, 78],
      ['Nonna Seppa', 25, 30, 78], ['Pentamerone', 30, 50, 78],
      ['Emmente', 20, 70, 78], ['Seicentododici', 20, 90, 78]
    ]
  };
  const euro = n => new Intl.NumberFormat('it-IT', {style:'currency', currency:'EUR'}).format(n);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const save = cart => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) { /* Browser storage may be disabled. */ } };
  const id = (section, index) => section + ':' + index;
  function row(section, index) {
    if (catalog[section]) return catalog[section][index];
    if (section === 'offerta') return ['Menù del giorno in offerta', 25];
  }
  function controls(section, index) {
    const item = row(section, index), key = id(section, index);
    if (!item) return null;
    const wrap = document.createElement('div');
    wrap.className = 'order-controls';
    wrap.setAttribute('aria-label', 'Quantità: ' + item[0]);
    const minus = document.createElement('button'), count = document.createElement('output'), plus = document.createElement('button');
    minus.type = plus.type = 'button';
    minus.textContent = '−'; plus.textContent = '+';
    minus.setAttribute('aria-label', 'Togli una porzione di ' + item[0]);
    plus.setAttribute('aria-label', 'Aggiungi una porzione di ' + item[0]);
    count.setAttribute('aria-label', 'Quantità');
    function refresh() { count.textContent = read()[key]?.qty || 0; updateBadge(); }
    for (const [button, delta] of [[minus, -1], [plus, 1]]) button.addEventListener('click', () => {
      const cart = read(), next = Math.max(0, Math.min(99, (cart[key]?.qty || 0) + delta));
      if (next) cart[key] = {qty:next, name:item[0], price:item[1]}; else delete cart[key];
      save(cart); refresh();
    });
    wrap.append(minus, count, plus); refresh();
    window.addEventListener('pageshow', refresh);
    return wrap;
  }
  function updateBadge() {
    const badge = document.querySelector('[data-order-count]');
    if (badge) badge.textContent = Object.values(read()).reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }
  function bar() {
    const a = document.createElement('a');
    a.href = 'ordine.html'; a.className = 'order-bar';
    a.innerHTML = 'Riepilogo preordine · <span data-order-count>0</span>';
    document.body.append(a); updateBadge();
  }
  function setupMenu(section) {
    const img = document.querySelector('.menu-img');
    if (!img) return;
    const frame = document.createElement('div'); frame.className = 'order-board';
    img.parentNode.insertBefore(frame, img); frame.append(img);
    const drinks = section === 'bibite-vini' ? document.createElement('div') : null;
    if (drinks) { drinks.className = 'order-drinks-grid'; frame.after(drinks); }
    catalog[section].forEach((item, index) => {
      const control = controls(section, index);
      if (drinks) {
        const entry = document.createElement('div'), label = document.createElement('span');
        label.textContent = item[0] + ' · ' + euro(item[1]);
        entry.append(label, control); drinks.append(entry);
      } else {
        control.classList.add('order-on-image');
        control.style.left = item[2] + '%'; control.style.top = item[3] + '%';
        frame.append(control);
      }
    });
    bar();
  }
  function setupDaily() {
    const price = document.querySelector('.daily-price');
    if (!price) return;
    price.after(controls('offerta', 0)); bar();
  }
  function setupSummary() {
    const list = document.querySelector('[data-order-list]'), total = document.querySelector('[data-order-total]');
    if (!list || !total) return;
    function render() {
      list.replaceChildren(); let sum = 0;
      Object.values(read()).forEach(item => {
        if (!item || !Number.isInteger(item.qty) || item.qty < 1 || !Number.isFinite(item.price)) return;
        sum += item.price * item.qty;
        const li = document.createElement('li');
        const label = document.createElement('span'); label.textContent = item.qty + ' × ' + item.name;
        const price = document.createElement('strong'); price.textContent = euro(item.price * item.qty);
        li.append(label, price); list.append(li);
      });
      if (!list.children.length) { const li = document.createElement('li'); li.textContent = 'Nessun piatto selezionato. Scegli dal menù.'; list.append(li); }
      total.textContent = euro(sum);
    }
    render();
    window.addEventListener('pageshow', render);
    const form = document.querySelector('[data-order-form]');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const cart = read(), dishes = [];
      Object.values(cart).forEach(item => {
        if (item && Number.isInteger(item.qty) && item.qty > 0) dishes.push(item.qty + ' × ' + item.name + ' — ' + euro(item.qty * item.price));
      });
      if (!dishes.length) { list.focus(); return; }
      if (cart['primi:2']?.qty === 1) { window.alert('Il risotto richiede almeno due porzioni.'); return; }
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const lines = ['Buongiorno Controcorrente, vorrei richiedere questo preordine:', '', ...dishes,
        'Totale piatti e bevande: ' + total.textContent, '',
        'Nome e cognome: ' + data.get('nome'), 'Telefono: ' + data.get('telefono'),
        'Persone: ' + data.get('persone'), 'Data: ' + data.get('data'),
        'Orario richiesto: ' + data.get('orario'),
        'Allergie / note: ' + (data.get('note') || 'Nessuna nota'), '',
        'Attendo la vostra conferma via WhatsApp entro le 18:30.'];
      const whatsappUrl = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(lines.join('\n'));
      try { localStorage.removeItem(KEY); } catch (_) { /* Browser storage may be disabled. */ }
      render();
      window.location.href = whatsappUrl;
    });
    const date = form.elements.data;
    const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    date.min = today; date.value = today;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const page = location.pathname.split('/').pop().replace(/\.html$/, '');
    if (catalog[page]) setupMenu(page);
    if (page === 'offerta') setupDaily();
    if (page === 'ordine') setupSummary();
  });
})();
