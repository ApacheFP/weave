import test from 'node:test';
import assert from 'node:assert/strict';
import { csvContents } from '../src/dashboard/exportFiles.js';

test('CSV exports escape delimiters, quotes and spreadsheet formulas including leading whitespace', () => {
  assert.equal(csvContents([['a;b', '"quoted"', 'two\nlines']]), '\uFEFF"a;b";"""quoted""";"two\nlines"');
  for (const value of ['=1+1', '+SUM(A1:A2)', '-1+1', '@SUM(A1:A2)', '  =1+1', '\t=1+1', '\r@SUM(A1:A2)']) {
    assert.equal(csvContents([[value]]), `\uFEFF"'${value}"`);
  }
  assert.equal(csvContents([['MG-0425', 25, 'normal'], ['Next row']]), '\uFEFF"MG-0425";"25";"normal"\r\n"Next row"');
});
