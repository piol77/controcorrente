#!/usr/bin/env python3
"""Riserva editoriale quotidiana: interviene solo se l'edizione daily manca.

L'automazione creativa delle 08:00 resta prioritaria. Nessuna chiamata a servizi
esterni o cambi a CSS, grafica, menù o altre pagine.
"""
from datetime import datetime
from html import escape
from pathlib import Path
import re
from zoneinfo import ZoneInfo

PAGE = Path(__file__).resolve().parent.parent / "divertentismo.html"
ROME = ZoneInfo("Europe/Rome")

# Battute originali di riserva, tutte approvate dal filtro editoriale:
# brevi, non offensive; temi ristorazione, ingegneria, banca.
# Sono usate soltanto quando il generatore creativo non ha pubblicato.
JOKES = [
    ("Il caffè corto", "ristorazione", "Il cliente", "Il caffè è corto?", "Il cameriere", "Sì. La pausa, invece, è lunga."),
    ("Piatto leggero", "ristorazione", "Il cliente", "Avete un piatto molto leggero?", "Il cameriere", "Certamente. Glielo porto vuoto?"),
    ("La riserva", "ristorazione", "Il cliente", "Posso prenotare un tavolo riservato?", "Il cameriere", "Sì, ma non parla con gli altri."),
    ("Una decisione difficile", "ristorazione", "Il cliente", "Non so quale dolce scegliere.", "Il cameriere", "Ne prenda due: il dubbio si dimezza."),
    ("Il piatto del giorno", "ristorazione", "Il cliente", "Il piatto del giorno è fresco?", "Il cameriere", "Sì, si è appena svegliato."),
    ("Condivisione", "ristorazione", "Il cliente", "Questo antipasto è da condividere?", "Il cameriere", "Dipende dall'amicizia."),
    ("Pasta puntuale", "ristorazione", "Il cliente", "La pasta arriva in orario?", "Il cameriere", "Prima aspetti che sia pronta."),
    ("La scarpetta", "ristorazione", "Il cliente", "Posso fare la scarpetta?", "Il cameriere", "Sì, il pane ha già dato il consenso."),
    ("Il menù sincero", "ristorazione", "Il cliente", "Il dolce è una tentazione?", "Il cameriere", "Sì, ma non firma contratti."),
    ("Posto d'onore", "ristorazione", "Il cliente", "È libero il tavolo migliore?", "Il cameriere", "Lo è finché non arriva qualcuno."),
    ("Liquidità", "bancari", "Il bancario", "Avrei bisogno di liquidità.", "Il cameriere", "Naturale o frizzante?"),
    ("Il rendimento", "bancari", "Il bancario", "Quanto rende questo pranzo?", "Il cameriere", "Di solito un buon umore."),
    ("Capitale iniziale", "bancari", "Il bancario", "Qual è il capitale minimo?", "Il cameriere", "Una buona fame."),
    ("Pagamento dilazionato", "bancari", "Il bancario", "Posso pagare a rate?", "Il cameriere", "Una portata alla volta."),
    ("Investimento sicuro", "bancari", "Il bancario", "Ha un investimento sicuro?", "Il cameriere", "La torta: sparisce sempre."),
    ("Rischio calcolato", "bancari", "Il bancario", "Questa scelta comporta rischi?", "Il cameriere", "Solo di chiedere il bis."),
    ("Bilancio positivo", "bancari", "Il bancario", "Qui il bilancio è positivo?", "Il cameriere", "I piatti tornano sempre vuoti."),
    ("Il tasso variabile", "bancari", "Il bancario", "Il tasso è variabile?", "Il cameriere", "Il caffè è sempre espresso."),
    ("Titoli e contorni", "bancari", "Il bancario", "Che titoli avete oggi?", "Il cameriere", "Primi, secondi e contorni."),
    ("Cambio alla pari", "bancari", "Il bancario", "Effettuate cambi?", "Il cameriere", "Sì, patate al posto dell'insalata."),
    ("Linea retta", "ingegneri", "L'ingegnere", "La pasta segue una linea retta?", "Il cameriere", "Oggi no: sono fusilli."),
    ("Misure precise", "ingegneri", "L'ingegnere", "Posso misurare la porzione?", "Il cameriere", "Sì, purché sia prima di mangiarla."),
    ("Progetto del dessert", "ingegneri", "L'ingegnere", "Il dessert ha un progetto?", "Il cameriere", "Sì: arrivare fino al cucchiaino."),
    ("Centro di gravità", "ingegneri", "L'ingegnere", "Dov'è il baricentro del piatto?", "Il cameriere", "Dove rimane la salsa."),
    ("Calcolo dei tempi", "ingegneri", "L'ingegnere", "Ho calcolato i tempi di cottura.", "Il cameriere", "Perfetto, aggiunga quelli per assaggiare."),
    ("Struttura portante", "ingegneri", "L'ingegnere", "Il pane ha una struttura portante?", "Il cameriere", "Certo: regge la scarpetta."),
    ("Cerchio perfetto", "ingegneri", "L'ingegnere", "La pizza è perfettamente circolare?", "Il cameriere", "Finché non arriva la prima fetta."),
    ("Tolleranze", "ingegneri", "L'ingegnere", "Che tolleranza ha la cottura?", "Il cameriere", "Quella dello chef, prima di pranzo."),
    ("Piano inclinato", "ingegneri", "L'ingegnere", "Il tavolo è in piano?", "Il cameriere", "Sì, lo spaghetto no."),
    ("Collaudo", "ingegneri", "L'ingegnere", "Prima di servire fate un collaudo?", "Il cameriere", "Certo: lo chef assaggia."),
]


