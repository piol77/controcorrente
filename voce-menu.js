/* Assistente vocale a risposte predefinite: sola lettura dei menu pubblicati. */
(() => {
  'use strict';
  const normalize = value => String(value || '').toLocaleLowerCase('it-IT')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const clean = value => String(value || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const price = value => clean(value).replace(/€/g, 'euro');
  const LIMIT = 'Posso parlare soltanto dei menù, dei prezzi, delle offerte, del QR code e dei contatti di Controcorrente. Non posso modificare il sito o confermare prenotazioni.';
  let previousService = 'cena';

  async function readPage(path) {
    const response = await fetch(path, {cache: 'no-store', credentials: 'omit'});
    if (!response.ok) throw new Error('Menu non disponibile');
    return new DOMParser().parseFromString(await response.text(), 'text/html');
  }

  function readDishes(doc, service) {
    return [...doc.querySelectorAll('main article.dish, #menu-fissi .fixed-inclusions-grid article')].map(article => ({
      service,
      name: clean(article.querySelector('h3, h2')?.textContent),
      description: clean(article.querySelector('.dish-description')?.textContent ||
        (article.closest('#menu-fissi') ? [...article.querySelectorAll('p')].map(p => p.textContent).join(' ') : '')),
      price: price(article.querySelector('.dish-price, .fixed-inclusion-price')?.textContent),
      course: article.closest('[data-order-section]')?.getAttribute('data-order-section') || '',
      fixed: !!article.closest('#menu-fissi, .daily-fixed-menu')
    })).filter(dish => dish.name);
  }

  async function catalog() {
    const [lunch, dinner, offers, drinks, contacts] = await Promise.all(
      ['pranzo.html', 'cena.html', 'offerta.html', 'bibite-vini.html', 'contatti.html'].map(readPage));
    return {
      dishes: [...readDishes(lunch, 'pranzo'), ...readDishes(dinner, 'cena'),
        ...readDishes(offers, 'offerta'), ...readDishes(drinks, 'bibite')],
      lunchDate: clean(lunch.querySelector('.lunch-date')?.textContent),
      lunchISO: lunch.querySelector('.lunch-date time')?.getAttribute('datetime'),
      fixedPrice: price(offers.querySelector('.daily-fixed-menu .daily-price')?.textContent),
      contactText: [...contacts.querySelectorAll('main > p, main > .offer')]
        .map(node => {
          const copy = node.cloneNode(true);
          copy.querySelectorAll('br').forEach(br => br.replaceWith(' · '));
          return clean(copy.textContent);
        }).join(' ')
    };
  }

  function dishLine(dish, details = false) {
    return dish.name + (dish.price ? ', ' + dish.price : '') + '. ' + (details && dish.description ? dish.description + ' ' : '');
  }

  function chooseAnswer(question, data) {
    const q = normalize(question);
    if (/\b(modifica|modificare|cambia|cambiare|elimina|cancella|pubblica|aggiorna|aggiungi|codice|password|account|amministratore)\b/.test(q)) return LIMIT;
    if (/\b(allergia|allergie|allergeni|intolleran\w*|celia\w*|senza glutine)\b/.test(q)) {
      return 'Gli allergeni sono indicati accanto a ogni piatto e nella pagina Allergeni. Comunica sempre le tue allergie al ristorante prima di ordinare, per verificare ingredienti e preparazione.';
    }
    if (/\b(qr|benvenut[oi]|salut[ao]|saluto|ciao|buongiorno|buonasera)\b/.test(q) && !/\b(menu|pranzo|cena|offert\w*)\b/.test(q)) return 'WELCOME';
    if (/\b(prenot\w*|telefono|contatt\w*|indirizzo|dove|orari|aperto|apertura|coperto)\b/.test(q)) {
      return data.contactText + ' Per prenotare usa i contatti del sito e attendi la conferma del ristorante. Questa voce non registra prenotazioni.';
    }
    let service = /\bpranzo\b/.test(q) ? 'pranzo' : /\b(cena|stasera|sera)\b/.test(q) ? 'cena'
      : /\b(offert\w*)\b/.test(q) ? 'offerta' : /\b(vini|vino|bibit\w*|bevande|birr\w*|caffe)\b/.test(q) ? 'bibite' : null;
    const course = /\bantipast\w*\b/.test(q) ? 'antipasti' : /\bprim[oi]\b/.test(q) ? 'primi' : /\bsecond[oi]\b/.test(q) ? 'secondi' : null;
    const wantsFixed = /\b(fiss[oi]|completo|coppia|coppie|aperitivo)\b/.test(q);
    if (service) previousService = service;
    if (course && !service) service = previousService;
    let dishes = data.dishes.filter(dish => !service || dish.service === service);
    if (course && service === 'cena') dishes = dishes.filter(dish => dish.course === course);
    if (wantsFixed) dishes = dishes.filter(dish => dish.fixed);
    const ignored = new Set('quanto costa costano prezzo prezzi cosa che avete posso vorrei sapere dimmi descrivi racconta ingredienti contiene contengono come fatto fatta sono e i il lo la le gli un una di del della delle dei con al alla nel per da a mi me si serve menu pranzo cena offerta offerte stasera sera piatto piatti antipasti primi secondi fisso fissi completo coppia coppie'.split(' '));
    const terms = q.split(' ').filter(word => word.length > 2 && !ignored.has(word));
    const named = terms.length ? dishes.filter(dish => {
      const words = normalize(dish.name).split(' ');
      return terms.every(term => words.includes(term));
    }) : [];
    if (named.length) dishes = named;
    else if (terms.length && !/\b(menu|piatti|antipasti|primi|secondi|offerte|bibite|vini|bevande)\b/.test(q)) return LIMIT;
    else if (!service && !course && !wantsFixed && !/\bmenu\b/.test(q)) return LIMIT;
    if (!service && !named.length && !wantsFixed) return 'Vuoi conoscere il menù pranzo, il menù cena oppure le offerte? Premi di nuovo il microfono e specifica quale.';
    if (!dishes.length) return 'Non trovo questa proposta nel menù pubblicato. Consulta la pagina del menù o chiedi al ristorante.';
    const lunchNote = service === 'pranzo'
      ? 'Menù pranzo pubblicato per ' + (data.lunchDate || 'la data indicata sul sito') + '. '
      : service === 'cena' || service === 'offerta' ? 'Proposte valide a cena o a pranzo nei festivi. ' : '';
    const answer = lunchNote + dishes.slice(0, 5).map(dish => dishLine(dish, named.length > 0 || wantsFixed)).join(' ');
    const fixedNote = dishes.some(dish => dish.service === 'offerta' && dish.fixed)
      ? 'Il menù completo costa ' + data.fixedPrice + '. ' : '';
    return answer + fixedNote + (dishes.length > 5 ? 'Ci sono altre proposte nella pagina del menù; puoi chiedere il nome di un piatto o una portata. ' : '') + 'Disponibilità da confermare con il ristorante.';
  }

  window.ControcorrenteMenuVoice = Object.freeze({
    async answer(question) {
      const q = normalize(question);
      // Benvenuto e rifiuto dei comandi di scrittura non richiedono rete.
      if (/\b(modifica|modificare|cambia|cambiare|elimina|cancella|pubblica|aggiorna|aggiungi|password|account|amministratore)\b/.test(q)) return LIMIT;
      if (/\b(qr|benvenut[oi]|salut[ao]|saluto|ciao|buongiorno|buonasera)\b/.test(q) && !/\b(menu|pranzo|cena|offert\w*)\b/.test(q)) return 'WELCOME';
      try { return chooseAnswer(question, await catalog()); }
      catch (_) { return 'Non riesco a leggere i menù aggiornati. Consulta le pagine del sito o chiedi al ristorante; non posso confermare piatti e prezzi.'; }
    }
  });
})();
