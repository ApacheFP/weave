# WEAVE prodotto

Demo React della filiera tessile descritta in `filiera_tessile_input_output_dpp (1).docx`: 15 moduli, 7 servizi integrati e uno spazio Atelier. La capsule presenta **tre prodotti**, con **Maglia Luce** come capo iniziale e prima scheda: **Avorio / MG-0425**, **Salvia / MG-0426** e **Grafite / MG-0427**, nello stesso filato merino e cashmere. Completano la linea **Pantalone Riva / PT-0423 / Pietra** e **Borsa Trama / BG-0424 / Argilla**. I capispalla sono stati rimossi dalla demo.

## Avvio

```sh
npm install
npm run dev
```

`npm run build` compila la versione distribuibile. Il prodotto è front-end: login, AI e pubblicazione del passaporto sono dimostrativi. Non vengono chiamati backend o API AI. Capi, attività, conversazioni, profilo e preferenze sono salvati in IndexedDB su questo browser e ripristinati dopo ricaricamento o uscita. Il salvataggio riguarda la stessa origine web e non sincronizza dispositivi o utenti. Il login resta dimostrativo e va ripetuto dopo il ricaricamento; i dati di accesso non vengono trasmessi o salvati. Contratti, recupero degli errori e limiti sono descritti in [docs/architecture-local.md](docs/architecture-local.md).

Su Vercel la root del repository è `.`. `vercel.json` seleziona Vite, esegue `npm run build` e pubblica `dist`, anche se il progetto era stato configurato con il preset Create React App (`build`).

## Accesso e carosello

Login/signup in una card bianca centrata, font Stay With Me, password mostra/nascondi e hover ocra. Il menu profilo usa un ritratto fittizio Imagegen, consente di modificare nome, cognome ed email, gestire preferenze simulate e uscire.

Il carosello conserva il motore WebGL del riferimento `carousel.html`, particelle, trascinamento e scorrimento circolare. Il passaggio Moduli/Servizi Integrati usa zoom in/out. Le card sono in bianco caldo e beige, con illustrazioni WebP statiche e titoli Matcha Style.

La fascia inferiore della card attiva contiene **60% testo, 10% spazio e 30% pulsante**: Entra nei moduli, Scopri di più nei servizi. Il pulsante è una pillola scura con hover ocra, resta dentro la card e non applica blur o spostamenti. Il testo della fascia è HTML per mantenerlo nitido su entrambi i caroselli. L’overlay segue la geometria della card tramite `onFrame` nel motore; durante lo scorrimento si nasconde per evitare che resti sopra una card diversa.

Su mobile logo e profilo condividono la prima riga; selettore e introduzione occupano entrambe le colonne. Le card usano fino all’80% della larghezza, con pulsanti alti almeno 44 px. Sugli schermi corti la pagina può scorrere verticalmente, mantenendo leggibile la card. Gli swipe orizzontali navigano il carosello; quelli verticali scorrono la pagina. Il dettaglio del servizio riserva lo spazio al pulsante di ritorno e permette di scorrere i testi lunghi. Dimensioni e touch action si aggiornano al cambio del breakpoint.

Il motore limita il DPR a 1,5 desktop e 2 mobile; a DPR 2 le texture sono 1280×1600, altrimenti 1024×1280. Multisampling 2 campioni, render target senza mipmap. A carosello fermo il wrapper non applica trasformazioni CSS. È disponibile una lista di accesso ai moduli anche senza WebGL e per lettori di schermo.

## Dashboard

Navigazione con percorsi leggibili come `/atelier/modellistica`, cronologia del browser e ritorno al carosello con gruppo e posizione conservati. La shell comune ha header WEAVE, profilo, breadcrumb e footer. La console riprende i token, la sidebar compatta e riducibile, i pannelli, i pulsanti e le tabelle di **Prova1**. File, miniature, metadati e finestre di modifica seguono i pattern di **Prova2**. Il contenuto della console segue ora il riferimento **OpsLoop** allegato: font **Mulish** locale, statistiche in card separate, titoli più leggibili, ricerca nell’header e grafici sulla griglia di lettura; i titoli scritti a mano restano nel carosello e nel logo. Su mobile la navigazione si apre dal menu e le aree operative si dispongono in una colonna.

