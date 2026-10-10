import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collectionDefaults, creativeDefaults } from './creativeData.js';

export const euro = value => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
export const number = (value, digits = 0) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: digits }).format(value);
export const sizes = [38, 40, 42, 44, 46, 48];
export const fabrics = [
  { id: 'base', name: 'Lana mista · Cammello', code: 'TES-017', price: 16, wool: 70, composition: '70% lana · 30% poliestere', supplier: 'Fornitore A', origin: 'Italia', weight: 280, tone: '#bda17d', certificate: 'Scheda di origine IT-7781' },
  { id: 'premium', name: 'Lana vergine · Sabbia', code: 'TES-024', price: 20, wool: 100, composition: '100% lana vergine', supplier: 'Lanificio C', origin: 'Italia', weight: 310, tone: '#d5c5ac', certificate: 'Dichiarazione lana vergine IT-9024' },
  { id: 'recycled', name: 'Lana riciclata · Pietra', code: 'TES-031', price: 17.5, wool: 70, composition: '70% lana riciclata · 30% poliestere', supplier: 'Filati D', origin: 'Italia', weight: 290, tone: '#b0aaa0', certificate: 'Certificato demo R-0031' },
];
export const operations = [
  ['Taglio e preparazione', 'Taglierina', 8], ['Assemblaggio davanti', 'Lineare', 9], ['Tasche e pattine', 'Lineare', 6], ['Unione spalle e fianchi', 'Lineare', 5], ['Montaggio maniche', 'Braccio libero', 7], ['Fodera e colletto', 'Lineare', 7], ['Bottoni e asole', 'Asolatrice', 3], ['Stiro e finitura', 'Stiro a vapore', 3],
];
export const minQuantity = data => Math.max(data.produced, data.retailSold + data.wholesaleOrders.reduce((sum, order) => sum + order.qty, 0));

