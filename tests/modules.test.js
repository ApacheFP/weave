import test from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '../src/modules.js';
import { icons } from '../src/icons.js';

test('all 22 textile stages have ordered IDs, copy and distinct monochrome artwork', () => {
  assert.equal(modules.length, 22);
  assert.equal(new Set(modules.map(module => module.icon)).size, 22);
  modules.forEach((module, index) => {
    assert.equal(module.id, index + 1);
    assert.equal(module.lines.length, 2);
    assert.equal(module.copy.length, 2);
    assert.ok(module.title && module.category && module.copy.every(Boolean));
    assert.ok(icons[module.icon], `Missing artwork for ${module.title}`);
    assert.doesNotMatch(icons[module.icon], /#[0-9a-f]{6}(?![0-9a-f])/i);
  });
});
