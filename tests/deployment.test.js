import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

test('Vercel gives fresh SPA documents and does not rewrite missing chunks to HTML', () => {
  const rewrite = new RegExp(`^${config.rewrites[0].source}$`);
  assert.equal(rewrite.test('/atelier/disegno-tecnico'), true);
  assert.equal(rewrite.test('/assets/VectorEditor-old.js'), false);

  const documentCache = config.headers.find(rule => rule.headers.some(header => header.key === 'Cache-Control' && header.value === 'no-cache'));
  const assetCache = config.headers.find(rule => rule.source === '/assets/(.*)');
  assert.ok(documentCache);
  assert.equal(new RegExp(`^${documentCache.source}$`).test('/atelier/disegno-tecnico'), true);
  assert.equal(new RegExp(`^${documentCache.source}$`).test('/assets/VectorEditor-old.js'), false);
  assert.ok(assetCache.headers.some(header => header.key === 'Cache-Control' && header.value.includes('immutable')));
});
