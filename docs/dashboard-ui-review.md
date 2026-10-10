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
