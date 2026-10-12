# WEAVE · contratti, identità e persistenza locale

12 ottobre 2026. Seconda fase del consolidamento di `prodotto`, successiva all'[audit iniziale](hardening-2026-10-12.md). Ambito concordato: rendere esplicite le azioni, stabilizzare le identità e conservare i dati nel browser. Backend e autenticazione reali sono esclusi da questa fase.

La struttura React/Vite, i flussi, le fixture, il routing hash e l'identità visiva sono mantenuti. Non sono stati introdotti framework, dipendenze o livelli generici di accesso ai dati.

## Confini del codice

| Responsabilità | File | Regola |
| --- | --- | --- |
| Shell, navigazione e accesso demo | `App.jsx`, `AuthPage.jsx`, `Dashboard.jsx` | Stato UI e routing; il login non autentica |
| Collegamento fra UI e workspace | `DemoContext.jsx` | Espone comandi nominati, notifiche e stato del salvataggio |
| Calcoli e invalidazione delle revisioni | `domain.js` | Funzioni pure per costi, stock, impegni, quantità e fitting |
| Operazioni sul capo | `productActions.js` | Creazione, metadati, vendite, produzione, acquisti, ordini, spedizioni, ciclo di vita e approvazione campione |
| Editor e dati comuni | `workspaceCommands.js` | Ogni editor può modificare solo i campi dichiarati; aggiornamento profilo e direzione di collezione separati |
| Identità | `workspaceIdentity.js` | Identità tecniche distinte dai codici e dall'email |
| Schema dei dati locali | `workspaceSchema.js` | Validazione dei dati consumati dalle pagine e dell'envelope salvato |
| Ciclo di persistenza | `useWorkspacePersistence.js` | Caricamento iniziale, stato corrente, coda di scrittura, errori e recupero |
| Adapter locale | `workspaceStore.js` | API `loadWorkspace()` / `saveWorkspace(workspace, expectedRevision)` su IndexedDB |
| Fixture e cataloghi demo | `demoDefaults.js`, `accountData.js`, `productData.js`, `creativeData.js`, `technicalData.js`, `workspaceData.js` | Inizializzazione locale distinta dalle scritture |
| Primitive e download | `ui.jsx`, `exportFiles.js` | Componenti condivisi ed export browser |

Le pagine conservano draft, selezioni e dialog locali. I dati accettati dai comandi appartengono al workspace. Il provider mantiene ancora le azioni per attività, Inbox e preferenze: non è stato aggiunto un modulo per ogni piccolo aggiornamento. Un servizio remoto concreto potrà sostituire l'adapter locale senza spostare calcoli e validazioni nelle pagine.

## Identità e codici

- Il workspace e il profilo hanno un `id`; ogni variante ha un `id` e un `modelId`. `modelId` collega le colorazioni dello stesso modello senza dedurre equivalenze dai nomi.
- `styleId`, `productId` e i codici visibili di ordine, lotto, campione e spedizione mantengono il loro ruolo commerciale. Le pagine mostrano questi codici; gli UUID non diventano etichette dell'interfaccia.
- Le righe di acquisti, ordini wholesale, spedizioni ed eventi di vita hanno anche un `recordId`. La copia di un capo assegna nuove identità e rimappa i riferimenti ai record copiati, conservando il capo sorgente.
- Attori e assegnatari usano l'ID del profilo. Cambiare email non cambia il proprietario e non trasferisce le attività di un altro autore. Il confronto per email resta un fallback per dati legacy privi di ID.
- Le fixture ricevono identità deterministiche; i nuovi record usano `crypto.randomUUID()`. Gli ID già presenti sono preservati dalla normalizzazione.

I metadati del capo possono cambiare senza cambiare `id` o `modelId`. I collegamenti UI che ancora usano il codice del capo vengono aggiornati insieme ai metadati. Questi contratti sono una base per un futuro schema server, non definiscono ancora uno schema relazionale completo.

## Comandi e invarianti

Le pagine non espongono più il generico `commit` per applicare patch a qualunque parte del capo. I comandi operativi ricevono il workspace corrente, l'identità del capo e gli input; restituiscono un nuovo workspace oppure un errore esplicito. Il provider verifica e applica la modifica contro lo stato più recente, anche quando più azioni arrivano prima del successivo render.

Le regole protette includono:

