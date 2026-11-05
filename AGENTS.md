# AGENTS.md — Controcorrente

## Purpose
This file is the permanent operating specification for AI agents working on the Controcorrente restaurant website. Read it before changing code, content, images, CSS, navigation, publishing configuration, or repository structure.

## Tessera Punti Pranzo — studenti, 2026-10-09
- Voce «Tessera Punti Pranzo» subito sotto Club, prima di Allergeni, in tutte le pagine; pagina `tessera-punti-pranzo.html`. Conservare la voce durante ogni futura rigenerazione.
- Grafica e struttura identiche al Club. Mostrare in grande «SOLO PER STUDENTI» e nel titolo «Solo a pranzo / Da martedì a venerdì, esclusi i festivi». Accumulo punti e utilizzo sconti esclusivamente a pranzo da martedì a venerdì, esclusi i festivi.
- Programma separato: 1 € effettivamente pagato a pranzo = 1 punto; ogni 100 punti disponibili = 5 € di sconto, utilizzabili dal pranzo successivo esclusivamente a pranzo.
- Classifica studenti autonoma con pseudonimo, punti totali e sconti riscossi cumulativi. Non mescolare soci, punti o sconti con il Club.
- Stesso meccanismo di tessere personali, QR, link non collegato dalla classifica e nome nel frammento. Seguire `.github/instructions/lunch-student-card.md` e il master QR Club. Non inventare iscritti; escludere la tessera dimostrativa dalla classifica.

## Core rule: minimal, surgical changes
- Change only what Paolo explicitly requests.
- Do not redesign, rewrite, reorganize, rename, “improve”, modernize, or clean up unrelated working parts.
- Preserve all existing working features unless the requested change necessarily affects them.
- Before substantial changes, inspect the current implementation and preserve a recoverable working state.
- Never delete this repository as part of hosting/deployment cleanup.

## Repository and hosting
- Canonical repository: `piol77/controcorrente`.
- This repository contains the current website and must be preserved.
- Netlify is no longer used: its projects/site were deleted and the GitHub ↔ Netlify authorization was removed.
- Do not recreate or reconnect Netlify unless Paolo explicitly asks.
- Do not assume that removing a hosting service means removing this repository.
- Before publishing, verify the actual current hosting/deployment configuration in the repository/account rather than guessing.

## Visual identity
- Keep the established Controcorrente nautical/marine identity.
- All pages and menu sections must look like parts of the same site.
- Antipasti, primi, secondi, vini/bevande and other menu areas must use a uniform visual language: same background treatment, waves/marine decoration, typography logic, spacing, cards/sections, image treatment and navigation.
- Do not allow one section to drift into a visibly different template.
- Preserve the current responsive/mobile presentation unless a change is specifically requested.
- Prefer the existing CSS/components/assets over introducing a second competing style system.
- When adding food imagery, use realistic food photography/imagery coherent with the dish and existing design; do not replace unrelated images.

### Locked visual master (permanent default)
The currently published site is the approved visual master. Its graphic system must not drift between pages or be reinterpreted during content edits.

- Source of truth: the existing `styles.css` and the currently published HD menu boards.
- Master menu boards: `Antipasti-HD.png`, `Primi-HD.png`, `Secondi-HD.png`, and `Bibite-HD.png`, all RGB PNG at 2048 × 3072. New raster menu boards must be rendered at this resolution or higher and must preserve the same proportions.
- Typography: keep the current serif system `Georgia, "Times New Roman", serif`, with the existing small-caps treatment, weights, sizes, line heights, letter spacing and hierarchy. Do not substitute fonts without Paolo's explicit request.
- Primary palette: deep nautical blue `#082a43`, body text blue `#0c2940`, warm paper `#f4efe4` / `#fffaf0`, gold `#cba76d`, sea blues `#1685b3` / `#54a9c8`, and price highlight yellow `#efbd36`. Preserve the current secondary shades already defined in `styles.css`; do not introduce a competing palette.
- Backgrounds and gradients: keep the warm paper/parchment surfaces and the established deep-blue/teal marine gradients. Preserve existing opacity, border, shadow and contrast treatments.
- Decorations: preserve anchors, waves, nautical dividers, double borders, gold outlines, irregular yellow price strips, marine ornaments and their current scale, placement and spacing.
- Components: navigation, headers, menu boards, dish rows/cards, price labels, footers, allergen presentation and responsive breakpoints must remain visually consistent with the approved pages.
- Images: preserve crop, placement, proportions, realistic food style and surrounding decorative context. Do not repeatedly paint over or patch raster text if this produces stains, ghosting, blurred letters or visibly dirty areas.
- Quality rule: if a requested correction cannot be made cleanly, rebuild/render the entire affected page from the approved master at HD or higher resolution, reproducing every unchanged element exactly and applying only the requested correction.
- Never redesign the master as part of a text, price, allergen, asterisk, translation or single-dish correction.

### Locked price-and-order-control layout (approved 2026-09-30)
This arrangement is part of the permanent visual master and must remain unchanged unless Paolo explicitly requests a layout change.

- Applies to the dinner food boards `Antipasti-HD.png`, `Primi-HD.png`, and `Secondi-HD.png`; drinks and wines must never receive `+` / `−` order controls.
- Keep every price and its gold underline in the approved raised position, 48 raster pixels above their former position on the 2048 × 3072 boards.
- Prices must share one coherent right-hand alignment and the same visual relationship to their dish row. Changing dish names, descriptions, allergens, photos or prices must not move the approved price column or alter its spacing.
- Place each compact `+` / `−` control directly below its price, on the clear background, horizontally aligned with that price.
- A control must remain entirely inside the horizontal band belonging to its dish. It must never overlap a food photo, price, dish text, allergens, divider, decoration, or any content in the dish row below.
- Preserve the current compact proportions and responsive scaling on desktop and mobile. If text grows, reflow only the text inside its existing text area; do not displace the price/control column or allow the row to invade the next dish.
- Current approved control anchors in `preordine.js` are authoritative: all use `left: 92%`; Antipasti `top: 28.06%, 50.07%, 69.73%`; Primi `top: 25.85%, 44.63%, 61.00%, 79.78%`; Secondi `top: 26.79%, 45.05%, 62.53%, 81.18%`.
- When dishes or prices change, update the corresponding catalog data and visible board together while preserving these row anchors and layout rules. Move an anchor only when Paolo explicitly changes the row structure or expressly asks for a new position.
- For raster corrections, change only the necessary price/text/photo region. All pixels outside the requested region must remain identical to the approved master; do not regenerate or reinterpret the whole board.
- Preserve the cache-version updates in the relevant HTML whenever an approved board, stylesheet or preorder script changes, so visitors receive the new layout.

## Menu content rules
### Avvisi specifici dei piatti — 2026-10-08
- Gli avvisi del riepilogo legati a un piatto devono derivare dal piatto corrente in `menu-data.json`, mai da frasi fisse in `ordine.html` o da controlli sul nome del risotto.
- Registrare nel singolo piatto `minPortions` (intero maggiore di 1, solo quando richiesto) e/o `orderNotice` (testo della condizione, senza ripetere il nome). `order-notices.js` usa il nome attuale e questi campi per generare gli avvisi, anche per pranzo, offerte e componenti del menù fisso.
- A ogni sostituzione rivalutare questi campi: non ereditare le condizioni del vecchio piatto. Aggiornare o rimuovere i campi quando cambia la condizione; eliminando il piatto scompare anche il suo avviso. Non dedurre un minimo dal tipo di piatto.
- Nessun campo pertinente significa nessun avviso specifico né spazio vuoto. Conservare separatamente gli avvisi generali. Questi metadati sono informativi e non modificano le policy di prenotazione o la validazione degli ordini.

When Paolo asks to add, remove, rename or change a dish:
1. Modify only the named dish(es)/field(s).
2. Leave all other dishes, prices, wording, order and styling unchanged unless explicitly requested.
3. Include a short description where the current design uses descriptions.
4. Keep prices exactly as instructed.
5. Maintain the existing layout and visual hierarchy.

### Menu-only update lock (permanent rule, 2026-10-01)
When Paolo asks to “change/update only the menu”, “vary the menu”, replace dishes, change dish text, or otherwise requests a menu-content update without explicitly requesting a design or functional change, treat the request as content-only.

- Do not change, regenerate, reinterpret, resize, move or restyle any logo, background, page layout, symbol, icon, decorative element, font system, color, border, gradient, image frame, navigation element, price strip, button, `+` / `−` control, WhatsApp control, order-summary control, responsive rule, spacing system or any other graphic/UI element.
- Do not change the behavior, workflow or logic of ordering, WhatsApp composition, validation, counters, navigation, translations, cache handling, sessions or any other existing working feature merely because menu content changed.
- Preserve the current approved visual master and button/control positions exactly unless Paolo explicitly asks for a graphic, layout, button-position or functional change.
- The only functional/data adjustment automatically required by a menu-only update is to re-evaluate and synchronize the pricing/catalog data used by the ordering system so every selected dish, quantity, subtotal, total, summary and WhatsApp message uses the correct current visible price.
- Update only the minimum source data/files required for the changed dishes and their prices. Do not refactor unrelated code and do not alter working order mechanics.
- If a dish price changes, the visible price and the corresponding order-price source must be updated together in the same change. If a dish name changes, keep its order mapping synchronized without changing the ordering workflow.
- Existing functionality remains authoritative and frozen by default. Any change to buttons, graphics, layout, ordering behavior or site logic requires a separate explicit instruction from Paolo.

### Allergens
- Show allergens only as the corresponding regional allergen-table numbers in parentheses.
- Never spell out allergen names beside dishes.
- Do not indicate sulphites.
- Do not invent allergen numbers: derive them from the actual ingredients when sufficiently known; if uncertain, flag the uncertainty instead of guessing.

### Frozen-at-origin marker
- Use `*` for ingredients/products frozen at origin.
- Always apply the marker to gamberetti/gamberoni and patatine fritte when they appear.
- Place the marker directly after the frozen ingredient name (for example `gamberetti*`, `gamberoni*`, `scampi*`), never after the price.
- Preserve the site's explanatory note for the asterisk where applicable.

### Dynamic content checks
- English and Chinese menu translations are dynamic and share the site's current menu data. Recheck and synchronize them whenever a relevant source dish changes; do not maintain visually divergent copies.
- Frozen markers are dynamic: reassess the affected ingredients on every menu edit and place `*` immediately after each applicable ingredient name.
- Allergen numbers are dynamic: recalculate them from the actual changed ingredients every time, using only regional table numbers in parentheses and never sulphites.
- Paolo supplies the remaining variable content (dishes, descriptions, prices, offers and other business wording). Correct grammar, spelling and style automatically while preserving the intended meaning and business terms.
- Regola master permanente, confermata il 2026-10-08: correggere automaticamente gli errori di ortografia, grammatica, punteggiatura e stile nei nomi e nelle descrizioni dei piatti forniti da Paolo prima di pubblicarli. Usare un italiano corretto, naturale ed elegante, preservando significato, ingredienti, preparazione, quantità e prezzi. Sincronizzare il testo corretto con dati del menù, associazioni delle traduzioni e ordini, senza cambiare immagini, grafica o funzionamento. Esempio: «seppioline», non «seppiline».
- Whenever a visible dish or offer price changes, update the matching preorder catalog/data in `preordine.js` in the same edit so quantities, summaries, totals and the WhatsApp message always use the new price.

### Lunch dish images
- Whenever lunch dishes are updated, add a small realistic image for each dish directly below its name whenever a suitable image is available.
- Keep lunch photos compact and consistently placed. They must never cover or displace the price, `+` / `−` controls, allergens, text or another dish.
- Use the existing `.lunch-photo` treatment and preserve the approved nautical layout; do not invent a competing card style.

### Locked lunch-menu layout (permanent default)
- Treat the current lunch menu as part of the same approved nautical visual system as the dinner menus: preserve the established Georgia serif typography, deep-blue text and headings, warm-paper surface, gold borders, sea-blue dividers, irregular yellow price strip and compact realistic food photography.
- Every lunch dish row must use the same alignment and spacing logic. Keep the dish text and photo in the left content column and the price/control stack in the fixed right column.
- Keep the price slightly raised above the compact `−` / `+` control so neither element overlaps or covers the other. The price strip, control position, column alignment, row spacing and mobile behavior must remain consistent across all lunch dishes.
- When lunch text becomes longer, reflow only inside its content column. Never push the price or control over the photo, allergens, another row or outside the board.
- Lunch preorder names and prices are read dynamically from `pranzo.html` by `preordine.js`; after every lunch edit, verify the cart summary and total against all visible prices.
- Preserve the current class names and structure (`.lunch-board`, `.lunch-course`, `.lunch-dish`, `.lunch-photo`, `.lunch-allergens`, `.order-controls`) unless Paolo explicitly asks for a layout redesign.

## Restaurant wording and business rules
Preserve established Controcorrente wording and commercial rules unless Paolo explicitly changes them.
- Dinner cover charge: €1.50.
- Established wording includes “Comunicare allergie” and “*Ingredienti congelati all’origine”.
- For lunch, established communication includes “PRANZO CONTROCORRENTE”, reservations by 12, and acqua/caffè/coperto inclusi where currently applicable.
- Do not silently change prices, promotions, included items, booking conditions, opening information or business rules while editing another part of the site.

## Existing website features
### Anonymous visible counter
- Preserve the existing visible visit/click counter.
- Its purpose is a simple aggregate anonymous count.
- Count the visitor once per browser per Rome calendar day, regardless of which site page they enter first; internal page changes and reloads on the same day must not add visits.
- Keep the numerical counter visible on the home page without an “Accesso già registrato” explanatory box or message.
- Do not add names, user identification, profiling or unnecessary tracking.
- Do not remove or replace it while editing unrelated code.

