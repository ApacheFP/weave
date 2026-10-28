import { creativeDefaults } from './creativeData.js';
import { applyProductPatch, minQuantity, retailSale, totals, validStyleInput, wholesaleAvailable } from './domain.js';
import { productSpec } from './productData.js';
import { localDate, profileActor } from './workspaceData.js';

export class ProductActionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProductActionError';
    this.code = code;
  }
}

const invalid = (code, message) => { throw new ProductActionError(code, message); };

export function findProduct(workspace, identity = workspace.activeProductId || workspace.activeId) {
  const product = workspace.items.find(item => item.id === identity) || workspace.items.find(item => item.styleId === identity);
  if (!product) invalid('PRODUCT_NOT_FOUND', 'Il capo non è più disponibile.');
  return product;
}

const nextId = options => (options.id || (() => crypto.randomUUID()))();

function activity(product, text, module, options = {}) {
  const date = (options.now || (() => new Date()))();
  return { id: nextId(options), text, module, actor: profileActor(product.profile), at: date.toISOString(), time: new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date) };
}

function changedProduct(workspace, previous, changes, text, module, options) {
  const next = applyProductPatch(previous, changes);
  const event = activity(next, text, module, options);
  next.events = [event, ...previous.events].slice(0, 40);
  const update = workspace.preferences?.moduleAlerts && {
    id: nextId(options), type: 'update', styleId: next.styleId, moduleId: module,
    title: `${next.title} · aggiornamento`, body: text, actor: event.actor,
    at: event.at, read: false, replies: [], demo: true,
  };
  return { ...workspace, items: workspace.items.map(item => item === previous ? next : item), inbox: update ? [update, ...workspace.inbox] : workspace.inbox };
}

export function selectStyle(workspace, identity) {
  const product = findProduct(workspace, identity);
  return { ...workspace, activeId: product.styleId, activeProductId: product.id, hasSelectedStyle: true,
    selectedVariants: { ...workspace.selectedVariants, [product.modelId || product.productId || product.styleId]: product.styleId } };
}

function businessIdentifiers(items) {
  return new Set(items.flatMap(item => [item.orderId, item.lotId, item.fabricLot, item.sampleId, item.qualityId || productSpec(item).quality.id,
    ...['purchaseOrders', 'wholesaleOrders', 'shipments', 'lifecycle'].flatMap(key => (item[key] || []).map(row => row.id))]));
}

function availableIdentifier(proposed, used) {
  let value = proposed, suffix = 2;
  while (used.has(value)) value = `${proposed}-${suffix++}`;
  used.add(value);
  return value;
}

function remapReferences(value, references) {
  if (typeof value === 'string') {
    if (references.has(value)) return references.get(value);
    for (const [previous, next] of references) value = value.replaceAll(previous, next);
    return value;
  }
  if (Array.isArray(value)) return value.map(row => remapReferences(row, references));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, remapReferences(child, references)]));
  return value;
}

export function createStyle(workspace, input, sourceId = workspace.activeProductId || workspace.activeId, options = {}) {
  const source = findProduct(workspace, sourceId);
  if (!validStyleInput(input, workspace.items, source)) invalid('INVALID_PRODUCT', 'Verifica nome, codice, collezione e quantità del capo.');
  const isVariant = input.variantOf === true;
  if (input.variantOf !== undefined && typeof input.variantOf !== 'boolean' || isVariant && (typeof input.variant !== 'string' || !input.variant.trim() || input.variant.trim().length > 60)) invalid('INVALID_PRODUCT', 'Indica un nome valido per la variante.');
  const code = input.styleId.trim().toUpperCase();
  const base = structuredClone(input.copy || isVariant ? source : options.template || workspace.items[0]);
  const used = businessIdentifiers(workspace.items);
  const businessId = proposed => availableIdentifier(proposed, used);
  const references = new Map(), identifiers = {};
  for (const [key, proposed] of Object.entries({ orderId: `OP-${code}`, lotId: `L-${code}-A`, fabricLot: `T-${code}`, sampleId: `CAMP-${code}-01`, qualityId: `NC-${code}` })) {
    const old = key === 'qualityId' ? productSpec(base).quality.id : base[key];
    const value = businessId(proposed);
    if (old) references.set(old, value);
    identifiers[key] = value;
  }
  if (input.copy) {
    for (const [key, prefix] of Object.entries({ purchaseOrders: 'ACQ', wholesaleOrders: 'W', shipments: 'TRK', lifecycle: 'life' })) {
      base[key] = base[key].map((row, index) => {
        const id = businessId(`${prefix}-${code}-${index + 1}`), recordId = nextId(options);
        references.set(row.id, id);
        if (row.recordId) references.set(row.recordId, recordId);
        return { ...row, recordId: row.recordId || recordId };
      });
    }
  }
  const item = { ...remapReferences(base, references), ...identifiers, id: nextId(options), modelId: isVariant ? source.modelId : nextId(options), title: input.title.trim(),
    productId: isVariant ? source.productId || source.styleId : undefined, aliasTitle: undefined, styleId: code, collection: input.collection.trim(), quantity: Number(input.quantity),
    ...(isVariant && { variant: input.variant.trim() }),
    references: [], creative: creativeDefaults(), conceptApproved: false, identityAssigned: false,
    technical: null, techGenerated: false, sketch: null, sketchFile: null, sketchName: null,
    chats: {}, aiRuns: {}, phaseReviews: {}, passportPublished: false, profile: structuredClone(source.profile),
    ...(!input.copy && { brief: isVariant ? source.brief : '', sampleApproved: false, sampleChecks: [false, false, false], sampleRevisions: [], produced: 0, reworks: 0,
      qualityScore: 100, qualityResolved: true, qualityNote: 'Nessuna non conformità registrata sul nuovo capo.',
      productionDays: [], purchaseOrders: [], wholesaleOrders: [], retailSold: 0, shipments: [], lifecycle: [] }),
  };
  item.events = [activity(item, `Creato il capo ${item.title}`, 21, options)];
  return selectStyle({ ...workspace, items: [...workspace.items, item] }, item.id);
}

