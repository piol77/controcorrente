(function(){
  const COPY={
    en:{lunch:'Lunch menu',dinner:'Dinner menu',offer:'Daily offer',lunchOnly:'Valid for lunch only',dinnerOnly:'Valid for dinner only',dailyDishes:'Today’s dishes',fixedMenu:'Complete menu',loading:'Loading menu…',lunchBooking:'Book by 12:00',lunchIncluded:'½ litre of water · coffee · cover charge included',while:'While supplies last',confirm:'Please wait for the restaurant’s confirmation before considering the order valid.',fixedPrice:'per person · drinks not included',note:'Please tell us about any allergies before ordering · * Ingredients frozen at source'},
    zh:{lunch:'午餐菜单',dinner:'晚餐菜单',offer:'今日优惠',lunchOnly:'仅午餐时段有效',dinnerOnly:'仅晚餐时段有效',dailyDishes:'今日菜品',fixedMenu:'晚餐套餐',loading:'正在加载菜单…',lunchBooking:'请于12:00前预订',lunchIncluded:'含半升水 · 咖啡 · 餐位费',while:'售完即止',confirm:'订单需等待餐厅确认后方为有效。',fixedPrice:'每位 · 饮料另计',note:'点餐前请告知过敏情况 · * 原产地冷冻食材'}
  };

  const LUNCH={
  "en": {
    "Orecchiette con broccoli, salsiccia e pecorino": [
      "Orecchiette with broccoli, sausage and pecorino",
      "Orecchiette tossed with broccoli and sausage, finished with pecorino."
    ],
    "Udon con verdure, gamberetti* e pollo": [
      "Udon with vegetables, shrimp* and chicken",
      "Udon noodles with shrimp*, chicken, carrots, courgettes and savoy cabbage."
    ],
    "Calamarata al sugo di orata, leggermente piccante": [
      "Calamarata with a mildly spicy sea bream sauce",
      "Ring-shaped pasta with sea bream sauce and a gentle kick."
    ],
    "Tagliatelle con salmone fresco e porri": [
      "Tagliatelle with fresh salmon and leeks",
      "Tagliatelle tossed with fresh salmon and leeks."
    ],
    "Insalata tiepida di totano gigante, gamberetti* e patate al limone": [
      "Warm salad with giant squid, shrimp* and lemon-dressed potatoes",
      "Giant squid, shrimp* and potatoes, served warm with a lemon dressing."
    ],
    "Straccetti di maiale con verdure in salsa piccante e riso bianco": [
      "Pork strips and vegetables in spicy sauce with white rice",
      "Pork strips and vegetables in a spicy sauce, served with white rice."
    ],
    "Petto di pollo con zucca, gorgonzola e patate": [
      "Chicken breast with pumpkin, Gorgonzola and potatoes",
      "Chicken breast with pumpkin and Gorgonzola, served with potatoes."
    ],
    "Insalata di finocchi, arancia, salmone e avocado con aceto balsamico": [
      "Fennel, orange, salmon and avocado salad with balsamic vinegar",
      "Fennel, orange, salmon and avocado dressed with balsamic vinegar."
    ]
  },
  "zh": {
    "Orecchiette con broccoli, salsiccia e pecorino": [
      "西兰花香肠羊奶酪猫耳面",
      "猫耳面拌西兰花和香肠，撒上羊奶酪。"
    ],
    "Udon con verdure, gamberetti* e pollo": [
      "时蔬虾仁*鸡肉乌冬面",
      "乌冬面搭配虾仁*、鸡肉、胡萝卜、西葫芦和皱叶甘蓝。"
    ],
    "Calamarata al sugo di orata, leggermente piccante": [
      "微辣鲷鱼酱环形意面",
      "环形意面搭配微辣鲷鱼酱。"
    ],
    "Tagliatelle con salmone fresco e porri": [
      "鲜三文鱼韭葱宽面",
      "宽面搭配鲜三文鱼和韭葱。"
    ],
    "Insalata tiepida di totano gigante, gamberetti* e patate al limone": [
      "柠檬大鱿鱼虾仁*土豆温沙拉",
      "大鱿鱼、虾仁*和土豆拌柠檬调味，温热上桌。"
    ],
    "Straccetti di maiale con verdure in salsa piccante e riso bianco": [
      "辣汁蔬菜猪肉条配白米饭",
      "猪肉条和蔬菜裹上辣汁，佐白米饭。"
    ],
    "Petto di pollo con zucca, gorgonzola e patate": [
      "南瓜戈贡佐拉奶酪鸡胸配土豆",
      "鸡胸肉搭配南瓜和戈贡佐拉奶酪，佐土豆。"
    ],
    "Insalata di finocchi, arancia, salmone e avocado con aceto balsamico": [
      "茴香橙子三文鱼牛油果沙拉配意式香醋",
      "茴香、橙子、三文鱼和牛油果拌意式香醋。"
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
    if (doc.querySelector('.daily-fixed-menu')) {
    const fixedHeading=document.createElement('div');fixedHeading.className='course-heading';fixedHeading.innerHTML='<span>02</span><h2>'+c.fixedMenu+'</h2>';target.append(fixedHeading);
    const fixedGrid=grid(target);
    [...doc.querySelectorAll('.daily-fixed-menu .daily-dish')].forEach(function(article){
      const name=sourceName(article);const tr=offerTranslation(name,lang,true);
      fixedGrid.append(cloneCard(article,tr?.[0]||name,tr?.[1]||article.querySelector('.dish-description')?.textContent||''));
    });
    const sourcePrice=doc.querySelector('.daily-fixed-menu .daily-price strong')?.textContent||'25,00 €';
    const bottom=document.createElement('div');bottom.className='fixed-bottom';bottom.innerHTML='<div class="daily-price"><strong>'+sourcePrice+'</strong><span>'+c.fixedPrice+'<br>'+c.while+'</span></div>';target.append(bottom);}
    note(target,c.confirm);
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



