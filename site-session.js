// Background tabs and the original document behind the persistent player
// frame do not need to refresh their visible panels.
window.ccWatchPanel = (refresh, period) => {
  let timer, pending = false, queued = false, lastStart = -Infinity;
  const visible = () => !document.hidden && !document.documentElement.hasAttribute('data-cc-panel-covered');
  function schedule() {
    clearTimeout(timer);
    if (period && visible() && !pending) timer = setTimeout(check, Math.max(0, period - (performance.now() - lastStart)));
  }
  async function check(invalidate = false) {
    clearTimeout(timer);
    if (!visible()) return;
    if (pending) {
      if (invalidate) queued = true;
      return;
    }
    pending = true;
    lastStart = performance.now();
    try { await refresh(); }
    finally {
      pending = false;
      if (queued) {
        queued = false;
        check();
      } else schedule();
    }
  }
  function resume() {
    if (!visible()) clearTimeout(timer);
    else if (performance.now() - lastStart >= 500) check(true);
    else schedule();
  }
  document.addEventListener('visibilitychange', resume);
  document.addEventListener('cc-panel-visibility', resume);
  window.addEventListener('pageshow', resume);
  window.addEventListener('focus', resume);
  check();
  return {refresh: () => check(true)};
};

// Static JSON on Pages has ETag/Last-Modified. Revalidate with the browser
// cache and paint the last good snapshot while that check is in flight.
window.ccReadPublishedJson = (url, validate) => {
  const key = 'cc-published:' + url;
  return {
    cached() {
      try {
        const data = JSON.parse(sessionStorage.getItem(key));
        return validate(data) ? data : null;
      } catch (_) { return null; }
    },
    async load() {
      const response = await fetch(url, {
        cache:'no-cache',
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(12000) : undefined
      });
      if (!response.ok) throw new Error('Published JSON unavailable');
      const data = await response.json();
      if (!validate(data)) throw new Error('Invalid published JSON');
      try { sessionStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
      return data;
    }
  };
};

// The public ledger and the player read the same Supabase endpoint.
// Share only a concurrent GET. Booking claims and admin writes always go directly to the server.
(() => {
  let pending;
  window.ccReadRadioPremi = signal => {
    if (!pending || pending.controller.signal.aborted) {
      const controller = new AbortController();
      const entry = {controller, ledger:false};
      const timeout = setTimeout(() => controller.abort(), 4500);
      entry.result = fetch('https://lgjijnhhnjioiyvfmkvy.supabase.co/functions/v1/radio-premi', {
        cache:'no-store', credentials:'omit', signal:controller.signal
      }).then(response => {
        if (!response.ok) throw new Error('Radio Premi unavailable');
        return response.json();
      }).finally(() => {
        clearTimeout(timeout);
        if (pending === entry) pending = null;
      });
      pending = entry;
    }
    const entry = pending;
    if (!signal) {
      entry.ledger = true;
      return entry.result;
    }
    const abort = () => { if (!entry.ledger) entry.controller.abort(); };
    signal.addEventListener('abort', abort, {once:true});
    return entry.result.finally(() => signal.removeEventListener('abort', abort));
  };
})();

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
    const [today,total]=await Promise.allSettled([
      hitOrGet('get',currentDayKey()),hitOrGet('get',totalKey)]);
    if (today.status === 'fulfilled' && total.status === 'fulfilled') render(today.value,total.value);
    else render(null,null);
  }
  const poll = stat && window.ccWatchPanel(refresh, 5 * 60000);
  function record() {
    // Triggered ONLY by the deliberate OFF -> ON click, never by page visits or retries.
    const todayFlag='cc-radio-on-'+todayKey()+'-v1';
    const actions=[];
    if(markOnce(todayFlag))actions.push(hitOrGet('hit',currentDayKey()));
    if(markOnce('cc-radio-on-ever-v1'))actions.push(hitOrGet('hit',totalKey));
    if (actions.length && poll) Promise.allSettled(actions).then(poll.refresh);
  }
  window.ccRadioClickStats={record};
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
    @media(min-width:1101px){header.top .cc-radio-controls{justify-content:center;width:100%;box-sizing:border-box;margin:8px auto 0}}
    .cc-radio-listeners{display:inline-flex;align-items:center;min-height:28px;border:1px solid var(--gold,#cba76d);border-radius:20px;padding:1px 9px;color:var(--gold,#cba76d);font:600 11px/1.3 system-ui,sans-serif;white-space:nowrap}
    .cc-radio-controls{flex-wrap:wrap}
    .cc-radio-promo{font:800 14px/1.3 system-ui,sans-serif;letter-spacing:.08em;color:#082a43;background:#efbd36;border:1px solid #fff2ba;border-radius:9px;padding:9px 12px;box-shadow:0 0 0 2px rgba(239,189,54,.28);max-width:100%;overflow-wrap:anywhere;animation:cc-radio-promo-flash 1.2s ease-in-out infinite}
    .cc-radio-promo[hidden]{display:none!important}
    @keyframes cc-radio-promo-flash{0%,100%{box-shadow:0 0 0 2px rgba(239,189,54,.28)}50%{box-shadow:0 0 0 5px rgba(239,189,54,.66)}}
    @media(prefers-reduced-motion:reduce){.cc-radio-promo{animation:none}}
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
    const promo=document.createElement('span');
    promo.className='cc-radio-promo';
    promo.setAttribute('role','status');
    promo.setAttribute('aria-live','polite');
    promo.hidden=true;
    holder.append(button,listeners,promo);
    const brandRow=header.querySelector('.brand-row');
    if(brandRow)brandRow.insertAdjacentElement('afterend',holder);
    else header.appendChild(holder);
    return {listeners,promo};
  }
  let owner;
  try { if (window.parent !== window) owner = window.parent.ccJazzPlayer; } catch (_) {}
  if (owner) {
    const button = owner.button.cloneNode(true);
    button.addEventListener('click', owner.toggle);
    const controls=placeRadioControls(button);
    owner.attach(button, window, controls.listeners, controls.promo);
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
  // A live stream may stall while the browser still considers play() active.
  // Retry the same station only after an explicit ON; never count a retry as ON.
  let reconnectTimer=null;
  let reconnectMonitor=null;
  let reconnectBlocked=false;
  let reconnectAttempts=0;
  let streamPosition=null;
  let streamProgressAt=performance.now();
  function clearReconnectTimer() {
    if(reconnectTimer!==null)window.clearTimeout(reconnectTimer);
    reconnectTimer=null;
  }
  function scheduleReconnect(delay=15000) {
    clearReconnectTimer();
    if(!enabled || reconnectBlocked)return;
    reconnectTimer=window.setTimeout(()=>{
      reconnectTimer=null;
      if(!enabled || document.hidden || reconnectBlocked)return;
      attempt++; // Ignore a play() result from the abandoned connection.
      audible=false; pending=false; failed=false;
      stopLiveChecks();
      clearPromoFlash();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      streamPosition=null;
      streamProgressAt=performance.now();
      reconnectAttempts=Math.min(4,reconnectAttempts+1);
      start();
    },delay);
  }
  function ensureReconnectMonitor() {
    if(reconnectMonitor!==null)return;
    reconnectMonitor=window.setInterval(()=>{
      if(!enabled || document.hidden || reconnectBlocked)return;
      if(pending) {
        if(performance.now()-streamProgressAt>20000 && reconnectTimer===null)
          scheduleReconnect(1000);
        return;
      }
      if(failed || audio.ended || audio.paused) {
        if(reconnectTimer===null)
          scheduleReconnect(Math.min(30000,3000*Math.pow(2,reconnectAttempts)));
        return;
      }
      if(!audible)return;
      const position=audio.currentTime;
      if(!Number.isFinite(position))return; // Some live streams expose no position.
      if(position===0 && streamPosition===0 && audio.seekable.length===0)return;
      if(streamPosition===null || position<streamPosition || position>streamPosition+0.15){
        streamPosition=position;
        streamProgressAt=performance.now();
      } else if(performance.now()-streamProgressAt>20000 && reconnectTimer===null) {
        scheduleReconnect(1000);
      }
    },5000);
  }
  const button = document.createElement('button');
  button.id = 'cc-jazz-toggle';
  button.type = 'button';
  button.style.cssText = 'display:block;margin:8px 0 0 auto;width:44px;height:44px;padding:4px;border:1px solid var(--gold,#cba76d);border-radius:50%;background:var(--navy,#082a43);color:var(--gold,#cba76d);font-size:18px;line-height:1;cursor:pointer;';
  let activeButton = button;
  let activeListenerBadge=null;
  let activePromoBadge=null;
  let ownPromoBadge=null;
  let listenerCount=null;
  let listenerPending=false;
  let listenerRefreshRequested=false;
  let listenerMayBeRegistered=false;
  let listenerTimer=null;
  let promoInterval=null;
  let lastPromoStartSignal=null;
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
    const playing=enabled && audible && !audio.paused && !failed;
    const label=playing && Number.isSafeInteger(listenerCount) && listenerCount>=0
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
  async function updateListenerPresence() {
    if (!listenerSession) return;
    const playing=realPlaying();
    if (!playing && !listenerMayBeRegistered) return;
    if (listenerPending) {
      listenerRefreshRequested=true;
      return;
    }
    listenerPending=true;
    listenerMayBeRegistered=playing;
    const ctrl=new AbortController();
    const timeout=window.setTimeout(()=>ctrl.abort(),6500);
    try{
      const response=await fetch(listenerApi,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'listener_presence',session:listenerSession,playing}),
        cache:'no-store',credentials:'omit',keepalive:!playing,signal:ctrl.signal
      });
      if(!response.ok)throw new Error('Listener service unavailable');
      const data=await response.json();
      if(playing && realPlaying() && Number.isSafeInteger(data.listeners) && data.listeners>=0){
        listenerCount=data.listeners;
        renderListenerCount();
      }
      // Il controllo di presenza, gia' attivo ogni 5 s, segnala nuove emissioni.
      // Solo allora si interroga il server per il codice, senza nuovo polling.
      if(playing && realPlaying()) {
        const signal=typeof data.promo_started_at==='string'?data.promo_started_at:null;
        if(signal && signal!==lastPromoStartSignal) {
          lastPromoStartSignal=signal;
          refreshRadioPromo();
        } else if(!signal && lastPromoStartSignal) {
          // A claim or withdrawal ends the broadcast before its two-hour timer.
          // Hide the code immediately, then confirm the new state with the API.
          lastPromoStartSignal=null;
          promoOnAir=null;
          clearPromoFlash();
          promoPoll?.abort();
          refreshRadioPromo();
        }
      }
    }catch(_){
      listenerCount=null;
      renderListenerCount();
    }finally{
      window.clearTimeout(timeout);
      listenerPending=false;
      if(listenerRefreshRequested){
        listenerRefreshRequested=false;
        updateListenerPresence();
      }
    }
  }
  function stopLiveChecks() {
    window.clearInterval(listenerTimer);
    window.clearInterval(promoInterval);
    listenerTimer=promoInterval=null;
    lastPromoStartSignal=null;
    promoRefreshRequested=false;
    listenerCount=null;
    updateListenerPresence();
  }

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
    renderListenerCount();
  }
  function remember() {
    try { sessionStorage.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch (_) {}
  }
  // CONTROCORRENTE RADIO PREMI VISIVI 2026-11-06
  // Solo trillo MP3 originale (non parlato). Durante il codice la radio
  // si attenua al 20% per dieci secondi e poi torna al 100%, anche in caso di stop.
  // L'API decide codice, calendario e disponibilita; il browser mostra
  // per la finestra autorizzata dal server a chi ascolta realmente.
  let promoOnAir=null;
  let promoPoll=null;
  let promoRefreshRequested=false;
  let promoVolumeTimer=null;
  let promoVolumeUntil=0;
  let promoFlashSlot=null;
  let promoAllowedAt=Number.POSITIVE_INFINITY;
  let promoFlashCode=null;
  let promoFlashUntil=0;
  let promoTimer=null;
  const trillUrl='trillo-radio-premi.mp3?v=20261107-live-30-v1';
  const trillAudio=document.createElement('audio');
  trillAudio.preload='none';
  trillAudio.setAttribute('playsinline','');
  let audioContext=null, trillBuffer=null, trillSource=null;
  let trillAssetFailed=false;
  function unlockPromoAudio() {
    if (!trillAudio.getAttribute('src')) {
      trillAudio.preload='auto';
      trillAudio.src=trillUrl;
    }
    // Sblocca il suono al clic ON. Non collegare lo stream esterno
    // a createMediaElementSource: un flusso senza CORS può diventare muto.
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    try {
      if(!audioContext) {
        audioContext=new Context();
        fetch(trillUrl,{cache:'force-cache'})
          .then(r=>{if(!r.ok)throw Error('MP3 non disponibile');return r.arrayBuffer();})
          .then(bytes=>{
            if(bytes.byteLength<1500)throw Error('MP3 troppo breve');
            return audioContext.decodeAudioData(bytes);
          })
          .then(buffer=>{trillBuffer=buffer;})
          .catch(e=>{
            trillAssetFailed=true;
            console.warn('[Radio Premi] Trillo MP3:',e);
          });
      }
      if(audioContext.state==='suspended')
        audioContext.resume().catch(e=>console.warn('[Radio Premi] Audio sospeso:',e));
    } catch(e) {
      console.warn('[Radio Premi] AudioContext non disponibile:',e);
    }
  }
  function stopTrillAndRestoreVolume() {
    if(trillSource) {
      try { trillSource.stop(); } catch (_) {}
      try { trillSource.disconnect(); } catch (_) {}
      trillSource=null;
    }
    trillAudio.pause();
    if(trillAudio.readyState) {
      try { trillAudio.currentTime=0; } catch (_) {}
    }
    audio.volume=1;
  }
  function fallbackTrill() {
    if(!audioContext||audioContext.state!=='running')return;
    try {
      const osc=audioContext.createOscillator();
      const gain=audioContext.createGain();
      const t=audioContext.currentTime;
      osc.type='sine';
      osc.frequency.setValueAtTime(784,t);
      osc.frequency.setValueAtTime(988,t+0.2);
      osc.frequency.setValueAtTime(1319,t+0.4);
      gain.gain.setValueAtTime(0.0001,t);
      gain.gain.exponentialRampToValueAtTime(0.8,t+0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001,t+1.2);
      osc.connect(gain).connect(audioContext.destination);
      trillSource=osc;
      osc.onended=()=>{if(trillSource===osc)trillSource=null;};
      osc.start(t); osc.stop(t+1.22);
    } catch(e){ console.warn('[Radio Premi] Trillo di riserva:',e); }
  }
  function announcePromoFlash() {
    // Dieci secondi al 20% per la radio; il codice resta visibile a lungo.
    audio.volume=0.20;
    trillAudio.volume=1;
    trillAudio.muted=false;
    const playNative=()=>{
      if(!promoVolumeUntil || performance.now()>=promoVolumeUntil || !realPlaying())return;
      if(trillAssetFailed){fallbackTrill();return;}
      try { trillAudio.pause(); trillAudio.currentTime=0; } catch (_) {}
      const play=trillAudio.play();
      if(play&&typeof play.catch==='function')play.catch(e=>{
        console.warn('[Radio Premi] MP3 bloccato:',e);
        fallbackTrill();
      });
    };
    const playDecoded=()=>{
      if(!promoVolumeUntil || performance.now()>=promoVolumeUntil || !realPlaying())return;
      if(trillBuffer&&audioContext&&audioContext.state==='running') {
        try {
          const source=audioContext.createBufferSource();
          source.buffer=trillBuffer;
          source.connect(audioContext.destination);
          trillSource=source;
          source.onended=()=>{if(trillSource===source)trillSource=null;};
          source.start();
          return;
        } catch(e){console.warn('[Radio Premi] MP3 non riproducibile:',e);}
      }
      playNative();
    };
    const playOnce=()=>{
      if(!promoFlashCode||!promoVolumeUntil||performance.now()>=promoVolumeUntil||!realPlaying())return;
      if(audioContext&&audioContext.state==='suspended')
        audioContext.resume().then(playDecoded).catch(playNative);
      else playDecoded();
    };
    playOnce();
  }
  const promoSeenPrefix='cc-radio-premio-visto-';
  const promoSeenThisSession=new Set();
  const realPlaying=()=>enabled && audible && !audio.paused && !failed;
  function alreadySeen(token) {
    if(promoSeenThisSession.has(token))return true;
    try { return localStorage.getItem(promoSeenPrefix+token)==='1'; }
    catch (_) { return false; }
  }
  function markSeen(token) {
    promoSeenThisSession.add(token);
    try { localStorage.setItem(promoSeenPrefix+token,'1'); }
    catch (_) { /* Anche con storage disabilitato il codice compare una sola volta per passaggio. */ }
  }
  function renderPromoFlash() {
    const visible=realPlaying() && promoFlashCode && performance.now()<promoFlashUntil;
    for(const el of new Set([ownPromoBadge,activePromoBadge])) {
      if(!el)continue;
      el.hidden=!visible;
      el.textContent=visible ? '🎟 CODICE CENA: '+promoFlashCode : '';
    }
  }
  function clearPromoFlash() {
    if(promoTimer!==null)window.clearTimeout(promoTimer);
    promoTimer=null;
    promoFlashCode=null;
    promoFlashSlot=null;
    promoFlashUntil=0;
    if(promoVolumeTimer!==null)window.clearTimeout(promoVolumeTimer);
    promoVolumeTimer=null;
    promoVolumeUntil=0;
    stopTrillAndRestoreVolume();
    renderPromoFlash();
  }
  function finishPromoAudio() {
    if(promoVolumeTimer!==null)window.clearTimeout(promoVolumeTimer);
    promoVolumeTimer=null;
    promoVolumeUntil=0;
    stopTrillAndRestoreVolume();
  }
  function restoreSeenPromo() {
    const slot=promoOnAir;
    if(promoFlashCode || !slot || !realPlaying() ||
       performance.now()>=slot.deadline || !alreadySeen(slot.token))return;
    // Ricaricare la pagina o riaccendere la radio non consuma un nuovo annuncio.
    // Il server deve confermare che questo codice è ancora in onda e disponibile.
    promoFlashCode=slot.code;
    promoFlashSlot=slot;
    promoFlashUntil=slot.deadline;
    renderPromoFlash();
    promoTimer=window.setTimeout(clearPromoFlash,Math.max(0,promoFlashUntil-performance.now()));
  }
  function maybeShowPromo() {
    const slot=promoOnAir;
    if(promoFlashCode || !slot || !realPlaying() ||
        (performance.now()<promoAllowedAt && !slot.manual) || performance.now()>=slot.deadline ||
        alreadySeen(slot.token))return;
    promoFlashCode=slot.code;
    promoFlashSlot=slot;
    promoFlashUntil=slot.deadline;
    renderPromoFlash();
    promoTimer=window.setTimeout(clearPromoFlash,Math.max(0,promoFlashUntil-performance.now()));
    markSeen(slot.token);
    promoVolumeUntil=performance.now()+10000;
    announcePromoFlash();
    // Il trillo e l'attenuazione restano brevi; il codice rimane visibile.
    promoVolumeTimer=window.setTimeout(finishPromoAudio,10000);
  }
  async function refreshRadioPromo() {
    if(!realPlaying())return;
    if(promoPoll){promoRefreshRequested=true;return;}
    const poll=new AbortController();
    promoPoll=poll;
    const requestStarted=performance.now();
    try {
      const result=await window.ccReadRadioPremi(poll.signal);
      if(poll.signal.aborted || !realPlaying())return;
      const slot=result?.on_air;
      const serverNow=Date.parse(result?.server_time);
      const expiry=Date.parse(slot?.available_until);
      const active=result?.active===true && result?.paused_today!==true;
      promoOnAir=active && /^[0-9]{5}$/.test(slot?.code) &&
        Number.isInteger(slot.slot) && slot.slot>=1 && slot.slot<=24 &&
        Number.isFinite(serverNow) && expiry>serverNow
        ? {code:slot.code,expiry,deadline:requestStarted+expiry-serverNow,
          token:slot.code+'-'+(slot.reopened_at||slot.slot),manual:slot.manual_live===true}
        : null;
      // A second manual launch of the same code is a separate announcement.
      if(promoFlashSlot && promoOnAir && promoFlashSlot.token!==promoOnAir.token)
        clearPromoFlash();
      // A network error or the scheduled end of the server window must
      // not cut short a flash already started. A withdrawn code must stop.
      if(promoFlashSlot && (!active || result.records?.some(row=>
          row.code===promoFlashCode && ['held','confirmed','used','void','expired'].includes(row.status))
          || (!promoOnAir && serverNow<promoFlashSlot.expiry)))clearPromoFlash();
      restoreSeenPromo();
      maybeShowPromo();
    } catch (_) { /* The next poll can still catch the server window. */ }
    finally {
      if(promoPoll===poll)promoPoll=null;
      if(promoRefreshRequested && realPlaying()) {
        promoRefreshRequested=false;
        refreshRadioPromo();
      } else if(!realPlaying()) promoRefreshRequested=false;
    }
  }
  window.addEventListener('focus',()=>{refreshRadioPromo();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)finishPromoAudio();
    if(!document.hidden && realPlaying()){
      if(promoFlashCode&&performance.now()>=promoFlashUntil)clearPromoFlash();
      refreshRadioPromo();
    }
  });
  // END CONTROCORRENTE RADIO PREMI VISIVI 2026-11-06

  function stop() {
    attempt++;
    clearReconnectTimer();
    if(reconnectMonitor!==null)window.clearInterval(reconnectMonitor);
    reconnectMonitor=null;
    reconnectBlocked=false;
    reconnectAttempts=0;
    audible=false;
    stopLiveChecks();
    promoPoll?.abort();
    promoPoll=null;
    promoOnAir=null;
    clearPromoFlash();
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
    streamProgressAt=performance.now();
    ensureReconnectMonitor();
    scheduleReconnect(20000);
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
          reconnectBlocked=error?.name==='NotAllowedError';
          failed=reconnectBlocked || error?.name!=='AbortError';
          if(reconnectBlocked)clearReconnectTimer();
          else scheduleReconnect(Math.min(30000,3000*Math.pow(2,reconnectAttempts)));
          render();
        });
      } else { pending = false; }
    } catch (error) {
      pending=false;
      reconnectBlocked=error?.name==='NotAllowedError';
      failed=true;
      if(reconnectBlocked)clearReconnectTimer();
      else scheduleReconnect(Math.min(30000,3000*Math.pow(2,reconnectAttempts)));
      render();
    }
  }
  audio.addEventListener('playing', () => {
    if (!enabled || audio.paused) return;
    audible = true; pending = false; failed = false;
    clearReconnectTimer();
    reconnectAttempts=0;
    streamPosition=null;
    streamProgressAt=performance.now();
    if(promoVolumeUntil && performance.now()>=promoVolumeUntil)finishPromoAudio();
    ensureReconnectMonitor();
    render();
    if (promoInterval === null) promoInterval=window.setInterval(refreshRadioPromo,60000);
    if (listenerTimer === null) listenerTimer=window.setInterval(updateListenerPresence,5000);
    refreshRadioPromo();
    updateListenerPresence();
  });
  audio.addEventListener('pause', () => {
    audible=false; clearPromoFlash(); stopLiveChecks(); render();
    if(enabled && !reconnectBlocked && reconnectTimer===null)scheduleReconnect(12000);
  });
  audio.addEventListener('waiting', () => {
    audible=false; pending=enabled; streamProgressAt=performance.now();
    clearPromoFlash(); stopLiveChecks(); render();
    if(enabled)scheduleReconnect(20000);
  });
  audio.addEventListener('stalled', () => {
    if(audio.readyState>=HTMLMediaElement.HAVE_FUTURE_DATA)return;
    audible=false; pending=enabled; streamProgressAt=performance.now();
    clearPromoFlash(); stopLiveChecks(); render();
    if(enabled)scheduleReconnect(20000);
  });
  audio.addEventListener('ended', () => {
    audible=false; pending=false; clearPromoFlash(); stopLiveChecks(); render();
    if(enabled)scheduleReconnect(3500);
  });
  audio.addEventListener('error', () => {
    audible=false; pending=false; failed=true; clearPromoFlash(); stopLiveChecks(); render();
    if(enabled)scheduleReconnect(8000);
  });
  function toggle() {
    if (enabled && (pending || (!audio.paused && !failed))) {
      enabled = false;
      remember();
      stop();
    } else {
      // Radio and walkie-talkie are mutually exclusive.
      window.ccWalkie?.deactivate();
      enabled = true;
      listenerCount=null;
      try { (activeButton.ownerDocument.defaultView || window).ccRadioClickStats?.record(); } catch (_) {}
      promoAllowedAt=performance.now()+60000;
      remember();
      failed = false;
      reconnectBlocked=false;
      reconnectAttempts=0;
      clearReconnectTimer();
      // Release any failed stream before an explicit retry.
      audio.removeAttribute('src');
      audio.load();
      unlockPromoAudio();
      start();
    }
    render();
  }
  function turnOff() {
    if (!enabled && audio.paused) return;
    enabled = false;
    remember();
    stop();
  }
  button.addEventListener('click', toggle);
  function resumeRadio() {
    if(document.hidden || !enabled || reconnectBlocked)return;
    ensureReconnectMonitor();
    if(realPlaying())updateListenerPresence();
    else if(!pending && !failed && audio.paused)start();
    else if(reconnectTimer===null)scheduleReconnect(5000);
  }
  document.addEventListener('visibilitychange',resumeRadio);
  window.addEventListener('pageshow',resumeRadio);
  window.addEventListener('focus',resumeRadio);
  const ownControls=placeRadioControls(button);
  ownListenerBadge=ownControls.listeners;
  activeListenerBadge=ownControls.listeners;
  ownPromoBadge=ownControls.promo;
  activePromoBadge=ownControls.promo;
  render();
  const siteRoot = new URL('.', location.href);
  let frame = null;
  function navigate(url, push = true) {
    if(promoVolumeUntil)finishPromoAudio();
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
      document.documentElement.setAttribute('data-cc-panel-covered', '');
      document.dispatchEvent(new Event('cc-panel-visibility'));
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
    button, toggle, turnOff,
    attach(nextButton, view, nextListenerBadge, nextPromoBadge) {
      activeButton = nextButton;
      activeListenerBadge = nextListenerBadge || ownListenerBadge;
      activePromoBadge = nextPromoBadge || ownPromoBadge;
      render();
      renderListenerCount();
      renderPromoFlash();
      bindNavigation(view);
    }
  };
  bindNavigation(window);
  window.addEventListener('popstate', () => {
    if (frame) navigate(location.href, false);
  });
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    if (listenerMayBeRegistered && listenerPending && listenerSession) {
      // The pending heartbeat may have reached the server. Best effort before
      // unload; the existing server expiry covers an interrupted delivery.
      try {
        if (navigator.sendBeacon(listenerApi,new Blob([JSON.stringify({
          action:'listener_presence',session:listenerSession,playing:false
        })],{type:'text/plain'}))) listenerMayBeRegistered=false;
      } catch (_) {}
    }
    turnOff();
  });
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
    if (firstTime(flag)) counter('hit', key).then(() => statsPoll?.refresh()).catch(() => {});
  }
  let stats = null;
  let statsPoll = null;
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
    statsPoll = window.ccWatchPanel(refresh);
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
