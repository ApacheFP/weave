import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultProportions, proportionTransform, validProportions } from '../src/dashboard/proportions.js';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { assertWorkspace } from '../src/dashboard/workspaceSchema.js';
import { applyProductPatch } from '../src/dashboard/domain.js';

test('demo proportions change the actual vector transform without physical units', () => {
  assert.equal(proportionTransform(defaultProportions), 'translate(340 342) scale(1 1) translate(-340 -342)');
  assert.equal(proportionTransform({ width: 120, height: 80 }), 'translate(340 342) scale(1.2 0.8) translate(-340 -342)');
  for (const value of [{ width: 79, height: 100 }, { width: 100, height: 121 }, { width: NaN, height: 100 }, { width: 100 }, { width: 100, height: 100, extra: 1 }]) {
    assert.equal(validProportions(value), false);
    assert.throws(() => proportionTransform(value));
  }
});

test('approving changed proportions reopens fitting without modifying the prior revision', () => {
  const product = createDemoWorkspace().items[0];
  const previous = product.technical.versions[0];
  product.sampleApproved = true; product.sampleChecks = [true, true, true];
  const changed = { ...previous, id: 'proportion-revision', number: 2, snapshot: { ...previous.snapshot, proportions: { width: 110, height: 100 } } };
  const next = applyProductPatch(product, { technical: { ...product.technical, versions: [...product.technical.versions, changed], approvedId: changed.id, currentId: changed.id } });
  assert.equal(next.sampleApproved, false);
  assert.deepEqual(next.sampleChecks, [false, false, false]);
  assert.equal(previous.snapshot.proportions, undefined);
});

test('old revisions remain valid and saved proportions are validated', () => {
  const workspace = createDemoWorkspace(), version = workspace.items[0].technical.versions[0];
  assert.equal(assertWorkspace(workspace), workspace);
  version.snapshot.proportions = { width: 110, height: 90 };
  assert.equal(assertWorkspace(workspace), workspace);
  version.snapshot.proportions.height = 200;
  assert.throws(() => assertWorkspace(workspace));
});
