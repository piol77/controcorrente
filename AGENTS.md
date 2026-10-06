# AGENTS.md — Controcorrente

## Purpose
This file is the permanent operating specification for AI agents working on the Controcorrente restaurant website. Read it before changing code, content, images, CSS, navigation, publishing configuration, or repository structure.

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
- Main navigation is one vertical list in this order: Novità, Il Locale, Menù pranzo, Menù cena, Offerta del giorno, Bibite & vini, Club, Allergeni, Contatti, EN, 中文. On mobile the menu expands as one column; never use a two-column/zigzag navigation layout.
- Allergen references use ingredient-related pictograms plus the existing numbers without parentheses, both in the legend and beside dishes (including translations). The common mapping is allergen-symbols.json. Never use an anchor as an allergen pictogram. Do not change allergen assignments or introduce sulphites beside dishes as part of this visual update.
- Realistic photographs are also expressly permitted for wines: use the exact bottles from Cantine Delite's official site, with short source-grounded descriptions and preserved restaurant prices. Keep normal drinks unchanged, never show producer/source links, and never add quantity/order controls to drinks or wines.
- On the lunch page, prominently display: “Prenotando entro le 12:00” and “½ litro d’acqua · caffè · coperto inclusi”, followed by “Fino a esaurimento”. Preserve this highlighted notice during future lunch-menu updates.

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
- Per nuove foto cercare prima fotografie su internet coerenti con il piatto; privilegiare, dove possibile, sfondo, piatto, luce, prospettiva e impiattamento uniformi. Non sostituire automaticamente le foto già approvate. Registrare origine e limiti del riferimento; non spacciare foto illustrative per fotografie reali del ristorante. Non usare immagini di piatti diversi per nascondere un riferimento mancante.
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
- Quando cambia un ingrediente aggiornare, quando possibile, anche la fotografia del piatto mantenendo la coerenza visiva con le altre. Per una modifica puntuale privilegiare la foto approvata come base, senza cambiare sfondo, piatto e inquadratura. Se non è possibile ottenere una foto fedele, dichiarare il limite senza inventare ingredienti né presentare una foto diversa come corrispondente.
