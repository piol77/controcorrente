from pathlib import Path
from lxml import html, etree
import json, re, html as H, base64, mimetypes, shutil, hashlib
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT=Path(__file__).parent.parent
SRC=ROOT/'tools'/'baseline'
OUT=ROOT
e=lambda x:H.escape(str(x),quote=True)
def parse(file): return html.fromstring((SRC/file).read_text())
def inner(node): return (node.text or '')+''.join(etree.tostring(c,encoding='unicode',method='html') for c in node)
def money(v): return f'{v:.2f}'.replace('.',',')+' €'
def icon(name,cls=''):return f'<img class="icon {cls}" src="icons/{name}.svg" alt="" aria-hidden="true">'
def frozen(text):
    return re.sub(r'\b(gamberetti|gamberoni|gamberone|scampi|patatine fritte)\*?',r'\1*',text,flags=re.I)

# This schema is the only content source for the three Italian menu surfaces.
# Allergen references come from the actual menu/known recipes, never generic internet recipes.
data={'lunchUpdatedAt':'2026-10-02','lunchDateLabel':'Venerdì 2 ottobre 2026','dinner':{},'lunch':[],'offers':[],'fixed':{},'drinks':[],'wines':[]}
catalog=json.loads('[]')
import subprocess
js=(SRC/'preordine.js').read_text()
literal=js[js.index('const catalog = ')+16:js.index('\n  const euro')].rstrip(' ;\n')
res=subprocess.check_output(['node','-e','console.log(JSON.stringify('+literal+'))'],text=True)
cat=json.loads(res)
descs={
'antipasti':[
('Pane tostato, salmone affumicato, formaggio spalmabile, rucola e capperi.',[1,4,7],'Fish'),
('Gamberetti* e delicata salsa rosa, su un letto di fresca insalata.',[2,3,10],'Shrimp'),
('Champignon dorati e croccanti, serviti con spicchi di limone.',[1,3],'Leaf')],
'primi':[
('Cozze, vongole, gamberetti* e gamberone*, con un leggero pomodoro.',[1,2,14],'Shell'),
('Verdure di stagione, zafferano e guanciale croccante.',[1,7,9],'Wheat'),
('Risotto cremoso alla barbabietola, gorgonzola e noci.',[7,8,9],'CookingPot'),
('Crema di zucchine, avocado, gamberetti* e una nota fresca di limone. Poco pomodoro.',[1,2,7],'Shrimp')],
'secondi':[
('Alici, calamari e gamberetti* in una frittura leggera e croccante.',[1,2,4,14],'Fish'),
('Filetti avvolti nel bacon, con fichi e patate al forno.',[7],'Beef'),
('Branzino alla griglia, limone e prezzemolo, con verza viola cruda.',[4],'Fish'),
('Salmone alla griglia, arancia e pepe rosa, con finocchi crudi e aceto balsamico.',[4],'Fish')]}
for section,rows in cat.items():
    data['dinner'][section]=[{'name':r[0],'price':r[1],'description':d[0],'allergens':d[1],'icon':d[2]} for r,d in zip(rows,descs[section])]
ldesc=[
'Salsiccia e zafferano, legati da un tocco di panna.',
'La dolcezza della zucca incontra il carattere del gorgonzola.',
'Gamberetti*, granella di pistacchio e un tocco di panna.',
'Melanzane e branzino, con una nota profumata di basilico.',
'Orata alla griglia, accompagnata da patate al forno.',
'Trancio di salmone alla griglia, con patate al forno.',
'Arancia, finocchi e avocado, con bocconcini di salmone fresco.',
'Cipolle di Tropea in agrodolce e insalata tiepida di patate prezzemolate.',
'Pollo, pancetta e scaglie di Grana.']
for i,n in enumerate(parse('pranzo.html').cssselect('.lunch-dish')):
    data['lunch'].append({'name':n.cssselect('h3')[0].text_content(),'price':float(n.cssselect('strong')[0].text_content().split()[0].replace(',','.')),'description':ldesc[i],'allergens':[int(v) for v in re.findall(r'\d+', ''.join(x.text_content() for x in n.cssselect('.lunch-allergens')))],'icon':['Wheat','CookingPot','Shrimp','Fish','Fish','Fish','Salad','Beef','Salad'][i]})
