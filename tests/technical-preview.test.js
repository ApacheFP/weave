import test from 'node:test';
import assert from 'node:assert/strict';
import { previewColors } from '../src/dashboard/technicalData.js';

test('preview includes the drawing colors and the other variants of its model without duplicates', () => {
  const snapshot = { colors: [{ name: 'Avorio', code: 'C-1', color: '#eeeeee' }, { name: 'Salvia', code: 'C-2', color: '#aabbcc' }] };
  const variants = [
    { styleId: 'MG-1', variant: 'Avorio', fabricId: 'luce-yarn' },
    { styleId: 'MG-2', variant: 'Salvia', fabricId: 'luce-salvia-yarn' },
    { styleId: 'MG-3', variant: 'Grafite', fabricId: 'luce-grafite-yarn', technical: { colors: [{ name: 'Grafite', color: '#123456' }] } },
  ];
  const colors = previewColors(snapshot, 'MG-1', variants);
  assert.deepEqual(colors.map(color => color.name), ['Avorio', 'Salvia', 'Grafite']);
  assert.equal(colors[2].color, '#123456');
  assert.equal(colors[2].key, 'variant:MG-3');
  assert.equal(previewColors({ colors: [] }, 'MG-1', variants)[0].color, '#a3aea1');
});
