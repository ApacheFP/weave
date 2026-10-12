# WEAVE · hardening e consolidamento

12 ottobre 2026. Ambito: `prodotto`, applicazione React/Vite, sorgenti, CSS, dati demo, routing, export, script asset, configurazione e test. `Prova1` e `Prova2` sono riferimenti esterni all'app e non sono stati modificati. Carico assunto: singolo utente nella demo locale; lo stato attuale non garantisce concorrenza fra utenti reali.

## Punto di partenza e confini

Non sono presenti istruzioni AGENTS nella catena delle cartelle di `prodotto`. Il repository Git è in `prodotto`, non nella cartella WEAVE. Era già modificato all'avvio: immagini/mascotte, App/Auth, pagine, stato e CSS della dashboard. Durante il lavoro sono arrivate ulteriori modifiche locali a impostazioni, profilo e preferenze: preservate, senza attribuirle a questo intervento. Nessun reset, commit o aggiornamento delle dipendenze.

La baseline eseguiva 10 test con esito positivo e compilava. Il controllo degli import relativi dei sorgenti non ha trovato dipendenze circolari o percorsi mancanti. `public/carousel.js` è un bundle WebGL minificato separato: ne sono stati esaminati integrazione e ciclo di vita, non ogni riga del codice vendor.

| Responsabilità | Sede attuale | Convenzione |
| --- | --- | --- |
| Accesso dimostrativo e routing hash | `src/App.jsx`, `src/AuthPage.jsx` | Il login apre una sessione React, non autentica |
| Shell, navigazione, overlay | `src/dashboard/Dashboard.jsx`, `WorkspaceControls.jsx` | Pagine modulo e pagine workspace nello stesso layout |
| Primitive UI | `src/dashboard/ui.jsx` | Card, Button, Field, Badge, Tabs, Dialog, Progress, Empty |
| Token e controlli | `ui-tokens.css`, `dashboard.css`, `selectors.css` | Variabili sulla radice della dashboard, varianti contestuali esplicite |
| UI delle funzionalità | `*Page.jsx`, `DesignPages.jsx`, `OperationsPages.jsx`, `services.jsx` | Componenti esistenti per dominio, stato UI locale |
| Sessione e notifiche | `DemoContext.jsx` | Stato workspace/collezioni/capi, azioni e attività in memoria |
| Calcoli e regole testabili | `domain.js`, `workspaceData.js` | Funzioni pure; nessun import React |
| Fixture demo | `demoDefaults.js`, `accountData.js`, `productData.js`, `creativeData.js`, `technicalData.js`, `seedWorkspaceData` | Oggetti e generatori locali; nessuna API |
| Export browser | `exportFiles.js` | Download, CSV e tech pack PDF separati dal provider |

Sono mantenuti il font e la composizione delle pagine pubbliche, le immagini, le griglie, la sidebar e l'identità visiva esistente. Segmented compatti, tab sottolineati e barra dei moduli hanno altezze diverse per un motivo: non sono uniformati indiscriminatamente. Card di contenuto, riepiloghi e liste restano varianti contestuali. Profilo del carosello e pagina account sono entrambi usati: non eliminati come codice morto. Non introdotti framework, dipendenze o repository layer senza un servizio reale. `MediaBoard` non era più importato né referenziato nei sorgenti, test, script o documentazione e non aveva caricamenti dinamici: rimossa la vecchia implementazione inattiva e i suoi import, mantenuti MediaViewer/ReferenceFile usati dalle pagine correnti.

## Problemi confermati e interventi