const initial = {
  styleId: 'GJ-0421', orderId: 'OP-0421', lotId: 'L-0421-A', fabricLot: 'T-7781', sampleId: 'CAMP-0421-01', collection: 'Autunno/Inverno 2027',
  profile: { firstName: 'Alex', lastName: 'Rossi', email: 'demo@weave.it' },
  title: 'Giacca Atelier', brief: 'Una giacca monopetto regular, essenziale e strutturata. Toni terra, tre bottoni e due tasche. Una nuova idea di quotidiano per la collezione Autunno/Inverno 2027.',
  variant: 'Cammello', references: [], creative: creativeDefaults(), conceptApproved: false, techGenerated: true, phaseReviews: {},
  measurements: [{ point: 'Lunghezza centro dietro', value: 72 }, { point: 'Larghezza spalle', value: 44 }, { point: 'Circonferenza torace', value: 100 }, { point: 'Lunghezza manica', value: 62 }],
  fabricId: 'base', fabricPrice: 16, consumption: 1.85,
  trims: [{ id: 'lining', name: 'Fodera viscosa', code: 'FOD-006', qty: 1.3, unit: 'm', price: 4.5, supplier: 'Tessitura E' }, { id: 'canvas', name: 'Tela termoadesiva', code: 'TEL-011', qty: .6, unit: 'm', price: 2.2, supplier: 'Fornitore A' }, { id: 'buttons', name: 'Bottoni corozo', code: 'BOT-003', qty: 3, unit: 'pz', price: .45, supplier: 'Accessori F' }, { id: 'pack', name: 'Etichette e imballo', code: 'PKG-002', qty: 1, unit: 'set', price: .8, supplier: 'Pack G' }],
  modelVersion: '1.0', seam: 1, grain: true, notches: true, gradingChest: 4,
  sampleApproved: false, sampleChecks: [false, true, false],
  markerWidth: 150, optimized: false, waste: 14,
  quantity: 500, margin: 55, wholesale: 160, retail: 320, laborMinutes: 48, hourlyRate: 40, logisticsCost: 1.5,
  factory: 'Laboratorio B', priority: 'Alta', start: '2027-04-10', end: '2027-05-20', delivery: '2027-06-15',
  purchaseOrders: [{ id: 'ACQ-0271', material: 'Tessuto principale', supplier: 'Fornitore A', status: 'Consegnato', date: '2027-03-26' }, { id: 'ACQ-0272', material: 'Fodera viscosa', supplier: 'Tessitura E', status: 'Confermato', date: '2027-04-28' }, { id: 'ACQ-0273', material: 'Bottoni e accessori', supplier: 'Accessori F', status: 'In ritardo', date: '2027-04-30' }],
  produced: 320, reworks: 12, actualWaste: 15, productionDays: [38, 46, 42, 53, 44, 52, 45], productionPaused: false,
  qualityScore: 86, qualityResolved: false, qualityNote: 'Regolare la macchina lineare e ricontrollare la cucitura spalla sul lotto L-0421-A.',
  wholesaleOrders: [{ id: 'W-0148', client: 'Boutique Y', qty: 80, shipped: 80, status: 'Consegnato' }, { id: 'W-0149', client: 'Negozio X', qty: 140, shipped: 80, status: 'Parziale' }, { id: 'W-0150', client: 'Studio Z', qty: 100, shipped: 0, status: 'Da preparare' }],
  retailSold: 112, retailAverage: 296, retailFeedback: 4.3,
  shipments: [{ id: 'TRK-88214', client: 'Negozio X', qty: 80, status: 'In consegna' }, { id: 'TRK-88210', client: 'Boutique Y', qty: 80, status: 'Consegnata' }, { id: 'TRK-88218', client: 'Studio Z', qty: 100, status: 'Da preparare' }],
  lifecycle: [{ id: 'life-1', date: '2028-10-12', type: 'Riparazione', note: 'Sostituzione bottone · laboratorio autorizzato', future: true }, { id: 'life-2', date: '2029-03-06', type: 'Seconda vita', note: 'Rivendita dopo controllo condizioni', future: true }],
  aiRuns: {}, chats: {},
  events: [{ id: 'evt-1', text: 'Lotto L-0421-A: completati 320 capi su 500', module: 12, time: '22 apr · 10:40', actor: { name: 'Alex Rossi', email: 'demo@weave.it' } }, { id: 'evt-2', text: 'Spalla sinistra: aperta non conformità NC-018', module: 13, time: '22 apr · 10:15', actor: { name: 'Marta Bianchi', email: 'marta@atelier.demo' } }, { id: 'evt-3', text: 'Accessori F: consegna bottoni in ritardo', module: 11, time: '22 apr · 09:30', actor: { name: 'Luca Ferri', email: 'luca@atelier.demo' } }, { id: 'evt-4', text: 'Tech pack GJ-0421 aggiornato', module: 2, time: '21 apr · 16:20', actor: { name: 'Alex Rossi', email: 'demo@weave.it' } }],
};

export function totals(data) {
  const materials = data.consumption * data.fabricPrice + data.trims.reduce((sum, row) => sum + row.qty * row.price, 0);
  const labor = data.laborMinutes * data.hourlyRate / 60;
  const cost = materials + labor + data.logisticsCost;
  const shipped = data.wholesaleOrders.reduce((sum, row) => sum + row.shipped, 0);
  const approved = Math.max(0, data.produced - data.reworks);
  return { materials, labor, cost, approved, shipped, stock: Math.max(0, approved - shipped - data.retailSold), fabric: fabrics.find(item => item.id === data.fabricId), suggestedWholesale: Math.ceil(cost / (1 - data.margin / 100) / 5) * 5 };
}

