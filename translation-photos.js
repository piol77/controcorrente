(function(){
  function syncDinnerPhotos(){
    const root=document.querySelector('[data-menu-language]');
    if(!root)return;
    fetch('cena.html',{cache:'no-store'})
      .then(function(response){if(!response.ok)throw new Error('Dinner menu unavailable');return response.text();})
      .then(function(html){
        const source=new DOMParser().parseFromString(html,'text/html');
        const translatedCourses=[...root.querySelectorAll('.translated-menu-content > .language-course:not(.language-daily)')];
        ['antipasti','primi','secondi'].forEach(function(sectionId,courseIndex){
          const photos=[...source.querySelectorAll('#'+sectionId+' .dish-photo-card .dish-photo')];
          const dishes=translatedCourses[courseIndex]?[...translatedCourses[courseIndex].querySelectorAll('.language-dish')]:[];
          photos.forEach(function(sourcePhoto,dishIndex){
            const dish=dishes[dishIndex];
            if(!dish||dish.querySelector('.language-dish-photo'))return;
            const photo=document.createElement('img');
            photo.className='language-dish-photo';
            photo.src=sourcePhoto.getAttribute('src');
            photo.alt=(dish.querySelector('h3')?.childNodes[0]?.textContent||'').trim();
            photo.width=1200;
            photo.height=800;
            photo.loading='lazy';
            dish.prepend(photo);
          });
        });
      })
      .catch(function(){/* Translation remains fully usable if the photo sync is unavailable. */});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncDinnerPhotos);
  else syncDinnerPhotos();
})();
