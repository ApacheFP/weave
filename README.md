# WEAVE prodotto

Prima schermata del prodotto in React: titolo **weave** e selettore animato **Moduli / Servizi Integrati**. Le 22 fasi della filiera sono distribuite in 15 moduli e 7 servizi integrati.

All’apertura si mostra una pagina di accesso e registrazione simulati, con una card bianca centrata nella pagina, accenti beige e hover ocra. Titoli, selettore e pulsante usano Stay With Me come il logo. I campi sono già compilati per la demo e la password può essere mostrata o nascosta. Entrambi i form portano al carosello. Non vengono inviati né salvati dati di accesso e al ricaricamento si torna al login.

Il menu profilo in alto a destra si ispira agli account menu di Prova1 e alla presentazione dell’avatar in Prova2. Mostra un avatar fittizio generato con Imagegen, nome, cognome ed email; il profilo è modificabile e le impostazioni permettono di simulare le preferenze per avvisi e novità. Le modifiche rimangono nella sessione React e vengono azzerate all’uscita. Il menu si chiude con Escape o cliccando all’esterno; **Esci da weave** torna al login. Avatar WebP: `public/illustrations/profile-avatar.webp`. Originale e prompt: `assets/profile/`.

```sh
npm install
npm run dev
```

`npm run build` prepara la versione distribuibile.

Il bundle `public/carousel.js` include Three.js r184; il suo avviso di copyright e la licenza MIT sono in `public/THIRD-PARTY-NOTICES.txt`.

## Pubblicazione su Vercel

La repo contiene direttamente questa app, quindi in Vercel seleziona la root `.`. Il framework Vite viene rilevato automaticamente; i valori attesi sono `npm run build` come comando di build e `dist` come cartella di output. L’installazione usa `package-lock.json` e non servono variabili d’ambiente. Non è necessario un `vercel.json`.

Prima della pubblicazione commerciale o promozionale, verifica la licenza web del font **Stay With Me** indicata in `public/fonts/FONT-LICENSE.txt`.

Il motore WebGL in `public/carousel.js` deriva dal file `carousel.html` fornito come riferimento: mantiene geometria, gradienti, dissoluzione in particelle, trascinamento, scroll e scorrimento circolare. Il DPR è limitato a 1,5 su desktop e 2 su mobile; a DPR 2 le texture delle card sono 1280×1600 per migliorare la nitidezza dei testi, altrimenti 1024×1280. Il multisampling è a 2 campioni e il render target della scena non genera mipmap. A carosello fermo il wrapper non applica trasformazioni CSS. Le 22 card usano sei variazioni di bianco caldo e beige, con testi scuri e ombre morbide sulle illustrazioni per mantenerle leggibili sui fondi chiari. I contenuti seguono il documento di filiera e le successive indicazioni sul prodotto.

I titoli delle card usano **Matcha Style**, caricato prima di generare le texture e adattato allo spazio disponibile per le righe lunghe. Fonte: [DaFont](https://www.dafont.com/it/matcha-style.font); condizioni in `public/fonts/matcha-LICENSE.txt`.

Il titolo **weave** mantiene **Stay With Me** di Origin Type. Le condizioni del pacchetto sono in `public/fonts/FONT-LICENSE.txt`: la versione scaricata è gratuita per uso personale; per uso commerciale o promozionale l’autore richiede una [licenza commerciale](https://originfonts.com/product/stay-with-me/).

Ogni card usa un’immagine WebP statica trasparente generata con Imagegen, nello stesso stile di miniature bianche e grigie in clay/paper. I file pronti per il browser sono in `public/illustrations/module-01.webp` fino a `module-22.webp`; le immagini decodificate sono riutilizzate tra i cambi di sezione. Ogni cartella `assets/animation-frames/module-XX` conserva la tavola originale, quattro PNG e il prompt esatto della precedente lavorazione; il primo fotogramma è l’immagine scelta per la card. La preferenza di sistema per ridurre le animazioni disattiva le transizioni del selettore.

**Moduli:** fasi 1–7, 9–13, 19, 21 e 22. **Servizi Integrati:** fasi 8, 14–18 e 20. Post-vendita compare nel DPP e l’AI specialistica produce gli output nei moduli. **Decision Intelligence** è un modulo con chat autonoma e un assistente disponibile anche nel contesto di ogni modulo.

La navigazione funziona con trascinamento, scroll, pulsanti o frecce della tastiera. Home ed End raggiungono il primo e l’ultimo modulo. Le card presentano i moduli; il collegamento alle dashboard è il passo successivo.

Il cambio tra Moduli e Servizi Integrati usa uno zoom out dell’intero carosello (240 ms), seguito dallo zoom in del nuovo carosello (420 ms) quando il rendering è pronto. Logo e selettore restano fermi. La preferenza per ridurre le animazioni rende il cambio immediato.
