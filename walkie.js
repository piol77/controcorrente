// Controcorrente walkie-talkie: transient voice for visitors who opt in.
// The existing radio player is intentionally left independent.
(() => {
  'use strict';
  const radio = document.getElementById('cc-jazz-toggle');
  if (!radio || document.getElementById('cc-walkie-toggle')) return;
  const holder = radio.closest('.cc-radio-controls');
  if (!holder) return;

  const style = document.createElement('style');
  style.textContent = `
    .cc-walkie-toggle,.cc-walkie-talk{box-sizing:border-box;display:inline-flex;flex:none;align-items:center;justify-content:center;flex-direction:column;width:44px;height:44px;padding:3px;border:1px solid var(--gold,#cba76d);background:var(--navy,#082a43);color:var(--gold,#cba76d);cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    .cc-walkie-toggle{border-radius:12px}.cc-walkie-talk{border-radius:50%;width:48px;height:48px}
    .cc-walkie-toggle svg,.cc-walkie-talk svg{width:20px;height:20px;pointer-events:none}
    .cc-walkie-toggle small,.cc-walkie-talk small{font:700 9px/1 system-ui,sans-serif;pointer-events:none}
    .cc-walkie-toggle[data-active="true"]{box-shadow:0 0 0 2px var(--gold,#cba76d);animation:cc-walkie-listen 1.3s ease-in-out infinite}
    .cc-walkie-talk[data-talking="true"]{background:#a7392b;color:white;border-color:#fff;box-shadow:0 0 0 3px #a7392b}
    .cc-walkie-talk:disabled{opacity:.55;cursor:default}
    .cc-walkie-talk[hidden]{display:none!important}
    .cc-walkie-count{display:inline-flex;align-items:center;justify-content:center;min-width:28px;min-height:28px;padding:1px 7px;border:1px solid var(--gold,#cba76d);border-radius:20px;color:var(--gold,#cba76d);font:600 11px/1.3 system-ui,sans-serif}
    .cc-walkie-status{flex-basis:100%;text-align:right;font:11px/1.3 system-ui,sans-serif;color:var(--gold,#cba76d);min-height:14px}
    .cc-walkie-status[hidden]{display:none!important}
    @keyframes cc-walkie-listen{0%,100%{transform:translateX(0)}25%{transform:translateX(1px)}50%{transform:translateX(-1px)}75%{transform:translateX(1px)}}
    @media(prefers-reduced-motion:reduce){.cc-walkie-toggle[data-active="true"]{animation:none}}
  `;
  document.head.appendChild(style);
  const toggle = document.createElement('button');
  toggle.id = 'cc-walkie-toggle';
  toggle.type = 'button';
  toggle.className = 'cc-walkie-toggle';
  toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 4h7l2-3M10 6h8v16H6V6h4zm-1 5h6m-6 3h6m-4 3h2" stroke-linecap="round" stroke-linejoin="round"/></svg><small>ON</small>';
  const talk = document.createElement('button');
  talk.type = 'button';
  talk.className = 'cc-walkie-talk';
  talk.hidden = true;
  talk.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11a6 6 0 0 0 12 0m-6 6v4m-4 0h8" stroke-linecap="round"/></svg><small>PARLA</small>';
  const status = document.createElement('span');
  const count = document.createElement('span');
  count.className = 'cc-walkie-count';
  count.setAttribute('aria-label', 'Persone connesse al walkie-talkie');
  count.title = 'Persone in ascolto al walkie-talkie';
  count.textContent = '–';
  status.className = 'cc-walkie-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;
  const radioCount = holder.querySelector('.cc-radio-listeners');
  (radioCount || radio).insertAdjacentElement('afterend', count);
  count.insertAdjacentElement('afterend', toggle);
  toggle.insertAdjacentElement('afterend', talk);
  holder.appendChild(status);

  // Internal page views attach to the one top-document connection and recorder.
  let owner;
  try { if (window.parent !== window) owner = window.parent.ccWalkie; } catch (_) {}
  if (owner) { owner.attach(toggle, talk, status, count); return; }

  const endpoint = 'wss://lgjijnhhnjioiyvfmkvy.supabase.co/realtime/v1/websocket?vsn=1.0.0&apikey=sb_publishable_aibVnScYEW5GrPWfu5M4Ag_ieHHGgKv';
  const topic = 'realtime:controcorrente-walkie-v1';
  const id = crypto.randomUUID();
  const intentKey='cc-walkie-enabled-session-v1';
  let active = false, connected = false, socket = null, joinRef = null, seq = 0, closed = false;
  const walkieQuietHours = () => {
    const hour=Number(new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/Rome',hour:'2-digit',hourCycle:'h23'
    }).format(new Date()));
    return hour>=0 && hour<6;
  };
  let reconnect = null, heartbeat = null, presenceTimer = null, presenceRetry = null, recorder = null, stream = null;
  // Supabase throttles Presence updates per client. Count can refresh every 10 s
  // while its existing 12 s stale-session cutoff remains unchanged.
  const PRESENCE_REFRESH_MS = 10000;
  const PRESENCE_MIN_GAP_MS = 8000;
  let lastPresenceSent = 0, presenceRegistered = false;
  let pressed = false, recording = false, maxTimer = null, cooldownUntil = 0;
  let remoteSpeaker = null, remoteUntil = 0, remoteTimer = null;
  let activeToggle = toggle, activeTalk = talk, activeStatus = status, activeCount = count;
  let presences = {}, connectedCount = null;
  let statusText = '', output = new Audio(), audioQueue = [], audioPlaying = false;
  let audioContext = null, currentSource = null, currentOutputUrl = null, playbackEpoch = 0;
  const pieces = new Map(), played = new Set();

  function endBeep() {
    if (!audioContext || !active) return;
    audioContext.resume().then(() => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(660, now + .09);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.15, now + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .1);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now); oscillator.stop(now + .11);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }).catch(() => {});
  }

  function setStatus(message) { statusText = message; render(); }
  function render() {
    const quiet=walkieQuietHours();
    for (const el of new Set([toggle, activeToggle])) {
      el.dataset.active = String(active && connected);
      el.querySelector('small').textContent = quiet ? '06:00' : active ? 'OFF' : 'ON';
      el.disabled=quiet;
      el.style.opacity=quiet ? '0.55' : '1';
      el.setAttribute('aria-pressed', String(active));
      el.setAttribute('aria-label', quiet ? 'Walkie-talkie disponibile dalle 06:00' : active ? 'Spegni walkie-talkie' : 'Accendi walkie-talkie');
      el.title = quiet ? 'Walkie-talkie disponibile dalle 06:00' : active ? 'Spegni walkie-talkie' : 'Accendi walkie-talkie';
    }
    const cooling = Date.now() < cooldownUntil;
    for (const el of new Set([talk, activeTalk])) {
      el.hidden = !active;
      el.disabled = !connected || cooling || !!remoteSpeaker || !navigator.mediaDevices?.getUserMedia;
      el.dataset.talking = String(recording);
      el.setAttribute('aria-label', recording ? 'Rilascia per inviare' : 'Tieni premuto per parlare, massimo 10 secondi');
      el.title = 'Tieni premuto per parlare (massimo 10 secondi)';
    }
    for (const el of new Set([status, activeStatus])) {
      el.hidden = !active;
      el.textContent = statusText || (recording ? 'Stai parlando…' : remoteSpeaker ? 'Qualcuno sta parlando…' : cooling ? 'Pausa di 3 secondi' : connected ? 'In ascolto · tieni premuto PARLA' : 'Connessione…');
    }
    for (const el of new Set([count, activeCount])) {
      el.textContent = connectedCount === null ? '–' : String(connectedCount);
      el.setAttribute('aria-label','Persone connesse al walkie-talkie: '+(connectedCount ?? 'non disponibile'));
    }
  }
  function attach(nextToggle, nextTalk, nextStatus, nextCount) {
    activeToggle = nextToggle; activeTalk = nextTalk; activeStatus = nextStatus; activeCount = nextCount;
    bind(nextToggle, nextTalk); render();
  }
  function updateCount() {
    const now = Date.now();
    connectedCount = connected ? Object.values(presences).filter(entry =>
      entry?.metas?.some(meta => Number.isFinite(meta.at) && now-meta.at >= -5000 && now-meta.at < 12000)
    ).length : null;
    render();
  }
  function trackPresence() {
    if (!connected) { updateCount(); return; }
    // Do not send repeated untrack messages for listeners who are already OFF.
    if (!active && !presenceRegistered) { updateCount(); return; }
    const now = Date.now();
    const remaining = PRESENCE_MIN_GAP_MS - (now - lastPresenceSent);
    if (remaining > 0) {
      // Coalesce a quick ON/OFF or a duplicate call during microphone permission.
      clearTimeout(presenceRetry);
      presenceRetry = setTimeout(trackPresence, remaining);
      updateCount();
      return;
    }
    clearTimeout(presenceRetry);
    presenceRetry = null;
    const event = active ? 'track' : 'untrack';
    const payload = active ? {at:now} : {};
    if (push('presence',{type:'presence',event,payload})) {
      lastPresenceSent = now;
      presenceRegistered = active;
    }
    updateCount();
  }
  function push(event, payload, room = topic) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({topic:room, event, payload, ref:String(++seq), join_ref:room === topic ? joinRef : null}));
    return true;
  }
  function broadcast(event, payload) {
    return connected && push('broadcast', {type:'broadcast', event, payload});
  }
  function disconnect() {
    clearTimeout(reconnect); clearInterval(heartbeat); clearInterval(presenceTimer); clearTimeout(presenceRetry); clearTimeout(remoteTimer);
    presenceRetry = null; presenceRegistered = false;
    connected = false; remoteSpeaker = null; remoteUntil = 0;
    presences = {}; connectedCount = null;
    if (socket) { const old = socket; socket = null; old.close(); }
  }
  function connect() {
    if (closed || !active || walkieQuietHours() || socket) return;
    try { socket = new WebSocket(endpoint); }
    catch (_) { setStatus('Connessione non disponibile'); return; }
    const current = socket;
    const timeout = setTimeout(() => { if (current === socket && !connected) current.close(); }, 10000);
    current.onopen = () => {
      if (current !== socket) return;
      joinRef = String(seq+1);
      push('phx_join', {config:{broadcast:{ack:false,self:false},presence:{enabled:true,key:id},private:false}});
    };
    current.onmessage = e => {
      if (current !== socket) return;
      let packet;
      try { packet = JSON.parse(e.data); } catch (_) { return; }
      if (packet.event === 'phx_reply' && packet.ref === joinRef) {
        clearTimeout(timeout);
        if (packet.payload?.status !== 'ok') { current.close(); return; }
        connected = true; setStatus('');
        heartbeat = setInterval(() => push('heartbeat', {}, 'phoenix'), 20000);
        presenceTimer = setInterval(trackPresence, PRESENCE_REFRESH_MS);
        trackPresence();
      } else if (packet.event === 'presence_state' && packet.topic === topic) {
        presences = packet.payload || {}; updateCount();
      } else if (packet.event === 'presence_diff' && packet.topic === topic) {
        for (const key of Object.keys(packet.payload?.leaves || {})) delete presences[key];
        Object.assign(presences,packet.payload?.joins || {});
        updateCount();
      } else if (packet.event === 'broadcast' && packet.topic === topic) {
        const body = packet.payload;
        if (body?.event === 'floor') receiveFloor(body.payload);
        if (body?.event === 'voice') receiveVoice(body.payload);
      } else if (packet.event === 'phx_error' || packet.event === 'phx_close') current.close();
    };
    current.onclose = () => {
      clearTimeout(timeout); clearInterval(heartbeat); clearInterval(presenceTimer); clearTimeout(presenceRetry);
      if (current !== socket) return;
      presenceRetry = null; presenceRegistered = false;
      socket = null; connected = false; remoteSpeaker = null; connectedCount = null; presences = {};
      if (recording || pressed) finish();
      if (!closed && active && !walkieQuietHours() && !document.hidden) { setStatus('Riconnessione…'); reconnect = setTimeout(connect, 2000); }
      else render();
    };
    current.onerror = () => { /* onclose handles reconnection. */ };
  }
  function receiveFloor(data) {
    if (!active || !data || data.from === id || typeof data.from !== 'string') return;
    if (data.action === 'start' && !recording && Number.isFinite(data.at) && Math.abs(Date.now()-data.at) < 15000) {
      remoteSpeaker = data.from; remoteUntil = Date.now()+12000;
      clearTimeout(remoteTimer);
      remoteTimer = setTimeout(() => { remoteSpeaker = null; render(); }, 12000);
      render();
    } else if (data.action === 'end' && remoteSpeaker === data.from) {
      remoteSpeaker = null; clearTimeout(remoteTimer); render();
    }
  }
  function receiveVoice(data) {
    if (!active || !data || data.from === id || !/^[\w-]{8,80}$/.test(data.message || '') ||
        !Number.isInteger(data.index) || !Number.isInteger(data.total) || data.total < 1 || data.total > 20 ||
        data.index < 0 || data.index >= data.total || typeof data.bytes !== 'string' || data.bytes.length > 46000 ||
        !/^(audio\/webm|audio\/ogg|audio\/mp4)(;[\w=,.-]+)?$/.test(data.mime || '') ||
        !Number.isFinite(data.at) || Math.abs(Date.now()-data.at) > 30000 || played.has(data.message)) return;
    let record = pieces.get(data.message);
    if (!record) {
      record = {at:Date.now(),parts:Array(data.total).fill(null),mime:data.mime,from:data.from};
      pieces.set(data.message,record);
    }
    if (record.parts.length !== data.total || record.mime !== data.mime || record.from !== data.from) return;
    try {
      const raw = atob(data.bytes);
      record.parts[data.index] = Uint8Array.from(raw, c => c.charCodeAt(0));
    } catch (_) { return; }
    if (record.parts.every(Boolean)) {
      pieces.delete(data.message); played.add(data.message);
      if (played.size > 50) played.delete(played.values().next().value);
      const blob = new Blob(record.parts,{type:record.mime});
      if (blob.size <= 180000) { audioQueue.push(blob); playNext(); }
    }
    for (const [key,item] of pieces) if (Date.now()-item.at > 20000) pieces.delete(key);
  }
  function playNext() {
    if (audioPlaying || !active || !audioQueue.length) return;
    audioPlaying = true;
    const blob = audioQueue.shift();
    const epoch = playbackEpoch;
    if (navigator.vibrate) navigator.vibrate(80);
    setStatus('Messaggio in ascolto…');
    if (audioContext) {
      blob.arrayBuffer().then(bytes => audioContext.decodeAudioData(bytes)).then(buffer => {
        if (!active || epoch !== playbackEpoch) return;
        const source = audioContext.createBufferSource();
        currentSource = source;
        source.buffer = buffer; source.connect(audioContext.destination);
        source.onended = () => {
          if (currentSource === source) currentSource = null;
          if (epoch !== playbackEpoch) return;
          endBeep(); audioPlaying = false; setStatus(''); playNext();
        };
        return audioContext.resume().then(() => { if (active && epoch === playbackEpoch) source.start(); });
      }).catch(() => playWithElement(blob,epoch));
      return;
    }
    playWithElement(blob,epoch);
  }
  function playWithElement(blob,epoch) {
    if (!active || epoch !== playbackEpoch) return;
    const url = URL.createObjectURL(blob);
    currentOutputUrl = url;
    output.src = url;
    const done = (finished = false) => {
      output.onended = output.onerror = null;
      output.removeAttribute('src'); output.load(); URL.revokeObjectURL(url);
      if (currentOutputUrl === url) currentOutputUrl = null;
      if (epoch !== playbackEpoch) return;
      if (finished) endBeep();
      audioPlaying = false; setStatus(''); playNext();
    };
    output.onended = () => done(true); output.onerror = () => done(false);
    output.play().catch(() => { done(); setStatus('Audio bloccato dal browser: riattiva il walkie-talkie'); });
  }
  async function enable() {
    if (walkieQuietHours()) { render(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || !window.WebSocket || !window.isSecureContext) {
      window.alert('Walkie-talkie: usa un browser HTTPS che supporti il microfono.'); return;
    }
    // Request permission directly within the user's tap; browsers never allow silent consent.
    const permission = navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume().catch(() => {});
    } catch (_) { audioContext = null; }
    active = true; render(); connect();
    try {
      const mic = await permission;
      mic.getTracks().forEach(track => track.stop());
      if (!active) return;
      try { sessionStorage.setItem(intentKey,'on'); } catch (_) {}
      window.ccJazzPlayer?.turnOff();
      trackPresence();
      // Unlock incoming audio on the same user-initiated activation when possible.
      setStatus(connected ? '' : 'Connessione…');
    } catch (_) {
      active = false;
      try { sessionStorage.removeItem(intentKey); } catch (_) {}
      trackPresence();
      delete presences[id]; updateCount();
      disconnect();
      window.alert('Per parlare devi consentire il microfono nelle impostazioni del browser.');
      render();
    }
  }
  function disable() {
    try { sessionStorage.removeItem(intentKey); } catch (_) {}
    pressed = false; finish(); active = false;
    trackPresence();
    delete presences[id]; updateCount();
    playbackEpoch++;
    audioQueue = []; audioPlaying = false;
    if (currentSource) { try { currentSource.stop(); } catch (_) {} currentSource = null; }
    output.pause(); output.onended = output.onerror = null; output.removeAttribute('src');
    if (currentOutputUrl) { URL.revokeObjectURL(currentOutputUrl); currentOutputUrl = null; }
    disconnect();
    statusText = ''; render();
  }
  function pickMime() {
    return ['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus']
      .find(type => MediaRecorder.isTypeSupported(type)) || '';
  }
  async function start(event) {
    if (!active || !connected || recording || remoteSpeaker || Date.now() < cooldownUntil) return;
    event.preventDefault(); pressed = true;
    if (event.pointerId != null) try { event.currentTarget.setPointerCapture(event.pointerId); } catch (_) {}
    try {
      const mic = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if (!pressed || !active || !connected || remoteSpeaker) { mic.getTracks().forEach(t => t.stop()); return; }
      const mimeType = pickMime();
      stream = mic;
      recorder = new MediaRecorder(mic,mimeType ? {mimeType,audioBitsPerSecond:24000} : {audioBitsPerSecond:24000});
      const thisRecorder = recorder, chunks = [];
      thisRecorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      thisRecorder.onstop = async () => {
        if (stream === mic) stream = null;
        mic.getTracks().forEach(t => t.stop());
        if (recorder === thisRecorder) recorder = null;
        if (!active || !connected || !chunks.length) return;
        const blob = new Blob(chunks,{type:thisRecorder.mimeType || mimeType || chunks[0].type});
        if (blob.size > 180000) { setStatus('Messaggio troppo grande: riprova più breve'); return; }
        try {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const total = Math.ceil(bytes.length/24000), message = crypto.randomUUID(), at = Date.now();
          if (total > 20) throw Error('clip too large');
          for (let index = 0; index < total; index++) {
            if (!active || !connected) break;
            const part = bytes.subarray(index*24000,(index+1)*24000);
            broadcast('voice',{from:id,message,index,total,at,mime:blob.type,bytes:btoa(String.fromCharCode(...part))});
            await new Promise(resolve => setTimeout(resolve,90));
          }
        } catch (_) { setStatus('Invio non riuscito: riprova'); }
      };
      thisRecorder.start(); recording = true; broadcast('floor',{from:id,action:'start',at:Date.now()});
      maxTimer = setTimeout(finish,10000); setStatus('Stai parlando… massimo 10 secondi');
    } catch (_) {
      pressed = false; if (stream) stream.getTracks().forEach(t => t.stop()); stream = null;
      setStatus('Microfono non disponibile o permesso negato');
    }
  }
  function finish() {
    pressed = false;
    clearTimeout(maxTimer); maxTimer = null;
    if (!recording) return;
    recording = false;
    try { if (recorder?.state === 'recording') recorder.stop(); } catch (_) {}
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    broadcast('floor',{from:id,action:'end',at:Date.now()});
    endBeep();
    cooldownUntil = Date.now()+3000; setStatus('Pausa di 3 secondi');
    setTimeout(() => { if (active && Date.now() >= cooldownUntil) setStatus(''); },3000);
  }
  function bind(on, mic) {
    on.addEventListener('click',() => active ? disable() : enable());
    mic.addEventListener('pointerdown',start);
    mic.addEventListener('pointerup',finish);
    mic.addEventListener('pointercancel',finish);
    mic.addEventListener('lostpointercapture',finish);
    mic.addEventListener('contextmenu',e => e.preventDefault());
    // Keyboard hold-to-talk mirrors pointer press/release.
    mic.addEventListener('keydown',e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
    mic.addEventListener('keyup',e => { if (e.key === ' ' || e.key === 'Enter') finish(); });
  }
  bind(toggle,talk);
  window.ccWalkie = {attach,deactivate:disable};
  try { active=sessionStorage.getItem(intentKey)==='on'; } catch (_) {}
  if(active && walkieQuietHours())disable();
  else if(active && !document.hidden)connect();
  function restoreConnection() {
    if(walkieQuietHours()){if(active || socket)disable();else render();return;}
    if(!active){render();return;}
    closed=false;
    disconnect();
    setStatus('Riconnessione…');
    connect();
  }
  window.setInterval(()=>{if(walkieQuietHours() && (active || socket))disable();else render();},15000);
  window.addEventListener('focus',()=>{if(walkieQuietHours())restoreConnection();else if(active && !socket && !document.hidden)restoreConnection();else render();});
  document.addEventListener('visibilitychange',() => {
    if(document.hidden)finish();
    else restoreConnection();
  });
  window.addEventListener('pagehide',() => {
    finish();
    closed=true;
    disconnect();
  });
  window.addEventListener('pageshow',() => {
    if(!document.hidden && active && !socket)restoreConnection();
  });
  render();
})();
