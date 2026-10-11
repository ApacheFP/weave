// Category specifications feed the existing workspace, editor and exports.
export const additionalFabrics = [
  { id: 'riva-wool', name: 'Lana stretch · Pietra', code: 'TES-041', price: 24, wool: 98, composition: '98% lana vergine · 2% elastan', supplier: 'Lanificio Biellese', origin: 'Italia', weight: 240, unit: 'm', category: 'trousers', tone: '#a59b8d', certificate: 'Scheda tessuto demo IT-9041', asset: 'trousers-fabric' },
  { id: 'trama-canvas', name: 'Canvas di cotone · Argilla', code: 'TES-052', price: 18, wool: 0, composition: '100% cotone', supplier: 'Tessitura Pratese', origin: 'Italia', weight: 420, unit: 'm', category: 'bag', tone: '#a88c6a', certificate: 'Scheda canvas demo IT-9052', asset: 'bag-fabric' },
  { id: 'luce-yarn', name: 'Merino e cashmere · Avorio', code: 'FIL-063', price: 78, wool: 90, composition: '90% lana merino · 10% cashmere', supplier: 'Filatura Toscana', origin: 'Italia', weight: null, unit: 'kg', category: 'knit', tone: '#eee4d3', certificate: 'Scheda filato demo IT-9063 · Nm 2/28', asset: 'knit-fabric' },
];

