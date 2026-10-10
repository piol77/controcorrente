/* Assistente vocale a risposte predefinite: sola lettura dei menu pubblicati. */
(() => {
  'use strict';
  const normalize = value => String(value || '').toLocaleLowerCase('it-IT')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\bmenuu?\b/g, 'menu').replace(/\brisot([oi])\b/g, 'risott$1')
    .replace(/\bgorgonzolla\b/g, 'gorgonzola').replace(/\bgambereti\b/g, 'gamberetti')
    .replace(/\bbransino\b/g, 'branzino').replace(/\bcapuccino\b/g, 'cappuccino');
  const clean = value => String(value || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const price = value => clean(value).replace(/€/g, 'euro');
  const LIMIT = 'Non posso rispondere a queste domande. Posso aiutarti con i menù di Controcorrente.';
  let previousService = null;
  let previousTerms = [];
  let lastList = null;
  let lastShown = [];
  let lastAnswer = '';

  function outsideScope(q) {
    return /\b(modifica|modificare|elimina|cancella|pubblica|aggiorna|codice|password|account|amministratore|login)\b/.test(q) ||
      /\b(cambia|cambiare|aggiungi)\b.*\b(sito|prezzo|pagina|menu)\b/.test(q) ||
      /\b(politic\w*|presidente|governo|meteo|calcio|partita|guerra|oroscopo|computer|programmare|bitcoin|borsa|elezioni|capitale|storia|matematica|cinema|film|musica|notizie|traffico|treno|aereo|farmacia|medico|salute|piove|piovera|pioggia|nevica|neve)\b/.test(q) ||
      /\b(che tempo fa|che tempo fara|tempo atmosferico|previsioni del tempo|quanto fa|radice quadrata|chi ha vinto|che ore sono|come si cucina|dammi la ricetta)\b/.test(q);
  }
  function smallTalk(q) {
    if (/^(ciao|salve|ehi|buongiorno|buonasera|buon pomeriggio)( a tutti| a te)?$/.test(q)) return 'Ciao! Dimmi pure.';
    if (/^(ciao )?(come stai|come va|tutto bene)( grazie)?$/.test(q)) return 'Tutto bene, grazie! Cosa ti va di mangiare?';
    if (/^(ci sei|mi senti|riesci a sentirmi|mi ascolti|prova|uno due tre)$/.test(q)) return 'Sì, ti sento. Dimmi pure.';
    if (/^(ho fame|abbiamo fame|vorrei mangiare|vorremmo mangiare|cosa mi consigli|cosa ci consigli|consigliami qualcosa)$/.test(q)) return 'Volentieri. Preferisci il menù pranzo, la cena oppure le offerte?';
    if (/^(chi sei|come ti chiami|cosa sei)$/.test(q)) return 'Sono l’assistente audio di Controcorrente. Dimmi cosa cerchi nel menù.';
    if (/^(grazie|grazie mille|molte grazie|perfetto grazie|ok grazie|va bene grazie|ti ringrazio|gentilissimo|gentilissima)$/.test(q)) return 'Figurati!';
    if (/^(no|no grazie|basta|va bene cosi|a posto|arrivederci|buona giornata|buona serata)$/.test(q)) return 'Va bene, a presto!';
    if (/^(benvenuto|benvenuti|saluta|saluto|saluta i clienti|fai il benvenuto)$/.test(q)) return 'Benvenuti al Controcorrente!';
    if (/^(non ho capito|ripeti|puoi ripetere|me lo ripeti|ripeti per favore)$/.test(q)) return lastAnswer || 'Quale menù ti interessa, pranzo o cena?';
    return null;
  }

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
      allergens: [...article.querySelectorAll('.allergen-badge')].map(node => clean(node.getAttribute('title'))).filter(Boolean),
      fixed: !!article.closest('#menu-fissi, .daily-fixed-menu')
    })).filter(dish => dish.name);
  }

  async function catalog() {
    const [lunch, dinner, offers, drinks] = await Promise.all(
      ['pranzo.html', 'cena.html', 'offerta.html', 'bibite-vini.html'].map(readPage));
    return {
      dishes: [...readDishes(lunch, 'pranzo'), ...readDishes(dinner, 'cena'),
        ...readDishes(offers, 'offerta'), ...readDishes(drinks, 'bibite')],
      lunchDate: clean(lunch.querySelector('.lunch-date')?.textContent),
      lunchISO: lunch.querySelector('.lunch-date time')?.getAttribute('datetime'),
      fixedPrice: price(offers.querySelector('.daily-fixed-menu .daily-price')?.textContent)
    };
  }

  function dishLine(dish, details = false) {
    return dish.name + (dish.price ? ', ' + dish.price : '') + '. ' + (details && dish.description ? dish.description + ' ' : '');
  }

  const vocabulary = new Set(('menu pranzo cena stasera mezzogiorno mezzodi serale offerta offerte fisso fissi completo coppia coppie aperitivo antipasti primi secondi piatto piatti portata portate mangiare mangia mangio cibo cucina pietanze proposta proposte pasta riso risotto carne pesce mare verdura verdure pizza dolce dolci dessert vino vini bibita bibite bevanda bevande birra acqua caffe cappuccino prezzo prezzi costa costano costo quanto viene vengono spendo ingrediente ingredienti contiene contengono dentro allergeni allergia allergie vegetariano vegano glutine lattosio prenotazione prenotare ordinare ordine economico economica caro cara conveniente leggero leggera fritto fritta griglia forno porzione porzioni'.split(' ')));
  const ignored = new Set(('quanto costa costano costo prezzo prezzi cosa che quale quali qual avete avreste hai aveteci ci c ce cene posso potrei vorrei vorremmo voglio volevamo volevo sapere dimmi ditemi dici spiegami raccontami elenca leggere leggimi parla parlami racconta descrivi ingredienti ingrediente contiene contengono dentro fatto fatta preparato preparata preparate preparazione composto composta comprende comprendono incluso inclusi include vengono viene spendere spendo pagare sono siete sarebbe sarebbero essere faccio fai fa e ed i il lo la le gli un una uno di del della delle dei degli con al alla alle nel nella nei per da a mi me si serve menu pranzo cena offerta offerte stasera sera mezzogiorno mezzodi serale piatto piatti portata portate proposta proposte pietanza pietanze antipasto antipasti primo primi secondo secondi fisso fissi completo completi coppia coppie oggi domani adesso invece anche oppure poi favore grazie cortesemente gentilmente piacere piacerebbe qualcosa qualche trovare trovo disponibile disponibili disponibilita cibo cucina mangiare mangia mangio mangiate bere pranzo cenare pranzare ristorante controcorrente questo questa questi queste quello quella quelli quelle suo sua suoi sue tutto tutti tutte sulla sul sui sulle ancora altri altro altre continua continuare elenco lista tanto poco veramente davvero buon buono buona buoni buone aveteci diciamo magari tipo genere circa sapresti potreste potete puoi puo proponi proponete servite offrite avete consiglia consigliami consiglieresti consigliereste cercavo cerco andrebbe va voglia preferisco preferirei preferiremmo interessa interessano mostrami fammi dire dammi dare sapere').split(' '));
  function canonical(word) {
    if (/^gamber/.test(word)) return 'gamber';
    if (/^pomodor/.test(word)) return 'pomodor';
    if (/^zucchin/.test(word)) return 'zucchin';
    if (/^(maial|suin|porco)/.test(word)) return 'maial';
    if (/^(branzin|spigol)/.test(word)) return 'branzin';
    if (/^(fung|champignon)/.test(word)) return 'fung';
    if (/^(manzo|bovin)/.test(word)) return 'carne';
    if (/^(patat)/.test(word)) return 'patat';
    if (/^(melanzan)/.test(word)) return 'melanzan';
    if (/^(cozz)/.test(word)) return 'cozz';
    if (/^(vongol)/.test(word)) return 'vongol';
    if (/^(calamar)/.test(word)) return 'calamar';
    if (/^(fritt)/.test(word)) return 'fritt';
    if (/^(grigli)/.test(word)) return 'grigli';
    if (/^(verdura|vegetal)/.test(word)) return 'verdur';
    return word.length > 3 ? word.replace(/[aeio]$/, '') : word;
  }
  function distance(a, b) {
    const row = [...Array(b.length + 1).keys()];
    for (let i = 1; i <= a.length; i += 1) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const saved = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
        previous = saved;
      }
    }
    return row[b.length];
  }
  function similar(a, b) {
    if (a === b) return true;
    if (Math.min(a.length, b.length) < 4) return false;
    const tolerance = Math.max(a.length, b.length) >= 8 ? 2 : 1;
    return distance(a, b) <= tolerance;
  }
  const numberWords = Object.freeze({uno:1, una:1, un:1, due:2, tre:3, quattro:4, cinque:5, sei:6, sette:7, otto:8, nove:9, dieci:10});
  function numericPrice(value) {
    const match = String(value || '').match(/\d+(?:[,.]\d+)?/);
    return match ? Number(match[0].replace(',', '.')) : NaN;
  }
  function euro(value) {
    return value.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' euro';
  }
  function quantityIn(q) {
    const match = q.match(/\b(\d+|uno|una|un|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+(?:porzioni?|piatti?|risott\w*|spaghett\w*|frittur\w*)\b/);
    return match ? (numberWords[match[1]] || Number(match[1])) : null;
  }
  function referenceIn(q) {
    if (!lastShown.length) return null;
    if (/\b(l ultimo|ultima|quello ultimo|quella ultima)\b/.test(q)) return lastShown.at(-1);
    const match = q.match(/(?:^|\b)(?:e )?(?:quello|quella|il piatto|la proposta|il|la)?\s*(primo|prima|secondo|seconda|terzo|terza)\b/);
    const index = match ? {primo:0, prima:0, secondo:1, seconda:1, terzo:2, terza:2}[match[1]] : -1;
    if (index >= 0 && lastShown[index]) return lastShown[index];
    if (/\b(questo|questa|quello|quella|quel piatto|questa proposta)\b/.test(q) && lastShown.length === 1) return lastShown[0];
    return null;
  }
  function courseOf(dish) {
    if (dish.course && dish.course !== 'menu-fissi') return dish.course;
    if (/\b(linguine|spaghetti|tagliatelle|conchigliette|fusilli|risotto|riso|pasta|gnocchi|gnocchetti|farfalle|bucatini|orecchiette)\b/.test(normalize(dish.name))) return 'primi';
    return 'secondi';
  }
  function chooseAnswer(question, data) {
    const q = normalize(question);
    const words = q.split(' ');
    if (outsideScope(q)) return LIMIT;
    const social = smallTalk(q);
    if (social) return social;
    if (/\bqr\b/.test(q)) return 'Il QR code è esposto nel locale: apre il sito con i menù del pranzo, della cena e le offerte.';
    const asksAllergens = /\b(allergia|allergie|allergeni|intolleran\w*|celia\w*|glutine|lattosio)\b/.test(q);
    if (/\b(vegan\w*|vegetarian\w*)\b/.test(q)) {
      return 'Il menù pubblicato non classifica i piatti come vegani o vegetariani. Posso leggerti ingredienti e allergeni, ma chiedi conferma al ristorante prima di ordinare.';
    }
    if (asksAllergens && !/\b(risott\w*|spaghett\w*|linguin\w*|fusill\w*|salmone|tonno|branzino|spigola|maiale|gamber\w*|frittur\w*|grigliat\w*|aperitivo|piatto|proposta)\b/.test(q)) {
      return 'Consulta gli allergeni indicati accanto ai piatti. Per allergie o esigenze alimentari, chiedi conferma al ristorante prima di ordinare.';
    }
    if (/\b(prenot\w*|ordinare|ordinazione|ordine)\b/.test(q) && !/\b(cosa|piatti|menu|quanto)\b/.test(q)) {
      return 'Non posso effettuare prenotazioni o ordini. Per contattare il ristorante usa la pagina Contatti del sito.';
    }
    if (/\b(togliere|togli|sostituire|sostituisci|senza|cambiare ingrediente)\b/.test(q)) {
      return 'Per togliere o sostituire un ingrediente, chiedi conferma al ristorante prima di ordinare.';
    }
    const explicitService = /\b(pranzo|mezzogiorno|mezzodi|pranzare|pausa pranzo)\b/.test(q) ? 'pranzo'
      : /\b(cena|stasera|sera|serale|cenare|questa sera)\b/.test(q) ? 'cena'
      : /\b(offert\w*|menu del giorno|proposta del giorno)\b/.test(q) ? 'offerta'
      : /\b(vini|vino|bibit\w*|bevande|bere|acqua|birr\w*|caffe|cappuccino)\b/.test(q) ? 'bibite' : null;
    let service = explicitService || previousService;
    let course = /\bantipast\w*\b/.test(q) ? 'antipasti' : /\b(prim[oi]|pasta)\b/.test(q) ? 'primi' : /\bsecond[oi]\b/.test(q) ? 'secondi' : null;
    let wantsFixed = /\b(fiss[oi]|menu completo|menu di coppia|per coppie|aperitivo)\b/.test(q) || /\b(grigliata|frittura|spaghettata)\b.*\b(coppia|due persone|per due)\b/.test(q);
    let category = /\b(pesce|mare)\b/.test(q) ? 'pesce' : /\b(carne|maiale|suino|pollo|manzo)\b/.test(q) ? 'carne' : null;
    const cheapest = /\b(piu economico|piu economica|meno caro|meno cara|costa meno|minor prezzo|conveniente)\b/.test(q);
    const dearest = /\b(piu caro|piu cara|costa di piu|maggior prezzo)\b/.test(q);
    const budgetMatch = q.match(/\b(?:sotto|entro|massimo|max|meno di|non oltre)\s*(?:i|gli)?\s*(\d+(?:[,.]\d+)?)\s*(?:euro)?\b/);
    const budget = budgetMatch ? Number(budgetMatch[1].replace(',', '.')) : null;
    const nonTerms = new Set(['ciao','salve','buongiorno','buonasera','senti','ascolta','pesce','mare','carne','vini','vino','bibite','bevande','pasta','consigli','consiglio','consigliami','consiglieresti','consigliare','servite','servi','offrite','proponete','servono','come','era','stavo','stavamo','pensando','economico','economica','economici','economiche','caro','cara','cari','care','conveniente','massimo','entro','sotto','meno','oltre','prezzo','euro','piu']);
    let terms = words.filter(word => word.length > 2 && !ignored.has(word) && !nonTerms.has(word) && !/^\d+$/.test(word)).map(canonical);
    const reference = referenceIn(q);
    if (reference) {
      lastShown = [reference];
      previousService = reference.service;
      previousTerms = normalize(reference.name).split(' ').filter(word => word.length > 3).map(canonical);
      const allergenText = reference.allergens?.length ? ' Gli allergeni indicati sono: ' + reference.allergens.join(', ') + '.' : '';
      const detail = reference.description ? ' ' + reference.description : '';
      return dishLine(reference) + detail + (asksAllergens ? allergenText || ' Controlla la tabella allergeni e chiedi conferma al ristorante.' : '');
    }
    const continued = !!lastList && (/\b(continua|continuare|altri|altre|altro|ancora)\b/.test(q) || /^(e )?poi$/.test(q) || /^(si|certo|va bene|ok|dimmi pure|vai avanti)( grazie)?$/.test(q)) && (!explicitService || explicitService === lastList.service);
    const listing = /\b(menu|lista|elenco|mangiare|mangio|portata|portate|proposta|proposte|piatto|piatti|pietanza|pietanze|consigli\w*|voglia)\b/.test(q) || /\b(cosa|che|quale|quali)\b.*\b(avete|avreste|hai|c e|trovo|servite|proponete|offrite)\b/.test(q);
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
      ? /tonno|salmone|branzino|orata|mare|gamber|calamar|seppi|cozze|vongole|alici/.test(normalize(dish.name + ' ' + dish.description))
      : /pollo|maiale|suino|salsiccia|guanciale|speck|prosciutto|pancetta|carne/.test(normalize(dish.name + ' ' + dish.description)));
    if (budget !== null) dishes = dishes.filter(dish => Number.isFinite(numericPrice(dish.price)) && numericPrice(dish.price) <= budget);
    let named = false;
    if (terms.length) {
      const scored = dishes.map(dish => {
        const names = normalize(dish.name).split(' ').map(canonical);
        const ingredients = normalize(dish.description).split(' ').map(canonical);
        const score = terms.reduce((total, term) => {
          if (names.some(candidate => similar(term, candidate))) return total + 4;
          if (ingredients.some(candidate => similar(term, candidate))) return total + 2;
          return total;
        }, 0);
        return {dish, score};
      });
      const best = Math.max(0, ...scored.map(item => item.score));
      if (best) {
        dishes = scored.filter(item => item.score === best).map(item => item.dish);
        named = true;
      } else {
        const domainQuestion = words.some(word => vocabulary.has(word) && !['prezzo','prezzi','costa','costano','costo','quanto','viene','vengono','spendo'].includes(word)) || followup || continued;
        if (!domainQuestion) return LIMIT;
        if (!listing && !course && !wantsFixed && !category) return 'Non trovo quel piatto nel menù pubblicato. Quale piatto intendi?';
      }
    }
    const domainQuestion = words.some(word => vocabulary.has(word)) || named || followup || continued;
    if (!domainQuestion) return LIMIT;
    if (!service && !named && !wantsFixed) return 'Vuoi il menù pranzo, il menù cena oppure le offerte?';
    if (!dishes.length) return 'Non trovo questa proposta nel menù pubblicato. Chiedi al ristorante per altre disponibilità.';
    if (cheapest || dearest) dishes.sort((a, b) => (numericPrice(a.price) - numericPrice(b.price)) * (dearest ? -1 : 1));
    if (/\b(quanti|quante|numero di)\b/.test(q)) {
      const label = course === 'primi' ? 'primi' : course === 'secondi' ? 'secondi' : course === 'antipasti' ? 'antipasti' : 'proposte';
      return 'Nel menù pubblicato trovo ' + dishes.length + ' ' + label + '.';
    }
    if (explicitService) previousService = explicitService;
    if (named) previousTerms = [...terms];
    else if (!continued) previousTerms = [];
    const offset = continued ? lastList.index : 0;
    const selected = dishes.slice(offset, offset + 3);
    if (!selected.length) return 'Queste erano tutte le proposte del menù pubblicato.';
    lastList = {service, course, wantsFixed, category, terms: named ? [...terms] : [], index: offset + selected.length};
    lastShown = [...selected];
    const lunchNote = service === 'pranzo'
      ? 'Menù pranzo pubblicato per ' + (data.lunchDate || 'la data indicata sul sito') + '. '
      : service === 'cena' ? 'Per cena: ' : service === 'offerta' ? 'Tra le offerte: ' : '';
    const ambiguous = !service && new Set(selected.map(dish => dish.service)).size > 1;
    let answer = selected.map(dish => (ambiguous ? (dish.service === 'pranzo' ? 'A pranzo: ' : dish.service === 'cena' ? 'A cena: ' : dish.service === 'bibite' ? 'Tra le bevande: ' : 'Nelle offerte: ') : '') + dishLine(dish, named || wantsFixed || asksAllergens)).join(' ');
    if (asksAllergens && selected.length === 1) {
      answer += selected[0].allergens?.length ? ' Gli allergeni indicati sono: ' + selected[0].allergens.join(', ') + '. ' : ' Controlla la tabella allergeni e chiedi conferma al ristorante. ';
    }
    const quantity = quantityIn(q);
    if (named && selected.length === 1 && quantity && Number.isFinite(numericPrice(selected[0].price))) {
      const minimum = /minimo 2 porzioni/.test(normalize(selected[0].description)) ? 2 : 1;
      const effective = Math.max(quantity, minimum);
      answer += (quantity < minimum ? 'Per questo piatto il minimo è 2 porzioni. ' : '') + 'Per ' + effective + ' porzioni il totale è ' + euro(numericPrice(selected[0].price) * effective) + '. ';
    }
    const fixedNote = selected.some(dish => dish.service === 'offerta' && dish.fixed)
      ? 'Il menù completo costa ' + data.fixedPrice + '. ' : '';
    const suffix = dishes.length > offset + 3 ? 'Posso continuare con le altre proposte.' : '';
    return lunchNote + answer + fixedNote + suffix;
  }
  window.ControcorrenteMenuVoice = Object.freeze({
    reset() { previousService = null; previousTerms = []; lastList = null; lastShown = []; lastAnswer = ''; },
    async answer(question) {
      const q = normalize(question);
      if (outsideScope(q)) return LIMIT;
      const social = smallTalk(q);
      if (social) return social;
      if (/\bqr\b/.test(q)) return 'Il QR code è esposto nel locale: apre il sito con i menù del pranzo, della cena e le offerte.';
      if (/^(si|certo|va bene|ok|dimmi pure)( grazie)?$/.test(q) && !lastList) return 'Dimmi pure: ti interessa il pranzo o la cena?';
      try {
        const answer = chooseAnswer(question, await catalog());
        if (answer !== LIMIT) lastAnswer = answer;
        return answer;
      }
      catch (_) { return 'Non riesco a leggere i menù aggiornati. Riprova fra un momento o consulta le pagine del sito.'; }
    }
  });
})();