- unicità del codice del capo e quantità compatibile con produzione e impegni già registrati;
- vendita retail entro stock fisico e quantità non impegnata dal wholesale;
- ordine wholesale entro la quantità pianificata ancora disponibile;
- spedizione entro stock e residuo dell'ordine, con aggiornamento congiunto dei due record;
- registrazione della produzione entro il residuo del lotto e solo con produzione attiva;
- acquisti con codici univoci, quantità e prezzi validi; eventi di vita con tipi dichiarati e date reali, senza affidare l'identità a un timestamp troncato;
- approvazione del campione dopo il completamento delle verifiche; conferme già applicate senza eventi duplicati;
- riapertura del fitting e delle revisioni quando cambiano gli input relativi, mantenendo approvazioni e cronologia quando gli input restano identici.

Gli editor mantengono patch contestuali, con una lista esplicita di campi per sezione. Per esempio, modellistica può cambiare margine, versione e cronologia del modello; non può cambiare vendite o identità. Il workspace completo viene validato prima dell'applicazione e del salvataggio. Errori di validazione non producono eventi di successo.

La transazionalità qui riguarda l'aggiornamento coerente del singolo workspace locale. Non implementa transazioni fra utenti o servizi remoti, né un registro di audit immutabile: la cronologia operativa UI resta limitata a 40 eventi per capo.

## Salvataggio e recupero

L'adapter usa il database IndexedDB `weave-workspace`, lo store `workspaces` e la chiave `atelier-local`. L'envelope memorizzato contiene `version`, `revision`, `savedAt` e `workspace`. La versione attuale dello schema è `1`; la versione del database IndexedDB è un dato separato.

Prima di mostrare le pagine, l'app legge e valida il record. Le fixture vengono usate solo se non esiste un salvataggio. Oggetti malformati o versioni non supportate interrompono il caricamento: il record originale è preservato, scaricabile quando è disponibile, e non viene sostituito silenziosamente dalla demo. È possibile riprovare oppure aprire una sessione temporanea, che non scrive sul record esistente.

Le scritture sono serializzate; gli aggiornamenti in attesa possono essere accorpati nel più recente snapshot. Lo stato **Salvato** compare solo dopo il completamento della transazione IndexedDB. Gli errori mantengono le modifiche in memoria, sospendono le scritture automatiche e offrono esportazione e recupero. L'uscita attende anche le modifiche arrivate durante una scrittura; se il salvataggio fallisce o la sessione temporanea contiene modifiche, richiede una scelta esplicita prima di abbandonarle. Il browser viene avvisato quando una chiusura o un ricaricamento rischia di perdere modifiche non salvate.

Il confronto della revisione attesa avviene nella stessa transazione di lettura/scrittura: una scheda con uno snapshot obsoleto non può sovrascrivere quello aggiornato da un'altra scheda. Un conflitto richiede la riapertura esplicita dei dati salvati, con possibilità di esportare prima le modifiche locali. Non è implementata fusione automatica o sincronizzazione in tempo reale fra schede.

Il salvataggio comprende capi, collezioni, attività, Inbox e risposte, profilo e preferenze. Il login, le password inserite nei form, le simulazioni di invito/revoca sessioni e i draft UI non sono credenziali o servizi persistenti. Alcune preferenze conservate, come lingua, fuso e pagina iniziale, restano anteprime e non sono applicate globalmente.

Il file di backup scaricato contiene lo schema e il workspace. Non è ancora disponibile un flusso di importazione del backup; il download serve a conservare i dati e consentire un recupero successivo.

## Verifiche e limiti attuali

Le verifiche eseguibili restano `npm test` e `npm run build`. La suite della seconda fase ha superato **56 test**: dati e regole esistenti, identità, copia e rimappatura, comandi operativi, campi consentiti degli editor, profilo, schema dei record e uscita durante salvataggi ritardati o falliti. La build è riuscita: **557,47 kB JavaScript** (164,35 kB gzip), **188,71 kB CSS** (32,53 kB gzip). L'avviso Vite per il chunk oltre 500 kB resta presente.

Nel browser sono stati verificati:

