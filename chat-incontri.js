/* Chat commensali: stanza pubblica, effimera, peer-to-peer.
   Il filtro è locale (sia all'invio sia alla ricezione): non è moderazione centralizzata. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const APP_ID = 'it.controcorrente.incontri.pubblico.v1';
  const ROOM_ID = 'salotto-controcorrente-2026-v1';
  const MAX_MSG = 280, MAX_VISIBLE = 70;
  const SEND_INTERVAL = 4000, RECEIVE_INTERVAL = 1000;
  const peers = new Map(), lastByPeer = new Map(), ignored = new Set();
  let room = null, messageAction = null, helloAction = null;
  let mine = '', mode = '', connected = false, joining = false, lastSent = 0;
  const SESSION_KEY = 'controcorrente-chat-commensali-session-v1';
  const SESSION_LIFETIME = 2 * 60 * 60 * 1000; // massimo due ore per il ritorno da WhatsApp
  let backgroundAt = 0, reconnecting = null;

  // Solo avvisi anonimi di ingresso: nessun messaggio o pseudonimo inviato.
  // La chat non ha backend: per le notifiche al gestore usa il servizio esterno ntfy.
  const JOIN_ALERT_TOPIC = 'ccchat-4p8e2x60m9n5a7v3j2k6r4q8d1w0t6b5';
  const JOIN_ALERT_LAST = 'cc-chat-ingresso-avviso-ultimo-v1';
  const OWNER_DEVICE = 'cc-chat-dispositivo-gestore-v1';
  const JOIN_ALERT_COOLDOWN = 10 * 60 * 1000;

  // Il gestore può identificare il proprio browser una volta tramite URL dedicato.
  // È una preferenza locale, non un'autenticazione da moderatore.
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('dispositivo_gestore') === '1') {
      localStorage.setItem(OWNER_DEVICE, '1');
      q.delete('dispositivo_gestore');
      const clean = location.pathname + (q.toString() ? '?' + q : '') + location.hash;
      history.replaceState(history.state, '', clean);
    }
  } catch (_) {}

  async function announceJoin() {
    try {
      if (localStorage.getItem(OWNER_DEVICE) === '1') return;
      const now = Date.now(), last = Number(localStorage.getItem(JOIN_ALERT_LAST) || 0);
      if (last > 0 && now >= last && now - last < JOIN_ALERT_COOLDOWN) return;
      localStorage.setItem(JOIN_ALERT_LAST, String(now));
      const response = await fetch('https://ntfy.sh/', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        keepalive: true,
        body: JSON.stringify({
          topic: JOIN_ALERT_TOPIC,
          title: 'Controcorrente · Chat commensali',
          message: 'Un commensale è entrato nella chat.',
          click: 'https://piol77.github.io/controcorrente/chat-incontri.html',
          priority: 3
        })
      });
      if (!response.ok) throw new Error('Notifica non accettata');
    } catch (_) {
      // Non interrompere la chat quando il servizio esterno è irraggiungibile.
      try { localStorage.removeItem(JOIN_ALERT_LAST); } catch (_) {}
    }
  }

  // Ricorda solo pseudonimo e provenienza nella scheda corrente: mai i messaggi.
  function saveSession() {
    if (!mine || !mode) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        nick: mine, mode, validUntil: Date.now() + SESSION_LIFETIME
      }));
    } catch (_) {}
  }
  function readSession() {
    try {
      const data = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (!data || !Number.isFinite(data.validUntil) ||
          data.validUntil < Date.now() || data.validUntil > Date.now() + SESSION_LIFETIME ||
          !['Al locale', 'Da fuori'].includes(data.mode) ||
          typeof data.nick !== 'string' ||
          cleanText(data.nick, 24) !== data.nick ||
          data.nick.length < 2 || unsuitable(data.nick)) {
        sessionStorage.removeItem(SESSION_KEY); return null;
      }
      return data;
    } catch (_) {return null}
  }
  function clearSession() {
    try {sessionStorage.removeItem(SESSION_KEY)} catch (_) {}
  }

  function cleanText(v, length) {
    return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ').trim().slice(0, length);
  }
  function norm(v) {
    return String(v || '').normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/0/g,'o').replace(/[1!]/g,'i').replace(/3/g,'e')
      .replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t');
  }
  function unsuitable(v) {
    const text = norm(v);
    const words = text.replace(/[^a-z0-9]+/g, ' ').trim();
    const joined = text.replace(/[^a-z0-9]/g, '');
    const bad = ['vaffanculo','puttana','troia','stronzo','stronza','cazzo','merda',
      'frocio','negro','nazista','pedofilo','stupro','porcodio'];
    if (bad.some(w => new RegExp('(?:^| )'+w+'(?:$| )').test(words))) return 'Messaggio non consentito: contiene espressioni offensive o inappropriate.';
    if (['vaffanculo','porcodio'].some(w => joined.includes(w))) return 'Messaggio non consentito.';
    if (/(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|it|net|org|io|me|gg|ru|xyz)\b)/i.test(v)) return 'Niente collegamenti esterni nella chat.';
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(v)) return 'Non pubblicare indirizzi email.';
    if (/(?:\+?\d[\d\s()\-./]{7,}\d)/.test(v)) return 'Non pubblicare numeri di telefono.';
    if (/\b(?:whatsapp|telegram|onlyfans|paypal)\b/i.test(v)) return 'Usa la chat pubblica senza richiedere contatti privati o pagamenti.';
    return '';
  }
  function status(msg, type) {
    const box = $('chat-status'); box.textContent = msg;
    box.dataset.state = type || 'info';
  }
  function roomSize() {
    $('chat-online').textContent = String(connected ? peers.size + 1 : 0);
    const list = $('chat-people'); list.replaceChildren();
    if (connected) {
      const self = document.createElement('li');
      self.className='cc-person'; self.textContent='Tu · '+mine+' · '+mode; list.appendChild(self);
    }
    [...peers.entries()].forEach(([id, info]) => {
      if (ignored.has(id)) return;
      const el = document.createElement('li'); el.className='cc-person';
      el.textContent=(info.nick || 'Ospite')+' · '+(info.mode || 'collegato'); list.appendChild(el);
    });
    $('chat-send').disabled = !connected || peers.size < 1;
    $('chat-composer').disabled = !connected;
    if (connected) {
      status(peers.size ? 'Connesso: chat attiva. I messaggi sono pubblici per chi è online.'
        : 'Sei nella stanza. Nessun altro collegato in questo momento.', peers.size ? 'ok' : 'info');
    }
  }
  function message(kind, who, txt, peerId, time) {
    const box = $('chat-feed'), article = document.createElement('article');
    article.className='cc-message'+(kind==='mine'?' cc-message--mine':'');
    const head = document.createElement('div'); head.className='cc-message-head';
    const label = document.createElement('strong'); label.textContent=who;
    const stamp=document.createElement('time');stamp.textContent=new Intl.DateTimeFormat('it-IT',{
      timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'
    }).format(new Date(time || Date.now()));
    head.append(label,stamp);
    const body=document.createElement('p');body.textContent=txt;article.append(head,body);
    if (kind === 'other') {
      const tools=document.createElement('div');tools.className='cc-message-tools';
      const report=document.createElement('button');report.type='button';report.textContent='🚩 Segnala su WhatsApp';report.setAttribute('aria-label','Segnala questo messaggio al Controcorrente tramite WhatsApp');
      report.addEventListener('click',()=>{
        const reportText='[SEGNALAZIONE CHAT COMMENSALI CONTROCORRENTE]\nPseudonimo: '+who+
        '\nOrario locale: '+stamp.textContent+'\nEstratto: '+txt.slice(0,160)+
        '\n\nSegnalazione di un messaggio pubblico della chat. Richiedo al ristorante di valutarla. Il messaggio verrà inviato solo dopo che premo Invia su WhatsApp.';
        note('Si apre WhatsApp con la segnalazione: premi Invia nell’app per avvisare il ristorante.');
        const url='https://wa.me/393272292006?text='+encodeURIComponent(reportText);
        window.open(url,'_blank','noopener,noreferrer');
      });
      const silence=document.createElement('button');silence.type='button';silence.textContent='Ignora utente';
      silence.addEventListener('click',()=>{
        ignored.add(peerId);
        [...box.querySelectorAll('[data-peer]')].forEach(el=>{if(el.dataset.peer===peerId)el.remove()});
        roomSize();note('L’utente è stato nascosto solo su questo dispositivo.');
      });
      tools.append(report,silence);article.appendChild(tools);
      article.dataset.peer=peerId;
    }
    box.append(article);
    while (box.children.length > MAX_VISIBLE) box.firstElementChild.remove();
    box.scrollTop=box.scrollHeight;
  }
  function note(v) { $('chat-help').textContent=v; }
  function formStatus() {
    $('chat-join').disabled=joining||connected;
  }
  async function enter(automatic = false) {
    if (joining || connected) return;
    if (automatic) {
      const remembered = readSession();
      if (!remembered) return;
      $('chat-nick').value = remembered.nick;
      $('chat-mode').value = remembered.mode;
      // La sessione esiste solo dopo l'ingresso con entrambe le conferme.
      $('chat-age').checked = true;
      $('chat-rules').checked = true;
    }
    const nick = cleanText($('chat-nick').value, 24);
    if (nick.length < 2 || nick.length > 24) {
      note('Scegli uno pseudonimo tra 2 e 24 caratteri.'); return;
    }
    if (unsuitable(nick)) {
      note('Scegli uno pseudonimo rispettoso, senza recapiti o parole offensive.'); return;
    }
    if (!$('chat-age').checked || !$('chat-rules').checked) {
      note('Per entrare occorre confermare la maggiore età e accettare le regole.'); return;
    }
    mine = nick; mode = $('chat-mode').value;
    joining = true; formStatus();
    status(automatic ? 'Riconnessione automatica alla Chat commensali…'
                     : 'Connessione alla stanza pubblica in corso…');
    $('chat-send').disabled = true;
    $('chat-composer').disabled = true;
    try {
      const api = await import('https://esm.run/trystero@0.26.0');
      const currentRoom = api.joinRoom({appId: APP_ID}, ROOM_ID);
      room = currentRoom;
      messageAction = room.makeAction('pubmsg');
      helloAction = room.makeAction('hello');
      messageAction.onMessage = (obj, {peerId} = {}) => {
        if (room !== currentRoom || !connected || typeof peerId !== 'string' ||
            ignored.has(peerId) || !peers.has(peerId)) return;
        if (!obj || typeof obj !== 'object' || typeof obj.text !== 'string') return;
        const text = cleanText(obj.text, MAX_MSG), nick = cleanText(obj.nick, 24);
        if (!text || !nick || unsuitable(text) || unsuitable(nick)) return;
        const t = Date.now(), old = lastByPeer.get(peerId) || 0;
        if (t - old < RECEIVE_INTERVAL) return;
        lastByPeer.set(peerId, t);
        const p = peers.get(peerId);
        if (p) p.nick = nick;
        message('other', nick, text, peerId, t);
        roomSize();
      };
      helloAction.onMessage = (obj, {peerId} = {}) => {
        if (room !== currentRoom || !peers.has(peerId) ||
            !obj || typeof obj !== 'object') return;
        const name = cleanText(obj.nick, 24), where = cleanText(obj.mode, 30);
        if (name && !unsuitable(name)) peers.get(peerId).nick = name;
        if (where === 'Al locale' || where === 'Da fuori') peers.get(peerId).mode = where;
        roomSize();
      };
      room.onPeerJoin = peerId => {
        if (room !== currentRoom) return;
        peers.set(peerId, {nick: 'Ospite', mode: 'collegato'});
        Promise.resolve(helloAction.send({nick: mine, mode}, {target: peerId})).catch(() => {});
        roomSize();
      };
      room.onPeerLeave = peerId => {
        if (room !== currentRoom) return;
        peers.delete(peerId); lastByPeer.delete(peerId); ignored.delete(peerId);
        roomSize();
      };
      connected = true; joining = false;
      $('chat-start').hidden = true; $('chat-live').hidden = false;
      saveSession();
      formStatus(); roomSize();
      note(automatic ? 'Rientrato con lo stesso pseudonimo. I messaggi passati non sono recuperabili.'
                     : 'I messaggi sono temporanei e visibili solo ai presenti in questa stanza.');
      if (!automatic) {
        $('chat-composer').focus();
        void announceJoin();
      }
    } catch (err) {
      console.warn('Chat commensali: connessione non riuscita', err);
      const old = room;
      room = null; messageAction = null; helloAction = null;
      try {await old?.leave()} catch (_) {}
      connected = false; joining = false; formStatus();
      $('chat-composer').disabled = true;
      $('chat-send').disabled = true;
      status('Collegamento interrotto. Premi «Riconnetti» oppure rientra nella chat.', 'error');
      note('La chat richiede WebRTC e una rete disponibile. Lo pseudonimo è conservato temporaneamente su questo dispositivo.');
    }
  }

  // Dopo una sospensione di Android/WhatsApp la rete P2P può non riprendersi da sola.
  // Ricrea il collegamento, senza cancellare la conversazione ancora visibile.
  async function reconnect() {
    if (joining) return;
    if (reconnecting) return reconnecting;
    const saved = readSession();
    if (!saved) return;
    reconnecting = (async () => {
      const old = room;
      room = null; connected = false;
      messageAction = null; helloAction = null;
      peers.clear(); lastByPeer.clear(); ignored.clear();
      $('chat-send').disabled = true;
      $('chat-composer').disabled = true;
      status('Riconnessione alla chat in corso…');
      try {await old?.leave()} catch (_) {}
      await enter(true);
    })();
    try {await reconnecting} finally {reconnecting = null}
  }
  async function send() {
    if(!connected||!messageAction||peers.size===0) return;
    const input=$('chat-composer'),text=cleanText(input.value,MAX_MSG);
    if(!text) return;
    if(input.value.trim().length>MAX_MSG){note('Il messaggio supera i 280 caratteri.');return}
    const reason=unsuitable(text);
    if(reason){note(reason);return}
    if(Date.now()-lastSent<SEND_INTERVAL){
      note('Per evitare spam, lascia passare qualche secondo tra i messaggi.');return;
    }
    lastSent=Date.now();$('chat-send').disabled=true;
    try{
      await messageAction.send({nick:mine,mode,text});
      message('mine',mine+' (tu)',text,null,Date.now());input.value='';
      note('Messaggio inviato ai partecipanti collegati. Non viene archiviato sul sito.');
    }catch(e){
      status('Invio fallito. Verifica la connessione dei partecipanti.','error');
    }finally{roomSize()}
  }
  async function leave() {
    clearSession();
    connected=false;
    try{if(room)await room.leave()}catch(_){}
    room=null;messageAction=null;helloAction=null;peers.clear();
    lastByPeer.clear();ignored.clear();$('chat-feed').replaceChildren();
    $('chat-start').hidden=false;$('chat-live').hidden=true;joining=false;
    $('chat-nick').value='';$('chat-age').checked=false;$('chat-rules').checked=false;
    formStatus();roomSize();status('Sei uscito. I messaggi locali sono stati cancellati.');
    note('Scegli uno pseudonimo per rientrare.');
  }

  // Segnalazione su richiesta: nessun salvataggio dei messaggi su server.
  // La bozza contiene esclusivamente gli ultimi messaggi ancora visibili sul dispositivo.
  function reportConversation() {
    if (!connected) {
      note('Entra nella chat per segnalare la conversazione.');
      return;
    }
    const items=Array.from($('chat-feed').querySelectorAll('.cc-message')).slice(-12);
    if (!items.length) {
      note('Non ci sono messaggi visibili da segnalare.');
      return;
    }
    const transcript=items.map(el=>{
      const who=(el.querySelector('.cc-message-head strong')?.textContent||'Partecipante').trim();
      const time=(el.querySelector('.cc-message-head time')?.textContent||'').trim();
      const body=(el.querySelector(':scope > p')?.textContent||'').trim().slice(0,MAX_MSG);
      return '['+time+'] '+who+': '+body;
    }).filter(Boolean).join('\n');
    const today=new Intl.DateTimeFormat('it-IT',{
      timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric',
      hour:'2-digit',minute:'2-digit'
    }).format(new Date());
    const body='🚩 [CHAT COMMENSALI CONTROCORRENTE - SEGNALAZIONE CONVERSAZIONE]\n'+
      'Data e ora: '+today+'\n'+
      'Segnalazione da pseudonimo: '+mine+'\n'+
      'Ultimi '+items.length+' messaggi visibili sul dispositivo:\n\n'+transcript+
      '\n\nENTRA NELLA STANZA PER MODERARE:\n'+
      'https://piol77.github.io/controcorrente/chat-incontri.html\n\n'+
      'La conversazione è temporanea: al tuo ingresso vedrai solo i nuovi messaggi. '+
      'Il testo sopra è la copia inviata volontariamente da chi segnala. '+
      'Questa è una segnalazione, non una richiesta di prenotazione.';
    const ok=window.confirm(
      'Segnalare la conversazione al Controcorrente?\n\n'+
      'Si aprirà WhatsApp con una copia degli ultimi '+items.length+
      ' messaggi presenti sul TUO schermo. Il tuo numero WhatsApp sarà visibile al ristorante. '+
      'Per inviare davvero la segnalazione dovrai premere Invia nell’app.\n\n'+
      'ANTEPRIMA DEI MESSAGGI:\n'+transcript.slice(0,1300)+
      (transcript.length>1300?'\n[Altri messaggi inclusi nella bozza WhatsApp]':'')
    );
    if(!ok)return;
    note('WhatsApp si apre con la segnalazione. Premi Invia nell’app per avvertire il ristorante.');
    window.open('https://wa.me/393272292006?text='+encodeURIComponent(body),'_blank','noopener,noreferrer');
  }
  $('chat-join').addEventListener('click', () => enter(false));
  $('chat-send').addEventListener('click',send);
  $('chat-report-conversation').addEventListener('click',reportConversation);
  $('chat-composer').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
  $('chat-exit').addEventListener('click',leave);
  $('chat-reconnect').addEventListener('click', reconnect);
  $('chat-clear').addEventListener('click',()=>{
    $('chat-feed').replaceChildren();note('Cronologia cancellata solo da questo dispositivo.');
  });
  // pagehide può essere causato da WhatsApp o dal ripristino della scheda.
  // Non cancellare la sessione: alla riapertura lo pseudonimo si ripristina.
  window.addEventListener('pagehide', () => {
    backgroundAt = Date.now();
    const old = room;
    room = null; connected = false;
    messageAction = null; helloAction = null;
    peers.clear(); lastByPeer.clear();
    try {old?.leave()} catch (_) {}
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {backgroundAt = Date.now(); return}
    const away = backgroundAt ? Date.now() - backgroundAt : 0;
    backgroundAt = 0;
    if (readSession() && !joining && (!connected || away > 5000)) reconnect();
  });
  window.addEventListener('pageshow', () => {
    if (!document.hidden && !connected && !joining && readSession()) reconnect();
  });
  window.addEventListener('focus', () => {
    if (document.hidden || joining) return;
    const away = backgroundAt ? Date.now() - backgroundAt : 0;
    if (readSession() && (!connected || away > 5000)) reconnect();
  });
  roomSize();
  // Anche dopo un ricaricamento forzato da Android: sessionStorage conserva
  // temporaneamente solo pseudonimo e provenienza, mai testi o cronologia.
  if (readSession() && !document.hidden) reconnect();
})();