const jacketPieces = [
  ['Davanti', 'front', 2], ['Dietro', 'back', 2], ['Manica sopra', 'upper-sleeve', 2], ['Manica sotto', 'under-sleeve', 2], ['Colletto', 'collar', 1], ['Paramontura', 'facing', 2],
];
export const categorySpecs = {
  jacket: {
    label: 'Capospalla', sizes: [38, 40, 42, 44, 46, 48], baseSize: 42, increments: [.5, 1, 4, .5], gradeIndex: 2,
    requirements: 'Giacca monopetto, vestibilità regular, tre bottoni e due tasche con pattina.', fit: 'Regular', tolerance: 1,
    parts: { collar: 8, pocket: 14, seam: 1 }, partLabels: { collar: 'Colletto', pocket: 'Tasca', seam: 'Cuciture' },
    revisionPrompts: ['Accorcia la manica di 1 cm', 'Allunga il capo di 2 cm', 'Allarga le spalle di 1 cm', 'Porta la tasca a 16 cm'],
    pieces: jacketPieces, operations: [['Taglio e preparazione', 'Taglierina', 8], ['Assemblaggio davanti', 'Lineare', 9], ['Tasche e pattine', 'Lineare', 6], ['Unione spalle e fianchi', 'Lineare', 5], ['Montaggio maniche', 'Braccio libero', 7], ['Fodera e colletto', 'Lineare', 7], ['Bottoni e asole', 'Asolatrice', 3], ['Stiro e finitura', 'Stiro a vapore', 3]],
    checks: ['Accorciata la manica di 1 cm', 'Vestibilità regular verificata', 'Cucitura spalla ricontrollata'], fitting: [1, 3, 2], deltas: [.8, 1, 0],
    quality: { id: 'NC-018', title: 'Cucitura spalla', point: 'Spalla', description: 'La cucitura della spalla sinistra presenta un disallineamento. Possibile causa: tensione del filo o regolazione della macchina lineare.', deltas: [.8, .3], position: { right: '12%', top: '22%' } },
    care: 'Lavaggio a secco. Non candeggiare. Stirare a temperatura moderata con un panno protettivo. Riporre su una gruccia, in un luogo asciutto.', repair: 'Bottoni sostituibili', lining: 'Viscosa', co2: '18,4 kg',
    retailNote: 'Le taglie 42 e 44 guidano la domanda. I clienti apprezzano la struttura e la mano della lana.',
    baselineConsumption: 1.85, markerBaseWidth: 150, materialLabel: 'Tessuto', materialNote: 'Tessuto, fodera, tela, bottoni, imballo', markerStages: ['Preparazione', 'Taglio', 'Confezione', 'Qualità e finitura'],
  },
  trousers: {
    label: 'Pantalone', prefix: 'trousers', sizes: [38, 40, 42, 44, 46, 48], baseSize: 42, increments: [.5, 4, 4, .5], gradeIndex: 1,
    requirements: 'Pantalone a vita medio-alta, gamba dritta ampia, una piega per lato, tasche oblique e due filetti dietro. Cintura con passanti, zip coperta e bottone corozo.', fit: 'Relaxed', tolerance: .5,
    parts: { waistband: 4, pocket: 16, seam: 1 }, partLabels: { waistband: 'Cintura', pocket: 'Tasca', seam: 'Cuciture' },
    revisionPrompts: ['Accorcia la lunghezza di 1 cm', 'Allarga la vita di 2 cm', 'Allarga il bacino di 2 cm', 'Porta la tasca a 17 cm'],
    pieces: [['Gamba davanti', 'front', 2], ['Gamba dietro', 'back', 2], ['Cintura', 'waistband', 2], ['Sacco tasca', 'pocket', 4], ['Patta', 'fly', 2]],
    operations: [['Taglio e preparazione', 'Taglierina', 5], ['Pinces, pieghe e tasche', 'Lineare', 8], ['Patta e zip', 'Lineare', 5], ['Unione gambe e cavallo', 'Tagliacuci / lineare', 6], ['Cintura e passanti', 'Lineare', 6], ['Orlo, bottone e stiro', 'Punto invisibile / stiro', 6]],
    checks: ['Lunghezza e piega centrale verificate', 'Vita e bacino verificati in fitting', 'Orlo invisibile ricontrollato'], fitting: [1, 2, 0], deltas: [.4, 0, .5],
    quality: { id: 'NC-021', title: 'Orlo gamba', point: 'Orlo', description: 'L’orlo della gamba destra presenta una lieve arricciatura. Ridurre la tensione del punto invisibile e vaporizzare senza schiacciare la lana.', deltas: [.4, .3], position: { right: '28%', top: '88%' } },
    care: 'Lavaggio a secco. Stirare a bassa temperatura con panno, seguendo la piega. Non asciugare in tamburo; riporre appeso dalla cintura.', repair: 'Zip e orlo riparabili', lining: 'Tasche in cotone', co2: '9,8 kg',
    retailNote: 'Le taglie 40 e 42 guidano la domanda. La lana stretch e la gamba dritta sono apprezzate nel completo con Giacca Atelier.',
    baselineConsumption: 1.45, markerBaseWidth: 150, materialLabel: 'Tessuto', materialNote: 'Lana stretch, sacchi tasca, cintura, zip e corozo', markerStages: ['Preparazione', 'Taglio', 'Confezione', 'Stiro e qualità'],
  },
  bag: {
    label: 'Borsa', prefix: 'bag', sizes: ['Unica'], baseSize: 'Unica', increments: [0, 0, 0, 0], gradeIndex: null,
    requirements: 'Tote strutturata in canvas, corpo trapezoidale 34 × 29 × 12 cm, due manici in pelle testa moro, rinforzi agli angoli, zip incassata in ottone e tasca interna.', fit: 'Taglia unica', tolerance: .3,
    parts: { handle: 2, zipper: 32, seam: 1 }, partLabels: { handle: 'Larghezza manico', zipper: 'Zip', seam: 'Cuciture' },
    revisionPrompts: ['Allarga la larghezza di 1 cm', 'Aumenta l’altezza di 1 cm', 'Aumenta la profondità di 1 cm', 'Allunga il manico di 2 cm'],
    pieces: [['Pannello corpo', 'front', 2], ['Fondo', 'base', 1], ['Mostrina zip', 'zipper', 2], ['Manico in pelle', 'handle', 2], ['Tasca interna', 'pocket', 1]],
    operations: [['Taglio canvas e pelle', 'Taglierina / trancia', 6], ['Preparazione manici e angoli', 'Scarnitrice / lineare', 8], ['Zip, tasca e fodera', 'Lineare', 7], ['Corpo e fondo', 'Triplice trasporto', 9], ['Attacco manici', 'Travettatrice', 5], ['Finitura e prova carico', 'Banco manuale', 5]],
    checks: ['Dimensioni e apertura zip verificate', 'Manici verificati con carico di 5 kg', 'Travette attacco manici ricontrollate'], fitting: [0, 2, 3], deltas: [.2, 0, .3],
    quality: { id: 'NC-022', title: 'Attacco manico', point: 'Manico', description: 'La travetta del manico sinistro presenta punti irregolari. Rifare la cucitura sul rinforzo e ripetere la prova con carico di 5 kg.', deltas: [.2, .2], position: { right: '38%', top: '46%' } },
    care: 'Pulire il canvas con panno appena umido, senza immersione. Nutrire solo le parti in pelle con prodotto neutro. Asciugare all’ombra e riporre con carta di sostegno.', repair: 'Manici e zip sostituibili', lining: 'Cotone', co2: '6,2 kg',
    retailNote: 'Taglia unica. I clienti apprezzano capienza, manici in pelle riparabili e canvas compatto; la palette Argilla accompagna i capispalla della capsule.',
    baselineConsumption: .65, markerBaseWidth: 140, materialLabel: 'Canvas', materialNote: 'Canvas, fodera cotone, manici e rinforzi pelle, zip', markerStages: ['Preparazione', 'Taglio canvas e pelle', 'Assemblaggio', 'Prova carico e qualità'],
  },
  knit: {
    label: 'Maglia', prefix: 'knit', sizes: ['XS', 'S', 'M', 'L', 'XL'], baseSize: 'M', increments: [1, 1, 4, 1], gradeIndex: 2,
    requirements: 'Girocollo relaxed in merino e cashmere, maglia rasata finezza 7, maniche montate e calature fully fashioned. Collo, fondo e polsi a costa 1×1.', fit: 'Relaxed', tolerance: .7,
    parts: { neckband: 2.5, rib: 5, seam: .5 }, partLabels: { neckband: 'Bordo collo', rib: 'Altezza costa', seam: 'Rimaglio' },
    revisionPrompts: ['Accorcia la manica di 1 cm', 'Allunga il capo di 2 cm', 'Allarga le spalle di 1 cm', 'Allarga il torace di 2 cm'],
    pieces: [['Pannello davanti', 'front', 1], ['Pannello dietro', 'back', 1], ['Manica sagomata', 'sleeve', 2], ['Bordo collo', 'neckband', 1]],
    operations: [['Programmazione e smacchinatura', 'Rettilinea finezza 7', 14], ['Rimaglio spalle e maniche', 'Rimagliatrice', 8], ['Applicazione bordo collo', 'Rimagliatrice', 4], ['Chiusura fianchi e maniche', 'Rimagliatrice', 5], ['Lavaggio e stabilizzazione', 'Lavaggio lana', 5], ['Vaporizzo, misure ed etichetta', 'Banco vapore', 4]],
    checks: ['Misure dopo stabilizzazione verificate', 'Girocollo e vestibilità relaxed verificati', 'Punti di rimaglio ai polsi ricontrollati'], fitting: [1, 3, 2], deltas: [.5, .5, 0],
    quality: { id: 'NC-023', title: 'Rimaglio polso', point: 'Polso', description: 'Un punto saltato nella giunzione del polso destro interrompe la costa. Riprendere la maglia con lo stesso filato e ricontrollare l’elasticità.', deltas: [.5, .4], position: { right: '13%', top: '83%' } },
    care: 'Lavare a mano a 30 °C con detergente per lana. Non torcere; asciugare in piano. Vaporizzare leggermente e riporre piegata con protezione antitarme.', repair: 'Rimaglio e rammendo del filato', lining: 'Non prevista', co2: '7,6 kg',
    retailNote: 'Le taglie S e M guidano la domanda. Il girocollo Avorio e la mano morbida del merino e cashmere completano pantalone Riva e giacche sartoriali.',
    baselineConsumption: .38, markerBaseWidth: 0, materialLabel: 'Filato', materialNote: 'Filato, bordi a costa, nastro spalla ed etichette', markerStages: ['Programmazione', 'Smacchinatura', 'Rimaglio', 'Stabilizzazione e qualità'],
  },
};