def drawing(theme, final):
    """Due scene vettoriali in palette e scala approvate (480 x 250)."""
    base = (
        '<path d="M24 220H456M32 230q20-10 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" opacity=".35"/>'
        '<path d="M30 30h100m-80 10h80M350 30h90m-90 10h60" opacity=".25"/>'
        '<rect x="157" y="151" width="198" height="14" rx="4" fill="#153650"/>'
        '<path d="M177 165v54m159-54v54"/>'
    )
    customer = (
        '<circle cx="101" cy="80" r="24" fill="#0e2940"/>'
        '<path d="M81 73q19-13 40 0m-31 15q9 7 19 0M79 106l-20 57'
        'm42-57l27 43 29 5M71 123h38l8 41H59m20 0v47m30-47v47'
        'm-38 0h14m17 0h14M57 131v51h62" />'
    )
    waiter = (
        '<circle cx="405" cy="68" r="23" fill="#0e2940"/>'
        '<path d="M385 61q19-12 40 0m-31 16q9 7 19 0'
        'm-31 15l-15 68h75l-14-68m-44 4l21 25 21-25'
        'm-46 10l-45 32-38-4m139-28l12 39m-58 15v52m34-52v52'
        'm-41 0h14m37 0h14"/>'
    )
    if theme == "bancari":
        prop = '<rect x="214" y="104" width="75" height="38" rx="3" fill="#0e2940"/><path d="M226 115h51m-51 13h44M81 110l18 26 13-26" opacity=".8"/>'
    elif theme == "ingegneri":
        prop = '<path d="M215 141l37-49 40 49zM233 129l20-26 20 26zM128 139l33-24m-24 12l7 6" opacity=".85"/>'
    else:
        prop = '<ellipse cx="255" cy="144" rx="44" ry="7" fill="#0e2940"/><path d="M234 132q22-20 44 0M226 140q28-12 56 0" opacity=".75"/>'
    if final:
        prop += '<path d="M333 125l-44 25m3-8l-5 9M208 139q-16-7-29 1" opacity=".75"/>'
    return ('<svg viewBox="0 0 480 250" role="img" '
            'aria-label="Una piccola scena illustrata al tavolo del ristorante" '
            'xmlns="http://www.w3.org/2000/svg">'
            '<g fill="none" stroke="#bfa77c" stroke-width="3" '
            'stroke-linecap="round" stroke-linejoin="round">'
            + base + customer + waiter + prop + '</g></svg>')


def make_article(now, joke):
    title, theme, first, question, second, reply = joke
    day = now.date()
    stamp = day.strftime("%Y%m%d")
    months = ("gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
              "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre")
    label = f"{day.day} {months[day.month-1]} {day.year}"
    panels = ""
    for i, (speaker, sentence) in enumerate(((first, question), (second, reply))):
        panels += ('<section class="comic-panel"><div class="comic-dialogue">'
                   '<p><span class="small-meta">' + escape(speaker) + '</span><br>'
                   '«' + escape(sentence) + '»</p></div>'
                   + drawing(theme, i == 1) + '</section>')
    return ('<article class="offer daily-comic" aria-labelledby="comic-title-'
            + stamp + '-daily" data-published-at="' + now.isoformat(timespec="seconds")
            + '" data-comic-edition="daily"><p class="small-meta"><time datetime="'
            + day.isoformat() + '">' + label
            + '</time> · La vignetta del giorno</p><h2 id="comic-title-'
            + stamp + '-daily">' + escape(title)
            + '</h2><div class="comic-panels">' + panels + '</div></article>')


def main():
    now = datetime.now(ROME)
    if now.hour < 9:
        print("La generazione delle 08:00 ha ancora la precedenza.")
        return
    page = PAGE.read_text(encoding="utf-8")
    pattern = re.compile(r'<article class="offer daily-comic"[\s\S]*?</article>')
    articles = list(pattern.finditer(page))
    if not articles:
        raise RuntimeError("Nessuna vignetta di riferimento: non modifico il sito")
    existing = [m.group(0) for m in articles]
    date = now.date().isoformat()
    if any('data-comic-edition="daily"' in x and
           f'data-published-at="{date}' in x for x in existing):
        print("Edizione quotidiana già presente: nessun doppione.")
        return
    # Non riscrivere HTML non relativo agli articoli.
    if any(page[a.end():b.start()].strip() for a, b in zip(articles, articles[1:])):
        raise RuntimeError("Struttura HTML inattesa: nessuna modifica")
    used = {re.search(r'<h2[^>]*>(.*?)</h2>', a).group(1)
            for a in existing if re.search(r'<h2[^>]*>(.*?)</h2>', a)}
    start = now.date().toordinal() % len(JOKES)
    joke = next((JOKES[(start + i) % len(JOKES)]
                 for i in range(len(JOKES)) if JOKES[(start + i) % len(JOKES)][0] not in used), None)
    if joke is None:
        raise RuntimeError("Nessuna battuta nuova disponibile: nessuna modifica")
    new = make_article(now, joke)
    all_articles = existing + [new]
    all_articles.sort(
        key=lambda a: datetime.fromisoformat(re.search(
            r'data-published-at="([^"]+)"', a).group(1)), reverse=True)
    visible = all_articles[:3]
    result = page[:articles[0].start()] + "".join(visible) + page[articles[-1].end():]
    if len(re.findall(r'<article class="offer daily-comic"', result)) != 3 or result.count("<svg ") != 6:
        raise RuntimeError("Controllo grafico fallito: nessuna modifica")
    temporary = PAGE.with_suffix(".tmp")
    temporary.write_text(result, encoding="utf-8")
    temporary.replace(PAGE)
    print("Vignetta di recupero pubblicabile:", joke[0], date)


if __name__ == "__main__":
    main()