export function updateProductMetadata(workspace, identity, input, options = {}) {
  const previous = findProduct(workspace, identity);
  const keys = ['title', 'styleId', 'collection', 'quantity'];
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Object.keys(input).length || Object.keys(input).some(key => !keys.includes(key))) {
    invalid('INVALID_PRODUCT', 'Le modifiche al capo devono includere solo nome, codice, collezione o quantità.');
  }
  const candidate = { ...previous, ...input, copy: false };
  if (!validStyleInput(candidate, workspace.items.filter(item => item !== previous), previous) || Number(candidate.quantity) < minQuantity(previous)) {
    invalid('INVALID_PRODUCT', 'Il codice deve essere unico e la quantità deve coprire produzione e ordini già registrati.');
  }
  const changes = { title: candidate.title.trim(), styleId: candidate.styleId.trim().toUpperCase(), collection: candidate.collection.trim(), quantity: Number(candidate.quantity) };
  if (keys.every(key => previous[key] === changes[key])) return workspace;
  let next = changedProduct(workspace, previous, changes, 'Dati del capo aggiornati', 21, options);
  if (changes.styleId !== previous.styleId) {
    const replaceCode = row => row.styleId === previous.styleId ? { ...row, styleId: changes.styleId } : row;
    next = { ...next, tasks: next.tasks.map(replaceCode), inbox: next.inbox.map(replaceCode),
      selectedVariants: Object.fromEntries(Object.entries(next.selectedVariants).map(([key, value]) => [key, value === previous.styleId ? changes.styleId : value])),
      activeId: next.activeId === previous.styleId ? changes.styleId : next.activeId };
  }
  return next;
}

export function recordRetailSale(workspace, identity, options = {}) {
  const product = findProduct(workspace, identity);
  const changes = retailSale(product);
  if (!Object.keys(changes).length) invalid('NO_RETAIL_STOCK', 'Nessun capo disponibile per la vendita retail.');
  return changedProduct(workspace, product, changes, `Registrata una vendita retail ${product.styleId}`, 17, options);
}

function validQuantity(quantity, maximum) {
  return ['number', 'string'].includes(typeof quantity) && Number.isInteger(Number(quantity)) && Number(quantity) >= 1 && Number(quantity) <= maximum;
}

function validCalendarDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isFinite(parsed.getTime()) && localDate(parsed) === date;
}

export function createPurchaseOrder(workspace, identity, input, options = {}) {
  const product = findProduct(workspace, identity);
  if (!input || !['supplier', 'material'].every(key => typeof input[key] === 'string' && input[key].trim() && input[key].trim().length <= 80) ||
    !validQuantity(input.qty, 20000) || !['number', 'string'].includes(typeof input.price) || !Number.isFinite(Number(input.price)) || Number(input.price) < .01 || Number(input.price) > 1000 || !validCalendarDate(input.date)) {
    invalid('INVALID_PURCHASE_ORDER', 'Verifica fornitore, materiale, quantità, prezzo e data di consegna.');
  }
  const order = { id: availableIdentifier(`ACQ-${product.styleId}-${product.purchaseOrders.length + 1}`, businessIdentifiers(workspace.items)), recordId: nextId(options),
    supplier: input.supplier.trim(), material: input.material.trim(), qty: Number(input.qty), price: Number(input.price), date: input.date, status: 'Confermato' };
  return changedProduct(workspace, product, { purchaseOrders: [...product.purchaseOrders, order] }, `Nuovo acquisto aggiunto: ${order.material}`, 11, options);
}