const Context = createContext(null);
export function DemoProvider({ children }) {
  const [workspace, setWorkspace] = useState(() => ({ activeId: initial.styleId, collections: { [initial.collection]: collectionDefaults() }, items: [structuredClone(initial), { ...structuredClone(initial), styleId: 'GJ-0422', orderId: 'OP-0422', lotId: 'L-0422-A', fabricLot: 'T-7782', sampleId: 'CAMP-0422-01', title: 'Giacca Studio', variant: 'Sabbia', fabricId: 'premium', fabricPrice: 20, quantity: 600, events: [{ id: 'studio-1', text: 'Brief creativo di Giacca Studio pronto', module: 1, time: '21 apr · 14:00', actor: { name: 'Alex Rossi', email: 'demo@weave.it' } }], brief: 'Giacca in lana vergine, linea morbida e palette sabbia. Una proposta sartoriale per il guardaroba quotidiano.' }] }));
  const data = workspace.items.find(item => item.styleId === workspace.activeId);
  const [notice, setNotice] = useState('');
  const timeout = useRef(null);
  useEffect(() => () => clearTimeout(timeout.current), []);
  function notify(message) {
    setNotice(message);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setNotice(''), 3600);
  }
  function commit(patch, message, module = 21) {
    setWorkspace(current => {
      const previous = current.items.find(item => item.styleId === workspace.activeId);
      const changes = typeof patch === 'function' ? patch(previous) : patch;
      const next = { ...previous, ...changes };
      if (next.fabricId !== previous.fabricId) {
        const fabric = fabrics.find(f => f.id === next.fabricId);
        next.purchaseOrders = next.purchaseOrders.map(row => row.id === 'ACQ-0271' ? { ...row, supplier: fabric.supplier, material: fabric.name } : row);
      }
      // Reopen a reviewed phase when its inputs change, including live edits.
      if (!Object.hasOwn(changes, 'phaseReviews')) {
        const reviews = { ...previous.phaseReviews };
        const inputs = {
          3: ['fabricId', 'fabricPrice', 'consumption', 'trims'],
          4: ['modelVersion', 'seam', 'grain', 'notches'],
          5: ['gradingChest', 'measurements'],
          7: ['markerWidth', 'consumption', 'waste', 'optimized'],
          9: ['fabricId', 'fabricPrice', 'consumption', 'trims', 'laborMinutes', 'hourlyRate', 'logisticsCost', 'margin', 'wholesale', 'retail'],
          10: ['quantity', 'factory', 'priority', 'start', 'end', 'delivery'],
        };
        for (const [id, keys] of Object.entries(inputs)) {
          if (reviews[id] && keys.some(key => Object.hasOwn(changes, key) && changes[key] !== previous[key])) reviews[id] = false;
        }
        next.phaseReviews = reviews;
      }
      if (message) next.events = [{ id: crypto.randomUUID(), text: message, module, time: 'Ora', actor: { name: `${previous.profile.firstName} ${previous.profile.lastName}`, email: previous.profile.email } }, ...previous.events].slice(0, 40);
      return { ...current, items: current.items.map(item => item.styleId === workspace.activeId ? next : changes.profile ? { ...item, profile: changes.profile } : item) };
    });
    if (message) notify(message);
  }
  const collectionData = workspace.collections[data.collection] || collectionDefaults();
  function commitCollection(patch, message) {
    setWorkspace(current => {
      const previous = current.items.find(item => item.styleId === workspace.activeId);
      const collection = current.collections[previous.collection] || collectionDefaults();
      const changes = typeof patch === 'function' ? patch(collection) : patch;
      const event = message && { id: crypto.randomUUID(), text: message, module: 1, time: 'Ora', actor: { name: `${previous.profile.firstName} ${previous.profile.lastName}`, email: previous.profile.email } };
      return { ...current, collections: { ...current.collections, [previous.collection]: { ...collection, ...changes } }, items: event ? current.items.map(item => item.styleId === previous.styleId ? { ...item, events: [event, ...item.events].slice(0, 40) } : item) : current.items };
    });
    if (message) notify(message);
  }
  function selectStyle(styleId) {
    setWorkspace(current => current.items.some(item => item.styleId === styleId) ? { ...current, activeId: styleId } : current);
  }
  function createStyle({ title, styleId, collection, quantity, copy }) {
    const code = styleId.trim().toUpperCase();
    if (workspace.items.some(item => item.styleId === code)) return false;
    const suffix = code.replace(/^GJ-/, '');
    const item = { ...structuredClone(copy ? data : initial), title: title.trim(), styleId: code, orderId: 'OP-' + suffix, lotId: 'L-' + suffix + '-A', fabricLot: 'T-' + suffix, sampleId: 'CAMP-' + suffix + '-01', collection: collection.trim(), quantity: Number(quantity), references: [], creative: creativeDefaults(), conceptApproved: false, sketch: null, sketchFile: null, sketchName: null, chats: {}, aiRuns: {}, phaseReviews: {}, passportPublished: false,
      profile: data.profile, qualityNote: copy ? data.qualityNote.replaceAll(data.lotId, 'L-' + suffix + '-A') : 'Nessuna non conformità registrata sul nuovo capo.',
      ...(copy ? {} : { brief: '', techGenerated: false, sampleApproved: false, sampleChecks: [false, false, false], produced: 0, reworks: 0, qualityScore: 100, qualityResolved: true, productionDays: [], purchaseOrders: [], wholesaleOrders: [], retailSold: 0, shipments: [], lifecycle: [] }),
      events: [{ id: crypto.randomUUID(), text: 'Creato il capo ' + title.trim(), module: 21, time: 'Ora', actor: { name: `${data.profile.firstName} ${data.profile.lastName}`, email: data.profile.email } }] };
    setWorkspace(current => ({ ...current, activeId: code, items: [...current.items, item] }));
    notify('Capo creato: ' + item.title);
    return true;
  }
  return <Context.Provider value={{ data, styles: workspace.items.map(({ styleId, title, collection, variant }) => ({ styleId, title, collection, variant })), selectStyle, createStyle, commit, notify, collectionData, commitCollection, ...totals(data) }}>{children}<div className="dw-toast" role="status" aria-live="polite">{notice && <span key={notice}>{notice}</span>}</div></Context.Provider>;
}
export const useDemo = () => useContext(Context);

