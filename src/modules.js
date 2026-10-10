export const modules = [
  { id: 1, title: 'Ideazione e Design', lines: ['Ideazione', 'e design'], category: 'Creatività', icon: 'design', copy: ['Trasforma idee e riferimenti', 'in concept, palette e varianti.'] },
  { id: 2, title: 'Disegno Tecnico', lines: ['Disegno', 'tecnico'], category: 'Sviluppo prodotto', icon: 'technical', copy: ['Dallo schizzo al disegno tecnico,', 'alle misure e al tech pack.'] },
  { id: 3, title: 'Materiali e Distinta Base', lines: ['Materiali', 'e distinta base'], category: 'Materiali', icon: 'materials', copy: ['Tessuti, accessori e consumi', 'in una distinta base connessa.'] },
  { id: 4, title: 'Modellistica', lines: ['Modellistica', 'digitale'], category: 'Sviluppo prodotto', icon: 'pattern', copy: ['Costruisci i pezzi del modello,', 'con margini, tacche e drittofilo.'] },
  { id: 5, title: 'Grading e Sviluppo Taglie', lines: ['Sviluppo', 'taglie'], category: 'Sviluppo prodotto', icon: 'grading', copy: ['Sviluppa ogni taglia mantenendo', 'misure e proporzioni coerenti.'] },
  { id: 6, title: 'Prototipazione e Campionario', lines: ['Prototipi', 'e campionario'], category: 'Sviluppo prodotto', icon: 'prototype', copy: ['Valida fitting e campioni,', 'fino all’approvazione del capo.'] },
  { id: 7, title: 'Piazzamento', lines: ['Piazzamento', 'del tessuto'], category: 'Ottimizzazione', icon: 'marker', copy: ['Disponi i pezzi sul tessuto', 'e riduci consumo e scarto.'] },
  { id: 8, title: 'Industrializzazione', lines: ['Industrializzazione', 'del capo'], category: 'Processi industriali', icon: 'industrial', copy: ['Definisci operazioni, macchine', 'e tempi di lavorazione.'], serviceInfo: 'Parte da modello approvato, prototipo, tech pack e materiali. Organizza le operazioni in sequenza, associa macchinari e istruzioni e calcola i tempi standard per capo. Il laboratorio riceve così un ciclo di confezione condiviso e misurabile.' },
  { id: 9, title: 'Costificazione e Pricing', lines: ['Costificazione', 'e pricing'], category: 'Costi e margini', icon: 'pricing', copy: ['Dai costi di materiali e lavoro', 'ai prezzi wholesale e retail.'] },
  { id: 10, title: 'Pianificazione della Produzione', lines: ['Pianificazione', 'della produzione'], category: 'Pianificazione', icon: 'planning', copy: ['Collega quantità, capacità', 'e scadenze nel piano produttivo.'] },
  { id: 11, title: 'Procurement e Acquisti', lines: ['Procurement', 'e acquisti'], category: 'Approvvigionamento', icon: 'procurement', copy: ['Gestisci ordini ai fornitori,', 'fabbisogni e stato dei materiali.'] },
  { id: 12, title: 'Produzione', lines: ['Produzione', 'e avanzamento'], category: 'Processi industriali', icon: 'production', copy: ['Segui l’avanzamento dei capi,', 'i consumi e la storia del lotto.'] },
  { id: 13, title: 'Controllo Qualità', lines: ['Controllo', 'qualità'], category: 'Qualità', icon: 'quality', copy: ['Rileva difetti e non conformità,', 'con evidenze e azioni correttive.'] },
  { id: 14, title: 'Magazzino e Inventory', lines: ['Magazzino', 'e inventario'], category: 'Inventory', icon: 'warehouse', copy: ['Organizza stock, ubicazioni', 'e disponibilità per taglia e SKU.'], serviceInfo: 'Riceve capi approvati, SKU, quantità e lotti. Mostra lo stock per taglia, dove si trova e cosa è disponibile. Questi dati aiutano i moduli di logistica e vendita a preparare le attività successive.' },
  { id: 15, title: 'Logistica e Distribuzione', lines: ['Logistica', 'e distribuzione'], category: 'Supply chain', icon: 'logistics', copy: ['Segui spedizioni e consegne,', 'con tracking e tracciabilità.'], serviceInfo: 'Parte da ordini, stock e destinazioni. Organizza le spedizioni, registra tracking, tempi e costi e mantiene la catena di custodia dal magazzino alla consegna.' },
  { id: 16, title: 'Vendita B2B e Wholesale', lines: ['Vendita B2B', 'Wholesale'], category: 'Vendite', icon: 'wholesale', copy: ['Raccogli ordini wholesale,', 'listini e condizioni commerciali.'], serviceInfo: 'Raccoglie catalogo, listini, disponibilità e clienti retailer. Centralizza ordini B2B, quantità per cliente, condizioni commerciali e stato del sell-in, così vendite e magazzino lavorano sugli stessi dati.' },
  { id: 17, title: 'Vendita B2C e Retail', lines: ['Vendita B2C', 'Retail ed e-commerce'], category: 'Vendite', icon: 'retail', copy: ['Connetti vendite online e retail,', 'prezzi, feedback e sell-through.'], serviceInfo: 'Unisce catalogo, stock, prezzi e canali e-commerce e negozio. Registra le vendite e il prezzo realizzato, raccoglie i feedback dei clienti e misura il sell-through per capire come sta andando il prodotto.' },
  { id: 18, title: 'Post-vendita e Fine Vita', lines: ['Post-vendita', 'e fine vita'], category: 'Circolarità', icon: 'lifecycle', copy: ['Riparazioni, seconda vita e riciclo', 'dentro il passaporto digitale.'], serviceInfo: 'Dopo la vendita raccoglie resi, richieste di assistenza, condizioni e feedback sul capo. Registra riparazioni, rivendita o seconda vita e riciclo; ogni evento aggiorna la storia nel passaporto digitale.' },
  { id: 19, title: 'Digital Product Passport', lines: ['Passaporto', 'digitale'], category: 'Identità del capo', icon: 'passport', copy: ['Riunisci la storia del capo', 'in un passaporto digitale.'] },
  { id: 20, title: 'Intelligence Layer e AI Specialistica', lines: ['Intelligence Layer', 'AI specialistica'], category: 'Intelligenza artificiale', icon: 'intelligence', copy: ['AI integrata in ogni modulo', 'per generare gli output dei processi.'], serviceInfo: 'Usa i dati e i file dei processi per produrre output operativi: disegni, distinte base, cartamodelli, piazzamenti, costi, piani e controlli. Risultati e stimoli alimentano il Context Engine e l’assistente decisionale, che supporta le scelte.' },
  { id: 21, title: 'Context Engine e Digital Twin', lines: ['Context Engine', 'Digital Twin'], category: 'Contesto e connessioni', icon: 'context', copy: ['Connetti stato, eventi e relazioni', 'nella vista digitale della filiera.'] },
  { id: 22, title: 'LLM Governante e Decision Intelligence', lines: ['Decision Intelligence', 'Assistente decisionale'], category: 'Decisioni', icon: 'decision', copy: ['Una chat per scenari e decisioni,', 'anche dentro ogni modulo.'] },
];

