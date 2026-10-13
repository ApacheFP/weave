import { prepareDirection } from './creativeData.js';

// Category specifications feed the existing workspace, editor and exports.
export const additionalFabrics = [
  { id: 'riva-wool', name: 'Lana stretch · Pietra', code: 'TES-041', price: 24, wool: 98, composition: '98% lana vergine · 2% elastan', supplier: 'Lanificio Biellese', origin: 'Italia', weight: 240, unit: 'm', category: 'trousers', tone: '#a59b8d', certificate: 'Scheda tessuto demo IT-9041', asset: 'trousers-fabric' },
  { id: 'trama-canvas', name: 'Canvas di cotone · Argilla', code: 'TES-052', price: 18, wool: 0, composition: '100% cotone', supplier: 'Tessitura Pratese', origin: 'Italia', weight: 420, unit: 'm', category: 'bag', tone: '#a88c6a', certificate: 'Scheda canvas demo IT-9052', asset: 'bag-fabric' },
  { id: 'luce-yarn', name: 'Merino e cashmere · Avorio', code: 'FIL-063', price: 78, wool: 90, composition: '90% lana merino · 10% cashmere', supplier: 'Filatura Toscana', origin: 'Italia', weight: null, unit: 'kg', category: 'knit', tone: '#eee4d3', certificate: 'Scheda filato demo IT-9063 · Nm 2/28', asset: 'knit-fabric' },
  { id: 'luce-salvia-yarn', name: 'Merino e cashmere · Salvia', code: 'FIL-064', price: 78, wool: 90, composition: '90% lana merino · 10% cashmere', supplier: 'Filatura Toscana', origin: 'Italia', weight: null, unit: 'kg', category: 'knit', tone: '#a3aea1', certificate: 'Scheda filato demo IT-9064 · Nm 2/28', asset: 'knit-salvia-fabric' },
  { id: 'luce-grafite-yarn', name: 'Merino e cashmere · Grafite', code: 'FIL-065', price: 78, wool: 90, composition: '90% lana merino · 10% cashmere', supplier: 'Filatura Toscana', origin: 'Italia', weight: null, unit: 'kg', category: 'knit', tone: '#454541', certificate: 'Scheda filato demo IT-9065 · Nm 2/28', asset: 'knit-grafite-fabric' },
];

export const categorySpecs = {
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
    retailNote: 'Le taglie 40 e 42 guidano la domanda. La lana stretch e la gamba dritta accompagnano il girocollo Maglia Luce.',
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
    retailNote: 'Taglia unica. I clienti apprezzano capienza, manici in pelle riparabili e canvas compatto; la palette Argilla accompagna la maglieria e il pantalone della capsule.',
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
    retailNote: 'Le taglie S e M guidano la domanda. Il girocollo nelle varianti Avorio, Salvia e Grafite completa pantalone Riva e borsa Trama con la mano morbida del merino e cashmere.',
    baselineConsumption: .38, markerBaseWidth: 0, materialLabel: 'Filato', materialNote: 'Filato, bordi a costa, nastro spalla ed etichette', markerStages: ['Programmazione', 'Smacchinatura', 'Rimaglio', 'Stabilizzazione e qualità'],
  },
};

