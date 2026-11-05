(() => {
  'use strict';
  const navStyle = document.createElement('style');
  navStyle.textContent = 'header.top nav a{font-size:16px}';
  document.head.append(navStyle);

  // Shared anonymous counts; preserve the original once-per-tab session flag.
  const API = 'https://countapi.mileshilliard.com/api/v1/';
  const PREFIX = 'piol77_controcorrente_visits_6ae6fd00_';
  const countedKey = 'controcorrente-visitor-counted-v1';
  const valuesKey = 'controcorrente-visitor-values-v1';
  const get = key => { try { return sessionStorage.getItem(key); } catch (_) { return null; } };
  const set = (key, value) => { try { sessionStorage.setItem(key, value); } catch (_) {} };
  function dayKey() {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    return PREFIX + 'day_' + ['year','month','day'].map(type => parts.find(item => item.type === type).value).join('');
  }
  function show(data, failed = false) {
    const previous = document.querySelector('[data-visitor-counter]');
    if (!previous) return;
    let counter = previous;
    if (previous.tagName === 'IMG') {
      counter = document.createElement('span');
      counter.setAttribute('data-visitor-counter', '');
      counter.setAttribute('role', 'status');
      counter.style.cssText = 'display:inline-block;margin-top:8px;padding:6px 12px;border:1px solid var(--gold);border-radius:3px;color:var(--ink);font-size:1rem;line-height:1.5';
      previous.replaceWith(counter);
    }
    counter.textContent = data ? 'Oggi: ' + data.today_hits.toLocaleString('it-IT') +
      ' · Totale: ' + data.total_hits.toLocaleString('it-IT') :
      failed ? 'Contatore non raggiungibile. Riprova tra poco.' : 'Caricamento contatore…';
  }
  async function request(action, key) {
    const response = await fetch(API + action + '/' + key + '?request=' + Date.now(), {
      cache:'no-store', credentials:'omit',
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
    });
    if (action === 'get' && response.status === 404 && key.includes('_day_')) return 0;
    if (!response.ok) throw new Error('Counter unavailable');
    const json = await response.json();
    const value = Number(json.value);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid count');
    return value;
  }
  let pending = false;
  let retryScheduled = false;
  const today = dayKey();
  async function update(readOnly = false) {
    if (pending) return;
    pending = true;
    try {
      const alreadyCounted = get(countedKey) === '1';
      const keys = [PREFIX + 'total', today];
      const values = await Promise.all(keys.map(key => {
        const attemptedKey = 'cc-visit-attempt-v2-' + key;
        const action = readOnly || alreadyCounted || get(attemptedKey) === '1' ? 'get' : 'hit';
        // Never retry an uncertain increment: recovery only reads the values.
        if (action === 'hit') set(attemptedKey, '1');
        return request(action, key);
      }));
      const data = {total_hits:values[0], today_hits:values[1]};
      set(countedKey, '1');
      set(valuesKey, JSON.stringify(data));
      show(data);
    } catch (_) {
      let cached;
      try { cached = JSON.parse(get(valuesKey)); } catch (_) {}
      const valid = cached && Number.isSafeInteger(cached.total_hits) && Number.isSafeInteger(cached.today_hits);
      show(valid ? cached : null, true);
      if (!retryScheduled) {
        retryScheduled = true;
        window.setTimeout(() => update(true), 3000);
      }
    } finally { pending = false; }
  }
  show(null);
  update();
})();

