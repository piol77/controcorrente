/* Accoglienza vocale Controcorrente: rilevamento VOLTI locale, nessun riconoscimento o salvataggio. */
(() => {
  'use strict';
  const root = document.getElementById('accoglienza');
  if (!root) return;
  const startButton = root.querySelector('[data-welcome-start]');
  const stopButton = root.querySelector('[data-welcome-stop]');
  const testButton = root.querySelector('[data-welcome-test]');
  const flipButton = root.querySelector('[data-welcome-flip]');
  const talkButton = root.querySelector('[data-welcome-talk]');
  const micStopButton = root.querySelector('[data-welcome-mic-stop]');
  const voiceStatus = root.querySelector('[data-welcome-voice-status]');
  const questionText = root.querySelector('[data-welcome-question]');
  const answerText = root.querySelector('[data-welcome-answer]');
  const quietButton = root.querySelector('[data-welcome-quiet]');
  const video = root.querySelector('[data-welcome-video]');
  const status = root.querySelector('[data-welcome-status]');
  const MESSAGE = 'Benvenuti al Controcorrente, troverete esposto nel locale il QR code per accedere al sito con i menu relativi al pranzo, alla cena e anche qualche offerta del giorno.';
  const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
  const LIBRARY_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18';
  const FRAME_INTERVAL = 450;
  const RESET_ABSENCE_MS = 3500;
  const MIN_GREETING_INTERVAL_MS = 7000;

  let stream = null;
  let detector = null;
  let timer = null;
  let wakeLock = null;
  let active = false;
  let session = 0;
  let facingMode = 'user';
  let consecutiveFaces = 0;
  let maxFacesInVisit = 0;
  let observedFaces = 0;
  let greetedVisit = false;
  let absentSince = null;
  let lastGreeting = -Infinity;
  let recognition = null;
  let micTimer = null;
  let listening = false;
  let replying = false;
  let voiceRequest = 0;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function show(message) { status.textContent = message; }

  function sayWelcome(message = MESSAGE, fromVoice = false) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      show('Volto rilevato, ma la sintesi vocale non è supportata dal browser.');
      return false;
    }
    if (listening || (replying && !fromVoice) || window.speechSynthesis.speaking || window.speechSynthesis.pending) return false;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'it-IT';
    utterance.rate = 0.92;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const italian = voices.find(voice => voice.lang.toLowerCase() === 'it-it') ||
      voices.find(voice => voice.lang.toLowerCase().startsWith('it'));
    if (italian) utterance.voice = italian;
    utterance.onerror = () => {
      if (fromVoice) replying = false;
      if (active) show('Voce non disponibile: controlla audio e impostazioni del browser.');
    };
    window.speechSynthesis.speak(utterance);
    utterance.onstart = () => show(fromVoice ? 'Risposta vocale in riproduzione.' : 'Messaggio di benvenuto in riproduzione.');
    utterance.onend = () => {
      if (fromVoice) replying = false;
      show(active
      ? 'Accoglienza attiva: in attesa di un nuovo arrivo.'
      : 'Risposta terminata. La videocamera è spenta.');
    };
    return true;
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
    if (consecutiveFaces < 2) return;
    const newArrival = !greetedVisit || count > maxFacesInVisit;
    if (newArrival && now - lastGreeting >= MIN_GREETING_INTERVAL_MS && sayWelcome()) {
      greetedVisit = true;
      lastGreeting = now;
      maxFacesInVisit = Math.max(maxFacesInVisit, count);
    }
  }

  function runDetector(token) {
    if (!active || token !== session) return;
    if (!document.hidden && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
        const result = detector.detectForVideo(video, performance.now());
        updateDetection(result.detections ? result.detections.length : 0, performance.now());
      } catch (error) {
        show('Rilevamento interrotto: ' + (error.message || 'errore della fotocamera'));
        stop();
        return;
      }
    }
    timer = window.setTimeout(() => runDetector(token), FRAME_INTERVAL);
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator) || document.hidden || !active) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!active || document.hidden) { await lock.release(); return; }
      if (wakeLock && wakeLock !== lock) await wakeLock.release();
      wakeLock = lock;
    } catch (_) { /* opzionale */ }
  }

  function stop() {
    stopListening();
    session += 1;
    active = false;
    if (timer !== null) { clearTimeout(timer); timer = null; }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    video.pause();
    video.srcObject = null;
    video.hidden = true;
    if (detector) { detector.close(); detector = null; }
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    startButton.disabled = false;
    stopButton.disabled = true;
    flipButton.disabled = true;
    show('Accoglienza disattivata. La videocamera è spenta.');
    resetVisit();
  }

  function stopListening(message) {
    voiceRequest += 1;
    replying = false;
    const current = recognition;
    recognition = null;
    listening = false;
    if (micTimer !== null) { clearTimeout(micTimer); micTimer = null; }
    if (current) {
      current.onresult = current.onerror = current.onend = current.onstart = null;
      current.abort();
    }
    talkButton.disabled = !Recognition;
    micStopButton.disabled = true;
    talkButton.setAttribute('aria-pressed', 'false');
    voiceStatus.textContent = message || 'Microfono spento.';
  }

  function listen() {
    if (!Recognition || listening) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const current = new Recognition();
    recognition = current;
    listening = true;
    talkButton.disabled = true;
    micStopButton.disabled = false;
    talkButton.setAttribute('aria-pressed', 'true');
    current.lang = 'it-IT';
    current.continuous = false;
    current.interimResults = false;
    current.maxAlternatives = 1;
    voiceStatus.textContent = 'Autorizza il microfono, poi chiedi del menù o del benvenuto.';
    current.onstart = () => {
      if (recognition === current) voiceStatus.textContent = 'Ti ascolto: puoi chiedere dei menù, dei prezzi o il benvenuto.';
    };
    current.onresult = event => {
      if (recognition !== current) return;
      const phrase = event.results[event.resultIndex][0].transcript;
      questionText.textContent = phrase;
      stopListening('Richiesta ricevuta. Microfono spento; preparo la risposta.');
      const request = voiceRequest;
      replying = true;
      const reply = window.ControcorrenteMenuVoice?.answer(phrase) || Promise.resolve('La voce dei menù non è disponibile. Ricarica la pagina.');
      Promise.resolve(reply).then(answer => {
        if (request !== voiceRequest || document.hidden) return;
        const message = answer === 'WELCOME' ? MESSAGE : answer;
        answerText.textContent = message;
        voiceStatus.textContent = 'Microfono spento. Premi «Parla dei menù» per un’altra domanda.';
        if (sayWelcome(message, true) && answer === 'WELCOME' && active) {
          greetedVisit = true;
          lastGreeting = performance.now();
          maxFacesInVisit = Math.max(maxFacesInVisit, observedFaces);
        }
        // Nessuna ripetizione automatica se la voce non è disponibile.
        if (!window.speechSynthesis?.speaking && !window.speechSynthesis?.pending) replying = false;
      }).catch(() => {
        if (request !== voiceRequest) return;
        replying = false;
        voiceStatus.textContent = 'Risposta non disponibile. Consulta i menù del sito.';
      });
    };
    current.onerror = event => {
      if (recognition !== current) return;
      const messages = {
        'not-allowed': 'Permesso microfono negato. Autorizzalo nelle impostazioni del browser.',
        'service-not-allowed': 'Riconoscimento vocale non disponibile. Usa «Ascolta il benvenuto».',
        'audio-capture': 'Microfono non disponibile sul dispositivo.',
        'network': 'Connessione del servizio vocale non riuscita. Usa «Ascolta il benvenuto».',
        'no-speech': 'Non ho sentito la richiesta. Premi il pulsante e riprova.'
      };
      stopListening(messages[event.error] || 'Richiesta vocale interrotta. Microfono spento.');
    };
    current.onend = () => {
      if (recognition === current) stopListening('Ascolto terminato. Microfono spento.');
    };
    micTimer = setTimeout(() => stopListening('Tempo di ascolto terminato. Microfono spento.'), 15000);
    try { current.start(); }
    catch (_) { stopListening('Impossibile attivare il microfono. Usa «Ascolta il benvenuto».'); }
  }

  async function start() {
    if (active || startButton.disabled) return;
    const token = ++session;
    startButton.disabled = true;
    stopButton.disabled = false; // permette di interrompere anche il caricamento
    flipButton.disabled = true;
    show('Richiesta autorizzazione alla fotocamera…');
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Apri questa pagina tramite HTTPS con un browser compatibile.');
      }
      if (!('speechSynthesis' in window)) {
        throw new Error('Sintesi vocale non disponibile in questo browser.');
      }
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {facingMode: {ideal: facingMode}, width: {ideal: 640}, height: {ideal: 480}}
      });
      if (session !== token) { cameraStream.getTracks().forEach(track => track.stop()); return; }
      stream = cameraStream;
      video.srcObject = stream;
      video.hidden = false;
      video.style.transform = facingMode === 'user' ? 'scaleX(-1)' : '';
      await video.play();
      show('Caricamento del rilevatore di volti…');
      const {FaceDetector, FilesetResolver} = await import(LIBRARY_BASE + '/vision_bundle.mjs');
      if (session !== token) return;
      const vision = await FilesetResolver.forVisionTasks(LIBRARY_BASE + '/wasm');
      if (session !== token) return;
      const createdDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {modelAssetPath: MODEL_URL, delegate: 'CPU'},
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.65
      });
      if (session !== token) { createdDetector.close(); return; }
      detector = createdDetector;
      resetVisit();
      active = true;
      startButton.disabled = true;
      stopButton.disabled = false;
      flipButton.disabled = false;
      show('Accoglienza attiva: in attesa di un volto davanti alla fotocamera.');
      requestWakeLock();
      runDetector(token);
    } catch (error) {
      if (session !== token) return;
      stop();
      const reason = error.name === 'NotAllowedError'
        ? 'Permesso fotocamera negato. Autorizzala dalle impostazioni del browser.'
        : 'Impossibile avviare: ' + (error.message || 'controlla fotocamera e connessione.');
      show(reason);
    }
  }

  startButton.addEventListener('click', start);
  stopButton.addEventListener('click', stop);
  testButton.addEventListener('click', () => {
    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    sayWelcome();
    if (!active) show('Test del messaggio: per il rilevamento, attiva la fotocamera.');
  });
  talkButton.addEventListener('click', listen);
  quietButton.addEventListener('click', () => {
    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    show(active ? 'Accoglienza attiva. Voce interrotta.' : 'Voce interrotta. Videocamera spenta.');
  });
  micStopButton.addEventListener('click', () => stopListening());
  if (!Recognition) {
    talkButton.disabled = true;
    voiceStatus.textContent = 'Questo browser non supporta le richieste vocali. Usa «Ascolta il benvenuto».';
  }
  flipButton.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    stop();
    start();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopListening();
    if (!document.hidden && active) requestWakeLock();
  });
  window.addEventListener('pagehide', stop);
})();