export function recordLifecycleEvent(workspace, identity, input, options = {}) {
  const product = findProduct(workspace, identity);
  if (!input || !['Riparazione', 'Reso', 'Seconda vita', 'Riciclo'].includes(input.type) || typeof input.note !== 'string' || !input.note.trim() || input.note.trim().length > 500 || !validCalendarDate(input.date)) {
    invalid('INVALID_LIFECYCLE_EVENT', 'Verifica tipo, descrizione e data dell’evento.');
  }
  const now = (options.now || (() => new Date()))();
  const event = { id: nextId(options), recordId: nextId(options), type: input.type, note: input.note.trim(), date: input.date, future: input.date > localDate(now) };
  return changedProduct(workspace, product, { lifecycle: [...product.lifecycle, event] }, `Evento del ciclo di vita registrato: ${event.type.toLowerCase()}`, 18, { ...options, now: () => now });
}

export function createWholesaleOrder(workspace, identity, input, options = {}) {
  const product = findProduct(workspace, identity);
  if (!input || typeof input.client !== 'string' || !input.client.trim() || input.client.trim().length > 80 || !validQuantity(input.quantity, wholesaleAvailable(product))) {
    invalid('INVALID_WHOLESALE_ORDER', 'Indica il retailer e una quantità compatibile con gli impegni già registrati.');
  }
  const order = { id: availableIdentifier(`W-${product.styleId}-${product.wholesaleOrders.length + 1}`, businessIdentifiers(workspace.items)), recordId: nextId(options),
    client: input.client.trim(), qty: Number(input.quantity), shipped: 0, status: 'Da preparare' };
  return changedProduct(workspace, product, { wholesaleOrders: [...product.wholesaleOrders, order] }, `Nuovo ordine wholesale: ${order.client}, ${order.qty} capi`, 16, options);
}

export function createShipment(workspace, identity, input, options = {}) {
  const product = findProduct(workspace, identity);
  const order = typeof input?.orderId === 'string' && (product.wholesaleOrders.find(row => row.recordId === input.orderId) || product.wholesaleOrders.find(row => row.id === input.orderId));
  if (!order) invalid('WHOLESALE_ORDER_NOT_FOUND', 'Seleziona un ordine wholesale disponibile.');
  if (!validQuantity(input.quantity, Math.min(totals(product).stock, order.qty - order.shipped))) {
    invalid('INVALID_SHIPMENT_QUANTITY', 'La quantità deve rientrare nello stock e nel residuo dell’ordine.');
  }
  const amount = Number(input.quantity);
  const shipment = { id: availableIdentifier(`TRK-${product.styleId}-${product.shipments.length + 1}`, businessIdentifiers(workspace.items)), recordId: nextId(options),
    orderId: order.id, ...(order.recordId && { orderRecordId: order.recordId }), lotId: product.lotId, client: order.client, qty: amount, status: 'In consegna' };
  return changedProduct(workspace, product, { shipments: [shipment, ...product.shipments], wholesaleOrders: product.wholesaleOrders.map(row => row === order ? { ...row, shipped: row.shipped + amount, status: row.shipped + amount === row.qty ? 'Spedito' : 'Parziale' } : row) }, `Spediti ${amount} capi a ${order.client}`, 15, options);
}

export function confirmShipment(workspace, identity, shipmentId, options = {}) {
  const product = findProduct(workspace, identity);
  const shipment = typeof shipmentId === 'string' && (product.shipments.find(row => row.recordId === shipmentId) || product.shipments.find(row => row.id === shipmentId));
  if (!shipment) invalid('SHIPMENT_NOT_FOUND', 'La spedizione non è più disponibile.');
  if (shipment.status === 'Consegnata') return workspace;
  if (shipment.status !== 'In consegna') invalid('INVALID_SHIPMENT_STATUS', 'La spedizione deve essere in consegna prima della conferma.');
  return changedProduct(workspace, product, { shipments: product.shipments.map(row => row === shipment ? { ...row, status: 'Consegnata' } : row) }, `${shipment.id}: consegna registrata`, 15, options);
}

export function recordProduction(workspace, identity, quantity, options = {}) {
  const product = findProduct(workspace, identity);
  if (product.productionPaused) invalid('PRODUCTION_PAUSED', 'Riprendi la produzione prima di registrare nuovi capi.');
  const value = Number(quantity);
  if (!validQuantity(quantity, product.quantity - product.produced)) {
    invalid('INVALID_PRODUCTION_QUANTITY', 'La quantità deve rientrare nei capi ancora da produrre.');
  }
  return changedProduct(workspace, product, { produced: product.produced + value, productionDays: [...product.productionDays, value] }, `Registrati ${value} nuovi capi sul lotto ${product.lotId}`, 12, options);
}

export function approveSample(workspace, identity, options = {}) {
  const product = findProduct(workspace, identity);
  if (product.sampleApproved) return workspace;
  if (product.sampleChecks.length !== productSpec(product).checks.length || !product.sampleChecks.every(value => value === true)) {
    invalid('INCOMPLETE_SAMPLE_CHECKS', 'Completa tutte le verifiche prima di approvare il campione.');
  }
  return changedProduct(workspace, product, { sampleApproved: true, modelVersion: Number(product.modelVersion) < 1.1 ? '1.1' : product.modelVersion }, 'Campione approvato e collegato al modello', 6, options);
}