// BEGIN RADIO ON CLICK STATISTICS 2026-11-05
// One click on ON per browser/day and per browser lifetime (from 5 November 2026).
// Separate counters from listening sessions and from page visits; no identifiers sent.
(() => {
  'use strict';
  const prefix='piol77_controcorrente_radio_unique_on_20261105_';
  const endpoint='https://countapi.mileshilliard.com/api/v1/';
  const totalKey=prefix+'total';
  const todayKey=() => {
    const p=new Intl.DateTimeFormat('en-CA',{
      timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(new Date());
    const find=type=>p.find(x=>x.type===type).value;
    return find('year')+find('month')+find('day');
  };
  const currentDayKey=()=>prefix+'day_'+todayKey();
  const stat=document.querySelector('[data-radio-click-stats]');
  let loading=false;
  const markOnce=(key)=>{
    try {
      if(localStorage.getItem(key)==='1')return false;
      localStorage.setItem(key,'1');
      return true;
    } catch (_) { return false; }
  };
  async function hitOrGet(action,key) {
    const response=await fetch(endpoint+action+'/'+key+'?t='+Date.now(),{
      cache:'no-store',credentials:'omit',
      signal:typeof AbortSignal!=='undefined'&&AbortSignal.timeout?AbortSignal.timeout(10000):undefined
    });
    if(action==='get'&&response.status===404)return 0;
    if(!response.ok)throw new Error('Radio statistic unavailable');
    const data=await response.json();
    const count=Number(data.value);
    if(!Number.isSafeInteger(count)||count<0)throw new Error('Invalid radio counter');
    return count;
  }
  function render(today,total) {
    if(!stat)return;
    stat.querySelector('[data-radio-click-today]').textContent=
      Number.isSafeInteger(today)?today.toLocaleString('it-IT'):'–';
    stat.querySelector('[data-radio-click-total]').textContent=
      Number.isSafeInteger(total)?total.toLocaleString('it-IT'):'–';
    stat.setAttribute('aria-label',
      'Browser che hanno acceso la radio oggi: '+(Number.isSafeInteger(today)?today:'non disponibile')+
      '. Totale da oggi: '+(Number.isSafeInteger(total)?total:'non disponibile'));
  }
  async function refresh() {
    if(!stat||loading)return;
    loading=true;
    try {
      const [today,total]=await Promise.all([
        hitOrGet('get',currentDayKey()),hitOrGet('get',totalKey)]);
      render(today,total);
    } catch (_) { render(null,null); }
    finally { loading=false; }
  }
  function record() {
    // Triggered ONLY by the deliberate OFF -> ON click, never by page visits or retries.
    const todayFlag='cc-radio-on-'+todayKey()+'-v1';
    const actions=[];
    if(markOnce(todayFlag))actions.push(hitOrGet('hit',currentDayKey()));
    if(markOnce('cc-radio-on-ever-v1'))actions.push(hitOrGet('hit',totalKey));
    Promise.allSettled(actions).then(()=>refresh());
  }
  window.ccRadioClickStats={record,refresh};
  if(stat) {
    render(null,null);
    refresh();
    window.setInterval(()=>{if(!document.hidden)refresh();},20000);
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  }
})();
// END RADIO ON CLICK STATISTICS 2026-11-05

// BEGIN CONTROCORRENTE RADIO TEST 2026-10-18
// Rollback radio: remove only this marked block.
(() => {
  'use strict';
  if (document.getElementById('cc-jazz-toggle')) return;
  const header = document.querySelector('header.top');
  if (!header) return;
  // Inject in every document, including internal pages attached to the shared player.
  const radioStyle = document.createElement('style');
  radioStyle.textContent = `
    .cc-radio-controls{display:flex;justify-content:flex-end;align-items:center;gap:9px;margin:8px 0 0 auto;min-height:44px}
    .cc-radio-listeners{display:inline-flex;align-items:center;min-height:28px;border:1px solid var(--gold,#cba76d);border-radius:20px;padding:1px 9px;color:var(--gold,#cba76d);font:600 11px/1.3 system-ui,sans-serif;white-space:nowrap}
    #cc-jazz-toggle{position:relative;isolation:isolate}
    #cc-jazz-toggle::before,#cc-jazz-toggle::after{content:"";position:absolute;inset:-4px;border:2px solid currentColor;box-shadow:0 0 6px rgba(203,167,109,.7);border-radius:50%;pointer-events:none;opacity:0}
    #cc-jazz-toggle[data-music-state="on"]::before,#cc-jazz-toggle[data-music-state="on"]::after{animation:cc-radio-ripple 1s ease-in-out infinite}
    #cc-jazz-toggle[data-music-state="on"]::after{inset:-9px;animation-delay:.3s;animation-direction:reverse}
    @keyframes cc-radio-ripple{0%,100%{transform:scale(.96);opacity:.95}50%{transform:scale(1.13);opacity:.5}}
    @media(prefers-reduced-motion:reduce){#cc-jazz-toggle[data-music-state="on"]::before,#cc-jazz-toggle[data-music-state="on"]::after{animation:none;opacity:.45}#cc-jazz-toggle[data-music-state="on"]::after{inset:-9px}}
  `;
  document.head.appendChild(radioStyle);
  // The top document owns the stream; internal pages keep their normal scripts
  // and share that player instead of creating one on every navigation.
  function placeRadioControls(button) {
    const holder=document.createElement('div');
    holder.className='cc-radio-controls';
    button.style.margin='0';
    const listeners=document.createElement('span');
    listeners.className='cc-radio-listeners';
    listeners.setAttribute('aria-label','Ascoltatori della radio dal sito');
    listeners.title='Ascoltatori attivi';
    listeners.textContent='–';
    holder.append(button,listeners);
    const brandRow=header.querySelector('.brand-row');
    if(brandRow)brandRow.insertAdjacentElement('afterend',holder);
    else header.appendChild(holder);
    return listeners;
  }
  let owner;
  try { if (window.parent !== window) owner = window.parent.ccJazzPlayer; } catch (_) {}
  if (owner) {
    const button = owner.button.cloneNode(true);
    button.addEventListener('click', owner.toggle);
    const listeners=placeRadioControls(button);
    owner.attach(button, window, listeners);
    // Preserve the existing preorder redirect outside the persistent page frame.
    window.__DEMO_OPEN_WHATSAPP = url => { window.top.location.href = url; };
    return;
  }
  const preferenceKey = 'cc-jazz-session-enabled-v2';
  let enabled = false;
  // Una nuova apertura parte sempre spenta; nelle navigazioni interne il
  // player già acceso resta invece condiviso come prima.
  try { sessionStorage.removeItem(preferenceKey); } catch (_) {}
  let pending = false;
  let failed = false;
  let attempt = 0;
  let audible = false;
  const audio = document.createElement('audio');
  audio.preload = 'none';
  audio.volume = 1;
  audio.setAttribute('playsinline', '');
  const button = document.createElement('button');
  button.id = 'cc-jazz-toggle';
  button.type = 'button';
  button.style.cssText = 'display:block;margin:8px 0 0 auto;width:44px;height:44px;padding:4px;border:1px solid var(--gold,#cba76d);border-radius:50%;background:var(--navy,#082a43);color:var(--gold,#cba76d);font-size:18px;line-height:1;cursor:pointer;';
  let activeButton = button;
  let activeListenerBadge=null;
  let listenerCount=null;
  let listenerPending=false;
  let listenerOffRequested=false;
  const listenerApi='https://lgjijnhhnjioiyvfmkvy.supabase.co/functions/v1/radio-premi';
  const listenerKey='cc-radio-listener-session-v1';
  let listenerSession=null;
  try {
    listenerSession=sessionStorage.getItem(listenerKey);
    if (!listenerSession && window.crypto && typeof crypto.randomUUID==='function') {
      listenerSession=crypto.randomUUID();
      sessionStorage.setItem(listenerKey,listenerSession);
    }
  } catch (_) {
    if (window.crypto && typeof crypto.randomUUID==='function') listenerSession=crypto.randomUUID();
  }
  function renderListenerCount(){
    const label=Number.isSafeInteger(listenerCount) && listenerCount>=0
      ? String(listenerCount) : '–';
    const title='Ascoltatori';
    for(const el of [ownListenersRef(),activeListenerBadge]){
      if(!el)continue;
      el.textContent=label;
      el.title=title;
    }
  }
  let ownListenerBadge=null;
  function ownListenersRef(){return ownListenerBadge;}
  async function updateListenerPresence(forceOff=false){
    // Le richieste alla radio restano sempre indipendenti dal refresh pagina.
    // Se durante una richiesta l'utente spegne la radio, accoda l'OFF.
    if(listenerPending){
      if(forceOff)listenerOffRequested=true;
      return;
    }
    const playing=!forceOff && enabled && audible && !audio.paused && !failed;
    if(!listenerSession && playing)return;
    listenerPending=true;
    const ctrl=new AbortController();
    const timeout=window.setTimeout(()=>ctrl.abort(),6500);
    try{
      const request=playing||forceOff
        ? {method:'POST',headers:{'Content-Type':'application/json'},
           body:JSON.stringify({action:'listener_presence',session:listenerSession,playing}),
           cache:'no-store',credentials:'omit',keepalive:forceOff,signal:ctrl.signal}
        : {method:'GET',cache:'no-store',credentials:'omit',signal:ctrl.signal};
      const response=await fetch(listenerApi,request);
      if(!response.ok)throw new Error('Listener service unavailable');
      const data=await response.json();
      if(Number.isSafeInteger(data.listeners)&&data.listeners>=0){
        listenerCount=data.listeners;
        renderListenerCount();
      }
    }catch(_){
      listenerCount=null;
      renderListenerCount();
    }finally{
      window.clearTimeout(timeout);
      listenerPending=false;
      if(listenerOffRequested){
        listenerOffRequested=false;
        updateListenerPresence(true);
      }
    }
  }
  // Poll continuo anche con radio spenta, per mostrare chi è rimasto in ascolto.
  window.setInterval(()=>updateListenerPresence(),5000);
  window.addEventListener('focus',()=>updateListenerPresence());
  window.addEventListener('pageshow',()=>updateListenerPresence());
  window.addEventListener('pagehide',()=>{
    if(!listenerSession)return;
    // Congedo immediato anche se la pagina viene chiusa: il server
    // smette comunque di contare la sessione dopo 12 secondi.
    try{
      if(navigator.sendBeacon)navigator.sendBeacon(listenerApi,
        new Blob([JSON.stringify({action:'listener_presence',
          session:listenerSession,playing:false})],{type:'text/plain'}));
    }catch(_){}
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)updateListenerPresence();
  });

  function render() {
    const playing = enabled && audible && !audio.paused && !failed;
    const label = playing ? 'OFF · Spegni la musica' : pending
      ? 'OFF · Annulla avvio della musica' : failed
      ? 'ON · Radio non disponibile: tocca per riprovare'
      : 'ON · Accendi la musica';
    const icon = '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false" style="display:block;margin:0 auto;pointer-events:none">'
      + '<path d="M9 18V5l12-2v13M9 8l12-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<ellipse cx="6" cy="18" rx="3" ry="2.5" fill="currentColor"/><ellipse cx="18" cy="16" rx="3" ry="2.5" fill="currentColor"/>'
      + (playing || pending ? '<path d="M3 3l18 18" stroke="var(--navy,#082a43)" stroke-width="5"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '') + '</svg>';
    for (const target of new Set([button, activeButton])) {
      target.innerHTML = icon + '<span aria-hidden="true" style="display:block;font:700 9px/1.1 system-ui;letter-spacing:.04em;pointer-events:none">' + (playing || pending ? 'OFF' : 'ON') + '</span>';
      target.setAttribute('aria-label', label);
      target.setAttribute('aria-pressed', String(playing));
      target.setAttribute('data-music-state', playing ? 'on' : 'off');
      target.title = label;
      target.style.boxShadow = playing ? '0 0 0 2px var(--gold,#cba76d)' : 'none';
    }
  }
  function remember() {
    try { sessionStorage.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch (_) {}
  }
  // CONTROCORRENTE RADIO JINGLE 2026-11-04
  // Jingle classico su orologio di Torino: 06:00, 06:10, 06:20 ...;
  // annunci premio indipendenti in dieci slot server giornalieri, mai sovrapposti.
  // Solo il documento proprietario del player annuncia: no doppioni nei frame.
  const romeToday = () => {
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(new Date());
    return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
  };
  // Prima delle 06:00 italiane nessun messaggio pubblicitario.
  function beforeSixRome(){
    const parts=new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/Rome',hour:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date());
    return Number(parts.find(p=>p.type==='hour')?.value)<6;
  }
  // Il fuso di Torino ha offset interi in ore; gli slot di 10 min coincidono con UTC.
  const nextClassicDelayMs=()=>Math.max(1000,10*60*1000-(Date.now()%(10*60*1000)));
  const JINGLE_TEXT = 'Questa è la radio preferita dal Controcorrente di Torino.';
  const JINGLE_ENDINGS = [
    'Qui la musica non paga il coperto.',
    'Il ritmo è servito, senza attesa.',
    'Un brano tira l’altro. Proprio come le patatine.',
    'Buone vibrazioni, senza prenotazione.',
    'Anche le note meritano un bel tavolo.',
    'Qui il volume non arriva mai sul conto.',
    'La musica è l’unica cosa che non si raffredda.',
    'Tra un piatto e l’altro, una bella canzone.'
  ];
  let jingleTimer = null;
  let lastJingleEndingIndex = -1;
  let jingleWatchdog = null;
  let jingleUtterance = null;
  let jingleBusy = false;
  let jingleGeneration = 0;
  // Radio Premi: un codice viene pronunciato una volta per finestra d'annuncio
  // sul dispositivo in ascolto. La fonte è il backend privato, non il browser.
  let promoOnAir = null;
  let promoLastFetched = 0;
  let promoLastSpokenAt = 0;
  // Non annunciare il codice subito dopo il click sulla radio.
  let promoAllowedAt = Number.POSITIVE_INFINITY;
  const promoSpokenPrefix = 'cc-radio-premio-annunciato-';
  const promoApi = 'https://lgjijnhhnjioiyvfmkvy.supabase.co/functions/v1/radio-premi';
  function promoAlreadySpoken(token) {
    try { return window.localStorage.getItem(promoSpokenPrefix + token) === '1'; }
    catch (_) { return false; }
  }
  function promoMarkSpoken(token) {
    try { window.localStorage.setItem(promoSpokenPrefix + token, '1'); } catch (_) {}
  }
  async function refreshRadioPromo() {
    if (!enabled || !audible || audio.paused || failed) {
      promoOnAir = null;
      return;
    }
    try {
      const response = await fetch(promoApi, {cache:'no-store',credentials:'omit'});
      if (!response.ok) throw new Error('Premi non disponibili');
      const result = await response.json();
      promoOnAir = result && result.on_air
        && /^(?:[0-9]{5}|[A-HJ-NP-Z2-9]{5})$/.test(result.on_air.code)
        && ((result.active && Number.isInteger(result.on_air.slot) && result.on_air.slot>=1 && result.on_air.slot<=10)
             || (result.on_air.demo_today === true && result.on_air.slot===0))
        ? Object.assign({},result.on_air,{promotion_active:result.active===true}) : null;
      promoLastFetched = Date.now();
      maybePlayPromo();
    } catch (_) {
      promoOnAir = null;
    }
  }
  window.setInterval(() => {
    if (enabled && audible && !audio.paused && !failed) refreshRadioPromo();
  }, 5000);
  function currentPromoAnnouncement() {
    const slot = promoOnAir;
    if (!slot || Date.now()<promoAllowedAt
      || Date.now()-promoLastFetched>15000 || !slot.available_until
      || Date.now()>=Date.parse(slot.available_until)) return null;
    const token = slot.code + '-' + slot.slot;
    const demoToday=slot.demo_today===true && romeToday()==='2026-11-05';
    if (!demoToday && promoAlreadySpoken(token)) return null;
    // Pronuncia ogni cifra come parola intera, con pause e una ripetizione
    // per evitare codici incomprensibili sui dispositivi mobili.
    const digitWords=['zero','uno','due','tre','quattro','cinque','sei','sette','otto','nove'];
    const spokenCode=slot.code.split('').map(c=>/^[0-9]$/.test(c)?digitWords[Number(c)]:c).join('. ');
    return {token,demoToday,text:'Il codice promozionale è: '+spokenCode+'. Ripeto il codice: '+spokenCode+'. Informazioni sul sito.'};
  }

  // Annunci del codice con un timer INDIPENDENTE dal jingle classico.
  function maybePlayPromo() {
    if (!enabled || !audible || audio.paused || failed || jingleBusy) return;
    const item=currentPromoAnnouncement();
    if (!item) return;
    if (item.demoToday && Date.now()-promoLastSpokenAt < 60000) return;
    playJingle('promo');
  }
  window.setInterval(maybePlayPromo,9000);
  window.addEventListener('focus',()=>{ refreshRadioPromo(); maybePlayPromo(); });
  document.addEventListener('visibilitychange',()=>{
    if (!document.hidden && enabled && !audio.paused) refreshRadioPromo();
  });


  function resetJingle() {
    jingleGeneration += 1;
    if (jingleTimer !== null) window.clearTimeout(jingleTimer);
    if (jingleWatchdog !== null) window.clearTimeout(jingleWatchdog);
    jingleTimer = null;
    jingleWatchdog = null;
    if (jingleUtterance && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    jingleUtterance = null;
    jingleBusy = false;
    audio.volume = 1;
  }

  function scheduleJingle(delay=nextClassicDelayMs()) {
    if (jingleTimer !== null || !enabled || !audible || audio.paused || failed) return;
    jingleTimer = window.setTimeout(() => {
      jingleTimer = null;
      if (!enabled || !audible || audio.paused || failed) return;
      if (beforeSixRome()) { scheduleJingle(); return; }
      // Un solo parlato alla volta; se il codice è pronto, rinvia il classico.
      const duePromo = currentPromoAnnouncement();
      if (jingleBusy ||
          (duePromo && (!duePromo.demoToday
            || Date.now()-promoLastSpokenAt >= 60000))) {
        if (!jingleBusy) maybePlayPromo();
        scheduleJingle(8000);
        return;
      }
      playJingle('classic');
      if (!jingleBusy) scheduleJingle(8000);
    }, delay);
  }

  // Controlla la cadenza anche se la radio era già accesa prima delle 06:00.
  window.setInterval(()=>{
    if(enabled && audible && !audio.paused && !failed) scheduleJingle();
  },20000);

  function playJingle(kind='classic') {
    const promoAnnouncement = kind==='promo' ? currentPromoAnnouncement() : null;
    if (kind==='promo' && !promoAnnouncement) return;
    if (promoAnnouncement && promoAnnouncement.demoToday
        && Date.now()-promoLastSpokenAt < 60000) return;
    const speech = window.speechSynthesis;
    if (!speech || typeof window.SpeechSynthesisUtterance !== 'function'
        || speech.speaking || speech.pending || jingleBusy) return;
    const generation = ++jingleGeneration;
    jingleBusy = true;
    let settled = false;
    // Mai la stessa frasetta in due jingle classici consecutivi.
    let endingIndex = Math.floor(Math.random()*JINGLE_ENDINGS.length);
    if (endingIndex===lastJingleEndingIndex)
      endingIndex=(endingIndex+1+Math.floor(Math.random()*(JINGLE_ENDINGS.length-1)))%JINGLE_ENDINGS.length;
    lastJingleEndingIndex=endingIndex;
    const classicText = JINGLE_TEXT+' '+JINGLE_ENDINGS[endingIndex];
    const utterance = new window.SpeechSynthesisUtterance(
      promoAnnouncement ? promoAnnouncement.text : classicText);
    if (promoAnnouncement) utterance.onstart = () => {
      promoLastSpokenAt = Date.now();
      if (!promoAnnouncement.demoToday) promoMarkSpoken(promoAnnouncement.token);
    };
    utterance.lang = 'it-IT';
    utterance.rate = 0.98;
    utterance.pitch = 0.82;
    utterance.volume = 1;
    const voices = speech.getVoices();
    const italian = voices.filter(voice => /^it(?:-|_)/i.test(voice.lang));
    // Prefer an explicitly identified Italian male voice; avoid named female voices.
    // Voice and pitch support depend on the device's speech synthesis engine.
    const maleItalianName = /\b(cosimo|luca|diego|giorgio|marco|matteo|andrea|alessandro|fabrizio|edoardo|riccardo|stefano|paolo|enrico|francesco|roberto|giovanni|nicola|male|uomo|maschio)\b/i;
    const femaleItalianName = /\b(elsa|isabella|alice|federica|giulia|lucia|silvia|francesca|anna|female|donna|femmina)\b/i;
    utterance.voice = italian.find(voice => maleItalianName.test(voice.name))
      || italian.find(voice => !femaleItalianName.test(voice.name))
      || italian[0] || null;
    jingleUtterance = utterance;
    function finish() {
      if (settled || generation !== jingleGeneration) return;
      settled = true;
      if (jingleWatchdog !== null) window.clearTimeout(jingleWatchdog);
      jingleWatchdog = null;
      jingleUtterance = null;
      jingleBusy=false;
      audio.volume=1;
      if(kind==='classic')scheduleJingle();
    }
    utterance.onend = finish;
    utterance.onerror = finish;
    try { if (speech.paused) speech.resume(); } catch (_) {}
    // Riduci la radio al 10% solo durante il messaggio sintetico.
    audio.volume=0.10;
    jingleWatchdog=window.setTimeout(()=>{
      if(generation!==jingleGeneration)return;
      try{speech.cancel();}catch(_){}
      finish();
    },promoAnnouncement ? 30000 : 20000);
    try{speech.speak(utterance);}catch(_){finish();}
  }
  // END CONTROCORRENTE RADIO JINGLE 2026-11-04

  function stop() {
    attempt++;
    resetJingle();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    pending = false;
    render();
  }
  function start() {
    if (!enabled || pending || (!audio.paused && !failed)) return;
    pending = true;
    const currentAttempt = ++attempt;
    failed = false;
    render();
    if (!audio.getAttribute('src')) {
      audio.src = 'https://cdn1.zetcast.net/stream';
    }
    try {
      const result = audio.play();
      if (result && typeof result.then === 'function') {
        result.then(() => { if (currentAttempt !== attempt) return; pending = false; render(); }).catch(error => {
          if (currentAttempt !== attempt) return;
          pending = false;
          failed = error.name !== 'NotAllowedError' && error.name !== 'AbortError';
          render();
        });
      } else { pending = false; }
    } catch (_) { pending = false; failed = true; render(); }
  }
  audio.addEventListener('volumechange',()=>{
    const target=jingleBusy?0.10:1;
    if(audio.volume!==target)audio.volume=target;
  });
  audio.addEventListener('playing', () => { audible = true; pending = false; failed = false; render(); scheduleJingle(); refreshRadioPromo(); updateListenerPresence(); });
  audio.addEventListener('pause', () => { audible = false; resetJingle(); render(); updateListenerPresence(true); });
  audio.addEventListener('waiting', () => { audible = false; pending = enabled; resetJingle(); render(); updateListenerPresence(true); });
  audio.addEventListener('stalled', () => { audible = false; pending = enabled; resetJingle(); render(); updateListenerPresence(true); });
  audio.addEventListener('ended', () => { audible = false; pending = false; resetJingle(); render(); updateListenerPresence(true); });
  audio.addEventListener('error', () => { audible = false; pending = false; failed = true; resetJingle(); render(); updateListenerPresence(true); });
  function toggle() {
    if (enabled && (pending || (!audio.paused && !failed))) {
      enabled = false;
      remember();
      stop();
    } else {
      enabled = true;
      // Risveglia la voce su pressione esplicita, utile sui browser mobili.
      try { window.speechSynthesis?.resume(); } catch (_) {}
      try { window.ccRadioClickStats?.record(); } catch (_) {}
      promoAllowedAt=Date.now()+60000;
      remember();
      failed = false;
      // Release any failed stream before an explicit retry.
      audio.removeAttribute('src');
      audio.load();
      start();
    }
    render();
  }
  button.addEventListener('click', toggle);
  const ownListeners=placeRadioControls(button);
  ownListenerBadge=ownListeners;
  activeListenerBadge=ownListeners;
  render();
  updateListenerPresence();
  const siteRoot = new URL('.', location.href);
  let frame = null;
  function navigate(url, push = true) {
    if (!frame) {
      frame = document.createElement('iframe');
      frame.title = 'Controcorrente';
      frame.allow = 'autoplay; geolocation; web-share';
      frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;background:var(--navy,#082a43);z-index:2147483647';
      frame.addEventListener('load', () => {
        try {
          document.title = frame.contentDocument.title;
          const url = frame.contentWindow.location.href;
          if (url !== 'about:blank' && url !== location.href) history.pushState(null, '', url);
        } catch (_) {}
      });
      frame.src = url;
      document.body.appendChild(frame);
      // Keep the original document alive for its audio, but remove it from
      // keyboard/screen-reader navigation and prevent a second scrollbar.
      for (const child of document.body.children) {
        if (child !== frame) { child.hidden = true; child.inert = true; }
      }
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      // Only the outer history owns cross-page entries (Back/Forward).
      frame.contentWindow.location.replace(url);
    }
    if (push) history.pushState(null, '', url);
  }
  function bindNavigation(view) {
    view.document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey ||
          event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest && event.target.closest('a[href]');
      if (!link || link.hasAttribute('download') ||
          (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, view.location.href);
      const current = new URL(view.location.href);
      if (url.origin !== siteRoot.origin || !url.pathname.startsWith(siteRoot.pathname) ||
          !(/\.html$/.test(url.pathname) || url.pathname === siteRoot.pathname) ||
          (url.pathname === current.pathname && url.search === current.search)) return;
      event.preventDefault();
      navigate(url.href);
    });
    function onGesture(event) {
      if (!event.isTrusted || event.target.closest?.('#cc-jazz-toggle') || failed) return;
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      start();
    }
    view.document.addEventListener('click', onGesture, { capture: true, passive: true });
    view.document.addEventListener('keydown', onGesture, { capture: true, passive: true });
  }
  window.ccJazzPlayer = {
    button, toggle,
    attach(nextButton, view, nextListenerBadge) {
      activeButton = nextButton;
      activeListenerBadge = nextListenerBadge || ownListenerBadge;
      render();
      renderListenerCount();
      bindNavigation(view);
    }
  };
  bindNavigation(window);
  window.addEventListener('popstate', () => {
    if (frame) navigate(location.href, false);
  });
  window.addEventListener('pagehide', stop);
})();
// END CONTROCORRENTE RADIO TEST 2026-10-18



// BEGIN SITE SHARING 2026-10-24 — shared across all pages, anonymous counts
(() => {
  'use strict';
  if (document.querySelector('[data-cc-share-button]')) return;
  const endpoint = 'https://countapi.mileshilliard.com/api/v1/';
  // New counters: the previous totals counted repeated taps and cannot be repaired retrospectively.
  const clickKey = 'piol77_controcorrente_share_unique_browsers_v2';
  const referralKey = 'piol77_controcorrente_referral_unique_browsers_v2';
  const clickFlag = 'cc-share-used-browser-v2';
  const referralFlag = 'cc-share-referred-browser-v2';
  function firstTime(key) {
    // Only two anonymous boolean markers: one per browser, across sessions when possible.
    // If storage is unavailable entirely, do not increment: duplicates would be misleading.
    try {
      if (localStorage.getItem(key) === '1') return false;
      localStorage.setItem(key, '1');
      return true;
    } catch (_) {
      try {
        if (sessionStorage.getItem(key) === '1') return false;
        sessionStorage.setItem(key, '1');
        return true;
      } catch (_) { return false; }
    }
  }
  function recordOnce(key, flag) {
    if (firstTime(flag)) counter('hit', key).then(refresh).catch(() => {});
  }
  let stats = null;
  const style = document.createElement('style');
  style.textContent = '.cc-share-button{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:5px 10px;border:1px solid var(--gold,#cba76d);border-radius:18px;background:transparent;color:var(--gold,#cba76d);font:12px/1.4 Arial,sans-serif;cursor:pointer;white-space:nowrap}.cc-share-button:hover,.cc-share-button:focus-visible{background:var(--gold,#cba76d);color:var(--navy,#081c30)}.cc-share-home{margin-top:9px;padding-top:9px;border-top:1px solid var(--line,#294256)}.cc-share-stats{display:block;margin-top:7px;color:var(--muted,#b6c6d2);font-size:.75rem;line-height:1.55}.cc-share-feedback{font:11px/1.5 Arial,sans-serif;color:var(--muted,#b6c6d2);margin-left:7px}#cc-notification-actions .cc-share-button{border-color:var(--line,#294256);color:var(--muted,#b6c6d2)}#cc-notification-actions .cc-share-button:hover{border-color:var(--gold,#cba76d);color:var(--gold,#cba76d);background:transparent}header.top .cc-share-button{position:relative;left:3px}';
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cc-share-button';
  button.setAttribute('data-cc-share-button','');
  button.setAttribute('aria-label','Condividi questa pagina');
  button.title = 'Condividi questa pagina';
  button.textContent = '↗ Condividi';
  const feedback = document.createElement('span');
  feedback.className = 'cc-share-feedback';
  feedback.setAttribute('role','status');

  function shareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('menu');
    url.searchParams.delete('cc_share');
    if (url.hash) {
      let realAnchor = false;
      try { realAnchor = !!document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (_) {}
      if (!realAnchor) url.hash = '';
    }
    url.searchParams.set('cc_share','1');
    return url.href;
  }
  async function counter(action,key) {
    const response = await fetch(endpoint + action + '/' + key + '?t=' + Date.now(), {
      cache:'no-store',credentials:'omit',
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    });
    if (action === 'get' && response.status === 404) return 0;
    if (!response.ok) throw new Error('Counter unavailable');
    const data = await response.json();
    const value = Number(data.value);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid counter');
    return value;
  }
  async function refresh() {
    if (!stats || document.hidden) return;
    try {
      const counts = await Promise.all([counter('get',clickKey),counter('get',referralKey)]);
      stats.textContent = 'Browser che hanno usato Condividi: ' + counts[0].toLocaleString('it-IT') +
        ' · Browser arrivati da link condivisi: ' + counts[1].toLocaleString('it-IT');
    } catch (_) {
      stats.textContent = 'Statistiche condivisioni temporaneamente non disponibili';
    }
  }
  async function copy(url,activeFeedback) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        input.style.cssText='position:fixed;left:-9999px;top:0';
        document.body.appendChild(input);
        input.select();
        const ok = document.execCommand('copy');
        input.remove();
        if (!ok) throw new Error('Copy unavailable');
      }
      activeFeedback.textContent = 'Link copiato';
      return true;
    } catch (_) {
      window.prompt('Copia questo link:',url);
      activeFeedback.textContent = 'Link pronto da copiare';
      return false; // The manual copy cannot be confirmed.
    }
  }
  // Both positions use the same share action and the same browser-unique counters.
  // Feedback is local to the button pressed; the totals remain global.
  function handleShare(activeFeedback) {
    const url = shareUrl();
    activeFeedback.textContent = '';
    let shared = null;
    if (typeof navigator.share === 'function') {
      try { shared = navigator.share({title:'Controcorrente',text:document.title,url}); }
      catch (error) { shared = Promise.reject(error); }
    }
    // Never count dismissed shares, failed copies or a second share from this browser.
    if (shared) {
      Promise.resolve(shared).then(() => recordOnce(clickKey,clickFlag)).catch(error => {
        if (error && error.name === 'AbortError') return;
        return copy(url,activeFeedback).then(copied => { if (copied) recordOnce(clickKey,clickFlag); });
      });
    } else {
      copy(url,activeFeedback).then(copied => { if (copied) recordOnce(clickKey,clickFlag); });
    }
  }

  button.addEventListener('click', () => handleShare(feedback));

  function mountHeader(shareButton,shareFeedback) {
    const header = document.querySelector('header.top');
    if (!header) return;
    function inNotificationRow() {
      const controls = header.querySelector('#cc-notification-actions');
      if (!controls) return false;
      if (shareButton.parentElement !== controls) controls.insertBefore(shareButton,controls.firstChild);
      if (shareFeedback.parentElement !== controls) shareButton.insertAdjacentElement('afterend',shareFeedback);
      return true;
    }
    // Make the button immediately visible even if the notification script loads late.
    if (inNotificationRow()) return;
    const brand = header.querySelector('.brand-row');
    if (brand) brand.insertAdjacentElement('afterend',shareButton);
    else header.appendChild(shareButton);
    shareButton.insertAdjacentElement('afterend',shareFeedback);
    const observer = new MutationObserver(() => {
      if (inNotificationRow()) observer.disconnect();
    });
    observer.observe(header,{childList:true,subtree:true});
    window.setTimeout(() => observer.disconnect(),20000);
  }

  const homeCounter = document.querySelector('[data-notification-counter]');
  if (homeCounter && homeCounter.parentElement) {
    const home = document.createElement('div');
    home.className = 'cc-share-home';
    stats = document.createElement('small');
    stats.className = 'cc-share-stats';
    stats.setAttribute('role','status');
    stats.textContent = 'Statistiche condivisioni: caricamento…';
    home.append(button,feedback,stats);
    homeCounter.parentElement.appendChild(home);
    refresh();
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',() => { if (!document.hidden) refresh(); });
    // Novità keeps its counter button and ALSO has the same control as every other page.
    const headerButton = button.cloneNode(true);
    const headerFeedback = feedback.cloneNode(true);
    headerButton.addEventListener('click',() => handleShare(headerFeedback));
    mountHeader(headerButton,headerFeedback);
  } else {
    mountHeader(button,feedback);
  }
  if (new URLSearchParams(window.location.search).get('cc_share') === '1') {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('cc_share');
      history.replaceState(history.state,'',url.pathname + url.search + url.hash);
    } catch (_) {}
    recordOnce(referralKey, referralFlag);
  }
})();
// END SITE SHARING 2026-10-24