In cima alla sidebar il selettore mostra il capo corrente: permette di cercare e cambiare capo oppure crearne uno nuovo. **Capi** apre la lista con ricerca e azioni. **Nuovo capo** raccoglie nome, codice univoco, collezione e quantità; può duplicare specifiche e ordini del capo corrente. Ogni capo ha dati, servizi, cronologia e conversazioni separati, conservati nel salvataggio locale. La copia assegna nuove identità e rimappa i codici e i collegamenti degli ordini; il capo originale resta invariato. I codici di prodotto, ordine, campione e lotto nelle viste e negli export seguono il capo selezionato. Il profilo rimane comune.

La ricerca globale si apre dall’header, accanto al profilo, o da **⌘/Ctrl K**. Il comando si apre senza animazione. Ogni modulo ha solo **Panoramica** e **Attività**. La barra del contenuto ha le due schede a sinistra e Assistente a destra; titolo e descrizione ripetuti sono stati rimossi. Il documento riserva spazio alla scrollbar per mantenere la stessa larghezza nelle viste corte e lunghe. La sidebar e il contenuto continuano a funzionare anche se una vista genera un errore, grazie a un confine di errore locale.

### Home del capo

Il Context Engine è ora **Home**, prima voce della sidebar sotto il selettore del capo. Creazione, cambio capo, apertura dalla lista e selezione di un prodotto nella ricerca globale portano a `/atelier/panoramica-capo`. La Home riprende le azioni e le attività di Prova1, l’identità e gli accessi di Prova2 e le statistiche di OpsLoop.

Il percorso raggruppa 13 fasi operative in Concept, Sviluppo tecnico, Validazione, Produzione e Passaporto. Ogni fase distingue **Completata**, **In corso** e **Da iniziare**. Brief con checklist completa, tech pack, campione approvato, marker ottimizzato, acquisti consegnati, produzione completata, qualità risolta sul lotto completo e passaporto pubblicato determinano gli stati automatici. Materiali, modellistica, grading, pricing, pianificazione e marker di base possono essere confermati come revisionati nella Home; modificare i relativi input riapre la revisione. L’assistente è un accesso continuo, escluso dal conteggio delle fasi.

Un capo appena creato parte con tutte le fasi da iniziare, produzione e stock a zero, senza anomalie inventate. Materiali e misure restano precompilati come modello base. Le fotografie sono riferimenti demo.

**Attività** mostra modulo, autore ed email, permette di filtrare per utente e di includere tutta la filiera. Le modifiche successive registrano il profilo corrente; gli esempi iniziali hanno tre autori fittizi. Il registro è incluso nel salvataggio locale, con identità degli autori indipendenti dall'email; non implementa autenticazione, ruoli o permessi fra utenti reali.

### Wrapper e immagini dei moduli

I pannelli bianchi riprendono `Prova1/src/styles/panels.css`. L'intestazione con icona, le griglie dei file, le barre dei filtri e le tabelle adattano i componenti di `Prova2/app/admin/`: `ui.tsx`, `admin.module.css`, `table.module.css` e `media/MediaBrowser.tsx`. Card, anteprime, campi, pulsanti e finestre della dashboard condividono un raggio di 12 px. Le intestazioni usano spaziatura e azioni uniformi; su mobile i riepiloghi sono su due colonne, con l’ultimo elemento dispari a tutta larghezza. I crediti della UI di Prova2 sono in `THIRD_PARTY_NOTICES.md`.

Le visuali della capsule sono **35 immagini originali generate con il tool integrato Imagegen**, salvate in `public/images/dashboard/` in WebP con miniature di 480 px: fronte, retro, schizzo, materiale, finiture, campione atelier ed evidenza qualità per pantalone, borsa e ciascuna delle tre colorazioni della maglia. Le immagini complete sono larghe 1120 px, con `srcset`, caricamento lazy e decoding asincrono. I prompt, le fonti e i percorsi sono conservati in `assets/dashboard/capsule-manifest.json`, collegato dal manifest principale. Gli asset delle giacche sono rimossi. Il moodboard usa esclusivamente riferimenti della capsule corrente.

