# Controcorrente Club — Regola permanente nome reale nel QR

Questa specifica è interna al repository e disciplina tutte le future tessere personali del Controcorrente Club.

## Principio
- La classifica pubblica deve mostrare soltanto lo pseudonimo Club e i dati pubblici previsti.
- Il nome reale del cliente non deve essere scritto in `club.html`, nella classifica, nel nome del file della tessera, nel repository, negli script condivisi o in altri contenuti pubblicamente indicizzati.
- La pagina personale deve avere `noindex,nofollow,noarchive` e non deve essere linkata dalla classifica pubblica.

## Nome reale nel QR
- Il nome reale deve essere contenuto esclusivamente nell'URL codificato nel QR personale, usando il frammento URL `#nome=...`.
- Esempio generico: `club-membro-<pseudonimo>-<token>.html#nome=<nome-url-encoded>`.
- Il frammento dopo `#` non viene inviato al server HTTP: viene letto localmente dal browser della pagina personale.
- La pagina personale deve leggere `nome` da `location.hash` e mostrarlo come `Tessera intestata a: ...` / `Intestatario: ...` solo quando il frammento è presente.
- Se la pagina viene aperta senza il QR/frammento, il nome reale non deve comparire: deve restare visibile soltanto lo pseudonimo.
- Non salvare il nome reale come testo hard-coded nell'HTML o in file dati pubblici.

## Limite di riservatezza
Questa soluzione è basata sul possesso del QR/link completo, non su autenticazione. Chiunque riceva una copia del QR o dell'URL completo può vedere il nome e la tessera. Non descriverla come protezione con password o accesso autenticato.

## Aggiornamenti futuri
Per ogni nuova tessera:
1. creare uno pseudonimo breve e memorabile;
2. pubblicare solo lo pseudonimo nella classifica;
3. creare una pagina personale non linkata e `noindex`;
4. generare il QR con l'URL della pagina + `#nome=<nome reale codificato>`;
5. verificare che senza frammento il nome reale non compaia;
6. verificare che con il QR il nome reale venga mostrato correttamente;
7. mantenere invariati punti, sconti e storico secondo le regole Club.

Ultimo aggiornamento: 2 ottobre 2026.