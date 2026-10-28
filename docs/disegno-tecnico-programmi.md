# Disegno tecnico: programmi vettoriali

Questa è la base iniziale della fase 1, non il modello AI descritto nel documento di Fase 0. Nel modulo 2, la scheda **Programma** mostra un esempio di camicia sintetica: «Verifica e visualizza» lo esegue, «Salva sulla tavola» crea una nuova revisione per la vista selezionata. Il programma originale e le tavole manuali hanno copie separate: modificare una tavola nell'editor non riscrive il programma. Applicare nuovamente il programma crea una revisione e sostituisce la tavola manuale per quella vista.

Il programma è JSON con `version: 1`, `garment` e `parts`; ogni parte ha `name`, `description` e `operations`. Coordinate in unità normalizzate, area x da -600 a 600 e y da 0 a 1000. Sono disponibili percorsi M/L/C/Q/Z, polilinee, ellissi, rettangoli, gruppi, specchio, traslazione, rotazione, scala, ripetizione lineare, offset e onda su polilinea, con stili contorno, cucitura, impuntura e dettaglio. Offset e onda sono approssimazioni su polilinee, non offset esatti di curve. Il generatore valida struttura, numeri, riempimenti e limiti; non verifica ancora autointersezioni o qualità sartoriale. Mancano ritaglio, ripetizione lungo percorso, vincoli di allineamento, canonizzazione e compressione geometrica.

L'estrattore accetta solo gli SVG normalizzati generati da questo modulo, con comandi e trasformazioni supportati. Non interpreta file AI, SVG arbitrari o grafica complessa di Illustrator e non riconosce automaticamente simmetrie, offset o ripetizioni. Il test sintetico SVG → estrazione → SVG conserva l'aspetto nell'esempio, ma non è una valutazione su file di esperti.

In `examples/technical/` ci sono il programma, l'SVG modificabile in Illustrator e un'immagine raster dello stesso disegno. Sono esempi creati per lo sviluppo, non il file originale né un'etichetta esperta. Non viene creato un file `.ai` nativo. Il campione raster è generato dallo stesso programma e pertanto non è un test indipendente.

## Controllo dei dati

`npm run technical:dataset -- examples/technical/dataset.example.json` verifica il manifesto, i file e i programmi; controlla diritti dichiarati, gruppo del capo, autori dell'insieme d'oro e separazione delle suddivisioni. La dichiarazione dei diritti non ne dimostra l'effettiva titolarità. L'esempio è esclusivamente per sviluppo: non ci sono dati di addestramento o insieme d'oro.

Da realizzare: estrazione e prova su file AI di esperti, etichettatura e revisione umana, misure di scarto geometrico e qualità, Insegnante, pipeline di etichette sintetiche, dati reali e insieme d'oro, addestramento del modello e inferenza da foto o schizzi. La generazione da immagine nella UI rimane una simulazione separata dal laboratorio di programmi.
