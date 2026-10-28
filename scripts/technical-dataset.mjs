import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { validateDataset } from '../src/technical/dataset.js';
import { validProgram } from '../src/technical/drawingProgram.js';

const manifestPath = process.argv[2];
if (!manifestPath) { console.error('Uso: npm run technical:dataset -- percorso/dataset.json'); process.exitCode = 1; }
else {
  try {
    const path = resolve(manifestPath);
    const records = JSON.parse(await readFile(path, 'utf8'));
    const summary = validateDataset(records);
    for (const row of records) {
      const input = await readFile(resolve(dirname(path), row.input));
      if (!input.length) throw Error(`Input vuoto: ${row.id}.`);
      const program = JSON.parse(await readFile(resolve(dirname(path), row.program), 'utf8'));
      if (!validProgram(program)) throw Error(`Programma non valido: ${row.id}.`);
    }
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