Il moodboard offre filtri per categoria, ricerca, griglia/elenco, ordinamento del nome in elenco, anteprima ingrandita e download. Foto e varianti seguono il capo selezionato nei moduli, nella lista capi, nel retail, nella chat e nel passaporto. I capispalla mantengono le tavole di riferimento WebP. I nuovi prodotti usano **23 tavole SVG originali** di pannelli, pezzi, grading e piazzamento, riproducibili con `node scripts/create-capsule-patterns.mjs`. La borsa ha un formato unico; la maglia usa pannelli fully fashioned e consumo filato in kg, senza piazzamento di tessuto. Il disegno tecnico interattivo mantiene il componente comune e genera geometrie specifiche per categoria. Selezione pezzi e taglie, misure, revisioni, margini e calcoli di consumo rimangono interattivi; la scheda modello è esportabile in CSV e la tavola di piazzamento in SVG per pantalone e borsa. Le immagini sono riferimenti dimostrativi: non costituiscono geometrie CAD validate e non cambiano quando si modificano le misure. I grafici dei dati e le icone di navigazione restano componenti nativi. Misure, versioni e codici sono testo HTML aggiornabile, senza valori fissi nelle immagini generate.

| Modulo | Azioni della demo |
| --- | --- |
| 1 · Ideazione e Design | Brief modificabile, moodboard in griglia/elenco con immagini locali, tre varianti, palette e checklist |
| 2 · Disegno Tecnico | Carica schizzo, genera tavola preparata, fronte/retro, misure modificabili, tech pack PDF reale di 4 pagine |
| 3 · Materiali e BOM | Materiali dedicati a ciascuna variante della capsule, consumi e prezzi accessori modificabili, ricerca ed export CSV |
| 4 · Modellistica | Selezione dei pezzi, margine, tacche, drittofilo e revisioni |
| 5 · Sviluppo Taglie | Taglie 38–48 per pantalone, XS–XL per maglia, formato unico per borsa; regole, tabella ed export |
| 6 · Prototipazione | Fitting, checklist, approvazione campione e versione del modello |
| 7 · Piazzamento | Larghezza e marker per articoli tagliati; piano pannelli e filato per maglia, quantità, ottimizzazione simulata, consumi/scarto/costo ed export tavola |
| 9 · Costificazione | Cursori prezzo tessuto, margine, quantità e tariffa, scenario del materiale corrente, approvazione listini ed export |
| 10 · Pianificazione | Calendario navigabile, timeline, laboratorio, capacità, priorità e date validate |
| 11 · Procurement | Ricerca, filtri, modifica stati/date, creazione acquisti ed export |
| 12 · Produzione | Avanzamento, sessioni, pausa/ripresa, scarto reale e registrazione capi |
| 13 · Qualità | Difetto evidenziato, azione correttiva, ricontrollo e rilascio rilavorazioni |
| 19 · DPP | Viste consumatore/brand/autorità, tracciabilità, cura, eventi di vita, export JSON e pubblicazione simulata |
| 21 · Home del capo | Percorso con stati delle fasi, priorità, avanzamento del lotto, costi, accessi ai moduli e attività per autore |
| 22 · Decision Intelligence | Chat autonoma, domande suggerite, scenari e decisioni approvabili |

## Servizi integrati

`src/dashboard/services.jsx` associa esplicitamente i servizi ai moduli. Ideazione, ad esempio, include segnali wholesale/retail e generazione dei concept; non include magazzino, logistica o industrializzazione.

- **Industrializzazione:** ciclo specifico per categoria (6 gruppi per ogni categoria), macchine, tempi modificabili ed export.
- **Magazzino:** materiali e residui in BOM/Acquisti; stock per taglia, lotto e ubicazione per il capo finito.
- **Logistica:** tracking, conferme di consegna e spedizioni vincolate a stock e ordine.
- **Wholesale:** retailer, listino, condizioni e nuovi ordini entro la quantità disponibile.
- **Retail:** vendite, feedback, sell-through, listino e registrazione di vendite simulate.
- **Post-vendita:** riparazioni, resi, seconda vita e riciclo nella cronologia DPP. Scenari futuri marcati separatamente.
- **Intelligence Layer:** output preparati specifici del modulo, generazioni simulate, dati del risultato ed export. Le raccomandazioni appartengono alla chat decisionale.

Ogni dashboard operativa ha **Assistente**, una chat con contesto e cronologia propri. L’assistente risponde sui dati correnti: tessuti, misure, taglie, fitting, piazzamento, costi, ritardi, produzione, qualità o DPP. Proposte di tessuto, listino, marker, consegna prioritaria e ricontrollo modificano la demo dopo l’approvazione.

## Dati connessi