offer=parse('offerta.html')
for i,n in enumerate(offer.cssselect('.daily-menu:not(.daily-fixed-menu) .daily-dish')):
    data['offers'].append({'name':n.cssselect('h2')[0].text_content(),'price':10,'description':['Carne cruda, limone e scaglie di Grana.','Tentacoli e gamberetti*, con morbide patate.','Riso saltato, pollo e gamberetti*, con verdure e spezie.'][i],'allergens':[int(x.text) for x in n.cssselect('.allergen-item > span:last-child')],'icon':['Beef','Shell','CookingPot'][i],'course':n.cssselect('.daily-course')[0].text_content()})
data['fixed']={'price':25,'dishes':[]}
for i,n in enumerate(offer.cssselect('.daily-fixed-menu .daily-dish')):
    data['fixed']['dishes'].append({'name':n.cssselect('h2')[0].text_content(),'description':['Pane tostato e pomodoro fresco.','Cozze, vongole, gamberetti* e scampi*.','Alici, calamari e gamberetti* in una frittura croccante.'][i],'allergens':[int(x.text) for x in n.cssselect('.allergen-item > span:last-child')],'icon':['Wheat','Shell','Fish'][i],'course':n.cssselect('.daily-course')[0].text_content()})
data['drinks']=[
{'name':'Acqua','description':'1 litro','price':2,'icon':'GlassWater'},
{'name':'Bibite in lattina','description':'Coca-Cola, Fanta, Sprite · 33 cl','price':3,'icon':'GlassWater'},
{'name':'Birra Moretti / Peroni','description':'66 cl','price':4,'icon':'Beer'},
{'name':'Ceres','description':'33 cl','price':4,'icon':'Beer'},
{'name':'Amari','description':'San Simone, Capo, Unicum, limoncello, mirto','price':4,'icon':'Wine'}]
data['wines']=[
{'name':'Generoso','designation':'Irpinia Aglianico DOC','description':'Aglianico delle colline argillose del Monte Marano. Rosso rubino, fruttato e floreale, per carni rosse e arrosti.','price':20,'icon':'Wine'},
{'name':'Nonna Seppa','designation':'Campi Taurasini DOC','description':'Dedicato a Giuseppe “Nonna Seppa”. Aglianico intenso e strutturato, per primi importanti e carni alla griglia.','price':25,'icon':'Wine'},
{'name':'Pentamerone','designation':'Taurasi DOCG','description':'Aglianico in purezza da vigne storiche. Elegante, con frutti di bosco e spezie, per carni rosse, selvaggina e formaggi stagionati.','price':30,'icon':'Wine'},
{'name':'Emmente','designation':'Irpinia Rosato DOC · Biologico','description':'Rosato da Aglianico, fresco e minerale, con note di frutti rossi. Per pesce, antipasti e piatti leggeri.','price':20,'icon':'Wine'},
{'name':'Seicentododici','designation':'Irpinia Coda di Volpe DOC · Biologico','description':'Coda di Volpe vinificata in acciaio. Fresco e aromatico, con fiori bianchi e agrumi, per antipasti di mare, crudi e pesce.','price':20,'icon':'Wine'}]
datafile=OUT/'menu-data.json'
if datafile.exists():data=json.loads(datafile.read_text())
else:datafile.write_text(json.dumps(data,ensure_ascii=False,indent=2))

# Date changes only when lunch content is actually updated, not on visits or restyling.
statefile=OUT/'menu-build-state.json'
digest=hashlib.sha256(json.dumps(data['lunch'],sort_keys=True,ensure_ascii=False).encode()).hexdigest()
previous=json.loads(statefile.read_text()) if statefile.exists() else {}
if previous.get('lunchDigest') and previous['lunchDigest']!=digest:
    now=datetime.now(ZoneInfo('Europe/Rome'))
    days=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']
    months=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']
    data['lunchUpdatedAt']=now.date().isoformat()
    data['lunchDateLabel']=f'{days[now.weekday()]} {now.day} {months[now.month-1]} {now.year}'
    datafile.write_text(json.dumps(data,ensure_ascii=False,indent=2))
statefile.write_text(json.dumps({'lunchDigest':digest},indent=2))