export const productSpec = data => categorySpecs[data.category || 'jacket'];
export const productSizes = data => productSpec(data).sizes;
export const materialUnit = data => data.category === 'knit' ? 'kg' : 'm';
export const categoryFabrics = (data, fabrics) => fabrics.filter(item => (item.category || 'jacket') === (data.category || 'jacket'));
export const piecesFor = data => productSpec(data).pieces.map(([name, key, qty]) => ({ name, key, qty, asset: `${productSpec(data).prefix ? `${productSpec(data).prefix}-pattern` : 'pattern'}-${key}` }));
export const productMedia = (data, role) => {
  const spec = productSpec(data);
  if (data.category === 'bag' && role === 'grading' || data.category === 'knit' && role.startsWith('marker-')) return `${spec.prefix}-pattern`;
  if (spec.prefix) return `${spec.prefix}-${role}`;
  if (role === 'sample' && data.variant !== 'Cammello') return data.variant === 'Nero' ? 'jacket-black' : 'jacket-sand';
  if (role === 'quality') return data.variant === 'Sabbia' ? 'quality-sand' : 'quality-seam';
  return ({ front: 'technical-front', sketch: 'sketch', sample: 'sample', trims: 'trims', pattern: 'pattern-reference', grading: 'grading-reference', 'marker-base': 'marker-base', 'marker-optimized': 'marker-optimized' })[role];
};
export function gradedRows(data) {
  const spec = productSpec(data), base = spec.sizes.indexOf(spec.baseSize);
  return spec.sizes.map((size, index) => [size, ...data.measurements.map((m, i) => Number((m.value + (index - base) * (i === spec.gradeIndex ? data.gradingChest : spec.increments[i])).toFixed(1)))]);
}
export function markerConfiguration(data, width = data.markerWidth, optimized = data.optimized) {
  const spec = productSpec(data);
  const ratio = data.category === 'knit' ? 1 : spec.markerBaseWidth / width;
  const baseWaste = !data.category || data.category === 'jacket' ? 14 : data.category === 'knit' ? 6 : 11;
  return { markerWidth: width, optimized, consumption: Number((spec.baselineConsumption * ratio * (optimized ? .86 / .89 : 1)).toFixed(4)), waste: Math.max(4, Math.min(25, Math.round((optimized ? baseWaste - 3 : baseWaste) + (data.category === 'knit' ? 0 : (spec.markerBaseWidth - width) * .12)))) };
}

