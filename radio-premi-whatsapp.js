(() => {
  // The checkout calls this hook only after its existing validations and reservation.
  if (window.__DEMO_ROUTE || window.__DEMO_OPEN_WHATSAPP) return;
  const api = 'https://lgjijnhhnjioiyvfmkvy.supabase.co/functions/v1/radio-premi';
  const reward = 'Hai vinto! Hai prenotato con il codice corretto. Se vieni a cena, avrai 5 € di sconto su un conto complessivo di almeno 50 € prima dello sconto, indipendentemente dal numero di partecipanti alla tavolata.';
  const notesLine = /^(\*Allergie \/ note: )([^\n]*)(\*)$/m;
  const readCode = notes => notes.match(/(?:^|[^0-9])(?:codice(?:\s+radio)?|sconto(?:\s+radio)?|radio|premio)\s*[:#-]?\s*([0-9]{5})(?![0-9])/i)?.[1]
    || notes.match(/(?:^|[\s,;])([0-9]{5})(?=$|[\s,;.!?])/)?.[1];
  async function decorate(url) {
    const encodedText = url.match(/[?&]text=([^&#]+)/)?.[1];
    if (!encodedText) return url;
    const message = decodeURIComponent(encodedText);
    const notes = message.match(notesLine)?.[2];
    const code = notes && readCode(notes);
    if (!code) return url;
    const response = await fetch(api,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(2500)});
    if (!response.ok) return url;
    const status = await response.json();
    if (!status.records?.some(record => record.code === code && ['held','confirmed'].includes(record.status))) return url;
    const decorated = message.replace(notesLine,(_,label,original,end) => label+original+' — '+reward+end);
    const updated = url.replace(/([?&]text=)[^&#]+/,(_,key) => key+encodeURIComponent(decorated));
    return updated.replace(/(S\.browser_fallback_url=)([^;]+)/,(_,key,fallback) => {
      const web = decodeURIComponent(fallback).replace(/([?&]text=)[^&#]+/,(_,parameter) => parameter+encodeURIComponent(decorated));
      return key+encodeURIComponent(web);
    });
  }
  window.__DEMO_OPEN_WHATSAPP = async url => {
    let target = url;
    try { target = await decorate(url); } catch (_) { /* Keep the validated booking available. */ }
    window.location.href = target;
  };
})();
