import test from 'node:test';
import assert from 'node:assert/strict';
import { approveSample, confirmShipment, createPurchaseOrder, createShipment, createStyle, createWholesaleOrder, findProduct, ProductActionError, recordLifecycleEvent, recordProduction, recordRetailSale, selectStyle, updateProductMetadata } from '../src/dashboard/productActions.js';
import { demoDefaults } from '../src/dashboard/demoDefaults.js';
import { newDemoProducts } from '../src/dashboard/productData.js';
import { minQuantity, retailAvailable, totals, wholesaleAvailable } from '../src/dashboard/domain.js';
import { seedWorkspaceData } from '../src/dashboard/workspaceData.js';

function workspace() {
  const items = newDemoProducts(demoDefaults).map((item, index) => ({ ...item, id: `variant-${index}`, modelId: `model-${item.productId || item.styleId}` }));
  return { ...seedWorkspaceData(items, demoDefaults.profile), activeId: items[0].styleId, activeProductId: items[0].id, hasSelectedStyle: false, selectedVariants: {}, collections: {} };
}
const options = () => {
  let index = 0;
  return { id: () => `new-${++index}`, now: () => new Date('2026-10-12T12:00:00Z') };
};
const input = { title: 'Nuova maglia', styleId: 'mg-0500', collection: 'Autunno/Inverno 2027', quantity: '300', copy: false };

test('create product assigns separate immutable variant and model IDs and isolates its initial state', () => {
  const before = workspace();
  const next = createStyle(before, input, before.activeProductId, options());
  const product = findProduct(next);
  assert.equal(product.styleId, 'MG-0500');
  assert.notEqual(product.id, product.modelId);
  assert.notEqual(product.id, before.items[0].id);
  assert.equal(product.productId, undefined);
  assert.equal(product.produced, 0);
  assert.equal(product.retailSold, 0);
  assert.deepEqual(product.wholesaleOrders, []);
  assert.equal(next.activeProductId, product.id);
  assert.equal(next.selectedVariants[product.modelId], product.styleId);
  assert.equal(before.items.length, 5);
  product.measurements[0].value = 1;
  assert.equal(before.items[0].measurements[0].value, 62);
  assert.throws(() => createStyle(next, input), error => error instanceof ProductActionError && error.code === 'INVALID_PRODUCT');
});

test('copy retains business quantities while remapping owned identifiers and references', () => {
  const before = workspace(), source = before.items[0];
  source.shipments[0].orderId = source.wholesaleOrders[0].id;
  source.shipments[0].lotId = source.lotId;
  source.wholesaleOrders[0].recordId = 'source-order-record';
  source.shipments[0].orderRecordId = 'source-order-record';
  source.qualityNote += ` Rapporto ${source.qualityId || 'NC-023'}.`;
  const next = createStyle(before, { ...input, copy: true }, source.id, options()), product = findProduct(next);
  assert.equal(product.produced, source.produced);
  assert.equal(product.retailSold, source.retailSold);
  assert.equal(product.wholesaleOrders[0].qty, source.wholesaleOrders[0].qty);
  assert.equal(product.shipments[0].orderId, product.wholesaleOrders[0].id);
  assert.equal(product.shipments[0].orderRecordId, product.wholesaleOrders[0].recordId);
  assert.equal(product.shipments[0].lotId, product.lotId);
  assert.ok(product.qualityNote.includes(product.lotId));
  assert.ok(product.qualityNote.includes(product.qualityId));
  assert.equal(product.shipments[0].id, 'TRK-MG-0500-1');
  assert.equal(product.wholesaleOrders[0].id, 'W-MG-0500-1');
  assert.equal(product.orderId, 'OP-MG-0500');
  for (const key of ['purchaseOrders', 'wholesaleOrders', 'shipments', 'lifecycle']) {
    for (const [index, row] of product[key].entries()) {
      assert.notEqual(row.id, source[key][index].id);
      assert.ok(row.recordId);
    }
  }
  assert.throws(() => createStyle(before, { ...input, copy: true, quantity: minQuantity(source) - 1 }), { code: 'INVALID_PRODUCT' });
});

