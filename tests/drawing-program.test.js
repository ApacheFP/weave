import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderProgram, validProgram } from '../src/technical/drawingProgram.js';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { assertWorkspace } from '../src/dashboard/workspaceSchema.js';

const shirt = JSON.parse(readFileSync(new URL('../examples/technical/camicia-programma.json', import.meta.url), 'utf8'));
test('the synthetic shirt renders deterministically with named parts and six buttons', () => {
  const result = renderProgram(shirt);
  assert.equal(result, renderProgram(shirt));
  assert.match(result, /data-label="Colletto"/);
  assert.equal((result.match(/<ellipse/g) || []).length, 6);
  assert.match(result, /scale\(-1 1\)/);
  assert.equal(validProgram(shirt), true);
});
test('rejects invalid coordinates, operations and potentially unsafe markup', () => {
  const bad = structuredClone(shirt);
  bad.parts[0].operations[0].commands[0][1] = Infinity;
  assert.equal(validProgram(bad), false);
  bad.parts[0].operations[0] = { type: 'path', commands: [['M', 0, 0], ['L', 1, 1]], fill: 'url(javascript:alert(1))' };
  assert.equal(validProgram(bad), false);
  bad.parts[0].operations[0] = { type: 'script' };
  assert.equal(validProgram(bad), false);
  const escaped = structuredClone(shirt); escaped.parts[0].name = '"/><script>';
  assert.doesNotMatch(renderProgram(escaped), /<script>/);
});
test('valid programs persist in revisions and invalid programs fail workspace validation', () => {
  const workspace = createDemoWorkspace();
  workspace.items[0].technical.versions[0].snapshot.programs = { Fronte: structuredClone(shirt) };
  assert.equal(assertWorkspace(workspace), workspace);
  workspace.items[0].technical.versions[0].snapshot.programs.Fronte.parts[0].operations[0].type = 'unsafe';
  assert.throws(() => assertWorkspace(workspace));
});

test('normalized SVG can be extracted and rendered again with its named parts', async () => {
  const { JSDOM } = await import('jsdom');
  const { extractSvg } = await import('../src/technical/extractSvg.js');
  const oldParser = globalThis.DOMParser;
  globalThis.DOMParser = new JSDOM('').window.DOMParser;
  try {
    const svg = renderProgram(shirt);
    const extracted = extractSvg(svg.replaceAll('fill="white"', 'fill="rgb(255, 255, 255)"'));
    assert.deepEqual(extracted.parts.map(part => part.name), shirt.parts.map(part => part.name));
    const redrawn = renderProgram(extracted);
    assert.equal((redrawn.match(/<ellipse/g) || []).length, 6);
    assert.throws(() => extractSvg('<svg viewBox="0 0 20 20"/>'), /normalizzato/);
    assert.throws(() => extractSvg(svg.replace('<path ', '<script/>\n<path ')), /non supportato/);
  } finally { globalThis.DOMParser = oldParser; }
});