- creazione del capo, revisione del modello, aggiornamento profilo, creazione e modifica acquisti, registrazione del ciclo di vita; salvataggi letti direttamente da IndexedDB e ripristino dopo ricaricamento e uscita;
- cambio email del proprietario verso quella di un collaboratore demo: identità e conteggio delle proprie attività conservati, profilo ripristinato dopo ricaricamento;
- due schede sulla stessa revisione: il secondo aggiornamento viene rifiutato, il primo rimane salvato e la ricarica esplicita recupera lo snapshot vincente;
- errore di quota simulato sulla scrittura: modifica conservata in memoria, backup JSON completo scaricato e retry riuscito;
- record con versione `999`: caricamento bloccato, originale esportato e preservato dopo modifiche in sessione temporanea; uscita dalla temporanea modificata con conferma;
- storage indisponibile: recupero in sessione temporanea e schermata di errore leggibile a 320 px;
- adapter nativo con due scritture concorrenti: una sola accettata; snapshot con un riferimento di oltre 6 MB salvato e riletto senza troncamento.

I 15 moduli sono stati aperti a 1440 e 320 px, per 30 combinazioni senza overflow della pagina o errori di rendering. Le 8 pagine comuni sono state controllate alle stesse larghezze, per altre 16 combinazioni. Questi controlli usano Chrome locale e viewport emulati; non certificano Safari, Firefox, dispositivi fisici o lettori di schermo reali. Il collaudo browser è stato eseguito con il CLI Playwright esterno: non è ancora incluso nella suite automatica del repository.

Limiti che restano rilevanti per il prossimo sviluppo:

- IndexedDB appartiene alla stessa origine e allo stesso profilo del browser. Cambiare dominio, porta o browser apre un salvataggio diverso; cancellare i dati del sito elimina quello locale. Non c'è sincronizzazione fra dispositivi né backup remoto.
- Il salvataggio è uno snapshot dell'intero workspace. File locali e immagini caricate possono aumentarne il peso; quota e disponibilità dipendono dal browser. Non è un sistema di storage degli asset per un prodotto multiutente.
- Non esistono autenticazione, tenant, autorizzazioni server o isolamento fra utenti reali. Gli ID del profilo locale e le viste DPP non concedono permessi.
- La versione `1` impedisce di accettare record incompatibili, ma non contiene un sistema generale di migrazioni. Una futura modifica dello schema richiederà una migrazione esplicita e testata.
- Schema e comandi proteggono i dati usati dall'app attuale; non sostituiscono la validazione dei payload, i vincoli di database o la sicurezza di un backend.
- Dati AI, pubblicazione DPP, geometrie CAD e pannelli di sicurezza restano dimostrativi. Gli export non certificano dati industriali o tracciabilità.
- Restano CSS storici e metadati di navigazione distribuiti, oltre al bundle da misurare e suddividere. Questi aspetti vanno consolidati per funzionalità, con regressioni visive controllate.

## Roadmap prioritaria

1. **P0 · Primo flusso API persistente.** Definire il modello server per workspace, modelli/varianti, utenti, ordini e spedizioni. Collegare un flusso completo, come elenco e aggiornamento capo, tramite un adapter sottile; decidere DTO, migrazione del locale e ripristino dei backup. Conservare le regole testate e applicare transazioni e vincoli univoci nel database.
2. **P0 · Sessione e permessi reali.** Introdurre autenticazione, appartenenza al workspace e ruoli verificati sul server. Le operazioni di stock e l'audit devono dipendere dall'identità autenticata, con idempotenza e controllo dei conflitti server.
3. **P1 · Asset e stati remoti.** Separare gli allegati dai record del workspace; implementare upload e validazione server. Aggiungere errori di rete, retry, richieste annullabili e gestione delle modifiche concorrenti nei flussi collegati all'API.
4. **P1 · Verifica ripetibile dei flussi.** Integrare test/build in CI e automatizzare creazione, cambio variante, approvazione, vendita/spedizione, salvataggio, conflitto e recupero. Collaudare i browser dichiarati supportati e riallineare gli accessi contestuali ai servizi.
5. **P2 · Distribuzione e prestazioni.** Misurare caricamento e bundle, poi separare le pagine e il carosello quando utile. Versionare la pubblicazione DPP, rigenerare il QR sull'URL pubblico e completare la verifica dei font commerciali già documentata nel README.

Il consolidamento rende i confini e il comportamento locale verificabili. La disponibilità di un backend, di autorizzazioni server e di prove sui flussi remoti resta necessaria prima di dichiarare il prodotto pronto per la produzione.
