/* Assistente audio scherzoso: freddure selezionate, nessuna registrazione. */
(() => {
  'use strict';
  const root = document.getElementById('accoglienza');
  if (!root) return;
  const startButton = root.querySelector('[data-welcome-start]');
  const talkButton = root.querySelector('[data-welcome-talk]');
  const quietButton = root.querySelector('[data-welcome-quiet]');
  const status = root.querySelector('[data-welcome-voice-status]');
  const question = root.querySelector('[data-welcome-question]');
  const answer = root.querySelector('[data-welcome-answer]');
  const source = root.querySelector('[data-welcome-source]');
  const synth = window.speechSynthesis;
  const key = 'cc-assistente-freddure-v2';
  // Short, checked selections; each source remains linked next to the answer.
  const jokes = [
    {text: 'Qual è il colmo per un matematico? Abitare in una frazione di Potenza.', url: 'https://www.barzellette.net/29560.htm', site: 'Barzellette.net'},
    {text: 'Qual è il colmo per un idraulico? Non capirci un tubo!', url: 'https://www.barzellette.net/9425.htm', site: 'Barzellette.net'},
    {text: 'Il colmo per un elettricista? Bere birre alla spina!', url: 'https://www.barzellette.net/10439.htm', site: 'Barzellette.net'},
    {text: 'Perché i pesci vivono nell’acqua salata? Perché il pepe li farebbe starnutire!', url: 'https://barzellettebrutte.it/', site: 'Barzellette Brutte'},
    {text: 'Quanti programmatori ci vogliono per cambiare una lampadina? Nessuno. È un problema hardware!', url: 'https://www.barzellette.net/barzellette-top-96.html', site: 'Barzellette.net'},
    {text: 'Un daino dice a un altro daino: giochiamo a nascondaino? Dai, no!', url: 'https://www.barzellette.net/barzellette-top-158.html', site: 'Barzellette.net'},
    {text: 'Cosa dicono delle patate in pericolo? Oh no, siamo fritte!', url: 'https://www.barzellette.net/29067.htm', site: 'Barzellette.net'},
    {text: 'Cosa fa un cammello su un budino? Attraversa il dessert!', url: 'https://www.barzellette.net/705.htm', site: 'Barzellette.net'},
    {text: 'Una duna nel deserto dice a un’altra duna: speriamo che passi qualche duno!', url: 'https://www.barzellette.net/1323.htm', site: 'Barzellette.net'},
    {text: 'Qual è il colmo per un giardiniere? Scordarsi di innaffiare i nontiscordardimé!', url: 'https://www.barzellette.net/9889.htm', site: 'Barzellette.net'}
  ];
  let saved = {remaining: [], last: -1};
  try {
    const value = JSON.parse(sessionStorage.getItem(key));
    if (value && Array.isArray(value.remaining) &&
        value.remaining.every(i => Number.isInteger(i) && i >= 0 && i < jokes.length) &&
        new Set(value.remaining).size === value.remaining.length &&
        Number.isInteger(value.last) && value.last >= -1 && value.last < jokes.length) saved = value;
  } catch (_) {}
  function nextJoke() {
    if (!saved.remaining.length) {
      saved.remaining = jokes.map((_, i) => i);
      for (let i = saved.remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [saved.remaining[i], saved.remaining[j]] = [saved.remaining[j], saved.remaining[i]];
      }
      if (saved.remaining.at(-1) === saved.last) {
        [saved.remaining[0], saved.remaining[saved.remaining.length - 1]] =
          [saved.remaining.at(-1), saved.remaining[0]];
      }
    }
    const index = saved.remaining.pop();
    saved.last = index;
    try { sessionStorage.setItem(key, JSON.stringify(saved)); } catch (_) {}
    return jokes[index];
  }
  function bestVoice() {
    // Prefer enhanced/neural Italian voices, then the device's Italian default.
    const score = voice => {
      const name = voice.name.toLowerCase();
      return (/natural|neural|enhanced|premium/.test(name) ? 100 : 0) +
        (/google|microsoft|elsa|isabella|alice/.test(name) ? 20 : 0) +
        (voice.lang.toLowerCase() === 'it-it' ? 10 : 0) + (voice.default ? 5 : 0);
    };
    return synth.getVoices().filter(v => /^it(?:-|_|$)/i.test(v.lang))
      .sort((a, b) => score(b) - score(a))[0] || null;
  }
  let generation = 0;
  let timer = null;
  let currentUtterance = null;
  let active = false;
  let hasSpoken = false;
  let beepContext = null;
  function controls(busy = false) {
    startButton.textContent = active ? 'Disattiva assistente audio' : 'Attiva assistente audio';
    startButton.setAttribute('aria-pressed', String(active));
    talkButton.disabled = !active;
    talkButton.textContent = hasSpoken ? '🎙 Continua a parlare' : '🎙 Parla con me';
    talkButton.setAttribute('aria-pressed', String(busy));
    quietButton.disabled = !busy;
  }
  function stop(message = 'Voce fermata. Premi “Continua a parlare” per proseguire.') {
    generation++;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (currentUtterance) currentUtterance.onend = currentUtterance.onerror = null;
    currentUtterance = null;
    synth?.cancel();
    if (beepContext) {
      try { beepContext.close()?.catch(() => {}); } catch (_) {}
      beepContext = null;
    }
    controls();
    status.textContent = message;
  }
  function beep() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      const context = new AudioContext();
      beepContext = context;
      context.resume()?.catch(() => {});
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.10, context.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.14);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => {
        if (beepContext === context) beepContext = null;
        try { context.close()?.catch(() => {}); } catch (_) {}
      };
      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch (_) { /* The visual listening cue works even without a beep. */ }
  }
  function say(text, token, done) {
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;
    utterance.lang = 'it-IT';
    utterance.voice = bestVoice();
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;
    const finish = failed => {
      if (token !== generation || currentUtterance !== utterance) return;
      currentUtterance = null;
      done(failed);
    };
    utterance.onend = () => finish(false);
    utterance.onerror = () => finish(true);
    try { synth.resume(); synth.speak(utterance); } catch (_) { finish(true); }
  }
  startButton.addEventListener('click', () => {
    active = !active;
    stop(active ? 'Assistente attivo. Premi “Parla con me” e parla dopo il bip.' : 'Assistente disattivato.');
  });
  talkButton.addEventListener('click', () => {
    if (!active) return;
    stop('🎙 Ti ascolto… parla dopo il bip.');
    hasSpoken = true;
    controls(true);
    question.textContent = '🎙 In ascolto…';
    answer.textContent = '—';
    source.hidden = true;
    beep();
    const token = generation;
    function reply() {
      if (token !== generation || !active || document.hidden) return;
      if (timer !== null) clearTimeout(timer);
      timer = null;
      if (currentUtterance) {
        currentUtterance.onend = currentUtterance.onerror = null;
        currentUtterance = null;
        synth?.cancel();
      }
      const joke = nextJoke();
      question.textContent = 'Richiesta ricevuta.';
      answer.textContent = joke.text;
      source.href = joke.url;
      source.textContent = joke.site;
      source.hidden = false;
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
        controls();
        status.textContent = 'La voce non è disponibile in questo browser. Puoi leggere la risposta qui sotto.';
        return;
      }
      status.textContent = 'Risposta in corso…';
      timer = setTimeout(() => stop('Voce interrotta. Premi “Continua a parlare” per riprovare.'), 45000);
      say(joke.text, token, failed => {
        if (timer !== null) clearTimeout(timer);
        timer = null;
        controls();
        status.textContent = failed
          ? 'La voce si è interrotta. Premi “Continua a parlare” per riprovare.'
          : 'Premi “Continua a parlare” per la prossima domanda.';
      });
    }
    // This is a simulated listening turn, with no microphone permissions.
    // Speak the acknowledgement in the tap gesture to unlock mobile speech.
    if (synth && typeof SpeechSynthesisUtterance !== 'undefined') {
      timer = setTimeout(reply, 3500);
      say('Ti ascolto.', token, () => {
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(reply, 1800);
      });
    } else {
      timer = setTimeout(reply, 2200);
    }
  });
  quietButton.addEventListener('click', () => stop());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', () => stop());
  if (synth) synth.getVoices();
  controls();
})();
