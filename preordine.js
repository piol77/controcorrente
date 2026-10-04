(function () {
  'use strict';
  const KEY = 'controcorrente-preordine-v1';
  const PHONE = '393272292006';
  const catalog = {"antipasti": [["Bruschette con crema di zucca e speck croccante (2 pezzi)", 10], ["Gamberetti* in salsa rosa", 10], ["Funghi champignon fritti", 10]], "primi": [["Spaghetti ai frutti di mare", 15], ["Conchigliette verdure, zafferano e croccante di guanciale", 12.5], ["Risotto barbabietola e gorgonzola (minimo due porzioni)", 12.5], ["Linguine crema di zucchine, avocado e gamberetti*", 12.5]], "secondi": [["Frittura mista di alici, calamari e gamberetti*", 20], ["Filetti di suino al bacon e fichi", 14], ["Filetto di branzino al limone", 14], ["Trancio di salmone all’arancia e pepe rosa", 14]]};
  const euro = n => new Intl.NumberFormat('it-IT', {style:'currency', currency:'EUR'}).format(n);
  const read = () => { try {
    const cart = JSON.parse(localStorage.getItem(KEY)) || {};
    return Object.fromEntries(Object.entries(cart).filter(([key, item]) =>
      !key.startsWith('bibite-vini:') && item && Number.isInteger(item.qty) && item.qty > 0 && Number.isFinite(item.price)).map(([key,item])=>{ const [section,index]=key.split(':'); const current=catalog[section]?.[Number(index)]; return [key,current ? {...item,name:current[0],price:current[1]} : item]; }));
  } catch (_) { return {}; } };
  const save = cart => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) { /* Browser storage may be disabled. */ } };
  const id = (section, index) => section + ':' + index;
  function row(section, index) {
    if (catalog[section]) return catalog[section][index];
  }
  const service = section => section === 'pranzo' ? 'pranzo' : 'cena';
  let lunchDate = '';
  function readLunchDate(doc) {
    lunchDate = doc.querySelector('.lunch-date time')?.getAttribute('datetime') || '';
  }
  function todayInRome() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function isHoliday(day) {
    const date = new Date(day + 'T12:00:00Z');
    if (date.getUTCDay() === 0) return true;
    // Italian public holidays and San Giovanni, patron of Torino (24 June).
    if (['01-01','01-06','04-25','05-01','06-02','06-24','08-15','10-04','11-01','12-08','12-25','12-26'].includes(day.slice(5))) return true;
    // Gregorian Easter: also allow Easter Monday at lunch.
    const y = date.getUTCFullYear(), a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
    const monday = new Date(Date.UTC(y, Math.floor(n / 31) - 1, n % 31 + 2));
    return day === monday.toISOString().slice(0, 10);
  }
  function checkLunchDate(requestedDay) {
    if (lunchDate && lunchDate === requestedDay) return true;
    const cart = read();
    Object.keys(cart).filter(key => key.startsWith('pranzo:')).forEach(key => delete cart[key]);
    save(cart);
    window.dispatchEvent(new Event('order-date-invalid'));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(lunchDate) ? lunchDate.split('-').reverse().join('/') : '';
    window.alert(date
      ? 'Il menù pranzo del ' + date + ' non è valido per il giorno scelto (' + requestedDay.split('-').reverse().join('/') + '). Non è possibile ordinare questi piatti. La selezione pranzo è stata azzerata.'
      : 'La data del menù pranzo non è disponibile. Non è possibile ordinare questi piatti. La selezione pranzo è stata azzerata.');
    return false;
  }
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
    window.addEventListener('order-date-invalid', refresh);
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
    document.querySelectorAll('[data-order-section="'+section+'"]').forEach((dish,index)=>dish.append(controls(section,index)));
  }
  function setupDaily(section) {
    catalog[section] = dailyCatalog(document, section);
    reconcileDaily(section);
    if (section === 'pranzo') {
      readLunchDate(document);
      document.querySelectorAll('.lunch-dish').forEach((dish, index) => {
        const item = catalog[section][index];
        if (item[0] && Number.isFinite(item[1])) dish.append(controls(section, index));
      });
    } else if (catalog[section].length) {
      const individual = document.querySelectorAll('.daily-menu:not(.daily-fixed-menu) .daily-dish');
      individual.forEach((dish, index) => dish.append(controls(section, index)));
      document.querySelectorAll('.daily-fixed-menu').forEach((menu, index) => {
        menu.querySelector('.fixed-bottom').append(controls(section, individual.length + index));
      });
    }
    if (catalog[section].length) bar();
  }
  async function setupSummary() {
    const list = document.querySelector('[data-order-list]'), total = document.querySelector('[data-order-total]');
    if (!list || !total) return;
    const form = document.querySelector('[data-order-form]');
    const submit = form.querySelector('[type="submit"]');
    const dayInput = form.querySelector('[name="giorno"]');
    dayInput.min = todayInRome();
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
          if (section === 'pranzo') readLunchDate(doc);
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
      document.querySelector('[data-add-dishes]').href = isLunch() ? 'pranzo.html' : 'cena.html';
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
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!menuReady) return;
      dayInput.min = todayInRome();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const requestedDay = String(data.get('giorno') || '');
      if (isLunch()) {
        await refreshDaily();
        if (!menuReady) return;
        if (!checkLunchDate(requestedDay)) { render(); list.focus(); return; }
      }
      const cart = read(), dishes = [];
      Object.values(cart).forEach(item => {
        if (item && Number.isInteger(item.qty) && item.qty > 0) dishes.push(item.qty + ' × ' + item.name + ' — ' + euro(item.qty * item.price));
      });
      if (!dishes.length) { list.focus(); return; }
      if (cart['primi:2']?.qty === 1) { window.alert('Il risotto richiede almeno due porzioni.'); return; }
      const requestedTime = String(data.get('orario') || '');
      const minutes = (() => {
        const parts = requestedTime.split(':').map(Number);
        return parts.length === 2 && parts.every(Number.isFinite) ? parts[0] * 60 + parts[1] : NaN;
      })();
      const lunchTime = Number.isFinite(minutes) && minutes >= 11 * 60 && minutes <= 15 * 60;
      const dinnerTime = Number.isFinite(minutes) && minutes >= 18 * 60;
      const holiday = isHoliday(requestedDay);
      const weekday = new Date(requestedDay + 'T12:00:00Z').getUTCDay();
      const wrongService = isLunch()
        ? !lunchTime || weekday === 6 || holiday
        : !dinnerTime && !(lunchTime && holiday);
      if (wrongService) {
        const message = isLunch()
          ? 'I piatti selezionati dal Menù di pranzo sono validi solo a pranzo, nel giorno sotto indicato (11:00–15:00), esclusi sabato, domenica e festivi. L’ordine è stato azzerato.'
          : 'I piatti selezionati dal Menù cena o dall’Offerta del giorno sono validi solo a cena (dalle 18:00), o a pranzo nei festivi (11:00–15:00). L’ordine è stato azzerato.';
        try { localStorage.removeItem(KEY); } catch (_) { /* Browser storage may be disabled. */ }
        form.reset();
        render();
        window.alert(message);
        list.focus();
        return;
      }
      const lines = ['Buongiorno Controcorrente, vorrei richiedere questo preordine:', '', ...dishes,
        'Servizio: ' + (lunchTime ? 'Pranzo' : 'Cena'), 'Totale piatti: ' + total.textContent, '',
        'Nome e cognome: ' + data.get('nome'),
        'Persone: ' + data.get('persone'), 'Giorno: ' + requestDate(requestedDay),
        'Orario richiesto: ' + data.get('orario'),
        'Allergie / note: ' + (data.get('note') || 'Nessuna nota'), '',
        'Attendo la vostra conferma via WhatsApp entro le ' + (lunchTime ? '12' : '18:30') + '. Il tavolo e i piatti sono confermati solo dopo la risposta del Ristorante.'];
      const whatsappUrl = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(lines.join('\n'));
      try { localStorage.removeItem(KEY); } catch (_) { /* Browser storage may be disabled. */ }
      render();
      if (window.__DEMO_OPEN_WHATSAPP) window.__DEMO_OPEN_WHATSAPP(whatsappUrl); else window.location.href = whatsappUrl;
    });
    function requestDate(day) {
      return new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }).format(new Date(day + 'T12:00:00Z'));
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const page = (window.__DEMO_ROUTE || location.pathname.split('/').pop()).split('#')[0].replace(/\.html$/, '');
    if (page === 'cena') { ['antipasti','primi','secondi'].forEach(setupMenu); bar(); }
    if (page === 'offerta' || page === 'pranzo') setupDaily(page);
    if (page === 'ordine') setupSummary();
  });
})();