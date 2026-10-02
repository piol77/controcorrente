# Controcorrente — Master build pagina Pranzo

Questa specifica è interna al repository e serve come istruzione operativa per ChatGPT/Work e per qualunque agente che modifichi la pagina pranzo. Non deve essere mostrata né linkata nel sito pubblico.

## Regola principale
La pagina pranzo è produzione. Qualunque intervento deve essere chirurgico: modificare soltanto ciò che Paolo richiede e lasciare invariati tutti gli altri meccanismi del sito.

Quando Paolo chiede di cambiare **solo il menù pranzo**, non modificare mai automaticamente:
- loghi, intestazioni, sfondi, bordi, onde, barche, fari, montagne o altri elementi nautici;
- font, colori, dimensioni, allineamenti, spaziature o struttura generale del master;
- pulsanti `− / 0 / +`, loro colori, forma, dimensione o comportamento;
- riepilogo ordine, logica del carrello, WhatsApp, validazioni orarie, reset ordine, contatore, navigazione, traduzioni o altre pagine;
- qualunque funzione già operativa, salvo richiesta esplicita distinta.

L’unico adeguamento funzionale automatico consentito quando cambiano piatti o prezzi è la sincronizzazione dei dati necessari affinché il sistema di preordine legga correttamente nome, quantità, prezzo, subtotale, totale, riepilogo e messaggio WhatsApp.

## Master grafico approvato per il pranzo
Il riferimento grafico attivo è il master approvato il 2 ottobre 2026 e pubblicato tramite `pranzo.html` + `pranzo-master.css`, con queste caratteristiche obbligatorie:

- identità nautica Controcorrente coerente con Antipasti/Primi/Secondi;
- fondo carta/pergamena chiaro;
- testo e titoli in blu nautico;
- intestazione `Controcorrente – Cucina di mare` e titolo `Piatti per il pranzo`;
- fascia `Valido solo per pranzo`;
- data del menù visibile e riferita al giorno di pubblicazione del pranzo;
- layout verticale allungabile dinamicamente in base al numero dei piatti;
- elementi marini di chiusura (onde, mare, faro, barca, montagne) sempre collocati in fondo alla pagina, dopo l’ultimo piatto, senza comprimere le righe;
- ogni piatto disposto in una propria fascia chiaramente separata e sufficientemente alta;
- foto del piatto a sinistra soltanto quando è coerente e corretta; non usare immagini approssimative o di un altro piatto;
- nome, descrizione e allergeni nella zona centrale;
- prezzo in colonna fissa a destra;
- striscia gialla irregolare immediatamente sotto il prezzo;
- sotto il prezzo deve esserci spazio libero sufficiente per i controlli di preordine;
- controlli `− / 0 / +` con la stessa grafica dell’anteprima approvata: `−` chiaro con bordo blu, quantità `0` in riquadro chiaro, `+` in cerchio blu pieno con simbolo bianco;
- non cambiare colore, forma o stile dei controlli salvo esplicita richiesta di Paolo;
- nessun controllo deve sovrapporsi a prezzo, foto, testo, allergeni, separatori o riga successiva;
- su mobile i controlli devono restare leggibili, cliccabili e separati, mantenendo la stessa identità grafica.

## Foto dei piatti
Le foto devono rappresentare il piatto corretto, non una generica preparazione simile.

Regole:
- usare immagini realistiche e coerenti con il piatto effettivo;
- non sostituire una specie di pesce con un’altra;
- per l’orata alla griglia usare un’orata intera alla griglia;
- per il salmone alla griglia usare un **trancio/filetto di salmone rosa-arancio**, non un pesce intero;
- se non esiste una foto adeguata, è preferibile non mostrare la foto piuttosto che pubblicarne una incoerente;
- la modifica di una singola foto non autorizza a rigenerare o cambiare le altre righe.

## Testi e stile
Paolo può fornire i piatti in forma grezza: correggere automaticamente grammatica, punteggiatura, maiuscole/minuscole e stile italiano senza cambiare il significato o gli ingredienti.

Evitare ripetizioni inutili come `con ... con ... con ...` quando una formulazione più naturale mantiene esattamente il contenuto.

Non inventare ingredienti. Se Paolo specifica `poca panna`, mantenerlo esplicitamente nel piatto interessato.

## Allergeni
Usare la simbologia grafica già adottata nella tabella allergeni del sito e il relativo numero regionale.

Regole permanenti:
- mostrare simbolo + numero;
- **non mettere i numeri tra parentesi**;
- non scrivere il nome testuale dell’allergene accanto al piatto;
- non indicare solfiti;
- valutare gli allergeni in base agli ingredienti effettivi del piatto;
- non inventare allergeni in caso di incertezza;
- mantenere lo stesso stile di simboli usato nella pagina/tabella allergeni già pubblicata.

## Asterischi per congelati all’origine
- usare `*` immediatamente dopo l’ingrediente interessato;
- gamberetti, gamberoni e scampi devono avere l’asterisco quando previsto dalla regola interna;
- patatine fritte devono avere l’asterisco quando presenti;
- non mettere l’asterisco dopo il prezzo;
- mantenere la nota `* Ingredienti congelati all’origine` dove prevista.

## Prezzi e preordine
Il prezzo mostrato e quello usato dal sistema d’ordine devono essere sempre identici.

Ogni modifica del menù deve essere verificata affinché:
- il `+` aggiunga esattamente il piatto corretto;
- il `−` riduca la quantità corretta;
- lo `0`/contatore mostri la quantità corrente;
- il riepilogo riporti nome, quantità e prezzo corretti;
- subtotali e totale siano corretti;
- il messaggio WhatsApp riporti gli stessi piatti e prezzi visibili;
- l’ordine venga azzerato secondo il comportamento già stabilito;
- le regole pranzo/cena e le validazioni degli orari restino invariate.

Non riscrivere la logica di preordine se la modifica può essere ottenuta aggiornando soltanto i dati del menù.

## Contenuti fissi della pagina pranzo
Salvo diversa istruzione di Paolo, preservare:
- `Valido solo per pranzo`;
- data del giorno del menù;
- `Prenotazioni entro le 12`;
- indicazione che l’ordine è valido soltanto dopo conferma del Ristorante;
- `Acqua, caffè e coperto inclusi` dove previsto;
- `Fino a esaurimento`;
- link alla tabella allergeni;
- nota sui prodotti congelati all’origine.

## Regola di pubblicazione
Prima di pubblicare una nuova versione del pranzo:
1. leggere questa specifica;
2. confrontare la pagina corrente con il master approvato;
3. modificare soltanto i piatti/dati richiesti;
4. verificare testo, prezzi, allergeni e asterischi;
5. verificare tutti i pulsanti `− / 0 / +`;
6. verificare riepilogo e messaggio WhatsApp;
7. controllare il comportamento mobile;
8. verificare che nessun’altra pagina o funzione sia cambiata;
9. pubblicare soltanto dopo questi controlli.

## Stato attuale
Dal 2 ottobre 2026 il nuovo master grafico pranzo è **attivo**. Le fonti di riferimento operative sono `pranzo.html` e `pranzo-master.css`. La logica di ordine resta quella condivisa di `preordine.js` e non deve essere riscritta per semplici cambi del menù. Le future variazioni del pranzo devono preservare questo master salvo esplicita richiesta di Paolo.

Ultimo aggiornamento di questa specifica: 2 ottobre 2026.
