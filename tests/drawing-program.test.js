import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderProgram, validProgram } from '../src/technical/drawingProgram.js';
import { createDemoWorkspace } from '../src/dashboard/demoDefaults.js';
import { assertWorkspace } from '../src/dashboard/workspaceSchema.js';
import { quantizeProgram, reviewProgram } from '../src/technical/programReview.js';

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

test('repeats shapes evenly along a polyline and rejects a zero-length segment', () => {
  const program = { version: 1, garment: 'Esempio', parts: [{ name: 'Bottoni', description: '', operations: [{ type: 'repeatPath', count: 3, points: [[0, 0], [0, 10], [10, 10]], operations: [{ type: 'ellipse', cx: 0, cy: 0, rx: 2, ry: 2 }] }] }] };
  const svg = renderProgram(program);
  assert.match(svg, /translate\(0 0\)/);
  assert.match(svg, /translate\(0 10\)/);
  assert.match(svg, /translate\(10 10\)/);
  assert.equal(reviewProgram(program).svgElements, 3);
  program.parts[0].operations[0].points[1] = [0, 0];
  assert.throws(() => renderProgram(program), /punti distinti/);
});

test('quantization preserves scale factors, validates results and reports straight-line crossings', () => {
  const program = { version: 1, garment: 'Test', parts: [{ name: 'Corpo', description: '', operations: [{ type: 'scale', x: 1.2, y: 0.8, operations: [{ type: 'path', commands: [['M', 1, 1], ['L', 11, 11], ['L', 1, 11], ['L', 11, 1], ['Z']] }] }] }] };
  assert.match(reviewProgram(program).warnings[0], /autointersezione/);
  const quantized = quantizeProgram(program);
  assert.equal(quantized.parts[0].operations[0].x, 1.2);
  assert.deepEqual(quantized.parts[0].operations[0].operations[0].commands[0], ['M', 2, 2]);
  assert.deepEqual(program.parts[0].operations[0].operations[0].commands[0], ['M', 1, 1]);
  assert.throws(() => quantizeProgram(program, 0));
});

test('rectangular clipping survives generator and extractor round trip', async () => {
  const { JSDOM } = await import('jsdom');
  const { extractSvg } = await import('../src/technical/extractSvg.js');
  const oldParser = globalThis.DOMParser; globalThis.DOMParser = new JSDOM('').window.DOMParser;
  try {
    const program = { version: 1, garment: 'Test', parts: [{ name: 'Tasca', description: '', operations: [{ type: 'clipRect', x: 0, y: 0, width: 80, height: 60, operations: [{ type: 'rect', x: -10, y: 10, width: 100, height: 20 }] }] }] };
    const svg = renderProgram(program), redrawn = renderProgram(extractSvg(svg));
    assert.match(redrawn, /clip-path="url\(#weave-clip-1\)"/);
    assert.match(redrawn, /data-weave-clip="0 0 80 60"/);
    assert.throws(() => extractSvg(svg.replace('url(#weave-clip-1)', 'url(https://example.com/x)')), /Ritaglio/);
  } finally { globalThis.DOMParser = oldParser; }
});