### “Tessera appunti”
- Preserve the existing notes/card (“tessera appunti”) feature and its current behavior.
- Do not remove, reset or redesign it as collateral damage from unrelated work.

### Dinner preorders
- Preserve the `+` / `−` controls on the four dinner menu pages and the daily dinner offer, the order summary in `ordine.html`, and the WhatsApp request flow in `preordine.js`.
- The four HD menu images remain unchanged by the controls. When a dinner dish, drink, price, order or daily offer changes, update the corresponding entry in `preordine.js` at the same time so the summary and message match the visible menu. Adjust a control position only if its dish photo moves.
- Keep lunch's existing WhatsApp booking button and its noon deadline separate from dinner preorders.
- The website only composes the WhatsApp message; the customer sends it and Paolo confirms the request. Requests made by 18:00 are answered by 18:30. Do not collect identity-document photos or silently submit requests.
- Clear the selected items when the customer clicks the WhatsApp request button; opening the site again must start with an empty selection. Keep dinner `+` / `−` controls compact in the clear area below each price, never over a food photo or the price strip.
- Do not request the customer's telephone number in preorder forms and do not repeat a telephone field in the generated message: Paolo receives the request from the customer's WhatsApp account.
- In lunch and dinner ordering areas, state in bold that the customer must wait for the Ristorante's confirmation before the order is valid. Preserve this warning in every existing explanatory summary and notice.
- The Contacts page must keep a direct WhatsApp button to `327 229 2006`.

### Menu-page uniformity
- Every food-menu page, including lunch and `Offerta del giorno`, must preserve the same approved nautical visual system, page structure and responsive quality used by Antipasti and Primi.
- Every page or section that displays food dishes, including translated menus and the order summary, must include a visible `Consulta la tabella allergeni` link to `allergeni.html`.
- Home, Contacts, Allergens, Club and Il Locale are the only pages allowed to retain their distinct established layouts.
- The permanent public label for `offerta.html` is `Offerta del giorno`; inside the page, use the same service-label graphic as the dinner menu with the exact two-line wording `Valido solo per cena` / `… e pranzo nei festivi`.

## Content publishing procedure
Before committing/publishing:
1. Read this file and inspect the current site.
2. Identify exactly which files/components are required for the requested change.
3. Make the smallest viable edit.
4. Verify that navigation and all menu sections still work.
5. Check mobile/responsive rendering.
6. Check that the visual design remains uniform across sections.
7. Check prices, spelling, allergen numbers and frozen markers for changed dishes.
8. Verify that the anonymous counter still works.
9. Verify that the tessera appunti still works.
10. Ensure no unrelated content or business rule changed.
11. Preserve the repository and avoid destructive deployment/account operations unless explicitly requested.
12. After every change to dinner dishes or the daily special, update the shared English and Chinese translations in `menu-translations.js` as the final content check.

## Safety against accidental regressions
- Never bulk-delete old-looking assets until confirming they are genuinely unused by the current site.
- Never replace all menu pages/templates just to change one dish.
- Never change multiple prices because one price was requested.
- Never infer that a visually similar asset is obsolete without checking references in HTML/CSS/JS.
- If current code conflicts with these instructions, preserve the live/current behavior first and surface the conflict before destructive changes.
- If a request is ambiguous and could overwrite working content, inspect first and choose the non-destructive interpretation.

## Working style for AI/Work agents
Treat the current site as production, not as a blank design exercise. Existing approved appearance and behavior are the baseline. Paolo's explicit latest instruction overrides this file only for the specific requested change; it does not authorize unrelated changes.

When finished, report concisely:
- what was changed;
- which files were changed;
- whether checks passed;
- any uncertainty requiring Paolo's decision.

Last established: 2026-10-01.

## Latest overrides — 2026-10-01
- Count every page opening and reload across every HTML page, including navigation between menus. Do not deduplicate by device, browser, cookie, localStorage or session. One shared counter key for the whole site; show the badge only on Home. First number: today's requests in Europe/Rome (00:00 to 23:59); second: cumulative total. Preserve the existing server-side total.
- Daily offers retain the approved nautical graphics. For these offers, omit food photos; show allergen reference numbers with symbols, without parentheses, and frozen markers immediately after the ingredient.
- `offerta.html` must permanently use the same visual family as Antipasti, Primi and Secondi: parchment background, blue sea waves, coastal mountains, sailboat, blue nautical ornaments, gold price strips, soft gradients and one circled symbol above each allergen reference number. Apply this rule only to the daily-offer page unless Paolo explicitly requests changes elsewhere.
- If terminal GitHub authentication is unavailable, use the existing authenticated GitHub browser session and upload the changed files in one commit. Browser-facing paths map from /workspace/scratch to /home/oai/share. Check Pages deployment and the live result; do not request another login when the browser is already signed in.
- The order summary has an Azzera tutto button and automatically uses the current Europe/Rome calendar day in the WhatsApp message. Preserve the existing clear-on-WhatsApp behavior.


## Approved redesign and publication — 2026-10-03
Paolo approved publication of the complete midnight-blue nautical redesign, with refined stylized icons/illustration and a common replaceable dish grid. Novità replaces Home and contains news/promotions only, no restaurant photographs, description or contact details (a WhatsApp booking button is allowed). Il Locale retains the restaurant description and Google Maps review links and shows only Paolo's three supplied photographs, cropped solely to remove screenshot bands/UI without overlays or other alterations. cena.html unifies antipasti/primi/secondi while keeping old URLs compatible. Lunch and dinner offers remain separate. These approved graphics supersede the previous locked graphics. Preserve all original business procedures, order validation and confirmation, WhatsApp number, member page paths, balances, histories, pseudonyms and fragment-based name handling. menu-data.json is the shared menu source; menu-build-state.json stores the lunch content fingerprint, and lunch date is stamped during a content update, never at page view. The counter uses the existing endpoint and total, incrementing once per browser TAB session via sessionStorage across navigation and reloads; this current behavior supersedes older counter instructions above. Display the badge only on Novità.

## Navigation, allergen symbols and wines — 2026-10-03
- Main navigation is one vertical list in this order: Novità, Il Locale, Offerta per pranzo, Offerta per cena, Offerta del giorno, Bibite & vini, Club, Allergeni, Contatti, EN, 中文. On mobile the menu expands as one column; never use a two-column/zigzag navigation layout.
- Allergen references use ingredient-related pictograms plus the existing numbers without parentheses, both in the legend and beside dishes (including translations). The common mapping is allergen-symbols.json. Never use an anchor as an allergen pictogram. Do not change allergen assignments or introduce sulphites beside dishes as part of this visual update.
- Realistic photographs are also expressly permitted for wines: use the exact bottles from Cantine Delite's official site, with short source-grounded descriptions and preserved restaurant prices. Keep normal drinks unchanged, never show producer/source links, and never add quantity/order controls to drinks or wines.
- On the lunch page, display the lunch booking notice after the dish cards, as the final content in the menu, with the current wording and confirmation reminder. Keep its graphics consistent with the News booking cards, without booking buttons on the menu page.

## Logo, photographs and menu maintenance — 2026-10-03 afternoon
- The approved restaurant logo is `logo-controcorrente.webp`: cursive Controcorrente, sun, birds and wave, without “Cucina di mare”. Show it exactly once per page, in the top header; never repeat it in headings, menu sections or footers. Every footer uses only `footer-onde.webp` as its decorative brand element. Preserve logo proportions, clear space and all existing content and controls.
- Food-photo pages retain the bold notice: “Le immagini dei piatti, pur realistiche, sono generate con intelligenza artificiale e hanno scopo illustrativo.” This does not label original restaurant or wine photographs as AI-generated.
- Wine bottles are original producer photographs shown through the `photoViewBox` crop on white. Do not display the external lettering from the photograph, alter labels, or substitute generated bottles. Keep all bottles centered.
- Coffee espresso is listed among Bibite at €1.50 with the matching `icons/Coffee.svg`; drinks and wines have no order controls.
- Daily offers may now show realistic photos in the approved common card treatment, expressly requested by Paolo. Their prices vary: never assume every offer costs €10. The complete menu remains €25 unless explicitly changed.
- Use `VARIAZIONE_PIATTI.md` as the concise reusable instruction. Use `python3 tools/aggiorna-menu.py` with only requested sections (`pranzo`, `cena`, `offerta`, `bibite`) after editing `menu-data.json` and supplying images. The old full-restyling `tools/render-menu.py` reads historical baseline content and must not be used for routine maintenance; it can overwrite current content and branding.
- For new offers/fixed-menu dishes, keep English and Chinese wording in each dish’s `translations` object; shared price and allergen assignments remain authoritative. Offers and lunch pricing is read from the current HTML by the unchanged preorder logic; dinner pricing also requires synchronizing `preordine.js`.
- The oriental dumpling allergen assignment currently covers the explicitly known wheat dough (01), meat and savoy cabbage. Do not assume eggs, soy, sesame, sauces or frozen origin without Paolo’s recipe/product label; reassess when those details are supplied.

## General food-photo rule — 2026-10-03
- Every food dish card in the Italian lunch, dinner and daily-offer menus must have a realistic photo consistent with its actual ingredients. Reuse an approved matching photo when the same dish appears in more than one section; add a missing photo using the existing `.dish-photo-card` / `.dish-photo` placement and framing, without changing other content, styling or order mechanics. Translated text-only summaries retain their existing format.


## Regola generale miniature e descrizioni — 2026-10-03 sera
Questa richiesta prevale sulle precedenti eccezioni per le traduzioni senza foto.
- Ogni singola scheda di piatto deve avere una foto/miniatura realistica e una descrizione breve, elegante e fedele agli ingredienti: pranzo, cena, offerta del giorno e menù fisso, comprese le versioni inglese e cinese.
- A ogni sostituzione, aggiunta o eliminazione di un piatto, aggiornare insieme nome, descrizione, fotografia e traduzioni; una foto di un piatto precedente non deve rimanere associata al nuovo. Non modificare schede già complete e corrette.
- Per nuove foto cercare prima fotografie su internet coerenti con il piatto; privilegiare, dove possibile, sfondo, piatto, luce, prospettiva e impiattamento uniformi. Conservare le foto già approvate quando sono coerenti; se una foto non corrisponde al piatto o rompe la coerenza della sezione, ricostruirla o modificarla direttamente. Registrare origine e limiti del riferimento; non spacciare foto illustrative per fotografie reali del ristorante. Non usare immagini di piatti diversi per nascondere un riferimento mancante.
- Ogni foto resta un elemento autonomo della griglia, modificabile o eliminabile insieme alla propria scheda, mai incorporata in un'immagine unica del menù. Conservare in menu-data.json dishPhoto e description; photoLayout: thumbnail seleziona la miniatura compatta a fianco della descrizione.
- Usare misure coerenti e responsive: foto interamente nel proprio spazio, senza coprire descrizione, prezzo, allergeni, pulsanti, schede vicine o decorazioni. Per le miniature pranzo usare dish-thumbnails.css; per le schede già approvate conservare la loro cornice. Non alterare il resto del layout.
- Le sezioni EN/ZH clonano dinamicamente foto e schede italiane tramite foreign-menus.js. Aggiornare anche le corrispondenti descrizioni e i nomi tradotti quando cambia un piatto; verificare tutte e tre le sezioni in entrambe le lingue.
- Le foto da internet possono avere presentazioni diverse: descrizioni, ingredienti e allergeni restano quelli comunicati da Paolo, mai ricavati arbitrariamente dalla fotografia. Segnalare riferimenti non fedeli invece di cambiare la ricetta.
- Backup ZIP completo del sito una sola volta alla settimana, il lunedì notte (Europe/Rome, indicativamente ore 03:00), non prima di ogni modifica. Verificarne l'integrità e il salvataggio; conservare solo i due backup completi più recenti ed eliminare i precedenti solo dopo il buon esito del nuovo backup. Questa regola, richiesta da Paolo il 2026-10-04, sostituisce l'obbligo precedente di creare definitiva.zip a ogni intervento. Prima di pubblicare controllare desktop, telefono, immagini caricate, prezzi e ordini. Pubblicare e verificare GitHub Pages effettivamente online.


## Controlli sulla prenotazione — 2026-10-04
- I controlli di validità per data e servizio si applicano solo alla conferma nel riepilogo, dopo la scelta obbligatoria del giorno e dell’orario di arrivo, mai al pulsante `+`.
- Confrontare la data del menù pranzo con il giorno prenotato, non con il giorno di consultazione; mantenere le fasce orarie e l’esclusione di sabato, domenica e festivi per il menù pranzo.
- L’`Offerta del giorno` eredita integralmente le regole temporali e di servizio del Menù cena: è ordinabile a cena e anche a pranzo nei giorni festivi. La validazione deve essere determinata dalla data e dall’orario inseriti dal cliente nel riepilogo, non dal momento in cui viene premuto `+` né dal giorno in cui il sito viene consultato.
- Per Menù cena e Offerta del giorno, il servizio è valido a cena dalle 18:00; è valido a pranzo nella fascia 11:00–15:00 quando la data scelta è domenica o un giorno festivo applicabile, inclusi i festivi italiani e San Giovanni a Torino. Fuori da queste condizioni l’ordine deve essere bloccato nel riepilogo.
- La grafica di `offerta.html` deve riportare, con lo stesso stile usato nel Menù cena, la dicitura su due righe: `Valido solo per cena` e `… e pranzo nei festivi`.
- Il messaggio WhatsApp deve riportare la data selezionata e il servizio effettivamente prenotato. Questa regola sostituisce il precedente inserimento automatico del giorno corrente. Conservare gli altri controlli, i prezzi e l’azzeramento dell’ordine.
- Prima degli altri controlli del riepilogo, confrontare la data e l’orario scelti dal cliente con il momento corrente nel fuso `Europe/Rome`. Se la data/ora richiesta è precedente al momento corrente, bloccare l’invio e mostrare esclusivamente il messaggio `È impossibile prenotare retroattivamente.`. Questo controllo non deve azzerare il carrello né modificare le altre regole di servizio.