links=[('index.html','Novità'),('il-locale.html','Il Locale'),('pranzo.html','Menù pranzo'),('cena.html','Menù cena'),('offerta.html','Offerta del giorno'),('bibite-vini.html','Bibite & vini'),('club.html','Club'),('allergeni.html','Allergeni'),('contatti.html','Contatti')]
def nav(current):
    return '<header class="top"><div class="brand-row"><a class="logo" href="index.html">'+icon('Anchor')+'<span>Controcorrente<small>RISTORANTE · TORINO</small></span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">'+icon('Menu')+'<span>Menù</span></button></div><nav id="site-nav">'+''.join(f'<a href="{p}"'+(' aria-current="page"' if current==p else '')+f'>{t}</a>' for p,t in links)+'<span class="languages"><a href="english.html" lang="en">EN</a><a href="cinese.html" lang="zh">中文</a></span></nav></header>'
foot='<footer>'+icon('Waves')+'<p class="footer-name">Controcorrente</p><p>Via San Paolo 16, Torino · <a href="tel:+393272292006">327 229 2006</a></p><p>Comunicare eventuali allergie prima di ordinare.<br>* Ingredienti congelati all’origine.</p></footer>'
def head(title,label='',date=''):
    return '<div class="page-head"><p class="eyebrow">'+icon('Waves')+' CONTROCORRENTE · CUCINA DI MARE</p><h1>'+title+'</h1>'+('<p class="service-label">'+label+'</p>' if label else '')+(f'<p class="lunch-date"><time datetime="{data["lunchUpdatedAt"]}">{e(data["lunchDateLabel"])}</time></p>' if date else '')+'</div>'
note='<p class="menu-note">Comunicare eventuali allergie · * Ingredienti congelati all’origine.<br><a href="allergeni.html">Consulta la tabella allergeni</a></p>'
allergen_symbols=json.loads((ROOT/'allergen-symbols.json').read_text())
def allergen(a):
    return '<p class="allergen-refs" aria-label="Riferimenti allergeni">'+''.join(f'<span class="allergen-badge" title="{e(allergen_symbols[str(v)]["name"])}" aria-label="{v:02} · {e(allergen_symbols[str(v)]["name"])}"><span class="allergen-pictogram">'+icon(allergen_symbols[str(v)]['icon'])+f'</span><span class="allergen-number">{v:02}</span></span>' for v in a)+'</p>' if a else ''
def dish(d,cls='dish',section='',i=0,heading='h3',price=True):
    if 'photo' in d:
        cls+=' wine-card'
        mark=f'<img class="wine-photo" src="{e(d["photo"])}" alt="Bottiglia di {e(d["name"])} · Cantine Delite" width="800" height="800" loading="lazy">'
    else:mark=icon(d['icon'],'dish-mark')
    source=f'<a class="wine-source" href="{e(d["sourceUrl"])}" target="_blank" rel="noopener">Cantine Delite · Scheda del vino</a>' if 'sourceUrl' in d else ''
    return f'<article class="{cls}"'+(f' data-order-section="{section}" data-order-index="{i}"' if section else '')+'>'+mark+f'<div class="dish-copy"><{heading}>{e(frozen(d["name"]))}</{heading}>'+('<p class="wine-designation">'+e(d['designation'])+'</p>' if 'designation' in d else '')+'<p class="dish-description">'+e(frozen(d['description']))+'</p>'+allergen(d.get('allergens',[]))+source+'</div>'+('<strong class="dish-price '+('daily-dish-price' if cls=='daily-dish dish' else '')+'">'+money(d['price'])+'</strong>' if price else '')+'</article>'
def doc(title,current,body,scripts='',private=False):
    robots='<meta name="robots" content="noindex,nofollow,noarchive">' if private or current=='club-esempio-brezza27-demo.html' else ''
    footer='<footer>'+icon('Waves')+'<p class="footer-name">Controcorrente</p></footer>' if current=='index.html' else foot
    scripts=re.sub(r'src="([^"?]+\.js)"',r'src="\1?v=20261003-nautica3"',scripts)
    style_version='20261003-pranzo1' if current=='pranzo.html' else '20261003-nautica3'
    return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#081c30">'+robots+'<title>'+title+' | Controcorrente</title><link rel="stylesheet" href="styles.css?v='+style_version+'"><link rel="icon" href="icons/Anchor.svg"></head><body>'+nav(current)+'<main class="shell">'+body+'</main>'+footer+'<script src="ui.js?v=20261003-nautica3"></script><script src="site-session.js?v=20261003-nautica3"></script>'+scripts+'</body></html>'

