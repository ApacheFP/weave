export const modules = [
  { id: 1, title: 'Ideazione e Design', lines: ['Ideazione', 'e design'], category: 'Creatività', icon: 'design', copy: ['Trasforma idee e riferimenti', 'in concept, palette e varianti.'] },
  { id: 2, title: 'Disegno Tecnico', lines: ['Disegno', 'tecnico'], category: 'Sviluppo prodotto', icon: 'technical', copy: ['Dallo schizzo al disegno tecnico,', 'alle misure e al tech pack.'] },
  { id: 3, title: 'Materiali e Distinta Base', lines: ['Materiali', 'e distinta base'], category: 'Materiali', icon: 'materials', copy: ['Tessuti, accessori e consumi', 'in una distinta base connessa.'] },
  { id: 4, title: 'Modellistica', lines: ['Modellistica', 'digitale'], category: 'Sviluppo prodotto', icon: 'pattern', copy: ['Costruisci i pezzi del modello,', 'con margini, tacche e drittofilo.'] },
  { id: 5, title: 'Grading e Sviluppo Taglie', lines: ['Sviluppo', 'taglie'], category: 'Sviluppo prodotto', icon: 'grading', copy: ['Sviluppa ogni taglia mantenendo', 'misure e proporzioni coerenti.'] },
  { id: 6, title: 'Prototipazione e Campionario', lines: ['Prototipi', 'e campionario'], category: 'Sviluppo prodotto', icon: 'prototype', copy: ['Valida fitting e campioni,', 'fino all’approvazione del capo.'] },
  { id: 7, title: 'Piazzamento', lines: ['Piazzamento', 'del tessuto'], category: 'Ottimizzazione', icon: 'marker', copy: ['Disponi i pezzi sul tessuto', 'e riduci consumo e scarto.'] },
  { id: 8, title: 'Industrializzazione', lines: ['Industrializzazione', 'del capo'], category: 'Processi industriali', icon: 'industrial', copy: ['Definisci operazioni, macchine', 'e tempi di lavorazione.'] },
  { id: 9, title: 'Costificazione e Pricing', lines: ['Costificazione', 'e pricing'], category: 'Costi e margini', icon: 'pricing', copy: ['Dai costi di materiali e lavoro', 'ai prezzi wholesale e retail.'] },
  { id: 10, title: 'Pianificazione della Produzione', lines: ['Pianificazione', 'della produzione'], category: 'Pianificazione', icon: 'planning', copy: ['Collega quantità, capacità', 'e scadenze nel piano produttivo.'] },
  { id: 11, title: 'Procurement e Acquisti', lines: ['Procurement', 'e acquisti'], category: 'Approvvigionamento', icon: 'procurement', copy: ['Gestisci ordini ai fornitori,', 'fabbisogni e stato dei materiali.'] },
  { id: 12, title: 'Produzione', lines: ['Produzione', 'e avanzamento'], category: 'Processi industriali', icon: 'production', copy: ['Segui l’avanzamento dei capi,', 'i consumi e la storia del lotto.'] },
  { id: 13, title: 'Controllo Qualità', lines: ['Controllo', 'qualità'], category: 'Qualità', icon: 'quality', copy: ['Rileva difetti e non conformità,', 'con evidenze e azioni correttive.'] },
  { id: 14, title: 'Magazzino e Inventory', lines: ['Magazzino', 'e inventario'], category: 'Inventory', icon: 'warehouse', copy: ['Organizza stock, ubicazioni', 'e disponibilità per taglia e SKU.'] },
  { id: 15, title: 'Logistica e Distribuzione', lines: ['Logistica', 'e distribuzione'], category: 'Supply chain', icon: 'logistics', copy: ['Segui spedizioni e consegne,', 'con tracking e tracciabilità.'] },
  { id: 16, title: 'Vendita B2B e Wholesale', lines: ['Vendita B2B', 'Wholesale'], category: 'Vendite', icon: 'wholesale', copy: ['Raccogli ordini wholesale,', 'listini e condizioni commerciali.'] },
  { id: 17, title: 'Vendita B2C e Retail', lines: ['Vendita B2C', 'Retail ed e-commerce'], category: 'Vendite', icon: 'retail', copy: ['Connetti vendite online e retail,', 'prezzi, feedback e sell-through.'] },
  { id: 18, title: 'Post-vendita e Fine Vita', lines: ['Post-vendita', 'e fine vita'], category: 'Circolarità', icon: 'lifecycle', copy: ['Riparazioni, seconda vita e riciclo', 'dentro il passaporto digitale.'] },
  { id: 19, title: 'Digital Product Passport', lines: ['Passaporto', 'digitale'], category: 'Identità del capo', icon: 'passport', copy: ['Riunisci la storia del capo', 'in un passaporto digitale.'] },
  { id: 20, title: 'Intelligence Layer e AI Specialistica', lines: ['Intelligence Layer', 'AI specialistica'], category: 'Intelligenza artificiale', icon: 'intelligence', copy: ['AI integrata in ogni modulo', 'per generare gli output dei processi.'] },
  { id: 21, title: 'Context Engine e Digital Twin', lines: ['Context Engine', 'Digital Twin'], category: 'Contesto e connessioni', icon: 'context', copy: ['Connetti stato, eventi e relazioni', 'nella vista digitale della filiera.'] },
  { id: 22, title: 'LLM Governante e Decision Intelligence', lines: ['Decision Intelligence', 'Assistente decisionale'], category: 'Decisioni', icon: 'decision', copy: ['Una chat per scenari e decisioni,', 'anche dentro ogni modulo.'] },
];

// Decision Intelligence has a standalone chat as well as its embedded assistant.
const integratedIds = new Set([8, 14, 15, 16, 17, 18, 20]);

export const moduleGroups = [
  { id: 'modules', label: 'Moduli', items: modules.filter(module => !integratedIds.has(module.id)) },
  { id: 'services', label: 'Servizi Integrati', items: modules.filter(module => integratedIds.has(module.id)) },
];