## Trascrizione e unificazione ordini WhatsApp pranzo — regola permanente, 2026-10-06
- Quando Paolo inoltra la mattina i messaggi WhatsApp del pranzo generati dal sito, produrre un unico messaggio riepilogativo con un blocco per tavolo, mantenendo lo stesso identico formato dei messaggi del sito: intestazione, righe dei piatti, Servizio, Totale piatti, Nome e cognome, Persone, Giorno, Orario richiesto, Allergie / note e le altre righe originali pertinenti. Non inventare un nuovo formato.
- Ordinare i blocchi cronologicamente per giorno prenotato e orario richiesto di arrivo, non per momento di ricezione dei messaggi. A parità di data e orario conservare l'ordine della prima ricezione.
- Distinguere prima nome e cognome. Riconoscere la stessa persona sia nella forma nome-cognome sia nella forma cognome-nome (per esempio Mario Rossi / Rossi Mario), rispettando nomi e cognomi composti. Non basarsi sul solo nome o sul solo cognome e non attribuire arbitrariamente le parti quando l'identità è ambigua: chiedere il solo chiarimento necessario e mantenere nel frattempo i blocchi separati.
- Unificare soltanto gli ordini della stessa identità completa con la stessa data prenotata e lo stesso orario richiesto. Tavoli con persone diverse, date diverse o orari diversi restano separati.
- Aggiunte ricevute successivamente per quel tavolo confluiscono nel suo blocco già esistente: aggiornare il riepilogo unico completo, senza creare un secondo ordine separato. Sommare le quantità dello stesso piatto quando si tratta di aggiunte effettive; distinguere aggiunte, rettifiche e semplice reinvio dello stesso ordine, evitando duplicazioni. Se non è chiaro, chiedere conferma prima di sommare o sostituire.
- Conservare allergie, note e variazioni associate ai piatti/clienti senza perderle. Non sommare automaticamente il numero di persone riportato nei messaggi dello stesso tavolo: usare le rettifiche esplicite e segnalare valori discordanti. Ricalcolare il totale soltanto con quantità e prezzi noti dai messaggi, senza inventare prezzi, dati o conferme.
- Questa è una procedura dell'assistente per i messaggi che Paolo fornisce, non un invio automatico ai clienti né una modifica alla composizione WhatsApp o al funzionamento del sito. Non leggere WhatsApp autonomamente.
- Ambito: raccolta mattutina degli ordini pranzo prima delle 12:00, fuso Europe/Rome. Paolo gestisce il termine: non introdurre per questa trascrizione un nuovo blocco automatico alle 12 né rifiutare di riordinare messaggi già forniti.

### Quadratura obbligatoria dei totali WhatsApp pranzo — 2026-10-06
- Il totale degli ordini deve combaciare: per ogni tavolo verificare che quantità × prezzi dei piatti corrispondano al totale del blocco unificato; il totale generale deve essere uguale alla somma dei totali dei tavoli e dei messaggi effettivamente conteggiati.
- Aggiunte effettive aumentano il totale; semplici reinvii non lo aumentano. Rettifiche o sostituzioni esplicite aggiornano le voci interessate senza sommare anche le voci sostituite.
- Usare soltanto quantità, prezzi e importi disponibili e verificati. Se un totale non coincide, segnalare precisamente la differenza e il dato dubbio; non forzare la quadratura, alterare importi o inventare dati. Chiedere il solo chiarimento necessario prima di presentare il riepilogo come verificato.

### Formato sintetico del riepilogo ordini pranzo — 2026-10-06
- Paolo richiede permanentemente un riepilogo sintetico: nome, orario, piatti con quantità. Questa istruzione sostituisce l'obbligo precedente di riprodurre integralmente il formato WhatsApp originale.
- Un blocco compatto per tavolo, in ordine di data e orario prenotati, con aggiunte e rettifiche unificate secondo le regole già stabilite. Se tutte le prenotazioni sono dello stesso giorno, non ripetere la data per ogni tavolo.
- Omettere saluti, formula di conferma, campi vuoti, numero di persone e altri dati non richiesti. Conservare accanto al piatto le variazioni rilevanti e le allergie/note operative indispensabili.
- Verificare sempre la quadratura degli importi; riportare il totale generale una sola volta in fondo, senza appesantire ciascun tavolo con prezzi e totali salvo richiesta esplicita.

### Formato definitivo del riepilogo pranzo — 2026-10-06
- Ordine obbligatorio dei dati: nome, numero di persone, orario richiesto, piatti con quantità. Paolo ha richiesto di includere nuovamente il numero di persone: questa regola prevale sulla precedente omissione.
- Presentare ogni tavolo in modo sintetico: Nome — N persone — HH:MM, poi i piatti con quantità. Se nome o numero di persone non sono indicati, segnalarli come non indicati senza dedurli dal numero di piatti.
- Conservare ordine cronologico, unificazione di aggiunte/rettifiche, note operative e allergie indispensabili e controllo della quadratura. Riportare il totale generale una sola volta in fondo.


## Riepilogo privato prenotazioni e disposizione sala — regola master permanente, 2026-10-06
- Procedura riservata all'utilità operativa di Paolo: quando fornisce messaggi precompilati del sito e messaggi extra su prenotazioni, persone, tavoli, ordinazioni, aggiunte, cancellazioni o cambiamenti, consolidare l'intera situazione in un unico riepilogo sintetico, logico e cronologico. Vale per pranzo e cena, senza limitazione alla raccolta mattutina.
- Formato definitivo: Nome — N persone — HH:MM, seguito dai piatti con quantità. Un blocco per tavolo/prenotazione, ordinato per giorno e ora di arrivo; mantenere allergie e variazioni operative indispensabili. Se il giorno è comune, indicarlo una sola volta.
- Integrare messaggi extra e rettifiche esplicite nel tavolo corretto, anche quando correggono persone, giorno o orario; una variazione esplicita aggiorna la prenotazione originaria senza creare un duplicato. Collegare identità/tavoli soltanto con evidenza sufficiente e rispettare le regole precedenti su omonimi, nomi invertiti, aggiunte effettive e semplici reinvii. Non sommare automaticamente coperti ripetuti né attribuire ordini anonimi.
- Dotazione comunicata da Paolo: tre tavoli piccoli, ciascuno da 2 persone oppure fino a 3; tre tavoli grandi, ciascuno da massimo 4; un cliente fisso singolo che viene ogni giorno. Tenerne conto nella pianificazione senza inventarne nome, orario o ordine e senza conteggiarlo due volte se è già incluso nelle prenotazioni.
- Quando Paolo comunica la situazione completa, proporre prima una disposizione efficiente della sala: quali tavoli assegnare e quali unire per ogni gruppo, riducendo posti inutilizzati e spostamenti, mantenendo separati i gruppi indipendenti e il posto del cliente fisso. Usare etichette convenzionali P1–P3 per i piccoli e G1–G3 per i grandi, senza fingere che identifichino posizioni reali già note.
- Le capienze dei tavoli singoli sono limiti, non una garanzia della capienza ottenibile unendoli: considerare eventuali posti persi nelle giunzioni e la reale compatibilità/adiacenza quando Paolo la comunica. Non inventare geometria della sala, passaggi, sedute aggiuntive o tavoli ulteriori.
- Durata indicativa comunicata da Paolo: circa 40 minuti per mangiare. Usarla come stima per la pianificazione e proporre doppi turni sugli stessi tavoli quando gli arrivi sono sufficientemente distanziati. Calcolare la fine stimata come arrivo + 40 minuti e considerare anche il tempo effettivamente necessario a liberare e riapparecchiare, che non è ancora quantificato: non inventarlo. La stima non garantisce l'uscita esatta; distinguere piano previsto e tavolo effettivamente libero. Con intervalli inferiori a 40 minuti, segnalare la sovrapposizione prevista senza assumere partenze anticipate. Non modificare autonomamente orari prenotati o imporre ai clienti una durata limite.
- Se i gruppi non possono essere accolti insieme con la dotazione disponibile, segnalarlo chiaramente e specificare la condizione necessaria (tavoli liberati o cambiamento esplicitamente concordato), senza dichiarare fattibile una sistemazione non verificata.
- Dopo la proposta di disposizione inviare il riepilogo sintetico degli ordini consolidati. Controllare quantità e importi con i soli dati disponibili; persone e numero di piatti possono differire: segnalare dati mancanti senza inventare il piatto mancante o modificare i coperti.
- Questa regola è una procedura dell'assistente per Paolo, da conservare nelle istruzioni master; non è una funzione pubblica per i clienti e non autorizza pagine pubbliche con prenotazioni, lettura autonoma di WhatsApp, messaggi a clienti o modifiche al carrello/formato WhatsApp del sito. Non inserire nomi, ordini o prenotazioni reali degli esempi nel repository pubblico.

### Identificazione cliente fisso — 2026-10-06
- Il cliente fisso singolo è Paolo, soprannominato «Puzza», come identificato direttamente da Paolo Moretti. Nei riepiloghi operativi privati riconoscerlo con questa identità e riservargli un posto; non conteggiarlo nuovamente quando è già incluso negli ordini. Il cognome, gli orari e l'ordine non sono stabiliti da questa identificazione: non assumere che sia Paolo Ferreri senza un collegamento esplicito.

## Coerenza obbligatoria delle fotografie dei piatti — 2026-10-06
- Le foto devono essere coerenti sia tra loro nella resa grafica (sfondo, piatto, inquadratura, luce, colori, scala e formato), sia con il piatto e gli ingredienti effettivamente comunicati da Paolo. Conservare lo stile fotografico già approvato. Applicare la regola a pranzo, cena, offerte e miniature EN/ZH.
- Controllare la coerenza dell'intero insieme di fotografie in ciascuna sezione, soprattutto pranzo e cena. Se una foto è incoerente per sfondo, piatto, inquadratura, luce, colori, scala, formato o ingredienti, ricostruirla o modificarla direttamente fino a renderla coerente, preservando per quanto possibile le foto approvate e senza cambiare layout. Quando cambia un ingrediente aggiornare anche la fotografia. Se non è possibile ottenere una foto fedele, dichiarare il limite senza inventare ingredienti né presentare una foto diversa come corrispondente.


## Divertentismo — regola permanente, 2026-10-06
- «Divertentismo» è l’ultima sezione del menu principale, dopo Contatti e prima delle lingue; accanto al nome mostrare un sorriso molto piccolo e discreto. Conservare questa voce anche nelle pagine rigenerate.
- Pagina: divertentismo.html; stile aggiuntivo circoscritto: divertentismo.css. Usare font, palette, logo unico, testata, sfondo nautico, impaginazione, spaziature, navigazione e onde finali del sito corrente. Vignette coerenti tra loro e con questa identità, leggibili anche sul telefono. Non ridisegnare altre pagine.
- Ogni giorno alle 08:00 Europe/Rome, a partire dal 2026-10-07, creare una nuova piccola vignetta originale con battuta, freddura o barzelletta su ristorazione, ingegneri oppure bancari. Alternare liberamente gli argomenti; evitare ripetizioni consultando la cronologia Git del file.
- Umorismo leggero, non volgare, non pesante, non offensivo; nessun attacco personale o riferimento a clienti reali. Testi brevi in italiano, corretti e leggibili, con illustrazione e dialoghi: non soltanto una battuta isolata.
- Paolo autorizza espressamente creazione, sostituzione quotidiana della vignetta, aggiornamento della data e pubblicazione diretta senza ulteriori conferme. Mostrare le tre vignette più recenti una sotto l’altra, con la più nuova in alto. Dopo l’aggiunta della quarta eliminare dalla pagina la più vecchia per data/ora di pubblicazione, conservando integralmente le altre; precedenti recuperabili dalla cronologia Git.
- Aggiornare solo vignetta e data; mantenere layout, font, grafica, altre pagine, menù, ordini, club e dati dei clienti. Pubblicare su GitHub Pages dal repository piol77/controcorrente e verificare il deployment. In caso di esecuzione ripetuta nello stesso giorno, non duplicare l’edizione quotidiana già pubblicata. Le vignette extra richieste espressamente da Paolo sono eccezioni e non sostituiscono quella quotidiana delle 08:00. Ogni articolo deve avere un titolo/ID univoco, data locale e attributi data-published-at (timestamp ISO con offset Europe/Rome) e data-comic-edition (daily oppure exceptional); usare la data/ora di pubblicazione per ordinamento e rotazione, non il tema o la posizione corrente.
- Per aggiornamenti programmati usare il connettore GitHub: leggere file attuale e istruzioni master, scrivere col suo SHA corrente, verificare commit e workflow Pages. Non conservare credenziali nel repository. Segnalare errori reali senza dichiarare pubblicazioni non avvenute.

### Stile Divertentismo approvato da Paolo — 2026-10-06
- Paolo ha approvato espressamente lo stile della prima vignetta «Precisione al dente». Mantenerlo come riferimento fisso per tutte le prossime: due riquadri affiancati su desktop e impilati sul telefono, illustrazioni vettoriali semplici a tratto sottile dorato sul blu nautico, personaggi stilizzati, dialoghi brevi sopra la scena, titoli e battute con il serif condiviso. Conservare proporzioni, cornici, spaziature e piccolo sorriso discreto; cambiare soltanto scena, personaggi, battuta, titolo e data secondo il tema.
- Procedura confermata: leggere istruzioni e vignetta corrente, evitare ripetizioni, creare la nuova vignetta leggera e non offensiva, controllare testi e leggibilità, aggiornare il file col suo SHA attuale, pubblicare direttamente e verificare GitHub Pages. Automazione quotidiana aggiornata alle 08:00 Europe/Rome: modificare quella esistente, senza crearne un duplicato. Ogni vignetta mantiene i due riquadri approvati; gli articoli delle ultime tre vignette sono impilati verticalmente su tutti i dispositivi.