# New dinner page; old links remain usable and route to the relevant part of it.
body=head('Menù cena','Valido solo per cena')+'<nav class="course-tabs" aria-label="Portate">'+''.join(f'<a href="#{s}">{label}</a>' for s,label in [('antipasti','Antipasti'),('primi','Primi'),('secondi','Secondi')])+'</nav>'
for section,label in [('antipasti','Antipasti'),('primi','Primi'),('secondi','Secondi')]:
    body+=f'<section class="menu-course" id="{section}"><div class="course-heading"><span>0{["antipasti","primi","secondi"].index(section)+1}</span><h2>{label}</h2>'+icon('Anchor')+'</div><div class="dish-grid">'+''.join(dish(d,section=section,i=i) for i,d in enumerate(data['dinner'][section]))+'</div></section>'
body+='<p class="business-note">Coperto cena 1,50 € a persona. Prenotando tavolo e menù entro le 18:00, il coperto è omaggio.<br><strong>Attendere la conferma del Ristorante per considerare valido l’ordine.</strong></p>'+note
(OUT/'cena.html').write_text(doc('Menù cena','cena.html',body,'<script src="preordine.js"></script>'))

body=head('Menù pranzo','Valido solo per pranzo',date=True)+'<section class="lunch-board"><div class="dish-grid">'+''.join(dish(d,'lunch-dish dish') for d in data['lunch'])+'</div></section><aside class="lunch-inclusions" aria-label="Servizi inclusi nel pranzo"><strong>Prenotando entro le 12:00</strong><span>½ litro d’acqua · caffè · coperto inclusi</span><small>Fino a esaurimento</small></aside><p class="business-note"><strong>Attendere la conferma del Ristorante per considerare valido l’ordine.</strong></p>'+note
(OUT/'pranzo.html').write_text(doc('Menù pranzo','pranzo.html',body,'<script src="preordine.js"></script>'))

body=head('Offerta del giorno','Valido solo per cena')+'<section class="daily-menu"><div class="course-heading"><span>01</span><h2>Piatti a 10 €</h2>'+icon('Anchor')+'</div><div class="dish-grid">'+''.join(dish(d,'daily-dish dish',heading='h2') for d in data['offers'])+'</div><p class="business-note">Fino a esaurimento · <strong>Attendere la conferma del Ristorante per considerare valido l’ordine.</strong></p></section>'
body+='<section class="daily-menu daily-fixed-menu"><div class="course-heading"><span>02</span><h2>Menù completo</h2>'+icon('Anchor')+'</div><div class="dish-grid">'+''.join(dish(d,'daily-dish dish',heading='h2',price=False) for d in data['fixed']['dishes'])+'</div><div class="fixed-bottom"><div class="daily-price"><strong>'+money(data['fixed']['price'])+'</strong><span>A persona · Bibite a parte<br>Fino a esaurimento</span></div></div><p class="business-note"><strong>Attendere la conferma del Ristorante per considerare valido l’ordine.</strong></p></section>'+note
(OUT/'offerta.html').write_text(doc('Offerta del giorno','offerta.html',body,'<script src="preordine.js"></script>'))

body=head('Bibite & vini','Valido solo per cena')
for k,label in [('drinks','Bibite'),('wines','La carta dei vini')]:
    body+='<section class="menu-course"><div class="course-heading"><span>'+('01' if k=='drinks' else '02')+'</span><h2>'+label+'</h2>'+icon('Anchor')+'</div><div class="dish-grid">'+''.join(dish(d,'dish beverage') for d in data[k])+'</div></section>'
body+=note
(OUT/'bibite-vini.html').write_text(doc('Bibite & vini','bibite-vini.html',body))

