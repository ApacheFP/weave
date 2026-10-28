import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { saveProductSection } from '../src/dashboard/workspaceCommands.js';
import { assertWorkspace } from '../src/dashboard/workspaceSchema.js';
import { purchaseMaterial, markerConfiguration } from '../src/dashboard/productData.js';
import { fabrics, totals } from '../src/dashboard/domain.js';

test('fitting revisions persist independently and reopen the sample approval', () => {
  const workspace = createDemoWorkspace(), product = workspace.items[0];
  const revision = { id: 'sample-test', modelVersion: product.modelVersion, at: '2026-10-28T12:00:00.000Z', values: [60, 42, 103], note: 'Verificare il torace' };
  const result = saveProductSection(workspace, product.id, 'saveSampleChecks', { sampleRevisions: [revision], sampleApproved: false, sampleChecks: [false, false, false] });
  assert.equal(assertWorkspace(result), result);
  assert.deepEqual(result.items[0].sampleRevisions, [revision]);
  assert.equal(result.items[0].sampleApproved, false);
  assert.equal(product.sampleRevisions, undefined);
  const broken = structuredClone(result);
  broken.items[0].sampleRevisions[0].values[0] = -1;
  assert.throws(() => assertWorkspace(broken));
});

test('BOM costs, linked purchases and marker estimates use the current variant data', () => {
  const product = structuredClone(createDemoWorkspace().items[0]);
  const trim = product.trims[0]; trim.name = 'Nuovo nastro'; trim.supplier = 'Fornitore aggiornato'; trim.qty = 2; trim.price = 3;
  const fabric = fabrics.find(item => item.id === product.fabricId);
  const purchase = purchaseMaterial(product, { id: 'test', materialId: trim.id, material: 'Vecchio nome', supplier: 'Vecchio fornitore' }, fabric);
  assert.equal(purchase.material, 'Nuovo nastro');
  assert.equal(purchase.supplier, 'Fornitore aggiornato');
  assert.equal(purchase.qty, product.quantity * 2);
  assert.equal(purchase.price, 3);
  const initial = totals(product);
  Object.assign(product, markerConfiguration(product, product.markerWidth, true));
  assert.equal(totals(product).materials, product.consumption * product.fabricPrice + product.trims.reduce((sum, row) => sum + row.qty * row.price, 0));
  assert.ok(totals(product).materials <= initial.materials);
});