export function newDemoProducts(initial) {
  const definitions = [
    { category: 'trousers', styleId: 'PT-0423', title: 'Pantalone Riva', variant: 'Pietra', fabricId: 'riva-wool', fabricPrice: 24, quantity: 360, produced: 240, reworks: 6, retailSold: 42, wholesale: 110, retail: 220, retailAverage: 210, gradingChest: 4, measurements: [{ point: 'Lunghezza fianco', value: 104 }, { point: 'Circonferenza vita', value: 74 }, { point: 'Circonferenza bacino', value: 100 }, { point: 'Lunghezza interno gamba', value: 76 }], trims: [
      { id: 'pocketing', name: 'Tela tasche cotone', code: 'FOD-041', qty: .28, unit: 'm', price: 5, supplier: 'Tessitura Pratese' }, { id: 'waistband', name: 'Rinforzo cintura', code: 'TEL-042', qty: .12, unit: 'm', price: 3, supplier: 'Accessori Firenze' }, { id: 'zip', name: 'Zip coperta 18 cm', code: 'ZIP-041', qty: 1, unit: 'pz', price: 1.8, supplier: 'Accessori Firenze' }, { id: 'button', name: 'Bottone corozo', code: 'BOT-041', qty: 1, unit: 'pz', price: .5, supplier: 'Accessori Firenze' }, { id: 'pack', name: 'Etichetta e imballo', code: 'PKG-041', qty: 1, unit: 'set', price: .8, supplier: 'Pack G' }], qualityNote: 'Ridurre la tensione del punto invisibile e ricontrollare gli orli del lotto L-0423-A.', lifecycleNote: 'Ripresa orlo e ripristino piega · laboratorio sartoriale' },
    { category: 'bag', styleId: 'BG-0424', title: 'Borsa Trama', variant: 'Argilla', fabricId: 'trama-canvas', fabricPrice: 18, quantity: 180, produced: 120, reworks: 4, retailSold: 26, wholesale: 95, retail: 190, retailAverage: 185, gradingChest: 0, measurements: [{ point: 'Larghezza corpo', value: 34 }, { point: 'Altezza corpo', value: 29 }, { point: 'Profondità fondo', value: 12 }, { point: 'Lunghezza manico', value: 62 }], trims: [
      { id: 'lining', name: 'Fodera cotone Argilla', code: 'FOD-052', qty: .5, unit: 'm', price: 6, supplier: 'Tessitura Pratese' }, { id: 'handles', name: 'Coppia manici pelle testa moro', code: 'PEL-052', qty: 1, unit: 'set', price: 12, supplier: 'Pelletteria Toscana' }, { id: 'zip', name: 'Zip ottone spazzolato 32 cm', code: 'ZIP-052', qty: 1, unit: 'pz', price: 3.5, supplier: 'Accessori Firenze' }, { id: 'corners', name: 'Rinforzi angoli in pelle', code: 'PEL-053', qty: 2, unit: 'pz', price: 1.2, supplier: 'Pelletteria Toscana' }, { id: 'pack', name: 'Etichetta e sacca cotone', code: 'PKG-052', qty: 1, unit: 'set', price: 1.5, supplier: 'Pack G' }], qualityNote: 'Rifare la travetta sul manico sinistro e verificare con carico di 5 kg sul lotto L-0424-A.', lifecycleNote: 'Sostituzione manico in pelle · laboratorio di pelletteria' },
    { category: 'knit', styleId: 'MG-0425', title: 'Maglia Luce', variant: 'Avorio', fabricId: 'luce-yarn', fabricPrice: 78, quantity: 300, produced: 210, reworks: 5, retailSold: 48, wholesale: 100, retail: 200, retailAverage: 194, gradingChest: 4, measurements: [{ point: 'Lunghezza centro dietro', value: 62 }, { point: 'Larghezza spalle', value: 42 }, { point: 'Circonferenza torace', value: 104 }, { point: 'Lunghezza manica', value: 58 }], trims: [
      { id: 'tape', name: 'Nastro rinforzo spalla', code: 'NAS-063', qty: .3, unit: 'm', price: .6, supplier: 'Accessori Firenze' }, { id: 'pack', name: 'Etichetta e imballo', code: 'PKG-063', qty: 1, unit: 'set', price: .8, supplier: 'Pack G' }], qualityNote: 'Riprendere il punto al polso destro con FIL-063 e ricontrollare elasticità e rimaglio sul lotto L-0425-A.', lifecycleNote: 'Rammendo punto e vaporizzo · maglificio autorizzato' },
  ];
  return definitions.map((definition, index) => {
    const spec = productSpec(definition), fabric = additionalFabrics.find(f => f.id === definition.fabricId), suffix = definition.styleId.split('-')[1];
    const primary = { id: `ACQ-${suffix}-1`, materialId: 'main', material: fabric.name, supplier: fabric.supplier, status: 'Consegnato', date: '2027-03-26' };
    const secondary = definition.trims.slice(0, 3).map((row, i) => ({ id: `ACQ-${suffix}-${i + 2}`, materialId: row.id, material: row.name, supplier: row.supplier, status: i === 2 ? 'Confermato' : 'Consegnato', date: '2027-04-05' }));
    const colors = [{ name: definition.variant, color: fabric.tone, code: `C-${suffix}`, material: fabric.code }];
    const creative = { ...structuredClone(initial.creative), inputs: { request: spec.requirements, brand: 'Atelier · essenzialità, materia e sartorialità contemporanea', history: `Nuovo sviluppo ${spec.label.toLowerCase()} nella capsule con le varianti Cammello e Sabbia della Giacca Atelier. Dati demo.`, target: 'Contemporary · 30–45 anni' } };
    return { ...structuredClone(initial), ...definition, retailTarget: definition.quantity, factory: definition.category === 'bag' ? 'Pelletteria Toscana' : definition.category === 'knit' ? 'Maglificio Valdarno' : 'Confezioni Centro', brief: spec.requirements, creative, orderId: `OP-${suffix}`, lotId: `L-${suffix}-A`, sampleId: `CAMP-${suffix}-01`, fabricLot: `MAT-${suffix}`, consumption: spec.baselineConsumption, markerWidth: spec.markerBaseWidth, seam: spec.parts.seam, waste: definition.category === 'knit' ? 6 : 11, actualWaste: definition.category === 'knit' ? 7 : 12, laborMinutes: spec.operations.reduce((sum, row) => sum + row[2], 0), sampleChecks: [false, true, false], qualityScore: 89 + index, purchaseOrders: [primary, ...secondary],
      wholesaleOrders: [{ id: `W-${suffix}-1`, client: 'Boutique Y', qty: Math.floor(definition.quantity * .25), shipped: Math.floor(definition.quantity * .2), status: 'Parziale' }, { id: `W-${suffix}-2`, client: 'Studio Z', qty: Math.floor(definition.quantity * .2), shipped: 0, status: 'Da preparare' }],
      shipments: [{ id: `TRK-${suffix}01`, client: 'Boutique Y', qty: Math.floor(definition.quantity * .2), status: 'Consegnata' }], productionDays: [0, 1, 2, 3, 4, 5, 6].map(n => Math.floor(definition.produced / 7) + (n < definition.produced % 7 ? 1 : 0)),
      lifecycle: [{ id: `life-${suffix}`, date: '2028-10-12', type: 'Riparazione', note: definition.lifecycleNote, future: true }],
      technical: { requirements: spec.requirements, constraints: definition.category === 'knit' ? 'Finezza 7; misure dopo stabilizzazione; bordi inclusi nel filato principale e nel ciclo di smacchinatura.' : `Rispetta verso e mano del materiale; tolleranza ±${spec.tolerance} cm.`, fit: spec.fit, tolerance: spec.tolerance, colors, notes: [], versions: [], currentId: null, approvedId: null },
      events: [[21, `Aperto ${definition.title} nella capsule Autunno/Inverno 2027.`], [3, `Selezionato ${fabric.name} · ${fabric.code}; distinta specifica ${spec.label.toLowerCase()}.`], [13, `${spec.quality.id}: ${spec.quality.title.toLowerCase()}, ${definition.reworks} articoli da ricontrollare.`], [8, `Definito il ciclo ${spec.label.toLowerCase()}: ${spec.operations.length} gruppi di lavorazione.`], [14, `Registrato lo stock del lotto L-${suffix}-A e le scorte di ${fabric.code}.`], [20, `Preparata la scheda ${spec.gradeIndex === null ? 'dimensionale a formato unico' : 'di sviluppo taglie'} di ${definition.title}.`]].map(([module, text], n) => ({ id: `${suffix}-event-${n}`, module, text, time: '09 ott · 14:00', actor: { name: 'Marta Bianchi', email: 'marta@atelier.demo' }, demo: true })),
    };
  });
}

