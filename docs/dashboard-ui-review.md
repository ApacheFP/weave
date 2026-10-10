# WEAVE · revisione della dashboard

10 ottobre 2026. Skill applicate: `better-ui` ed `emil-design-eng`, eseguite con i comandi richiesti e lette integralmente, insieme alle ricette pertinenti. Ambito: console dei 15 moduli, componenti condivisi, ricerca, profilo e servizi connessi.

## Riferimento e direzione

Il riferimento HTML allegato identifica **OpsLoop — Dashboard**. La struttura delle card, Mulish, i numeri grandi, i piccoli indicatori di avanzamento e la ricerca nell’header sono adattati a WEAVE. La sidebar resta laterale, come richiesto. Il beige, le immagini WebP e il raggio condiviso di 12 px seguono le preferenze già espresse.

L’HTML punta a un foglio CSS Next relativo, non incluso nell’allegato: l’adattamento usa le classi e la gerarchia disponibili, senza dichiarare una copia esatta dei pixel. Mulish è servito localmente, con licenza OFL nel repository.

## Principi e correzioni

Le severità descrivono i problemi prima delle modifiche. Tutte le righe sono risolte nell’ambito indicato.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `src/dashboard/dashboard.css:804` | L’hover condiviso del profilo restava beige dopo un tap e la chiusura. | Regole della console con precedenza esplicita e hover solo con puntatori compatibili. | Hover solo su dispositivi adatti: su touch il profilo torna bianco quando è chiuso. |
| HIGH | `src/dashboard/dashboard.css:483` | Sidebar mobile fuori schermo ma ancora raggiungibile dalla tastiera. | `visibility: hidden` quando chiusa, visibile quando aperta. | La navigazione nascosta non deve ricevere focus. |
| MEDIUM | `src/dashboard/ui.jsx:54`, `src/dashboard/WorkspaceControls.jsx:48` | Il dialog cercava di assegnare il focus prima di aprirsi; il browser selezionava Chiudi. | Focus del campo dopo `showModal()`, apertura del comando senza animazione. | I comandi frequenti devono rispondere subito alla digitazione. |
| MEDIUM | `src/dashboard/dashboard.css:92`, `src/dashboard/dashboard.css:765` | Entrate con keyframe a ogni cambio vista e pressione `.97`. | Cambi vista immediati; transizioni retargetabili per i popup; pressione `.96` in 150 ms ease-out, esclusi disabilitati e variante `static`. | Feedback rapido sulle azioni frequenti e coerenza dei pulsanti. |
| MEDIUM | `src/dashboard/dashboard.css:752`, `src/dashboard/dashboard.css:777` | Scroll dei popup poteva propagarsi; movimento non separato dalle dissolvenze. | `overscroll-behavior: contain`; movimento sotto no-preference, dissolvenze e colori sotto reduced motion. | Le finestre mantengono il proprio scroll e rispettano la preferenza dell’utente. |
| MEDIUM | `src/dashboard/ui.jsx:37`, `src/dashboard/dashboard.css:729` | Statistiche in una fascia unica e numeri piccoli. | Card bianche separate, numeri 32 px desktop, avanzamenti dai dati reali della demo. | Gerarchia e leggibilità riprese da OpsLoop. |
| MEDIUM | `src/dashboard/dashboard.css:566`, `src/dashboard/dashboard.css:747` | Titoli dei pannelli 14 px e contorni delle immagini colorati. | Titoli 18 px, font Mulish, ombre stratificate e bordo trasparente, outline nero al 10% sulle immagini. | Superfici più leggibili e profondità distinta dai separatori strutturali. |
| LOW | `src/dashboard/dashboard.css:719`, `src/dashboard/Dashboard.jsx:64` | Ricerca disponibile solo in sidebar o con scorciatoia. | Ricerca visibile nell’header, compatta su mobile. | Accesso coerente con il riferimento, riutilizzando il comando esistente. |
| LOW | `src/dashboard/dashboard.css:16`, `src/dashboard/dashboard.css:809` | Flash touch predefinito e spessori delle icone scalati con il viewBox. | Tap highlight rimosso dai controlli con feedback proprio; stroke non scalabile e pesi coerenti. | Niente flash azzurro sulla palette beige e icone più nitide. |

## Verifica

