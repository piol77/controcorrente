# Avvisi straordinari — integrazione amministrativa (21 ottobre 2026)

## Stato
- Predisposto il workflow `.github/workflows/notifiche-straordinarie.yml` sul branch `main`.
- **NON abilitato l'invio finché non è disponibile il server amministrativo.**
- Restano invariati sito pubblico, notifiche automatiche dei menù e pulsante Notifiche.
- Il servizio push già utilizzato dal sito è `https://controcorrente-notifiche.superlion129.chatgpt.site` (progetto Sites `appgprj_6ad8caae661c8191a65613c20478f911`).

## Lavoro da completare nel progetto Sites (es. con ChatGPT Work / Cloud Browser)
Implementare esclusivamente `POST /admin/notify`:
1. Autorizzazione obbligatoria con `Authorization: Bearer <token>`; token casuale lungo e segreto in variabile d'ambiente del servizio, confronto a tempo costante. Mai esporre token, subscription o VAPID in GitHub, nel sito o nei log.
2. Accettare `{requestId,kind:"manual",body,url,expiresAt}`. Convalidare: requestId 8–120 caratteri alfanumerici/trattino/underscore; body tra 1 e 180 caratteri; URL del sito Controcorrente; expiresAt come millisecondi UTC, strettamente futuro e non oltre 10 minuti. Rifiutare eventuali campi non ammessi se opportuno.
3. Idempotenza durevole su `requestId`, anche con ritentativi e richieste simultanee. Per ogni richiesta valida non duplicata, aggiornare `/feed` con `event:{kind:"manual",body,url,createdAt,expiresAt}` *prima* dei push e inviare una sola notifica a ogni browser effettivamente iscritto. La funzione di invio deve riusare l'infrastruttura VAPID e gli endpoint già presenti senza alterare `/sync`.
4. Rispondere con JSON dei conteggi `{subscribers,accepted,failed,duplicate}`. Una risposta accettata dal provider non certifica la visualizzazione. Gestire iscrizioni scadute, protezione anti-spam, limitazione di frequenza e scadenza; non salvare nuovi avvisi dopo la scadenza.
5. Distribuire il servizio e verificare senza inviare notifiche indesiderate.

## GitHub Actions — configurazione una tantum
Creare il secret di repository `CC_PUSH_ADMIN_TOKEN` identico al token del server. In caso di secret assente il workflow si ferma **senza inviare nulla**.

Invio da chat con connettore GitHub: creare/aggiornare `.github/notifiche/invio.json` su `main`, con un `requestId` *nuovo* a ogni messaggio, `body` in italiano e `expiresAt` UTC ISO 8601 entro 10 minuti (preferibilmente 3). Il push del solo file attiva l'invio. Non usare questo flusso per aggiornamenti del menù.

Esempio di struttura (non creare il file se non è davvero richiesto un invio):
```json
{
  "requestId": "avviso-YYYYMMDDTHHMMSSZ-unico",
  "body": "Questa sera siamo in ritardo di circa 10 minuti. Ci scusiamo per l'attesa!",
  "expiresAt": "YYYY-MM-DDTHH:MM:SSZ"
}
```
Ogni avviso è una richiesta autonoma, **mai** da accodare per il futuro: se è scaduto, il workflow non invia nulla. In alternativa si può avviare manualmente il workflow in Actions inserendo messaggio e TTL.

## Verifica
Controllare il risultato della Actions `Avvisi straordinari Controcorrente` e i conteggi restituiti dal backend; mai dichiarare invio riuscito sulla sola base del commit GitHub.
