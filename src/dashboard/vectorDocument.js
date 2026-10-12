export const vectorViews = ['Fronte', 'Retro', 'Dettagli'];
export const artboardSize = { width: 1600, height: 1200 };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const vectorTypes = new Set(['rect', 'circle', 'ellipse', 'line', 'path', 'polyline', 'polygon', 'text', 'i-text', 'itext', 'textbox', 'group']);
function safeValues(value, depth = 0) {
  if (depth > 20) return false;
  if (value == null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value) && Math.abs(value) <= 1e6;
  if (typeof value === 'string') return value.length <= 10000;
  if (Array.isArray(value)) return value.length <= 20000 && value.every(child => safeValues(child, depth + 1));
  return object(value) && Object.entries(value).every(([key, child]) => !['__proto__', 'prototype', 'constructor', 'src', 'href'].includes(key) && safeValues(child, depth + 1));
}
function vectorObject(value, budget) {
  if (++budget.count > 500) return false;
  if (!object(value) || typeof value.type !== 'string' || !vectorTypes.has(value.type.toLowerCase()) || !safeValues(value) || !['fill', 'stroke'].every(key => value[key] == null || typeof value[key] === 'string' && !/url\(/i.test(value[key]))) return false;
  const pathArity = { M: 3, L: 3, T: 3, H: 2, V: 2, C: 7, S: 5, Q: 5, A: 8, Z: 1 };
  if (value.type.toLowerCase() === 'path' && (!Array.isArray(value.path) || !value.path.every(command => {
    const arity = typeof command?.[0] === 'string' ? pathArity[command[0].toUpperCase()] : undefined;
    return arity && command.length === arity && command.slice(1).every(coordinate => typeof coordinate === 'number' && Number.isFinite(coordinate)) && (command[0].toUpperCase() !== 'A' || [command[4], command[5]].every(flag => flag === 0 || flag === 1));
  }))) return false;
  return (!value.objects || Array.isArray(value.objects) && value.objects.length <= 500 && value.objects.every(child => vectorObject(child, budget))) && (!value.clipPath || vectorObject(value.clipPath, budget));
}
export function validVectorScene(scene) {
  const budget = { count: 0 };
  if (!object(scene) || scene.schemaVersion !== 1 || scene.width !== artboardSize.width || scene.height !== artboardSize.height || !object(scene.json) || !Object.keys(scene.json).every(key => ['version', 'objects', 'background'].includes(key)) || scene.json.background != null && (typeof scene.json.background !== 'string' || !/^(#[a-f\d]{3,8}|white|transparent)?$/i.test(scene.json.background)) || !Array.isArray(scene.json.objects) || scene.json.objects.length > 500 || !scene.json.objects.every(child => vectorObject(child, budget))) return false;
  if (typeof scene.svg !== 'string' || !/<svg\b/i.test(scene.svg) || scene.svg.length > 2e6 || /<\s*(script|foreignObject|image|use|a)\b|\bon\w+\s*=|\bhref\s*=/i.test(scene.svg)) return false;
  try { return JSON.stringify(scene.json).length <= 2e6; } catch { return false; }
}
export function validArtwork(artwork) {
  return artwork == null || object(artwork) && Object.keys(artwork).every(view => vectorViews.includes(view) && validVectorScene(artwork[view]));
}
export function withArtwork(snapshot, view, scene) {
  if (!vectorViews.includes(view) || !validVectorScene(scene)) throw new Error('La tavola contiene dati non validi o supera il limite di 500 elementi / 2 MB.');
  const next = structuredClone(snapshot);
  next.artwork = { ...next.artwork, [view]: structuredClone(scene) };
  return next;
}

// Resolve theme variables before SVG import/export, so documents are self-contained.
export function drawingSvg(source) {
  const clone = source.cloneNode(true);
  const elements = [source, ...source.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  elements.forEach((element, index) => {
    for (const attribute of ['fill', 'stroke']) {
      if (element.hasAttribute(attribute)) copies[index].setAttribute(attribute, getComputedStyle(element)[attribute]);
    }
    copies[index].removeAttribute('tabindex');
    copies[index].removeAttribute('role');
  });
  return new XMLSerializer().serializeToString(clone);
}
