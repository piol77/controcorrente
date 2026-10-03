#!/usr/bin/env python3
"""Sincronizza soltanto i menù richiesti, preservando grafica e procedure.
Uso: python3 tools/aggiorna-menu.py offerta bibite   (oppure cena/pranzo)
La fonte è menu-data.json. Non pubblica e non genera fotografie.
"""
from pathlib import Path
from lxml import html, etree
from datetime import datetime
from zoneinfo import ZoneInfo
import json, re, sys, hashlib, subprocess

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'menu-data.json').read_text())
symbols = json.loads((ROOT / 'allergen-symbols.json').read_text())
targets = sys.argv[1:]
if not targets or set(targets) - {'offerta', 'bibite', 'cena', 'pranzo'}:
    sys.exit('Indicare: offerta, bibite, cena e/o pranzo.')
VERSION = datetime.now(ZoneInfo('Europe/Rome')).strftime('%Y%m%d%H%M%S')

def frozen(text):
    return re.sub(r'\b(gamberetti|gamberoni|gamberone|scampi|patatine fritte)\*?', r'\1*', text, flags=re.I)

def node(tag, text=None, **attrs):
    el = etree.Element(tag, {k.rstrip('_').replace('_', '-'):str(v) for k,v in attrs.items()})
    el.text = text
    return el

def pictogram(name, cls='icon'):
    return node('img', class_=cls, src=f'icons/{name}.svg', alt='', aria_hidden='true')

def dish(d, section='', index=0, fixed=False):
    for a in d.get('allergens', []):
        if str(a) not in symbols or a == 12: raise ValueError('Riferimento allergene non ammesso')
    cls = 'daily-dish dish' if section == 'offerta' else 'lunch-dish dish' if section == 'pranzo' else 'dish beverage' if section == 'bibite' else 'dish'
    art = node('article', class_=cls)
    if section in data['dinner']:
        art.set('data-order-section', section); art.set('data-order-index', str(index))
    if 'dishPhoto' in d:
        if not (ROOT / d['dishPhoto']).is_file(): raise ValueError('Foto mancante: '+d['dishPhoto'])
        art.set('class', cls+' dish-photo-card')
        art.append(node('img', class_='dish-photo', src=d['dishPhoto'], alt=frozen(d['name']), width='1200', height='800', loading='eager'))
    elif 'photo' in d:
        art.set('class', cls+' wine-card')
        # Inquadratura della bottiglia originale: nessuna scritta esterna, etichetta intatta.
        svg = node('svg', class_='wine-photo', viewBox=d.get('photoViewBox', '290 0 220 800'), role='img', aria_label='Bottiglia di '+d['name']+' · Cantine Delite', preserveAspectRatio='xMidYMid meet')
        x,y,w,h=d.get('photoViewBox','290 0 220 800').split()
        crop_id=f'wine-crop-{index}'
        defs=node('defs'); crop=node('clipPath', id=crop_id)
        crop.append(node('rect', x=x, y=y, width=w, height=h)); defs.append(crop); svg.append(defs)
        svg.append(node('image', href=d['photo'], width='800', height='800', clip_path=f'url(#{crop_id})')); art.append(svg)
    else: art.append(pictogram(d['icon'], 'icon dish-mark'))
    copy = node('div', class_='dish-copy')
    copy.append(node('h2' if section == 'offerta' else 'h3', frozen(d['name'])))
    if d.get('designation'): copy.append(node('p', d['designation'], class_='wine-designation'))
    copy.append(node('p', frozen(d['description']), class_='dish-description'))
    if d.get('allergens'):
        refs = node('p', class_='allergen-refs', aria_label='Riferimenti allergeni')
        for a in d['allergens']:
            info = symbols[str(a)]
            badge = node('span', class_='allergen-badge', title=info['name'], aria_label=f'{a:02} · '+info['name'])
            circle = node('span', class_='allergen-pictogram'); circle.append(pictogram(info['icon']))
            badge.append(circle); badge.append(node('span', f'{a:02}', class_='allergen-number')); refs.append(badge)
        copy.append(refs)
    if d.get('sourceUrl'): copy.append(node('a', 'Cantine Delite · Scheda del vino', class_='wine-source', href=d['sourceUrl'], target='_blank', rel='noopener'))
    art.append(copy)
    if not fixed: art.append(node('strong', f"{d['price']:.2f} €".replace('.', ','), class_='dish-price'+(' daily-dish-price' if section == 'offerta' else '')))
    return art

def fill(grid, dishes, section, fixed=False):
    for child in list(grid): grid.remove(child)
    for i,d in enumerate(dishes): grid.append(dish(d, section, i, fixed))