- `npm run build`: riuscita. Nessuna dipendenza aggiunta e nessun test alla suite aggiunto o eseguito.
- CLI Playwright / Chrome: aperti tutti i 15 moduli a 1440 e 320 px. Nessun overflow orizzontale della pagina o errore di rendering; card e pannelli ispezionati mantengono il raggio di 12 px.
- Aperte **44 combinazioni modulo/servizio** in emulazione touch a 390 px: nessun errore JavaScript o overflow della pagina.
- Verificati ricerca, risultato vuoto, Escape, focus iniziale, profilo, impostazioni, sidebar mobile, hover, pressione, selezione e pulsante disabilitato.
- Misurata la pressione: matrice `0.96`, transizione transform `150ms ease-out`. Disabilitato: transform `none`. Reduced motion: transform `none`, dissolvenze/colore disponibili.
- Profilo su touch dopo la chiusura: `aria-expanded=false`, background bianco anche con `:hover` latched e media query hover falsa.
- Ricerca: campo subito attivo, `transition: none`, zero animazioni del dialog, scroll contenuto.
- Apertura del profilo riprodotta al 10% tramite Web Animations API nel browser: transizioni opacity/transform di 150 ms. Controllata anche la vista finale.
- Console dell’anteprima esaminata: zero errori e zero warning.

**Not verified:** dispositivi fisici, Safari/Firefox, pannello Animations di DevTools (rallentamento effettuato via API), forced colors e confronto pixel per pixel con il CSS mancante del riferimento. Le azioni di business non coinvolte dal redesign non sono state sottoposte a un nuovo collaudo completo.

**Approve** per l’ambito ispezionato: nessun problema HIGH residuo riscontrato.

## Aggiornamento: Home del capo, percorso e Attività