test('different prefixes and reused business codes cannot duplicate order, lot or child identifiers', () => {
  const context = options();
  let current = createStyle(workspace(), { ...input, copy: true }, undefined, context);
  const first = findProduct(current);
  current = updateProductMetadata(current, first.id, { styleId: 'MG-0600' }, context);
  current = createStyle(current, { ...input, copy: true }, first.id, context);
  assert.notEqual(findProduct(current).orderId, first.orderId);
  assert.equal(findProduct(current).wholesaleOrders[0].id, 'W-MG-0500-1-2');
  assert.equal(findProduct(current).shipments[0].orderId, undefined);
  current = createStyle(current, { ...input, styleId: 'PT-0500' }, undefined, context);
  const ids = current.items.flatMap(item => [item.orderId, item.lotId, item.sampleId, ...item.wholesaleOrders.map(row => row.id), ...item.shipments.map(row => row.id)]);
  assert.equal(new Set(ids).size, ids.length);
});

test('metadata changes preserve identity and migrate navigation references without touching other products', () => {
  const before = workspace(), original = before.items[0];
  before.selectedVariants[original.modelId] = original.styleId;
  const next = updateProductMetadata(before, original.id, { styleId: 'mg-0500', title: 'Maglia nuova' }, options());
  const product = findProduct(next, original.id);
  assert.equal(product.id, original.id);
  assert.equal(product.modelId, original.modelId);
  assert.equal(product.orderId, original.orderId);
  assert.equal(product.productId, original.productId);
  assert.equal(next.activeId, 'MG-0500');
  assert.equal(next.activeProductId, original.id);
  assert.equal(next.selectedVariants[original.modelId], 'MG-0500');
  assert.equal(next.tasks.find(row => row.id === before.tasks[0].id).styleId, 'MG-0500');
  assert.equal(next.inbox.find(row => row.id === before.inbox[0].id).styleId, 'MG-0500');
  assert.equal(before.activeId, original.styleId);
  assert.equal(next.items[1], before.items[1]);
  assert.equal(selectStyle(next, original.id).activeId, 'MG-0500');
  assert.throws(() => selectStyle(next, 'missing'), { code: 'PRODUCT_NOT_FOUND' });
});

test('metadata boundary rejects immutable IDs, invalid input, duplicates and reductions below commitments', () => {
  const before = workspace(), product = before.items[0];
  for (const patch of [{ id: 'replacement' }, { modelId: 'replacement' }, { title: ' ' }, { styleId: before.items[1].styleId }, { quantity: minQuantity(product) - 1 }, { quantity: true }, { quantity: 1.5 }, { quantity: 10001 }, {}, null]) {
    assert.throws(() => updateProductMetadata(before, product.id, patch), { code: 'INVALID_PRODUCT' });
  }
  assert.equal(updateProductMetadata(before, product.id, { title: product.title }), before);
  assert.equal(findProduct(updateProductMetadata(before, product.id, { quantity: minQuantity(product) }, options())).quantity, minQuantity(product));
});

test('retail and production commands enforce latest stock and remaining quantities before adding activity', () => {
  const before = workspace(), product = before.items[0];
  const next = recordRetailSale(before, product.id, options());
  assert.equal(findProduct(next).retailSold, product.retailSold + 1);
  assert.equal(findProduct(next).events.length, product.events.length + 1);
  assert.equal(next.inbox[0].moduleId, 17);
  const exhausted = { ...before, items: before.items.map(item => item === product ? { ...item, produced: item.retailSold + item.wholesaleOrders.reduce((sum, order) => sum + order.shipped, 0) } : item) };
  assert.equal(retailAvailable(findProduct(exhausted)), 0);
  assert.throws(() => recordRetailSale(exhausted, product.id), { code: 'NO_RETAIL_STOCK' });
  const produced = recordProduction(before, product.id, '10', options());
  assert.equal(findProduct(produced).produced, product.produced + 10);
  assert.equal(findProduct(produced).productionDays.at(-1), 10);
  for (const value of [null, true, '', 0, 1.5, Infinity, product.quantity - product.produced + 1]) assert.throws(() => recordProduction(before, product.id, value), { code: 'INVALID_PRODUCTION_QUANTITY' });
  const paused = { ...before, items: before.items.map(item => item === product ? { ...item, productionPaused: true } : item) };
  assert.throws(() => recordProduction(paused, product.id, 1), { code: 'PRODUCTION_PAUSED' });
});