`src/dashboard/productData.js` definisce specifiche per categoria, materiali, taglie, lavorazioni, fitting, cura e NC. Il pantalone impiega 1,45 m di lana stretch (98% lana, 2% elastan); la tote 0,65 m di canvas cotone con manici e rinforzi in pelle; la maglia 0,38 kg di filato 90% merino e 10% cashmere, bordi inclusi. Gli ordini di acquisto sono collegati alle righe della distinta; il fabbisogno segue quantità e consumi correnti. Ogni prodotto ha ordini, lotti, attività e difetti propri. Le tre colorazioni della Maglia Luce condividono l’identità del modello: selettore, catalogo, ricerca e riepilogo mostrano una sola scheda, con cambio colore/materiale nel selettore. I cinque record di variante mantengono ordini, lotti, stock e attività distinti; il riepilogo somma la produzione delle varianti. `groupProducts` raggruppa solo identità di modello esplicite, senza dedurre equivalenze dai nomi.

`src/dashboard/DemoContext.jsx` collega le pagine ai comandi e allo stato corrente. `useWorkspacePersistence.js` legge e salva il workspace tramite `workspaceStore.js`; le fixture iniziali sono in `demoDefaults.js`. La base rispetta il documento: materiali **38,92 €/capo**, lavorazione **48 min × 40 €/h = 32 €**, logistica **1,50 €**, costo industriale **72,42 €**, listini **160/320 €**, ordine **500 capi**, produzione **320**, scarto teorico **14%** (11% ottimizzato), scarto reale **15%**, qualità **86/100**.

La fotografia temporale è coerente: 12 dei 320 capi sono in rilavorazione; 308 sono approvati, 160 distribuiti wholesale e 112 retail, lasciando **36 disponibili**. I 320 capi wholesale del documento sono ordini confermati, di cui 160 ancora da evadere. Nuove vendite e spedizioni rispettano le disponibilità.

Cambiare tessuto aggiorna composizione, fornitore, BOM, acquisti, costo e DPP. Ottimizzare il marker aggiorna consumi e fabbisogni. Produzione e chiusura di una non conformità aggiornano lo stock. Le azioni compaiono nella Home del capo e nel registro Attività. La scelta del ruolo DPP è una presentazione dimostrativa, non un’autorizzazione reale.

Il QR in `public/illustrations/dpp-qr.svg` è reale e punta al passaporto **locale** `http://127.0.0.1:5174/atelier/passaporto-digitale`. Per pubblicarlo va rigenerato con l’URL pubblico. Nessuna dipendenza QR aggiunta all’app.

## Asset e font

Le 22 illustrazioni Imagegen condividono lo stile bianco/grigio clay/paper: `public/illustrations/module-01.webp` … `module-22.webp`. Nessuna GIF nel runtime. Originali e prompt in `assets/animation-frames/`; avatar e prompt in `assets/profile/`.

