# Dicitura servizio — Menù cena, Offerta del giorno e Menù pranzo

Regola master permanente — aggiornata 2026-10-04.

- Questa istruzione prevale su qualsiasi formulazione precedente diversa da quelle riportate qui sotto.
- `cena.html` e `offerta.html` devono usare la stessa dicitura grafica, con lo stesso stile, spaziatura e trattamento visivo già approvato.
- Testo esatto per Menù cena e Offerta del giorno:
  - `Valido solo a cena,`
  - `o a pranzo nei festivi`
- Testo esatto per Menù pranzo:
  - `Valido solo a pranzo,`
  - `nel giorno sotto indicato`
- `Offerta del giorno` segue integralmente le stesse regole temporali e di servizio del Menù cena.
- La validazione dell’ordine avviene esclusivamente nel riepilogo, in base alla data e all’orario scelti dal cliente: cena dalle 18:00; pranzo 11:00–15:00 nei festivi per Menù cena/Offerta del giorno; Menù pranzo solo nel giorno indicato e con le esclusioni previste. Non bloccare la selezione al pulsante `+`.
- I popup bloccanti devono mantenere tutto il resto del messaggio e usare le stesse formulazioni: `solo a cena, o a pranzo nei festivi` per cena/offerta; `solo a pranzo, nel giorno sotto indicato` per il pranzo.
- Nei popup bloccanti non riportare fasce orarie o orari specifici: le regole orarie restano operative nella validazione, ma non devono essere mostrate nel testo del messaggio di errore.
- È vietato confermare una prenotazione con data e orario anteriori al momento corrente. Nel riepilogo, dopo che il cliente ha inserito giorno e orario, confrontare la data/ora richiesta con il momento corrente nel fuso `Europe/Rome`; se la richiesta è retroattiva, bloccare l’invio prima degli altri controlli mostrando esclusivamente il messaggio `È impossibile prenotare retroattivamente.`. Non azzerare il carrello per questo controllo.
- Queste correzioni non autorizzano modifiche ad altri contenuti, prezzi, layout, immagini, pulsanti o funzionamenti del sito.