10 ottobre 2026. Ambito aggiuntivo: navigazione del prodotto, Home, stati delle fasi, registro per autore e barra del contenuto in tutti i moduli. La sidebar resta laterale. Il tab Servizi integrati è stato rimosso su richiesta: le viste sono ora solo Panoramica e Attività.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/dashboard/Dashboard.jsx`, `src/dashboard/WorkspaceControls.jsx` | Il Context Engine era in fondo alla navigazione; creare o aprire un capo portava al design o conservava il modulo. | Home è la prima voce sotto il selettore; creazione, cambio, lista e ricerca aprono il riepilogo del prodotto. Ricerca desktop accanto al profilo. | Il capo ha un punto di ingresso coerente e accessi rapidi ai suoi dati. |
| MEDIUM | `src/dashboard/HomePage.jsx`, `src/dashboard/home.css` | Mappa generica con nodi dichiarati connessi anche su un prodotto appena creato. | Identità, prossime azioni, lotto, costi e feed riprendono Prova1 Home, Prova2 Overview e OpsLoop. Percorso in cinque gruppi con 13 fasi, stati testuali e segni di spunta. | Dati base, lavoro avviato ed esito completato sono distinguibili senza usare solo il colore. |
| MEDIUM | `src/dashboard/DemoContext.jsx` | Nessun controllo delle revisioni di BOM, modello, grading, pricing e piano. | Revisioni confermabili nella Home; input modificati riaprono gli esiti manuali pertinenti. Esiti automatici da checklist, tech pack, campione, marker, acquisti, lotto, qualità e passaporto. | La presenza di dati precompilati non equivale a una fase completata. |
| MEDIUM | `src/dashboard/Dashboard.jsx`, `src/dashboard/DemoContext.jsx` | Attività senza autore e senza filtro per persona. | Nome ed email sugli eventi, filtro per utente, vista del modulo o di tutta la filiera. Conferme delle revisioni registrate nel modulo interessato. | È possibile leggere chi ha modificato il capo nella sessione dimostrativa. |
| MEDIUM | `src/dashboard/Dashboard.jsx`, `src/dashboard/home.css` | Intestazione ripetuta e larghezza variabile fra pagina lunga e corta. | Rimossi titolo, descrizione e metadati ripetuti; schede a sinistra, Assistente a destra. Spazio della scrollbar stabile. Titolo mantenuto per i lettori di schermo. | Meno rumore nella pagina e allineamento costante al cambio vista. |

### Controlli aggiuntivi

- Build Vite riuscita; nessuna dipendenza o test alla suite aggiunto o eseguito.
- Home ispezionata a 1440, 1024, 768, 390 e 320 px: Mulish, superfici a 12 px e nessun overflow della pagina.
- CLI Playwright: 15 moduli a 1440, 390 e 320 px, 45 confronti Panoramica/Attività. Posizione e larghezza della barra rimangono identiche; due sole schede, nessuna intestazione di pagina ripetuta visibile. Zero errori JavaScript o viste fallite.
- Creazione, cambio dal selettore, apertura dalla lista e risultato della ricerca portano alla Home del capo corretto. Il campo Nome riceve il focus nel dialog di creazione.
- Nuovo capo: cinque gruppi da iniziare, 0% produzione, stock e anomalie a zero. La fotografia è marcata come riferimento demo.
- Filtro Marta Bianchi: compare solo la non conformità registrata da quell’autore.
- Confermare Materiali porta il conteggio da 1 a 2 fasi completate e registra autore e modulo. Cambiare tessuto riapre la revisione. Completare brief e checklist di un nuovo capo completa il gruppo Concept.
- Controllata l’apertura dell’assistente contestuale e della sidebar in emulazione touch a 390 px.

**Not verified:** autenticazione e autorizzazioni fra utenti reali (il registro usa profili demo), dispositivi fisici e browser diversi da Chrome. Gli altri limiti della revisione precedente restano validi; i controlli dei 44 servizi appartengono alla versione precedente con il relativo tab.

**Approve** per le viste e i flussi qui ispezionati: nessun problema HIGH residuo rilevato.


## Modulo 1 · percorso creativo

10 ottobre 2026. Revisione del modulo Ideazione e Design, con le successive correzioni richieste: output solo dopo la generazione; rimozione di fascia di prezzo e materiali/sostenibilità dagli input.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `CreativePage.jsx`, `creativeData.js` | Tre fotografie dello stesso capo presentate come varianti; output precompilati. | Percorso Input → Valuta la proposta → Il tuo schizzo. Moodboard, palette e quattro figurini compaiono solo dopo Genera proposta. | Lo stilista guida il flusso e valuta gli spunti prima di procedere. |
| MEDIUM | `CreativePage.jsx`, `creative.css` | Brief e checklist generici, nessun confronto o feedback visivo. | Quattro figurini WebP, Mi piace/Scarta, combinazione di più spunti, modifica del singolo figurino, rigenerazione e storico delle versioni. | Una proposta può essere approvata, scartata o modificata senza perdere le esplorazioni precedenti. |
| HIGH | `DemoContext.jsx` | Nessuna distinzione fra dati della collezione ed esito del capo. | Trend, moodboard e palette condivisi per collezione; input e feedback per capo. Concept approvato conserva una copia di palette, riferimenti, spunti preferiti e file dello stilista. | Le ricerche successive non riscrivono l’output già approvato di un prodotto. |
| HIGH | `DesignPages.jsx`, `HomePage.jsx` | Checklist completata equivaleva a concept; upload dello schizzo duplicato nel modulo tecnico. | Approva palette e almeno uno spunto, carica foto/file tablet/PDF. Lo stesso Style ID diventa concept approvato e completa la fase Home. Il modulo 2 legge quel file; una nuova tavola richiede il concept. | Il disegno definitivo è dello stilista, l’automatismo tecnico inizia dopo il passaggio. |
| MEDIUM | `creative.css` | Modulo senza una gerarchia di revisione. | Mulish, superfici bianche/beige, wrapper a 12 px e componenti esistenti. Due colonne nella revisione desktop, layout adattivo mobile, controlli touch da 44 px, press leggero e reduced motion. | Coerenza con Prova1/Prova2 e con il resto della dashboard. |

### Verifiche

- Build Vite riuscita; nessuna dipendenza aggiunta, nessuna suite di test eseguita o creata.
- CLI Playwright: schermata iniziale senza moodboard, palette o figurini; i due campi rimossi sono assenti.
- Ricerca → generazione → feedback → combinazione 1+3 → modifica con variante e nota → approvazione → upload WebP → modulo 2 → Home. Quattro figurini e nessun errore JavaScript nel flusso.
- Scartare tutti i figurini blocca l’approvazione; rigenerare li sostituisce con quattro alternative. Scartare l’intera proposta riporta agli input senza mostrare output, mantenendo le versioni nello storico.
- Upload PDF e download verificati; il PDF arriva nel modulo 2. Style ID GJ-0421 invariato; fase Concept completata solo dopo lo schizzo.
- Cambiare il colore della collezione mantiene invariata la palette conservata nel concept approvato. Giacca Studio eredita la ricerca della collezione, senza ereditare il concept approvato di Giacca Atelier.
- Input, revisione e upload controllati fra 320, 390, 768, 1024 e 1440 px senza overflow; emulazione touch 390 px con screenshot dei tre passaggi. Figurini generati con imagegen e convertiti in WebP, circa 45–56 KB ciascuno. Manifest con prompt e percorsi in `creative-images.json`.

### Fonti della ricerca demo

Link consultabili sui siti originali, senza recuperare o ripubblicare le loro immagini: [COS AW26](https://www.cos.com/en-gb/runway/autumn-winter-2026), [LEMAIRE AW26](https://www.lemaire.fr/pages/runway-fall-winter-2026), [Woolmark · Incomparable](https://www.woolmark.com/industry/source-wool/the-wool-lab/themes/incomparable/). La sintesi è una direzione di lavoro dimostrativa, non una previsione automatica dei trend 2027.

**Not verified:** motori di ricerca/AI in tempo reale, caricamento su storage remoto, persistenza oltre la sessione, dispositivi fisici e browser diversi da Chromium. Ricerca, combinazione e rigenerazione usano fonti e figurini preparati; le note di modifica sono conservate, non inviate a un modello runtime.

**Approve** per il percorso dimostrativo ispezionato; nessun HIGH residuo rilevato in questo ambito.

## Modulo 1 · rimozione della card dei figurini

Su richiesta, rimossa l’intera card degli spunti, con feedback, combinazioni e modifica del figurino. La revisione conserva sintesi/fonti, moodboard e palette; l’approvazione richiede la palette e porta direttamente allo schizzo dello stilista.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `CreativePage.jsx`, `creative.css` | Card Quattro interpretazioni e approvazione bloccata senza un figurino preferito. | Card eliminata; moodboard e palette occupano lo spazio disponibile, senza requisito sui figurini. | Rimozione completa della sezione senza bloccare il percorso. |

Build riuscita. CLI Playwright: zero card dei figurini dopo la generazione; Ricerca → Proposta → Approva palette → Approva e continua abilita Carica il tuo schizzo.

**Not verified:** upload finale non ripetuto in questa modifica; i limiti della demo già documentati restano validi.

**Approve** per la rimozione e il passaggio ispezionati.

## Modulo 1 · due percorsi paralleli

10 ottobre 2026. Caricamento diretto del disegno finale oppure ispirazione facoltativa. La direzione creativa produce esclusivamente un moodboard di atmosfere con didascalia e sei colori indicativi; nessun figurino o risultato di ricerca web viene mostrato.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `CreativePage.jsx` | Lo schizzo richiedeva ricerca, proposta e palette approvata. | Upload JPG/PNG/WebP/PDF subito disponibile; il file approva il concept e resta collegato allo stesso Style ID. | Lo stilista può partire dal proprio disegno senza usare il percorso creativo. |
| MEDIUM | `CreativePage.jsx`, `creativeData.js` | Fonti web esplicite, moodboard di capi e quattro colori. | Input del cliente/brand/collezioni/target e riferimenti provvisori facoltativi; immagine atmosferica, didascalia e sei colori. | La ricerca di contesto resta interna e l’output dà una direzione, senza progettare il capo. |
| MEDIUM | `CreativePage.jsx`, `creative.css` | Percorso sequenziale con approvazioni obbligatorie. | Due accessi paralleli; prompt di revisione, sostituzione dell’immagine, didascalia e colori/nomi modificabili, ripristino delle versioni. | Iterazione libera senza bloccare il disegno finale. |
| MEDIUM | `Assistant.jsx`, `services.jsx`, `HomePage.jsx` | Indicazioni ancora riferite ai figurini e alla palette obbligatoria. | Copie allineate a upload diretto e ispirazione facoltativa. | Le altre parti della dashboard descrivono lo stesso flusso. |

### Controlli

- Build Vite riuscita, nessuna dipendenza o suite di test aggiunta/eseguita.
- CLI Playwright: upload WebP diretto senza moodboard/palette, stesso ID GJ-0421, file presente nel modulo 2 e generazione tecnica abilitata.
- Generazione facoltativa: un moodboard, sei colori, zero card dei figurini e zero sintesi/fonti pubblicate.
- Prompt fresco/salvia aggiorna immagine e palette demo; modifiche manuali a didascalia, nome e colore conservate.
- Caricato riferimento provvisorio, sostituita l’immagine del moodboard, caricato PDF finale. Dossier JSON scaricato: sei colori, nome/colore manuali, didascalia manuale e riferimento conservati sullo stesso ID.
- Layout ispezionato a 320/390/768/1024/1440 px senza overflow. Contesto touch fresco a 390 px: upload diretto e moodboard ispezionati; sei colori, zero errori JavaScript.
- Due immagini atmosferiche generate con imagegen e convertite in WebP 1200×800, 171/201 KB; prompt e percorsi in `moodboard-images.json`.

**Not verified:** ricerca web o generazione AI runtime: nella demo due direzioni preparate simulano il servizio, senza analizzare i file visivamente. La ricerca interna reale, storage remoto e persistenza oltre la sessione richiedono un backend. Non verificati dispositivi fisici, Safari/Firefox o rendering interno dei PDF.

**Approve** per UI e percorsi demo ispezionati.

## Moodboard · correzione della direzione visiva

Sostituite le immagini di ambienti architettonici con due collage di ricerca moda: campioni di tessuto, fotografie ritagliate di proporzioni e dettagli sartoriali, cuciture e accessori. Didascalie allineate al brief della giacca.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `creativeData.js`, immagini moodboard | Ambiente simile a un hotel con materiali decorativi. | Collage di riferimenti tessili e di abbigliamento, in direzione calda o fredda. | Il moodboard comunica una ricerca di moda pertinente al capo. |

Entrambe le immagini imagegen ispezionate visivamente e salvate WebP 1200×800, 182/193 KB. Build riuscita. Prompt e percorsi aggiornati in `moodboard-images.json`.

**Not verified:** nessun nuovo collaudo dell’intero flusso; UI e interazioni non modificate. Generazione runtime ancora simulata.

**Approve** per la correzione delle due immagini.

## Moodboard · riferimenti indipendenti (10 ottobre)

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | Modulo 1, moodboard | Un unico raster composto come collage. | Sei fotografie indipendenti, disposte in una griglia responsive. | Lo stilista può gestire ogni riferimento e leggerne la didascalia. |
| MEDIUM | Modifica manuale | Sostituzione dell’intera tavola. | Titolo e didascalia per immagine, anteprima, aggiunta, sostituzione e rimozione singole. | La ricerca visiva resta modificabile. |

Otto fotografie imagegen ispezionate: sei per direzione, con tessuto e proporzioni alternativi caldi/freddi. WebP 800×800, circa 26–128 KB ciascuna. Prompt e percorsi in `moodboard-images.json`.

Build riuscita. CLI Playwright: griglia inizialmente assente, sei riferimenti dopo generazione; anteprima; titolo/didascalia modificati; sostituzione singola; rimozione; rigenerazione fredda; aggiunta settimo riferimento; rimozione di tutti i riferimenti con palette ancora accessibile; caricamento del disegno finale e concept approvato. Nessun overflow orizzontale a 320, 390, 768 e 1440 px. Screenshot desktop e contesto touch mobile ispezionati.

**Not verified:** dispositivi fisici, Safari/Firefox, generazione AI o ricerca web runtime. Il servizio resta simulato con riferimenti preparati; le nuove immagini sono state realmente generate con imagegen durante lo sviluppo.

**Approve** per il moodboard a immagini separate e le interazioni demo verificate.

## Modulo 1 · gerarchia visiva e controlli su richiesta

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | Percorsi | Due grandi card di navigazione. | Selettore compatto con le due azioni. | Riduce lo spazio prima del contenuto. |
| HIGH | Brief | Form lungo e generazione sotto i riferimenti. | Richiesta e generazione vicine; brand, storico e target espandibili. | L’azione principale resta visibile. |
| MEDIUM | Moodboard | Input e textarea sempre aperti. | Titolo e didascalia leggibili, editor in “Modifica testo”. | Le immagini diventano protagoniste senza perdere il controllo manuale. |
| LOW | Stati iniziali e upload | Testi ripetuti e vuoto ampio. | Istruzioni concrete e riepilogo del concept breve. | Chiarisce il passaggio successivo. |

Build riuscita. CLI Playwright: generazione, apertura/modifica/chiusura del titolo di un riferimento; layout senza overflow orizzontale a 320, 390, 768, 1440 px. Screenshot desktop e mobile touch ispezionati.

**Not verified:** dispositivi fisici, Safari/Firefox e backend AI. Restano valide le limitazioni della demo.

**Approve** per la gerarchia e i controlli ispezionati.
