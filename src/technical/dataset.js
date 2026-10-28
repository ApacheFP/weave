// Dataset contracts are checked before data is used for training or evaluation.
export function validateDataset(records) {
  if (!Array.isArray(records) || !records.length) throw Error('Il dataset deve contenere almeno un esempio.');
  const ids = new Set(), garmentSplits = new Map(), inputGroups = new Map(), authorSplits = new Map();
  const splits = new Set(['development', 'train', 'validation', 'gold']);
  const sources = new Set(['expert', 'teacher', 'synthetic']);
  for (const row of records) {
    if (!row || typeof row !== 'object' || ['id', 'garmentId', 'authorId', 'input', 'program'].some(key => typeof row[key] !== 'string' || !row[key].trim()) || !sources.has(row.source) || !splits.has(row.split)) throw Error('Ogni esempio richiede ID, capo, autore, file, fonte e suddivisione validi.');
    if (ids.has(row.id)) throw Error(`ID duplicato: ${row.id}.`);
    ids.add(row.id);
    if (row.rights !== true) throw Error(`Diritti d’uso non confermati: ${row.id}.`);
    if (row.split === 'gold' && row.source !== 'expert') throw Error(`L’insieme d’oro richiede etichette esperte: ${row.id}.`);
    if (garmentSplits.has(row.garmentId) && garmentSplits.get(row.garmentId) !== row.split) throw Error(`Lo stesso capo compare in più suddivisioni: ${row.garmentId}.`);
    garmentSplits.set(row.garmentId, row.split);
    if (inputGroups.has(row.input) && inputGroups.get(row.input) !== row.garmentId) throw Error(`Lo stesso input appartiene a capi diversi: ${row.input}.`);
    inputGroups.set(row.input, row.garmentId);
    if (!authorSplits.has(row.authorId)) authorSplits.set(row.authorId, new Set());
    authorSplits.get(row.authorId).add(row.split);
  }
  for (const [author, sets] of authorSplits) if (sets.has('gold') && sets.size > 1) throw Error(`L’autore dell’insieme d’oro compare anche altrove: ${author}.`);
  return { total: records.length, counts: Object.fromEntries([...splits].map(split => [split, records.filter(row => row.split === split).length])) };
}
