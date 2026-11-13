(() => {
  const api=window.CCAvvento;
  const calendar=document.getElementById('avvento-days');
  const status=document.getElementById('avvento-status');
  const verify=document.getElementById('avvento-verify');
  const verifyBox=document.getElementById('avvento-whatsapp');
  const show=document.getElementById('avvento-prizes');
  const dialog=document.getElementById('avvento-prize');
  const copy=dialog.querySelector('button[data-copy]');
  const date=new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Rome'});
  const deadline=new Intl.DateTimeFormat('it-IT',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Rome'});
  let state={};
  let records=[];
  let challenge=api.token();
  let awaiting=false;
  let jollyBusy=false;
  let jollyTimer;
  const jokes=[
    'Il cameriere filosofo dice: «Il dubbio passa. Il dolce, se arriva, resta poco.»',
    'La cuoca dice: «Due caffè. Uno per svegliarti, l’altro per ricordarti il primo.»',
    'Il cameriere filosofo dice: «Sul senso della vita ci ragiono. Sul calice, meno.»',
    'La cuoca dice: «Tre euro in meno. Le porzioni restano quelle.»',
    'Il cameriere filosofo dice: «Ho fatto i conti. Per una volta conviene a qualcuno.»',
    'La cuoca dice: «Cinque euro di sconto. La scarpetta resta a discrezione del cliente.»'
  ];

  function showPrize(row) {
    dialog.querySelector('h2').textContent=api.prizeName(row.prize);
    dialog.querySelector('[data-joke]').textContent=row.prize===0
      ? 'La cuoca dice: «Lo sconto è finto. Il collaudo lo facciamo sul serio.»'
      : jokes[row.prize-1];
    dialog.querySelector('code').textContent=row.code;
    dialog.querySelector('[data-deadline]').textContent='Prenota entro il '+deadline.format(new Date(row.deadline))+
      '. Ultima data utile per la cena: '+date.format(new Date(row.last_dinner+'T12:00:00Z'))+'.';
    const booking=dialog.querySelector('[data-book]');
    booking.hidden=row.state!=='available';
    booking.href='cena.html';
    booking.onclick=()=>{
      try { sessionStorage.setItem('cc-avvento-2026-code',row.code); } catch {}
    };
    copy.onclick=async()=>{
      try { await navigator.clipboard.writeText(row.code); copy.textContent='Codice copiato'; }
      catch { copy.textContent='Seleziona il codice e copialo'; }
    };
    copy.textContent='Copia codice';
    const confetti=dialog.querySelector('.av-confetti');
    confetti.replaceChildren();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for(let i=0;i<18;i++) {
        const spark=document.createElement('i');
        const angle=i*Math.PI*2/18;
        spark.style.setProperty('--x',Math.round(Math.cos(angle)*(75+i%4*12))+'px');
        spark.style.setProperty('--y',Math.round(Math.sin(angle)*(65+i%5*11))+'px');
        spark.style.setProperty('--color',['#ffdc81','#78dbe5','#fa8c88'][i%3]);
        confetti.append(spark);
      }
    }
    dialog.showModal();
  }

  function openDoor(button) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
    button.classList.remove('is-opening');
    void button.offsetWidth;
    button.classList.add('is-opening');
    return new Promise(resolve=>setTimeout(()=>{button.classList.remove('is-opening');resolve();},580));
  }

  async function playJolly(button) {
    if(jollyBusy) return;
    jollyBusy=true;
    button.disabled=true;
    try {
      const [result]=await Promise.all([api.request('jolly'),openDoor(button)]);
      if(!result.ok) {
        status.textContent=api.message(result.reason);
        if(result.reason==='jolly_closed') void refreshStatus();
        return;
      }
      api.jollyToken(result.record.code,result.token);
      showPrize(result.record);
      status.textContent='Codice Jolly emesso. È una prova senza sconto.';
    } finally {jollyBusy=false;button.disabled=false;}
  }

  function draw() {
    calendar.replaceChildren();
    for (let day=1;day<=25;day++) {
      const iso='2026-12-'+String(day).padStart(2,'0');
      const row=records.find(entry=>entry.issue_day===iso);
      const button=document.createElement('button');
      button.type='button';
      button.textContent=String(day);
      button.disabled=!row && !(state.active && state.day===iso);
      button.setAttribute('aria-label',day+' dicembre'+(row?', premio disponibile da consultare':button.disabled?', chiuso':', apri il cassettino'));
      button.classList.toggle('opened',Boolean(row));
      if (row) button.addEventListener('click',async()=>{await openDoor(button);if(!dialog.open)showPrize(row);});
      else button.addEventListener('click',async()=>{await openDoor(button);await start();});
      calendar.append(button);
    }
    if(state.jolly) {
      const button=document.createElement('button');
      button.type='button';
      button.className='av-jolly';
      button.textContent='★ Apri il cassetto Jolly di prova';
      button.addEventListener('click',()=>void playJolly(button));
      calendar.append(button);
    }
  }

  async function start() {
    if (awaiting) { verifyBox.hidden=false; verifyBox.scrollIntoView({block:'nearest'}); return; }
    awaiting=true;
    status.textContent='Apertura del cassettino…';
    const result=await api.request('start');
    if (!result.ok) { awaiting=false; status.textContent=api.message(result.reason); return; }
    challenge=result.token;
    api.token(challenge);
    verifyBox.querySelector('a').href='https://wa.me/393272292006?text='+encodeURIComponent('AVVENTO 2026 '+challenge);
    verifyBox.hidden=false;
    status.textContent='Invia il messaggio WhatsApp per aprire il cassettino.';
    verifyBox.scrollIntoView({block:'nearest'});
  }

  async function refreshPrize(open=false) {
    if (!challenge) return;
    const result=await api.request('mine',{token:challenge});
    if (!result.ok) {
      if (open) status.textContent=result.reason==='awaiting_whatsapp'
        ? 'Verifica in attesa. Invia il messaggio su WhatsApp e riprova qui tra qualche secondo.'
        : api.message(result.reason);
      return;
    }
    records=result.records;
    awaiting=false;
    verifyBox.hidden=true;
    status.textContent=state.active?'Apri il cassettino di oggi.':'Puoi consultare i premi già ottenuti.';
    draw();
    const row=records.find(entry=>entry.issue_day===state.day);
    if (open && row) showPrize(row);
  }
  verify.addEventListener('click',()=>void refreshPrize(true));
  verifyBox.querySelector('[data-restart]').addEventListener('click',()=>{awaiting=false;void start();});
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  show.addEventListener('click',()=>void start());
  draw();
  async function refreshStatus() {
    const result=await api.request('status');
    if (!result.ok) { status.textContent=api.message(result.reason); return; }
    state=result;
    const inSeason=state.day>='2026-12-01' && state.day<='2026-12-25';
    show.hidden=!state.active || !inSeason;
    status.textContent=state.jolly?'':
      : state.day<'2026-12-01'?'I cassettini si aprono dal 1° dicembre.'
      : state.day>'2026-12-25'?'Il calendario si è concluso il 25 dicembre.'
      : state.active?'Apri il cassettino di oggi.':'Il calendario è in pausa. Riprova più tardi.';
    draw();
    void refreshPrize();
    clearTimeout(jollyTimer);
    if(state.jolly) {
      const until=Date.parse('2026-12-01T00:00:00+01:00')-Date.now();
      jollyTimer=setTimeout(()=>void refreshStatus(),Math.max(1000,Math.min(until+300,3600000)));
    }
  }
  void refreshStatus();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshStatus();});
})();
