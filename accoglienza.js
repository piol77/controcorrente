/* Assistente audio scherzoso: freddure selezionate, nessuna registrazione. */
(() => {
  'use strict';
  const root = document.getElementById('accoglienza');
  if (!root) return;
  const startButton = root.querySelector('[data-welcome-start]');
  const quietButton = root.querySelector('[data-welcome-quiet]');
  const status = root.querySelector('[data-welcome-voice-status]');
  const question = root.querySelector('[data-welcome-question]');
  const answer = root.querySelector('[data-welcome-answer]');
  const source = root.querySelector('[data-welcome-source]');
  const synth = window.speechSynthesis;
  const key = 'cc-assistente-freddure-v1';
  // Short, checked selections; each source remains linked next to the answer.
  const jokes = [
    {text: 'Qual è il colmo per un matematico? Abitare in una frazione di Potenza.', url: 'https://www.barzellette.net/29560.htm', site: 'Barzellette.net'},
    {text: 'Qual è il colmo per un idraulico? Non capirci un tubo!', url: 'https://www.barzellette.net/9425.htm', site: 'Barzellette.net'},
    {text: 'Il colmo per un elettricista? Bere birre alla spina!', url: 'https://www.barzellette.net/10439.htm', site: 'Barzellette.net'},
    {text: 'Perché i pesci vivono nell’acqua salata? Perché il pepe li farebbe starnutire!', url: 'https://barzellettebrutte.it/', site: 'Barzellette Brutte'},
    {text: 'Quanti programmatori ci vogliono per cambiare una lampadina? Nessuno. È un problema hardware!', url: 'https://www.barzellette.net/barzellette-top-96.html', site: 'Barzellette.net'},
    {text: 'Un daino dice a un altro daino: giochiamo a nascondaino? Dai, no!', url: 'https://www.barzellette.net/barzellette-top-158.html', site: 'Barzellette.net'}
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
  function controls(playing) {
    startButton.textContent = 'Parla con me';
    startButton.setAttribute('aria-pressed', String(playing));
    quietButton.disabled = !playing;
  }
  function stop(message = 'Voce fermata. Premi “Parla con me” per ricominciare.') {
    generation++;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (currentUtterance) currentUtterance.onend = currentUtterance.onerror = null;
    currentUtterance = null;
    synth?.cancel();
    controls(false);
    status.textContent = message;
  }
  startButton.addEventListener('click', () => {
    stop('');
    const joke = nextJoke();
    question.textContent = 'Richiesta ricevuta.';
    answer.textContent = joke.text;
    source.href = joke.url;
    source.textContent = joke.site;
    source.hidden = false;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      status.textContent = 'La voce non è disponibile in questo browser. Puoi leggere la risposta qui sotto.';
      return;
    }
    controls(true);
    status.textContent = 'Ti ascolto… risposta in corso.';
    const token = generation;
    const utterance = new SpeechSynthesisUtterance('Un momento… Ecco la mia risposta. ' + joke.text);
    currentUtterance = utterance;
    utterance.lang = 'it-IT';
    utterance.voice = bestVoice();
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;
    const finish = failed => {
      if (token !== generation) return;
      if (timer !== null) clearTimeout(timer);
      timer = null;
      currentUtterance = null;
      controls(false);
      status.textContent = failed
        ? 'La voce si è interrotta. Riprova con “Parla con me” oppure leggi la risposta.'
        : 'Premi “Parla con me” per una nuova risposta.';
    };
    utterance.onend = () => finish(false);
    utterance.onerror = () => finish(true);
    // Keep speech in the click gesture so mobile browsers can start it.
    timer = setTimeout(() => stop('Voce interrotta. Premi “Parla con me” per riprovare.'), 45000);
    try { synth.resume(); synth.speak(utterance); } catch (_) { finish(true); }
  });
  quietButton.addEventListener('click', () => stop());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', () => stop());
  // getVoices can be empty until the browser finishes loading its voice list.
  if (synth) synth.getVoices();
  controls(false);
})();
