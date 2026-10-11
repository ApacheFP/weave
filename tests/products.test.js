import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { additionalFabrics, categoryFabrics, gradedRows, groupProducts, markerConfiguration, materialUnit, newDemoProducts, piecesFor, productMedia, productSearchText, productSizes, productSpec, productVariantId, purchaseMaterial, styleLabel } from '../src/dashboard/productData.js';
import { technicalDefaults, versionSnapshot, reviseTechnical } from '../src/dashboard/technicalData.js';
import { creativeDefaults } from '../src/dashboard/creativeData.js';
import { seedWorkspaceData, validTask } from '../src/dashboard/workspaceData.js';

const base = { creative: creativeDefaults(), profile: { firstName: 'Alex', lastName: 'Rossi', email: 'demo@weave.it' }, collection: 'Autunno/Inverno 2027', technical: null, phaseReviews: {}, events: [], chats: {}, aiRuns: {} };
const products = newDemoProducts(base);

test('the same jacket groups its variants without losing quantities, references or selection', () => {
  const jackets = [
    { productId: 'GJ-0421', styleId: 'GJ-0421', title: 'Giacca Atelier', variant: 'Cammello', fabricId: 'base', quantity: 500, produced: 320, orderId: 'OP-0421', lotId: 'L-0421-A', identityAssigned: false },
    { productId: 'GJ-0421', styleId: 'GJ-0422', title: 'Giacca Atelier', aliasTitle: 'Giacca Studio', variant: 'Sabbia', fabricId: 'premium', quantity: 600, produced: 320, orderId: 'OP-0422', lotId: 'L-0422-A', identityAssigned: true },
  ];
  const items = [...jackets, ...products];
  const fabrics = [{ id: 'base', name: 'Lana mista · Cammello' }, { id: 'premium', name: 'Lana vergine · Sabbia' }];
  const grouped = groupProducts(items, 'GJ-0422', {}, fabrics);
  assert.equal(grouped.length, 4);
  const jacket = grouped[0];
  assert.equal(jacket.styleId, 'GJ-0422');
  assert.equal(jacket.variantSummary, 'Cammello / Sabbia');
  assert.equal(jacket.totalQuantity, 1100);
  assert.equal(jacket.totalProduced, 640);
  assert.ok(jacket.identityAssigned);
  assert.deepEqual(jacket.variants.map(item => item.orderId), ['OP-0421', 'OP-0422']);
  assert.deepEqual(jacket.variants.map(item => item.lotId), ['L-0421-A', 'L-0422-A']);
  assert.equal(groupProducts(items, 'PT-0423', { 'GJ-0421': 'GJ-0422' })[0].styleId, 'GJ-0422');
  assert.equal(groupProducts(items, 'PT-0423', { 'GJ-0421': 'missing' })[0].styleId, 'GJ-0421');
  for (const query of ['sabbia', 'lana vergine', 'gj-0422', 'giacca studio']) assert.ok(productSearchText(jacket).includes(query));
  assert.equal(styleLabel(jackets[1]), 'Giacca Atelier · Sabbia');
  assert.equal(productVariantId(jacket, 'Cammello'), 'GJ-0421');
  assert.equal(productVariantId(jacket, 'Lana vergine'), 'GJ-0422');
  assert.equal(productVariantId(jacket, 'Giacca Studio'), 'GJ-0422');
  assert.equal(productVariantId(jacket), 'GJ-0422');
  assert.equal(groupProducts([...items, { ...jackets[0], productId: undefined, styleId: 'GJ-0426' }], 'GJ-0426').length, 5);
  assert.equal(jackets[0].quantity, 500);
  assert.equal(jackets[1].quantity, 600);
});

test('each new demo has consistent quantities, its own references and production history', () => {
  const ids = new Set();
  for (const data of products) {
    const committed = data.retailSold + data.wholesaleOrders.reduce((sum, order) => sum + order.qty, 0);
    const distributed = data.retailSold + data.wholesaleOrders.reduce((sum, order) => sum + order.shipped, 0);
    assert.ok(committed <= data.quantity);
    assert.ok(distributed <= data.produced - data.reworks);
    assert.equal(data.productionDays.reduce((sum, n) => sum + n, 0), data.produced);
    assert.ok(data.produced <= data.quantity && data.reworks <= data.produced);
    for (const id of [data.styleId, data.orderId, data.lotId, data.sampleId, ...data.purchaseOrders.map(row => row.id), ...data.wholesaleOrders.map(row => row.id), ...data.shipments.map(row => row.id)]) {
      assert.ok(!ids.has(id), id); ids.add(id);
    }
    assert.equal(categoryFabrics(data, additionalFabrics).length, 1);
    assert.equal(productSpec(data).operations.reduce((sum, row) => sum + row[2], 0), data.laborMinutes);
    assert.ok(data.events.every(event => !/spalla|giacca/i.test(event.text) || data.category === 'knit'));
  }
});

