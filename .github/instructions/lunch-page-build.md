# Controcorrente — Master build pagina Pranzo

Questa specifica è interna al repository. Serve come istruzione operativa per ChatGPT/Work e non deve essere linkata o mostrata nel sito pubblico.

## Regola principale
La pagina pranzo è produzione. Modificare soltanto ciò che Paolo richiede e lasciare invariati tutti gli altri meccanismi del sito.

Quando Paolo chiede di variare **solo il menù pranzo**:
- non modificare navigazione, altre pagine, contatore, WhatsApp, riepilogo, validazioni orarie, reset ordine o logica condivisa;
- non riscrivere `preordine.js` se basta aggiornare i dati presenti in `pranzo.html`;
- aggiornare nome e prezzo del piatto in modo che il sistema di preordine legga sempre gli stessi dati mostrati a video;
- preservare il master grafico salvo esplicita richiesta diversa.

## Master grafico definitivo — approvato 2 ottobre 2026
Il riferimento autoritativo è il layout nautico fornito e approvato da Paolo il 2 ottobre 2026, implementato tramite:
- `pranzo.html` per contenuti vivi;
- `pranzo-master.css` per l'impaginazione;
- `pranzo-master-bg.webp` per il fondale nautico.

Caratteristiche obbligatorie:
- fondale pergamena/avorio con cornice blu;
- intestazione grafica `Controcorrente · Cucina di mare` a sinistra e `Piatti per il pranzo` a destra;
- onda e barca nella parte alta;
- ampia zona centrale chiara riservata ai piatti;
- faro, uccelli, montagne, barca e onde blu nella parte bassa;
- i piatti devono restare interamente dentro la zona chiara e non invadere il fondale marino inferiore;
- foto del piatto a sinistra, testo al centro, prezzo a destra;
- prezzo con pennellata/striscia gialla;
- controlli quantità sotto il prezzo con spazio sufficiente e senza sovrapposizioni;
- layout leggibile anche su mobile.

Non reinterpretare o sostituire il fondale con una grafica diversa. Se viene chiesto di cambiare soltanto i piatti, la cornice nautica resta invariata.

## Pulsanti ordine
I pulsanti `− / 0 / +` devono essere **gli stessi controlli HTML reali usati dalle altre sezioni del sito**, generati dalla logica condivisa di `preordine.js` e stilizzati dalla classe `.order-controls` di `styles.css`.

Regole:
- non incorporare i pulsanti dentro immagini raster;
- non duplicare i controlli con elementi finti;
- non cambiare colori, forma o comportamento dei controlli condivisi salvo richiesta esplicita;
- nel CSS pranzo è consentito definire soltanto posizione, spaziatura e responsività dei controlli;
- i pulsanti devono stare sotto il prezzo e non coprire foto, testo o prezzo.

## Struttura DOM necessaria al preordine
Per ogni piatto preservare una riga `.lunch-dish` contenente:
- un `h3` con il nome esatto del piatto;
- un elemento `strong` con il prezzo numerico visibile;
- eventuale foto/descrizione/allergeni.

La pagina deve preservare `.lunch-board`. `preordine.js` legge dinamicamente `.lunch-dish`, `h3` e `strong`, quindi la modifica grafica non deve cambiare questi hook.

## Foto
- usare soltanto foto coerenti con il piatto reale;
- se manca una foto corretta, è preferibile lasciare lo spazio neutro piuttosto che mostrare un piatto sbagliato;
- per il salmone usare un trancio/filetto rosa-arancio, mai un pesce intero;
- la modifica di una foto non autorizza a cambiare le altre righe.

## Testo, allergeni e asterischi
Correggere automaticamente grammatica e stile senza inventare ingredienti.

Allergeni:
- usare simbolo + numero regionale;
- niente parentesi;
- niente nome testuale dell'allergene;
- niente solfiti;
- non inventare allergeni incerti.

Congelati:
- `*` subito dopo l'ingrediente interessato;
- gamberetti, gamberoni e scampi con asterisco secondo la regola interna;
- mantenere la nota `* Ingredienti congelati all’origine.`.

## Contenuti fissi
Salvo richiesta esplicita diversa, preservare:
- `Valido solo per pranzo`;
- data del giorno del menù;
- `Prenotazioni entro le 12`;
- attesa della conferma del Ristorante;
- `Acqua, caffè e coperto inclusi`;
- `Fino a esaurimento`;
- link alla tabella allergeni;
- nota congelati.

## Verifiche prima della pubblicazione
1. controllare che tutti i piatti restino nella zona chiara del master;
2. controllare che prezzo e pulsanti non si sovrappongano;
3. controllare mobile;
4. verificare che `+` e `−` lavorino sul piatto corretto;
5. verificare riepilogo, subtotali, totale e WhatsApp;
6. verificare che le regole pranzo/cena restino invariate;
7. confrontare il diff e accertare che nessuna pagina o funzione non richiesta sia cambiata.

## Stato attuale
Dal 2 ottobre 2026 questo master nautico è il layout definitivo della pagina pranzo. La logica ordine resta quella condivisa di `preordine.js` e non deve essere modificata per semplici variazioni di piatti, prezzi, descrizioni, allergeni o foto.

Ultimo aggiornamento: 2 ottobre 2026.
