(() => {
  const panel=document.getElementById('avvento-admin');
  if (!panel) return;
  const api=window.CCAvvento;
  const status=panel.querySelector('[role=status]');
  const body=panel.querySelector('tbody');
  const form=panel.querySelector('form');
  const moment=new Intl.DateTimeFormat('it-IT',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Rome'});
  const date=value=>value?.split('-').reverse().join('/')||'—';
  const states={available:'Disponibile',reserved:'Riservato',used:'Utilizzato',void:'Annullato',expired:'Scaduto'};
  const token=()=>sessionStorage.getItem('cc-radio-premi-admin-session-v1')||'';
  const access=document.getElementById('avvento-access');
  const credentials=access?.querySelector('[data-av-login]');
  const authStatus=access?.querySelector('[data-av-auth-status]');
  const privatePanel=access?.querySelector('[data-av-private]');
  const sessionKey='cc-radio-premi-admin-session-v1';

  async function authorize(value) {
    const result=await api.request('list',{},value);
    if (!result.ok) {
      privatePanel.hidden=true;
      credentials.hidden=false;
      authStatus.textContent=api.message(result.reason);
      return false;
    }
    privatePanel.hidden=false;
    credentials.hidden=true;
    authStatus.textContent='Accesso titolare verificato.';
    return true;
  }
  if (access) {
    credentials.querySelector('button').disabled=false;
    access.addEventListener('toggle',()=>{if(access.open && token())void authorize(token());});
    credentials.addEventListener('submit',async event=>{
      event.preventDefault();
      const button=credentials.querySelector('button');
      button.disabled=true;
      try {
        const formData=new FormData(credentials);
        const response=await fetch('https://lgjijnhhnjioiyvfmkvy.supabase.co/auth/v1/token?grant_type=password',{
          method:'POST',headers:{apikey:'sb_publishable_aibVnScYEW5GrPWfu5M4Ag_ieHHGgKv','Content-Type':'application/json'},
          body:JSON.stringify({email:formData.get('email'),password:formData.get('password')})
        });
        const session=await response.json();
        if (!response.ok || !session.access_token) {authStatus.textContent='Accesso non riuscito. Controlla le credenziali.';return;}
        if(await authorize(session.access_token)) {
          sessionStorage.setItem(sessionKey,session.access_token);
          credentials.reset();
          panel.open=true;
          void refresh();
        }
      } catch { authStatus.textContent='Accesso temporaneamente non disponibile.'; }
      finally { button.disabled=false;credentials.elements.password.value=''; }
    });
    access.querySelector('[data-av-logout]').onclick=()=>{
      sessionStorage.removeItem(sessionKey);
      body.replaceChildren();
      panel.open=false;
      privatePanel.hidden=true;
      credentials.hidden=false;
      authStatus.textContent='Sessione chiusa.';
    };
  }

  async function execute(action,fields) {
    if (!token()) { status.textContent='Accedi alla console.'; return null; }
    const response=await api.request(action,fields,token());
    if (!response.ok) { status.textContent=api.message(response.reason); return null; }
    return response;
  }
  const cell=(row,value)=>{const td=row.insertCell();td.textContent=value;return td;};
  function actionButton(container,label,action,code) {
    const button=document.createElement('button');
    button.type='button';
    button.textContent=label;
    button.onclick=async()=>{
      let total;
      if (action==='use') {
        const euros=window.prompt('Conto finale in euro prima del premio. Conferma che non ci siano altre promozioni.');
        if (euros===null) return;
        if (!/^\d+(?:[.,]\d{1,2})?$/.test(euros.trim())) { status.textContent='Inserisci un importo valido.'; return; }
        total=Math.round(Number(euros.replace(',','.'))*100);
      } else if (action==='void' && !window.confirm('Annullare definitivamente il codice '+code+'?')) return;
      button.disabled=true;
      try {
        if (await execute(action,{code,total})) {
          document.dispatchEvent(new Event('avvento:updated'));
          await refresh();
        }
      }
      finally { button.disabled=false; }
    };
    container.append(button);
  }
  async function refresh() {
    const result=await execute('list');
    if (!result) return;
    const {stats}=result;
    status.textContent=(result.active?'Iniziativa abilitata':'Iniziativa sospesa')+' · '+
      (result.online?'Bot collegato':'In attesa del bot Windows')+' · Emessi '+stats.issued+
      ' · Riservati '+stats.reserved+' · Utilizzati '+stats.used;
    form.elements.active.checked=result.active;
    form.elements.closed.value=result.closed.join(' ');
    [...form.querySelectorAll('[name=weight]')].forEach((input,i)=>{input.value=result.weights[i];});
    body.replaceChildren();
    if (!result.records.length) {cell(body.insertRow(),'Nessun codice emesso.').colSpan=8;return;}
    for (const record of result.records) {
      const row=body.insertRow();
      cell(row,record.code);
      cell(row,api.prizeName?.(record.prize)??(record.prize===0?'Jolly di prova · nessuno sconto':api.prizes[record.prize-1]));
      cell(row,moment.format(new Date(record.issued)));
      cell(row,moment.format(new Date(record.deadline)));
      cell(row,date(record.last_dinner));
      cell(row,states[record.state]+(record.reviewed&&record.state==='reserved'?' · verificato':''));
      cell(row,record.booking?(record.booking+' · '+date(record.dinner)+' '+record.dinner_time.slice(0,5)):'—');
      const actions=cell(row,'');
      if (record.state==='reserved'&&record.confirmed) {
        actionButton(actions,record.reviewed?'Segna utilizzato':'Verifica premio',record.reviewed?'use':'confirm',record.code);
      }
      if (['available','reserved'].includes(record.state)) actionButton(actions,'Annulla','void',record.code);
    }
  }
  panel.addEventListener('toggle',()=>{if(panel.open) void refresh();else body.replaceChildren();});
  panel.querySelector('[data-refresh]').onclick=()=>void refresh();
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const weights=[...form.querySelectorAll('[name=weight]')].map(input=>input.valueAsNumber);
    const closed=form.elements.closed.value.trim().split(/[\s,]+/).filter(Boolean);
    if (closed.some(day=>!/^20\d{2}-\d{2}-\d{2}$/.test(day))) { status.textContent='Indica le chiusure come AAAA-MM-GG, separate da spazi.';return; }
    if (await execute('settings',{weights,closed,active:form.elements.active.checked})) await refresh();
  });
})();
