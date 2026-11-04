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
      status.textContent=data.active?'PROMOZIONE ATTIVA':'Promozione disattivata';
      rows.replaceChildren();
      if(!data.records.length) {
        const tr=document.createElement('tr'),td=document.createElement('td');
        td.colSpan=8;td.textContent='Nessun codice ancora emesso.';
        tr.append(td);rows.append(tr);
      }
      data.records.forEach(rec=>{
        const tr=document.createElement('tr');
        const fields=[
          rec.code,formatDate(rec.issued_at),formatDate(rec.air_one),
          formatDate(rec.air_two),formatDate(rec.expires_at),
          (rec.is_test ? 'SOLO PROVA · ' : '') + rec.state,(rec.hold_ref||'—'),rec.paid_subtotal===null?'—':rec.paid_subtotal+' €'
        ];
        fields.forEach(field=>{const td=document.createElement('td');td.textContent=String(field);tr.append(td);});
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
    const form=new FormData(e.currentTarget);
    try{
      const data=await authRequest('token?grant_type=password',{
        email:String(form.get('email')),password:String(form.get('password'))
      });
      if(!data.access_token)throw new Error('Nessuna sessione ricevuta');
      accessToken=data.access_token;sessionStorage.setItem(tokenKey,accessToken);
      e.currentTarget.reset(); await refresh();
    }catch(err){display(err instanceof Error?err.message:'Accesso fallito');}
  });
  document.querySelector('[data-premi-signup]').addEventListener('click',async()=>{
    const f=document.querySelector('[data-premi-signin]'),fd=new FormData(f);
    const email=String(fd.get('email')||''),password=String(fd.get('password')||'');
    if(!email||password.length<8){display('Inserisci email e una password di almeno 8 caratteri.');return;}
    try{
      await authRequest('signup',{email,password});
      display('Account richiesto. Conferma l’email ricevuta, poi torna qui e premi Accedi. Se hai già un account, premi soltanto Accedi.');
    }catch(e){display(e instanceof Error?e.message:'Registrazione non riuscita');}
  });
  document.querySelector('[data-premi-logout]').addEventListener('click',()=>{
    accessToken='';sessionStorage.removeItem(tokenKey);refresh();
  });
  document.querySelector('[data-premi-refresh]').addEventListener('click',refresh);
  document.querySelector('[data-premi-actions]').addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const operation=String(fd.get('operation')||'');
    const code=String(fd.get('code')||'').trim().toUpperCase();
    const ref=String(fd.get('reference')||'').trim();
    const amount=fd.get('amount');
    if(!operation)return;
    if(operation==='activate'&&!confirm('Attivare gli sconti Radio Premi automatici?'))return;
    if(operation==='use'&&!confirm('Il conto finale della cena è almeno 50 €? Segnare questo codice utilizzato definitivamente?'))return;
    if(operation==='release'&&!confirm('ANNULLARE PER SEMPRE questo codice? Non sarà più assegnabile ad altri clienti.'))return;
    try{
      await request(operation,{code:code||null,ref:ref||null,
        amount:amount?Number(amount):null});
      await refresh();
      display('Operazione eseguita: '+operation+'.');
    }catch(err){display(err instanceof Error?err.message:'Errore');}
  });
  refresh();
})();
