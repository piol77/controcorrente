# Contatori del sito — ripristino 25 novembre 2026

`index.ts` è il sorgente della funzione Supabase `controcorrente-coperti` (progetto Controcorrente Work). Conserva integralmente lettura e pubblicazione autenticata dei coperti del bot. Il percorso `/counter/{get|hit}/{key}` gestisce esclusivamente le chiavi anonime esistenti di accessi, radio, condivisioni e Natale.

Le nuove registrazioni sono atomiche e persistenti in `cc_counters.totals`. Lo storico CountAPI è separato dagli incrementi successivi al ripristino: `legacy_value` rimane NULL fino a una lettura verificata. Il servizio riprova la lettura storica, al massimo ogni cinque minuti per chiave durante le richieste; la prima importazione valida è definitiva e non cancella gli incrementi nuovi. Una risposta 404 verificata equivale a chiave inesistente, mentre timeout/403/5xx non diventano mai zeri storici. I giorni successivi al 25 novembre partono autonomamente da zero.

Finché lo storico non è disponibile, il frontend dichiara i conteggi nuovi/parziali: non presentarli come totali recuperati. Le basi Natale note (8 adulti e 4 bambini) restano nel frontend e non vanno aggiunte alla colonna `legacy_value`, che contiene soltanto gli incrementi del vecchio servizio. Non azzerare chiavi, browser flag o tabelle per risolvere un errore di visualizzazione. Le letture non incrementano; i clic e la deduplicazione conservano le regole precedenti.

Il backend non conserva identità, IP, prenotazioni o contatti nei contatori. Tabelle private con RLS, funzioni SQL invoker accessibili soltanto a service_role; chiave service role e chiave di pubblicazione del bot restano nelle variabili server. Gli incrementi pubblici sono limitati alle chiavi consentite e all'origine del sito; il controllo Origin non è autenticazione contro client arbitrari, come per il precedente servizio pubblico.

`migration.sql` documenta l'installazione iniziale. Non rieseguirlo su una base già inizializzata. Per le modifiche future usare migrazioni incrementali senza ricreare o cancellare lo storico.
