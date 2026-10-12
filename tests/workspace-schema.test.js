import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { additionalFabrics, groupProducts } from '../src/dashboard/productData.js';
import { selectStyle, updateProductMetadata } from '../src/dashboard/productActions.js';
import { versionSnapshot } from '../src/dashboard/technicalData.js';
import { updateProfile } from '../src/dashboard/workspaceCommands.js';
import { sameActor } from '../src/dashboard/workspaceIdentity.js';
import { assertWorkspace, readWorkspaceRecord, WorkspaceDataError, workspaceSchemaVersion } from '../src/dashboard/workspaceSchema.js';

const recordFor = workspace => ({ version: workspaceSchemaVersion, revision: 3, savedAt: '2026-10-12T12:00:00Z', workspace });
const context = () => {
  let index = 0;
  return { id: () => `contract-event-${++index}`, now: () => new Date('2026-10-12T12:00:00Z') };
};

test('the actual demo fixture satisfies the persisted workspace contract without mutation', () => {
  const workspace = createDemoWorkspace(), before = structuredClone(workspace);
  assert.equal(assertWorkspace(workspace), workspace);
  const record = recordFor(workspace);
  assert.deepEqual(readWorkspaceRecord(record), record);
  assert.deepEqual(workspace, before);
  assert.ok(workspace.id);
  assert.equal(new Set(workspace.items.map(item => item.id)).size, workspace.items.length);
  assert.equal(new Set(workspace.items.map(item => item.modelId)).size, 3);
  assert.ok(workspace.tasks.every(task => sameActor(task.assignee, workspace.items[0].profile)));
});

test('hydration rejects malformed material, stock and technical records without modifying the saved input', () => {
  const cases = [
    ['null trims', item => { item.trims = null; }],
    ['unknown fabric', item => { item.fabricId = 'removed-fabric'; }],
    ['fabric from another category', item => { item.fabricId = 'riva-wool'; }],
    ['production exceeds order', item => { item.produced = item.quantity + 1; }],
    ['reworks exceed production', item => { item.reworks = item.produced + 1; }],
    ['retail exceeds available stock', item => { item.retailSold = item.produced; }],
    ['wholesale overbooking', item => { item.wholesaleOrders[0].qty = item.quantity; }],
    ['null technical snapshot', item => { item.technical.versions = [{ id: 'version-1', number: 1, note: 'Prima scheda', snapshot: null }]; }],
    ['null technical revision', item => { item.technical.versions = [null]; }],
    ['unresolved approved version', item => { item.technical.approvedId = 'missing-version'; }],
  ];
  for (const [label, corrupt] of cases) {
    const record = recordFor(createDemoWorkspace());
    corrupt(record.workspace.items[0]);
    const before = structuredClone(record);
    assert.throws(() => readWorkspaceRecord(record), error => error instanceof WorkspaceDataError && error.code === 'invalid-data', label);
    assert.deepEqual(record, before, label);
  }
});

test('stable active product references must resolve to the selected catalog record', () => {
  const workspace = selectStyle(createDemoWorkspace(), 'MG-0425');
  assert.equal(assertWorkspace(workspace), workspace);
  for (const identity of ['missing-product', workspace.items[1].id]) {
    const corrupted = { ...workspace, activeProductId: identity }, before = structuredClone(corrupted);
    assert.throws(() => assertWorkspace(corrupted), WorkspaceDataError);
    assert.deepEqual(corrupted, before);
  }
});

test('real technical revision snapshots are valid and invalid nested measurements are rejected', () => {
  const workspace = createDemoWorkspace(), item = workspace.items[0];
  const revision = { id: 'technical-v1', number: 1, note: 'Prima scheda', snapshot: versionSnapshot(item, item.technical) };
  item.technical = { ...item.technical, versions: [revision], currentId: revision.id, approvedId: revision.id };
  assert.equal(assertWorkspace(workspace), workspace);
  revision.snapshot.measurements[0].value = -1;
  assert.throws(() => assertWorkspace(workspace), WorkspaceDataError);
});

