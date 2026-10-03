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

document.querySelectorAll('.page-head,.club-banner,.allergen-banner').forEach(function(section){if(section.querySelector(':scope > .nautical-head-spacer'))return;const spacer=document.createElement('div');spacer.className='nautical-head-spacer';spacer.setAttribute('aria-hidden','true');spacer.style.height='1.8em';spacer.style.pointerEvents='none';section.appendChild(spacer);});