test('sample approval requires every required check and repeated approval adds no activity', () => {
  const before = workspace(), product = before.items[0];
  product.sampleApproved = false; product.sampleChecks = [false, false, false]; product.modelVersion = '1.0';
  assert.throws(() => approveSample(before, product.id), { code: 'INCOMPLETE_SAMPLE_CHECKS' });
  const checked = { ...before, items: before.items.map(item => item === product ? { ...item, sampleChecks: [true, true, true] } : item) };
  const next = approveSample(checked, product.id, options());
  assert.equal(findProduct(next).sampleApproved, true);
  assert.equal(findProduct(next).modelVersion, '1.1');
  assert.equal(approveSample(next, product.id), next);
  const incomplete = { ...before, items: before.items.map(item => item === product ? { ...item, sampleChecks: [true] } : item) };
  assert.throws(() => approveSample(incomplete, product.id), { code: 'INCOMPLETE_SAMPLE_CHECKS' });
});

test('wholesale orders validate clients and the latest quantity committed to both channels', () => {
  const before = workspace(), product = findProduct(before), context = options();
  const maximum = wholesaleAvailable(product);
  const next = createWholesaleOrder(before, product.id, { client: '  Atelier H  ', quantity: String(maximum) }, context);
  const order = findProduct(next).wholesaleOrders.at(-1);
  assert.equal(order.client, 'Atelier H');
  assert.equal(order.qty, maximum);
  assert.equal(order.shipped, 0);
  assert.ok(order.id.startsWith(`W-${product.styleId}-`));
  assert.ok(order.recordId);
  assert.equal(wholesaleAvailable(findProduct(next)), 0);
  assert.throws(() => createWholesaleOrder(next, product.id, { client: 'Studio Z', quantity: 1 }), { code: 'INVALID_WHOLESALE_ORDER' });
  for (const patch of [null, { client: ' ' }, { client: 'a'.repeat(81) }, { quantity: maximum + 1 }, { quantity: true }, { quantity: null }, { quantity: 0 }, { quantity: 1.5 }]) {
    assert.throws(() => createWholesaleOrder(before, product.id, patch === null ? null : { client: 'Atelier H', quantity: 1, ...patch }), { code: 'INVALID_WHOLESALE_ORDER' });
  }
  assert.equal(before.items[0].wholesaleOrders.length, 2);
});

test('shipping consumes current produced stock and order remainder atomically with stable references', () => {
  const before = workspace(), product = findProduct(before), context = options(), order = product.wholesaleOrders[0];
  order.recordId = 'wholesale-record';
  const remainder = order.qty - order.shipped, initialStock = totals(product).stock;
  const next = createShipment(before, product.id, { orderId: order.recordId, quantity: remainder }, context);
  const after = findProduct(next), shipment = after.shipments[0];
  assert.equal(after.wholesaleOrders[0].shipped, order.qty);
  assert.equal(after.wholesaleOrders[0].status, 'Spedito');
  assert.equal(totals(after).stock, initialStock - remainder);
  assert.equal(shipment.orderId, order.id);
  assert.equal(shipment.orderRecordId, order.recordId);
  assert.equal(shipment.lotId, product.lotId);
  assert.equal(shipment.status, 'In consegna');
  assert.notEqual(shipment.id, product.shipments[0].id);
  assert.ok(shipment.recordId);
  assert.throws(() => createShipment(next, product.id, { orderId: order.id, quantity: 1 }), { code: 'INVALID_SHIPMENT_QUANTITY' });
  assert.throws(() => createShipment(before, product.id, { orderId: 'missing', quantity: 1 }), { code: 'WHOLESALE_ORDER_NOT_FOUND' });
  assert.throws(() => createShipment(before, product.id, null), { code: 'WHOLESALE_ORDER_NOT_FOUND' });
  for (const quantity of [null, true, '', 0, 1.5, remainder + 1]) assert.throws(() => createShipment(before, product.id, { orderId: order.id, quantity }), { code: 'INVALID_SHIPMENT_QUANTITY' });
  const exhausted = { ...before, items: before.items.map(item => item === product ? { ...item, produced: item.retailSold + totals(item).shipped + item.reworks } : item) };
  assert.equal(totals(findProduct(exhausted)).stock, 0);
  assert.throws(() => createShipment(exhausted, product.id, { orderId: order.id, quantity: 1 }), { code: 'INVALID_SHIPMENT_QUANTITY' });
  assert.equal(order.shipped, 60);
});