// Homepage cards follow the demo order and the 16 platform modules in the blueprint.
export const carouselGroup = {
  id: 'all',
  label: 'filiera',
  items: [
    { id: 1, routeId: 1, title: 'Ideazione e Design', lines: ['Ideazione', 'e design'], copy: ['Trasforma idee e riferimenti', 'in concept, palette e varianti.'] },
    { id: 2, routeId: 2, title: 'Disegno Tecnico', lines: ['Disegno', 'tecnico'], copy: ['Dallo schizzo al disegno tecnico,', 'alle misure e al tech pack.'] },
    { id: 3, routeId: 3, title: 'Materiali e Distinta Base', lines: ['Materiali', 'e distinta base'], copy: ['Tessuti, accessori e consumi', 'in una distinta base connessa.'] },
    { id: 4, routeId: 4, title: 'Modellistica', lines: ['Modellistica', 'digitale'], copy: ['Costruisci i pezzi del modello,', 'con margini, tacche e drittofilo.'] },
    { id: 5, routeId: 5, title: 'Grading', lines: ['Grading', 'e sviluppo taglie'], copy: ['Sviluppa ogni taglia mantenendo', 'misure e proporzioni coerenti.'] },
    { id: 6, routeId: 6, title: 'Prototipazione e Campionario', lines: ['Prototipi', 'e campionario'], copy: ['Valida fitting e campioni,', 'fino all’approvazione del capo.'] },
    { id: 7, routeId: 7, title: 'Piazzamento', lines: ['Piazzamento', 'del tessuto'], copy: ['Disponi i pezzi sul tessuto', 'e riduci consumo e scarto.'] },
    { id: 10, routeId: 10, title: 'Industrializzazione e Pianificazione', lines: ['Industrializzazione', 'e pianificazione'], copy: ['Definisci il ciclo produttivo', 'e pianifica quantità e scadenze.'] },
    { id: 9, routeId: 9, title: 'Costi, Pricing e Acquisti', lines: ['Costi, pricing', 'e acquisti'], copy: ['Collega costi, margini, prezzi', 'e ordini ai fornitori.'] },
    { id: 12, routeId: 12, title: 'Produzione e Controllo Qualità', lines: ['Produzione', 'e qualità'], copy: ['Segui avanzamento, scarti', 'e controlli qualità del lotto.'] },
    { id: 15, title: 'Magazzino e Logistica', lines: ['Magazzino', 'e logistica'], copy: ['Organizza stock e spedizioni,', 'con tracking e tracciabilità.'], serviceInfo: 'Mostra stock, ubicazioni e disponibilità per taglia. Organizza spedizioni e consegne, con tracking, costi e catena di custodia.' },
    { id: 17, title: 'Vendita e Ciclo di Vita', lines: ['Vendita', 'e ciclo di vita'], copy: ['Ordini, vendite e storico del capo,', 'fino a riparazione e riciclo.'], serviceInfo: 'Unisce vendita B2B e retail, e-commerce e post-vendita. Raccoglie ordini, prezzi, feedback, resi e assistenza; registra riparazioni, seconda vita e riciclo nel passaporto digitale.' },
    { id: 19, routeId: 19, title: 'Passaporto Digitale', lines: ['Passaporto', 'digitale'], copy: ['Riunisci la storia del capo', 'in un passaporto digitale.'] },
    { id: 22, routeId: 22, title: 'Decision Intelligence', lines: ['Decision Intelligence', 'Assistente decisionale'], copy: ['Un assistente per scenari,', 'analisi e decisioni operative.'] },
  ],
};

// Decision Intelligence has a standalone chat as well as its embedded assistant.
const integratedIds = new Set([8, 14, 15, 16, 17, 18, 20]);

export const moduleGroups = [
  { id: 'modules', label: 'Moduli', items: modules.filter(module => !integratedIds.has(module.id)) },
  { id: 'services', label: 'Servizi Integrati', items: modules.filter(module => integratedIds.has(module.id)) },
];