- **Mulish** per la console, come in OpsLoop: licenza SIL OFL in `public/fonts/mulish-LICENSE.txt`.
- **Geist / Geist Mono** (Mono per i codici): licenza SIL OFL in `public/fonts/geist-LICENSE.txt`.
- **Matcha Style** per titoli delle card del carosello: [DaFont](https://www.dafont.com/it/matcha-style.font), condizioni in `public/fonts/matcha-LICENSE.txt`.
- **Stay With Me** per logo e accesso: condizioni in `public/fonts/FONT-LICENSE.txt`. La versione scaricata è per uso personale; l’autore richiede una [licenza commerciale](https://originfonts.com/product/stay-with-me/) per uso commerciale/promozionale.

La build Vite è stata compilata. Il CLI Playwright ha controllato tutte le 22 card a 320×568, 375×667 e 430×932, senza sovrapposizioni fra descrizioni e pulsanti né overflow orizzontale; verificati anche screenshot a 390×844 e swipe touch. Questi controlli usano Chrome in emulazione mobile. La suite eseguibile con `npm test` copre dati della capsule, raggruppamento delle varianti, regole di dominio, comandi, identità, schema, export e primitive UI; gli esiti delle revisioni sono nei report di consolidamento.

La dashboard usa un raggio comune di 12 px; i 15 moduli sono stati rivisti con il CLI Playwright a 1440 e 320 px, senza overflow della pagina o errori di rendering. Profili, ricerca globale, servizi e anteprime sono stati controllati anche a 390 px.

### Correzioni di navigazione

Materiali e BOM importava l’icona di ricerca senza dichiararla: l’import è stato corretto. L’effetto di scorrimento della chat ora scarta esplicitamente il valore restituito dal browser, evitando errori React al cambio di vista. Le 15 pagine e le 7 tipologie di servizio sono state aperte durante il debugging dell’anteprima locale; creazione del capo e salvataggio del brief sono stati riprodotti nella demo.

Il redesign OpsLoop mantiene la sidebar laterale e il raggio comune di 12 px. I riepiloghi con avanzamento mostrano tacche calcolate sui dati della demo; hover solo sui dispositivi compatibili, pressione `.96` in 150 ms, rispetto di reduced motion e contenimento dello scroll nelle finestre. Nessuna dipendenza aggiunta.


## Consolidamento del 12 ottobre 2026

L'audit iniziale è in [docs/hardening-2026-10-12.md](docs/hardening-2026-10-12.md); descrive lo stato e i rischi della prima fase. I successivi contratti, le identità e la persistenza locale sono descritti in [docs/architecture-local.md](docs/architecture-local.md), con i limiti e la roadmap aggiornata. Le descrizioni delle revisioni UI precedenti sopra documentano anche versioni storiche: i token effettivi della console attuale usano Geist; Mulish rimane disponibile come asset locale.

`DemoContext.jsx` espone azioni esplicite alle pagine; i calcoli e i vincoli sono in `domain.js`, i comandi operativi in `productActions.js`, gli editor con campi consentiti in `workspaceCommands.js`. `workspaceIdentity.js` separa ID immutabili e codici visibili; `workspaceSchema.js` valida il workspace prima di mostrarlo o salvarlo. Le basi demo restano in `demoDefaults.js` e `accountData.js`, gli export browser in `exportFiles.js`. La UI condivisa resta in `ui.jsx`; palette, altezze e spazi comuni sono in `ui-tokens.css`, le varianti dei selettori in `selectors.css`. Nessuna nuova dipendenza.

Vendite retail e ordini wholesale rispettano la quantità pianificata complessivamente impegnata. Modifiche a materiale, misure o modello riaprono il fitting; snapshot identici non annullano le approvazioni. La creazione dei capi valida i dati anche nell'azione, e le notifiche di assegnazione rispettano la preferenza corrente. Le opzioni di lingua, fuso e pagina iniziale vengono conservate, ma restano anteprime e non sono applicate globalmente.

Per la verifica corrente eseguire `npm test` e `npm run build`. Esiti, collaudo browser e limiti sono nei report; non sono una certificazione di produzione. La persistenza locale è implementata; backend, autenticazione e permessi server restano da sviluppare.

## Indirizzi e navigazione

I percorsi sono centralizzati in `src/routes.js`: `/esplora` per il carosello, `/atelier` per lo spazio comune, `/atelier/capi`, `/atelier/inbox`, `/atelier/le-mie-attivita`, `/atelier/notifiche`, `/atelier/attivita` e `/atelier/profilo`. I moduli usano slug espliciti: `ideazione`, `disegno-tecnico`, `materiali`, `modellistica`, `sviluppo-taglie`, `prototipi`, `piazzamento`, `costi-e-pricing`, `pianificazione`, `acquisti`, `produzione`, `qualita`, `passaporto-digitale`, `panoramica-capo`, `assistente`, tutti sotto `/atelier/`.

Le impostazioni hanno percorsi propri, ad esempio `/atelier/impostazioni/aspetto` e `/atelier/impostazioni/membri`. Le conversazioni hanno `/atelier/inbox/:id`, con identità codificata come singolo segmento. I vecchi bookmark hash, i percorsi `/moduli/:id` e gli alias delle pagine sono convertiti senza aggiungere una voce alla cronologia. Indietro/avanti funzionano tramite History API; un indirizzo sconosciuto mostra una pagina dedicata.

`vercel.json` include il fallback SPA per apertura diretta e ricaricamento ([documentazione Vercel](https://vercel.com/docs/frameworks/frontend/vite)). Nessuna dipendenza aggiunta. Il capo selezionato resta nel workspace locale: gli indirizzi dei moduli non identificano ancora un capo condivisibile fra utenti. Il QR continua a puntare alla demo locale sulla porta 5174 e va rigenerato sul dominio pubblico prima della pubblicazione.

Verifica della migrazione: 61 test passati e build riuscita; nel browser controllati i 15 bookmark dei moduli, tutte le 21 sezioni delle impostazioni, indietro/avanti, apertura diretta e reload di impostazioni e conversazioni, recupero degli indirizzi sconosciuti e layout a 320 px. Configurazione Vercel aggiornata; il deployment pubblico non è stato collaudato in questa verifica locale.
