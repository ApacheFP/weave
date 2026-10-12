import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionDefaults } from '../src/dashboard/creativeData.js';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { profileActor } from '../src/dashboard/workspaceData.js';
import { collectionFor, productSections, saveCollectionDirection, saveProductSection, updateProfile } from '../src/dashboard/workspaceCommands.js';

test('each editor rejects identity, account and stock mutations outside its responsibility', () => {
  const before = createDemoWorkspace(), product = before.items[0], snapshot = structuredClone(before);
  for (const section of Object.keys(productSections)) {
    for (const patch of [{ id: 'replaced' }, { modelId: 'replaced' }, { styleId: 'MG-0500' }, { profile: { ...product.profile, email: 'other@example.com' } }, { retailSold: product.retailSold + 1 }]) {
      assert.throws(() => saveProductSection(before, product.id, section, patch), { code: 'INVALID_SECTION' }, `${section}: ${Object.keys(patch)[0]}`);
      assert.throws(() => saveProductSection(before, product.id, section, () => patch), { code: 'INVALID_SECTION' });
    }
  }
  assert.throws(() => saveProductSection(before, product.id, 'saveMaterials', { technical: product.technical }), { code: 'INVALID_SECTION' });
  assert.throws(() => saveProductSection(before, product.id, 'unknown', { seam: .7 }), { code: 'INVALID_SECTION' });
  assert.deepEqual(before, snapshot);
});

test('technical editor accepts its measurement update and reopens fitting without changing product identity', () => {
  const before = createDemoWorkspace(), product = before.items[0];
  product.sampleApproved = true;
  product.sampleChecks = [true, true, true];
  product.phaseReviews = { 3: true, 4: true, 5: true };
  const measurements = structuredClone(product.measurements);
  measurements[0].value += 1;
  const next = saveProductSection(before, product.id, 'saveTechnical', { measurements, seam: .8, variant: 'Avorio', techGenerated: true }, 'Disegno tecnico approvato');
  const changed = next.items.find(item => item.id === product.id);
  assert.equal(changed.id, product.id);
  assert.equal(changed.modelId, product.modelId);
  assert.equal(changed.styleId, product.styleId);
  assert.equal(changed.profile.id, product.profile.id);
  assert.equal(changed.sampleApproved, false);
  assert.deepEqual(changed.sampleChecks, [false, false, false]);
  assert.equal(changed.phaseReviews[3], true);
  assert.equal(changed.phaseReviews[4], false);
  assert.equal(changed.phaseReviews[5], false);
  assert.equal(next.items[1], before.items[1]);
  assert.equal(product.sampleApproved, true);
  assert.equal(product.measurements[0].value, 62);
  assert.equal(changed.events[0].actor.id, product.profile.id);
  assert.equal(next.inbox[0].actor.id, product.profile.id);
});