| Priorità | Caso concreto prima | Correzione e motivo |
| --- | --- | --- |
| Alta | Il retail controllava lo stock fisico ma ignorava la quantità già prenotata B2B. Ordini wholesale fino alla quantità totale consentivano ancora vendite retail. Due attivazioni accodate sull’ultimo articolo potevano anche creare un evento senza una vendita effettiva. | Disponibilità retail = minimo fra stock e quantità non impegnata. Regola nel dominio e controllo anche nel callback di aggiornamento; stesso calcolo per wholesale. Il provider ignora patch vuote/null per non registrare attività inesistenti. |
| Alta | Dopo approvazione campione, modificare misure, materiale o margine del modello lasciava `sampleApproved` e la checklist approvati. | La patch di prodotto invalida il fitting relativo a input modificati; mantiene l'approvazione esplicita del modulo campione. Riapre anche la revisione modellistica quando cambiano le misure. |
| Media | `createStyle` validava solo il codice duplicato; valori vuoti, quantità non intere o sotto gli impegni del capo copiato dipendevano esclusivamente dal form. | Validazione di titolo, collezione, codice e quantità nell'azione, con test per limiti e duplicati. |
| Media | `sectionLabel` contiene stringhe, ma `[1]` visualizzava solo il secondo carattere del titolo. | Accesso alla stringa completa nelle impostazioni. |
| Media | Cmd/Ctrl+P/N attivavano le azioni P/N della demo; Ctrl+Enter poteva ripetere un invio gestito dal composer. | Le scorciatoie rispettano modificatori, composizione e `defaultPrevented`; l'aiuto non apre un dialog sopra un dialog esistente. |
| Media | Il menu Aiuto dichiarava menu/menuitem senza gestione coerente di focus e frecce. | Focus iniziale, frecce/Home/End, Escape e ritorno al pulsante; tema e accento radio hanno selezione da tastiera e un solo punto di Tab. |
| Media | L'icona `close` non è un nome Lucide disponibile e ricadeva sull'icona di aiuto. | Alias esplicito a `x` nel componente condiviso. |
| Media | Il toast era fratello della dashboard, quindi non ereditava colore, superficie e tema definiti sulla radice. | Toast dentro la shell e testo della notifica nel context. |
| Media | Regole generiche dei select prevalevano sul filtro utente delle attività e sulle varianti compatte per specificità, anche quando la regola compatta era successiva. | Stile nativo nella base comune, specificità controllata e varianti locali mantenute: il filtro attività usa effettivamente 28 px. |
| Media | Token e CSS base contenevano più strati storici che si annullavano; colori tema duplicati. | Token raccolti in un file, valori effettivi consolidati e regole di shell separate dai controlli. Non cancellati blocchi CSS senza una verifica. |
| Media | Preferenza locale Riduci movimento non copriva transizioni fisse e mascotte animata; la progressbar poteva annunciare valori fuori scala. | Preferenza applicata ai controlli e alla mascotte; percentuale finita e limitata condivisa fra larghezza e attributi accessibili. |
| Media | Quando il carosello falliva, la lista fallback era solo testo e i pulsanti principali restavano disabilitati. | Accesso HTML ai moduli e dettagli dei servizi; la lista per tastiera si rende visibile quando riceve focus. |
| Media | CSV proteggeva solo formule al primo carattere; spazi o tab prima di `=` potevano aggirare la protezione. | Serializzazione pura testata, escaping di delimitatori/virgolette e neutralizzazione anche con prefissi bianchi/di controllo. |
| Bassa | Stati/priorità attività, identificativi di modulo selezionabili e formattazione delle date locali erano ripetuti. | Riutilizzo delle liste e del registro moduli esistenti; helper data locale comune. Freccia del mese successivo corretta. |

## Verifiche

| Verifica | Risultato |
| --- | --- |
| `npm test` | 18/18 positivi: 10 esistenti, 6 regressioni dominio/date, 1 CSV e 1 UI renderizzata con Vite/React SSR |
| `npm run build` | Riuscita: 69 moduli; CSS 185,61 kB, JS 528,78 kB (gzip 155,25 kB). Avviso Vite per chunk sopra 500 kB mantenuto visibile |
| `npm audit --json` | 0 vulnerabilità note segnalate dalle dipendenze attuali |
| `git diff --check` | Nessun errore |
| Import relativi | 35 sorgenti JS/JSX: nessun import mancante o ciclo statico rilevato |
| Chrome / build preview | 8 pagine workspace a 1440, 390 e 320 px: 24 combinazioni senza overflow della pagina o errore di rendering |
| Chrome / moduli | 15 moduli con Maglia Luce selezionata a 1440 e 320 px: 30 combinazioni; verificato che fossero montate le pagine operative, non il solo messaggio di selezione capo |
| Chrome / ultime impostazioni | Tutte le 21 sezioni attuali a 1440 e 320 px: 42 combinazioni senza overflow della pagina o titoli troncati |
| Chrome / servizi | 7 servizi in un harness isolato che monta gli stessi DemoProvider, ServiceContent e Dialog, a 1440 e 320 px: 14 combinazioni senza overflow o eccezioni. Non è una verifica completa della raggiungibilità di tutti i servizi dalla shell |
| Flussi di regressione | Due attivazioni sul retail con un solo articolo non impegnato: venduti 48→49, un evento di vendita e controllo disabilitato. Approvazione campione→modifica modello: approvazione annullata e checklist riaperta |
| Notifiche e Inbox | Assegnazioni disattivate→creazione attività: attività presente e Inbox invariata. Ctrl+Enter nel composer crea una sola risposta e svuota il campo |
| Tastiera/dialog | Ricerca mette a fuoco il campo; Escape ripristina il pulsante; CmdK/? non aprono dialog annidati. Menu Aiuto supporta End/Escape e ritorno al trigger. CmdP/CtrlN non sono bloccati. Filo mette a fuoco il textarea e ripristina il launcher |
| Tema e movimento | Freccia sul radio tema cambia selezione e tema. Sistema segue le variazioni OS light/dark. Toast eredita colori dark; movimento locale ridotto dà transition 0s e rimuove la source GIF di Filo |
| Carosello degradato | Guasto del motore simulato: 14 voci correnti (12 accessi modulo e 2 dettagli servizio); lista scorrevole senza overflow a 320 px e apertura modulo riuscita. L'errore console della fault injection è previsto |