test('trouser waist and hip develop separately; bag remains one size; knit uses letter sizes', () => {
  const [trousers, bag, knit] = products;
  const trousersRows = gradedRows(trousers);
  assert.equal(trousersRows[3][2] - trousersRows[2][2], 4);
  assert.equal(trousersRows[3][3] - trousersRows[2][3], 4);
  assert.deepEqual(gradedRows(bag), [['Unica', 34, 29, 12, 62]]);
  assert.deepEqual(productSizes(knit), ['XS', 'S', 'M', 'L', 'XL']);
  assert.deepEqual(gradedRows(knit)[2].slice(1), knit.measurements.map(row => row.value));
});

test('marker optimization uses category baseline and units without accumulating reductions', () => {
  for (const data of products) {
    const optimized = markerConfiguration(data, data.markerWidth, true);
    assert.ok(Number.isFinite(optimized.consumption) && optimized.consumption > 0 && optimized.consumption < data.consumption);
    assert.equal(markerConfiguration({ ...data, ...optimized }, data.markerWidth, true).consumption, optimized.consumption);
    assert.equal(markerConfiguration({ ...data, ...optimized }, data.markerWidth, false).consumption, data.consumption);
  }
  assert.equal(materialUnit(products[2]), 'kg');
  assert.equal(markerConfiguration({ markerWidth: 150 }, 150, false).consumption, 1.85);
  assert.equal(markerConfiguration({ markerWidth: 150 }, 150, false).waste, 14);
});

test('procurement follows BOM IDs, units, edits and order quantity', () => {
  for (const data of products) {
    const fabric = additionalFabrics.find(item => item.id === data.fabricId);
    for (const order of data.purchaseOrders) {
      const result = purchaseMaterial(data, order, fabric);
      assert.ok(result.qty > 0 && result.price > 0);
      assert.equal(purchaseMaterial({ ...data, quantity: data.quantity * 2 }, order, fabric).qty, result.qty * 2);
      assert.equal(purchaseMaterial(data, { ...order, qty: 9, price: 7, unit: 'set' }, fabric).unit, 'set');
    }
    assert.equal(purchaseMaterial(data, data.purchaseOrders[0], fabric).unit, materialUnit(data));
  }
});

test('technical defaults, revisions and snapshot parts follow each category', () => {
  for (const data of products) {
    const t = technicalDefaults(data), before = versionSnapshot(data, t);
    assert.equal(t.colors[0].name, data.variant);
    assert.equal(before.category, data.category);
    assert.equal(before.baseSize, productSpec(data).baseSize);
    assert.deepEqual(Object.keys(before.parts), Object.keys(productSpec(data).parts));
    for (const prompt of productSpec(data).revisionPrompts) {
      const after = reviseTechnical(before, prompt);
      assert.ok(after, `${data.category}: ${prompt}`);
      assert.notDeepEqual(after, before);
      assert.equal(after.category, before.category);
    }
    assert.equal(reviseTechnical(before, 'Accorcia la lunghezza di 900 cm'), null);
  }
  const bag = versionSnapshot(products[1], technicalDefaults(products[1]));
  assert.equal(reviseTechnical(bag, 'Allunga il manico di 2 cm').measurements[3].value, 64);
  assert.equal(reviseTechnical(bag, 'Accorcia la manica di 1 cm'), null);
});

test('all consumed new assets exist, raster thumbnails exist and prompts are saved', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/dashboard/capsule-manifest.json', import.meta.url)));
  assert.equal(manifest.assets.length, 22);
  for (const asset of manifest.assets) {
    assert.ok(asset.prompt && existsSync(new URL('../' + asset.output, import.meta.url)));
    assert.ok(existsSync(new URL('../' + asset.thumbnail, import.meta.url)));
  }
  for (const data of products) {
    for (const role of ['front', 'back', 'sketch', 'fabric', 'trims', 'sample', 'quality', 'pattern', 'grading', 'marker-base', 'marker-optimized']) {
      const key = productMedia(data, role), format = /pattern|grading|marker/.test(key) ? 'svg' : 'webp';
      assert.ok(existsSync(new URL(`../public/images/dashboard/${key}.${format}`, import.meta.url)), key);
      assert.doesNotMatch(key, /jacket|quality-seam/);
    }
    for (const piece of piecesFor(data)) assert.ok(existsSync(new URL(`../public/images/dashboard/${piece.asset}.svg`, import.meta.url)));
  }
});

test('all new products receive valid tasks and inbox entries', () => {
  const existing = [{ ...base, styleId: 'GJ-0421' }, { ...base, styleId: 'GJ-0422' }];
  const items = [...existing, ...products], workspace = seedWorkspaceData(items, base.profile, new Date('2026-10-11T12:00:00Z'));
  for (const data of products) {
    const task = workspace.tasks.find(row => row.styleId === data.styleId);
    assert.ok(task && validTask(task, items));
    assert.ok(workspace.inbox.some(row => row.styleId === data.styleId));
  }
});
