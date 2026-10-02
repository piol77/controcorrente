# Controcorrente Club — Master QR personale e procedura

Questa specifica è interna al repository e disciplina tutte le future tessere personali del Controcorrente Club. Non deve essere linkata o mostrata nel sito pubblico.

## Principio permanente di privacy
- Il sito pubblico e la classifica devono mostrare soltanto lo pseudonimo Club e i dati pubblici previsti.
- Il nome reale del cliente non deve comparire in `club.html`, nella classifica, nel nome del file della tessera, negli script condivisi o in altri contenuti pubblicamente indicizzati.
- La pagina personale deve avere `noindex,nofollow,noarchive` e non deve essere linkata dalla classifica pubblica.
- La pagina personale deve essere raggiungibile soltanto tramite il relativo URL/QR personale o conoscendo direttamente il suo URL.
- Sul sito, in assenza del QR/frammento personale, deve restare visibile soltanto lo pseudonimo.

## Master grafico definitivo del QR personale
Il layout approvato il 2 ottobre 2026 è il riferimento permanente per tutti i QR personali futuri.

Il QR consegnato al cliente deve avere:
1. QR code nero su fondo bianco, grande, nitido e facilmente scansionabile;
2. cornice esterna arrotondata in blu nautico Controcorrente;
3. separatore/orlatura dorata coerente con la grafica Club;
4. sotto il QR, **nome reale del cliente ben visibile e centrato**;
5. sotto il nome reale, **pseudonimo Club**;
6. sotto lo pseudonimo, dicitura **Controcorrente Club**;
7. font leggibile e coerente con l'identità visiva del sito;
8. nessun altro dato personale stampato sul QR salvo esplicita richiesta.

Esempio approvato:
- nome reale: `Fabio e Annalisa`;
- pseudonimo: `Onda 37`;
- dicitura: `Controcorrente Club`.

Non cambiare questo layout, colori, ordine delle informazioni o gerarchia salvo esplicita richiesta di Paolo.

## Nome reale nel collegamento QR
- Il nome reale deve essere inserito anche nell'URL codificato nel QR personale usando il frammento URL `#nome=...`.
- Esempio generico: `club-membro-<pseudonimo>-<token>.html#nome=<nome-url-encoded>`.
- Il frammento dopo `#` non viene inviato al server HTTP: viene letto localmente dal browser della pagina personale.
- La pagina personale deve leggere `nome` da `location.hash` e mostrarlo come `Tessera intestata a: ...` / `Intestatario: ...` solo quando il frammento è presente.
- Se la pagina viene aperta senza il QR/frammento, il nome reale non deve comparire: deve restare visibile soltanto lo pseudonimo.
- Non salvare il nome reale come testo hard-coded nell'HTML pubblico o in file dati pubblici.

## Dati pubblici e dati della tessera personale
### Pubblici nella classifica
Mostrare soltanto:
- posizione;
- pseudonimo;
- punti totali guadagnati.

Non mostrare mai il nome reale nella classifica.

### Nella scheda personale aperta dal QR
Mostrare:
- pseudonimo;
- nome reale soltanto quando presente nel frammento del QR;
- spesa totale registrata;
- punti totali guadagnati;
- punti disponibili;
- sconti maturati/da ricevere;
- sconti già ricevuti;
- posizione in classifica;
- storico dei movimenti con data, eventuale ora, tipo di movimento, importo e punti.

## Regole punti e sconti
- `1 € effettivamente pagato = 1 punto`.
- `100 punti disponibili = 5 € di sconto`.
- Lo sconto è utilizzabile dalla cena successiva.
- Quando viene riscosso uno sconto, i punti disponibili diminuiscono del relativo blocco di 100 punti.
- I punti totali guadagnati non diminuiscono dopo il riscatto e restano quelli usati per la classifica.
- La spesa totale registrata rappresenta gli importi effettivamente registrati sulla tessera.

## Procedura standard per creare una nuova tessera
Per ogni nuovo cliente o coppia registrata come profilo unico:
1. raccogliere il nome reale indicato da Paolo;
2. creare uno pseudonimo breve, facile da ricordare e non identificativo;
3. creare una pagina personale con nome file non identificativo e token non facilmente prevedibile;
4. aggiungere `noindex,nofollow,noarchive` alla pagina personale;
5. non linkare la pagina personale dalla classifica o dalla navigazione pubblica;
6. registrare spesa iniziale, punti, sconti e primo movimento con data/ora quando disponibili;
7. aggiornare la classifica pubblica usando soltanto pseudonimo e punti totali;
8. generare il QR con l'URL della pagina personale + `#nome=<nome reale codificato>`;
9. costruire il QR grafico usando il master definitivo descritto sopra, con nome reale stampato visibilmente sotto il codice;
10. verificare che il QR apra la pagina corretta;
11. verificare che con il QR il nome reale venga mostrato nella scheda;
12. verificare che aprendo la stessa pagina senza frammento il nome reale non compaia;
13. verificare che la classifica rimanga anonima;
14. consegnare a Paolo il QR semplice e, se utile, la tessera grafica completa.

## Aggiornamenti successivi della tessera
Quando Paolo comunica una nuova visita/spesa:
1. aggiungere il nuovo movimento alla scheda personale;
2. aumentare spesa totale e punti totali della cifra effettivamente pagata;
3. aggiornare i punti disponibili tenendo conto di eventuali riscatti;
4. calcolare gli eventuali sconti maturati;
5. aggiornare la posizione in classifica in base ai punti totali;
6. aggiornare la classifica pubblica solo con pseudonimo e nuovo totale punti;
7. non rigenerare il QR se l'URL personale non cambia;
8. non cambiare pseudonimo o token salvo esplicita richiesta.

## Controlli prima della pubblicazione
Prima di pubblicare o aggiornare una tessera verificare sempre:
- nessun nome reale presente in classifica;
- nessun nome reale nel nome file o in contenuti pubblicamente indicizzati;
- pagina personale `noindex,nofollow,noarchive`;
- punti e sconti coerenti con le regole Club;
- storico dei movimenti corretto;
- QR leggibile e scansionabile;
- nome reale visibile sul QR grafico consegnato al cliente;
- pseudonimo visibile sul QR grafico;
- apertura corretta della pagina dal QR;
- assenza del nome reale quando la pagina è aperta senza frammento `#nome=`.

## Limite di riservatezza
Questa soluzione è basata sul possesso del QR/link completo, non su autenticazione. Chiunque riceva una copia del QR o dell'URL completo può vedere il nome e la tessera. Non descriverla come protezione con password o accesso autenticato.

Ultimo aggiornamento: 2 ottobre 2026.