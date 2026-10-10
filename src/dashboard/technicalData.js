export function technicalDefaults(data) {
  return { requirements: 'Giacca monopetto, vestibilità regular, tre bottoni e due tasche con pattina.', constraints: 'Cuciture a vista; tolleranza base ±1 cm.', fit: 'Regular', tolerance: 1, notes: [], versions: [], currentId: null, approvedId: null, colors: (data.creative?.concept?.palette || []).map((color, i) => ({ ...color, code: `C-${101 + i}`, material: 'Da collegare nel modulo 3' })) };
}
export function versionSnapshot(data, technical) {
  return { measurements: structuredClone(data.measurements), parts: { collar: 8, pocket: 14, seam: data.seam }, fit: technical.fit, tolerance: technical.tolerance, colors: structuredClone(technical.colors), requirements: technical.requirements, constraints: technical.constraints, notes: structuredClone(technical.notes) };
}
export const revisionPrompts = ['Accorcia la manica di 1 cm', 'Allunga il capo di 2 cm', 'Allarga le spalle di 1 cm', 'Porta la tasca a 16 cm'];
// shortcut: these four revision intents are prepared demo actions; free-form AI comes with the backend.
export function reviseTechnical(snapshot, prompt) {
  const next = structuredClone(snapshot);
  const text = prompt.toLowerCase();
  const amount = Number((text.match(/\d+(?:[.,]\d+)?/) || ['1'])[0].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 20) return null;
  if (text.includes('tasca')) next.parts.pocket = amount;
  else {
    const index = text.includes('manica') ? 3 : text.includes('spall') ? 1 : text.includes('capo') || text.includes('lunghezza') ? 0 : -1;
    if (index < 0 || !/accorcia|allunga|allarga|riduci|aumenta/.test(text)) return null;
    next.measurements[index].value += /accorcia|riduci/.test(text) ? -amount : amount;
    if (next.measurements[index].value < 1 || next.measurements[index].value > 250) return null;
  }
  return next;
}

export function validColors(colors) {
  return colors.length > 0 && colors.every(c => c.name.trim() && c.code.trim()) && new Set(colors.map(c => c.code.trim().toUpperCase())).size === colors.length;
}