test('profile edits preserve the owner ID and update own assignments and replies despite email overlap', () => {
  const before = createDemoWorkspace(), original = before.items[0].profile, owner = profileActor(original);
  const collaboratorMessage = before.inbox.find(item => item.actor.email === 'marta@atelier.demo');
  const collaborator = collaboratorMessage.actor;
  before.inbox.unshift({ id: 'owner-message', styleId: before.activeId, actor: owner, replies: [{ id: 'owner-reply', actor: owner, body: 'Una nota' }] });
  before.tasks.push({ ...before.tasks[0], id: 'collaborator-task', assignee: collaborator });
  let current = updateProfile(before, { firstName: 'Nuovo', lastName: 'Profilo', email: collaborator.email, id: 'attempted-replacement' });
  assert.equal(current.items[0].profile.id, original.id);
  assert.equal(current.inbox[0].actor.id, original.id);
  assert.equal(current.inbox[0].actor.name, 'Nuovo Profilo');
  assert.equal(current.inbox[0].replies[0].actor.email, collaborator.email);
  assert.equal(current.tasks[0].assignee.id, original.id);
  assert.equal(current.tasks[0].assignee.name, 'Nuovo Profilo');
  assert.equal(current.tasks.find(item => item.id === 'collaborator-task').assignee, collaborator);
  assert.equal(current.inbox.find(item => item.id === collaboratorMessage.id).actor, collaborator);
  current = updateProfile(current, { firstName: 'Alex', lastName: 'Aggiornato', email: 'new-owner@example.com' });
  assert.equal(current.inbox[0].actor.id, original.id);
  assert.equal(current.inbox[0].actor.email, 'new-owner@example.com');
  assert.equal(current.inbox[0].replies[0].actor.email, 'new-owner@example.com');
  assert.equal(current.tasks.find(item => item.id === 'collaborator-task').assignee.email, 'marta@atelier.demo');
  assert.equal(current.inbox.find(item => item.id === collaboratorMessage.id).actor.name, 'Marta Bianchi');
  assert.ok(current.items.every(item => item.profile.id === original.id && item.profile.email === 'new-owner@example.com'));
  assert.equal(original.email, 'demo@weave.it');
});

test('profile validation rejects invalid names and email without replacing the workspace', () => {
  const before = createDemoWorkspace(), original = before.items[0].profile;
  for (const patch of [{ firstName: ' ' }, { lastName: ' ' }, { email: 'invalid' }, { email: 'a b@example.com' }, { avatar: 12 }]) {
    assert.throws(() => updateProfile(before, { ...original, ...patch }), { code: 'INVALID_PROFILE' });
  }
  assert.equal(before.items[0].profile, original);
});

test('removing an avatar preserves explicit null while omitted avatar retains the current image', () => {
  const before = createDemoWorkspace(), original = before.items[0].profile;
  const input = { firstName: original.firstName, lastName: original.lastName, email: original.email };
  assert.equal(updateProfile(before, input).items[0].profile.avatar, original.avatar);
  const removed = updateProfile(before, { ...input, avatar: null });
  assert.equal(removed.items[0].profile.avatar, null);
  assert.equal(removed.items[0].profile.id, original.id);
  assert.equal(before.items[0].profile.avatar, original.avatar);
});

test('collection names matching inherited object properties remain isolated own entries', () => {
  const before = createDemoWorkspace(), product = before.items[0], defaults = collectionDefaults();
  product.collection = '__proto__';
  assert.deepEqual(collectionFor(before, '__proto__'), defaults);
  assert.deepEqual(collectionFor(before, 'constructor'), defaults);
  const palette = [{ name: 'Avorio', color: '#efeae1' }];
  const next = saveCollectionDirection(before, product.id, { palette, directionRevision: 1 });
  assert.equal(Object.hasOwn(next.collections, '__proto__'), true);
  assert.equal(Object.getPrototypeOf(next.collections), Object.prototype);
  assert.equal(Object.hasOwn(before.collections, '__proto__'), false);
  assert.deepEqual(collectionFor(next, '__proto__').palette, palette);
  assert.deepEqual(collectionFor(next, 'constructor'), defaults);
  assert.equal(Object.prototype.palette, undefined);
  assert.throws(() => saveCollectionDirection(next, product.id, { profile: product.profile }), { code: 'INVALID_COLLECTION' });
});

test('pattern revisions retain their own history as well as reopening the approved fitting', () => {
  const before = createDemoWorkspace(), product = before.items[0];
  product.sampleApproved = true;
  product.sampleChecks = [true, true, true];
  const modelHistory = [{ version: '1.1', note: 'Revisione margini e annotazioni' }];
  const next = saveProductSection(before, product.id, 'savePattern', { seam: .8, modelVersion: '1.1', modelHistory });
  assert.deepEqual(next.items[0].modelHistory, modelHistory);
  assert.equal(next.items[0].modelVersion, '1.1');
  assert.equal(next.items[0].sampleApproved, false);
});
