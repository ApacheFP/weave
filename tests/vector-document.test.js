import test from 'node:test';
import assert from 'node:assert/strict';
import { applyQuoteChange, artboardSize, quoteKeyForMeasurement, quoteKeyForPart, validVectorScene, validArtwork, withArtwork } from '../src/dashboard/vectorDocument.js';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { technicalDefaults, versionSnapshot } from '../src/dashboard/technicalData.js';
import { assertWorkspace } from '../src/dashboard/workspaceSchema.js';
import { applyProductPatch } from '../src/dashboard/domain.js';

const scene = () => ({ schemaVersion: 1, ...artboardSize, json: { version: '7.4.0', background: '#ffffff', objects: [{ type: 'Path', id: 'path-1', left: 30, top: 40, fill: '#ffffff', stroke: '#000000', scaleX: 1.2, scaleY: 1, angle: 20, path: [['M', 0, 0], ['L', 20, 30], ['H', 12], ['V', 18], ['S', 0, 2, 5, 3], ['Q', 0, 2, 5, 3], ['C', 0, 2, 5, 3, 10, 4], ['A', 5, 4, 0, 0, 1, 30, 40], ['Z']] }] }, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200"><path d="M 30 40 L 50 70 Z"/></svg>' });
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
test('quote revisions proportionally resize only explicitly bound layers on every saved view', () => {
  const boundScene = () => ({
    schemaVersion: 1, ...artboardSize,
    json: { version: '7.4.0', background: '#ffffff', objects: [
      { type: 'Rect', id: 'width-layer', left: 10, top: 20, width: 100, height: 80, scaleX: 1, scaleY: 1, angle: 0, originX: 'left', originY: 'top', measurementBinding: { quoteKey: 'measurements:0', axis: 'x' } },
      { type: 'Rect', id: 'outline-layer', left: 100, top: 40, width: 50, height: 40, scaleX: 1, scaleY: 1, angle: 0, originX: 'left', originY: 'top', measurementBinding: { quoteKey: 'measurements:0', axis: 'x' } },
      { type: 'Rect', id: 'handle-layer', left: 30, top: 40, width: 100, height: 80, scaleX: 1, scaleY: 1, angle: 0, originX: 'left', originY: 'top', measurementBinding: { quoteKey: 'parts:handle', axis: 'y' } },
      { type: 'Rect', id: 'freehand-layer', left: 0, top: 0, width: 30, height: 30, scaleX: 1, scaleY: 1 },
    ] },
    svg: '<svg><g data-weave-id="width-layer" transform="matrix(1 0 0 1 60 60)"><rect/></g><g data-weave-id="outline-layer" transform="matrix(1 0 0 1 125 60)"><rect/></g><g data-weave-id="handle-layer" transform="matrix(1 0 0 1 80 80)"><rect/></g><g data-weave-id="freehand-layer" transform="matrix(1 0 0 1 15 15)"><rect/></g></svg>',
  });
  const snapshot = { measurements: [{ point: 'Larghezza', value: 50 }], parts: { handle: 2 }, artwork: { Fronte: boundScene(), Retro: boundScene() } };
  const revised = applyQuoteChange(snapshot, quoteKeyForMeasurement(0), 60);
  const ratio = 1.2;
  for (const side of ['Fronte', 'Retro']) {
    const objects = revised.artwork[side].json.objects;
    assert.equal(objects[0].scaleX, ratio);
    assert.equal(objects[0].scaleY, 1);
    assert.equal(objects[0].left, 0);
    assert.equal(objects[0].top, 20);
    assert.equal(objects[1].scaleY, 1);
    assert.equal(objects[1].scaleX, ratio);
    assert.equal(objects[2].scaleY, 1);
    assert.equal(objects[3].scaleX, 1);
    assert.match(revised.artwork[side].svg, /data-weave-id="width-layer" transform="matrix\(1\.2 0 0 1 60 60\)"/);
    assert.match(revised.artwork[side].svg, /data-weave-id="outline-layer" transform="matrix\(1\.2 0 0 1 125 60\)"/);
    assert.match(revised.artwork[side].svg, /data-weave-id="handle-layer" transform="matrix\(1 0 0 1 80 80\)"/);
  }
  const withHandle = applyQuoteChange(revised, quoteKeyForPart('handle'), 3);
  for (const side of ['Fronte', 'Retro']) {
    assert.equal(withHandle.artwork[side].json.objects[2].scaleY, 1.5);
    assert.match(withHandle.artwork[side].svg, /data-weave-id="handle-layer" transform="matrix\(1 0 0 1\.5 80 80\)"/);
  }
  assert.equal(snapshot.measurements[0].value, 50);
  assert.equal(snapshot.artwork.Fronte.json.objects[0].scaleX, 1);
  assert.equal(revised.measurements[0].value, 60);
  assert.equal(validVectorScene(revised.artwork.Fronte), true);
  const resizedAgain = applyQuoteChange(revised, quoteKeyForMeasurement(0), 55);
  assert.ok(Math.abs(resizedAgain.artwork.Fronte.json.objects[0].scaleX - 1.1) < 1e-12);
  assert.match(resizedAgain.artwork.Fronte.svg, /transform="matrix\(1\.1 0 0 1 60 60\)"/);
});
test('a measurement binding must reference a tagged stable layer and a supported quote', () => {
  const value = scene();
  value.json.objects[0].measurementBinding = { quoteKey: 'measurements:0', axis: 'x' };
  assert.equal(validVectorScene(value), false);
  value.svg = '<svg><g data-weave-id="path-1" transform="matrix(1 0 0 1 0 0)"/></svg>';
  assert.equal(validVectorScene(value), true);
  value.json.objects[0].measurementBinding.quoteKey = 'measurements:999';
  assert.equal(validVectorScene(value), false);
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
    value => { value.json.objects[0].path = [['A', 5, 4, 0, 2, 0, 30, 40]]; },
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
