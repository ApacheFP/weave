# WEAVE prodotto

Demo React della filiera tessile descritta in `filiera_tessile_input_output_dpp (1).docx`: 15 moduli, 7 servizi integrati e uno spazio Atelier con più capi. Il capo principale è **Giacca Atelier / GJ-0421 / Autunno-Inverno 2027**; Giacca Studio è un secondo esempio disponibile.

## Avvio

```sh
npm install
npm run dev
```

`npm run build` compila la versione distribuibile. Il prodotto è front-end: login, dati, AI, approvazioni e pubblicazione del passaporto sono dimostrativi. Non vengono chiamati backend o API AI. Le modifiche rimangono nella sessione React durante la navigazione; uscita e ricaricamento azzerano la demo. I dati di accesso non vengono trasmessi o salvati.

## Accesso e carosello

Login/signup in una card bianca centrata, font Stay With Me, password mostra/nascondi e hover ocra. Il menu profilo usa un ritratto fittizio Imagegen, consente di modificare nome, cognome ed email, gestire preferenze simulate e uscire.

Il carosello conserva il motore WebGL del riferimento `carousel.html`, particelle, trascinamento e scorrimento circolare. Il passaggio Moduli/Servizi Integrati usa zoom in/out. Le card sono in bianco caldo e beige, con illustrazioni WebP statiche e titoli Matcha Style.

La fascia inferiore della card attiva contiene **60% testo, 10% spazio e 30% pulsante Entra**. Il pulsante è una pillola scura con hover ocra, resta dentro la card e non applica blur o spostamenti. Il testo della fascia è HTML per mantenerlo nitido. L’overlay segue la geometria della card tramite `onFrame` nel motore; durante lo scorrimento si nasconde per evitare che resti sopra una card diversa.

Il motore limita il DPR a 1,5 desktop e 2 mobile; a DPR 2 le texture sono 1280×1600, altrimenti 1024×1280. Multisampling 2 campioni, render target senza mipmap. A carosello fermo il wrapper non applica trasformazioni CSS. È disponibile una lista di accesso ai moduli anche senza WebGL e per lettori di schermo.

## Dashboard

Navigazione hash `#/moduli/ID`, cronologia del browser e ritorno al carosello con gruppo e posizione conservati. La shell comune ha header WEAVE, profilo, breadcrumb e footer. La console riprende i token, la sidebar compatta e riducibile, i pannelli, le statistiche unite, i pulsanti e le tabelle di **Prova1**. File, miniature, metadati e finestre di modifica seguono i pattern di **Prova2**. Il font dell’intera console è **Geist**, servito localmente; i titoli scritti a mano restano nel carosello e nel logo. Su mobile la navigazione si apre dal menu e le aree operative si dispongono in una colonna.

In cima alla sidebar il selettore mostra il capo corrente: permette di cercare e cambiare capo oppure crearne uno nuovo. **Capi** apre la lista con ricerca e azioni. **Nuovo capo** raccoglie nome, codice univoco, collezione e quantità; può duplicare specifiche e ordini del capo corrente. Ogni capo ha dati, servizi, cronologia e conversazioni separati, conservati durante la sessione. I codici di prodotto, ordine, campione e lotto nelle viste e negli export seguono il capo selezionato. Il profilo rimane comune.

La ricerca globale si apre da **Cerca** o **⌘/Ctrl K**. Ogni modulo ha le viste **Spazio di lavoro**, **Servizi integrati** (solo quelli pertinenti) e **Attività**. La sidebar e il contenuto continuano a funzionare anche se una vista genera un errore, grazie a un confine di errore locale.

| Modulo | Azioni della demo |
| --- | --- |
| 1 · Ideazione e Design | Brief modificabile, moodboard in griglia/elenco con immagini locali, tre varianti, palette e checklist |
| 2 · Disegno Tecnico | Carica schizzo, genera tavola preparata, fronte/retro, misure modificabili, tech pack PDF reale di 4 pagine |
| 3 · Materiali e BOM | Tre tessuti alternativi, consumi e prezzi accessori modificabili, ricerca ed export CSV |
| 4 · Modellistica | Selezione dei pezzi, margine, tacche, drittofilo e revisioni |
| 5 · Sviluppo Taglie | Sei taglie, viste sovrapposte/singole, regole, tabella ed export |
| 6 · Prototipazione | Fitting, checklist, approvazione campione e versione del modello |
| 7 · Piazzamento | Larghezza, quantità, ottimizzazione simulata, consumi/scarto/costo e marker SVG |
| 9 · Costificazione | Cursori prezzo tessuto, margine, quantità e tariffa, tre scenari, approvazione listini ed export |
| 10 · Pianificazione | Calendario navigabile, timeline, laboratorio, capacità, priorità e date validate |
| 11 · Procurement | Ricerca, filtri, modifica stati/date, creazione acquisti ed export |
| 12 · Produzione | Avanzamento, sessioni, pausa/ripresa, scarto reale e registrazione capi |
| 13 · Qualità | Difetto evidenziato, azione correttiva, ricontrollo e rilascio rilavorazioni |
| 19 · DPP | Viste consumatore/brand/autorità, tracciabilità, cura, eventi di vita, export JSON e pubblicazione simulata |
| 21 · Context Engine | Mappa navigabile, ricerca, rischi ed eventi delle modifiche |
| 22 · Decision Intelligence | Chat autonoma, domande suggerite, scenari e decisioni approvabili |

