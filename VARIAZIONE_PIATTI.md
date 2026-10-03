# Script breve per cambiare i piatti di Controcorrente

Copia questo testo e completa soltanto la sezione e le modifiche:

> Nel sito Controcorrente, leggi e rispetta AGENTS.md e il menù attuale. Modifica solo la sezione **[pranzo / cena / offerta del giorno]** come segue: **[piatti da togliere, aggiungere o sostituire; ingredienti; prezzi; quantità; eventuali ingredienti congelati]**. Mantieni invariati tutti gli altri piatti, prezzi, logo, sfondi, font, colori, decorazioni, simboli, layout, navigazione, pulsanti e funzionamento. Correggi refusi e aggiungi descrizioni brevi, senza inventare ingredienti. Ogni scheda di piatto nei menù italiani deve avere una foto realistica e coerente con gli ingredienti, nello stesso formato e nella stessa posizione delle altre; riusa una foto approvata quando il piatto compare in più sezioni e aggiungi quella mancante senza cambiare il resto; conserva l’avviso in grassetto sulle foto generate da IA. Ricalcola gli allergeni dalla ricetta reale, con i simboli e numeri previsti, senza parentesi né solfiti; non indovinare ingredienti o allergeni incerti. Metti un solo asterisco subito dopo ogni ingrediente congelato: sempre gamberetti, gamberoni, gamberone, scampi e patatine fritte. Conserva la nota degli asterischi e il link alla tabella allergeni. Aggiorna menu-data.json, il menù visibile, le traduzioni EN/ZH e il prezziario degli ordini insieme: nomi, quantità, riepilogo, totali e messaggio WhatsApp devono coincidere. Se cambio il pranzo, aggiorna la data alla data della modifica in Europe/Rome, mai alla visita; mantieni “Valido solo per pranzo”, prenotazione entro le 12:00, ½ litro d’acqua, caffè e coperto inclusi e fino a esaurimento. Per cena e offerte mantieni “Valido solo per cena”, prezzi, inclusioni e condizioni esistenti. Mantieni prezzi e controlli compatti nelle loro colonne senza coprire foto, testo, simboli o altre righe; niente controlli su bibite e vini. Conserva la conferma obbligatoria del ristorante, gli orari di prenotazione, il blocco fra pranzo e cena, il riepilogo, Azzera tutto, l’azzeramento al click WhatsApp e l’assenza del campo telefono; WhatsApp diretto solo nei Contatti, numero 327 229 2006. Non modificare contatore (una visita per sessione della scheda), Club, QR, saldi, movimenti o dati personali. Verifica prezzi e ordine, traduzioni, immagini, allergeni, asterischi e resa su telefono; conserva una versione recuperabile, aggiorna le versioni dei file modificati, pubblica sul repository piol77/controcorrente con GitHub Pages e verifica il sito online. Non cambiare hosting e non usare Netlify. Non fare altri cambiamenti.

## Uso tecnico

La fonte dei contenuti è `menu-data.json`. Dopo aver aggiornato i dati e inserito le foto, sincronizzare solo le sezioni necessarie:

```bash
python3 tools/aggiorna-menu.py offerta
python3 tools/aggiorna-menu.py bibite
python3 tools/aggiorna-menu.py cena
python3 tools/aggiorna-menu.py pranzo
```

Si possono indicare più sezioni nello stesso comando. Lo script conserva la struttura delle pagine e le procedure d’ordine; per le offerte le traduzioni dei piatti sono nel campo `translations`. Non genera immagini e non pubblica automaticamente: occorre verificare il risultato prima del commit.

Il vecchio `tools/render-menu.py` ricostruisce il restyling dalle copie storiche: non usarlo per manutenzione ordinaria o variazioni dei piatti. Le istruzioni complete e le eccezioni autorizzate restano in `AGENTS.md`.