export function purchaseMaterial(data, order, fabric) {
  const main = order.materialId === 'main' || order.id === 'ACQ-0271';
  const trim = data.trims.find(row => row.id === order.materialId) || (order.id === 'ACQ-0272' ? data.trims[0] : order.id === 'ACQ-0273' ? data.trims[2] : null);
  return { qty: order.qty ?? data.quantity * (main ? data.consumption : trim?.qty || 0), price: order.price ?? (main ? data.fabricPrice : trim?.price || 0), unit: order.unit || (main ? materialUnit(data) : trim?.unit || 'unità'), supplier: main ? fabric.supplier : order.supplier };
}

// Only explicit model identities group variants; similar names are separate products.
export function groupProducts(items, activeId, selectedVariants = {}, fabrics = []) {
  const groups = new Map();
  for (const item of items) {
    const id = item.productId || item.styleId;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(item);
  }
  return [...groups].map(([productId, variants]) => {
    const selected = variants.find(item => item.styleId === activeId) || variants.find(item => item.styleId === selectedVariants[productId]) || variants[0];
    return { ...selected, productId, variants: variants.map(item => ({ ...item, materialName: fabrics.find(fabric => fabric.id === item.fabricId)?.name || item.fabricId })), identityAssigned: variants.some(item => item.identityAssigned), variantSummary: variants.map(item => item.variant).join(' / '), totalQuantity: variants.reduce((sum, item) => sum + item.quantity, 0), totalProduced: variants.reduce((sum, item) => sum + item.produced, 0) };
  });
}
export const productSearchText = product => [product.title, product.collection, product.productId, ...product.variants.flatMap(item => [item.styleId, item.aliasTitle, item.variant, item.materialName])].join(' ').toLowerCase();
export function productVariantId(product, query = '') {
  const text = query.trim().toLowerCase();
  return (text && product.variants.find(item => [item.styleId, item.variant, item.aliasTitle, item.materialName].some(value => value?.toLowerCase().includes(text)))?.styleId) || product.styleId;
}
export const styleLabel = item => item ? `${item.title}${item.productId ? ` · ${item.variant}` : ''}` : '';