## Servizi integrati

`src/dashboard/services.jsx` associa esplicitamente i servizi ai moduli. Ideazione, ad esempio, include segnali wholesale/retail e generazione dei concept; non include magazzino, logistica o industrializzazione.

- **Industrializzazione:** 24 operazioni aggregate in 8 gruppi, macchine, tempi modificabili ed export.
- **Magazzino:** materiali e residui in BOM/Acquisti; stock per taglia, lotto e ubicazione per il capo finito.
- **Logistica:** tracking, conferme di consegna e spedizioni vincolate a stock e ordine.
- **Wholesale:** retailer, listino, condizioni e nuovi ordini entro la quantità disponibile.
- **Retail:** vendite, feedback, sell-through, listino e registrazione di vendite simulate.
- **Post-vendita:** riparazioni, resi, seconda vita e riciclo nella cronologia DPP. Scenari futuri marcati separatamente.
- **Intelligence Layer:** output preparati specifici del modulo, generazioni simulate, dati del risultato ed export. Le raccomandazioni appartengono alla chat decisionale.

Ogni dashboard operativa ha **Assistente**, una chat con contesto e cronologia propri. L’assistente risponde sui dati correnti: tessuti, misure, taglie, fitting, piazzamento, costi, ritardi, produzione, qualità o DPP. Proposte di tessuto, listino, marker, consegna prioritaria e ricontrollo modificano la demo dopo l’approvazione.

## Dati connessi

`src/dashboard/DemoContext.jsx` conserva dati e cronologia connessi per ciascun capo. La base rispetta il documento: materiali **38,92 €/capo**, lavorazione **48 min × 40 €/h = 32 €**, logistica **1,50 €**, costo industriale **72,42 €**, listini **160/320 €**, ordine **500 capi**, produzione **320**, scarto teorico **14%** (11% ottimizzato), scarto reale **15%**, qualità **86/100**.

La fotografia temporale è coerente: 12 dei 320 capi sono in rilavorazione; 308 sono approvati, 160 distribuiti wholesale e 112 retail, lasciando **36 disponibili**. I 320 capi wholesale del documento sono ordini confermati, di cui 160 ancora da evadere. Nuove vendite e spedizioni rispettano le disponibilità.

Cambiare tessuto aggiorna composizione, fornitore, BOM, acquisti, costo e DPP. Ottimizzare il marker aggiorna consumi e fabbisogni. Produzione e chiusura di una non conformità aggiornano lo stock. Le azioni compaiono nel Context Engine. La scelta del ruolo DPP è una presentazione dimostrativa, non un’autorizzazione reale.

Il QR in `public/illustrations/dpp-qr.svg` è reale e punta al passaporto **locale** `http://127.0.0.1:5174/#/moduli/19`. Per pubblicarlo va rigenerato con l’URL pubblico. Nessuna dipendenza QR aggiunta all’app.

## Asset e font

Le 22 illustrazioni Imagegen condividono lo stile bianco/grigio clay/paper: `public/illustrations/module-01.webp` … `module-22.webp`. Nessuna GIF nel runtime. Originali e prompt in `assets/animation-frames/`; avatar e prompt in `assets/profile/`.

- **Geist / Geist Mono** per la console, come nelle prove: licenza SIL OFL in `public/fonts/geist-LICENSE.txt`.
- **Matcha Style** per titoli delle card del carosello: [DaFont](https://www.dafont.com/it/matcha-style.font), condizioni in `public/fonts/matcha-LICENSE.txt`.
- **Stay With Me** per logo e accesso: condizioni in `public/fonts/FONT-LICENSE.txt`. La versione scaricata è per uso personale; l’autore richiede una [licenza commerciale](https://originfonts.com/product/stay-with-me/) per uso commerciale/promozionale.

La build Vite è stata compilata. Non sono stati aggiunti o eseguiti test automatici per questa implementazione.

### Correzioni di navigazione

Materiali e BOM importava l’icona di ricerca senza dichiararla: l’import è stato corretto. L’effetto di scorrimento della chat ora scarta esplicitamente il valore restituito dal browser, evitando errori React al cambio di vista. Le 15 pagine e le 7 tipologie di servizio sono state aperte durante il debugging dell’anteprima locale; creazione del capo e salvataggio del brief sono stati riprodotti nella demo.
