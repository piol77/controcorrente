(function(){
  function dishLabel(dish){
    return (dish.querySelector('h3')?.childNodes[0]?.textContent||'').trim();
  }

  function addPhoto(sourcePhoto,dish){
    if(!sourcePhoto||!dish)return;
    dish.querySelector('.language-dish-photo')?.remove();
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

  function syncOfferSection(sourceArticles,targetSection,sharedEntries,language){
    if(!targetSection)return;
    const targetDishes=[...targetSection.querySelectorAll('.language-dish')];
    const chosen=[];

    sourceArticles.forEach(function(article,sourceIndex){
      const sourceName=(article.querySelector('h2,h3')?.textContent||'').trim();
      const shared=sharedEntries.find(function(entry){return entry.name===sourceName;});
      const translatedName=shared?.translations?.[language]?.name;
      let dish=translatedName?targetDishes.find(function(item){return dishLabel(item)===translatedName;}):null;

      if(!dish){
        const sourcePrice=numericPrice(article.querySelector('.dish-price')?.textContent);
        if(sourcePrice!==null){
          dish=targetDishes.find(function(item){return !chosen.includes(item)&&numericPrice(item.querySelector('.language-price')?.textContent)===sourcePrice;});
        }
      }
      if(!dish&&targetDishes[sourceIndex]&&!chosen.includes(targetDishes[sourceIndex]))dish=targetDishes[sourceIndex];
      if(!dish)return;

      addPhoto(article.querySelector('.dish-photo'),dish);
      chosen.push(dish);
    });

    /* Keep the translated daily offer aligned with the actual Italian offer. */
    targetDishes.forEach(function(dish){if(!chosen.includes(dish))dish.remove();});
    let cursor=targetSection.querySelector('h2');
    chosen.forEach(function(dish){cursor.insertAdjacentElement('afterend',dish);cursor=dish;});
  }

  function syncTranslationPhotos(){
    const root=document.querySelector('[data-menu-language]');
    if(!root)return;
    const language=root.dataset.menuLanguage;

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
      const sourceDaily=[...offerSource.querySelectorAll('.daily-menu:not(.daily-fixed-menu) .daily-dish')];
      const sourceFixed=[...offerSource.querySelectorAll('.daily-fixed-menu .daily-dish')];
      const offers=(typeof SHARED_OFFERS!=='undefined')?SHARED_OFFERS:[];
      const fixed=(typeof SHARED_FIXED!=='undefined')?SHARED_FIXED.dishes:[];

      syncOfferSection(sourceDaily,dailySections[0],offers,language);
      syncOfferSection(sourceFixed,dailySections[1],fixed,language);
    }).catch(function(){/* Translations stay usable even if a source page cannot be loaded. */});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncTranslationPhotos);
  else syncTranslationPhotos();
})();
