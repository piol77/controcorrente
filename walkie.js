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
  status.className = 'cc-walkie-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;
  radio.insertAdjacentElement('afterend', toggle);
  toggle.insertAdjacentElement('afterend', talk);
  holder.appendChild(status);

  // Internal page views attach to the one top-document connection and recorder.
  let owner;
  try { if (window.parent !== window) owner = window.parent.ccWalkie; } catch (_) {}
  if (owner) { owner.attach(toggle, talk, status); return; }

  const endpoint = 'wss://lgjijnhhnjioiyvfmkvy.supabase.co/realtime/v1/websocket?vsn=1.0.0&apikey=sb_publishable_aibVnScYEW5GrPWfu5M4Ag_ieHHGgKv';
  const topic = 'realtime:controcorrente-walkie-v1';
  const id = crypto.randomUUID();
  let active = false, connected = false, socket = null, joinRef = null, seq = 0;
  let reconnect = null, heartbeat = null, recorder = null, stream = null;
  let pressed = false, recording = false, maxTimer = null, cooldownUntil = 0;
  let remoteSpeaker = null, remoteUntil = 0, remoteTimer = null;
  let activeToggle = toggle, activeTalk = talk, activeStatus = status;
  let statusText = '', output = new Audio(), audioQueue = [], audioPlaying = false;
  let audioContext = null;
  const pieces = new Map(), played = new Set();

  function setStatus(message) { statusText = message; render(); }
  function render() {
    for (const el of new Set([toggle, activeToggle])) {
      el.dataset.active = String(active && connected);
      el.querySelector('small').textContent = active ? 'OFF' : 'ON';
      el.setAttribute('aria-pressed', String(active));
      el.setAttribute('aria-label', active ? 'Spegni walkie-talkie' : 'Accendi walkie-talkie');
      el.title = active ? 'Spegni walkie-talkie' : 'Accendi walkie-talkie';
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
  }
  function attach(nextToggle, nextTalk, nextStatus) {
    activeToggle = nextToggle; activeTalk = nextTalk; activeStatus = nextStatus;
    bind(nextToggle, nextTalk); render();
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
    clearTimeout(reconnect); clearInterval(heartbeat); clearTimeout(remoteTimer);
    connected = false; remoteSpeaker = null; remoteUntil = 0;
    if (socket) { const old = socket; socket = null; old.close(); }
  }
  function connect() {
    if (!active || socket) return;
    try { socket = new WebSocket(endpoint); }
    catch (_) { setStatus('Connessione non disponibile'); return; }
    const current = socket;
    const timeout = setTimeout(() => { if (current === socket && !connected) current.close(); }, 10000);
    current.onopen = () => {
      if (current !== socket) return;
      joinRef = String(seq+1);
      push('phx_join', {config:{broadcast:{ack:false,self:false},presence:{enabled:false},private:false}});
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
      } else if (packet.event === 'broadcast' && packet.topic === topic) {
        const body = packet.payload;
        if (body?.event === 'floor') receiveFloor(body.payload);
        if (body?.event === 'voice') receiveVoice(body.payload);
      } else if (packet.event === 'phx_error' || packet.event === 'phx_close') current.close();
    };
    current.onclose = () => {
      clearTimeout(timeout); clearInterval(heartbeat);
      if (current !== socket) return;
      socket = null; connected = false; remoteSpeaker = null;
      if (recording || pressed) finish();
      if (active) { setStatus('Riconnessione…'); reconnect = setTimeout(connect, 2000); }
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
    if (navigator.vibrate) navigator.vibrate(80);
    setStatus('Messaggio in ascolto…');
    if (audioContext) {
      blob.arrayBuffer().then(bytes => audioContext.decodeAudioData(bytes)).then(buffer => {
        if (!active) { audioPlaying = false; return; }
        const source = audioContext.createBufferSource();
        source.buffer = buffer; source.connect(audioContext.destination);
        source.onended = () => { audioPlaying = false; setStatus(''); playNext(); };
        return audioContext.resume().then(() => source.start());
      }).catch(() => playWithElement(blob));
      return;
    }
    playWithElement(blob);
  }
  function playWithElement(blob) {
    if (!active) { audioPlaying = false; return; }
    const url = URL.createObjectURL(blob);
    output.src = url;
    const done = () => {
      output.onended = output.onerror = null;
      output.removeAttribute('src'); output.load(); URL.revokeObjectURL(url);
      audioPlaying = false; setStatus(''); playNext();
    };
    output.onended = done; output.onerror = done;
    output.play().catch(() => { done(); setStatus('Audio bloccato dal browser: riattiva il walkie-talkie'); });
  }
  async function enable() {
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
      // Unlock incoming audio on the same user-initiated activation when possible.
      setStatus(connected ? '' : 'Connessione…');
    } catch (_) {
      active = false; disconnect();
      window.alert('Per parlare devi consentire il microfono nelle impostazioni del browser.');
      render();
    }
  }
  function disable() {
    pressed = false; finish(); active = false; disconnect();
    audioQueue = []; output.pause(); output.removeAttribute('src');
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
  window.ccWalkie = {attach};
  document.addEventListener('visibilitychange',() => { if (document.hidden) finish(); });
  window.addEventListener('pagehide',disable);
  render();
})();
