# Editor vettoriale manuale — 12 ottobre 2026

## Problema e scelta

Il modulo 2 consentiva revisioni delle misure e prompt dimostrativi, ma non una modifica grafica diretta del disegno. È stata aggiunta una tavola ampia mediante Fabric.js 7.4 (MIT): import SVG, selezione, trasformazioni, tracciati e controlli dei nodi sono quelli della libreria. Il codice applicativo gestisce strumenti, sessione, revisioni e integrazione nel workspace. Nessun framework o backend nuovo.

Il componente è caricato con React.lazy; il chunk dell’editor pesa circa 309 kB (98 kB gzip). La build segnala ancora il chunk principale sopra 500 kB, circa 568 kB: la suddivisione dei moduli esistenti resta un lavoro separato.

## Confini dei dati

- `VectorEditor.jsx`: canvas e bozza in memoria, fino a 40 stati annulla/ripeti. Non scrive direttamente nel catalogo o in IndexedDB.
- `vectorDocument.js`: documento versionato, validazione e aggiornamento immutabile delle viste; SVG esportabile e JSON per riprendere il lavoro.
- `TechnicalPage.jsx`: apre la vista selezionata, salva una nuova revisione attraverso `saveTechnical`, mantiene le revisioni precedenti e gli altri lati del disegno.
- `workspaceSchema.js`: accetta il campo opzionale `snapshot.artwork`; i workspace precedenti rimangono validi senza migrazione distruttiva.
- `TechnicalDrawing.jsx`: anteprima del manuale salvato; il disegno parametrico rimane la base delle viste non modificate.
- `domain.js`: una diversa grafica approvata riapre il fitting; una bozza lascia valida l’approvazione precedente.

La grafica in pixel non è collegata automaticamente alle quote in centimetri, alla modellistica o alla BOM. Il confine è dichiarato nell’editor e nell’anteprima. Le modifiche alle quote non deformano automaticamente una tavola manuale già salvata. Il selettore delle varianti dell’anteprima è disabilitato per le viste manuali: fill e stroke si modificano nell’editor.

## Verifiche

`npm test`: **66 test, 66 passati**. I nuovi casi proteggono serializzazione, coordinate e comandi dei tracciati, isolamento completo degli snapshot e delle viste, esclusione di tipi esterni/immagini/pattern, limiti anche dentro i gruppi, validazione del workspace e riapertura del fitting.

`npm run build`: riuscita, con l’avviso di dimensione del chunk principale sopra indicato. `npm audit --omit=dev`: nessuna vulnerabilità segnalata alla verifica. `git diff --check`: riuscito.

Collaudo CLI Playwright su Chrome, build locale in preview:

1. Apertura della tavola senza generazione né upload precedente; import del disegno base in 17 livelli semantici.
2. Cambio della larghezza nell’ispettore; annulla/ripeti ripristina i valori. Trascinamento del controllo d’angolo: larghezza grafica da 262 a 322,3 px.
3. Spostamento di un nodo: il comando del path cambia nel JSON salvato e rimane diverso dalla revisione precedente dopo la riapertura.
4. Rettangolo, duplicazione, rotazione nell’ispettore, ellisse, linea, matita libera e penna a vertici; testo digitato direttamente sulla tavola. Corretto il contenitore della textarea di Fabric, che deve restare dentro la finestra modale per ricevere il focus.
5. Separazione di un gruppo e ripristino con annulla; riapertura del documento con livelli e proprietà conservati. Il salvataggio di una tavola riaperta e immutata è disabilitato.
6. Salvataggio locale, reload e nuovo accesso demo: revisioni e grafica rimangono disponibili. Lettura del record IndexedDB conferma JSON e modifiche dei path; i documenti precedenti sono conservati.
7. Chiusura con X ed Escape protetta dalla conferma; continuazione del lavoro e scarto verificati. L’avviso nativo prima del reload di una bozza modificata è stato verificato e annullato.
8. Download SVG con viewBox 1600×1200, 46 path e testo modificabile, senza immagini raster; download PDF con intestazione PDF-1.4. Il PDF riusa il generatore esistente e incorpora le tavole come figure raster; per l’editing vettoriale si usa l’SVG.
9. Layout desktop 1280×720, mobile 320×780 e 320×568: tavola visibile, controlli di salvataggio entro lo schermo. Corretto il ricalcolo della vista al ridimensionamento della finestra. Screenshot locali in `output/playwright/` (ignorati da Git).

Questi sono controlli browser manualmente automatizzati, non una suite e2e CI. Il PDF è stato verificato come download e struttura di base, non pagina per pagina con un renderer PDF. Non è stato collaudato il deployment pubblico, né hardware touch reale, Safari o Firefox.

## Limiti e priorità

La penna aggiunge segmenti a vertici; i nodi modificano anche le curve presenti. Non sono implementati gli strumenti completi di Illustrator: operazioni booleane, import AI/SVG arbitrario, vincoli CAD, ancoraggio metrico, collaborazione. Sono ammessi 500 elementi complessivi (inclusi i figli dei gruppi), 2 MB ciascuno per JSON e SVG della singola vista; immagini e riferimenti esterni sono esclusi. La bozza non salvata resta in memoria: la protezione beforeunload dipende dal browser e non sostituisce un autosalvataggio.

Priorità successive: definire il collegamento intenzionale fra grafica e specifiche tecniche; introdurre un contratto di documenti/revisioni sul backend con autorizzazioni; aggiungere controllo della concorrenza e conservazione delle revisioni; promuovere i flussi principali a e2e CI e collaudare browser/touch reali. La persistenza resta locale al dispositivo, con lo stato del salvataggio mostrato dalla shell esistente.