test('unsupported schema versions and malformed revision envelopes remain untouched', () => {
  for (const version of [0, workspaceSchemaVersion + 1, String(workspaceSchemaVersion), null]) {
    const record = { ...recordFor(createDemoWorkspace()), version };
    const before = structuredClone(record);
    assert.throws(() => readWorkspaceRecord(record), { name: 'WorkspaceDataError', code: 'unsupported-version' });
    assert.deepEqual(record, before);
  }
  for (const change of [{ revision: -1 }, { revision: 1.5 }, { revision: '3' }, { savedAt: null }]) {
    const record = { ...recordFor(createDemoWorkspace()), ...change }, before = structuredClone(record);
    assert.throws(() => readWorkspaceRecord(record), { name: 'WorkspaceDataError', code: 'invalid-data' });
    assert.deepEqual(record, before);
  }
});

test('profile updates keep the persisted owner and foreign actor identities separate', () => {
  const workspace = createDemoWorkspace(), before = structuredClone(workspace);
  const owner = workspace.items[0].profile;
  const colleague = workspace.inbox.find(item => item.actor.email === 'marta@atelier.demo');
  const next = updateProfile(workspace, { firstName: 'Arianna', lastName: 'Verdi', email: colleague.actor.email });
  const profile = next.items[0].profile;
  assert.equal(assertWorkspace(next), next);
  assert.equal(profile.id, owner.id);
  assert.ok(next.items.every(item => item.profile.id === owner.id));
  assert.ok(next.tasks.every(task => sameActor(task.assignee, profile) && task.assignee.email === profile.email));
  const colleagueAfter = next.inbox.find(item => item.id === colleague.id).actor;
  assert.equal(colleagueAfter.id, colleague.actor.id);
  assert.equal(sameActor(colleagueAfter, profile), false);
  const reply = next.inbox.find(item => item.id === 'inbox-pattern-review').replies[0];
  assert.ok(sameActor(reply.actor, profile));
  assert.equal(reply.actor.name, 'Arianna Verdi');
  assert.deepEqual(workspace, before);
});

test('catalog code edits preserve model grouping, selected variants and persisted navigation', () => {
  const workspace = createDemoWorkspace(), before = structuredClone(workspace);
  const variant = workspace.items.find(item => item.variant === 'Salvia');
  const otherModel = workspace.items.find(item => item.category === 'trousers');
  const selected = selectStyle(selectStyle(workspace, variant.id), otherModel.id);
  const next = updateProductMetadata(selected, variant.id, { styleId: 'mg-0500', title: 'Maglia aggiornata' }, context());
  assert.equal(assertWorkspace(next), next);
  const models = groupProducts(next.items, next.activeId, next.selectedVariants, additionalFabrics);
  const model = models.find(item => item.modelId === variant.modelId);
  assert.equal(models.length, 3);
  assert.equal(model.variants.length, 3);
  assert.equal(model.id, variant.id);
  assert.equal(model.styleId, 'MG-0500');
  assert.equal(model.productId, variant.productId);
  assert.equal(next.selectedVariants[variant.modelId], 'MG-0500');
  assert.equal(next.activeId, otherModel.styleId);
  assert.equal(next.activeProductId, otherModel.id);
  assert.ok(next.tasks.filter(task => workspace.tasks.some(previous => previous.id === task.id && previous.styleId === variant.styleId)).every(task => task.styleId === 'MG-0500'));
  assert.deepEqual(workspace, before);
});


test('persisted preferences, avatars, dates and attachments cannot crash the shell', () => {
  for (const change of [
    workspace => { workspace.preferences.workspaceName = {}; },
    workspace => { workspace.preferences.theme = 'unknown'; },
    workspace => { workspace.preferences.pushAssignments = 'yes'; },
    workspace => { workspace.items[0].profile.avatar = {}; },
    workspace => { workspace.items[0].delivery = 'not-a-date'; },
    workspace => { workspace.items[0].start = '2027-04-31'; },
    workspace => { workspace.items[0].sketchFile = {}; },
  ]) {
    const workspace = createDemoWorkspace();
    change(workspace);
    assert.throws(() => assertWorkspace(workspace), WorkspaceDataError);
  }
});
