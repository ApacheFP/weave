import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDemoProposal, renameDemoPart, summarizeDemoProposal } from '../src/technical/demoPipeline.js';
import { renderProgram } from '../src/technical/drawingProgram.js';

const example = JSON.parse(readFileSync(new URL('../examples/technical/camicia-programma.json', import.meta.url), 'utf8'));

test('demo proposal can be reviewed and renamed without changing the original example', () => {
  const proposal = createDemoProposal(example);
  const changed = renameDemoPart(proposal, 0, 'Corpo davanti');
  assert.equal(changed.parts[0].name, 'Corpo davanti');
  assert.equal(proposal.parts[0].name, example.parts[0].name);
  assert.match(renderProgram(changed), /data-label="Corpo davanti"/);
  const metrics = summarizeDemoProposal(changed);
  assert.equal(metrics.parts, 4);
  assert.ok(metrics.operations > 0 && metrics.elements > 0);
  assert.throws(() => renameDemoPart(proposal, 0, '   '), /nome/);
  assert.throws(() => renameDemoPart(proposal, 10, 'Collo'), /nome/);
});