# Preserve all original non-menu content and hooks, with a new shared layout.
for file in ['index.html','club.html','contatti.html','allergeni.html','il-locale.html','ordine.html','english.html','cinese.html']+[p.name for p in SRC.glob('club-membro-*.html')]+['club-esempio-brezza27-demo.html']:
    n=parse(file)
    for st in n.cssselect('[style]'):
        if st.tag!='col' and not st.getparent().get('class','').startswith('club-progress-track'):
            del st.attrib['style']
    for mark in n.cssselect('.orn,.daily-mark,.wave-mark'):mark.text='';mark.append(html.fromstring(icon('Anchor')))
    for card in n.cssselect('.allergen-card'):
        number=int(card.cssselect('.allergen-num')[0].text_content())
        mark=card.cssselect('.allergen-symbol')[0]
        mark.clear();mark.set('class','allergen-symbol');mark.set('aria-hidden','true')
        mark.append(html.fromstring(icon(allergen_symbols[str(number)]['icon'])))
    main=n.cssselect('main')[0]
    body=inner(main)
    scripts=''.join(etree.tostring(x,encoding='unicode',method='html') for x in n.cssselect('body > script') if not x.get('src','').startswith('site-session'))
    scripts=re.sub(r'\?v=[^"\s]+','',scripts)
    title=n.cssselect('title')[0].text_content().split('|')[0].strip()
    if file=='index.html':
        title='Novità'
        body=body.replace('<h2 class="section-title">News</h2>','').replace('<p class="subtitle">Novità, iniziative e informazioni da Controcorrente.</p>','')
        body=body.replace('<a class="button" href="tel:+393272292006">Prenota · 327 229 2006</a>','<a class="button" href="https://wa.me/393272292006" target="_blank" rel="noopener">Prenota su WhatsApp</a>')
        body=head('Novità')+'<div class="news-grid">'+body+'</div>'
    if file=='il-locale.html':
        # Only Paolo's supplied photographs; deterministic crop removes screenshot UI.
        photos=[('locale-paolo-1.webp',691,922,'Il bancone di Controcorrente'),('locale-paolo-2.webp',691,520,'La sala di Controcorrente con la parete blu'),('locale-paolo-3.webp',691,520,'I tavoli di Controcorrente accanto alla vetrina')]
        gallery='<section class="locale-gallery authorized-photos" aria-label="Fotografie del locale">'+''.join(f'<figure><a href="locale-assets/{name}" target="_blank" rel="noopener"><img src="locale-assets/{name}" width="{w}" height="{h}" alt="{alt}" loading="lazy"></a></figure>' for name,w,h,alt in photos)+'</section>'
        body=re.sub(r'<section class="locale-gallery".*?</section>',gallery,body,flags=re.S)
        body=re.sub(r'<p class="hint">Foto del locale.*?</p>','',body,flags=re.S)
        body=head('Il Locale')+body
    if file in ['contatti.html','club.html','allergeni.html']:
        if file=='contatti.html':body=body.replace('<h1 class="section-title">Contatti e prenotazioni</h1>',head('Contatti e prenotazioni'))
    if file.startswith('club-membro-'):
        # Keep all recorded fields and movements byte-equivalent in value; correct obsolete ranking labels.
        ranking={'faro115':1,'vela55':2,'onda37':3}
        for key,pos in ranking.items():
            if key in file:body=re.sub(r'(<span class="num">)\d+°(</span><span class="label">Posizione classifica)',r'\g<1>'+str(pos)+r'°\2',body)
    body=body.replace('antipasti.html','cena.html#antipasti').replace('primi.html','cena.html#primi').replace('secondi.html','cena.html#secondi')
    (OUT/file).write_text(doc(title,file,body,scripts,private='membro' in file))

for s in ['antipasti','primi','secondi']:
    (OUT/(s+'.html')).write_text(doc('Menù cena','cena.html',head('Menù cena')+'<p><a class="button" href="cena.html#'+s+'">Consulta '+s+'</a></p><script>location.replace("cena.html#'+s+'");</script>'))

# Adapt only the rendering hooks to the new grid; keep ordering logic and validators.
code=js
code=code[:code.index('  const catalog =')]+ '  const catalog = '+json.dumps({s:[[frozen(d['name']),d['price']] for d in ds] for s,ds in data['dinner'].items()},ensure_ascii=False)+';'+code[code.index('\n  const euro'):]
code=code.replace("!key.startsWith('bibite-vini:') && item && Number.isInteger(item.qty) && item.qty > 0 && Number.isFinite(item.price)));", "!key.startsWith('bibite-vini:') && item && Number.isInteger(item.qty) && item.qty > 0 && Number.isFinite(item.price)).map(([key,item])=>{ const [section,index]=key.split(':'); const current=catalog[section]?.[Number(index)]; return [key,current ? {...item,name:current[0],price:current[1]} : item]; }));")
start=code.index('  function setupMenu(section)')
end=code.index('  function setupDaily(section)',start)
code=code[:start]+'''  function setupMenu(section) {
    document.querySelectorAll('[data-order-section="'+section+'"]').forEach((dish,index)=>dish.append(controls(section,index)));
  }
'''+code[end:]
code=code.replace('dish.after(controls(section, index))','dish.append(controls(section, index))')
code=code.replace("menu.querySelector('.daily-price').after(controls(section, individual.length + index));","menu.querySelector('.fixed-bottom').append(controls(section, individual.length + index));")
code=code.replace("'antipasti.html'","'cena.html'")
code=code.replace("const page = location.pathname.split('/').pop().replace(/\\.html$/, '');","const page = (window.__DEMO_ROUTE || location.pathname.split('/').pop()).split('#')[0].replace(/\\.html$/, '');")
code=code.replace('if (catalog[page]) setupMenu(page);',"if (page === 'cena') { ['antipasti','primi','secondi'].forEach(setupMenu); bar(); }")
code=code.replace('da Antipasti, Primi, Secondi o Offerta del giorno','dal Menù cena o dall’Offerta del giorno')
code=code.replace('window.location.href = whatsappUrl;',"if (window.__DEMO_OPEN_WHATSAPP) window.__DEMO_OPEN_WHATSAPP(whatsappUrl); else window.location.href = whatsappUrl;")
(OUT/'preordine.js').write_text(code)

