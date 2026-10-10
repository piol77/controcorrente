/* Videocamera + conversazione vocale Controcorrente. Nessun riconoscimento di identità. */
(() => {
  'use strict';
  const root = document.getElementById('accoglienza');
  if (!root) return;
  const startButton = root.querySelector('[data-welcome-start]');
  const quietButton = root.querySelector('[data-welcome-quiet]');
  const voiceStatus = root.querySelector('[data-welcome-voice-status]');
  const questionText = root.querySelector('[data-welcome-question]');
  const answerText = root.querySelector('[data-welcome-answer]');
  const video = root.querySelector('[data-welcome-video]');
  const status = root.querySelector('[data-welcome-status]');
  const MESSAGE = 'Benvenuti al Controcorrente, troverete esposto nel locale il QR code per accedere al sito con i menu relativi al pranzo, alla cena e anche qualche offerta del giorno.';
  const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
  const LIBRARY_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18';
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const FRAME_INTERVAL = 450;
  const GREETING_DELAY_MS = 1800;
  const TURN_PAUSE_MS = 900;
  const VOICE_RATE = 1.18;

  let stream = null;
  let detector = null;
  let detectionTimer = null;
  let restartTimer = null;
  let turnTimer = null;
  let audioTimer = null;
  let wakeLock = null;
  let active = false;
  let starting = false;
  let session = 0;
  let recognition = null;
  let replying = false;
  let speaking = false;
  let voiceRequest = 0;
  let audioEpoch = 0;
  let audioResolve = null;
  let consecutiveFaces = 0;
  let greetingDone = false;
  let conversationStarted = false;
  let listeningSince = null;
  let recognizerFailures = 0;
  let shortSessions = 0;

  function show(message) { status.textContent = message; }
  function controls() {
    startButton.textContent = active || starting ? 'Disattiva videocamera e microfono' : 'Attiva videocamera e microfono';
    startButton.setAttribute('aria-pressed', String(active || starting));
    quietButton.disabled = !active;
  }
  function stopRecognition() {
    if (restartTimer !== null) { clearTimeout(restartTimer); restartTimer = null; }
    if (turnTimer !== null) { clearTimeout(turnTimer); turnTimer = null; }
    const current = recognition;
    recognition = null;
    if (current) {
      current.onstart = current.onspeechstart = current.onspeechend = current.onresult = current.onerror = current.onend = null;
      try { current.abort(); } catch (_) { /* gia terminato */ }
    }
  }
  function cancelAudio() {
    if (audioTimer !== null) { clearTimeout(audioTimer); audioTimer = null; }
    audioEpoch += 1;
    const resolve = audioResolve;
    audioResolve = null;
    speaking = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    resolve?.(false);
  }
  function scheduleListening(delay = 600) {
    if (!active || starting || document.hidden || replying || speaking || recognition) return;
    if (restartTimer !== null) clearTimeout(restartTimer);
    const token = session;
    restartTimer = setTimeout(() => {
      restartTimer = null;
      if (token === session) listen();
    }, delay);
    voiceStatus.textContent = 'Pronto per la prossima domanda…';
  }
  function speak(message) {
    stopRecognition(); // il microfono vocale non deve riascoltare la risposta
    cancelAudio();
    if (!active || document.hidden) return Promise.resolve(false);
    speaking = true;
    const epoch = ++audioEpoch;
    voiceStatus.textContent = 'Risposta in corso…';
    return new Promise(resolve => {
      audioResolve = resolve;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'it-IT';
      utterance.rate = VOICE_RATE;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const italian = voices.find(v => v.lang.toLowerCase() === 'it-it') ||
        voices.find(v => v.lang.toLowerCase().startsWith('it'));
      if (italian) utterance.voice = italian;
      const finish = ok => {
        if (epoch !== audioEpoch) return;
        if (audioTimer !== null) { clearTimeout(audioTimer); audioTimer = null; }
        speaking = false;
        audioResolve = null;
        resolve(ok);
      };
      utterance.onend = () => finish(true);
      utterance.onerror = () => {
        if (epoch !== audioEpoch) return;
        finish(false);
        voiceStatus.textContent = 'Audio non disponibile. La risposta è scritta qui sotto.';
      };
      try { window.speechSynthesis.speak(utterance); }
      catch (_) { finish(false); }
      // Alcuni motori non inviano onend: l'ascolto deve poter ripartire comunque.
      if (speaking) audioTimer = setTimeout(() => {
        if (epoch !== audioEpoch) return;
        window.speechSynthesis.cancel();
        finish(false);
      }, Math.max(15000, message.length * 100 + 5000));
    });
  }
  async function respond(phrase, automaticGreeting = false) {
    if (!active || replying || speaking) return;
    stopRecognition();
    const request = ++voiceRequest;
    const token = session;
    replying = true;
    if (!automaticGreeting) conversationStarted = true;
    questionText.textContent = phrase;
    answerText.textContent = '…';
    voiceStatus.textContent = 'Un momento…';
    try {
      const answer = automaticGreeting ? MESSAGE : await window.ControcorrenteMenuVoice.answer(phrase);
      if (!active || token !== session || request !== voiceRequest || document.hidden) return;
      const message = answer;
      answerText.textContent = message;
      await speak(message);
    } catch (_) {
      if (token === session && request === voiceRequest) {
        answerText.textContent = 'Non riesco a leggere i menù. Riprova fra un momento.';
        await speak(answerText.textContent);
      }
    } finally {
      if (token === session && request === voiceRequest) {
        replying = false;
        scheduleListening();
      }
    }
  }
  function listen() {
    if (!active || starting || document.hidden || replying || speaking || recognition) return;
    const token = session;
    const current = new Recognition();
    recognition = current;
    current.lang = 'it-IT';
    current.continuous = true;
    current.interimResults = true;
    current.maxAlternatives = 3;
    let finalPhrase = '';
    let interimPhrase = '';
    let openedAt = null;
    const submit = () => {
      turnTimer = null;
      if (recognition === current && token === session && finalPhrase && !interimPhrase) respond(finalPhrase);
    };
    const waitForPause = () => {
      if (turnTimer !== null) clearTimeout(turnTimer);
      turnTimer = finalPhrase && !interimPhrase ? setTimeout(submit, TURN_PAUSE_MS) : null;
    };
    voiceStatus.textContent = 'Microfono in avvio…';
    current.onstart = () => {
      if (recognition === current) {
        recognizerFailures = 0;
        openedAt = listeningSince = performance.now();
        voiceStatus.textContent = 'Ti ascolto…';
      }
    };
    current.onspeechstart = () => {
      if (recognition !== current || token !== session) return;
      conversationStarted = true; // il saluto automatico non interrompe chi parla
      if (turnTimer !== null) { clearTimeout(turnTimer); turnTimer = null; }
      voiceStatus.textContent = 'Ti ascolto…';
    };
    current.onspeechend = () => {
      if (recognition === current && token === session) waitForPause();
    };
    current.onresult = event => {
      if (recognition !== current || token !== session) return;
      const finals = [], partials = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim();
        if (text) (result.isFinal ? finals : partials).push(text);
      }
      finalPhrase = finals.join(' ');
      interimPhrase = partials.join(' ');
      const phrase = [finalPhrase, interimPhrase].filter(Boolean).join(' ');
      if (phrase) {
        conversationStarted = true;
        questionText.textContent = phrase;
        voiceStatus.textContent = 'Ti ascolto…';
      }
      waitForPause();
    };
    current.onerror = event => {
      if (recognition !== current || token !== session) return;
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      const reasons = {
        'not-allowed': 'Autorizza fotocamera e microfono nelle impostazioni del browser.',
        'service-not-allowed': 'Il browser non ha un servizio di riconoscimento vocale disponibile.',
        'audio-capture': 'Microfono non disponibile sul dispositivo.',
        'network': 'Connessione al servizio vocale non disponibile.',
        'language-not-supported': 'Il servizio vocale non supporta l’italiano.'
      };
      stop();
      voiceStatus.textContent = reasons[event.error] || 'Riconoscimento vocale interrotto. Riattiva fotocamera e microfono.';
    };
    current.onend = () => {
      if (recognition !== current || token !== session) return;
      if (turnTimer !== null) { clearTimeout(turnTimer); turnTimer = null; }
      recognition = null;
      if (finalPhrase) {
        shortSessions = 0;
        respond(finalPhrase);
      } else {
        shortSessions = openedAt === null || performance.now() - openedAt < 1000 ? shortSessions + 1 : 0;
        if (shortSessions >= 3) {
          stop();
          voiceStatus.textContent = 'Il servizio vocale del browser si interrompe subito. Riapri la pagina in un browser compatibile e riattiva il microfono.';
        } else scheduleListening(800); // ripresa solo se il servizio del browser chiude
      }
    };
    try { current.start(); }
    catch (_) {
      stopRecognition();
      recognizerFailures += 1;
      if (recognizerFailures < 3) scheduleListening(1200);
      else {
        stop();
        voiceStatus.textContent = 'Impossibile mantenere l’ascolto. Riattiva fotocamera e microfono.';
      }
    }
  }
  function resetVisit() {
    consecutiveFaces = 0;
    greetingDone = false;
    conversationStarted = false;
    listeningSince = null;
  }
  function updateDetection(count, now) {
    if (count === 0) {
      consecutiveFaces = 0;
      return;
    }
    consecutiveFaces += 1;
    if (consecutiveFaces < 2 || replying || speaking || greetingDone || conversationStarted ||
      !recognition || listeningSince === null || now - listeningSince < GREETING_DELAY_MS) return;
    greetingDone = true; // una sola volta per attivazione, anche se il volto esce dall'inquadratura
    respond('Benvenuto', true);
  }
  function runDetector(token) {
    if (!active || token !== session || !detector) return;
    if (!document.hidden && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
        const result = detector.detectForVideo(video, performance.now());
        updateDetection(result.detections?.length || 0, performance.now());
      } catch (_) {
        detector.close();
        detector = null;
        show('Videocamera attiva. Saluto automatico non disponibile.');
        return; // la conversazione rimane utilizzabile
      }
    }
    detectionTimer = setTimeout(() => runDetector(token), FRAME_INTERVAL);
  }
  async function requestWakeLock() {
    if (!('wakeLock' in navigator) || document.hidden || !active) return;
    const token = session;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!active || token !== session || document.hidden) { await lock.release(); return; }
      if (wakeLock && wakeLock !== lock) await wakeLock.release();
      wakeLock = lock;
    } catch (_) { /* opzionale */ }
  }
  function stop() {
    session += 1;
    voiceRequest += 1;
    active = false;
    starting = false;
    replying = false;
    stopRecognition();
    cancelAudio();
    if (detectionTimer !== null) { clearTimeout(detectionTimer); detectionTimer = null; }
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
    video.hidden = true;
    detector?.close();
    detector = null;
    wakeLock?.release().catch(() => {});
    wakeLock = null;
    resetVisit();
    controls();
    show('Videocamera e microfono spenti.');
    voiceStatus.textContent = 'Conversazione disattivata.';
  }
  async function start() {
    if (active || starting) return;
    const token = ++session;
    starting = true;
    controls();
    show('Autorizza videocamera e microfono…');
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Apri la pagina tramite HTTPS.');
      if (!Recognition) throw new Error('Riconoscimento vocale non disponibile in questo browser. Apri il sito in Chrome o in un browser compatibile.');
      if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') throw new Error('Sintesi vocale non disponibile nel browser.');
      if (!window.ControcorrenteMenuVoice) throw new Error('Ricarica la pagina per attivare la voce.');
      const media = await navigator.mediaDevices.getUserMedia({
        audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true},
        video: {facingMode: {ideal: 'user'}, width: {ideal: 640}, height: {ideal: 480}}
      });
      if (token !== session) { media.getTracks().forEach(track => track.stop()); return; }
      stream = media;
      // SpeechRecognition acquisisce autonomamente il microfono. Non teniamo
      // una seconda registrazione audio aperta, che può interferire sui telefoni.
      media.getAudioTracks().forEach(track => track.stop());
      video.srcObject = media;
      video.hidden = false;
      video.style.transform = 'scaleX(-1)';
      await video.play();
      if (token !== session) return;
      active = true;
      starting = false;
      replying = false;
      recognizerFailures = 0;
      shortSessions = 0;
      resetVisit();
      window.ControcorrenteMenuVoice.reset?.();
      controls();
      show('Videocamera e microfono attivi.');
      listen();
      requestWakeLock();
      try {
        const {FaceDetector, FilesetResolver} = await import(LIBRARY_BASE + '/vision_bundle.mjs');
        if (token !== session) return;
        const vision = await FilesetResolver.forVisionTasks(LIBRARY_BASE + '/wasm');
        if (token !== session) return;
        const created = await FaceDetector.createFromOptions(vision, {
          baseOptions: {modelAssetPath: MODEL_URL, delegate: 'CPU'},
          runningMode: 'VIDEO', minDetectionConfidence: 0.65
        });
        if (token !== session) { created.close(); return; }
        detector = created;
        runDetector(token);
      } catch (_) {
        if (active && token === session) show('Videocamera e microfono attivi. Saluto automatico non disponibile.');
      }
    } catch (error) {
      if (token !== session) return;
      stop();
      show(error.name === 'NotAllowedError'
        ? 'Autorizzazione a fotocamera e microfono negata. Controlla i permessi del browser.'
        : error.message || 'Impossibile attivare videocamera e microfono.');
    }
  }
  startButton.addEventListener('click', () => active || starting ? stop() : start());
  quietButton.addEventListener('click', () => {
    const needsResume = replying || speaking;
    voiceRequest += 1;
    replying = false;
    if (needsResume) stopRecognition();
    cancelAudio();
    if (active) {
      voiceStatus.textContent = recognition ? 'Ti ascolto…' : 'Voce fermata.';
      scheduleListening();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      voiceRequest += 1;
      replying = false;
      stopRecognition();
      cancelAudio();
      voiceStatus.textContent = active ? 'Ascolto in pausa.' : 'Conversazione disattivata.';
    } else if (active) {
      scheduleListening();
      requestWakeLock();
    }
  });
  window.addEventListener('pagehide', stop);
  controls();
})();
