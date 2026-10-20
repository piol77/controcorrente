const navToggle=document.querySelector('.nav-toggle');

navToggle?.addEventListener('click',function(event){
  const foreignMenu=document.querySelector('[data-foreign-menu-language]');
  if(foreignMenu){
    event.preventDefault();
    window.location.href='index.html?menu=1';
    return;
  }

  const open=this.getAttribute('aria-expanded')!=='true';
  this.setAttribute('aria-expanded',String(open));
  document.querySelector('#site-nav')?.classList.toggle('open',open);
});

if(new URLSearchParams(window.location.search).get('menu')==='1'){
  const siteNav=document.querySelector('#site-nav');
  if(navToggle&&siteNav){
    navToggle.setAttribute('aria-expanded','true');
    siteNav.classList.add('open');
  }
  try{
    const cleanUrl=new URL(window.location.href);
    cleanUrl.searchParams.delete('menu');
    window.history.replaceState(null,'',cleanUrl.pathname+cleanUrl.search+cleanUrl.hash);
  }catch(_error){}
}


// Etichette pubbliche: solo navigazione e intestazioni, nessuna regola d'ordine.
document.querySelectorAll('nav#site-nav a[href="pranzo.html"]').forEach(function(a){
  a.textContent='Offerta per pranzo';
});
document.querySelectorAll('nav#site-nav a[href="cena.html"]').forEach(function(a){
  a.textContent='Offerta per cena';
});
if(/\/(?:pranzo|cena|antipasti|primi|secondi)\.html$/.test(window.location.pathname)){
  document.querySelectorAll('.page-head h1').forEach(function(h){
    if(h.textContent.trim()==='Menù pranzo') h.textContent='Offerta per pranzo';
    if(h.textContent.trim()==='Menù cena') h.textContent='Offerta per cena';
  });
}
// Data puramente informativa per cena/offerta del giorno: non usata dalla prenotazione.
(function(){
  const labels=document.querySelectorAll('time[data-display-date]');
  if(!labels.length) return;
  const formatter=new Intl.DateTimeFormat('it-IT',{
    timeZone:'Europe/Rome',weekday:'long',day:'numeric',month:'long',year:'numeric'
  });
  function refreshDisplayDate(){
    const now=new Date();
    const day=formatter.format(now);
    labels.forEach(function(el){el.textContent='Oggi: '+day;});
  }
  refreshDisplayDate();
  window.setInterval(refreshDisplayDate,60000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshDisplayDate();});
})();

document.querySelectorAll('.page-head,.club-banner,.allergen-banner').forEach(function(section){if(section.querySelector(':scope > .nautical-head-spacer'))return;const spacer=document.createElement('div');spacer.className='nautical-head-spacer';spacer.setAttribute('aria-hidden','true');spacer.style.height='1.8em';spacer.style.pointerEvents='none';section.appendChild(spacer);});