test('shipping creates distinct identifiers for repeated dispatches and confirmation is idempotent', () => {
  const before = workspace(), product = findProduct(before), context = options(), order = product.wholesaleOrders[1];
  let current = createShipment(before, product.id, { orderId: order.id, quantity: 1 }, context);
  current = createShipment(current, product.id, { orderId: order.id, quantity: 1 }, context);
  const shipments = findProduct(current).shipments;
  assert.notEqual(shipments[0].id, shipments[1].id);
  assert.notEqual(shipments[0].recordId, shipments[1].recordId);
  assert.equal(findProduct(current).wholesaleOrders[1].shipped, 2);
  const next = confirmShipment(current, product.id, shipments[0].recordId, context);
  assert.equal(findProduct(next).shipments[0].status, 'Consegnata');
  assert.equal(totals(findProduct(next)).stock, totals(findProduct(current)).stock);
  assert.equal(confirmShipment(next, product.id, shipments[0].id), next);
  assert.throws(() => confirmShipment(next, product.id, 'missing'), { code: 'SHIPMENT_NOT_FOUND' });
});

test('purchase commands validate quantities, prices and calendar dates before assigning identifiers', () => {
  const before = workspace(), product = findProduct(before), context = options();
  const input = { supplier: '  Accessori Firenze  ', material: '  Etichette  ', qty: '10', price: '.01', date: '2028-02-29' };
  const next = createPurchaseOrder(before, product.id, input, context), order = findProduct(next).purchaseOrders.at(-1);
  assert.equal(order.supplier, 'Accessori Firenze');
  assert.equal(order.material, 'Etichette');
  assert.equal(order.qty, 10);
  assert.equal(order.price, .01);
  assert.equal(order.date, '2028-02-29');
  assert.equal(order.status, 'Confermato');
  assert.ok(order.recordId);
  assert.ok(order.id.startsWith(`ACQ-${product.styleId}-`));
  assert.equal(next.inbox[0].moduleId, 11);
  for (const patch of [null, { supplier: ' ' }, { supplier: 'A'.repeat(81) }, { material: ' ' }, { material: 'A'.repeat(81) }, { qty: true }, { qty: null }, { qty: '' }, { qty: 0 }, { qty: 1.5 }, { qty: 20001 }, { price: true }, { price: null }, { price: '' }, { price: .009 }, { price: 1000.01 }, { price: Infinity }, { price: 'NaN' }, { date: '2026-02-29' }, { date: '2026-04-31' }, { date: '2026-13-01' }, { date: '2026-2-01' }, { date: '' }]) {
    assert.throws(() => createPurchaseOrder(before, product.id, patch === null ? null : { ...input, ...patch }), { code: 'INVALID_PURCHASE_ORDER' });
  }
  assert.equal(product.purchaseOrders.length, 3);
});

