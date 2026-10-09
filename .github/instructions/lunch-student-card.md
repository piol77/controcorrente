# Tessera Punti Pranzo — studenti

Pagina pubblica: `tessera-punti-pranzo.html`. Voce di navigazione immediatamente dopo Club, prima di Allergeni, in tutte le pagine. Conservare la voce nelle future rigenerazioni. Usare la medesima struttura e grafica del Club: `styles.css`; `tessera-punti-pranzo.css` ingrandisce soltanto il requisito studenti/pranzo e incornicia il QR dimostrativo.

## Regole del programma
- Programma gratuito riservato esclusivamente agli studenti ed esclusivamente al pranzo da martedì a venerdì, esclusi i festivi. Accumulo e utilizzo degli sconti soltanto in questi servizi: esclusi lunedì, sabato, domenica e giorni festivi. Nel titolo della pagina e delle tessere mostrare «Solo a pranzo / Da martedì a venerdì, esclusi i festivi», con «SOLO PER STUDENTI» ben visibile.
- 1 € effettivamente pagato a pranzo = 1 punto. Ogni 100 punti disponibili = 5 € di sconto (5%), utilizzabili dal pranzo successivo, soltanto a pranzo.
- Un riscatto di 5 € consuma 100 punti disponibili, senza diminuire i punti totali guadagnati. Conservare i punti residui. Gli sconti ricevuti sono cumulativi.
- Ogni movimento deve essere un pranzo dello studente o un riscatto dello sconto a pranzo. Non accreditare cene, spese di altri clienti o importi già scontati; accreditare l'importo effettivamente pagato.
- Punti, spese, riscatti, schede e classifica restano completamente separati da Controcorrente Club. Nessun trasferimento automatico di punti o duplicazione delle iscrizioni Club.

## Tessere, link e QR
Seguire `.github/instructions/club-member-qr-privacy.md` per pseudonimi, saldo, storico, QR e privacy, con queste sole sostituzioni: programma «Tessera Punti Pranzo», studenti, servizio pranzo e classifica studenti separata.
- Non creare iscritti reali senza dati comunicati da Paolo. La classifica inizia vuota; `tessera-punti-pranzo-esempio.html` ha dati di fantasia ed è esclusa dalla classifica.
- Per un nuovo studente usare la scheda dimostrativa come master grafico e una tessera Club reale come riferimento operativo: nuovo file `tessera-punti-pranzo-membro-<pseudonimo>-<token-casuale>.html`, con token non prevedibile e `noindex,nofollow,noarchive`. Togliere riferimenti dimostrativi e il QR dimostrativo; mostrare solo movimenti comunicati da Paolo.
- Non linkare mai una tessera reale dalla navigazione, dalla classifica o da pagine pubbliche. Consegnare il QR e il link soltanto a Paolo per lo studente.
- Il nome reale non va nel repository pubblico: inserirlo nel frammento `#nome=<nome-codificato>` del QR e usare `club-member-name.js` e `[data-club-real-name]`, come nel Club. Senza frammento mostrare soltanto lo pseudonimo.
- QR personale: nero su bianco, cornice blu nautica e orlatura dorata; nome reale centrato, pseudonimo, dicitura «Tessera Punti Pranzo · Controcorrente», «Solo per studenti · Solo a pranzo», seguita da «Da martedì a venerdì, esclusi i festivi». QR con nome/frammento consegnato privatamente, non caricato in una pagina pubblica. La pagina è accessibile a chi possiede il link; non è autenticata.
- Il QR di esempio pubblicato non contiene nomi reali né dati di iscritti.

## Classifica e aggiornamenti
- Classifica pubblica solo in `tessera-punti-pranzo.html`: posizione, pseudonimo, punti totali guadagnati, sconti già riscossi cumulativi. Nessun nome reale o collegamento alle tessere.
- La riga di ogni studente usa `data-points-total` e `data-discounts-redeemed`, con le stesse celle/hook del Club. Lo script ordina per punti totali. Alla prima iscrizione rimuovere la riga `.ranking-empty`.
- A ogni iscrizione aggiungere lo studente senza eliminare gli altri; a ogni aggiornamento modificare insieme scheda, movimento, saldi, riga pubblica e posizioni delle tessere. Non modificare `club.html` o tessere Club.
- Verificare: 99 punti = 0 € maturati; 100 = 5 €; 200 = 10 €. Esempio: 487 punti totali e due riscatti = 287 disponibili, 10 € ancora da ricevere e 10 € già ricevuti. In classifica restano 487 punti.
- Conservare URL, pseudonimo e token negli aggiornamenti successivi; non rigenerare QR se il link non cambia. Pubblicare su GitHub Pages e verificare il deployment.