# Production uses the original counter endpoint and once-per-tab session logic.
session=(SRC/'site-session.js').read_text()
(OUT/'site-session.js').write_text(session)
(OUT/'ui.js').write_text('''document.querySelector('.nav-toggle')?.addEventListener('click',function(){const open=this.getAttribute('aria-expanded')!=='true';this.setAttribute('aria-expanded',String(open));document.querySelector('#site-nav').classList.toggle('open',open);});
''')

# Translation prices and references are generated from the shared catalog, preserving original translated wording.
trans=(SRC/'menu-translations.js').read_text()
trans=trans.replace('function renderTranslatedMenu()', 'function renderTranslatedMenu()')
patch='const SHARED_DINNER='+json.dumps(data['dinner'],ensure_ascii=False)+'; const SHARED_OFFERS='+json.dumps(data['offers'],ensure_ascii=False)+'; const SHARED_FIXED='+json.dumps(data['fixed'],ensure_ascii=False)+''';
Object.values(CONTROCORRENTE_MENU).forEach(menu=>{
 menu.courses.forEach((c,i)=>c.dishes.forEach((d,j)=>{const shared=SHARED_DINNER[['antipasti','primi','secondi'][i]][j]; d[2]=new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(shared.price);d[1]=d[1].replace(/\\([\\d, ]+\\)[.]?$/, '')+' ('+shared.allergens.join(', ')+')';}));
 menu.daily.forEach((d,i)=>{d[1]=SHARED_OFFERS[i].allergens.join(', ');d[2]=new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(SHARED_OFFERS[i].price);});
 menu.fixed.forEach((d,i)=>{d[1]=d[1].replace(/[\\d, ]+$/, '')+SHARED_FIXED.dishes[i].allergens.join(', ');});
});
'''
trans=trans.replace('\nfunction renderTranslatedMenu()', '\n'+patch+'\nfunction renderTranslatedMenu()')
trans=trans.replace('const SHARED_DINNER=', 'const SHARED_ALLERGEN_SYMBOLS='+json.dumps(allergen_symbols,ensure_ascii=False)+';\nconst SHARED_DINNER=')
trans=trans.replace('      text.textContent = description;', '''      const refs=description.match(/\\(([\\d, ]+)\\)\\.?$/)||description.match(/([\\d, ]+)$/);
      text.textContent=refs ? description.slice(0,refs.index).replace(/[ ·]+$/,'').trim() : description;
      if(refs){
        const badges=document.createElement('p');badges.className='allergen-refs';
        refs[1].split(',').map(Number).filter(n=>SHARED_ALLERGEN_SYMBOLS[n]).forEach(number=>{
          const info=SHARED_ALLERGEN_SYMBOLS[number];
          const badge=document.createElement('span');badge.className='allergen-badge';badge.title=info.name;badge.setAttribute('aria-label',String(number).padStart(2,'0')+' · '+info.name);
          const pictogram=document.createElement('span');pictogram.className='allergen-pictogram';
          const image=document.createElement('img');image.className='icon';image.src='icons/'+info.icon+'.svg';image.alt='';image.setAttribute('aria-hidden','true');pictogram.append(image);
          const label=document.createElement('span');label.className='allergen-number';label.textContent=String(number).padStart(2,'0');
          badge.append(pictogram,label);badges.append(badge);
        });article.append(badges);
      }''')
# Preserve the existing title/description order, then show the symbol/number row.
trans=trans.replace('      article.append(title, text);','      article.prepend(title, text);')
(OUT/'menu-translations.js').write_text(trans)

print('Generated all pages from menu-data.json; Club data retained; no deployment.')
