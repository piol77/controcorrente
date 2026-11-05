(() => {
  'use strict';
  const BASE = 'https://lgjijnhhnjioiyvfmkvy.supabase.co';
  const KEY = 'sb_publishable_aibVnScYEW5GrPWfu5M4Ag_ieHHGgKv';
  const API = BASE + '/functions/v1/radio-premi';
  const authBase = BASE + '/auth/v1/';
  const login = document.querySelector('[data-premi-login]');
  const manager = document.querySelector('[data-premi-manager]');
  const message = document.querySelector('[data-premi-message]');
  const rows = document.querySelector('[data-premi-admin-rows]');
  const status = document.querySelector('[data-premi-admin-active]');
  const tokenKey = 'cc-radio-premi-admin-session-v1';
  let accessToken = sessionStorage.getItem(tokenKey) || '';
  const actionForm = document.querySelector('[data-premi-actions]');
  const actionSelect = document.querySelector('[data-premi-operation]');
  const actionHelp = document.querySelector('[data-premi-action-help]');
  const actionFields = ['code','amount'];
  const requiredFields = {
    confirm:['code'],
    use:['code','amount'],
    release:['code'],
    free_hold:['code'],
    activate:[],
    deactivate:[]
  };
  const actionDescriptions = {
    confirm:'Inserisci il codice numerico di 5 cifre presente nelle note WhatsApp. Blocca la riserva oltre le 24 ore.',
    use:'Inserisci il codice numerico e il totale effettivo della cena (almeno 50 € prima dello sconto).',
    release:'Annullamento definitivo di un codice: non sarà mai più utilizzabile.',
    free_hold:'Libera una prenotazione PROVVISORIA non seguita dal WhatsApp. Il codice torna disponibile.',
    activate:'Attiva i nuovi codici giornalieri. Non servono altri dati: confermerai prima di procedere.',
    deactivate:'Ferma gli annunci radio SOLO per oggi. Domani il nuovo codice ripartirà automaticamente. Le prenotazioni già accettate restano valide.'
  };
  const stateLabels = {
    available:'DISPONIBILE', held:'RISERVATO (24 ore)',
    confirmed:'PRENOTAZIONE CONFERMATA', used:'GIÀ UTILIZZATO',
    expired:'SCADUTO', void:'ANNULLATO DEFINITIVAMENTE'
  };
  function updateActionForm() {
    const operation=actionSelect.value;
    const required=requiredFields[operation] || [];
    for (const name of actionFields) {
      const wrapper=actionForm.querySelector('[data-premi-field="'+name+'"]');
      if (!wrapper) continue;
      wrapper.hidden=!required.includes(name);
      const input=wrapper.querySelector('input');
      if (input) input.required=required.includes(name);
    }
    actionHelp.textContent=actionDescriptions[operation]
      || 'Scegli un’operazione: compariranno soltanto i campi necessari.';
  }
  actionSelect.addEventListener('change',updateActionForm);
  updateActionForm();

  const display = (s) => message.textContent = s;
  const formatDate = (iso) => {
    if (!iso) return '—';
    const date = new Date(iso);
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat('it-IT', {
          dateStyle:'short',timeStyle:'short',timeZone:'Europe/Rome'
        }).format(date) : '—';
  };
  async function authRequest(path,payload) {
    const r=await fetch(authBase+path,{
      method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.msg||data.error_description||data.message||'Autenticazione non riuscita');
    return data;
  }
  async function request(operation, fields={}) {
    const r=await fetch(API,{
      method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},
      body:JSON.stringify({action:'admin',operation,...fields})
    });
    const data=await r.json().catch(()=>null);
    if(!r.ok || !data?.ok)throw new Error(data?.reason==='not_authorized'
      ? 'Account non autorizzato per Controcorrente.'
      : data?.reason==='login_required' ? 'Sessione scaduta: accedi nuovamente.'
      : data?.reason||'Operazione non riuscita');
    return data;
  }
  async function refresh() {
    if(!accessToken){login.hidden=false;manager.hidden=true;return;}
    try {
      const data=await request('list');
      login.hidden=true;manager.hidden=false;
      status.textContent=!data.active?'PROMOZIONE DISATTIVATA'
        :data.paused_today?'ANNUNCI RADIO SOSPESI FINO A DOMANI'
        :'PROMOZIONE ATTIVA · ANNUNCI ABILITATI';
      rows.replaceChildren();
      if(!data.records.length) {
        const tr=document.createElement('tr'),td=document.createElement('td');
        td.colSpan=6;td.textContent='Nessun codice ancora emesso.';
        tr.append(td);rows.append(tr);
      }
      data.records.forEach(rec=>{
        const tr=document.createElement('tr');
        const fields=[
          rec.code,
          formatDate(rec.issued_at),
          rec.dinner_day ? rec.dinner_day+(rec.dinner_time?' '+rec.dinner_time.slice(0,5):''):'—',
          (rec.is_test ? 'SOLO PROVA · ' : '') + (stateLabels[rec.state] || rec.state),
          rec.paid_subtotal===null?'—':rec.paid_subtotal+' €'
        ];
        fields.forEach(field=>{
          const td=document.createElement('td');
          td.textContent=String(field);
          tr.append(td);
        });
        const actionsCell=document.createElement('td');
        const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome'}).format(new Date());
        const confirmedToday = rec.state==='confirmed' && rec.issue_day===today && rec.hold_ref;
        if((rec.state==='held' || confirmedToday) && !rec.is_test && Date.parse(rec.expires_at)>Date.now()){
          const free=document.createElement('button');
          free.type='button';free.className='rp-row-btn';
          free.textContent='Libera riserva';
          free.title='Rendi di nuovo disponibile il codice prima che lo sconto sia utilizzato';
          free.addEventListener('click',async()=>{
            if(!window.confirm((confirmedToday ? 'La prenotazione era confermata. Liberare il codice se lo sconto non è stato utilizzato? ' : 'Liberare la riserva provvisoria? ')+rec.code))return;
            free.disabled=true;
            try{
              await request('free_hold',{code:rec.code,ref:rec.hold_ref});
              await refresh();
              display('Riserva liberata: il codice '+rec.code+' è di nuovo disponibile per gli slot radio di oggi.');
            }catch(e){
              free.disabled=false;
              display('Impossibile liberare: '+(e instanceof Error?e.message:'errore'));
            }
          });
          actionsCell.append(free);
          actionsCell.append(document.createTextNode(' '));
        }
        if (['available','held','confirmed'].includes(rec.state)) {
          const cancelButton=document.createElement('button');
          cancelButton.type='button';
          cancelButton.className='rp-row-btn';
          cancelButton.textContent='Annulla';
          cancelButton.title='Invalida definitivamente il codice '+rec.code;
          cancelButton.addEventListener('click',async()=>{
            if(!window.confirm('Annullare DEFINITIVAMENTE il codice '+rec.code+'? Non sarà più utilizzabile.'))return;
            cancelButton.disabled=true;
            try{
              await request('release',{code:rec.code});
              await refresh();
              display('Codice '+rec.code+' ANNULLATO definitivamente. Non è più disponibile.');
            }catch(e){
              cancelButton.disabled=false;
              display('Annullamento non riuscito: '+(e instanceof Error?e.message:'errore imprevisto'));
            }
          });
          actionsCell.append(cancelButton);
        }else{
          actionsCell.textContent='—';
        }
        tr.append(actionsCell);
        rows.append(tr);
      });
      display('Registro aggiornato. Gli orari sono quelli di Torino.');
    } catch(e) {
      login.hidden=false;manager.hidden=true;
      display('Accesso: '+(e instanceof Error?e.message:'non disponibile'));
      if(/sessione|login_required|JWT/i.test(String(e))) {
        accessToken='';sessionStorage.removeItem(tokenKey);
      }
    }
  }
  document.querySelector('[data-premi-signin]').addEventListener('submit',async e=>{
    e.preventDefault();
    // Conserva il riferimento prima dell'await: dopo la callback
    // event.currentTarget torna null, anche se il login è riuscito.
    const formElement = e.currentTarget;
    const form=new FormData(formElement);
    try{
      const data=await authRequest('token?grant_type=password',{
        email:String(form.get('email')),password:String(form.get('password'))
      });
      if(!data.access_token)throw new Error('Nessuna sessione ricevuta');
      accessToken=data.access_token;sessionStorage.setItem(tokenKey,accessToken);
      formElement.reset(); await refresh();
    }catch(err){display(err instanceof Error?err.message:'Accesso fallito');}
  });
  document.querySelector('[data-premi-logout]').addEventListener('click',()=>{
    accessToken='';sessionStorage.removeItem(tokenKey);refresh();
  });
  document.querySelector('[data-premi-refresh]').addEventListener('click',refresh);
  actionForm.addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(actionForm);
    const operation=String(fd.get('operation')||'');
    if(!Object.prototype.hasOwnProperty.call(requiredFields,operation)){
      display('Seleziona un’operazione.');return;
    }
    const code=String(fd.get('code')||'').trim().toUpperCase();
    const amountRaw=String(fd.get('amount')||'').trim().replace(',','.');
    const amount=amountRaw?Number(amountRaw):null;
    const required=requiredFields[operation];
    if(required.includes('code')&&!/^[0-9]{5}$/.test(code)){
      display('Inserisci un codice numerico valido di cinque cifre.');return;
    }
    if(required.includes('amount')&&(!Number.isFinite(amount)||amount<50)){
      display('Il conto prima dello sconto deve essere di almeno 50 €.');return;
    }
    const confirmations={
      activate:'Attivare la promozione Radio Premi? I codici validi potranno essere riscattati.',
      deactivate:'Sospendere gli ANNUNCI RADIO solo per oggi? Domani riprendono con un nuovo codice. Le prenotazioni già riservate restano valide.',
      use:'Segnare questo codice come GIÀ UTILIZZATO? Confermi che il conto finale è di almeno 50 €?',
      release:'Annullare DEFINITIVAMENTE il codice '+code+'? Non potrà più essere utilizzato.',
      free_hold:'Il cliente NON ha inviato la prenotazione su WhatsApp? Liberare la riserva temporanea '+code+'?'
    };
    if(confirmations[operation]&&!window.confirm(confirmations[operation]))return;
    const submitButton=actionForm.querySelector('button[type="submit"]');
    if(submitButton)submitButton.disabled=true;
    try{
      await request(operation,{
        code:required.includes('code')?code:null,
        ref:null,
        amount:required.includes('amount')?amount:null
      });
      await refresh();
      const done={
        activate:'Promozione ATTIVATA.',
        deactivate:'Annunci radio SOSPESI FINO A DOMANI.',
        free_hold:'Codice '+code+' LIBERATO, nuovamente disponibile.',
        confirm:'Prenotazione con codice '+code+' CONFERMATA.',
        use:'Codice '+code+' segnato GIÀ UTILIZZATO.',
        release:'Codice '+code+' ANNULLATO definitivamente. Non è più disponibile.'
      };
      display(done[operation]||'Operazione completata.');
    }catch(err){
      display('Operazione NON eseguita: '+(err instanceof Error?err.message:'errore imprevisto'));
    }finally{
      if(submitButton)submitButton.disabled=false;
    }
  });
  refresh();
})();