export function download(name, contents, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(name, rows) {
  const safe = value => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
  download(name, '\uFEFF' + rows.map(row => row.map(safe).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}

// A small real PDF for the demo, without adding a document library.
export function techPack(data) {
  const t = totals(data);
  const sections = [
    ['01 / IDENTITA E CONCEPT', `WEAVE - TECH PACK ${data.styleId}`, data.title, `Collezione ${data.collection} - Regular fit`, 'Giacca monopetto, 3 bottoni, due tasche', 'Variante: ' + data.variant, 'Modello v' + data.modelVersion, 'Documento dimostrativo'],
    ['02 / MISURE BASE - TAGLIA 42', ...data.measurements.map(row => `${row.point}: ${row.value} cm / tolleranza +/-1 cm`), 'Taglie: 38 - 40 - 42 - 44 - 46 - 48', 'Sviluppo torace: +' + data.gradingChest + ' cm per taglia'],
    ['03 / MATERIALI E DISTINTA BASE', t.fabric.name, t.fabric.composition, 'Origine: ' + t.fabric.origin, `Tessuto: ${data.consumption.toFixed(2)} m x ${data.fabricPrice.toFixed(2)} EUR`, ...data.trims.map(row => `${row.name}: ${row.qty} ${row.unit} x ${row.price.toFixed(2)} EUR`), `Totale materiali: ${t.materials.toFixed(2)} EUR`],
    ['04 / CONFEZIONE E CONTROLLO', `Margine cucitura: ${data.seam} cm`, `Tempo standard: ${data.laborMinutes} minuti`, 'Macchine: lineare, braccio libero, asolatrice, stiro', `Ordine: ${data.orderId} / ${data.quantity} capi`, `Lotto tessuto ${data.fabricLot} / lotto capo ${data.lotId}`, data.qualityNote, 'Cura: lavaggio a secco', 'Approvazione campione: ' + (data.sampleApproved ? 'Approvato' : 'Da completare')],
  ];
  const ascii = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, ' ').replace(/[\\()]/g, '\\$&');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [4 0 R 6 0 R 8 0 R 10 0 R] /Count 4 >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  sections.forEach((lines, index) => {
    const wrapped = lines.flatMap(line => String(line).match(/.{1,76}(?:\s|$)|.{1,76}/g) || ['']);
    const stream = `0.93 0.89 0.82 rg 0 780 595 62 re f\n0.15 0.15 0.15 rg\nBT /F1 14 Tf 42 746 Td 24 TL\n${wrapped.map((line, i) => `${i ? 'T* ' : ''}(${ascii(line)}) Tj`).join('\n')}\nET\nBT /F1 9 Tf 42 36 Td (${data.styleId} | WEAVE | ${index + 1}/4 | Demo) Tj ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + index * 2} 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  download(`WEAVE-${data.styleId}-tech-pack.pdf`, pdf, 'application/pdf');
}
