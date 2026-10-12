import test from 'node:test';
import assert from 'node:assert/strict';
import { demoDefaults } from '../src/dashboard/demoDefaults.js';
import { newDemoProducts } from '../src/dashboard/productData.js';
import { profileActor, seedWorkspaceData } from '../src/dashboard/workspaceData.js';
import { normalizeWorkspaceIdentity, sameActor } from '../src/dashboard/workspaceIdentity.js';

function legacyWorkspace() {
  const items = newDemoProducts(demoDefaults);
  return { activeId: items[0].styleId, ...seedWorkspaceData(items, demoDefaults.profile, new Date('2026-10-12T10:00:00Z')) };
}

test('new actor snapshots retain the account ID when profile email and name change', () => {
  const profile = { ...demoDefaults.profile, id: 'owner-account' };
  const assigned = profileActor(profile);
  const edited = { ...profile, firstName: 'Arianna', lastName: 'Verdi', email: 'arianna@example.test' };
  const newSnapshot = profileActor(edited);
  assert.equal(newSnapshot.id, assigned.id);
  assert.equal(newSnapshot.name, 'Arianna Verdi');
  assert.equal(newSnapshot.email, edited.email);
  assert.ok(sameActor(assigned, edited));
  assert.ok(sameActor(newSnapshot, profile));
});

test('demo migration assigns deterministic IDs without changing catalog codes or source data', () => {
  const legacy = legacyWorkspace();
  const normalized = normalizeWorkspaceIdentity(legacy);
  assert.deepEqual(normalized, normalizeWorkspaceIdentity(legacyWorkspace()));
  assert.deepEqual(normalizeWorkspaceIdentity(normalized), normalized);
  assert.equal(legacy.id, undefined);
  assert.equal(legacy.items[0].id, undefined);
  const ids = [normalized.id, ...normalized.items.flatMap(item => [item.id, item.modelId, item.profile.id])];
  for (const id of ids) assert.match(id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(new Set(normalized.items.map(item => item.id)).size, normalized.items.length);
  assert.deepEqual(normalized.items.map(item => [item.styleId, item.productId]), legacy.items.map(item => [item.styleId, item.productId]));
  const variants = normalized.items.filter(item => item.productId === 'MG-0425');
  assert.equal(new Set(variants.map(item => item.modelId)).size, 1);
  assert.equal(new Set(normalized.items.map(item => item.modelId)).size, 3);
});

test('account, variant and model IDs survive owner name, email and catalog code edits', () => {
  const original = normalizeWorkspaceIdentity(legacyWorkspace());
  const edited = structuredClone(original);
  edited.items[0].styleId = 'MG-NEW';
  edited.items[0].productId = 'MODEL-NEW';
  edited.activeId = edited.items[0].styleId;
  for (const item of edited.items) item.profile = { ...item.profile, firstName: 'Arianna', lastName: 'Verdi', email: 'arianna@example.test' };
  const next = normalizeWorkspaceIdentity(edited);
  assert.equal(next.id, original.id);
  assert.deepEqual(next.items.map(item => [item.id, item.modelId, item.profile.id]), original.items.map(item => [item.id, item.modelId, item.profile.id]));
  assert.ok(next.tasks.every(task => sameActor(task.assignee, next.items[0].profile)));
  const ownReply = next.inbox.find(item => item.id === 'inbox-pattern-review').replies[0];
  assert.ok(sameActor(ownReply.actor, next.items[0].profile));
  for (const item of edited.items) item.profile.email = 'marta@atelier.demo';
  const duplicateEmail = normalizeWorkspaceIdentity(edited);
  assert.ok(duplicateEmail.tasks.every(task => sameActor(task.assignee, duplicateEmail.items[0].profile)));
  assert.equal(sameActor(duplicateEmail.inbox.find(item => item.actor.email === 'marta@atelier.demo').actor, duplicateEmail.items[0].profile), false);
});

test('all actor locations share stable user identities and foreign users remain distinct', () => {
  const original = normalizeWorkspaceIdentity(legacyWorkspace());
  const profile = original.items[0].profile;
  const actors = [
    ...original.items.flatMap(item => item.events.map(event => event.actor)),
    ...original.tasks.map(task => task.assignee),
    ...original.inbox.flatMap(item => [item.actor, ...item.replies.map(reply => reply.actor)]),
  ];
  const byEmail = new Map();
  for (const actor of actors) {
    assert.ok(actor.id);
    if (byEmail.has(actor.email)) assert.equal(actor.id, byEmail.get(actor.email));
    byEmail.set(actor.email, actor.id);
    assert.equal(sameActor(actor, profile), actor.email === profile.email);
  }
  assert.equal(new Set(byEmail.values()).size, byEmail.size);
  const legacy = legacyWorkspace();
  for (const item of legacy.items) item.profile.email = 'updated@example.test';
  const migratedAfterEdit = normalizeWorkspaceIdentity(legacy);
  assert.equal(migratedAfterEdit.items[0].profile.id, profile.id);
  assert.ok(migratedAfterEdit.tasks.every(task => sameActor(task.assignee, migratedAfterEdit.items[0].profile)));
});

test('actor comparison uses IDs first and email only for legacy references', () => {
  const profile = { id: 'owner-id', email: 'new@example.test' };
  assert.ok(sameActor({ id: profile.id, email: 'old@example.test' }, profile));
  assert.equal(sameActor({ id: 'other-id', email: profile.email }, profile), false);
  assert.ok(sameActor({ email: ' NEW@EXAMPLE.TEST ' }, profile));
  assert.equal(sameActor({}, {}), false);
  assert.equal(sameActor(null, profile), false);
  const legacy = legacyWorkspace();
  legacy.id = 'saved-workspace';
  legacy.items[0].id = 'saved-variant';
  legacy.items[0].modelId = 'saved-model';
  legacy.items[0].profile.id = 'saved-owner';
  legacy.inbox[0].actor = { ...legacy.inbox[0].actor, id: 'saved-colleague' };
  const migrated = normalizeWorkspaceIdentity(legacy);
  assert.equal(migrated.id, 'saved-workspace');
  assert.equal(migrated.items[0].id, 'saved-variant');
  assert.equal(migrated.items[0].modelId, 'saved-model');
  assert.equal(migrated.items[0].profile.id, 'saved-owner');
  assert.equal(migrated.inbox[0].actor.id, 'saved-colleague');
  assert.ok(migrated.inbox.filter(item => item.actor.email === migrated.inbox[0].actor.email).every(item => item.actor.id === 'saved-colleague'));
  assert.ok(migrated.items.filter(item => item.productId === 'MG-0425').every(item => item.modelId === 'saved-model'));
});
