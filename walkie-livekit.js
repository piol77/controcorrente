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

  // LiveKit implementation. Loaded only after the token endpoint is configured.
  // The visual controls above are the exact CSS/markup of the old walkie.
  const TOKEN_ENDPOINT = window.CC_LIVEKIT_TOKEN_ENDPOINT || '';
  const CLIENT = window.LivekitClient;
  const BEEP_TOPIC = 'cc-walkie-end';
  let active = false, connected = false, connecting = false, closed = false;
  let room = null, currentGeneration = 0, retryTimer = null;
  let pressed = false, talking = false, maxTimer = null, cooldownUntil = 0;
  let activeToggle = toggle, activeTalk = talk, activeStatus = status, activeCount = count;
  let statusText = '', connectedCount = null;
  let audioContext = null;
  const remoteAudio = new Map();

  function beep() {
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
      gain.gain.exponentialRampToValueAtTime(.0001, now + .10);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + .11);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }).catch(() => {});
  }
  function remoteIsTalking() {
    return connected && room &&
      Array.from(room.remoteParticipants.values()).some(p => p.isMicrophoneEnabled);
  }
  function setStatus(text) { statusText = text; render(); }
  function render() {
    const busy = remoteIsTalking();
    const cooling = Date.now() < cooldownUntil;
    for (const el of new Set([toggle, activeToggle])) {
      el.dataset.active = String(active && connected);
      el.querySelector('small').textContent = active ? 'OFF' : 'ON';
      el.setAttribute('aria-pressed', String(active));
      el.setAttribute('aria-label', active ? 'Spegni walkie-talkie' : 'Accendi walkie-talkie');
      el.title = active ? 'Spegni walkie-talkie' : 'Accendi walkie-talkie';
    }
    for (const el of new Set([talk, activeTalk])) {
      el.hidden = !active;
      el.disabled = !connected || connecting || talking || cooling || busy;
      el.dataset.talking = String(talking);
      el.setAttribute('aria-label', talking ? 'Rilascia per terminare' : 'Tieni premuto per parlare, massimo 10 secondi');
      el.title = 'Tieni premuto per parlare (massimo 10 secondi)';
    }
    const message = statusText || (talking ? 'Stai parlando…' : busy ? 'Qualcuno sta parlando…'
      : cooling ? 'Pausa di 3 secondi' : connected ? 'In ascolto · tieni premuto PARLA'
      : 'Connessione…');
    for (const el of new Set([status, activeStatus])) {
      el.hidden = !active;
      el.textContent = message;
    }
    for (const el of new Set([count, activeCount])) {
      el.textContent = connectedCount === null ? '–' : String(connectedCount);
      el.setAttribute('aria-label','Persone connesse al walkie-talkie: '+(connectedCount ?? 'non disponibile'));
    }
  }
  function attach(nextToggle, nextTalk, nextStatus, nextCount) {
    activeToggle = nextToggle; activeTalk = nextTalk;
    activeStatus = nextStatus; activeCount = nextCount;
    bind(nextToggle, nextTalk); render();
  }
  function updateCount() {
    connectedCount = connected && room ? room.remoteParticipants.size + 1 : null;
    render();
  }
  function clearRemoteAudio() {
    for (const node of remoteAudio.values()) { node.pause(); node.remove(); }
    remoteAudio.clear();
  }
  function onAudioTrack(track) {
    if (track.kind !== 'audio') return;
    const node = track.attach();
    node.autoplay = true;
    node.setAttribute('playsinline','');
    node.style.display = 'none';
    document.body.appendChild(node);
    remoteAudio.set(track.sid, node);
    if (room && !room.canPlaybackAudio) setStatus('Audio bloccato: tocca ON/OFF per riattivare');
    render();
  }
  function offAudioTrack(track) {
    const node = remoteAudio.get(track.sid);
    if (node) { track.detach(node); node.pause(); node.remove(); }
    remoteAudio.delete(track.sid);
    render();
  }
  function scheduleRetry() {
    if (!active || closed || retryTimer !== null) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, 3000);
  }
  function installHandlers(nextRoom) {
    const E = CLIENT.RoomEvent;
    nextRoom.on(E.ParticipantConnected, updateCount);
    nextRoom.on(E.ParticipantDisconnected, updateCount);
    nextRoom.on(E.TrackSubscribed, onAudioTrack);
    nextRoom.on(E.TrackUnsubscribed, offAudioTrack);
    nextRoom.on(E.TrackMuted, render);
    nextRoom.on(E.TrackUnmuted, render);
    nextRoom.on(E.AudioPlaybackStatusChanged, () => {
      if (!nextRoom.canPlaybackAudio && active) setStatus('Audio bloccato: premi OFF e ON');
    });
    nextRoom.on(E.DataReceived, (bytes, participant, kind, topic) => {
      if (topic !== BEEP_TOPIC || !participant || bytes.length > 100) return;
      try { if (new TextDecoder().decode(bytes) === 'end') beep(); } catch (_) {}
    });
    nextRoom.on(E.Reconnecting, () => {
      if (room !== nextRoom) return;
      connected = false;
      setStatus('Riconnessione…');
      updateCount();
    });
    nextRoom.on(E.Reconnected, () => {
      if (room !== nextRoom) return;
      connected = true;
      statusText = '';
      updateCount();
    });
    nextRoom.on(E.Disconnected, () => {
      if (room !== nextRoom) return;
      room = null;
      connected = false;
      connecting = false;
      finish(false);
      clearRemoteAudio();
      setStatus('Riconnessione…');
      updateCount();
      scheduleRetry();
    });
  }

  async function connect() {
    if (!active || closed || connecting || room) return;
    if (!TOKEN_ENDPOINT || !CLIENT?.Room) {
      setStatus('LiveKit non configurato');
      return;
    }
    connecting = true;
    const generation = ++currentGeneration;
    setStatus('Connessione…');
    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: '{}', credentials:'omit', cache:'no-store',
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw Error('Token unavailable ' + response.status);
      const auth = await response.json();
      if (!auth || !/^wss:\/\//.test(auth.server_url || '') ||
          typeof auth.participant_token !== 'string') throw Error('Invalid LiveKit credentials');
      if (!active || generation !== currentGeneration) return;
      const nextRoom = new CLIENT.Room({adaptiveStream:false,dynacast:false});
      room = nextRoom;
      installHandlers(nextRoom);
      await nextRoom.connect(auth.server_url, auth.participant_token, {autoSubscribe:true});
      if (!active || generation !== currentGeneration) {
        if (room === nextRoom) room = null;
        nextRoom.disconnect();
        return;
      }
      connected = true;
      statusText = '';
      updateCount();
      // May be rejected by mobile autoplay rules; listening remains opted in.
      nextRoom.startAudio().catch(() => {
        if (active && room === nextRoom) setStatus('Audio bloccato: premi OFF e ON');
      });
    } catch (e) {
      if (generation !== currentGeneration || !active) return;
      if (room) { const failed = room; room = null; failed.disconnect(); }
      connected = false;
      setStatus('Riconnessione…');
      updateCount();
      scheduleRetry();
      console.warn('[Controcorrente LiveKit]', e.message || e);
    } finally {
      if (generation === currentGeneration) connecting = false;
    }
  }
  async function enable() {
    if (!TOKEN_ENDPOINT || !CLIENT?.Room) {
      window.alert('Walkie-talkie LiveKit non ancora configurato.');
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      window.alert('Per usare il walkie-talkie serve HTTPS e accesso al microfono.');
      return;
    }
    active = true;
    window.ccJazzPlayer?.turnOff();
    render();
    // Activate the browser audio pipeline from the real user click.
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume().catch(() => {});
    } catch (_) { audioContext = null; }
    const micPermission = navigator.mediaDevices.getUserMedia({audio:true,video:false})
      .then(stream => stream.getTracks().forEach(track => track.stop()))
      .catch(() => {}); // Listen-only still works if microphone permission is denied.
    connect();
    await micPermission;
  }
  function disable() {
    active = false;
    ++currentGeneration;
    clearTimeout(retryTimer); retryTimer = null;
    finish(false);
    pressed = false;
    connected = false;
    connecting = false;
    const former = room;
    room = null;
    if (former) former.disconnect();
    clearRemoteAudio();
    statusText = '';
    connectedCount = null;
    render();
  }

  async function start(event) {
    if (!active || !connected || talking || remoteIsTalking() || Date.now() < cooldownUntil) return;
    event.preventDefault();
    pressed = true;
    if (event.pointerId !== undefined) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch (_) {}
    }
    const targetRoom = room;
    talking = true;
    maxTimer = setTimeout(() => finish(), 10000);
    setStatus('Stai parlando… massimo 10 secondi');
    try {
      await targetRoom.localParticipant.setMicrophoneEnabled(true, {
        echoCancellation:true, noiseSuppression:true,
      });
      // Rapid taps and delayed permission prompts must never leave the mic active.
      if (!pressed || !active || room !== targetRoom || !connected) {
        await targetRoom.localParticipant.setMicrophoneEnabled(false);
      }
    } catch (_) {
      if (room === targetRoom) setStatus('Microfono non disponibile o permesso negato');
      finish(false);
    }
  }
  function finish(emitBeep = true) {
    pressed = false;
    clearTimeout(maxTimer); maxTimer = null;
    if (!talking) return;
    talking = false;
    const targetRoom = room;
    // Stop publishing speech first, then notify the other participant to beep.
    if (targetRoom) {
      targetRoom.localParticipant.setMicrophoneEnabled(false)
        .then(() => {
          if (emitBeep && active && targetRoom === room && connected) {
            targetRoom.localParticipant.publishData(new TextEncoder().encode('end'), {
              reliable:true, topic:BEEP_TOPIC,
            }).catch(() => {});
          }
        }).catch(() => {});
    }
    if (emitBeep && active) beep();
    cooldownUntil = Date.now() + 3000;
    setStatus('Pausa di 3 secondi');
    setTimeout(() => { if (active && Date.now() >= cooldownUntil) setStatus(''); }, 3000);
  }
  function bind(on, mic) {
    on.addEventListener('click', () => active ? disable() : enable());
    mic.addEventListener('pointerdown', start);
    mic.addEventListener('pointerup', () => finish());
    mic.addEventListener('pointercancel', () => finish());
    mic.addEventListener('lostpointercapture', () => finish());
    mic.addEventListener('contextmenu', e => e.preventDefault());
    mic.addEventListener('keydown', e => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e);
    });
    mic.addEventListener('keyup', e => {
      if (e.key === ' ' || e.key === 'Enter') finish();
    });
  }
  bind(toggle, talk);
  window.ccWalkie = {attach, deactivate:disable};
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  window.addEventListener('pagehide', () => {
    disable(); closed = true;
  });
  render();
})();
