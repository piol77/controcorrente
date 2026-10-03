(function(){
  function dishLabel(dish){
    return (dish.querySelector('h3')?.childNodes[0]?.textContent||'').trim();
  }

  function addPhoto(sourcePhoto,dish){
    if(!sourcePhoto||!dish||dish.querySelector('.language-dish-photo'))return;
    const photo=document.createElement('img');
    photo.className='language-dish-photo';
    photo.src=sourcePhoto.getAttribute('src');
    photo.alt=dishLabel(dish);
    photo.width=1200;
    photo.height=800;
    photo.loading='lazy';
    dish.prepend(photo);
  }

  function numericPrice(text){
    const match=(text||'').replace(',','.').match(/(\d+(?:\.\d+)?)/);
    return match?Number(match[1]):null;
  }

  function syncByIndex(sourceArticles,targetDishes){
    sourceArticles.forEach(function(article,index){
      addPhoto(article.querySelector('.dish-photo'),targetDishes[index]);
    });
  }

  function syncDailyByPrice(sourceArticles,targetDishes){
    const used=new Set();
    sourceArticles.forEach(function(article,sourceIndex){
      const sourcePrice=numericPrice(article.querySelector('.dish-price')?.textContent);
      let targetIndex=-1;
      if(sourcePrice!==null){
        targetIndex=targetDishes.findIndex(function(dish,index){
          return !used.has(index)&&numericPrice(dish.querySelector('.language-price')?.textContent)===sourcePrice;
        });
      }
      if(targetIndex<0&&!used.has(sourceIndex)&&targetDishes[sourceIndex])targetIndex=sourceIndex;
      if(targetIndex<0)return;
      used.add(targetIndex);
      addPhoto(article.querySelector('.dish-photo'),targetDishes[targetIndex]);
    });
  }

  function syncTranslationPhotos(){
    const root=document.querySelector('[data-menu-language]');
    if(!root)return;

    Promise.all([
      fetch('cena.html',{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('Dinner menu unavailable');return response.text();}),
      fetch('offerta.html',{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('Daily offer unavailable');return response.text();})
    ]).then(function(pages){
      const dinnerSource=new DOMParser().parseFromString(pages[0],'text/html');
      const offerSource=new DOMParser().parseFromString(pages[1],'text/html');

      const translatedCourses=[...root.querySelectorAll('.translated-menu-content > .language-course:not(.language-daily)')];
      ['antipasti','primi','secondi'].forEach(function(sectionId,courseIndex){
        const sourceArticles=[...dinnerSource.querySelectorAll('#'+sectionId+' .dish-photo-card')];
        const targetDishes=translatedCourses[courseIndex]?[...translatedCourses[courseIndex].querySelectorAll('.language-dish')]:[];
        syncByIndex(sourceArticles,targetDishes);
      });

      const dailySections=[...root.querySelectorAll('.translated-menu-content > .language-course.language-daily')];
      const translatedDaily=dailySections[0]?[...dailySections[0].querySelectorAll('.language-dish')]:[];
      const translatedFixed=dailySections[1]?[...dailySections[1].querySelectorAll('.language-dish')]:[];
      const sourceDaily=[...offerSource.querySelectorAll('.daily-menu:not(.daily-fixed-menu) .daily-dish')];
      const sourceFixed=[...offerSource.querySelectorAll('.daily-fixed-menu .daily-dish')];

      syncDailyByPrice(sourceDaily,translatedDaily);
      syncByIndex(sourceFixed,translatedFixed);
    }).catch(function(){/* Translations stay usable even if a source page cannot be loaded. */});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncTranslationPhotos);
  else syncTranslationPhotos();
})();