## Orari di ingresso prenotabili — 2026-10-06
- Alla conferma del riepilogo, dopo il controllo retroattivo e prima dei controlli su data e servizio del menù, bloccare qualsiasi ingresso fuori dalle fasce inclusive 12:00–14:30 e 19:00–22:30. Lunedì chiuso tutto il giorno, anche se festivo. Le nuove fasce prevalgono sulle precedenti 11:00–15:00 e cena dalle 18:00.
- Usare giorno e orario scelti dal cliente; nessun blocco al pulsante `+`. Per chiusura del lunedì o orario fuori fascia, mostrare il motivo e conservare carrello e dati per consentire la correzione. Non aprire WhatsApp.
- Conservare gli altri vincoli: menù pranzo nel giorno indicato, esclusi sabato, domenica e festivi; cena e offerte a cena oppure a pranzo nei festivi, sempre entro gli orari di apertura e mai il lunedì.


## Promozione prenotazione entro le 18:00 — regola permanente, 2026-10-08
- La promozione del coperto omaggio per prenotazione di tavolo e menù entro le ore 18:00 vale **esclusivamente per la cena**, non per il pranzo, neppure nei giorni festivi.
- In ogni pagina pubblica che la menziona, mantenere identica questa frase, senza parafrasi: **«Prenotando tavolo e menù di cena, entro le 18, il coperto di 1,50 € è omaggio.»**
- Porre in rilievo in grassetto solo le parole **«tavolo e menù»** nella frase. Preservare lo stesso testo e la stessa enfasi grafica nelle pagine News, Contatti, Menù cena e Riepilogo ordine, incluso il testo dinamico generato da `preordine.js`. Nelle Novità, porre il riquadro pranzo sopra quello cena, con gli stessi pulsanti e con l’avviso di conferma sotto ciascuno; i due menù mostrano il rispettivo riquadro per ultimo, senza pulsanti. Aggiornare tutti i punti insieme durante ogni futura variazione della promozione. Non confondere l'orario massimo per aderire alla promozione (18:00) con la fascia di ingresso per cena (19:00–22:30), né con l'orario di conferma entro le 18:30.

### Carbonara — allergene latte/formaggio, 2026-10-09
- Ogni carbonara, sia di mare sia classica, deve riportare anche l’allergene 07 con il consueto simbolo del latte/formaggio.


## Messaggio ordine WhatsApp — regola permanente, 2026-10-11
- Nel messaggio WhatsApp destinato a Paolo, evidenziare in grassetto con la sintassi WhatsApp `*testo*` l'intera riga di ogni piatto (quantità, nome e prezzo), nome e cognome, numero di persone, orario richiesto e allergie/note (se presenti). Le altre righe mantengono il formato attuale.
- Ordinare le righe per tipologia: antipasti, primi, secondi, quindi menù completi/alla coppia e altre proposte composte. Non dipendere dall'ordine dei clic; all'interno della stessa tipologia conservare la sequenza originale.
- La regola riguarda la composizione del messaggio WhatsApp, non il layout dei menù o del riepilogo. Applicarla anche ai piatti pranzo e alle offerte; usare la sezione del catalogo e, per le schede giornaliere, l'eventuale `data-order-course` (Antipasto, Primo o Secondo) o l'intestazione della portata, con riconoscimento del nome come ripiego. Per nuovi nomi ambigui specificare la portata nella scheda.
- Nel solo testo WhatsApp rappresentare gli asterischi letterali nei nomi dei piatti e nelle note con il segno tipografico `＊`, così rimangono visibili e non interrompono il grassetto. Conservare gli asterischi originali nei menù e nei dati.
- Preservare quantità, prezzi, totale, data, orario, note, controlli di validità, apertura WhatsApp e azzeramento del carrello. Aggiornare il riferimento cache di `preordine.js` in `ordine.html`, verificare con selezioni in ordine inverso/misto e pubblicare su GitHub Pages.

## Avviso richieste tardive e prenotazioni future — 2026-10-14
- L’avviso aggiuntivo per richieste inviate dopo le 12:00 (menù pranzo) o le 18:00 (menù cena/offerte) si applica esclusivamente quando il giorno prenotato coincide con il giorno corrente in Europe/Rome. Non mostrarlo per domani o date successive valide.
- Nel testo distinguere l’orario di invio per oggi dalla data prenotata; non descrivere una prenotazione futura come successiva a una data valida per prenotare.
- Conservare i controlli su passato, lunedì, fasce di ingresso, validità del menù pranzo e servizio/festivi, oltre alla normale conferma del Ristorante e al flusso WhatsApp.


## Meteo dinamico e registro riservato delle presenze — regola permanente, 2026-10-20

### Meteo dinamico — scheda pubblica nelle Novità
- Mantenere nella sezione Novità una scheda meteo piccola, discreta, leggibile da mobile e coerente con font, palette e stile nautico del sito; nessuna riprogettazione delle altre sezioni.
- Riferimento geografico: Torino, zona San Paolo / Controcorrente (via San Paolo 16). Visualizzare solo due previsioni del giorno: pranzo 12:00–14:30 e cena 19:00–22:30, senza bollettini per altre fasce.
- Dati previsti: condizioni meteorologiche e relativo simbolo, intervallo della temperatura e precipitazioni attese; indicare quando la previsione è stata aggiornata.
- Usare i dati del fornitore meteo effettivamente integrato nel sito (attualmente MET Norway, non attribuirli a Google). La logica di lettura e riepilogo è in scripts/update-weather.py, la scheda legge weather.json tramite weather.js.
- Controllare le previsioni meteo automaticamente due volte al giorno (08:35 e 17:35, Europe/Rome), insieme alle notizie, tramite il workflow GitHub Actions `.github/workflows/aggiorna-novita.yml`, indipendente dalle vecchie automazioni ChatGPT. A ogni controllo acquisire le previsioni aggiornate e pubblicare weather.json se cambiano; tutte le visite al sito riutilizzano il file locale senza nuove richieste al provider. Controllare che la programmazione delle due esecuzioni quotidiane esista e funzioni: la presenza del solo script non equivale a controlli automatici.
- Se il fornitore non risponde, i dati sono incompleti o la previsione del giorno non è aggiornata, mostrare «Previsione non disponibile» o un'avvertenza di aggiornamento senza inventare condizioni o riutilizzare dati vecchi come se fossero attuali.
- Non modificare prenotazioni, menù, WhatsApp, contatori, club e altre funzionalità per aggiornare il meteo.

### Registro privato presenze effettive a pranzo — solo numeri
- A partire dal 20 ottobre 2026 mantenere uno storico giornaliero dei **coperti effettivamente presenti** a pranzo, separato da visite al sito e richieste WhatsApp: questi ultimi non rappresentano presenze confermate.
- Per ogni giornata registrare esclusivamente data, numero di presenze ordinarie, numero di presenze «a parte» e totale (somma esatta dei due valori). Non raccogliere né conservare nomi dei partecipanti, nominativi, recapiti, tavoli, ordini, note nominative o altri identificativi personali in questo registro.
- Salvare lo storico unicamente in un archivio con accesso privato del proprietario, attualmente il foglio Google «Controcorrente — Registro privato presenze», scheda «Pranzi»; non mettere i numeri giornalieri, dati dell'archivio, indirizzi del foglio, chiavi, credenziali o collegamenti di accesso nel repository pubblico, in pagine web, HTML, JavaScript, JSON pubblico o GitHub Pages. Una pagina web soltanto nascosta dal menu non è privata.
- La statistica privata deve consentire il grafico giornaliero dei coperti e il calcolo dei totali e delle medie, distinguendo le presenze ordinarie da quelle «a parte» ed evitando conteggi doppi.
- Quando Paolo comunica un numero a fine servizio, inserire/aggiornare la riga corrispondente alla stessa data senza duplicarla. Una correzione esplicita sostituisce il numero precedente; non stimare mai i presenti dalle richieste di prenotazione, dagli accessi, dai piatti ordinati o dalle altre statistiche del sito.
- Se Paolo non ha ancora fornito il conteggio finale, chiederglielo a fine turno pranzo (indicativamente dopo le 14:30, nel fuso Europe/Rome) e, solo quando risponde, aggiornare il dato. Non inviare domande ai clienti né pubblicare i risultati. Non considerare lo zero equivalente a un dato mancante.
- Questa è una funzione gestionale riservata a Paolo. Preservare l'attuale struttura pubblica del sito; non aggiungere sezioni o pulsanti visibili ai visitatori.

## Etichette offerte e data puramente informativa — 2026-10-20
- Le voci pubbliche di navigazione e le intestazioni delle relative pagine sono **«Offerta per pranzo»** (pranzo.html) e **«Offerta per cena»** (cena.html). **«Offerta del giorno»** (offerta.html) rimane invariata. Non rinominare file, URL o sezioni del catalogo.
- Nelle pagine di cena e Offerta del giorno mostrare in grafica coerente la **data corrente dinamica in Europe/Rome**, come informazione, senza renderla vincolo della prenotazione né modificare regole, calendario, carrello o procedura d'ordine. La cena NON mostra più «Valido nella settimana in corso»: si visualizza soltanto la data odierna dinamica, senza cambiamento dei vincoli di prenotazione.
- Il pranzo conserva la sua data della proposta e gli attuali controlli sulla prenotazione legati a quella data: NON sostituirla con la data corrente generica. Le modifiche delle sole etichette non alterano preordine.js né i controlli in riepilogo.

## Tasto notifiche condiviso — 2026-10-21
- Conservare un unico pulsante piccolo e discreto «Notifiche» in tutte le sezioni, accanto alla radio, con colori del sito. `ui.js` carica `notifications.js`; mantenere il caricamento e i riferimenti cache durante le rigenerazioni.
- Il consenso è richiesto soltanto dopo un clic esplicito, con gestione di rifiuto, richiesta chiusa, browser non compatibile ed errori. Nella navigazione persistente della radio il documento esterno possiede il controllo del permesso.
- Su iPhone/iPad mostrare le istruzioni per aggiungere alla schermata Home e riaprire come app web; mantenere `manifest.webmanifest` e le icone ricavate dal logo approvato. Nessuna app negli store.
- Invio remoto: `notifications.js` registra gli endpoint Push nel servizio `https://controcorrente-notifiche.superlion129.chatgpt.site`, progetto Sites `appgprj_6ad8caae661c8191a65613c20478f911`; `notifications-sw.js` riceve gli avvisi anche a sito chiuso. Conservare iscrizioni e secret VAPID esclusivamente nel servizio, mai in GitHub o nei file pubblici. «Notifiche ✓» indica consenso accordato e iscrizione remota completata. I browser che avevano dato soltanto il permesso locale devono eseguire almeno una volta il codice aggiornato: l’iscrizione viene tentata automaticamente alla successiva visita, senza un nuovo consenso se già accordato. Non dichiararli destinatari registrati prima che il servizio confermi l’iscrizione.
- Lasciare invariati ordini, WhatsApp, musica, contatori, menù e Club. Premendo una seconda volta «Notifiche ✓» si disattivano le push; «Notifiche OFF» le riattiva soltanto dopo scelta esplicita. Nessun clic genera messaggi di prova.


## Notifiche push — regola unica e permanente, 2026-10-25 (prevale sulle precedenti)
- Solo **una notifica al giorno** per ogni browser iscritto e consenziente, con saluto cortese di Controcorrente e invito a consultare le proposte pubblicate sul sito. Non spedire altre notifiche, nemmeno se cambiano i menù di pranzo, cena o offerta del giorno, o per meteo, notizie, vignette, aggiornamenti tecnici, visite, prove o messaggi straordinari. Eventuali nuove eccezioni richiedono una richiesta esplicita di modifica di questa regola.
- Unico workflow autorizzato: `.github/workflows/notifiche-straordinarie.yml`, riutilizzato e trasformato nel solo **Saluto quotidiano Controcorrente**. Trigger esclusivamente `schedule`, cron `0 9 * * *` (09:00 UTC = 10:00 in inverno / 11:00 in estate Europe/Rome). GitHub Actions può ritardare il trigger; verificare gli esiti reali, non promettere un minuto preciso.
- L'invio giornaliero usa `POST /admin/notify` del servizio Sites con OIDC GitHub (stesso percorso autorizzato nel backend), senza pubblicare credenziali. Messaggio breve, cordiale, con collegamento al sito; buon lunedì con nota della chiusura, buongiorno da martedì a venerdì, augurio per sabato e domenica ricordando la prenotazione nel weekend. Non affermare che un menù sia aggiornato se non è stato verificato.
- `requestId` deterministico `cc-saluto-YYYYMMDD` nella data Europe/Rome; il servizio deve garantire idempotenza durevole per questo identificatore. Non recuperare giorni passati né reinviare per errori parziali. Registrare sempre `subscribers`, `accepted`, `failed`, `expired`, `duplicate` quando presenti; l'accettazione dal provider non prova la ricezione visibile del telefono.
- Il vecchio workflow `.github/workflows/notifiche-menu.yml` è eliminato: non deve essere ricreato. Non richiamare `/sync` per invii ai cambi dei menù. Nessun altro workflow deve inviare Push; il vecchio file `.github/notifiche/invio.json` conserva esclusivamente lo storico, non è più un trigger. Anche `workflow_dispatch` è rimosso dal workflow del saluto.
- Lato browser `notifications-sw.js` sopprime le notifiche successive alla prima dello stesso giorno civile Europe/Rome; il pulsante `Notifiche ✓` alla pressione successiva disiscrive dalle push e memorizza il rifiuto, `Notifiche OFF` consente una successiva adesione volontaria. Non reiscrivere chi ha disattivato visitando nuovamente il sito. La rimozione dal registro server via `/unsubscribe` è un tentativo best-effort; la disiscrizione `PushSubscription.unsubscribe()` impedisce comunque il recapito su quel browser.
- Questa regola sostituisce e annulla tutte le istruzioni precedenti relative a notifiche per cambi menù e avvisi straordinari. Lasciare invariati grafica, menù, ordini, Club, meteo, notizie, musica e le rispettive automazioni di aggiornamento dei dati: **aggiornare i contenuti non significa inviare una notifica**.
- L'augurio di buona domenica del 25/10/2026 è stato già spedito una volta (5 invii accettati, 0 falliti); non reinviarlo lo stesso giorno. Il programma quotidiano inizia con la prima esecuzione programmata successiva alla pubblicazione, senza invio di prova ai clienti.