test('purchase identifiers remain unique across the workspace and unchanged after catalog code edits', () => {
  const before = workspace(), product = findProduct(before), context = options(), input = { supplier: 'Accessori Firenze', material: 'Etichette', qty: 20000, price: 1000, date: '2027-05-02' };
  const occupied = `ACQ-${product.styleId}-${product.purchaseOrders.length + 1}`;
  before.items[1].purchaseOrders.push({ ...product.purchaseOrders[0], id: occupied });
  let next = createPurchaseOrder(before, product.id, input, context);
  const first = findProduct(next).purchaseOrders.at(-1);
  assert.equal(first.id, `${occupied}-2`);
  next = createPurchaseOrder(next, product.id, input, context);
  const second = findProduct(next).purchaseOrders.at(-1);
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.recordId, second.recordId);
  const renamed = updateProductMetadata(next, product.id, { styleId: 'MG-0999' }, context);
  assert.equal(findProduct(renamed).purchaseOrders.at(-2).id, first.id);
  assert.equal(findProduct(renamed).purchaseOrders.at(-2).recordId, first.recordId);
  const ids = renamed.items.flatMap(item => item.purchaseOrders.map(row => row.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('lifecycle commands enforce event types and real dates and distinguish future calendar days', () => {
  const before = workspace(), product = findProduct(before), context = options();
  context.now = () => new Date(2026, 9, 24, 23, 59);
  const input = { type: 'Riparazione', note: '  Intervento al polso  ', date: '2026-10-24' };
  let next = recordLifecycleEvent(before, product.id, input, context);
  const first = findProduct(next).lifecycle.at(-1);
  assert.equal(first.note, 'Intervento al polso');
  assert.equal(first.future, false);
  assert.ok(first.id && first.recordId);
  assert.notEqual(first.id, first.recordId);
  for (const type of ['Reso', 'Seconda vita', 'Riciclo']) {
    next = recordLifecycleEvent(next, product.id, { ...input, type, date: '2026-10-25' }, context);
    assert.equal(findProduct(next).lifecycle.at(-1).future, true);
  }
  const records = findProduct(next).lifecycle.slice(-4);
  assert.equal(new Set(records.map(row => row.recordId)).size, records.length);
  const renamed = updateProductMetadata(next, product.id, { styleId: 'MG-0999' }, context);
  assert.equal(findProduct(renamed).lifecycle.at(-4).id, first.id);
  assert.equal(findProduct(renamed).lifecycle.at(-4).recordId, first.recordId);
  for (const patch of [null, { type: 'Unknown' }, { note: '' }, { note: ' ' }, { note: 'A'.repeat(501) }, { date: '2026-02-29' }, { date: '2026-04-31' }, { date: '2026-10-32' }, { date: '2026-13-01' }, { date: '2026-2-01' }, { date: '' }]) {
    assert.throws(() => recordLifecycleEvent(before, product.id, patch === null ? null : { ...input, ...patch }), { code: 'INVALID_LIFECYCLE_EVENT' });
  }
  assert.equal(findProduct(recordLifecycleEvent(before, product.id, { ...input, date: '2028-02-29' }, context)).lifecycle.at(-1).date, '2028-02-29');
  assert.equal(product.lifecycle.length, 1);
});

test('new operational record identities are UUIDs and survive serialization', () => {
  const before = workspace(), product = findProduct(before), uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  let next = createPurchaseOrder(before, product.id, { supplier: 'Atelier', material: 'Etichetta', qty: 1, price: 1, date: '2027-05-02' });
  next = recordLifecycleEvent(next, product.id, { type: 'Reso', note: 'Verifica condizioni', date: '2026-10-12' });
  const current = findProduct(next), restored = findProduct(JSON.parse(JSON.stringify(next)));
  assert.match(current.purchaseOrders.at(-1).recordId, uuid);
  assert.match(current.lifecycle.at(-1).id, uuid);
  assert.match(current.lifecycle.at(-1).recordId, uuid);
  assert.equal(current.purchaseOrders.at(-1).recordId, restored.purchaseOrders.at(-1).recordId);
  assert.equal(current.lifecycle.at(-1).recordId, restored.lifecycle.at(-1).recordId);
});