Il confronto visivo della Home a 1440 px conserva griglia, card, font e spaziature: `output/playwright/hardening-before-home.png` e `hardening-after-home.png`. Gli orari della demo e il saluto cambiano con l'ora corrente. Harness e screenshot sono artifact ignorati in `output/playwright/`, non nuove dipendenze o parti distribuite dell'app.

Limiti del collaudo: Chrome locale con viewport emulato; non Safari/Firefox, dispositivi fisici, lettori di schermo reali o verifica completa dei gesti touch/WebGL. Le nuove schermate account sono state aperte, ma non sono implementazioni reali di inviti, sicurezza o fatturazione. La scansione import riguarda riferimenti statici relativi; non certifica ogni possibile caricamento dinamico del browser.

## Rischi e lavoro rimasto

- **Accesso, ruoli e isolamento:** login e selezione della vista DPP sono dimostrativi. I permessi devono essere applicati sul server. Non usare la UI come controllo di autorizzazione.
- **Persistenza e concorrenza:** ricaricare/uscire azzera lo stato. Stock e impegni sono coerenti nella sessione ma richiedono transazioni lato server prima di più utenti.
- **Identità:** assegnazioni/attori usano ancora email come identità. Servono ID immutabili per utenti, prodotti, varianti e ordini. La copia delle specifiche conserva gli identificativi degli ordini collegati; questi sono attualmente confinati al capo e vanno rimappati prima di una persistenza condivisa.
- **Confine delle azioni:** `commit` accetta patch di oggetti. La separazione dei calcoli è un passo utile, ma non è ancora un contratto API con validazione completa dei record ricevuti.
- **Asincronia:** non sono implementati caricamento remoto, retry, annullamento, errori di rete o gestione delle modifiche concorrenti. Gli import file restano locali; futuri upload richiederanno validazione server di tipo/contenuto/dimensione.
- **Impostazioni recenti:** lingua, fuso, formato data e pagina iniziale sono preferenze demo, non applicate globalmente. Membri/team sono fixture separate; inviti, revoche sessione e password restano simulazioni locali, in parte resettate al cambio pagina.
- **CSS:** restano blocchi storici per viste specifiche, selettori globali del profilo e controlli nativi. Consolidare una famiglia alla volta con screenshot; non applicare una rimozione globale solo perché i valori differiscono.
- **Accesso ai servizi:** nella shell attuale alcuni servizi si aprono dagli eventi della cronologia e non hanno una route diretta o un accesso autonomo completo. Il collaudo isolato verifica i componenti; riallineare gli accessi contestuali alla navigazione prima dell’integrazione backend.
- **Metadati navigazione:** registro delle pagine, nomi brevi e icone sono ancora distribuiti. Unificarli quando si aggiunge un modulo o routing più ricco, senza introdurre ora un router nuovo.
- **Prestazioni:** build attuale segnala un chunk oltre 500 kB. Separare caricamento di pagine e carosello dopo aver misurato tempi reali; non alzare la soglia per nascondere il warning.
- **DPP/export:** QR punta a un URL locale, pubblicazione demo senza snapshot/versione immutabile; geometrie/CAD e valori di tracciabilità non validati. Il PDF è un export dimostrativo con caratteri ASCII.
- **Distribuzione:** condizioni commerciali dei font sono già documentate nel README. Nessun controllo dei diritti o test di produzione eseguito in questo intervento.

## Roadmap prioritaria

1. **P0 · Contratti e identità.** Definire ID immutabili, schema dei record, azioni esplicite per vendite/spedizioni/approvazioni e vincoli di stock. Usare `domain.js` come regole da proteggere, mantenendo fixture demo separate. Prima API concreta, poi adapter sottile: evitare un layer vuoto solo per anticipazione. Le quantità B2B includono produzione futura; la correzione retail protegge stock corrente e impegno complessivo, non introduce una prenotazione fisica di tutti gli ordini pendenti.
2. **P0 · Backend e autenticazione.** Collegare provider di sessione reale, workspace/tenant, ruoli e autorizzazione server. Persistenza con transazioni e vincoli univoci per ordini, lotti e riserve; audit append-only indipendente dalla cronologia UI.
3. **P1 · Stati asincroni.** Riallineare accessi contestuali ai servizi e route. Loading/empty/error/retry per elenco capi e viste; confermare i salvataggi dopo risposta server, gestire conflitti e cancellazione delle richieste. Upload sicuri e ripristino del workspace.
4. **P1 · Verifica dei flussi.** Test di integrazione per cambio variante, nuova scheda, revisione/approvazione, vendita/spedizione e assegnazioni; CI con test/build e collaudo dei browser supportati. Le regressioni corrette qui hanno già test di dominio mirati.
5. **P2 · Evoluzione UI e distribuzione.** Continuare il consolidamento CSS per famiglia di componenti, centralizzare metadata delle route quando necessario, misurare e suddividere il bundle, versionare DPP e rigenerare QR sull'URL di distribuzione.
