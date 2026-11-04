# Controcorrente — Radio Premi (specifica tecnica, NON ATTIVA)

Stato al 4 novembre 2026: **solo preparazione dell'interfaccia pubblica**. Non esiste ancora un backend privato per i riscatti e NON si devono annunciare codici promozionali realmente utilizzabili.

## Regole approvate
- Un codice alfanumerico casuale di **cinque caratteri**, senza caratteri ambigui 0/O, 1/I; un nuovo codice ogni giorno nel fuso Europe/Rome. Non riutilizzare mai i codici già emessi.
- Annunciare ciascun codice **due volte al giorno** in momenti casuali, mantenendo separato il jingle identificativo ricorrente (attualmente ogni due minuti), senza doppioni nei cambi pagina e senza promettere orari fissi.
- Concedere **5 € di sconto** su **un'unica cena dal conto complessivo di almeno 50 €**, qualunque sia il numero delle persone. Valore minimo al lordo dello sconto, importo effettivo verificato alla chiusura del conto.
- Codice valido se inserito **una sola volta nel campo "Allergie e altre note" nel riepilogo di preordine sul sito** entro 7 giorni esatti dall'emissione. Non valgono codici comunicati con una prenotazione avviata direttamente in chat o per telefono; il giorno della cena può essere successivo alla prenotazione, purché il diritto sia stato ottenuto da una prenotazione completa e valida nel periodo.
- Primo cliente con richiesta di prenotazione valida correttamente ricevuta, con codice corretto, vince il diritto condizionato a conferma della prenotazione e raggiungimento di almeno 50 € di conto finale. Una sola applicazione per codice e una per prenotazione; non cumulabile con altri sconti/promozioni. Gestire liberazione della prenotazione annullata e condizioni di decadenza, senza assegnare simultaneamente il diritto a due clienti.
- Nel **Club pubblico** mostrare i codici già usati e scaduti, con data/ora di emissione, scadenza e stato; mai dati personali, contatti, prenotazioni, token o codici non ancora pronunciati alla radio. Fonte pubblica: `radio-premi-public.json`, sola copia depurata dal backend e senza credenziali.
- **Gestione riservata al titolare**: stato completo, data/ora di emissione, primi due annunci, prima richiesta valida, ID prenotazione, conferma o annullamento, chiusura del conto, data utilizzo. Accesso autenticato al backend, mai una semplice pagina `noindex`, link nascosto o un file dentro il repository pubblico.
- Attenzione: il programma Club punti corrente usa pagine HTML non indicizzate ma pubblicamente accessibili a chi conosce il link. Tale sistema NON è sufficiente per proteggere emissioni, premi riscattabili e privilegi di amministrazione.

## Architettura necessaria per l'attivazione
1. Database privato con vincoli univoci, autenticazione per il titolare, permessi di sola lettura per lo stato pubblico, funzioni server di generazione e riscatto **atomico**.
2. Timer server affidabile per una emissione al giorno e una pianificazione persistente di due annunci casuali/die. Se l'ascoltatore non ha la radio accesa durante l'annuncio, non compensare con annunci extra che superino due emissioni giornaliere nel sistema centrale.
3. API pubblica che restituisca esclusivamente informazioni sicure (per esempio, codice annunciato e non ancora usato per poterlo leggere nel jingle, ma non prima del relativo orario; e registro dei soli codici già usati/scaduti).
4. Verifica del codice dalle note nel riepilogo preordine; il sito oggi compone solo un link WhatsApp e non sa se il cliente abbia effettivamente inviato il messaggio. Non contrassegnare come usato definitivamente al clic su "Apri WhatsApp". Distinguere richiesta, prenotazione confermata e sconto effettivamente riconosciuto.
5. Il risponditore WhatsApp locale richiede integrazione separata o conferma amministrativa tramite API protetta, così l'assegnazione del codice segue un evento verificabile.
6. Workflow di sincronizzazione dello stato pubblico e aggiornamento Pages quando mutano i codici, senza informazioni segrete su GitHub Pages.
7. In caso di backend irraggiungibile non emettere, pronunciare o promettere codici validi. Con errori del registro non dare conferme false.

## File preparati
- `club.html`: sezione Radio Premi, regole e griglia dei codici conclusi.
- `radio-premi.js`: vista pubblica, fetch e rendering senza funzioni di scrittura.
- `radio-premi-public.json`: archivio pubblico inizialmente vuoto, `active=false`.

**Non attivare** l'offerta fino a collegamento sicuro del backend e test di doppio riscatto simultaneo, scadenza a sette giorni, riavvio e prenotazione via sito/WhatsApp.
