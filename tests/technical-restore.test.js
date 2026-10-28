import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { restoreTechnicalVersion, technicalDefaults, versionSnapshot } from '../src/dashboard/technicalData.js';
import { applyProductPatch } from '../src/dashboard/domain.js';
import { assertWorkspace } from '../src/dashboard/workspaceSchema.js';

test('restoring an older version approves a new copy, updates product data and retains history', () => {
  const workspace = createDemoWorkspace(), product = workspace.items[0];
  const technical = technicalDefaults(product), old = versionSnapshot(product, technical);
  old.measurements[0].value = 45;
  old.parts.seam = 1.2;
  old.requirements = 'Versione precedente';
  old.notes = [{ id: 'note', text: 'Nota precedente', x: 50, y: 50 }];
  const newer = structuredClone(old); newer.measurements[0].value = 60; newer.requirements = 'Versione successiva';
  product.technical = { ...technical, versions: [{ id: 'old', number: 1, note: 'Prima', snapshot: old }, { id: 'new', number: 2, note: 'Seconda', snapshot: newer }], currentId: 'new', approvedId: 'new' };
  product.measurements = structuredClone(newer.measurements);
  product.sampleApproved = true;
  const patch = restoreTechnicalVersion(product, 'old', 'restored', '2026-10-28T10:00:00.000Z');
  const result = applyProductPatch(product, patch);
  workspace.items[0] = result;
  assert.equal(assertWorkspace(workspace), workspace);
  assert.equal(result.technical.currentId, 'restored');
  assert.equal(result.technical.approvedId, 'restored');
  assert.deepEqual(result.technical.versions.map(v => v.id), ['old', 'new', 'restored']);
  assert.equal(result.technical.versions[2].note, 'Ripristino da v1');
  assert.deepEqual(result.technical.versions[2].snapshot, old);
  assert.equal(result.measurements[0].value, 45);
  assert.equal(result.seam, 1.2);
  assert.equal(result.technical.requirements, 'Versione precedente');
  assert.equal(result.sampleApproved, false);
  result.technical.versions[2].snapshot.measurements[0].value = 50;
  assert.equal(old.measurements[0].value, 45);
  assert.equal(product.technical.approvedId, 'new');
});

test('restoration refuses missing revisions and versions without valid colors', () => {
  const product = createDemoWorkspace().items[0], technical = technicalDefaults(product);
  product.technical = { ...technical, versions: [{ id: 'old', number: 1, note: '', snapshot: { ...versionSnapshot(product, technical), colors: [] } }] };
  assert.throws(() => restoreTechnicalVersion(product, 'missing', 'new', ''), /non è più disponibile/);
  assert.throws(() => restoreTechnicalVersion(product, 'old', 'new', ''), /varianti valide/);
});