for target in targets:
    name = 'bibite-vini' if target == 'bibite' else target
    path = ROOT / (name+'.html'); doc = html.fromstring(path.read_text())
    if target == 'offerta':
        fill(doc.cssselect('.daily-menu:not(.daily-fixed-menu) .dish-grid')[0], data['offers'], 'offerta')
        fill(doc.cssselect('.daily-fixed-menu .dish-grid')[0], data['fixed']['dishes'], 'offerta', True)
        doc.cssselect('.daily-menu:not(.daily-fixed-menu) .course-heading h2')[0].text = 'Piatti del giorno'
        doc.cssselect('.daily-price strong')[0].text = f"{data['fixed']['price']:.2f} €".replace('.', ',')
    elif target == 'bibite':
        for grid, key in zip(doc.cssselect('.menu-course .dish-grid'), ['drinks', 'wines']): fill(grid, data[key], 'bibite')
    elif target == 'cena':
        for section in data['dinner']: fill(doc.cssselect('#'+section+' .dish-grid')[0], data['dinner'][section], section)
    else:
        fill(doc.cssselect('.lunch-board .dish-grid')[0], data['lunch'], 'pranzo')
        digest = hashlib.sha256(json.dumps(data['lunch'], sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        statefile = ROOT/'menu-build-state.json'; state = json.loads(statefile.read_text())
        if state.get('lunchDigest') != digest:
            now = datetime.now(ZoneInfo('Europe/Rome'))
            days = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']
            months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']
            data['lunchUpdatedAt'] = now.date().isoformat(); data['lunchDateLabel'] = f'{days[now.weekday()]} {now.day} {months[now.month-1]} {now.year}'
            time = doc.cssselect('.lunch-date time')[0]; time.text = data['lunchDateLabel']; time.set('datetime', data['lunchUpdatedAt'])
            statefile.write_text(json.dumps({'lunchDigest':digest}, indent=2)); (ROOT/'menu-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    for el in doc.cssselect('link[href], script[src]'):
        attr = 'src' if el.tag == 'script' else 'href'; val = el.get(attr)
        if val.split('?')[0].endswith(('.css','.js')): el.set(attr, val.split('?')[0]+'?v='+VERSION)
    path.write_text('<!doctype html>'+etree.tostring(doc,encoding='unicode',method='html'))

if 'cena' in targets:
    p = ROOT/'preordine.js'; js=p.read_text()
    catalog={s:[[frozen(d['name']),d['price']] for d in ds] for s,ds in data['dinner'].items()}
    js=re.sub(r'  const catalog = .*?;\n  const euro', '  const catalog = '+json.dumps(catalog,ensure_ascii=False)+';\n  const euro',js,count=1)
    p.write_text(js)
if {'cena','offerta'} & set(targets):
    p=ROOT/'menu-translations.js'; js=p.read_text()
    if 'offerta' in targets:
        prefix='const CONTROCORRENTE_MENU = '
        source_text=js[:js.index('\n\nconst SHARED_ALLERGEN_SYMBOLS')]
        source=json.loads(subprocess.check_output(['node','-e',"process.stdout.write(require('vm').runInNewContext(require('fs').readFileSync(0,'utf8')+';JSON.stringify(CONTROCORRENTE_MENU)'));"],input=source_text,text=True))
        for lang,menu in source.items():
            menu['dailyTitle']='Today’s Dinner Offers' if lang=='en' else '今日晚餐优惠'
            menu['daily']=[[d['translations'][lang]['name'],d['translations'][lang]['description']+' ('+', '.join(map(str,d['allergens']))+')',f"€ {d['price']:.2f}".replace('.',',')] for d in data['offers']]
            menu['fixed']=[[d['translations'][lang]['name'],d['translations'][lang]['description']+' ('+', '.join(map(str,d['allergens']))+')',''] for d in data['fixed']['dishes']]
        js=prefix+json.dumps(source,ensure_ascii=False,indent=2)+';'+js[js.index('\n\nconst SHARED_ALLERGEN_SYMBOLS'):]
    for var,value,end in [('SHARED_DINNER',data['dinner'],'; const SHARED_OFFERS='),('SHARED_OFFERS',data['offers'],'; const SHARED_FIXED='),('SHARED_FIXED',data['fixed'],';\nObject.values')]:
        start=js.index('const '+var+'=')+len('const '+var+'='); stop=js.index(end,start)
        js=js[:start]+json.dumps(value,ensure_ascii=False)+js[stop:]
    # Preserve descriptions while refreshing only the final references and shared prices.
    js=js.replace("d[1]=SHARED_OFFERS[i].allergens.join(', ');", "d[1]=d[1].replace(/\\([\\d, ]+\\)\\.?$/, '').trim()+' ('+SHARED_OFFERS[i].allergens.join(', ')+')';")
    js=js.replace("d[1]=d[1].replace(/[\\d, ]+$/, '')+SHARED_FIXED.dishes[i].allergens.join(', ');", "d[1]=d[1].replace(/\\([\\d, ]+\\)\\.?$/, '').trim()+' ('+SHARED_FIXED.dishes[i].allergens.join(', ')+')';")
    p.write_text(js)
print('Aggiornati: '+', '.join(targets)+'. Verificare e pubblicare; grafica e procedure preservate.')
