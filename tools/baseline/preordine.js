(function () {
  'use strict';
  const KEY = 'controcorrente-preordine-v1';
  const PHONE = '393272292006';
  const catalog = {
    antipasti: [
      ['Bruschette con crema di zucca e speck croccante (2 pezzi)', 10, 92, 28.06],
      ['Gamberetti* in salsa rosa', 10, 92, 50.07],
      ['Funghi champignon fritti', 10, 92, 69.73]
    ],
    primi: [
      ['Spaghetti ai frutti di mare', 15, 92, 25.85],
      ['Conchigliette verdure, zafferano e croccante di guanciale', 12.5, 92, 44.63],
      ['Risotto barbabietola e gorgonzola (minimo due porzioni)', 12.5, 92, 61.00],
      ['Linguine crema di zucchine, avocado e gamberetti*', 12.5, 92, 79.78]
    ],
    secondi: [
      ['Frittura mista di alici, calamari e gamberetti*', 20, 92, 26.79],
      ['Filetti di suino al bacon e fichi', 14, 92, 45.05],
      ['Filetto di branzino al limone', 14, 92, 62.53],
      ['Trancio di salmone all’arancia e pepe rosa', 14, 92, 81.18]
    ]
  };
  const euro = n => new Intl.NumberFormat('it-IT', {style:'currency', currency:'EUR'}).format(n);
  const read = () => { try {
    const cart = JSON.parse(localStorage.getItem(KEY)) || {};
    return Object.fromEntries(Object.entries(cart).filter(([key, item]) =>
      !key.startsWith('bibite-vini:') && item && Number.isInteger(item.qty) && item.qty > 0 && Number.isFinite(item.price)));
  } catch (_) { return {}; } };
  const save = cart => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) { /* Browser storage may be disabled. */ } };
  const id = (section, index) => section + ':' + index;
  function row(section, index) {
    if (catalog[section]) return catalog[section][index];
  }
  const service = section => section === 'pranzo' ? 'pranzo' : 'cena';
  const priceNumber = text => Number((text.match(/\d+(?:[.,]\d+)?/) || [NaN])[0].toString().replace(',', '.'));
  function dailyCatalog(doc, section) {
    if (section === 'pranzo') return Array.from(doc.querySelectorAll('.lunch-dish')).map(dish =>
      [dish.querySelector('h3')?.textContent.trim(), priceNumber(dish.querySelector('strong')?.textContent || '')]);
    const individual = Array.from(doc.querySelectorAll('.daily-menu:not(.daily-fixed-menu) .daily-dish')).map(dish => [
      dish.querySelector('h2')?.textContent.trim(),
      priceNumber(dish.querySelector('.daily-dish-price')?.textContent || '')
    ]).filter(([name, price]) => name && Number.isFinite(price));
    const fixed = Array.from(doc.querySelectorAll('.daily-fixed-menu')).map(menu => {
      const dishes = Array.from(menu.querySelectorAll('.daily-dish h2')).map(el => el.textContent.trim());
      const price = priceNumber(menu.querySelector('.daily-price strong')?.textContent || '');
      return ['Menù completo: ' + dishes.join('; '), price];
    }).filter(([name, price]) => name && Number.isFinite(price));
    return individual.concat(fixed);
  }
  function dailyKey(section, item) { return section + ':' + encodeURIComponent(item[0]); }
  function reconcileDaily(section) {
    const cart = read();
    for (const key of Object.keys(cart)) {
      if (!key.startsWith(section + ':')) continue;
      const item = catalog[section].find(item => dailyKey(section, item) === key);
      if (item) { cart[key].name = item[0]; cart[key].price = item[1]; }
      else delete cart[key];
    }
    save(cart);
  }
  function controls(section, index) {
    const item = row(section, index);
    if (!item) return null;
    const key = ['pranzo', 'offerta'].includes(section) ? dailyKey(section, item) : id(section, index);
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
      if (delta > 0 && Object.keys(cart).some(k => service(k.split(':')[0]) !== service(section))) {
        window.alert('Pranzo e cena richiedono ordini separati. Completa la richiesta già iniziata prima di aggiungere questi piatti.'); return;
      }
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
    catalog[section].forEach((item, index) => {
      const control = controls(section, index);
        control.classList.add('order-on-image');
        control.style.left = item[2] + '%'; control.style.top = item[3] + '%';
        frame.append(control);
    });
    bar();
  }
  function setupDaily(section) {
    catalog[section] = dailyCatalog(document, section);
    reconcileDaily(section);
    if (section === 'pranzo') {
      document.querySelectorAll('.lunch-dish').forEach((dish, index) => {
        const item = catalog[section][index];
        if (item[0] && Number.isFinite(item[1])) dish.append(controls(section, index));
      });
    } else if (catalog[section].length) {
      const individual = document.querySelectorAll('.daily-menu:not(.daily-fixed-menu) .daily-dish');
      individual.forEach((dish, index) => dish.after(controls(section, index)));
      document.querySelectorAll('.daily-fixed-menu').forEach((menu, index) => {
        menu.querySelector('.daily-price').after(controls(section, individual.length + index));
      });
    }
    if (catalog[section].length) bar();
  }
  async function setupSummary() {
    const list = document.querySelector('[data-order-list]'), total = document.querySelector('[data-order-total]');
    if (!list || !total) return;
    const form = document.querySelector('[data-order-form]');
    const submit = form.querySelector('[type="submit"]');
    const reset = form.querySelector('[data-reset-order]');
    let menuReady = false;
    async function refreshDaily() {
      submit.disabled = true; menuReady = false;
      try {
        for (const section of ['pranzo', 'offerta']) {
          if (!Object.keys(read()).some(key => key.startsWith(section + ':'))) continue;
          const response = await fetch(section + '.html', {cache:'no-store'});
          if (!response.ok) throw new Error('menu');
          const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
          if (!doc.querySelector(section === 'pranzo' ? '.lunch-board' : '.daily-menu')) throw new Error('menu');
          catalog[section] = dailyCatalog(doc, section); reconcileDaily(section);
        }
        menuReady = true;
      } catch (_) { list.textContent = 'Impossibile aggiornare il menù. Ricarica la pagina prima di inviare.'; }
      submit.disabled = !menuReady;
      if (menuReady) render();
    }
    function isLunch() { return Object.keys(read()).some(key => key.startsWith('pranzo:')); }
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
      document.querySelector('[data-service-info]').innerHTML = isLunch()
        ? 'Pranzo: acqua, caffè e coperto inclusi. <strong>Attendere la conferma del Ristorante entro le 12 per considerare valido l’ordine.</strong>'
        : 'Cena: per le richieste inviate entro le 18:00, confermiamo entro le 18:30. Il coperto serale è 1,50 € a persona; prenotando tavolo e menù entro le 18:00 è omaggio. <strong>Attendere la conferma del Ristorante per considerare valido l’ordine.</strong>';
      document.querySelector('[data-add-dishes]').href = isLunch() ? 'pranzo.html' : 'antipasti.html';
    }
    render();
    reset.addEventListener('click', () => {
      try { localStorage.removeItem(KEY); } catch (_) { /* Browser storage may be disabled. */ }
      form.reset();
      render();
      list.focus();
    });
    window.addEventListener('pageshow', refreshDaily);
    refreshDaily();
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!menuReady) return;
      const cart = read(), dishes = [];
      Object.values(cart).forEach(item => {
        if (item && Number.isInteger(item.qty) && item.qty > 0) dishes.push(item.qty + ' × ' + item.name + ' — ' + euro(item.qty * item.price));
      });
      if (!dishes.length) { list.focus(); return; }
      if (cart['primi:2']?.qty === 1) { window.alert('Il risotto richiede almeno due porzioni.'); return; }
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const requestedTime = String(data.get('orario') || '');
      const minutes = (() => {
        const parts = requestedTime.split(':').map(Number);
        return parts.length === 2 && parts.every(Number.isFinite) ? parts[0] * 60 + parts[1] : NaN;
      })();
      const lunchTime = Number.isFinite(minutes) && minutes >= 11 * 60 && minutes <= 15 * 60;
      const dinnerTime = Number.isFinite(minutes) && minutes >= 18 * 60;
      const wrongService = (isLunch() && !lunchTime) || (!isLunch() && !dinnerTime);
      if (wrongService) {
        const message = isLunch()
          ? 'I piatti selezionati dal Menù di pranzo sono validi solo a pranzo (11:00–15:00). L’ordine è stato azzerato.'
          : 'I piatti selezionati da Antipasti, Primi, Secondi o Offerta del giorno sono validi solo a cena (dalle 18:00). L’ordine è stato azzerato.';
        try { localStorage.removeItem(KEY); } catch (_) { /* Browser storage may be disabled. */ }
        form.reset();
        render();
        window.alert(message);
        list.focus();
        return;
      }
      const lines = ['Buongiorno Controcorrente, vorrei richiedere questo preordine:', '', ...dishes,
        'Servizio: ' + (isLunch() ? 'Pranzo' : 'Cena'), 'Totale piatti: ' + total.textContent, '',
        'Nome e cognome: ' + data.get('nome'),
        'Persone: ' + data.get('persone'), 'Giorno: ' + requestDate(),
        'Orario richiesto: ' + data.get('orario'),
        'Allergie / note: ' + (data.get('note') || 'Nessuna nota'), '',
        'Attendo la vostra conferma via WhatsApp entro le ' + (isLunch() ? '12' : '18:30') + '. Il tavolo e i piatti sono confermati solo dopo la risposta del Ristorante.'];
      const whatsappUrl = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(lines.join('\n'));
      try { localStorage.removeItem(KEY); } catch (_) { /* Browser storage may be disabled. */ }
      render();
      window.location.href = whatsappUrl;
    });
    function requestDate() {
      return new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }).format(new Date());
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const page = location.pathname.split('/').pop().replace(/\.html$/, '');
    if (catalog[page]) setupMenu(page);
    if (page === 'offerta' || page === 'pranzo') setupDaily(page);
    if (page === 'ordine') setupSummary();
  });
})();