// BEGIN RADIO NOW PLAYING TICKER 2026-11-04
// REVERSIBILE: eliminare esclusivamente questo blocco fino a END; il player radio resta intatto.
(() => {
  'use strict';
  const radioButton = document.getElementById('cc-jazz-toggle');
  if (!radioButton || document.getElementById('cc-nowplaying-ticker')) return;

  const style = document.createElement('style');
  style.textContent = `
    #cc-nowplaying-ticker{box-sizing:border-box;display:block;width:calc(100% - 12px);max-width:none;height:23px;margin:5px auto 7px;padding:2px 9px;overflow:hidden;border:1px solid var(--gold,#cba76d);border-radius:5px;background:var(--navy,#082a43);color:var(--gold,#cba76d);font:11px/17px Georgia,"Times New Roman",serif;white-space:nowrap}
    #cc-nowplaying-ticker[hidden]{display:none!important}
    #cc-nowplaying-ticker .cc-nowplaying-text{display:inline-block;white-space:nowrap;padding-left:100%;animation:cc-nowplaying-scroll 19s linear infinite}
    @keyframes cc-nowplaying-scroll{from{transform:translateX(0)}to{transform:translateX(-100%)}}
    @media(prefers-reduced-motion:reduce){#cc-nowplaying-ticker .cc-nowplaying-text{padding-left:0;animation:none;white-space:normal}}
  `;
  document.head.appendChild(style);
  const ticker = document.createElement('div');
  ticker.id = 'cc-nowplaying-ticker';
  ticker.hidden = true;
  ticker.setAttribute('aria-label', 'Informazioni della radio in onda');
  ticker.setAttribute('aria-live', 'off');
  const tickerText = document.createElement('span');
  tickerText.className = 'cc-nowplaying-text';
  tickerText.textContent = '♪ 60 North Radio · MP3 320 kbps';
  ticker.appendChild(tickerText);
  // Una striscia stretta e lunga SOTTO la zona pulsanti del sito.
  // Non inserirla nel gruppo flex del pulsante radio o si restringe.
  const tickerHeader=radioButton.closest('header.top') || document.querySelector('header.top');
  if (tickerHeader) tickerHeader.appendChild(ticker);
  else radioButton.insertAdjacentElement('afterend', ticker);

  // Ogni pagina interna visualizza il ticker, ma solo il documento principale
  // interroga i metadati: una sola radio, una sola richiesta periodica.
  let shared;
  try { if (window.parent !== window) shared = window.parent.ccNowPlayingTicker; } catch (_) {}
  if (shared && typeof shared.attach === 'function') {
    shared.attach(ticker, radioButton);
    return;
  }

  // 60 North Radio (Shetland): stream MP3 320 kbps e brani sullo stesso CDN.
  // Verificati il 5/11/2026: /status-json.xsl HTTPS 200, CORS *, /stream 320k.
  const currentSongUrl = 'https://cdn1.zetcast.net/status-json.xsl';
  const stationLabel = '♪ 60 North Radio · MP3 320 kbps';
  let activeTicker = ticker;
  let activeButton = radioButton;
  let currentLabel = stationLabel;
  let playing = false;
  let interval = null;
  let controller = null;
  let inFlight = false;

  function writeLabel() {
    const target = activeTicker.querySelector('.cc-nowplaying-text');
    if (!target || target.textContent === currentLabel) return;
    target.textContent = currentLabel;
    target.style.animation = 'none';
    void target.offsetWidth;
    target.style.animation = '';
  }
  function setLabel(value) {
    currentLabel = value;
    if (playing) writeLabel();
  }
  function songFromApi(data) {
    if (!data || !data.icestats || !data.icestats.source) return null;
    const all = Array.isArray(data.icestats.source)
      ? data.icestats.source : [data.icestats.source];
    // Esattamente la stessa fonte /stream che il lettore suona.
    const source = all.find(item => item && item.mount === '/stream');
    if (!source || typeof source.title !== 'string') return null;
    const clean = source.title.replace(/\s+/g,' ').trim().slice(0,180);
    return clean && !/^(?:60 north radio|unknown|none|n\/a|live)$/i.test(clean)
      ? clean : null;
  }
  async function refresh() {
    if (!playing || inFlight) return;
    inFlight = true;
    const requestController = new AbortController();
    controller = requestController;
    const timeout = window.setTimeout(() => requestController.abort(), 8000);
    try {
      const response = await fetch(currentSongUrl + '?t=' + Date.now(), {
        cache:'no-store', credentials:'omit', signal:requestController.signal
      });
      if (!response.ok) throw new Error('Metadati 60 North non disponibili');
      const song = songFromApi(await response.json());
      if (playing && !requestController.signal.aborted)
        setLabel(song ? '♪ '+song+' · 60 North Radio' : stationLabel);
    } catch (_) {
      if (playing && !requestController.signal.aborted) setLabel(stationLabel);
    } finally {
      window.clearTimeout(timeout);
      if (controller === requestController) controller=null;
      inFlight=false;
    }
  }
  function sync() {
    const on = activeButton.getAttribute('data-music-state') === 'on';
    activeTicker.hidden = !on;
    if (!on) {
      if (playing) {
        playing = false;
        if (interval !== null) { window.clearInterval(interval); interval=null; }
        if (controller) controller.abort();
        currentLabel = stationLabel;
      }
      return;
    }
    writeLabel();
    if (!playing) {
      playing = true;
      refresh();
      interval = window.setInterval(refresh, 25000);
    }
  }
  const observer = new MutationObserver(sync);
  function attach(nextTicker, nextButton) {
    observer.disconnect();
    activeTicker = nextTicker;
    activeButton = nextButton;
    observer.observe(activeButton, {attributes:true, attributeFilter:['data-music-state']});
    sync();
  }
  window.ccNowPlayingTicker = {attach};
  attach(ticker, radioButton);
})();
// END RADIO NOW PLAYING TICKER 2026-11-04
