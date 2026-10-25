# Notifiche Controcorrente — sistema quotidiano (dal 25 ottobre 2026)

La sola notifica ammessa è **un saluto al giorno** agli iscritti con invito a consultare le proposte del giorno sul sito. Nessuna notifica sui singoli cambi di menu, meteo, news, interventi tecnici o comunicazioni straordinarie.

## Unico workflow attivo
- `.github/workflows/notifiche-straordinarie.yml`: il percorso preesistente è mantenuto per preservare l'autorizzazione GitHub OIDC del backend, ma ora il workflow è denominato «Saluto quotidiano Controcorrente» e ha **solo** il trigger `schedule`.
- Esecuzione giornaliera programmata alle 09:00 UTC (10:00 CET / 11:00 CEST, ora di Torino). Gli avvii pianificati di GitHub possono subire ritardi.
- Per ogni giorno locale Europe/Rome, usa `requestId=cc-saluto-YYYYMMDD` deterministico: ritentativi dello stesso giorno risultano duplicati lato server se l'idempotenza è disponibile come previsto.
- Ottiene un token OIDC temporaneo con audience `https://controcorrente-notifiche.superlion129.chatgpt.site` e chiama `POST /admin/notify` del servizio push. Credenziali e chiavi VAPID non sono incluse nel repository.
- Messaggio: saluto e invito al sito; il lunedì specifica la chiusura, sabato e domenica ricordano la prenotazione. URL `https://piol77.github.io/controcorrente/`.
- Nei log cercare «Saluto quotidiano» con `subscribers`, `accepted`, `failed` e `duplicate`. Gli invii accettati non certificano la visualizzazione sul telefono.

## Vecchi invii disabilitati
- `.github/workflows/notifiche-menu.yml` eliminato: nessun trigger push del menu e nessuna chiamata automatica a `POST /sync`.
- `.github/notifiche/invio.json` rimane soltanto come documento storico: modificarlo non invia notifiche.
- Niente `workflow_dispatch`: l'invio manuale dal vecchio workflow non è più disponibile. Ogni nuova eccezione richiede un cambio esplicito della regola master in `AGENTS.md`.
- Lato client, `notifications-sw.js` blocca la visualizzazione oltre il primo avviso nel giorno locale; `notifications.js` gestisce la disiscrizione tramite un secondo clic su «Notifiche ✓», senza reiscrizione automatica.

## Controlli
Verificare GitHub Actions > «Saluto quotidiano Controcorrente» dopo la prima esecuzione prevista. In caso di assenza di invio, controllare esito OIDC, disponibilità del servizio e contatori senza creare notifiche di prova aggiuntive. Il progetto Sites del servizio è `appgprj_6ad8caae661c8191a65613c20478f911`.

Regola vincolante: **non più di una notifica al giorno e nessun altro tipo di push**. Vedi il master `AGENTS.md` per le istruzioni permanenti.
