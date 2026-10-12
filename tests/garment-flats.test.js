import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../src/dashboard/garment-flats');
const expected = ['bag', 'knit', 'trousers'];

test('technical flats cover only the current demo garments as editable SVG paths', () => {
  assert.deepEqual(readdirSync(root).filter(name => name.endsWith('.svg')).sort(), expected.flatMap(category => ['back', 'details', 'front'].map(view => `${category}-${view}.svg`)).sort());
  for (const category of expected) for (const view of ['front', 'back', 'details']) {
    const svg = readFileSync(join(root, `${category}-${view}.svg`), 'utf8');
    assert.match(svg, /<svg\b[^>]*viewBox="0 0 [1-9]\d* [1-9]\d*"/);
    assert.match(svg, /<path\b/);
    assert.match(svg, /data-label="Sagoma tessuto"/);
    assert.doesNotMatch(svg, /<image\b|data:image\//i);
  }
});