export const productSpec = data => {
  const spec = categorySpecs[data.category || 'knit'];
  return data.qualityId ? { ...spec, quality: { ...spec.quality, id: data.qualityId } } : spec;
};
export const productSizes = data => productSpec(data).sizes;
export const materialUnit = data => data.category === 'knit' ? 'kg' : 'm';
export const categoryFabrics = (data, fabrics) => fabrics.filter(item => item.category === (data.category || 'knit') && (item.category !== 'knit' || item.id === data.fabricId));
export const piecesFor = data => productSpec(data).pieces.map(([name, key, qty]) => ({ name, key, qty, asset: `${productSpec(data).prefix ? `${productSpec(data).prefix}-pattern` : 'pattern'}-${key}` }));
export const productMedia = (data, role) => {
  const spec = productSpec(data);
  if (data.category === 'bag' && role === 'grading' || data.category === 'knit' && role.startsWith('marker-')) return `${spec.prefix}-pattern`;
  if (spec.prefix) return `${data.category === 'knit' && ['front', 'back', 'sketch', 'fabric', 'trims', 'sample', 'quality'].includes(role) && ['Salvia', 'Grafite'].includes(data.variant) ? `knit-${data.variant.toLowerCase()}` : spec.prefix}-${role}`;

};
export function gradedRows(data) {
  const spec = productSpec(data), base = spec.sizes.indexOf(spec.baseSize);
  return spec.sizes.map((size, index) => [size, ...data.measurements.map((m, i) => Number((m.value + (index - base) * (i === spec.gradeIndex ? data.gradingChest : spec.increments[i])).toFixed(1)))]);
}
export function markerConfiguration(data, width = data.markerWidth, optimized = data.optimized) {
  const spec = productSpec(data);
  const ratio = spec.prefix === 'knit' ? 1 : spec.markerBaseWidth / width;
  const baseWaste = spec.prefix === 'knit' ? 6 : 11;
  return { markerWidth: width, optimized, consumption: Number((spec.baselineConsumption * ratio * (optimized ? .86 / .89 : 1)).toFixed(4)), waste: Math.max(4, Math.min(25, Math.round((optimized ? baseWaste - 3 : baseWaste) + (spec.prefix === 'knit' ? 0 : (spec.markerBaseWidth - width) * .12)))) };
}

