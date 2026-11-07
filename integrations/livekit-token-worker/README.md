# Migrazione walkie-talkie Controcorrente → LiveKit Cloud

**Stato:** codice preparato sul ramo `feature/livekit-walkie-migration`; **NON ATTIVO SUL SITO PUBBLICO**. Il vecchio walkie Supabase sul ramo `main` rimane operativo.

## Obiettivo
- Grafica identica: ON/OFF, PARLA, numero dei connessi, stato e bip.
- Comunicazione vocale LiveKit, una sola stanza pubblica con identità anonime casuali.
- Clienti: nessun account, password, registrazione o login.
- Radio e walkie alternativi; accendere il walkie spegne la radio, e viceversa tramite `ccWalkie.deactivate()`.
- Nessuna lettura o scrittura del progetto Supabase da parte del walkie LiveKit.
- Conteggio dei connessi dalla lista effettiva dei partecipanti LiveKit (incluso il dispositivo corrente), non tramite presenza Supabase.

## Architettura
`walkie-livekit.js` è il frontend. Usa LiveKit WebRTC per audio durante la pressione del pulsante PARLA (massimo 10 secondi) e un evento dati minuscolo per far suonare il bip di fine trasmissione. Un Worker Cloudflare genera token JWT limitati alla sola stanza `controcorrente-walkie-v1`. Il Worker non archivia audio né messaggi, e il sito non contiene chiavi segrete.

## Attivazione una tantum (a cura dell'amministratore)
1. Aprire https://cloud.livekit.io/, creare un account e un progetto nel piano gratuito **Build**. Nel pannello del progetto ottenere l'URL `wss://...livekit.cloud`, un'API key e il relativo secret. **Non incollare mai l'API secret in chat, nel repository o nel sito pubblico.**
2. Aprire https://dash.cloudflare.com/ e creare un account gratuito Cloudflare Workers. Questo è necessario perché GitHub Pages non può generare token firmati in modo sicuro. Dal computer, con Node/npm e Wrangler:
   ```sh
   cd integrations/livekit-token-worker
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put LIVEKIT_URL
   npx wrangler secret put LIVEKIT_API_KEY
   npx wrangler secret put LIVEKIT_API_SECRET
   ```
   Inserire i valori richiesti **localmente**, nel terminale, senza inserirli in Git.
3. Il Worker restituisce un URL `https://controcorrente-livekit-token.<tuo-subdominio>.workers.dev`. Verificare `/health` e `/getToken` con richieste dal dominio autorizzato. Le richieste di token sono consentite solo dall'origine `https://piol77.github.io` e sono limitate approssimativamente a 12 al minuto per IP, per PoP Cloudflare.
4. Inserire nel sito pubblico, prima del caricamento di `walkie-livekit.js`, questi script, sostituendo il vecchio `walkie.js` (e preservando `site-session.js`):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/livekit-client@2.23.0/dist/livekit-client.umd.min.js"></script>
   <script>window.CC_LIVEKIT_TOKEN_ENDPOINT='https://controcorrente-livekit-token.TUO-SUBDOMINIO.workers.dev/getToken';</script>
   <script src="walkie-livekit.js?v=20261108-livekit-v1"></script>
   ```
   Apportare questa sostituzione in **tutte** le pagine che caricano il walkie. L'URL è pubblico e non è una chiave segreta.
5. Test prima di pubblicare: due Android (uno Xiaomi) con rete mobile, ON entrambi, test audio e bip, contatore da 1 a 2 e ritorno a 1, off/on, radio alternativa, navigazione tra pagine, 10+ minuti a schermo acceso, poi schermo spento. Misurare il consumo LiveKit. Cambiare `main` solo dopo test riusciti.

## Sicurezza e limiti
- Gli ospiti sono anonimi. L'endpoint rilascia token per una sola stanza, pubblicazione solo del microfono, senza webcam, solo con scadenza di 10 minuti per l'uso iniziale.
- **Origine HTTP e rate limit non sostituiscono un'identificazione sicura**: un visitatore anonimo può ottenere token, e un bot può tentare di simulare le richieste. Monitorare i consumi; in caso di abusi, sospendere l'endpoint o aggiungere ulteriore verifica.
- La comunicazione usa WebRTC; la browser autoplay policy e la sospensione in background Android/Chrome possono impedire audio stabile a schermo spento anche dopo la migrazione.
- La tariffazione gratuita LiveKit ha quote mensili di minuti dei partecipanti. Non promettere che il servizio sia illimitato.
- Mai usare il server token di sviluppo di LiveKit per il sito pubblico: consente permessi troppo ampi.
- Nessun file esistente in `main` è stato modificato in questa preparazione. Dopo l'attivazione è possibile rimuovere il vecchio `walkie.js` soltanto in un passaggio separato, dopo una verifica completa.

## Ripristino
In caso di anomalie tornare agli script originali `walkie.js` presenti sul ramo `main`, lasciando invariati CSS, `site-session.js`, radio e altre funzioni.
