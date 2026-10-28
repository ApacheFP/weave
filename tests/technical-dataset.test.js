import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDataset } from '../src/technical/dataset.js';
const row = { id: 'a', garmentId: 'g', authorId: 'a', source: 'expert', split: 'train', input: 'photo.png', program: 'drawing.json', rights: true };
test('dataset validation prevents split leakage, missing rights and synthetic gold labels', () => {
  assert.equal(validateDataset([row]).counts.train, 1);
  assert.throws(() => validateDataset([row, { ...row, id: 'b', split: 'gold', authorId: 'other' }]), /capo/);
  assert.throws(() => validateDataset([row, { ...row, id: 'b', garmentId: 'other', input: 'other.png', split: 'gold' }]), /autore/);
  assert.throws(() => validateDataset([{ ...row, rights: false }]), /Diritti/);
  assert.throws(() => validateDataset([{ ...row, source: 'synthetic', split: 'gold' }]), /esperte/);
});
