import test from 'node:test';
import assert from 'node:assert/strict';
import { applyProductPatch, minQuantity, retailAvailable, retailSale, totals, validStyleInput, wholesaleAvailable } from '../src/dashboard/domain.js';
import { demoDefaults } from '../src/dashboard/demoDefaults.js';
import { newDemoProducts } from '../src/dashboard/productData.js';
import { localDate, seedWorkspaceData, validTask } from '../src/dashboard/workspaceData.js';

const products = newDemoProducts(demoDefaults);

test('retail cannot oversell the total quantity already committed to wholesale orders', () => {
  const product = structuredClone(products[0]);
  product.wholesaleOrders.push({ id: 'reserved', qty: wholesaleAvailable(product), shipped: 0 });
  assert.ok(totals(product).stock > 0);
  assert.equal(wholesaleAvailable(product), 0);
  assert.equal(retailAvailable(product), 0);
  assert.deepEqual(retailSale(product), {});
  assert.equal(minQuantity(product), product.quantity);
});

test('retail availability respects both produced stock and outstanding commitments', () => {
  const product = { ...structuredClone(products[0]), produced: 300, reworks: 0 };
  const remaining = wholesaleAvailable(product);
  const firstSale = retailSale(product);
  assert.equal(firstSale.retailSold, 49);
  assert.equal(firstSale.retailAverage, 194.12);
  let current = product;
  for (let index = 0; index < remaining; index++) current = { ...current, ...retailSale(current) };
  assert.equal(retailAvailable(current), 0);
  assert.equal(current.retailSold + current.wholesaleOrders.reduce((sum, order) => sum + order.qty, 0), current.quantity);
  assert.equal(totals(current).stock, current.wholesaleOrders.reduce((sum, order) => sum + order.qty - order.shipped, 0));
  assert.deepEqual(retailSale(current), {});
  const exhausted = { ...product, produced: product.retailSold + totals(product).shipped };
  assert.ok(wholesaleAvailable(exhausted) > 0);
  assert.equal(retailAvailable(exhausted), 0);
});

test('model changes reopen the reviewed model and require a new fitting approval', () => {
  const product = { ...structuredClone(products[0]), sampleApproved: true, sampleChecks: [true, true, true], phaseReviews: { 3: true, 4: true, 5: true, 9: true } };
  const measurements = structuredClone(product.measurements);
  measurements[3].value += 1;
  const changed = applyProductPatch(product, { measurements });
  assert.equal(changed.sampleApproved, false);
  assert.deepEqual(changed.sampleChecks, [false, false, false]);
  assert.equal(changed.phaseReviews[4], false);
  assert.equal(changed.phaseReviews[5], false);
  assert.equal(changed.phaseReviews[3], true);
  assert.equal(changed.phaseReviews[9], true);
  assert.equal(product.sampleApproved, true);
  assert.equal(product.measurements[3].value, 58);
  for (const patch of [{ seam: .8 }, { modelVersion: '1.2' }, { fabricId: 'luce-salvia-yarn' }]) {
    assert.equal(applyProductPatch(product, patch).sampleApproved, false);
  }
});

test('identical snapshots and price changes preserve fitting, explicit approval preserves its checks', () => {
  const product = { ...structuredClone(products[0]), sampleApproved: true, sampleChecks: [true, true, true], phaseReviews: { 4: true, 5: true, 9: true } };
  const identical = applyProductPatch(product, { measurements: structuredClone(product.measurements) });
  assert.equal(identical.sampleApproved, true);
  assert.equal(identical.phaseReviews[4], true);
  assert.equal(identical.phaseReviews[5], true);
  const price = applyProductPatch(product, { fabricPrice: 80 });
  assert.equal(price.sampleApproved, true);
  assert.equal(price.phaseReviews[9], false);
  const approved = applyProductPatch(product, { sampleApproved: true, modelVersion: '1.1' });
  assert.equal(approved.sampleApproved, true);
  assert.deepEqual(approved.sampleChecks, [true, true, true]);
});

test('new style validation rejects malformed identity, numeric values and impossible copied quantities', () => {
  const input = { title: 'Nuova maglia', styleId: 'mg-0500', collection: demoDefaults.collection, quantity: '300', copy: false };
  assert.equal(validStyleInput(input, products, products[0]), true);
  for (const patch of [{ title: ' ' }, { collection: ' ' }, { styleId: 'MG--0500' }, { styleId: 'mg-0425' }, { styleId: 'A'.repeat(25) }, { quantity: '' }, { quantity: null }, { quantity: true }, { quantity: 'NaN' }, { quantity: Infinity }, { quantity: 0 }, { quantity: 10.5 }, { quantity: 10001 }, { copy: 'false' }, { copy: true, quantity: minQuantity(products[0]) - 1 }]) {
    assert.equal(validStyleInput({ ...input, ...patch }, products, products[0]), false, JSON.stringify(patch));
  }
  assert.equal(validStyleInput(null, products, products[0]), false);
  assert.equal(validStyleInput({ ...input, copy: true, quantity: minQuantity(products[0]) }, products, products[0]), true);
});

test('task dates reject nonexistent dates and retain calendar days across daylight saving boundaries', () => {
  const now = new Date(2026, 9, 24, 12);
  const workspace = seedWorkspaceData(products, demoDefaults.profile, now);
  const task = workspace.tasks[0];
  assert.equal(localDate(now), '2026-10-24');
  assert.equal(workspace.tasks.find(task => task.id === `task-production-${products[0].styleId}`).due, '2026-10-25');
  for (const due of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-2-01']) assert.equal(validTask({ ...task, due }, products), false);
  for (const due of ['2028-02-29', '2026-10-25', '']) assert.equal(validTask({ ...task, due }, products), true);
  assert.equal(validTask(null, products), false);
});
