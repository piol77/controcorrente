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
  const RESET_ABSENCE_MS = 3500;
  const MIN_GREETING_INTERVAL_MS = 7000;
  const VOICE_RATE = 1.18;

  let stream = null;
  let detector = null;
  let detectionTimer = null;
  let restartTimer = null;
  let micTimer = null;
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
  let maxFacesInVisit = 0;
  let observedFaces = 0;
  let greetedVisit = false;
  let absentSince = null;
  let lastGreeting = -Infinity;
  let recognizerFailures = 0;

  function show(message) { status.textContent = message; }
  function controls() {
    startButton.textContent = active || starting ? 'Disattiva videocamera e microfono' : 'Attiva videocamera e microfono';
    startButton.setAttribute('aria-pressed', String(active || starting));
    quietButton.disabled = !active;
  }
  function stopRecognition() {
    if (restartTimer !== null) { clearTimeout(restartTimer); restartTimer = null; }
    if (micTimer !== null) { clearTimeout(micTimer); micTimer = null; }
    const current = recognition;
    recognition = null;
    if (current) {
      current.onstart = current.onresult = current.onerror = current.onend = null;
      try { current.abort(); } catch (_) { /* gia terminato */ }
    }
  }
  function cancelAudio() {
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
    });
  }
  async function respond(phrase) {
    if (!active || replying || speaking) return;
    stopRecognition();
    const request = ++voiceRequest;
    const token = session;
    replying = true;
    questionText.textContent = phrase;
    answerText.textContent = '…';
    voiceStatus.textContent = 'Un momento…';
    try {
      const answer = await window.ControcorrenteMenuVoice.answer(phrase);
      if (!active || token !== session || request !== voiceRequest || document.hidden) return;
      const message = answer === 'WELCOME' ? MESSAGE : answer;
      answerText.textContent = message;
      if (answer === 'WELCOME' || observedFaces > 0) {
        greetedVisit = true;
        lastGreeting = performance.now();
        maxFacesInVisit = Math.max(maxFacesInVisit, observedFaces);
      }
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
    current.continuous = false;
    current.interimResults = false;
    current.maxAlternatives = 3;
    voiceStatus.textContent = 'Ti ascolto…';
    current.onstart = () => {
      if (recognition === current) {
        recognizerFailures = 0;
        voiceStatus.textContent = 'Ti ascolto…';
      }
    };
    current.onresult = event => {
      if (recognition !== current || token !== session) return;
      const phrase = event.results[event.resultIndex]?.[0]?.transcript?.trim();
      if (phrase) respond(phrase);
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
      recognition = null;
      if (micTimer !== null) { clearTimeout(micTimer); micTimer = null; }
      scheduleListening(800);
    };
    // Se il browser non chiude spontaneamente un turno silenzioso, lo rinnova.
    micTimer = setTimeout(() => {
      if (recognition === current && token === session) {
        try { current.stop(); } catch (_) { stopRecognition(); scheduleListening(); }
      }
    }, 30000);
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
    maxFacesInVisit = 0;
    observedFaces = 0;
    greetedVisit = false;
    absentSince = null;
    lastGreeting = -Infinity;
  }
  function updateDetection(count, now) {
    observedFaces = count;
    if (count === 0) {
      consecutiveFaces = 0;
      if (absentSince === null) absentSince = now;
      if (now - absentSince >= RESET_ABSENCE_MS) {
        maxFacesInVisit = 0;
        greetedVisit = false;
      }
      return;
    }
    absentSince = null;
    consecutiveFaces += 1;
    if (consecutiveFaces < 2 || replying || speaking) return;
    if ((!greetedVisit || count > maxFacesInVisit) && now - lastGreeting >= MIN_GREETING_INTERVAL_MS) {
      greetedVisit = true;
      maxFacesInVisit = Math.max(maxFacesInVisit, count);
      lastGreeting = now;
      respond('Benvenuto');
    }
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
      video.srcObject = media;
      video.hidden = false;
      video.style.transform = 'scaleX(-1)';
      await video.play();
      if (token !== session) return;
      active = true;
      starting = false;
      replying = false;
      recognizerFailures = 0;
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
    voiceRequest += 1;
    replying = false;
    stopRecognition();
    cancelAudio();
    if (active) {
      voiceStatus.textContent = 'Voce fermata.';
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