export function newDemoProducts(initial, now = new Date()) {
  const shiftedDate = days => {
    const value = new Date(now);
    value.setDate(value.getDate() + days);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };
  const shiftedTimestamp = days => {
    const value = new Date(now);
    value.setDate(value.getDate() + days);
    return value.toISOString();
  };
  const definitions = [
    { category: 'trousers', styleId: 'PT-0423', title: 'Pantalone Riva', variant: 'Pietra', fabricId: 'riva-wool', fabricPrice: 24, quantity: 360, produced: 0, reworks: 0, retailSold: 0, wholesale: 110, retail: 220, retailAverage: 210, gradingChest: 4, measurements: [{ point: 'Lunghezza fianco', value: 104 }, { point: 'Circonferenza vita', value: 74 }, { point: 'Circonferenza bacino', value: 100 }, { point: 'Lunghezza interno gamba', value: 76 }], trims: [
      { id: 'pocketing', name: 'Tela tasche cotone', code: 'FOD-041', qty: .28, unit: 'm', price: 5, supplier: 'Tessitura Pratese' }, { id: 'waistband', name: 'Rinforzo cintura', code: 'TEL-042', qty: .12, unit: 'm', price: 3, supplier: 'Accessori Firenze' }, { id: 'zip', name: 'Zip coperta 18 cm', code: 'ZIP-041', qty: 1, unit: 'pz', price: 1.8, supplier: 'Accessori Firenze' }, { id: 'button', name: 'Bottone corozo', code: 'BOT-041', qty: 1, unit: 'pz', price: .5, supplier: 'Accessori Firenze' }, { id: 'pack', name: 'Etichetta e imballo', code: 'PKG-041', qty: 1, unit: 'set', price: .8, supplier: 'Pack G' }], qualityNote: 'Nessuna non conformità: i controlli qualità partono con il primo lotto.', lifecycleNote: 'Ripresa orlo e ripristino piega · laboratorio sartoriale' },
    { category: 'bag', styleId: 'BG-0424', title: 'Borsa Trama', variant: 'Argilla', fabricId: 'trama-canvas', fabricPrice: 18, quantity: 180, produced: 0, reworks: 0, retailSold: 0, wholesale: 95, retail: 190, retailAverage: 185, gradingChest: 0, measurements: [{ point: 'Larghezza corpo', value: 34 }, { point: 'Altezza corpo', value: 29 }, { point: 'Profondità fondo', value: 12 }, { point: 'Lunghezza manico', value: 62 }], trims: [
      { id: 'lining', name: 'Fodera cotone Argilla', code: 'FOD-052', qty: .5, unit: 'm', price: 6, supplier: 'Tessitura Pratese' }, { id: 'handles', name: 'Coppia manici pelle testa moro', code: 'PEL-052', qty: 1, unit: 'set', price: 12, supplier: 'Pelletteria Toscana' }, { id: 'zip', name: 'Zip ottone spazzolato 32 cm', code: 'ZIP-052', qty: 1, unit: 'pz', price: 3.5, supplier: 'Accessori Firenze' }, { id: 'corners', name: 'Rinforzi angoli in pelle', code: 'PEL-053', qty: 2, unit: 'pz', price: 1.2, supplier: 'Pelletteria Toscana' }, { id: 'pack', name: 'Etichetta e sacca cotone', code: 'PKG-052', qty: 1, unit: 'set', price: 1.5, supplier: 'Pack G' }], qualityNote: 'Nessuna non conformità: il controllo del primo lotto è ancora da avviare.', lifecycleNote: 'Sostituzione manico in pelle · laboratorio di pelletteria' },
    { category: 'knit', styleId: 'MG-0425', title: 'Maglia Luce', variant: 'Avorio', fabricId: 'luce-yarn', fabricPrice: 78, quantity: 300, produced: 210, reworks: 5, retailSold: 48, wholesale: 100, retail: 200, retailAverage: 194, gradingChest: 4, measurements: [{ point: 'Lunghezza centro dietro', value: 62 }, { point: 'Larghezza spalle', value: 42 }, { point: 'Circonferenza torace', value: 104 }, { point: 'Lunghezza manica', value: 58 }], trims: [
      { id: 'tape', name: 'Nastro rinforzo spalla', code: 'NAS-063', qty: .3, unit: 'm', price: .6, supplier: 'Accessori Firenze' }, { id: 'pack', name: 'Etichetta e imballo', code: 'PKG-063', qty: 1, unit: 'set', price: .8, supplier: 'Pack G' }], qualityNote: 'Riprendere il punto al polso destro con FIL-063 e ricontrollare elasticità e rimaglio sul lotto L-0425-A.', lifecycleNote: 'Rammendo punto e vaporizzo · maglificio autorizzato' },
  ];
  const knit = definitions.pop();
  definitions.unshift({ ...knit, productId: 'MG-0425' },
    { ...structuredClone(knit), productId: 'MG-0425', styleId: 'MG-0426', variant: 'Salvia', fabricId: 'luce-salvia-yarn', quantity: 240, produced: 144, reworks: 3, retailSold: 20, qualityId: 'NC-024', qualityNote: 'Riprendere il punto al polso destro con FIL-064 e ricontrollare elasticità e rimaglio sul lotto L-0426-A.' },
    { ...structuredClone(knit), productId: 'MG-0425', styleId: 'MG-0427', variant: 'Grafite', fabricId: 'luce-grafite-yarn', quantity: 260, produced: 78, reworks: 1, retailSold: 8, qualityId: 'NC-025', qualityNote: 'Riprendere il punto al polso destro con FIL-065 e ricontrollare elasticità e rimaglio sul lotto L-0427-A.' });
  return definitions.map((definition, index) => {
    const spec = productSpec(definition), fabric = additionalFabrics.find(f => f.id === definition.fabricId), suffix = definition.styleId.split('-')[1];
    const inProduction = definition.category === 'knit', hasDesign = definition.category !== 'bag';
    const modelVersion = inProduction ? '1.1' : initial.modelVersion || '1.0';
    const timeline = definition.category === 'bag'
      ? { start: shiftedDate(30), end: shiftedDate(70), delivery: shiftedDate(90) }
      : definition.category === 'trousers'
        ? { start: shiftedDate(14), end: shiftedDate(44), delivery: shiftedDate(60) }
        : { start: shiftedDate(-3), end: shiftedDate(30), delivery: shiftedDate(45) };
    const primary = { id: `ACQ-${suffix}-1`, materialId: 'main', material: fabric.name, supplier: fabric.supplier, status: 'Consegnato', date: shiftedDate(-5) };
    const secondary = definition.trims.slice(0, 3).map((row, i) => ({ id: `ACQ-${suffix}-${i + 2}`, materialId: row.id, material: row.name, supplier: row.supplier, status: 'Consegnato', date: shiftedDate(-4) }));
    const colors = [{ name: definition.variant, color: fabric.tone, code: `C-${suffix}`, material: fabric.code }];
    const creative = { ...structuredClone(initial.creative), inputs: { request: spec.requirements, brand: 'Atelier · essenzialità, materia e sartorialità contemporanea', history: `Nuovo sviluppo ${spec.label.toLowerCase()} nella capsule Maglia Luce, Pantalone Riva e Borsa Trama. Dati demo.`, target: 'Contemporary · 30–45 anni' } };
    const direction = hasDesign ? prepareDirection(creative.inputs, '', null, definition) : null;
    const sketchAsset = definition.category === 'knit' && definition.variant !== 'Avorio' ? `knit-${definition.variant.toLowerCase()}` : spec.prefix;
    const sketchFile = hasDesign ? { id: `sketch-${definition.styleId}`, src: `/images/dashboard/${sketchAsset}-sketch.webp`, name: `${definition.styleId}-schizzo-demo.webp`, type: 'image/webp', size: 1 } : null;
    const versionId = `${definition.styleId}-v1`;
    const snapshot = { category: definition.category, baseSize: spec.baseSize, measurements: structuredClone(definition.measurements), parts: { ...spec.parts, seam: spec.parts.seam }, fit: spec.fit, tolerance: spec.tolerance, colors, requirements: spec.requirements, constraints: definition.category === 'knit' ? 'Finezza 7; misure dopo stabilizzazione; bordi inclusi nel filato principale e nel ciclo di smacchinatura.' : `Rispetta verso e mano del materiale; tolleranza ±${spec.tolerance} cm.`, notes: [] };
    const technical = { requirements: spec.requirements, constraints: snapshot.constraints, fit: spec.fit, tolerance: spec.tolerance, colors, notes: [], versions: hasDesign ? [{ id: versionId, number: 1, note: 'Disegno tecnico approvato', date: shiftedTimestamp(inProduction ? -3 : -1), snapshot }] : [], currentId: hasDesign ? versionId : null, approvedId: hasDesign ? versionId : null };
    creative.direction = direction;
    creative.round = direction ? 1 : 0;
    creative.concept = sketchFile ? { sketch: sketchFile, palette: structuredClone(direction.palette), moodboard: structuredClone(direction.moodboard), references: [], paletteOrigin: 'Spunti', moodboardOrigin: 'Spunti', paletteChosen: true, moodboardChosen: true, sketchKind: 'Matita' } : null;
    const reviews = hasDesign ? { 3: true, 4: true, 5: true, ...(inProduction && { 9: true, 10: true }) } : {};
    const wholesaleOrders = inProduction ? [{ id: `W-${suffix}-1`, client: 'Boutique Y', qty: Math.floor(definition.quantity * .25), shipped: Math.floor(definition.quantity * .2), status: 'Parziale' }, { id: `W-${suffix}-2`, client: 'Studio Z', qty: Math.floor(definition.quantity * .2), shipped: 0, status: 'Da preparare' }] : [];
    return { ...structuredClone(initial), ...definition, ...timeline, modelVersion, identityAssigned: true, conceptApproved: hasDesign, techGenerated: hasDesign, sketch: sketchFile?.src || null, sketchFile, sketchName: sketchFile?.name || null, technical, phaseReviews: reviews, sampleApproved: inProduction, optimized: inProduction, qualityResolved: !inProduction, retailTarget: definition.quantity, factory: definition.category === 'bag' ? 'Pelletteria Toscana' : definition.category === 'knit' ? 'Maglificio Valdarno' : 'Confezioni Centro', brief: spec.requirements, creative, orderId: `OP-${suffix}`, lotId: `L-${suffix}-A`, sampleId: `CAMP-${suffix}-01`, fabricLot: `MAT-${suffix}`, consumption: spec.baselineConsumption, markerWidth: spec.markerBaseWidth, seam: spec.parts.seam, waste: definition.category === 'knit' ? 6 : 11, actualWaste: definition.category === 'knit' ? 7 : 12, laborMinutes: spec.operations.reduce((sum, row) => sum + row[2], 0), sampleChecks: inProduction ? [true, true, true] : definition.category === 'trousers' ? [true, false, false] : [false, false, false], qualityScore: 89 + index, purchaseOrders: inProduction ? [primary, ...secondary] : [],
      wholesaleOrders,
      shipments: inProduction ? [{ id: `TRK-${suffix}01`, client: 'Boutique Y', qty: Math.floor(definition.quantity * .2), status: 'Consegnata' }] : [], productionDays: definition.produced ? [0, 1, 2, 3, 4, 5, 6].map(n => Math.floor(definition.produced / 7) + (n < definition.produced % 7 ? 1 : 0)) : [],
      lifecycle: [{ id: `life-${suffix}`, date: '2028-10-12', type: 'Riparazione', note: definition.lifecycleNote, future: true }],
      events: [
        [21, `Aperto ${definition.title} · ${definition.variant} nella capsule Autunno/Inverno 2027.`],
        ...(!hasDesign ? [[1, `Avviato il concept di ${definition.title}: brief e riferimenti in revisione.`]] : [
          [1, `Caricato lo schizzo e confermata l’identità di ${definition.title} · ${definition.variant}.`],
          [2, `Approvato il disegno tecnico v1 di ${definition.title} · ${definition.variant}.`],
          [3, `Confermata la distinta di ${definition.title}: ${fabric.name} · ${fabric.code}.`],
          [4, `Revisionato il modello v${modelVersion} di ${definition.title}.`],
          [5, `Confermate le misure di ${definition.title} per ${spec.sizes.length} ${spec.sizes.length === 1 ? 'formato' : 'taglie'}.`],
          ...(inProduction ? [
            [6, `Approvato il campione ${definition.variant} dopo tre verifiche.`],
            [7, `Ottimizzato il piano ${spec.materialLabel.toLowerCase()} di ${definition.title}.`],
            [9, `Confermata la costificazione di ${definition.title} · ${definition.variant}.`],
            [10, `Pianificata la consegna del lotto ${definition.styleId}.`],
            [11, `Consegnati i materiali per il lotto ${definition.styleId}.`],
            [12, `Registrati ${definition.produced} capi sul lotto L-${suffix}-A.`],
            [13, `${spec.quality.id}: ${spec.quality.title.toLowerCase()}, ${definition.reworks} articoli da ricontrollare.`],
          ] : [[6, `Fitting del campione ${definition.variant}: completata una verifica su tre.`]]),
        ]),
      ].map(([module, text], n) => ({ id: `${suffix}-event-${n}`, module, text, time: '09 ott · 14:00', actor: { name: 'Marta Bianchi', email: 'marta@atelier.demo' }, demo: true })),
    };
  });
}

