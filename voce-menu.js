/* Assistente vocale a risposte predefinite: sola lettura dei menu pubblicati. */
(() => {
  'use strict';
  const normalize = value => String(value || '').toLocaleLowerCase('it-IT')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const clean = value => String(value || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const price = value => clean(value).replace(/€/g, 'euro');
  const LIMIT = 'Ti rispondo solo sui menù di Controcorrente: pranzo, cena, piatti, prezzi e offerte.';
  let previousService = null;
  let previousTerms = [];
  let lastList = null;

  async function readPage(path) {
    const response = await fetch(path, {cache: 'no-store', credentials: 'omit', signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined});
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

  const vocabulary = new Set(('menu pranzo cena stasera mezzogiorno mezzodi serale offerta offerte fisso fissi completo coppia coppie aperitivo antipasti primi secondi piatto piatti portata portate mangiare mangia mangio cibo cucina pietanze proposta proposte pasta riso risotto carne pesce verdura verdure pizza dolce dolci dessert vino vini bibita bibite bevanda bevande birra caffe prezzo prezzi costa costano costo quanto viene vengono spendo ingrediente ingredienti contiene contengono dentro allergeni allergia allergie vegetariano vegano glutine lattosio prenotazione prenotare ordinare ordine'.split(' ')));
  const ignored = new Set(('quanto costa costano costo prezzo prezzi cosa che quale quali qual avete hai aveteci ci c ce cene posso potrei vorrei voglio volevo sapere dimmi dici spiegami raccontami elenca leggere leggimi parla parlami racconta descrivi ingredienti ingrediente contiene contengono dentro fatto fatta preparato preparata preparate preparazione composto composta comprende comprendono incluso inclusi include vengono viene spendere spendo pagare sono siete essere faccio fai fa e ed i il lo la le gli un una uno di del della delle dei degli con al alla alle nel nella nei per da a mi me si serve menu pranzo cena offerta offerte stasera sera mezzogiorno mezzodi serale piatto piatti portata portate proposta proposte pietanza pietanze antipasto antipasti primo primi secondo secondi fisso fissi completo completi coppia coppie oggi domani adesso invece anche oppure poi favore grazie cortesemente gentilmente piacere piacerebbe qualcosa qualche trovare trovo disponibile disponibili cibo cucina mangiare mangia mangio mangiate bere pranzo cenare pranzare ristorante controcorrente questo questa questi queste quello quella quelli quelle suo sua suoi sue tutto tutti tutte sulla sul sui sulle ancora altri altro altre continua continuare elenco lista tanto poco veramente buon buono buona buoni buone aveteci diciamo'.split(' ')));
  function canonical(word) {
    if (/^gamber/.test(word)) return 'gamber';
    if (/^pomodor/.test(word)) return 'pomodor';
    if (/^zucchin/.test(word)) return 'zucchin';
    if (/^(maial|suin|porco)/.test(word)) return 'maial';
    if (/^(branzin|spigol)/.test(word)) return 'branzin';
    if (/^(fung|champignon)/.test(word)) return 'fung';
    if (/^(manzo|bovin)/.test(word)) return 'carne';
    return word.length > 3 ? word.replace(/[aeio]$/, '') : word;
  }
  function courseOf(dish) {
    if (dish.course && dish.course !== 'menu-fissi') return dish.course;
    if (/\b(linguine|spaghetti|tagliatelle|conchigliette|fusilli|risotto|riso|pasta|gnocchi|gnocchetti|farfalle|bucatini|orecchiette)\b/.test(normalize(dish.name))) return 'primi';
    return 'secondi';
  }
  function chooseAnswer(question, data) {
    const q = normalize(question);
    const words = q.split(' ');
    if (/\b(modifica|modificare|elimina|cancella|pubblica|aggiorna|codice|password|account|amministratore)\b/.test(q) ||
      /\b(cambia|cambiare|aggiungi)\b.*\b(sito|prezzo|pagina|menu)\b/.test(q)) return LIMIT;
    if (/\b(politic\w*|presidente|governo|meteo|tempo atmosferico|calcio|partita|guerra|oroscopo|computer|programmare|bitcoin|borsa|elezioni|capitale|storia|matematica)\b/.test(q)) return LIMIT;
    if (/\b(qr|benvenut[oi]|salut[ao]|saluto|ciao|buongiorno|buonasera)\b/.test(q) &&
      !words.some(word => vocabulary.has(word) && !['costa','quanto'].includes(word))) return 'WELCOME';
    if (/\b(allergia|allergie|allergeni|intolleran\w*|celia\w*|senza glutine|senza lattosio|vegan\w*|vegetarian\w*)\b/.test(q)) {
      return 'Consulta gli allergeni indicati accanto ai piatti. Per allergie o esigenze alimentari, chiedi conferma al ristorante prima di ordinare.';
    }
    if (/\b(prenot\w*|ordinare|ordinazione|ordine)\b/.test(q) && !/\b(cosa|piatti|menu|quanto)\b/.test(q)) {
      return 'Per prenotare o ordinare usa i contatti del sito e attendi la conferma del ristorante.';
    }
    if (/\b(togliere|togli|sostituire|sostituisci|senza|cambiare ingrediente)\b/.test(q)) {
      return 'Per togliere o sostituire un ingrediente, chiedi conferma al ristorante prima di ordinare.';
    }
    const explicitService = /\b(pranzo|mezzogiorno|mezzodi|pranzare)\b/.test(q) ? 'pranzo'
      : /\b(cena|stasera|sera|serale|cenare)\b/.test(q) ? 'cena'
      : /\b(offert\w*)\b/.test(q) ? 'offerta'
      : /\b(vini|vino|bibit\w*|bevande|birr\w*|caffe)\b/.test(q) ? 'bibite' : null;
    let service = explicitService || previousService;
    let course = /\bantipast\w*\b/.test(q) ? 'antipasti' : /\b(prim[oi]|pasta)\b/.test(q) ? 'primi' : /\bsecond[oi]\b/.test(q) ? 'secondi' : null;
    let wantsFixed = /\b(fiss[oi]|completo|coppia|coppie|aperitivo|in due|per due|due persone)\b/.test(q);
    let category = /\bpesce\b/.test(q) ? 'pesce' : /\bcarne\b/.test(q) ? 'carne' : null;
    let terms = words.filter(word => word.length > 2 && !ignored.has(word) && !['pesce','carne','vini','vino','bibite','bevande','pasta'].includes(word)).map(canonical);
    const continued = !!lastList && (/\b(continua|continuare|altri|altre|altro|ancora)\b/.test(q) || /^(e )?poi$/.test(q)) && (!explicitService || explicitService === lastList.service);
    const listing = /\b(menu|lista|elenco|mangiare|mangio|portate|proposte|piatti)\b/.test(q) || /\b(cosa|che)\b.*\b(avete|hai|c e|trovo)\b/.test(q);
    const followup = !terms.length && !course && !wantsFixed && !category && !listing && previousTerms.length > 0;
    if (continued) {
      ({service, course, wantsFixed, category, terms} = lastList);
    } else if (followup) {
      terms = [...previousTerms];
    }
    if (wantsFixed && !explicitService) service = null; // comprende anche il menù completo nelle offerte
    if (course && !service) service = 'cena';
    let dishes = data.dishes.filter(dish => !service || dish.service === service);
    if (course) dishes = dishes.filter(dish => courseOf(dish) === course && !dish.fixed);
    if (wantsFixed) dishes = dishes.filter(dish => dish.fixed);
    if (category) dishes = dishes.filter(dish => category === 'pesce'
      ? /tonno|salmone|branzino|orata|mare|gamber|calamar|seppi|cozze|vongole|alici/.test(normalize(dish.name))
      : /pollo|maiale|suino|salsiccia|guanciale|speck|prosciutto|pancetta|carne/.test(normalize(dish.name + ' ' + dish.description)));
    let named = false;
    if (terms.length) {
      const scored = dishes.map(dish => {
        const tokens = normalize(dish.name + ' ' + dish.description).split(' ').map(canonical);
        return {dish, score: terms.filter(term => tokens.includes(term)).length};
      });
      const best = Math.max(0, ...scored.map(item => item.score));
      if (best) {
        dishes = scored.filter(item => item.score === best).map(item => item.dish);
        named = true;
      } else {
        const domainQuestion = words.some(word => vocabulary.has(word)) || followup || continued;
        if (!domainQuestion) return LIMIT;
        if (!listing && !course && !wantsFixed && !category) return 'Non trovo quel piatto nel menù pubblicato. Quale piatto intendi?';
      }
    }
    const domainQuestion = words.some(word => vocabulary.has(word)) || named || followup || continued;
    if (!domainQuestion) return LIMIT;
    if (!service && !named && !wantsFixed) return 'Vuoi il menù pranzo, il menù cena oppure le offerte?';
    if (!dishes.length) return 'Non trovo questa proposta nel menù pubblicato. Chiedi al ristorante per altre disponibilità.';
    if (explicitService) previousService = explicitService;
    if (named) previousTerms = [...terms];
    else if (!continued) previousTerms = [];
    const offset = continued ? lastList.index : 0;
    const selected = dishes.slice(offset, offset + 3);
    if (!selected.length) return 'Queste erano tutte le proposte del menù pubblicato.';
    lastList = {service, course, wantsFixed, category, terms: named ? [...terms] : [], index: offset + selected.length};
    const lunchNote = service === 'pranzo'
      ? 'Menù pranzo pubblicato per ' + (data.lunchDate || 'la data indicata sul sito') + '. '
      : service === 'cena' ? 'Per cena: ' : service === 'offerta' ? 'Tra le offerte: ' : '';
    const ambiguous = !service && new Set(selected.map(dish => dish.service)).size > 1;
    const answer = selected.map(dish => (ambiguous ? (dish.service === 'pranzo' ? 'A pranzo: ' : dish.service === 'cena' ? 'A cena: ' : 'Nelle offerte: ') : '') + dishLine(dish, named || wantsFixed)).join(' ');
    const fixedNote = selected.some(dish => dish.service === 'offerta' && dish.fixed)
      ? 'Il menù completo costa ' + data.fixedPrice + '. ' : '';
    const suffix = dishes.length > offset + 3 ? 'Posso continuare con le altre proposte.' : '';
    return lunchNote + answer + fixedNote + suffix;
  }
  window.ControcorrenteMenuVoice = Object.freeze({
    reset() { previousService = null; previousTerms = []; lastList = null; },
    async answer(question) {
      const q = normalize(question);
      if (/\b(modifica|modificare|elimina|cancella|pubblica|aggiorna|codice|password|account|amministratore)\b/.test(q) ||
        /\b(cambia|cambiare|aggiungi)\b.*\b(sito|prezzo|pagina|menu)\b/.test(q)) return LIMIT;
      if (/\b(politic\w*|presidente|governo|meteo|tempo atmosferico|calcio|partita|guerra|oroscopo|computer|programmare|bitcoin|borsa|elezioni|capitale|storia|matematica)\b/.test(q)) return LIMIT;
      if (/^(ciao|buongiorno|buonasera|benvenuto|benvenuti|saluta|saluto|saluta i clienti|fai il benvenuto)$/.test(q) || /\bqr\b/.test(q)) return 'WELCOME';
      try { return chooseAnswer(question, await catalog()); }
      catch (_) { return 'Non riesco a leggere i menù aggiornati. Riprova fra un momento o consulta le pagine del sito.'; }
    }
  });
})();