## Programmazione ufficiale notizie e meteo — 2026-11-02
- Fonte unica degli aggiornamenti programmati: GitHub Actions, file `.github/workflows/aggiorna-novita.yml`, ramo `main`. Due esecuzioni al giorno, 08:35 e 17:35 `Europe/Rome`, con ora legale/solare gestita dal timezone del cron. La vecchia automazione ChatGPT «Notizie e meteo Controcorrente» è disattivata per evitare doppioni.
- A ogni esecuzione avviare `scripts/update-news.py` e `scripts/update-weather.py` indipendentemente, riprovando una volta in caso di errore. Non inventare nuovi dati né modificare `fetched_at` in assenza di un'acquisizione valida. Pubblicare esclusivamente `news.json` e `weather.json` quando cambiati, con commit su `main`.
- I commit con `GITHUB_TOKEN` non avviano automaticamente la pubblicazione Pages da ramo: il workflow deve richiedere esplicitamente un build Pages tramite API e segnalare un errore se la richiesta fallisce. Controllare l'esito delle esecuzioni nel pannello GitHub Actions. Nessuna notifica push ai clienti per queste operazioni.
- Se manca l'aggiornamento delle notizie, mostrare i titoli verificati già archiviati con la dicitura «Aggiornamento in ritardo» e data effettiva; non presentarli come nuovi. Per il meteo non spacciare previsioni scadute per attuali.

