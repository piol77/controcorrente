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
- **punti totali guadagnati**;
- **sconti già riscossi cumulativi**, espressi in euro.

Non mostrare mai il nome reale nella classifica.

### Regola permanente dei punti e degli sconti pubblici
- La colonna `Punti totali` deve mostrare sempre i punti complessivamente guadagnati dal cliente nel periodo di riferimento della classifica, non i punti disponibili residui.
- Il riscatto di uno sconto non riduce i punti totali mostrati nella classifica.
- La colonna `Sconti già riscossi` deve mostrare la somma cumulativa in euro di tutti gli sconti effettivamente utilizzati dal cliente.
- Il valore degli sconti già riscossi non si azzera dopo un nuovo acquisto e non diminuisce: aumenta soltanto quando viene effettivamente utilizzato un nuovo sconto.
- Esempio: un cliente che ha già utilizzato due sconti da 5 € deve mostrare `10 €` nella colonna `Sconti già riscossi`.
- In `club.html` ogni riga reale usa `data-points-total` e `data-discounts-redeemed`; lo script della classifica mostra dinamicamente i valori, riordina i clienti per punti totali e ricalcola la posizione.
- Quando si aggiorna una tessera, aggiornare nella stessa operazione anche questi due valori pubblici, mantenendo la classifica anonima.

### Regola permanente della classifica cumulativa
- La classifica deve contenere **tutti i soci/clienti reali registrati nel Club**, ciascuno con il proprio pseudonimo.
- Quando viene creata una nuova tessera, **aggiungere** il nuovo pseudonimo alla classifica senza eliminare o sostituire i clienti reali già presenti.
- Quando cambia il totale punti o il totale degli sconti riscossi di un cliente, aggiornare la sua riga e ricalcolare l'ordine della classifica.
- Ordinare la classifica per **punti totali guadagnati**, dal valore più alto al più basso.
- La posizione deve essere ricalcolata dopo ogni nuova registrazione o aggiornamento punti.
- Eventuali righe dimostrative/esempi non devono sostituire né falsare la classifica reale e, quando la classifica reale viene usata operativamente, possono essere rimosse o chiaramente escluse dal conteggio.
- La classifica resta sempre anonima: nessun nome reale deve comparire, anche quando vengono aggiunti nuovi clienti.

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
- Ogni sconto effettivamente utilizzato deve essere aggiunto al totale cumulativo `Sconti già riscossi` della classifica pubblica.
- La spesa totale registrata rappresenta gli importi effettivamente registrati sulla tessera.

## Procedura standard per creare una nuova tessera
Per ogni nuovo cliente o coppia registrata come profilo unico:
1. raccogliere il nome reale indicato da Paolo;
2. creare uno pseudonimo breve, facile da ricordare e non identificativo;
3. creare una pagina personale con nome file non identificativo e token non facilmente prevedibile;
4. aggiungere `noindex,nofollow,noarchive` alla pagina personale;
5. non linkare la pagina personale dalla classifica o dalla navigazione pubblica;
6. registrare spesa iniziale, punti, sconti e primo movimento con data/ora quando disponibili;
7. aggiungere il nuovo pseudonimo alla classifica pubblica senza rimuovere i clienti reali già registrati, impostando `data-points-total` sui punti totali e `data-discounts-redeemed` sul totale cumulativo degli sconti già riscossi, inizialmente `0` se non ci sono riscatti;
8. riordinare tutti per punti totali;
9. generare il QR con l'URL della pagina personale + `#nome=<nome reale codificato>`;
10. costruire il QR grafico usando il master definitivo descritto sopra, con nome reale stampato visibilmente sotto il codice;
11. verificare che il QR apra la pagina corretta;
12. verificare che con il QR il nome reale venga mostrato nella scheda;
13. verificare che aprendo la stessa pagina senza frammento il nome reale non compaia;
14. verificare che la classifica rimanga anonima e contenga tutti i clienti reali registrati;
15. consegnare a Paolo il QR semplice e, se utile, la tessera grafica completa.

## Aggiornamenti successivi della tessera
Quando Paolo comunica una nuova visita/spesa o un riscatto:
1. aggiungere il nuovo movimento alla scheda personale;
2. aumentare spesa totale e punti totali della cifra effettivamente pagata;
3. aggiornare i punti disponibili tenendo conto di eventuali riscatti;
4. calcolare gli eventuali sconti maturati;
5. se uno sconto viene effettivamente usato, aggiungerne l'importo al totale cumulativo degli sconti già riscossi;
6. aggiornare la posizione in classifica in base ai punti totali;
7. aggiornare la classifica pubblica mantenendo tutte le altre tessere reali presenti, aggiornando punti totali e sconti riscossi cumulativi e riordinando per punti totali;
8. non rigenerare il QR se l'URL personale non cambia;
9. non cambiare pseudonimo o token salvo esplicita richiesta.

## Controlli prima della pubblicazione
Prima di pubblicare o aggiornare una tessera verificare sempre:
- nessun nome reale presente in classifica;
- nessun nome reale nel nome file o in contenuti pubblicamente indicizzati;
- pagina personale `noindex,nofollow,noarchive`;
- punti totali pubblici distinti dai punti disponibili;
- totale cumulativo degli sconti già riscossi corretto;
- punti e sconti della scheda privata coerenti con le regole Club;
- storico dei movimenti corretto;
- classifica comprensiva di tutti i clienti reali registrati e ordinata correttamente per punti totali;
- QR leggibile e scansionabile;
- nome reale visibile sul QR grafico consegnato al cliente;
- pseudonimo visibile sul QR grafico;
- apertura corretta della pagina dal QR;
- assenza del nome reale quando la pagina è aperta senza frammento `#nome=`.

## Limite di riservatezza
Questa soluzione è basata sul possesso del QR/link completo, non su autenticazione. Chiunque riceva una copia del QR o dell'URL completo può vedere il nome e la tessera. Non descriverla come protezione con password o accesso autenticato.

Ultimo aggiornamento: 2 ottobre 2026.
