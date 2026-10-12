import test from 'node:test';
import assert from 'node:assert/strict';
import { artboardSize, validVectorScene, validArtwork, withArtwork } from '../src/dashboard/vectorDocument.js';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { technicalDefaults, versionSnapshot } from '../src/dashboard/technicalData.js';
import { assertWorkspace } from '../src/dashboard/workspaceSchema.js';
import { applyProductPatch } from '../src/dashboard/domain.js';

const scene = () => ({ schemaVersion: 1, ...artboardSize, json: { version: '7.4.0', background: '#ffffff', objects: [{ type: 'Path', id: 'path-1', left: 30, top: 40, fill: '#ffffff', stroke: '#000000', scaleX: 1.2, scaleY: 1, angle: 20, path: [['M', 0, 0], ['L', 20, 30], ['C', 0, 2, 5, 3, 10, 4], ['Z']] }] }, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200"><path d="M 30 40 L 50 70 Z"/></svg>' });
test('vector scenes preserve paths and transforms through JSON serialization', () => {
  const original = scene();
  assert.equal(validVectorScene(original), true);
  const restored = JSON.parse(JSON.stringify(original));
  assert.equal(validVectorScene(restored), true);
  assert.deepEqual(restored, original);
  assert.equal(validArtwork(undefined), true);
});
test('each side receives its own immutable document without replacing other views or measurements', () => {
  const product = createDemoWorkspace().items[0];
  const snapshot = versionSnapshot(product, technicalDefaults(product));
  const front = withArtwork(snapshot, 'Fronte', scene());
  const back = withArtwork(front, 'Retro', scene());
  back.artwork.Retro.json.objects[0].scaleX = 2;
  assert.equal(front.artwork.Retro, undefined);
  assert.equal(snapshot.artwork, undefined);
  assert.equal(back.artwork.Fronte.json.objects[0].scaleX, 1.2);
  back.artwork.Fronte.json.objects[0].scaleX = 3;
  assert.equal(front.artwork.Fronte.json.objects[0].scaleX, 1.2);
  assert.deepEqual(back.measurements, snapshot.measurements);
  assert.throws(() => withArtwork(snapshot, 'unknown', scene()));
});
test('unsafe SVG, external images, unknown object types, excessive documents and invalid coordinates are rejected', () => {
  const cases = [
    value => { value.svg = '<svg><script>alert(1)</script></svg>'; },
    value => { value.svg = '<svg><image href="https://external.example/x.png"/></svg>'; },
    value => { value.json.backgroundImage = { type: 'Image', src: 'https://external.example' }; },
    value => { value.json.objects[0].type = 'Image'; },
    value => { value.json.objects[0].left = NaN; },
    value => { value.json.objects[0].fill = { type: 'Pattern', source: 'https://external.example' }; },
    value => { value.json.objects[0].path = [['INVALID', 0, 1]]; },
    value => { value.json.objects[0].path = [['C', 0, 1]]; },
    value => { value.json.objects = [{ type: 'Group', objects: Array.from({ length: 500 }, () => ({ type: 'Rect' })) }]; },
    value => { value.json.objects = Array.from({ length: 501 }, () => ({ type: 'Rect' })); },
    value => { value.svg = '<svg>' + ' '.repeat(2e6) + '</svg>'; },
  ];
  for (const corrupt of cases) { const value = scene(); corrupt(value); assert.equal(validVectorScene(value), false); }
  assert.equal(validArtwork({ Unknown: scene() }), false);
});
test('the persisted workspace validates vector revisions and preserves earlier documents', () => {
  const workspace = createDemoWorkspace(), product = workspace.items[0];
  const technical = technicalDefaults(product);
  const snapshot = withArtwork(versionSnapshot(product, technical), 'Fronte', scene());
  product.technical = { ...technical, versions: [{ id: 'version-vector', number: 1, note: 'Manuale', snapshot }], currentId: 'version-vector' };
  assert.equal(assertWorkspace(workspace), workspace);
  const corrupt = structuredClone(workspace);
  corrupt.items[0].technical.versions[0].snapshot.artwork.Fronte.json.objects[0].type = 'Unknown';
  assert.throws(() => assertWorkspace(corrupt));
  assert.equal(snapshot.artwork.Fronte.json.objects[0].type, 'Path');
});
test('approving a changed drawing reopens fitting; a draft or identical approved drawing does not', () => {
  const product = createDemoWorkspace().items[0], technical = technicalDefaults(product);
  const snapshot = versionSnapshot(product, technical);
  product.sampleApproved = true; product.sampleChecks = [true, true, true];
  product.technical = { ...technical, versions: [{ id: 'old', number: 1, snapshot }], approvedId: 'old', currentId: 'old' };
  const draft = { ...product.technical, versions: [...product.technical.versions, { id: 'manual', number: 2, snapshot: withArtwork(snapshot, 'Fronte', scene()) }], currentId: 'manual' };
  assert.equal(applyProductPatch(product, { technical: draft }).sampleApproved, true);
  const approved = applyProductPatch(product, { technical: { ...draft, approvedId: 'manual' } });
  assert.equal(approved.sampleApproved, false);
  assert.deepEqual(approved.sampleChecks, [false, false, false]);
  approved.sampleApproved = true; approved.sampleChecks = [true, true, true];
  assert.equal(applyProductPatch(approved, { technical: structuredClone(approved.technical) }).sampleApproved, true);
});
