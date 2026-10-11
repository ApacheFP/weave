import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collectionDefaults, creativeDefaults } from './creativeData.js';
import { profileActor, seedWorkspaceData, validTask } from './workspaceData.js';
import { additionalFabrics, groupProducts, newDemoProducts, productSpec, productSizes, materialUnit } from './productData.js';

export const euro = value => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
export const number = (value, digits = 0) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: digits }).format(value);
export const fabrics = additionalFabrics;
export const minQuantity = data => Math.max(data.produced, data.retailSold + data.wholesaleOrders.reduce((sum, order) => sum + order.qty, 0));

const activityTime = () => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());
const defaults = {
  collection: 'Autunno/Inverno 2027', profile: { firstName: 'Alex', lastName: 'Rossi', email: 'demo@weave.it' },
  references: [], creative: creativeDefaults(), conceptApproved: false, identityAssigned: false, techGenerated: false, technical: null, phaseReviews: {},
  modelVersion: '1.0', grain: true, notches: true, sampleApproved: false, optimized: false,
  margin: 55, hourlyRate: 40, logisticsCost: 1.5, priority: 'Alta', start: '2027-04-10', end: '2027-05-20', delivery: '2027-06-15',
  productionPaused: false, qualityResolved: false, retailFeedback: 4.3, aiRuns: {}, chats: {},
};
const initial = newDemoProducts(defaults)[0];

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
  const [workspace, setWorkspace] = useState(() => {
    const items = newDemoProducts(defaults);
    return { activeId: items[0].styleId, selectedVariants: {}, collections: { [initial.collection]: collectionDefaults() }, items, ...seedWorkspaceData(items, initial.profile) };
  });
  const data = workspace.items.find(item => item.styleId === workspace.activeId);
  const products = groupProducts(workspace.items, workspace.activeId, workspace.selectedVariants, fabrics);
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
        next.purchaseOrders = next.purchaseOrders.map(row => row.materialId === 'main' || row.id === 'ACQ-0271' ? { ...row, supplier: fabric.supplier, material: fabric.name } : row);
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
      const actor = profileActor(next.profile);
      const at = new Date().toISOString();
      if (message) next.events = [{ id: crypto.randomUUID(), text: message, module, time: activityTime(), at, actor }, ...previous.events].slice(0, 40);
      const updatedActor = oldActor => changes.profile && oldActor.email === previous.profile.email ? actor : oldActor;
      const inbox = changes.profile ? current.inbox.map(item => ({ ...item, actor: updatedActor(item.actor), replies: item.replies.map(reply => ({ ...reply, actor: updatedActor(reply.actor) })) })) : current.inbox;
      const update = message && current.preferences.moduleAlerts && !changes.profile ? { id: crypto.randomUUID(), type: 'update', styleId: next.styleId, moduleId: module, title: `${next.title} · aggiornamento`, body: message, actor, at, read: false, replies: [], demo: true } : null;
      return { ...current, tasks: changes.profile ? current.tasks.map(task => ({ ...task, assignee: updatedActor(task.assignee) })) : current.tasks, inbox: update ? [update, ...inbox] : inbox, items: current.items.map(item => item.styleId === workspace.activeId ? next : changes.profile ? { ...item, profile: changes.profile } : item) };
    });
    if (message) notify(message);
  }
  const collectionData = workspace.collections[data.collection] || collectionDefaults();
  function commitCollection(patch, message) {
    setWorkspace(current => {
      const previous = current.items.find(item => item.styleId === workspace.activeId);
      const collection = current.collections[previous.collection] || collectionDefaults();
      const changes = typeof patch === 'function' ? patch(collection) : patch;
      const actor = profileActor(previous.profile);
      const at = new Date().toISOString();
      const event = message && { id: crypto.randomUUID(), text: message, module: 1, time: activityTime(), at, actor };
      const update = event && current.preferences.moduleAlerts ? { id: crypto.randomUUID(), type: 'update', styleId: previous.styleId, moduleId: 1, title: `${previous.collection} · direzione creativa`, body: message, actor, at, read: false, replies: [], demo: true } : null;
      return { ...current, inbox: update ? [update, ...current.inbox] : current.inbox, collections: { ...current.collections, [previous.collection]: { ...collection, ...changes } }, items: event ? current.items.map(item => item.styleId === previous.styleId ? { ...item, events: [event, ...item.events].slice(0, 40) } : item) : current.items };
    });
    if (message) notify(message);
  }
  function selectStyle(styleId) {
    setWorkspace(current => {
      const item = current.items.find(item => item.styleId === styleId);
      return item ? { ...current, activeId: styleId, selectedVariants: { ...current.selectedVariants, [item.productId || item.styleId]: styleId } } : current;
    });
  }
  function createStyle({ title, styleId, collection, quantity, copy }) {
    const code = styleId.trim().toUpperCase();
    if (workspace.items.some(item => item.styleId === code)) return false;
    const suffix = code.replace(/^[A-Z]+-/, '');
    const item = { ...structuredClone(copy ? data : initial), title: title.trim(), productId: undefined, aliasTitle: undefined, styleId: code, orderId: 'OP-' + suffix, lotId: 'L-' + suffix + '-A', fabricLot: 'T-' + suffix, sampleId: 'CAMP-' + suffix + '-01', collection: collection.trim(), quantity: Number(quantity), references: [], creative: creativeDefaults(), conceptApproved: false, identityAssigned: false, technical: null, techGenerated: false, sketch: null, sketchFile: null, sketchName: null, chats: {}, aiRuns: {}, phaseReviews: {}, passportPublished: false,
      profile: data.profile, qualityNote: copy ? data.qualityNote.replaceAll(data.lotId, 'L-' + suffix + '-A') : 'Nessuna non conformità registrata sul nuovo capo.',
      ...(copy ? {} : { brief: '', techGenerated: false, sampleApproved: false, sampleChecks: [false, false, false], produced: 0, reworks: 0, qualityScore: 100, qualityResolved: true, productionDays: [], purchaseOrders: [], wholesaleOrders: [], retailSold: 0, shipments: [], lifecycle: [] }),
      events: [{ id: crypto.randomUUID(), text: 'Creato il capo ' + title.trim(), module: 21, time: activityTime(), at: new Date().toISOString(), actor: profileActor(data.profile) }] };
    setWorkspace(current => ({ ...current, activeId: code, items: [...current.items, item] }));
    notify('Capo creato: ' + item.title);
    return true;
  }
  function updateTask(id, patch) {
    const previous = workspace.tasks.find(task => task.id === id);
    if (!previous || !patch || typeof patch !== 'object') return false;
    const changes = Object.fromEntries(['title', 'styleId', 'moduleId', 'status', 'priority', 'due', 'note'].filter(key => Object.hasOwn(patch, key)).map(key => [key, patch[key]]));
    if (!Object.keys(changes).length) return false;
    const next = { ...previous, ...changes };
    if (!validTask(next, workspace.items)) return false;
    next.title = next.title.trim();
    setWorkspace(current => ({ ...current, tasks: current.tasks.map(task => task.id === id ? { ...task, ...changes, title: next.title } : task) }));
    notify(next.status !== previous.status ? `Attività ${next.status === 'Completata' ? 'completata' : 'aggiornata'}` : 'Attività aggiornata');
    return true;
  }
  function createTask(input) {
    if (!input || typeof input !== 'object') return false;
    const task = { id: crypto.randomUUID(), title: input.title, styleId: input.styleId, moduleId: input.moduleId, due: input.due, priority: input.priority ?? 'Media', note: input.note ?? '', status: input.status ?? 'Da fare', assignee: profileActor(data.profile), demo: true };
    if (!validTask(task, workspace.items)) return false;
    task.title = task.title.trim();
    setWorkspace(current => {
      const profile = current.items.find(item => item.styleId === current.activeId).profile;
      const actor = profileActor(profile);
      const assignment = { id: crypto.randomUUID(), type: 'assign', styleId: task.styleId, moduleId: task.moduleId, title: `Nuova attività: ${task.title}`, body: task.note || 'Attività aggiunta alla tua lista.', actor, at: new Date().toISOString(), read: false, replies: [], demo: true };
      return { ...current, tasks: [{ ...task, assignee: actor }, ...current.tasks], inbox: [assignment, ...current.inbox] };
    });
    notify('Attività creata');
    return true;
  }
  function markInboxRead(id, read = true) {
    setWorkspace(current => ({ ...current, inbox: current.inbox.map(item => item.id === id ? { ...item, read: Boolean(read) } : item) }));
  }
  function markAllInboxRead() {
    setWorkspace(current => ({ ...current, inbox: current.inbox.map(item => ({ ...item, read: true })) }));
    notify('Inbox segnata come letta');
  }
  function replyInbox(id, body) {
    if (typeof body !== 'string' || !body.trim() || body.trim().length > 2000 || !workspace.inbox.some(item => item.id === id)) return false;
    const reply = { id: crypto.randomUUID(), body: body.trim(), actor: profileActor(data.profile), at: new Date().toISOString() };
    setWorkspace(current => ({ ...current, inbox: current.inbox.map(item => item.id === id ? { ...item, read: true, replies: [...item.replies, reply] } : item) }));
    notify('Risposta salvata nella demo');
    return true;
  }
  function updatePreferences(patch) {
    const changes = Object.fromEntries(['moduleAlerts', 'productNews'].filter(key => typeof patch?.[key] === 'boolean').map(key => [key, patch[key]]));
    const choices = { theme: ['light', 'dark', 'system'], accent: ['indigo', 'blue', 'violet', 'teal', 'rose', 'graphite'], sideDensity: ['comfortable', 'compact'], taskDensity: ['comfortable', 'compact'], motion: ['system', 'reduce'] };
    for (const [key, values] of Object.entries(choices)) if (values.includes(patch?.[key])) changes[key] = patch[key];
    setWorkspace(current => ({ ...current, preferences: { ...current.preferences, ...changes } }));
    notify('Preferenze salvate');
  }
  return <Context.Provider value={{ data, products, workspaceItems: workspace.items, tasks: workspace.tasks, inbox: workspace.inbox, preferences: workspace.preferences, updateTask, createTask, markInboxRead, markAllInboxRead, replyInbox, updatePreferences, styles: workspace.items.map(({ styleId, title, collection, variant, identityAssigned, category }) => ({ styleId, title, collection, variant, identityAssigned, category })), selectStyle, createStyle, commit, notify, collectionData, commitCollection, ...totals(data) }}>{children}<div className="dw-toast" role="status" aria-live="polite">{notice && <span key={notice}>{notice}</span>}</div></Context.Provider>;
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
export async function techPack(data, drawings = []) {
  const t = totals(data);
  const version = data.technical?.exportVersion || data.technical?.versions.find(v => v.id === data.technical.approvedId) || data.technical?.versions.at(-1);
  const spec = version?.snapshot;
  const colors = spec?.colors || [];
  const category = productSpec(data), unit = materialUnit(data);
  const sections = [
    ['01 / IDENTITA E DISEGNO', `WEAVE - TECH PACK ${data.styleId}`, data.title, `Collezione ${data.collection} - ${spec?.fit || 'Regular'} fit`, `Disegno v${version?.number || 1} - ${version && version.id === data.technical?.approvedId ? 'APPROVATO' : 'BOZZA'}`, spec?.requirements || data.brief, 'Schizzo: ' + (data.sketchName || 'Non caricato'), ...colors.map(c => `Variante ${c.name}: ${c.code} / ${c.color}`), 'Documento dimostrativo'],
    [`02 / MISURE BASE - TAGLIA ${category.baseSize}`, ...(spec?.measurements || data.measurements).map(row => `${row.point}: ${row.value} cm / tolleranza +/-${spec?.tolerance || category.tolerance} cm`), ...Object.entries(category.partLabels).map(([key, label]) => `${label}: ${spec?.parts[key] ?? category.parts[key]} cm`), 'Taglie: ' + productSizes(data).join(' - '), category.gradeIndex === null ? 'Dimensione unica; nessuno sviluppo anatomico' : data.measurements[category.gradeIndex].point + ': +' + data.gradingChest + ' cm per taglia'],
    ['03 / MATERIALI E DISTINTA BASE', t.fabric.name, t.fabric.composition, 'Origine: ' + t.fabric.origin, `${category.materialLabel}: ${data.consumption.toFixed(2)} ${unit} x ${data.fabricPrice.toFixed(2)} EUR`, ...data.trims.map(row => `${row.name}: ${row.qty} ${row.unit} x ${row.price.toFixed(2)} EUR`), `Totale materiali: ${t.materials.toFixed(2)} EUR`, 'Disponibilita e colori da confermare nel modulo 3'],
    ['04 / COSTRUZIONE E NOTE', spec?.constraints || category.requirements, ...(spec?.notes || []).map((n, i) => `Nota ${i + 1}: ${n.text} / punto ${n.x}%, ${n.y}%`), `Margine ${data.category === 'knit' ? 'rimaglio' : 'cucitura'}: ${spec?.parts.seam || data.seam} cm`, `Tempo standard: ${data.laborMinutes} minuti`, 'Macchine: ' + [...new Set(category.operations.map(row => row[1]))].join(', '), `Ordine: ${data.orderId} / ${data.quantity} articoli`, 'Revisione: ' + (version?.note || 'Base demo'), 'Approvazione campione: ' + (data.sampleApproved ? 'Approvato' : 'Da completare')],
  ];
  const images = await Promise.all(drawings.map(async source => {
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
    try {
      const image = new Image(); image.src = url; await image.decode();
      const viewBox = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement.getAttribute('viewBox').split(' ').map(Number);
      const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = Math.round(900 * viewBox[3] / viewBox[2]);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const hex = Array.from(atob(canvas.toDataURL('image/jpeg', .9).split(',')[1]), c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('') + '>';
      return { width: canvas.width, height: canvas.height, hex };
    } finally { URL.revokeObjectURL(url); }
  }));
  const ascii = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, ' ').replace(/[\\()]/g, '\\$&');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [4 0 R 6 0 R 8 0 R 10 0 R] /Count 4 >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  sections.forEach((lines, index) => {
    const wrapped = lines.flatMap(line => String(line).match(/.{1,76}(?:\s|$)|.{1,76}/g) || ['']);
    const figureIds = images.length === 3 ? index === 1 ? [0, 1] : index === 3 ? [2] : [] : [];
    const textHeight = figureIds.length ? index === 1 ? 335 : 435 : 650;
    const leading = Math.min(20, textHeight / wrapped.length), font = Math.min(12, leading * .8);
    const figures = figureIds.map((id, n) => {
      const image = images[id], width = figureIds.length === 2 ? 245 : 340;
      const height = Math.min(figureIds.length === 2 ? 310 : 210, width * image.height / image.width);
      const w = height * image.width / image.height, x = figureIds.length === 2 ? 42 + n * 260 : (595 - w) / 2;
      return `q ${w} 0 0 ${height} ${x} 65 cm /I${id} Do Q`;
    }).join('\n');
    const stream = `0.93 0.89 0.82 rg 0 780 595 62 re f\n0.15 0.15 0.15 rg\nBT /F1 ${font} Tf 42 746 Td ${leading} TL\n${wrapped.map((line, i) => `${i ? 'T* ' : ''}(${ascii(line)}) Tj`).join('\n')}\nET\n${figures}\nBT /F1 9 Tf 42 36 Td (${ascii(data.styleId)} | WEAVE | ${index + 1}/4 | Demo) Tj ET`;
    const resources = figureIds.map(id => `/I${id} ${12 + id} 0 R`).join(' ');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> /XObject << ${resources} >> >> /Contents ${5 + index * 2} 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  images.forEach(image => objects.push(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${image.hex.length} >>\nstream\n${image.hex}\nendstream`));
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  download(`WEAVE-${data.styleId}-tech-pack.pdf`, pdf, 'application/pdf');
}