## Notizie Italia e mondo — 2026-10-22
- Nelle Novità, sopra il meteo, mantenere una fascia larga e bassa (82 px per i titoli su desktop, 108 px su mobile), con cinque titoli e immagine di sfondo oscurata per la leggibilità, in stile nautico. Un titolo alla volta, scorrimento da sinistra a destra ogni 8,5 secondi; pausa, tastiera e preferenza movimento ridotto.
- Dati dal feed RSS pubblico ufficiale RaiNews, gratuiti e senza chiave; mostrare soltanto titoli, fonte e collegamento all’articolo originale. Non ripubblicare articoli completi. scripts/update-news.py seleziona tre notizie nazionali e due internazionali dalle categorie di attualità, mantenendo l’ordine del feed all’interno di ciascun gruppo, senza rubriche, sport o duplicati di URL. Aggiornamento automatico due volte al giorno (08:35 e 17:35 Europe/Rome) tramite il workflow GitHub Actions `.github/workflows/aggiorna-novita.yml`, che aggiorna news.json e weather.json, richiede esplicitamente il rebuild di GitHub Pages e verifica gli errori di acquisizione.
- Non inventare notizie o immagini: utilizzare la miniatura fornita nel feed; in sua assenza usare lo sfondo nautico esistente. Se la fonte fallisce preservare l’ultima edizione con data reale e mostrarne i titoli con «Aggiornamento in ritardo» e l'ora originale, anche dopo 24 ore. Mostrare indisponibilità solo quando manca un file notizie valido. Non falsificare le date. Nessuna notifica push per le notizie o il meteo.
- La scheda sulle notifiche precede immediatamente Accessi al sito: testo breve e simpatico, indicazione del pulsante Notifiche vicino alla musica, consenso e istruzioni sintetiche per permessi/iPhone. Non cambiare il meccanismo di iscrizione.
- Meteo: il workflow GitHub Actions condiviso con le notizie acquisisce entrambe le fonti due volte al giorno, alle 08:35 e 17:35 Europe/Rome (anche con l'ora legale). scripts/update-weather.py acquisisce i dati per ciascuna esecuzione e conserva i riepiloghi del servizio in corso o trascorso della stessa giornata soltanto se realmente acquisiti prima, con forecast_at originale e indicazione dell’ora. Se la fonte fallisce, conserva weather.json precedente senza spacciarlo per una nuova previsione.


## Contatore condivisioni unico per browser — 2026-10-24
- Il pulsante compatto «Condividi» resta disponibile in tutte le pagine e apre la condivisione nativa della pagina corrente; in mancanza di questa copia il link tracciabile.
- Nelle Novità, sotto gli accessi e i browser autorizzati alle notifiche, mostrare due totali anonimi: browser che hanno usato Condividi e browser arrivati mediante link condivisi.
- Conteggiare al massimo una volta per browser per ciascun totale usando un segnalibro booleano in localStorage, persistente tra sessioni; usare sessionStorage come ripiego. Se non è disponibile nessuno dei due, non incrementare il totale per evitare duplicati.
- Il primo conteggio del pulsante avviene solo dopo il completamento della condivisione nativa o della copia automatica riuscita; annullamenti, clic successivi e fallimenti della copia non aumentano il valore. WhatsApp non conferma l'effettivo recapito: non dichiarare messaggi inviati.
- Contare un ingresso tramite parametro cc_share una sola volta per browser, non ogni visita, ricaricamento o scheda. Non registrare identità, contatti, destinatari, dati di WhatsApp o impronte digitali.
- Le vecchie statistiche di clic e visite (v1) rimangono storiche ma non deduplicabili: mostrare i nuovi contatori v2, partendo da zero, senza sommare i v1. Non modificare il contatore generale degli accessi.
- Dal 25 ottobre 2026 nella pagina Novità mostrare due pulsanti «Condividi»: quello storico nel riquadro Accessi e un secondo nell'intestazione, nella stessa posizione delle altre pagine accanto a Notifiche/musica. Il medesimo comportamento vale per entrambi; condividono esattamente lo stesso flag v2 e gli stessi contatori anonimi, senza duplicazioni. Sulle altre pagine il pulsante nell'intestazione deve apparire anche se lo script delle notifiche carica in ritardo.


## Meteo oggi/domani — 2026-10-25
- All’apertura della pagina la scheda mostra sempre il giorno corrente. Una sola freccia accanto alla data passa con un breve slide a domani, poi diventa una freccia indietro che torna a oggi: non mostrare giorni ulteriori e non salvare il giorno scelto tra aperture.
- Conservare dimensioni e stile della scheda, le sole fasce pranzo/cena, i pulsanti GPS/Controcorrente, aggiornamenti e avvisi esistenti. La scelta della posizione resta valida passando tra oggi e domani; rispettare la preferenza di movimento ridotto.
- Conservare internamente tre date nei dati pianificati per rendere disponibile domani anche tra mezzanotte e l’aggiornamento del mattino; la navigazione pubblica resta limitata a oggi e domani. Gestire il cambio di data e l’ora legale con giorni di calendario, mai aggiungendo semplicemente 24 ore.


## Radio: azione ON/OFF e scelta di sessione — 2026-10-25
- Nuova sessione: musica spenta e pulsante ON, senza partenza al primo clic generico. Soltanto una scelta esplicita abilita la radio; conservarla almeno per la sessione di browser e durante tutta la navigazione con il lettore condiviso esistente.
- Il testo è l’azione: ON per accendere, OFF per spegnere (anche per annullare un avvio in corso). I cerchi concentrici animati indicano esclusivamente riproduzione effettiva; interromperli in pausa, caricamento, errore o fine stream e rispettare il movimento ridotto.
- Dal **5 novembre 2026**, radio ufficiale del sito: **60 North Radio (Shetland, Regno Unito)**. Stream HTTPS MP3 **320 kbps** `https://cdn1.zetcast.net/stream` (confermato sul sito dell'emittente e nei metadati del server). Il ticker sotto il pulsante legge **titolo e artista reali** da `https://cdn1.zetcast.net/status-json.xsl`, con CORS `*` verificata e selezione della sorgente `icestats.source[].mount === '/stream'`; se il servizio non risponde, mostra solo l'identità della stazione, senza inventare titoli. È un'emittente eclettica con musica di generi e generazioni diversi, non necessariamente Top 40. Mantieni ON/OFF, volume 100% salvo il 10% durante l'annuncio, sessione/navigazione persistente, grafica e ticker invariati nella forma. Il jingle ordinario ogni 2 minuti deve dire «Questa è la radio preferita dal Controcorrente. Qui il ritmo è sempre quello giusto.» con voce maschile più cupa quando disponibile. L'annuncio è creato nel **player del sito**, NON nel flusso originario 60 North. Non cambiare nuovamente emittente senza richiesta. Per diffusione in locale verificare separatamente diritti e licenze SIAE/SCF e condizioni della fonte (una licenza di 60 North non autorizza automaticamente il locale in Italia).

- Simbolo della radio (correzione esplicita 25/10): nota normale con ON quando la musica è spenta; nota sbarrata con OFF quando è accesa o in avvio. I due cerchi concentrici sono più visibili, con tratto luminoso di 2 px e vibrazione continua; movimento soltanto durante la riproduzione effettiva.


## Descrizioni dei piatti — regola permanente, 2026-10-28
- Le descrizioni non devono ripetere semplicemente il nome o l’elenco degli ingredienti. Scrivere una breve frase curata, piacevole e descrittiva, coerente con il piatto: valorizzare sapori, consistenze e abbinamenti effettivamente presenti.
- Anche quando non emerge un dettaglio particolare, preferire una frase naturale e pertinente alla ripetizione degli ingredienti; evitare formule vuote o enfatiche. Non inventare ingredienti, tecniche, provenienze o caratteristiche non fornite o ricavabili con certezza dal piatto.
- Applicare la stessa cura alle traduzioni EN/ZH. In un intervento limitato a un piatto, applicare la regola alla sua descrizione senza riscrivere gli altri piatti non richiesti.

## Master permanente — fedeltà e uniformità delle miniature dei piatti, 2026-10-28
Questa regola integra e rende vincolanti le indicazioni fotografiche precedenti. Vale per il menù **pranzo**, il menù **cena** e, quando pertinenti, le relative offerte e versioni tradotte.

- **Sfondo identico/coerente:** tutte le miniature fotografiche dei piatti devono condividere il medesimo ambiente/sfondo fotografico approvato, la stessa resa grafica e lo stesso stile d'insieme: illuminazione, piano d'appoggio, stoviglie, prospettiva, bilanciamento cromatico, inquadratura, formato e scala uniforme. Non basta che le singole foto siano gradevoli: devono sembrare parte della stessa serie fotografica e rispettare il design nautico esistente.
- **Corrispondenza effettiva con il piatto:** ogni foto deve rappresentare il piatto specificamente indicato, con ingredienti visibili, preparazione e presentazione compatibili con la sua descrizione. Non usare immagini di ricette simili ma diverse, né introdurre ingredienti o guarnizioni ingannevoli.
- **Ricostruzione anziché compromesso:** usare una fotografia trovata online solo se corrisponde davvero al piatto e rispetta lo sfondo/stile master; altrimenti ricostruire o adattare la miniatura in modo realistico e fedele, uniformandola al riferimento visivo approvato. Non cambiare la ricetta per adattarla alla foto.
- **Qualità:** preferire immagini nitide, ben definite, in HD o risoluzione superiore laddove possibile, senza sgranature, sfocature o artefatti; ottimizzare il formato per il caricamento senza sacrificare l'aspetto delle miniature.
- **Coerenza e stabilità assolute:** mantenere identici dimensione apparente, taglio, cornice, disposizione, proporzioni e comportamento responsive già approvati. Non ridisegnare layout, sfondi di pagina, colori, font, pulsanti o struttura per far posto a un'immagine.
- **Interventi esclusivamente richiesti:** durante ogni aggiornamento modificare **solo** i piatti, le foto e i campi espressamente richiesti da Paolo e i loro collegamenti strettamente indispensabili (per esempio catalogo/prezzi/ordini/traduzioni del piatto interessato). Tutti gli altri piatti, immagini, testi, prezzi, funzioni, stili, file e comportamenti restano intatti, anche se un miglioramento collaterale potrebbe sembrare utile. Non rigenerare l'intera galleria o alterare foto già approvate per aggiornare un solo piatto.
- **Controllo prima della pubblicazione:** verificare che ciascuna foto nuova o sostituita sia fedele al proprio piatto, nitida e visivamente omogenea rispetto alle miniature già approvate, e che tutto il resto del sito sia rimasto invariato. Se un risultato sufficientemente fedele non è ottenibile, segnalarlo senza spacciare un piatto diverso per quello richiesto.

## Frequenze definitive e recupero automatico — 2026-11-04
Questa istruzione prevale, per le sole frequenze e procedure di recupero, sulle sezioni del 2026-10-22 e del 2026-11-02 dedicate a notizie, meteo e vignette. Non altera contenuti, impaginazione, fonti, ricette, prenotazioni, notifiche o altre funzionalità.

- **Notizie: quattro acquisizioni al giorno** (Europe/Rome), nelle finestre delle **07:20, 11:20, 15:20 e 20:20**. La fonte resta il feed RSS ufficiale RaiNews, con cinque titoli: tre Italia e due mondo. L'aggiornamento è reale solo se `scripts/update-news.py` ha acquisito e validato dati. In caso di errore, mantenere `news.json` e il vero timestamp precedente, mostrando «Aggiornamento in ritardo»; mai inventare titoli o dichiarare acquisizioni inesistenti.
- **Meteo: due acquisizioni al giorno** (Europe/Rome), nelle finestre delle **07:20 e 15:20**. La fonte resta MET Norway per Controcorrente, con le medesime fasce pranzo e cena, vista oggi/domani e GPS già approvati. In caso di errore, non falsificare `weather.json`, gli orari di acquisizione o le previsioni; conservare i dati corretti precedenti con la gestione esistente delle fasce scadute.
- **Autonomia e recupero dei dati:** l'unico workflow ordinario per entrambe le fonti è `.github/workflows/aggiorna-novita.yml` sul ramo `main`. Si avvia per controllo ogni ora al minuto 23 del fuso Europe/Rome; confronta `fetched_at` realmente salvato di ciascuna fonte con l'ultima finestra dovuta. Esegue l'acquisizione solo quando quella finestra non è ancora stata soddisfatta, con un tentativo di recupero se la fonte fallisce. Così, se GitHub ritarda o perde un trigger, il controllo successivo può recuperare senza trasformare i 24 controlli in 24 aggiornamenti: obiettivo **4 notizie e 2 meteo al giorno**, salvo indisponibilità verificabile della fonte o del servizio GitHub. Le due fonti restano indipendenti; pubblicare solo JSON validi e modificati, con esplicita richiesta di rebuild GitHub Pages dopo commit del bot. L'avvio manuale o l'aggiornamento del workflow può forzare un'acquisizione straordinaria.
- **Vignette Divertentismo: una sola nuova edizione `daily` al giorno**, alle **08:00 Europe/Rome** mediante l'automazione ChatGPT già esistente `Vignetta Divertentismo`. Non duplicare questa automazione e conservarne le istruzioni approvate: umorismo leggero su ristorazione, ingegneri e bancari, due riquadri vettoriali oro sul blu nautico, data/ID univoci, massimo tre vignette visibili ordinate per `data-published-at`, senza ripetizioni intenzionali.
- **Recupero Divertentismo se e solo se assente:** il workflow `.github/workflows/divertentismo-recupero.yml` verifica alle **09:27, 12:27, 16:27, 20:27 e 22:27 Europe/Rome** se è già presente l'edizione `daily` della data attuale. Se presente, non modifica niente; se assente, `scripts/recupera-divertentismo.py` usa una battuta originale di riserva, preserva stile/struttura, aggiorna solo gli articoli di `divertentismo.html`, mantiene tre edizioni visibili e pubblica tramite GitHub Pages. Un'eventuale edizione `exceptional` non sostituisce la `daily`. Nessun secondo articolo `daily` per la stessa data, nemmeno dopo ripetizione del workflow; durante le scritture concorrenti rileggere lo stato `main`.
- **Separazione assoluta dalle notifiche push:** tutti questi aggiornamenti sono silenziosi. Resta valida la regola dell'unico saluto push quotidiano, senza altre notifiche per notizie, meteo o vignette.
- **Verifica dopo ogni modifica alla programmazione:** controllare l'esito effettivo dei job Actions, il commit su `main`, la pubblicazione Pages e i timestamp reali dei contenuti. I cron esterni possono subire ritardi o interruzioni, perciò non dichiarare garanzie di puntualità assoluta né aggiornamenti riusciti senza prova.

## Radio — jingle vocale automatico, regola permanente, 2026-11-04
- Quando la radio del sito è in effettiva riproduzione, annunciare automaticamente ogni 2 minuti di ascolto: «Questa è la radio preferita dal Controcorrente. Qui il ritmo è sempre quello giusto.».
- Usare la sintesi vocale italiana disponibile nel browser, con tono da speaker, velocità leggermente rallentata, timbro sintetico più profondo e cupo (pitch 0,66), privilegiando una voce italiana maschile riconoscibile dal nome tra quelle installate nel browser, mantenendo il volume della voce al massimo consentito dalla sintesi vocale (1,0). Non è un messaggio registrato dal titolare: la voce specifica può variare a seconda di dispositivo e browser.
- Per tutta la durata dell'annuncio ridurre gradualmente il volume dello stream al 10%, quindi ripristinare gradualmente il 100%. Non interrompere né riconnettere lo streaming per inserire la voce.
- Nessun pulsante, interruttore, impostazione o scelta dedicata al jingle. È attivo automaticamente con la radio e si ferma con la radio; mantenere esclusivamente il pulsante preesistente ON/OFF della musica. Non offrire comandi per disattivare il solo jingle.
- Un solo timer nel documento proprietario del lettore persistente, così i passaggi tra le pagine non duplicano gli annunci. Fermare voce e timer se la radio viene spenta, va in errore o smette di suonare; non annunciare con la radio spenta.
- Implementazione in `site-session.js`, blocco «CONTROCORRENTE RADIO JINGLE 2026-11-04». Preservare questa regola e il suo comportamento nei futuri aggiornamenti. Nessun cambiamento a radio/emittente, ticker dei brani, menu, layout, ordini, notifiche o altre funzioni.

## Radio Premi — sistema Supabase operativo, emissione autorizzata 2026-11-05
- Il titolare ha chiesto di pubblicare **codici reali immediatamente**. Database Supabase privato `Controcorrente-Radio-Premi`, progetto `lgjijnhhnjioiyvfmkvy`. Il codice deve essere **generato sul server** per ogni giorno nel fuso Europe/Rome; non esporre mai codici non ancora annunciati nel repository o nel Club pubblico. Il cron `cc_radio_premi_daily_tick_v1` ogni 5 minuti (a partire dalla mezzanotte locale, o immediatamente all'attivazione) genera 1 codice diverso e invalida automaticamente quelli scaduti.
- Codice di 5 caratteri alfanumerici, evitando lettere/numeri ambigui 0/O e 1/I, valido **7 giorni esatti** dall'emissione. Due finestre di annuncio casuali per giorno: **10:00–12:59** e **17:00–19:59** (Torino). Ogni slot dura 4 minuti; il jingle normale del player ogni 2 minuti viene sostituito una volta per finestra/browser dal testo con codice letto lentamente (voce italiana cupa, volume voce max, musica 10%); poi si torna al jingle normale. Non garantire l'annuncio se radio spenta, scheda sospesa o browser senza sintesi vocale. Una radio esterna non può ricevere il nostro jingle; l'annuncio esiste solo nel lettore del sito.
- **5 € di sconto su una cena da almeno 50 € di conto complessivo prima dello sconto**, indipendentemente dal numero di persone; nessuna cumulabilità con altri sconti. Il cliente deve prenotare **attraverso il sito** e scrivere il codice nelle **note** del riepilogo preordine (es. «CODICE A3B7C»). La prenotazione deve essere di cena, valida e confermata dal ristorante. Il conto minimo va verificato al pagamento; se non raggiunto, niente sconto.
- **Blocco immediato e atomico:** quando il cliente preme «Apri WhatsApp e invia la richiesta» sul modulo del sito, `preordine.js` chiama `POST /functions/v1/radio-premi`, action `claim`. Se il codice è valido e ancora libero, lo riserva per **24 ore**; ulteriori richieste con lo stesso codice sono respinte. La riserva avviene **prima** che WhatsApp si apra e **non prova** che il messaggio sia stato realmente inviato/ricevuto; se resta non confermata si libera automaticamente dopo 24 ore. Il sito inserisce nel messaggio WhatsApp codice e **riferimento UUID**. Nessuna prenotazione diretta in WhatsApp ha diritto automatico al premio.
- **Pannello gestionale titolare:** `radio-premi-gestione.html`, accesso autenticato tramite Supabase Auth (non semplice URL segreto); stato ed emissione, orari, UUID prenotazione, scadenza, conto. Prima dell'utilizzo il titolare deve **confermare la propria email Supabase**: se l'email non è verificata non può accedere al pannello. Per una richiesta WA arrivata: confronta codice e UUID con la riga `held`, seleziona «Conferma» e inserisce entrambi. La riga passa a `confirmed` ed è bloccata anche oltre 24 ore. Al pagamento, se conto >=50 €, «Segna utilizzato» con codice, UUID e importo. Per **annullare definitivamente** usa l'azione visuale «Annulla definitivamente», che internamente continua a inviare `release` per compatibilità con l'API, ma in database transita a `void` e non libera il codice; richiede codice. Codici usati/scaduti/annullati non sono riutilizzabili.
- **Club pubblico:** griglia `club.html` alimentata dall'API Supabase `GET /functions/v1/radio-premi` tramite `radio-premi.js`; mostra soltanto codici già riservati, confermati, usati, scaduti o annullati, con emissione, scadenza e stato, senza dati personali. La parola «Riservato» NON significa «già utilizzato». Mostrare «Già utilizzato» esclusivamente dopo `use`. Codici ancora disponibili non compaiono prima della pronuncia; i loro dati completi sono privati nel database.
- Il risponditore WhatsApp su Windows **non è attualmente integrato con Supabase**: non dichiarare mai che il messaggio in arrivo attivi automaticamente «Conferma» o «Utilizzato». È possibile implementare automazione successivamente modificando il software locale: estrarre codice/UUID dal messaggio proveniente dal sito, autenticare una chiamata lato server, verificare corrispondenza e fare transizione `held->confirmed`. Non permettere al cliente di autoconfermare o alterare stati dal browser. Le credenziali macchina devono restare nel PC/server, mai nel sito.
- Backend: schema privato `radio_premi`, RLS, Edge `radio-premi`, funzioni RPC atomiche; nessuna service role key o credenziale amministrativa nel repository pubblico. `radio-premi-public.json` statico è un vecchio segnaposto, non fonte autorevole. Regole tecniche complete in `.github/instructions/radio-premi-master.md`. Non toccare gli altri sistemi Club punti e ordini.


- **Precisazione operativa 5 novembre 2026:** le prenotazioni ordinarie del sito non hanno mai avuto un UUID Radio Premi. Il riferimento UUID viene creato e allegato al WhatsApp **soltanto se il cliente inserisce un codice promo nelle note** e la richiesta ottiene la riserva. Paolo non deve inventarlo né chiederlo per una prenotazione normale. Il pannello gestionale di Radio Premi deve richiederlo solo per «Conferma» e «Segna utilizzato»; «Attiva», «Sospendi» e «Annulla definitivamente» non richiedono un riferimento. Nel pannello, mostrare solo i campi richiesti, chiedere conferma anche prima di «Sospendi» e rendere visibile lo stato «ANNULLATO DEFINITIVAMENTE» dopo l'annullamento. Ciascuna riga utilizzabile deve offrire anche il pulsante di annullamento, con conferma esplicita. Modifiche predisposte in `radio-premi-gestione.html` e `radio-premi-admin.js`; non cambiare l'archiviazione o l'invio delle normali prenotazioni.

## Risponditore WhatsApp Windows — QUINTA modifica da effettuare, 2026-11-05
- **Da ricordare per la prossima revisione del risponditore ControcorrenteAI; NON realizzata nel software Windows in questa modifica del sito.**
- Quando il risponditore riceve **realmente** un WhatsApp con una prenotazione effettuata dal sito e un codice Radio Premi, deve estrarre dal testo **codice alfanumerico di 5 caratteri** e **riferimento UUID** generato durante il preordine.
- Prima di rispondere deve verificare che codice e UUID coincidano con una riserva già presente su Supabase (progetto lgjijnhhnjioiyvfmkvy) nello stato held e che il messaggio sia arrivato davvero tramite WhatsApp; solo allora chiedere al backend di **confermare in modo autenticato** la riserva, cambiando lo stato in confirmed. La richiesta deve essere idempotente e resistere a duplicati e riavvii.
- **Non** confermare codici solo perché sono scritti in una chat libera o in un messaggio falso; la sola ricezione WhatsApp non deve registrare il conto come pagato, né attribuire lo sconto definitivo. Paolo registra lo stato used solo dopo aver verificato il conto cena finale di almeno 50 €.
- Conservare credenziali e chiavi macchina nell'installazione Windows o in server protetto; non pubblicarle nel sito e non trasmetterle nei messaggi. Notificare al titolare il risultato (confermato, già occupato, scaduto, non valido), senza esporre dati personali nel Club.
- Test obbligatori: ricezione reale, doppio invio, codice errato, riserva già confermata, annullamento e servizio irraggiungibile. In caso di errore nessuna conferma automatica e avviso al titolare.
- È la **quinta richiesta di modifica** del risponditore, da conservare insieme alle precedenti senza modificare ora il programma Windows.

## Radio Premi — codici di prova solo su esplicita richiesta
- I codici di test si generano **solo quando Paolo lo richiede espressamente**. Vengono creati sul server Supabase con is_test=true; non sostituiscono e non impediscono la generazione del codice reale del giorno.
- Codice test: stesso percorso nelle note del preordine, riserva di 24 ore, ma **nessuno sconto reale**; il database impedisce di registrarlo come used. Il messaggio WhatsApp e il pannello titolare devono indicare SOLO PROVA. Non annunciare il codice test in radio e non esporlo nel Club pubblico.
- Primo codice test creato su richiesta il 5 novembre 2026, con validità 24 ore. Il codice specifico resta soltanto nel database privato e nella conversazione col titolare, **non in questo master pubblico**.

## Radio, ascoltatori in diretta e Radio Premi: aggiornamento vincolante del 5 novembre 2026
- **Ascoltatori in questo momento, NON contatore visite/storico**. Accanto a destra del pulsante radio in ogni pagina deve comparire «♫ N in ascolto ora». N è il numero di sessioni browser che hanno il player audio effettivamente in esecuzione, non chi visita il sito. Heartbeat del lettore ogni 10 secondi a Supabase (Edge `radio-premi`, action `listener_presence`), tabella privata `radio_premi.radio_listeners` con sessione UUID e ultima attività; presenza valida 30 secondi, con rimozione immediata quando audio viene spento se la connessione funziona. Leggere il totale con `radio_listener_count` nel GET dell'API. È un conteggio **quasi in tempo reale**, non individua persone uniche se hanno due dispositivi, non promettere precisione al secondo. Non usare il vecchio contatore visitatori per questo numero. Non mostrare dati o identità degli ascoltatori.
- **Da ora nuovi Radio Premi numerici: esattamente 5 cifre** anche con zero iniziale, generazione sicura in Supabase, un codice reale al giorno per la data di Torino, unico a livello di registro. Restano nel DB vecchi codici alfanumerici già creati, ma non vanno più generati per il programma reale. Le note del preordine devono contenere soltanto il codice numerico (o preceduto da «codice/radio/sconto»); nessun UUID tecnico è richiesto o scritto nelle note del cliente. `preordine.js` conserva **UUID internamente** nella richiesta server di riserva, per il blocco atomico. Nel WhatsApp arriva nome e cognome della normale prenotazione e il codice numerico nelle note, senza stringhe tecniche aggiuntive. Non alterare i normali preordini senza codice.
- **Pannello titolare**: codice numerico per «Conferma» e «Annulla»; per «Segna utilizzato» anche il conto di cena almeno 50 € prima dello sconto. Il database può associare direttamente il codice (che è univoco) alla riserva attiva; nessun UUID da trascrivere nel pannello. Stati `available`, `held`, `confirmed`, `used`, `expired`, `void`, con avvisi di conferma anche per la sospensione. Una riserva non confermata dura 24 ore e poi torna libera. La promozione era **sospesa** al controllo del 5/11 alle 01:18 Europe/Rome: non riattivarla implicitamente in nome della prova audio.
- **SOLO il 5 novembre 2026**: prova autorizzata, il codice reale del giorno viene pronunciato dal jingle sul lettore del sito circa **una volta al minuto**, anche durante promozione sospesa, senza attivare la spendibilità del codice; il giorno successivo, a mezzanotte Europe/Rome, ritorno automatico al jingle standard **ogni 2 minuti**, codice premio solo nelle **due finestre casuali giornaliere** con promozione attiva. La radio esterna (60 North Radio) non viene modificata: l'annuncio è sintetizzato nel browser del sito. In promo sospesa, specificare nel messaggio di prova che lo sconto non è riscattabile.
- **SESTA modifica del risponditore WhatsApp Windows, da segnare insieme alle prime cinque, NON implementare ora:** se nel campo «Allergie e altre note» del messaggio che deriva dal modulo di prenotazione del sito compare un codice **numerico di cinque cifre**, il risponditore deve interpretarlo come codice **Radio Premi**, non come piatto, orario o testo non conforme. Deve interrogare Supabase con servizio autenticato per risolvere la riserva associata alla prenotazione e confermarla solo dopo **ricezione WhatsApp reale**, verificando data, ora, cliente e validità. Non chiedere al cliente un UUID: ora rimane solo sul server per la riserva atomica. La richiesta deve essere idempotente e segnalare esito a Paolo, senza registrare come «used» uno sconto che non è stato ancora applicato. Non considerare validi semplici codici 5 cifre presenti in messaggi WhatsApp che non provengono dalla procedura di preordine del sito. La registrazione del pagamento finale resta al titolare. Questa sesta modifica **aggiorna e sostituisce il dettaglio tecnico della quinta modifica sull'UUID esposto al cliente**, mentre la quinta rimane registrata come esigenza di conferma automatica via risponditore.


## Radio e Radio Premi — regole operative VINCOLANTI, aggiornate il 5 novembre 2026
Questa sezione sostituisce gli intervalli, le UI e le frequenze riportati in vecchie parti del master.

### Player, interfaccia e voce
- Radio ufficiale: **60 North Radio**, stream HTTPS MP3 a 320 kbps `https://cdn1.zetcast.net/stream`. Il titolo e l'artista provengono dal server `https://cdn1.zetcast.net/status-json.xsl`, mount `/stream`; non inventare titoli mancanti.
- **Radio SPENTA a ogni nuova apertura/reload**; si accende soltanto mediante pulsante ON. Se l'utente la accende e naviga tra sezioni col lettore persistente, resta attiva fino al suo OFF. Non attivare automaticamente la radio alla prima interazione né per vecchie preferenze salvate. I pulsanti di navigazione, radio, condivisione e altri comandi devono restare coerenti in tutte le sezioni.
- A destra del pulsante radio mostrare **solo il numero intero** di ascoltatori live (es. `2`), senza icona o parole. Il numero indica sessioni con audio realmente attivo, NON visite o storico. Supabase aggiorna ogni 5 secondi, con presenza valida 30 secondi e rimozione al momento dello spegnimento; la precisione al secondo e la deduplicazione tra dispositivi non sono garantite. Quando la connessione fallisce mostrare un trattino, mai un conteggio inventato.
- La striscia del titolo musicale, **lunga e sottile (23px)**, deve scorrere sotto **tutti i pulsanti dell'intestazione**, non all'interno del gruppo radio. Deve essere uguale in ogni sezione e mostrata soltanto quando il player è acceso.
- **Condividi spostato 5px a sinistra rispetto alla precedente posizione di 8px**: ora offset CSS `left:3px`, senza alterare alcuna funzionalità.
- Sintesi vocale con lo **stesso motore, voce italiana preferibilmente maschile naturale** per jingle classico e codice; impostare preferibilmente timbro cupo senza pitch innaturalmente basso (rate 0.98, pitch 0.82). Volume della voce massimo consentito, musica al 10% durante la voce e ripristino al 100% al termine. Il browser può limitare la voce, specie su Android e in background.

### Annunci vocali e promozione
- **Jingle classico ogni 10 minuti, dalle 06:00 Europe/Rome**, indipendente dagli annunci sconto, con formula «Questa è la radio preferita dal Controcorrente.» più una breve battuta originale casuale dall'elenco `JINGLE_ENDINGS`. Non ripetere due volte consecutivamente la stessa battuta. Nessun saluto incongruo con pranzo/cena.
- **Codice sconto letto con la frase sintetica e senza spiegazioni**: «Il codice promo di oggi è: [cinque cifre scandite].» Il testo usa esattamente il motore vocale del jingle classico. Non dire importi, condizioni, nome del locale o altro durante l'annuncio premio. **Mai sovrapporre i due annunci**: stato `jingleBusy`, priorità del codice quando imminente, rinvio breve del classico senza cancellarlo.
- **Prova vera solo il 5/11/2026, dall'attivazione fino alle 06:00 Europe/Rome**: pronunciare il codice reale di quel giorno **circa una volta al minuto**, con la radio accesa e la promozione attiva; l'API pubblica lo slot 0 fino alle 6. Il codice è realmente riservabile sul modulo del sito. Dalle 06:00 termina automaticamente il test al minuto.
- **Dal 5/11/2026 alle 06:00 e ogni giorno successivo:** **10 annunci casuali di codice al giorno a partire dalle 06:00**. Tabella privata `radio_premi.announcement_slots` in Supabase, 10 righe per codice reale, finestra di disponibilità di 7 minuti per consentire l'annuncio su ogni browser attivo; un annuncio per slot/browser. Fasce italiane: 06:00–07:29, 07:30–08:59, 09:00–10:29, 10:30–11:59, 12:00–13:29, 13:30–14:59, 15:00–16:29, 16:30–17:59, 18:00–19:29, 19:30–21:59. L'orario esatto di ciascuna fascia è casuale e programmato server-side. Nessun annuncio se radio spenta, codice riservato/usato/annullato/scaduto o promo sospesa. Il codice è pronunciato **nel sito**, non nel flusso originale dell'emittente.
- Database: progetto privato `lgjijnhhnjioiyvfmkvy`, cron `cc_radio_premi_daily_tick_v1` ogni 5 minuti, **un codice reale numerico di 5 cifre/giorno**, unico, valido 7 giorni. Stato `available,held,confirmed,used,void,expired`. Il promo è attivo solo se `radio_premi.settings.active=true`; un titolare può sospenderlo dal pannello.
- Il cliente scrive il codice **esclusivamente nel campo note della prenotazione cena fatta sul sito**, non nel piatto: il form crea una riserva atomica per 24 ore; il secondo cliente non può usarlo. WhatsApp continua a riportare il totale intero dei piatti e le note, **senza sottrarre automaticamente 5 €** e senza UUID tecnico visibile. Paolo conferma il codice al ricevimento effettivo del WhatsApp; al conto di almeno 50 € prima dello sconto applica 5 € una sola volta e marca il codice `used`. La registrazione manuale resta obbligatoria finché non sarà sviluppato il risponditore.
- **Club:** spiegare integralmente sconto (5 € su conto cena >=50 €, indipendentemente da commensali, non cumulabile), prima prenotazione valida, codice nelle sole note, scadenza 7 giorni, conferma e stato. Nessuna lunga spiegazione audio. **Novità:** soltanto breve richiamo elegante con collegamento alle regole del Club.

### Modifiche rimandate al risponditore Windows (NON applicate al PC)
Conservare la lista pregressa di interventi (link ridondante al sito, esclusione gruppi/membri, comandi iniziali automatici, pranzo dopo le 12 da confermare, cartelle giorni dedicate solo alle cene, verifica prenotazioni e conferma sospesi manuale). Conservare inoltre le richieste di riconoscimento Radio Premi via WhatsApp, con verifica autentica su Supabase, senza sconto contabilizzato dal bot.
- **SETTIMA integrazione, 5 novembre 2026:** quando nelle *note di una prenotazione generata dal sito* compare un **codice numerico di esattamente cinque cifre**, il risponditore deve riconoscerlo come **codice Radio Premi**, senza considerarlo un piatto, una modifica alla scelta del piatto o un'anomalia che fa sospendere la prenotazione. Non porre la prenotazione `da confermare` soltanto per la presenza del codice; restano valide le normali regole di conferma (es. pranzo dopo le ore 12). Verificare sul backend lo stato del codice; se validato, confermare la riserva soltanto quando il WhatsApp è realmente arrivato. Non chiedere l'UUID al cliente. Il bot non deve marcare `used`, azione riservata al pagamento/conto del titolare. Se il testo non proviene da una prenotazione del sito, non attribuire automaticamente uno sconto. Questa integrazione estende le precedenti quinta e sesta modifiche, senza annullarle.
- Salvare come aggiornamento del master e conservare il file delle modifiche Windows già consegnato, aggiornandolo alla prossima compilazione. Non intervenire ora sul risponditore installato.

### Verifiche / limitazioni
Test di database e chiamate HTTP senza consumare codice reale; sintassi JS; verifica dei dieci slot giornalieri, del cron, della promozione attiva e deploy GitHub Pages. Audio e sincronizzazione su browser reali non possono essere garantiti senza test sul dispositivo dell'utente.
- **Eccezione di ripristino, 5/11/2026:** il primo codice reale giornaliero era stato riservato, confermato e poi annullato tramite pannello (stato `void`). Per soddisfare la richiesta esplicita di prova reale è stato emesso **un nuovo codice sostitutivo di 5 cifre**, lasciando definitivamente annullato il precedente. L'indice database `codes_one_real_per_day` consente un solo codice non annullato per data e non elimina i codici `void`; il cron non emette automaticamente nuovi codici nel giorno in cui esiste già un'emissione. Gli slot dei codici annullati non vengono diffusi. Non riattivare mai un codice `void` e non crearne nuovi manualmente senza richiesta specifica.


## Radio Premi — chiarimenti attuativi 5 novembre 2026: prenotazioni, volume e pubblicazione
Queste istruzioni più recenti prevalgono sulle note precedenti dove divergono.

- **Manuale e trasparenza:** il cliente ascolta cinque cifre, sceglie una cena da prenotare **entro sette giorni dalla data del codice** e inserisce le cifre **solo nelle note del preordine sul sito**. La prima richiesta valida blocca il codice in Supabase per 24 ore; deve seguire l'invio effettivo del WhatsApp con nome/cognome, data, orario, piatti e note originali (prezzi invariati). Il titolare confronta il codice nelle note del WhatsApp con la riga del pannello amministrativo che ora mostra anche giorno e ora cena, poi preme `Conferma` per bloccare definitivamente la riserva. Quando applica i 5 € su conto cena >=50 €, preme `Segna utilizzato`. Nessuno sconto viene sottratto nel WhatsApp.
- **Registro pubblico e anti-frode:** non pubblicare mai nel Club i codici ancora liberi o appena annunciati, né quelli void o expired: il database pubblico `radio_reward_status` restituisce **solo held (con held_until futuro), confirmed e used**; con data/ora e stato. Registro aggiornato nel browser **ogni cinque secondi**. Al clic su Apri WhatsApp, il claim aggiorna immediatamente lo stato `held` sul server, che appare nel registro come «Riservato, in attesa di conferma»; è una riserva provvisoria, non prova di invio WhatsApp. Dopo controllo WhatsApp in pannello appare «Prenotazione confermata», al conto «Sconto utilizzato». Nessun nominativo del cliente è pubblico. Se si libera la riserva, il codice scompare dal registro e ritorna disponibile; non esporre quel codice prima di una nuova riserva.
- **Libera riserva non confermata:** il comando amministrativo `free_hold` è separato da `release` (annullamento definitivo). `free_hold` può liberare SOLO codici in stato `held`, dopo verifica che il WhatsApp NON sia arrivato: pulisce UUID interno, data/ora e nota tecnica, rimette `available`, non annulla il codice. La liberazione avviene anche automaticamente per `held` non confermati trascorse 24 ore. `release` invalida definitivamente; `confirmed`, `used`, `void` non possono essere liberati con `free_hold`. Di norma il giorno seguente viene creato un nuovo codice, ma ciò non rende irrilevante una prenotazione provvisoria bloccata: il premio rimane valido sette giorni.
- **Sospendi annunci:** il pulsante proprietario `Sospendi annunci radio fino a domani` (`deactivate` storica) NON disattiva globalmente lo sconto: imposta `radio_premi.settings.announcements_paused_day` alla data locale corrente; gli annunci smettono subito e il giorno successivo riprendono automaticamente con il nuovo codice se la promozione generale resta attiva. Anche uno stato non `available` (held/confirmed/used/void) ferma automaticamente gli annunci dello specifico codice. Non pronunciare codici confermati, annullati o già utilizzati. Il comando `activate` annulla la sospensione manuale di oggi.
- **Niente annuncio immediato all'accensione:** il player attende almeno 60 secondi dal clic ON prima di pronunciare un codice. Non aggirare questo ritardo in `refreshRadioPromo`. Gli annunci restano soltanto nel lettore del sito, non vengono sovrapposti al flusso MP3 originale.
- **Volume stabile:** è stata eliminata l'attenuazione automatica 10%/100% dei precedenti jingle (il problema poteva lasciare la radio più bassa per vari secondi o oscillare); `audio.volume` deve restare `1` anche durante il promo, con protezione `volumechange`. Eventuale attenuazione audio a livello Android durante la sintesi TTS non è gestibile dal sito.
- **Solo promo fino alle 06:00 del 5/11/2026**: niente jingle classico durante la prova reale ogni minuto; dall'ora indicata riprendono i jingle ordinari ogni dieci minuti e gli slot casuali premio concordati (10 al giorno dalle 06:00).
- **Ascoltatori attuali:** numero secco accanto al pulsante radio, aggiornamento ogni 5s; il backend usa TTL **12 secondi**, e il player invia OFF immediato durante pausa, stop e `pagehide` con `sendBeacon` quando supportato. Non confondere questo dato con visite cumulative. Accuratezza non perfettamente istantanea o deduplicata.
- **Cache e posizione pulsanti:** le pagine con intestazione caricano `site-session.js?v=20261105-premio-senza-duck-v10`; aggiunto meta `Cache-Control: no-cache` lato HTML dove applicabile. Non si possono forzare retroattivamente tab già aperte su vecchi script; possono richiedere una ricarica. Conservare i pulsanti coerenti in tutte le sezioni. Il pulsante Condividi resta spostato 3px a destra rispetto alla posizione originale, cioè 5px più a sinistra rispetto al precedente offset 8px.
- **Contenuto pubblico:** il testo riguardante la frequenza interna dei jingle, le prove ogni minuto, il totale WhatsApp e la gestione tecnica dei codici è per il solo master e NON va esposto nelle pagine del Club/Novità. Mostrare invece condizioni comprensibili al cliente, spiega prenotazione entro 7 giorni, codici nelle sole note e registro stati.
- **Risponditore Windows:** nessuna modifica diretta ora. Nella prossima revisione il bot non deve mettere una prenotazione del sito in sospeso per la sola presenza di cinque cifre nella sezione note, interpretando quel numero come Radio Premi e non un piatto aggiuntivo; occorre interrogare Supabase e confermare soltanto dopo ricezione WhatsApp reale. Restano tutte le altre richieste già annotate in master.

## Regola vincolante fotografica — piatto e sfondo identici, 2026-11-05
- Vale per **tutte** le foto del pranzo, della cena e delle offerte, anche EN/ZH. Ogni piatto deve sembrare fotografato nella **stessa sessione**: tavolo/sfondo blu scuro IDENTICO, medesimo piatto di ceramica avorio con profilo e diametro uniformi, stessa altezza della camera e angolo tre quarti leggermente dall'alto, stessa luce calda morbida, prospettiva, ingrandimento, profondità, temperatura colore e proporzioni.
- Il **piatto intero**, inclusi bordi e guarnizioni, deve restare visibile nella scheda finale desktop e mobile, con margine sufficiente attorno. Non usare tagli ravvicinati che amputino un bordo o un ingrediente; controllare il vero riquadro `.dish-photo` e il suo `object-fit` prima di pubblicare. Eventualmente rifare la composizione anziché nascondere il problema con un ritaglio.
- **Non ricavare le singole foto ritagliando celle differenti di una tavola/collage**: crea o ricostruisci ogni scena autonomamente con l'identica inquadratura master. È vietata una serie con angolature troppo differenti, piatti o sfondi mutevoli; la coerenza deve essere verificabile accostando tutte le miniature.
- Realismo fotografico massimo, ingredienti fedeli, niente decorazioni inventate: salse, tagli, colori e impiattamento devono rappresentare esattamente la ricetta. Se le foto disponibili divergono, ricostruire la scena in **HD nativo (almeno 1200×800 px, preferibilmente superiore)**, nitida, senza ingrandire minifoto sfocate e poi ottimizzare WebP per il sito.
- Durante gli aggiornamenti sostituire **soltanto le foto richieste** e i relativi riferimenti, senza modificare nome, prezzi, descrizioni, allergeni, layout e funzioni non richiesti; verificare la resa in tutti i formati prima del commit.

## Radio, statistiche pulsante e rotazione console — regola finale 2026-11-05
- Questa sezione prevale sulle indicazioni precedenti di jingle ogni 2/5 minuti, sulla prova fino alle 06:00 del 5/11 e sulla regola temporanea che lasciava il volume invariato durante la voce.
- **Jingle classico:** solo mentre lo stream radio del sito è effettivamente in riproduzione e non prima delle **06:00 Europe/Rome**; poi alle scadenze fisse **06:00, 06:10, 06:20, ...** (ogni 10 minuti, fino alla fine della giornata), senza avviarlo appena premuto ON. Formula «Questa è la radio preferita dal Controcorrente di Torino.» più una battuta breve casuale, non identica a quella immediatamente precedente.
- **Promo:** un codice reale **numerico a cinque cifre** al giorno, generato sul server a partire dalle 06:00; esattamente **10 finestre casuali** nelle fasce 06:00–21:59 previste in `radio_premi.announcement_slots`, ciascuna leggibile per 7 minuti; max una pronuncia per slot e browser, esclusa la prova terminata alle 06:00 del 5/11. Testo breve «Il codice promo è: [cinque cifre scandite]. Informazioni sul sito.» Senza codice pubblicato sul sito. Il primo annuncio premio richiede almeno 60 secondi dal click ON. Se radio spenta, codice non più libero, promo sospesa o browser senza TTS, non pronunciare nulla.
- **Nessuna sovrapposizione:** il jingle classico e la promo condividono lo stato `jingleBusy`; quando coincidono, **precedenza al premio**, classico rinviato brevemente. Usare un solo lettore proprietario persistente e un'unica coda vocale anche navigando tra pagine. Usare voce italiana preferibilmente maschile, rate 0.98, pitch 0.82; stream al **10%** esclusivamente mentre la sintesi parla, ripristino **100%** in `onend`, `onerror`, watchdog e stop. Sintesi vocale emessa dal browser e NON dalla radio esterna; Android/schede in background possono non riprodurla, quindi non dichiarare verificato il parlato senza test sul dispositivo.
- **Statistiche radio da oggi (05/11/2026):** `site-session.js` registra un'accensione intenzionale del pulsante radio **ON**, non visite pagina, OFF, autoplay, heartbeat o ascolti in corso. Conteggio anonimo **una volta per browser al giorno** (giorno Europe/Rome) e **una volta per browser nel totale storico** tramite marcatori locali `localStorage`; dati aggregati su chiavi `piol77_controcorrente_radio_unique_on_20261105_*` separate dal contatore visitatori. Non individuare persone: browser differenti o cancellazione dati producono conteggi distinti; se offline mostrare trattino, mai valori inventati. In **Novità**, sotto «Accessi al sito», mantenere l'**identico piccolo simbolo musicale SVG** del pulsante seguito soltanto da **due cifre/contatori oggi · totale**, senza etichette visibili; un'etichetta accessibile e tooltip sono consentiti. Stato ascoltatori live accanto al pulsante radio resta indipendente.
- **Console Radio Premi:** `radio-premi-gestione.html` compatta con testi brevi, tabella scorrevole, soli **ultimi dieci giorni**; login titolare e azioni di conferma/uso/annullamento restano protetti. DB privato `radio_premi`: `public.radio_reward_admin('list')` limita righe emesse negli ultimi 10 giorni (max 40); `radio_premi.cleanup_history()` elimina codici, slot, tentativi ed eventi oltre **10 giorni dall'origine** e sessioni ascolto obsolete. Cron `cc_radio_premi_cleanup_10d_v2` ogni 10 minuti, oltre al `cc_radio_premi_daily_tick_v1` per emissione e scadenze ogni 5 minuti. Prenotazioni di cena si effettuano al massimo entro 7 giorni dall'emissione; prima del saldo rispettare sempre validità, conferma e importo, nessun dato di pagamento è dedotto automaticamente dal click radio.
- I file direttamente interessati sono `site-session.js`, `index.html`, `radio-premi-gestione.html`, codice privato Supabase e versioni cache `site-session.js` nelle pagine con intestazione. Non modificare streaming 60 North Radio, procedura WhatsApp, Club punti, menus o altre funzionalità.

## Priorità voce e intelligibilità — 5 novembre 2026 (ultima revisione)
- La voce maschile sintetica scelta solo per nome e abbassata artificialmente a pitch 0,82 si è rivelata robotica e incomprensibile su dispositivo reale. In `site-session.js` preferire una voce italiana naturale/neural/enhanced o dei motori Google/Microsoft disponibili nel browser, anche rispetto a una vecchia voce maschile meccanica; tra voci di pari qualità preferire una voce maschile. La selezione può variare per dispositivo. Nessuna chiave TTS esterna o servizio a pagamento introdotto.
- Rate 0,90 e pitch 1,00 per evitare distorsione metallica. Nei messaggi Radio Premi pronunciare le cinque cifre come parole italiane distinte e **ripeterle una volta**, con pause, poi «Informazioni sul sito». Non memorizzare o pubblicare il codice corrente nel repository. I jingle ordinari condividono la stessa selezione vocale.
- Non alterare il player di 60 North Radio, calendario jingle classico ogni 10 minuti, 10 fasce premio giornaliere, attenuazione musica al 10%, ritorno al 100%, non sovrapposizione, attesa dopo ON, Supabase o regole di utilizzo. La qualità finale resta vincolata al browser/dispositivo: voce registrata davvero naturale e identica per tutti richiederebbe un servizio TTS dedicato, non incluso qui.

## Ripristino voce radio (5 novembre 2026, prevalente)
- Su richiesta del titolare è stata ripristinata la precedente selezione della voce italiana, preferibilmente maschile, con rate 0.98 e pitch 0.82.
- Revocata la modifica che dava priorità alle voci dichiarate natural/neural e impostava rate 0.90 e pitch 1.00: non reintrodurla senza una nuova richiesta.
- Conservarne invariati orari, radio, volume, promozioni e lettura scandita dei codici.

## Radio e annunci: correzione operativa del 5 novembre 2026 (vincolante, sostituisce 10 minuti)
- Richiesta del titolare: il **jingle generico ogni 5 minuti**, alle 06:00, 06:05, 06:10 e così via, soltanto mentre la radio del sito suona, mai prima delle 06:00 ora di Torino. Rimane la formula «Questa è la radio preferita dal Controcorrente di Torino.» seguita da una battuta variabile.
- Voce per jingle e promo: mantenere la scelta italiana precedente, evitando i sintetizzatori compatti palesemente scadenti quando esiste un'alternativa, con rate 0.98 e pitch 0.96, vicino al timbro naturale. Non reintrodurre l'esperimento precedente che privilegiava in assoluto le voci neural/Google/Microsoft (sul dispositivo reale era peggiore). La qualità effettiva resta legata alle voci installate: nessuna registrazione umana garantita.
- Radio Premi: mantenere **10 finestre casuali** dalle 06:00 alle 21:59. Codice letto cifra per cifra, due volte, senza sovrapporsi al generico. Nel player, contrassegnare un codice come già annunciato **solo su onend completato**; se l'audio viene interrotto o fallisce, lasciare possibile un nuovo tentativo nella stessa finestra, con intervallo di sicurezza di 30 secondi. Abbassare la musica al 10% solo quando il parlato inizia effettivamente, e ripristinare 100% alla fine/interruzione.
- Sono distinti gli **slot programmati dal server** dall'effettiva riproduzione sul browser: radio spenta, scheda sospesa, sintesi vocale non autorizzata o mancata presenza nell'intervallo possono impedire all'ascoltatore di sentire un annuncio. Non dichiarare un annuncio udito senza test reale sul dispositivo. Tutti gli altri sistemi, promozioni e streaming sono invariati.

## Voce radio ripristinata senza modifiche — 5 novembre 2026 (ultima volontà del titolare)
- La voce da mantenere è **ESATTAMENTE la selezione del mattino del 5 novembre**, riportata nel codice prima della prima prova di voce naturale: `speech.getVoices()` filtrate `it-IT`/italiano, prima voce riconosciuta maschile per nome, in subordine italiana non femminile, altrimenti prima italiana; `utterance.rate = 0.98`, `utterance.pitch = 0.82`, `utterance.volume = 1`. Non fare ulteriori tentativi automatici per renderla più naturale: non aggiungere punteggi, filtri contro voci `compact`, forzature neural o variazioni del pitch.
- Mantieni **separatamente** jingle ogni 5 minuti e riprova annunci promo interrotti, senza toccare scelta e parametri vocali. Regola prevalente su tutte le precedenti note discordanti sulla voce.

## Pulsante Condividi sempre nel campo visibile (PC/tablet) — 2026-11-05
- Nell'intestazione laterale PC (260px) e nella vista tablet, il pulsante Condividi non deve uscire dal bordo del sito. Condividi rimane nella zona superiore, insieme agli altri controlli, ma il gruppo `#cc-notification-actions` può andare su più righe (`flex-wrap:wrap`) per rispettare la larghezza disponibile.
- Eliminare lo spostamento laterale `left:3px` del solo pulsante Condividi; usare posizione statica, con `margin-right:auto` per restare allineato nel gruppo e lasciare Radio e Notifiche nella riga successiva quando non c'è spazio. Il feedback della condivisione deve andare a capo e non allargare il contenitore. La soluzione è nel CSS iniettato da `site-session.js`, con cache versionata per tutte le pagine.
- Conservare invariati funzioni di Condividi, conteggio anonimo, musica, promo, pulsante radio, notifiche, menù e layout non coinvolti.
