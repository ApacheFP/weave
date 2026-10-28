import { additionalFabrics, productSpec } from './productData.js';

export function technicalDefaults(data) {
  const spec = productSpec(data), fabric = additionalFabrics.find(item => item.id === data.fabricId);
  const palette = data.creative?.concept?.palette || [];
  const colors = (fabric ? [{ name: data.variant, color: fabric.tone }, ...palette.filter(color => color.name !== data.variant)] : palette).map((color, i) => ({ ...color, code: `C-${101 + i}`, material: fabric?.code || 'Da collegare nel modulo 3' }));
  return { requirements: spec.requirements, constraints: data.category === 'knit' ? 'Finezza 7; misure dopo stabilizzazione; filato principale include i bordi.' : `Cuciture a vista; tolleranza base ±${spec.tolerance} cm.`, fit: spec.fit, tolerance: spec.tolerance, notes: [], versions: [], currentId: null, approvedId: null, colors };
}
export function previewColors(snapshot, activeStyleId, variants) {
  const colors = snapshot.colors.map(color => ({ ...color, key: `color:${color.code}` }));
  for (const variant of variants) {
    if (variant.styleId === activeStyleId || colors.some(color => color.name.trim().toLocaleLowerCase() === variant.variant.trim().toLocaleLowerCase())) continue;
    const ownColor = variant.technical?.colors?.find(color => color.name === variant.variant);
    const fabric = additionalFabrics.find(item => item.id === variant.fabricId);
    const tone = ownColor?.color || fabric?.tone;
    if (tone) colors.push({ key: `variant:${variant.styleId}`, name: variant.variant, color: tone, code: variant.styleId });
  }
  return colors;
}
export function versionSnapshot(data, technical) {
  return { category: data.category || 'knit', baseSize: productSpec(data).baseSize, measurements: structuredClone(data.measurements), parts: { ...productSpec(data).parts, seam: data.seam }, fit: technical.fit, tolerance: technical.tolerance, colors: structuredClone(technical.colors), requirements: technical.requirements, constraints: technical.constraints, notes: structuredClone(technical.notes) };
}
export function restoreTechnicalVersion(product, sourceId, id, date) {
  const technical = product.technical, source = technical?.versions.find(version => version.id === sourceId);
  if (!source) throw new Error('La versione selezionata non è più disponibile.');
  const snapshot = structuredClone(source.snapshot);
  if (!validColors(snapshot.colors)) throw new Error('Questa versione non ha varianti valide e non può essere approvata.');
  const restored = { id, number: technical.versions.length + 1, note: `Ripristino da v${source.number}`, date, snapshot };
  return {
    technical: { ...technical, versions: [...technical.versions, restored], currentId: id, approvedId: id, colors: structuredClone(snapshot.colors), fit: snapshot.fit, tolerance: snapshot.tolerance, requirements: snapshot.requirements, constraints: snapshot.constraints, notes: structuredClone(snapshot.notes) },
    measurements: structuredClone(snapshot.measurements), seam: snapshot.parts.seam, variant: snapshot.colors[0].name, techGenerated: true,
  };
}
export const revisionPrompts = productSpec({}).revisionPrompts;
// shortcut: revision intents are prepared demo actions; free-form AI comes with the backend.
export function reviseTechnical(snapshot, prompt) {
  const next = structuredClone(snapshot), text = prompt.toLowerCase();
  const amount = Number((text.match(/\d+(?:[.,]\d+)?/) || ['1'])[0].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 20) return null;
  if (text.includes('tasca') && Object.hasOwn(next.parts, 'pocket')) next.parts.pocket = amount;
  else {
    const targets = snapshot.category === 'bag' ? [/larghezza/, /altezza/, /profondit/, /manico/] : snapshot.category === 'trousers' ? [/lunghezza|capo/, /vita/, /bacino/, /interno/] : [/capo|lunghezza/, /spall/, /torace/, /manica/];
    const index = /interno/.test(text) && snapshot.category === 'trousers' ? 3 : targets.findIndex(pattern => pattern.test(text));
    if (index < 0 || !/accorcia|allunga|allarga|riduci|aumenta/.test(text)) return null;
    next.measurements[index].value += /accorcia|riduci/.test(text) ? -amount : amount;
    if (next.measurements[index].value < 1 || next.measurements[index].value > 250) return null;
  }
  return next;
}
export function validColors(colors) {
  return colors.length > 0 && colors.every(c => c.name.trim() && c.code.trim()) && new Set(colors.map(c => c.code.trim().toUpperCase())).size === colors.length;
}
