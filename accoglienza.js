/* Accoglienza vocale Controcorrente: rilevamento VOLTI locale, nessun riconoscimento o salvataggio. */
(() => {
  'use strict';
  const root = document.getElementById('accoglienza');
  if (!root) return;
  const startButton = root.querySelector('[data-welcome-start]');
  const stopButton = root.querySelector('[data-welcome-stop]');
  const testButton = root.querySelector('[data-welcome-test]');
  const flipButton = root.querySelector('[data-welcome-flip]');
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
  let greetedVisit = false;
  let absentSince = null;
  let lastGreeting = -Infinity;

  function show(message) { status.textContent = message; }

  function sayWelcome() {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      show('Volto rilevato, ma la sintesi vocale non è supportata dal browser.');
      return;
    }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
    const utterance = new SpeechSynthesisUtterance(MESSAGE);
    utterance.lang = 'it-IT';
    utterance.rate = 0.92;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const italian = voices.find(voice => voice.lang.toLowerCase() === 'it-it') ||
      voices.find(voice => voice.lang.toLowerCase().startsWith('it'));
    if (italian) utterance.voice = italian;
    utterance.onerror = () => {
      if (active) show('Voce non disponibile: controlla audio e impostazioni del browser.');
    };
    window.speechSynthesis.speak(utterance);
    show('Volto rilevato: messaggio di benvenuto pronunciato.');
  }

  function resetVisit() {
    consecutiveFaces = 0;
    maxFacesInVisit = 0;
    greetedVisit = false;
    absentSince = null;
    lastGreeting = -Infinity;
  }

  function updateDetection(count, now) {
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
    if (newArrival && now - lastGreeting >= MIN_GREETING_INTERVAL_MS) {
      greetedVisit = true;
      lastGreeting = now;
      sayWelcome();
    }
    maxFacesInVisit = Math.max(maxFacesInVisit, count);
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
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (_) { /* opzionale */ }
  }

  function stop() {
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
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    sayWelcome();
    if (!active) show('Test del messaggio: per il rilevamento, attiva la fotocamera.');
  });
  flipButton.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    stop();
    start();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && active) requestWakeLock();
  });
  window.addEventListener('pagehide', stop);
})();
