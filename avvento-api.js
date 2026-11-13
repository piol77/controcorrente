(() => {
  const url = 'https://nchtaewykddmnjolcebs.supabase.co/functions/v1/avvento-2026';
  const prizes = ['Un dolce in omaggio','Due caffè offerti','Un calice di vino in omaggio (solo maggiorenni)',
    '3 € di sconto','5% di sconto, fino a 5 €','5 € di sconto'];
  const messages = {
    jolly_closed:'Il cassetto Jolly è terminato. Dal 1° dicembre si apre il calendario ufficiale.',
    inactive:'La promozione Avvento al momento non è disponibile.',
    rate_limited:'Troppe richieste. Riprova più tardi.',
    not_found:'Codice Avvento non trovato. Usa il collegamento «Prenota» dal calendario dopo la verifica WhatsApp.',
    used:'Il codice Avvento è già stato utilizzato.',
    reserved:'Il codice Avvento è già associato a una richiesta.',
    void:'Il codice Avvento è stato annullato.',
    expired:'Sono trascorse le 24 ore disponibili per inviare la prenotazione.',
    date:'La cena deve essere entro il settimo giorno successivo all’emissione.',
    service:'Il codice non è valido per questa data o fascia di cena.',
    subtotal:'Per usare il premio il conto prima dello sconto deve essere di almeno 50 €.',
    incompatible:'Il premio non è cumulabile con altre promozioni o menù in offerta.',
    booking_unconfirmed:'La richiesta di cena deve risultare confermata e la data ancora valida.',
    review_required:'Prima verifica il premio. Registralo come utilizzato il giorno della cena con il conto finale di almeno 50 €.',
    not_authorized:'Accedi alla console con l’account del titolare.',
    offline:'Il servizio Avvento non è raggiungibile. Riprova tra poco.'
  };
  async function request(action, fields = {}, authorization) {
    const headers = {'Content-Type':'application/json'};
    if (authorization) headers.Authorization = 'Bearer ' + authorization;
    try {
      const response = await fetch(url,{method:'POST',redirect:'error',cache:'no-store',
        signal:AbortSignal.timeout(9000),headers,body:JSON.stringify({action,...fields})});
      return await response.json();
    } catch {
      return {ok:false,reason:'offline'};
    }
  }
  const tokenKey = 'cc-avvento-2026-session';
  function token(value) {
    try {
      if (value) sessionStorage.setItem(tokenKey,value);
      return sessionStorage.getItem(tokenKey)||'';
    } catch { return ''; }
  }
  function jollyToken(code, value) {
    try {
      const key='cc-avvento-2026-jolly:'+code;
      if(value) sessionStorage.setItem(key,value);
      return sessionStorage.getItem(key)||'';
    } catch { return ''; }
  }
  const prizeName=number=>number===0?'Jolly di prova · nessuno sconto':prizes[number-1];
  window.CCAvvento = Object.freeze({request,token,jollyToken,prizes,prizeName,message: reason => messages[reason] || messages.offline});
})();
