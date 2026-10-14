(function(){
  const COPY={
    en:{lunch:'Lunch menu',dinner:'Dinner menu',offer:'Daily offer',lunchOnly:'Valid for lunch only',dinnerOnly:'Valid for dinner only',dailyDishes:'Today’s dishes',fixedMenu:'Complete menu',loading:'Loading menu…',lunchBooking:'Book by 12:00',lunchIncluded:'½ litre of water · coffee · cover charge included',while:'While supplies last',confirm:'Please wait for the restaurant’s confirmation before considering the order valid.',fixedPrice:'per person · drinks not included',note:'Please tell us about any allergies before ordering · * Ingredients frozen at source'},
    zh:{lunch:'午餐菜单',dinner:'晚餐菜单',offer:'今日优惠',lunchOnly:'仅午餐时段有效',dinnerOnly:'仅晚餐时段有效',dailyDishes:'今日菜品',fixedMenu:'晚餐套餐',loading:'正在加载菜单…',lunchBooking:'请于12:00前预订',lunchIncluded:'含半升水 · 咖啡 · 餐位费',while:'售完即止',confirm:'订单需等待餐厅确认后方为有效。',fixedPrice:'每位 · 饮料另计',note:'点餐前请告知过敏情况 · * 原产地冷冻食材'}
  };

  const LUNCH={
  "en": {
    "Riso saltato speziato con pollo, gamberetti* e verdure": [
      "Spiced stir-fried rice with chicken, shrimp* and vegetables",
      "Carrots, zucchini, eggs and peas, with chicken and shrimp*. Please confirm the seasoning allergens with the staff."
    ],
    "Spaghetti con crema di zucca, speck affumicato croccante e mozzarella Santa Lucia": [
      "Spaghetti with pumpkin cream, crispy smoked speck and Santa Lucia mozzarella",
      "Pumpkin cream, crispy smoked speck and Santa Lucia mozzarella."
    ],
    "Tagliatelle al ragù della casa": [
      "Tagliatelle with house ragù",
      "Tagliatelle coated in the house meat ragù. Please confirm the ragù allergens with the staff."
    ],
    "Fusilli con branzino, zucchine e pomodorini": [
      "Fusilli with sea bass, zucchini and cherry tomatoes",
      "Sea bass pieces, zucchini and cherry tomatoes."
    ],
    "Filetti di branzino croccanti su vellutata di zucca, con crumble di amaretto e rosmarino": [
      "Crisp sea bass fillets on pumpkin velouté with amaretto crumble and rosemary",
      "Crisp fillets on pumpkin velouté, with amaretto biscuit crumble and rosemary. Please confirm the amaretto biscuit allergens with the staff."
    ],
    "Branzino alla griglia con patate al forno": [
      "Grilled sea bass with oven-roasted potatoes",
      "Grilled sea bass served with oven-roasted potatoes."
    ],
    "Scaloppine di pollo al limone con insalata tiepida di patate prezzemolate": [
      "Lemon chicken scaloppine with warm parsley potato salad",
      "Chicken scaloppine in lemon sauce, with warm potatoes and parsley."
    ],
    "Parmigiana di melanzane": [
      "Eggplant parmigiana",
      "Oven-baked eggplant parmigiana."
    ]
  },
  "zh": {
    "Riso saltato speziato con pollo, gamberetti* e verdure": [
      "香料鸡肉虾仁*蔬菜炒饭",
      "胡萝卜、西葫芦、鸡蛋和豌豆，搭配鸡肉和虾仁*。 调味料过敏原请向店员确认。"
    ],
    "Spaghetti con crema di zucca, speck affumicato croccante e mozzarella Santa Lucia": [
      "南瓜酱烟熏脆Speck火腿马苏里拉意面",
      "南瓜酱、烟熏脆Speck火腿和Santa Lucia马苏里拉奶酪。"
    ],
    "Tagliatelle al ragù della casa": [
      "本店肉酱宽面",
      "宽面搭配本店特制肉酱。 肉酱过敏原请向店员确认。"
    ],
    "Fusilli con branzino, zucchine e pomodorini": [
      "海鲈鱼西葫芦小番茄螺旋面",
      "海鲈鱼块、西葫芦和小番茄。"
    ],
    "Filetti di branzino croccanti su vellutata di zucca, con crumble di amaretto e rosmarino": [
      "脆皮海鲈鱼柳配南瓜浓汤杏仁饼碎迷迭香",
      "脆皮鱼柳铺于南瓜浓汤上，搭配意式杏仁饼碎和迷迭香。 杏仁饼过敏原请向店员确认。"
    ],
    "Branzino alla griglia con patate al forno": [
      "烤海鲈鱼配烤土豆",
      "烤海鲈鱼，搭配烤土豆。"
    ],
    "Scaloppine di pollo al limone con insalata tiepida di patate prezzemolate": [
      "柠檬鸡肉薄片配欧芹温土豆沙拉",
      "柠檬汁鸡肉薄片，搭配温土豆和欧芹。"
    ],
    "Parmigiana di melanzane": [
      "意式焗茄子",
      "烤箱焗制的意式茄子。"
    ]
  }
};

  function cleanDescription(text){return (text||'').replace(/\s*\([\d, ]+\)\.?\s*$/,'').trim();}
  function sourceName(article){return (article.querySelector('h3,h2')?.textContent||'').trim();}
  function cloneCard(article,title,description){
    const clone=article.cloneNode(true);
    clone.removeAttribute('data-order-section');clone.removeAttribute('data-order-index');
    clone.querySelectorAll('.order-controls,button').forEach(function(el){el.remove();});
    const heading=clone.querySelector('h3,h2');if(heading)heading.textContent=title||sourceName(article);
    const desc=clone.querySelector('.dish-description');if(desc&&description!==undefined)desc.textContent=description;
    const photo=clone.querySelector('.dish-photo');if(photo)photo.alt=title||sourceName(article);
    return clone;
  }
  function heading(section,number,title){
    const h=document.createElement('div');h.className='course-heading';
    const n=document.createElement('span');n.textContent=number;
    const t=document.createElement('h2');t.textContent=title;
    h.append(n,t);section.append(h);
  }
  function grid(section){const g=document.createElement('div');g.className='dish-grid';section.append(g);return g;}
  function note(section,text){const p=document.createElement('p');p.className='business-note';p.textContent=text;section.append(p);}
  function localeDate(time,lang){
    const iso=time?.getAttribute('datetime');if(!iso)return time?.textContent||'';
    const date=new Date(iso+'T12:00:00');
    return new Intl.DateTimeFormat(lang==='zh'?'zh-CN':'en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);
  }
  function dinnerTranslation(sectionKey,sourceTitle,lang){
    if(typeof SHARED_DINNER==='undefined'||typeof CONTROCORRENTE_MENU==='undefined')return null;
    const keys=['antipasti','primi','secondi'];const ci=keys.indexOf(sectionKey);if(ci<0)return null;
    const index=(SHARED_DINNER[sectionKey]||[]).findIndex(function(d){return d.name===sourceTitle;});
    if(index<0)return null;
    const row=CONTROCORRENTE_MENU[lang]?.courses?.[ci]?.dishes?.[index];
    return row?[row[0],cleanDescription(row[1])]:null;
  }
  function offerTranslation(sourceTitle,lang,fixed){
    const list=fixed?(typeof SHARED_FIXED!=='undefined'?SHARED_FIXED.dishes:[]):(typeof SHARED_OFFERS!=='undefined'?SHARED_OFFERS:[]);
    const entry=(list||[]).find(function(d){return d.name===sourceTitle;});
    const tr=entry?.translations?.[lang];return tr?[tr.name,tr.description]:null;
  }
  async function getDoc(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(url);return new DOMParser().parseFromString(await r.text(),'text/html');}

  function renderLunch(doc,target,lang){
    const c=COPY[lang];target.innerHTML='';heading(target,'01',c.lunch);
    const sourceTime=doc.querySelector('.lunch-date time');
    if(sourceTime){const p=document.createElement('p');p.className='foreign-lunch-meta';p.textContent=localeDate(sourceTime,lang)+' · '+c.lunchOnly;target.append(p);}
    const g=grid(target);
    [...doc.querySelectorAll('.lunch-dish')].forEach(function(article){
      const name=sourceName(article);const tr=LUNCH[lang][name];
      g.append(cloneCard(article,tr?.[0]||name,tr?.[1]||article.querySelector('.dish-description')?.textContent||''));
    });
    const inclusion=document.createElement('aside');inclusion.className='lunch-inclusions';
    inclusion.innerHTML='<strong>'+c.lunchBooking+'</strong><span>'+c.lunchIncluded+'</span><small>'+c.while+'</small>';target.append(inclusion);note(target,c.confirm);
  }

  function renderDinner(doc,target,lang){
    const c=COPY[lang];target.innerHTML='';heading(target,'02',c.dinner);
    const meta=document.createElement('p');meta.className='foreign-lunch-meta';meta.textContent=c.dinnerOnly;target.append(meta);
    const labels=lang==='zh'?['前菜','第一道主食','主菜']:['Starters','First courses','Main courses'];
    ['antipasti','primi','secondi'].forEach(function(key,i){
      const sub=document.createElement('div');sub.className='course-heading';const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');const h=document.createElement('h2');h.textContent=labels[i];sub.append(n,h);target.append(sub);
      const g=grid(target);
      [...doc.querySelectorAll('#'+key+' .dish')].forEach(function(article){
        const name=sourceName(article);const tr=dinnerTranslation(key,name,lang);
        g.append(cloneCard(article,tr?.[0]||name,tr?.[1]||article.querySelector('.dish-description')?.textContent||''));
      });
    });
    note(target,c.confirm);
  }

  function renderOffer(doc,target,lang){
    const c=COPY[lang];target.innerHTML='';heading(target,'03',c.offer);
    const dailyHeading=document.createElement('div');dailyHeading.className='course-heading';dailyHeading.innerHTML='<span>01</span><h2>'+c.dailyDishes+'</h2>';target.append(dailyHeading);
    const dailyGrid=grid(target);
    [...doc.querySelectorAll('.daily-menu:not(.daily-fixed-menu) .daily-dish')].forEach(function(article){
      const name=sourceName(article);const tr=offerTranslation(name,lang,false);
      dailyGrid.append(cloneCard(article,tr?.[0]||name,tr?.[1]||article.querySelector('.dish-description')?.textContent||''));
    });
    const fixedHeading=document.createElement('div');fixedHeading.className='course-heading';fixedHeading.innerHTML='<span>02</span><h2>'+c.fixedMenu+'</h2>';target.append(fixedHeading);
    const fixedGrid=grid(target);
    [...doc.querySelectorAll('.daily-fixed-menu .daily-dish')].forEach(function(article){
      const name=sourceName(article);const tr=offerTranslation(name,lang,true);
      fixedGrid.append(cloneCard(article,tr?.[0]||name,tr?.[1]||article.querySelector('.dish-description')?.textContent||''));
    });
    const sourcePrice=doc.querySelector('.daily-fixed-menu .daily-price strong')?.textContent||'25,00 €';
    const bottom=document.createElement('div');bottom.className='fixed-bottom';bottom.innerHTML='<div class="daily-price"><strong>'+sourcePrice+'</strong><span>'+c.fixedPrice+'<br>'+c.while+'</span></div>';target.append(bottom);note(target,c.confirm);
  }

  async function init(){
    const root=document.querySelector('[data-foreign-menu-language]');if(!root)return;
    const lang=root.dataset.foreignMenuLanguage;const c=COPY[lang];
    root.querySelector('[data-nav-lunch]').textContent=c.lunch;root.querySelector('[data-nav-dinner]').textContent=c.dinner;root.querySelector('[data-nav-offer]').textContent=c.offer;
    root.querySelectorAll('.foreign-loading').forEach(function(el){el.textContent=c.loading;});
    try{
      const docs=await Promise.all([getDoc('pranzo.html'),getDoc('cena.html'),getDoc('offerta.html')]);
      renderLunch(docs[0],root.querySelector('#foreign-lunch'),lang);
      renderDinner(docs[1],root.querySelector('#foreign-dinner'),lang);
      renderOffer(docs[2],root.querySelector('#foreign-offer'),lang);
      const bottom=root.querySelector('.foreign-bottom-note');if(bottom)bottom.textContent=c.note;
    }catch(e){root.querySelectorAll('.foreign-loading').forEach(function(el){el.textContent='Menu unavailable';});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


