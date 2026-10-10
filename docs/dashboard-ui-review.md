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
