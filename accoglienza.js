/* Assistente audio Controcorrente: sola lettura dei menù pubblicati. */
(() => {
  'use strict';
  const root = document.getElementById('accoglienza');
  if (!root) return;
  const startButton = root.querySelector('[data-welcome-start]');
  const quietButton = root.querySelector('[data-welcome-quiet]');
  const voiceStatus = root.querySelector('[data-welcome-voice-status]');
  const questionText = root.querySelector('[data-welcome-question]');
  const answerText = root.querySelector('[data-welcome-answer]');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const MESSAGE = 'Benvenuti al Controcorrente, troverete esposto nel locale il QR code per accedere al sito con i menu relativi al pranzo, alla cena e anche qualche offerta del giorno.';
  const VOICE_RATE = 1.18;
  const TURN_PAUSE_MS = 900;

  let active = false;
  let recognition = null;
  let restartTimer = null;
  let turnTimer = null;
  let audioTimer = null;
  let speaking = false;
  let replying = false;
  let session = 0;
  let request = 0;
  let audioEpoch = 0;
  let audioResolve = null;
  let shortSessions = 0;

  function controls() {
    startButton.textContent = active ? 'Disattiva assistente audio' : 'Attiva assistente audio';
    startButton.setAttribute('aria-pressed', String(active));
    quietButton.disabled = !active;
  }

  function stopRecognition() {
    if (restartTimer !== null) { clearTimeout(restartTimer); restartTimer = null; }
    if (turnTimer !== null) { clearTimeout(turnTimer); turnTimer = null; }
    const current = recognition;
    recognition = null;
    if (!current) return;
    current.onstart = current.onspeechstart = current.onspeechend =
      current.onresult = current.onerror = current.onend = null;
    try { current.abort(); } catch (_) { /* già terminato */ }
  }

  function cancelAudio() {
    if (audioTimer !== null) { clearTimeout(audioTimer); audioTimer = null; }
    audioEpoch += 1;
    speaking = false;
    window.speechSynthesis?.cancel();
    const resolve = audioResolve;
    audioResolve = null;
    resolve?.(false);
  }

  function scheduleListening(delay = 500) {
    if (!active || document.hidden || replying || speaking || recognition) return;
    if (restartTimer !== null) clearTimeout(restartTimer);
    const token = session;
    restartTimer = setTimeout(() => {
      restartTimer = null;
      if (active && token === session) listen();
    }, delay);
    voiceStatus.textContent = 'Pronto per la prossima domanda…';
  }

  function speak(message) {
    stopRecognition();
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
      utterance.voice = voices.find(voice => voice.lang.toLowerCase() === 'it-it') ||
        voices.find(voice => voice.lang.toLowerCase().startsWith('it')) || null;
      const finish = ok => {
        if (epoch !== audioEpoch) return;
        if (audioTimer !== null) { clearTimeout(audioTimer); audioTimer = null; }
        speaking = false;
        audioResolve = null;
        resolve(ok);
      };
      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);
      try { window.speechSynthesis.speak(utterance); }
      catch (_) { finish(false); }
      if (speaking) audioTimer = setTimeout(() => {
        if (epoch !== audioEpoch) return;
        window.speechSynthesis.cancel();
        finish(false);
      }, Math.max(15000, message.length * 100 + 5000));
    });
  }

  async function respond(phrase) {
    if (!active || replying || speaking) return;
    stopRecognition();
    const token = session;
    const turn = ++request;
    replying = true;
    questionText.textContent = phrase;
    answerText.textContent = '…';
    voiceStatus.textContent = 'Un momento…';
    try {
      const answer = await window.ControcorrenteMenuVoice.answer(phrase);
      if (!active || document.hidden || token !== session || turn !== request) return;
      answerText.textContent = answer;
      await speak(answer);
    } catch (_) {
      if (active && token === session && turn === request) {
        answerText.textContent = 'Non riesco a leggere i menù. Riprova fra un momento.';
        await speak(answerText.textContent);
      }
    } finally {
      if (active && token === session && turn === request) {
        replying = false;
        scheduleListening();
      }
    }
  }

  function listen() {
    if (!active || document.hidden || replying || speaking || recognition) return;
    const token = session;
    const current = new Recognition();
    recognition = current;
    current.lang = 'it-IT';
    current.continuous = true;
    current.interimResults = true;
    current.maxAlternatives = 3;
    let openedAt = null;
    let finalPhrase = '';
    let interimPhrase = '';

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
      if (recognition !== current || token !== session) return;
      openedAt = performance.now();
      voiceStatus.textContent = 'Ti ascolto…';
    };
    current.onspeechstart = () => {
      if (recognition !== current || token !== session) return;
      if (turnTimer !== null) { clearTimeout(turnTimer); turnTimer = null; }
      voiceStatus.textContent = 'Ti ascolto…';
    };
    current.onspeechend = () => {
      if (recognition === current && token === session) waitForPause();
    };
    current.onresult = event => {
      if (recognition !== current || token !== session) return;
      const finals = [];
      const partials = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim();
        if (text) (result.isFinal ? finals : partials).push(text);
      }
      finalPhrase = finals.join(' ');
      interimPhrase = partials.join(' ');
      const phrase = [finalPhrase, interimPhrase].filter(Boolean).join(' ');
      if (phrase) questionText.textContent = phrase;
      waitForPause();
    };
    current.onerror = event => {
      if (recognition !== current || token !== session) return;
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      const reasons = {
        'not-allowed': 'Autorizza il microfono nelle impostazioni del browser.',
        'service-not-allowed': 'Il browser non dispone del riconoscimento vocale.',
        'audio-capture': 'Microfono non disponibile sul dispositivo.',
        'network': 'Connessione al servizio vocale non disponibile.',
        'language-not-supported': 'Il servizio vocale non supporta l’italiano.'
      };
      stop(reasons[event.error] || 'Riconoscimento vocale interrotto.');
    };
    current.onend = () => {
      if (recognition !== current || token !== session) return;
      if (turnTimer !== null) { clearTimeout(turnTimer); turnTimer = null; }
      recognition = null;
      if (finalPhrase) {
        shortSessions = 0;
        respond(finalPhrase);
        return;
      }
      shortSessions = openedAt === null || performance.now() - openedAt < 1000 ? shortSessions + 1 : 0;
      if (shortSessions >= 3) {
        stop('Il servizio vocale del browser si interrompe subito. Riapri la pagina in Chrome e riattiva il microfono.');
      } else {
        scheduleListening(800);
      }
    };
    try { current.start(); }
    catch (_) {
      recognition = null;
      scheduleListening(1200);
    }
  }

  function stop(message = 'Conversazione disattivata.') {
    session += 1;
    request += 1;
    active = false;
    replying = false;
    stopRecognition();
    cancelAudio();
    controls();
    voiceStatus.textContent = message;
  }

  async function start() {
    if (active) return;
    if (!window.isSecureContext || !Recognition) {
      voiceStatus.textContent = 'Apri il sito in Chrome tramite HTTPS per usare il microfono.';
      return;
    }
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined' ||
      !window.ControcorrenteMenuVoice) {
      voiceStatus.textContent = 'Assistente audio non disponibile in questo browser.';
      return;
    }
    session += 1;
    active = true;
    replying = false;
    shortSessions = 0;
    window.ControcorrenteMenuVoice.reset?.();
    controls();
    answerText.textContent = MESSAGE;
    await speak(MESSAGE);
    if (active) scheduleListening(300);
  }

  startButton.addEventListener('click', () => active ? stop() : start());
  quietButton.addEventListener('click', () => {
    const needsResume = speaking || replying;
    request += 1;
    replying = false;
    if (needsResume) stopRecognition();
    cancelAudio();
    if (active) {
      voiceStatus.textContent = recognition ? 'Ti ascolto…' : 'Voce fermata.';
      scheduleListening(250);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      request += 1;
      replying = false;
      stopRecognition();
      cancelAudio();
      if (active) voiceStatus.textContent = 'Ascolto in pausa.';
    } else if (active) {
      scheduleListening();
    }
  });
  window.addEventListener('pagehide', () => stop());
  controls();
})();