export const workflowPhases = [
  { name: 'Concept', label: 'In progettazione', ids: [1] },
  { name: 'Sviluppo tecnico', label: 'Sviluppo tecnico', ids: [2, 3, 4, 5] },
  { name: 'Validazione', label: 'In validazione', ids: [6, 7, 9] },
  { name: 'Produzione', label: 'In produzione', ids: [10, 11, 12, 13] },
  { name: 'Passaporto', label: 'Passaporto digitale', ids: [19] },
];

export function productWorkflow(data) {
  const outputs = {
    1: Boolean(data.conceptApproved || data.sketchFile),
    2: Boolean(data.technical?.approvedId && data.technical.approvedId === data.technical.currentId),
    6: data.sampleApproved,
    7: data.optimized,
    11: data.purchaseOrders.length > 0 && data.purchaseOrders.every(order => order.status === 'Consegnato'),
    12: data.produced >= data.quantity,
    13: data.produced >= data.quantity && data.qualityResolved && !data.reworks,
    19: data.passportPublished,
  };
  const started = {
    1: Boolean(data.brief.trim()) || data.references.length > 0,
    2: Boolean(data.techGenerated),
    6: data.sampleChecks.some(Boolean),
    10: data.purchaseOrders.length > 0 || data.produced > 0,
    11: data.purchaseOrders.length > 0,
    12: data.produced > 0,
    13: data.produced > 0 && (!data.qualityResolved || data.reworks > 0),
    19: data.phaseReviews?.[19] === false,
  };
  const rawState = id => (outputs[id] || data.phaseReviews?.[id] === true) ? 'done' : (started[id] || data.phaseReviews?.[id] === false) ? 'active' : 'pending';
  const states = {};
  let previousComplete = true;
  for (const id of workflowPhases.flatMap(phase => phase.ids)) {
    const state = rawState(id);
    const qualityRunsWithProduction = id === 13 && states[10] === 'done' && states[11] === 'done' && state !== 'pending';
    states[id] = previousComplete || qualityRunsWithProduction ? state : 'pending';
    previousComplete = previousComplete && state === 'done';
  }
  const phases = workflowPhases.map(phase => {
    const done = phase.ids.filter(id => states[id] === 'done').length;
    const active = phase.ids.filter(id => states[id] === 'active').length;
    return { ...phase, done, active, state: done === phase.ids.length ? 'done' : active || done ? 'active' : 'pending' };
  });
  const current = phases.find(phase => phase.state !== 'done');
  const complete = Object.values(states).filter(state => state === 'done').length;
  const total = Object.keys(states).length;
  return {
    states, phases, complete, total, percent: Math.round(complete / total * 100), current,
    stageLabel: !current ? 'Percorso completato' : current.state === 'active' ? current.label : current.name === 'Concept' ? 'Da sviluppare' : `Da avviare · ${current.name.toLowerCase()}`,
  };
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
    const id = item.modelId || item.productId || item.styleId;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(item);
  }
  return [...groups].map(([modelId, variants]) => {
    const selected = variants.find(item => item.styleId === activeId) || variants.find(item => item.styleId === selectedVariants[modelId]) || variants[0];
    return { ...selected, productId: selected.productId || variants[0].styleId, variants: variants.map(item => ({ ...item, materialName: fabrics.find(fabric => fabric.id === item.fabricId)?.name || item.fabricId })), identityAssigned: variants.some(item => item.identityAssigned), variantSummary: variants.map(item => item.variant).join(' / '), totalQuantity: variants.reduce((sum, item) => sum + item.quantity, 0), totalProduced: variants.reduce((sum, item) => sum + item.produced, 0) };
  });
}
export const productSearchText = product => [product.title, product.collection, product.productId, ...product.variants.flatMap(item => [item.styleId, item.aliasTitle, item.variant, item.materialName])].join(' ').toLowerCase();
export function productVariantId(product, query = '') {
  const text = query.trim().toLowerCase();
  return (text && product.variants.find(item => [item.styleId, item.variant, item.aliasTitle, item.materialName].some(value => value?.toLowerCase().includes(text)))?.styleId) || product.styleId;
}
export const styleLabel = item => item ? `${item.title}${item.productId ? ` · ${item.variant}` : ''}` : '';
