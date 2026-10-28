import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { additionalFabrics, categoryFabrics, gradedRows, groupProducts, markerConfiguration, materialUnit, newDemoProducts, piecesFor, productMedia, productSearchText, productSizes, productSpec, productVariantId, purchaseMaterial, styleLabel } from '../src/dashboard/productData.js';
import { technicalDefaults, versionSnapshot, reviseTechnical } from '../src/dashboard/technicalData.js';
import { creativeDefaults } from '../src/dashboard/creativeData.js';
import { seedWorkspaceData, validTask } from '../src/dashboard/workspaceData.js';

const base = { creative: creativeDefaults(), profile: { firstName: 'Alex', lastName: 'Rossi', email: 'demo@weave.it' }, collection: 'Autunno/Inverno 2027', technical: null, phaseReviews: {}, events: [], chats: {}, aiRuns: {} };
const products = newDemoProducts(base);

test('Maglia Luce is first and groups three colors with independent production and remembered selection', () => {
  assert.equal(products[0].styleId, 'MG-0425');
  const grouped = groupProducts(products, 'MG-0426', {}, additionalFabrics);
  assert.deepEqual(grouped.map(item => item.title), ['Maglia Luce', 'Pantalone Riva', 'Borsa Trama']);
  const knit = grouped[0];
  assert.equal(knit.styleId, 'MG-0426');
  assert.equal(knit.variantSummary, 'Avorio / Salvia / Grafite');
  assert.equal(knit.totalQuantity, 800);
  assert.equal(knit.totalProduced, 432);
  assert.deepEqual(knit.variants.map(item => item.orderId), ['OP-0425', 'OP-0426', 'OP-0427']);
  assert.deepEqual(knit.variants.map(item => item.lotId), ['L-0425-A', 'L-0426-A', 'L-0427-A']);
  assert.equal(groupProducts(products, 'PT-0423', { 'MG-0425': 'MG-0427' })[0].styleId, 'MG-0427');
  assert.equal(groupProducts(products, 'PT-0423', { 'MG-0425': 'missing' })[0].styleId, 'MG-0425');
  for (const query of ['salvia', 'grafite', 'merino e cashmere', 'mg-0427']) assert.ok(productSearchText(knit).includes(query));
  assert.equal(styleLabel(products[1]), 'Maglia Luce · Salvia');
  assert.equal(productVariantId(knit, 'Avorio'), 'MG-0425');
  assert.equal(productVariantId(knit, 'Grafite'), 'MG-0427');
  assert.equal(productVariantId(knit), 'MG-0426');
  assert.equal(groupProducts([...products, { ...products[0], productId: undefined, styleId: 'MG-0428' }], 'MG-0428').length, 4);
  assert.equal(products[0].quantity, 300);
  assert.equal(products[1].quantity, 240);
  assert.ok(products.every(item => !/giacca|cappotto|GJ-|NC-018|L-0421/i.test(JSON.stringify(item))));
  assert.equal(new Set(products.map(item => productSpec(item).quality.id)).size, 5);
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
  const trousers = products.find(item => item.category === 'trousers'), bag = products.find(item => item.category === 'bag'), knit = products[0];
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
  assert.equal(markerConfiguration({ category: 'knit', markerWidth: 0 }, 0, false).consumption, .38);
  assert.equal(markerConfiguration({ category: 'knit', markerWidth: 0 }, 0, false).waste, 6);
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
    const primary = data.purchaseOrders.find(order => order.materialId === 'main') || { id: 'test-main', materialId: 'main' };
    assert.equal(purchaseMaterial(data, primary, fabric).unit, materialUnit(data));
    assert.equal(purchaseMaterial(data, primary, fabric).qty, data.quantity * data.consumption);
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
  const bag = versionSnapshot(products[4], technicalDefaults(products[4]));
  assert.equal(reviseTechnical(bag, 'Allunga il manico di 2 cm').measurements[3].value, 64);
  assert.equal(reviseTechnical(bag, 'Accorcia la manica di 1 cm'), null);
});

test('all consumed new assets exist, raster thumbnails exist and prompts are saved', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/dashboard/capsule-manifest.json', import.meta.url)));
  assert.ok(manifest.assets.length >= 35);
  for (const asset of manifest.assets) {
    assert.ok(asset.prompt && existsSync(new URL('../' + asset.output, import.meta.url)));
    if (asset.thumbnail) assert.ok(existsSync(new URL('../' + asset.thumbnail, import.meta.url)));
    else assert.match(asset.output, /moodboard-/);
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
  const items = products, workspace = seedWorkspaceData(items, base.profile, new Date('2026-10-11T12:00:00Z'));
  for (const data of products) {
    const task = workspace.tasks.find(row => row.styleId === data.styleId);
    assert.ok(task && validTask(task, items));
    assert.ok(workspace.inbox.some(row => row.styleId === data.styleId));
  }
});

test('creative directions use only current capsule assets and no jacket references', async () => {
  const { prepareDirection } = await import('../src/dashboard/creativeData.js');
  for (const prompt of ['', 'Più salvia e grafite']) {
    const direction = prepareDirection(products[0].creative.inputs, prompt);
    assert.equal(direction.moodboard.length, 3);
    for (const ref of direction.moodboard) {
      assert.doesNotMatch(ref.src, /jacket|mood-reference/);
      assert.ok(existsSync(new URL('../public' + ref.src, import.meta.url)), ref.src);
    }
  }
});
