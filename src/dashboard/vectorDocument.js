export const vectorViews = ['Fronte', 'Retro', 'Dettagli'];
export const artboardSize = { width: 1600, height: 1200 };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const vectorTypes = new Set(['rect', 'circle', 'ellipse', 'line', 'path', 'polyline', 'polygon', 'text', 'i-text', 'itext', 'textbox', 'group']);
function parseQuoteKey(key) {
  if (typeof key !== 'string') return null;
  const measurement = key.match(/^measurements:(\d+)$/);
  if (measurement && Number(measurement[1]) < 4) return { kind: 'measurement', index: Number(measurement[1]) };
  const part = key.match(/^parts:([a-z][a-z\d_-]{0,63})$/i);
  return part && !['prototype', 'constructor'].includes(part[1].toLowerCase()) ? { kind: 'part', key: part[1] } : null;
}
function validMeasurementBinding(binding) {
  return object(binding) && Object.keys(binding).every(key => ['quoteKey', 'axis'].includes(key)) && parseQuoteKey(binding.quoteKey) && ['x', 'y'].includes(binding.axis);
}
function escapeXmlAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
function scaleVectorObject(item, axis, ratio) {
  const oldX = Number.isFinite(item.scaleX) ? item.scaleX : 1;
  const oldY = Number.isFinite(item.scaleY) ? item.scaleY : 1;
  const nextX = axis === 'x' ? oldX * ratio : oldX;
  const nextY = axis === 'y' ? oldY * ratio : oldY;
  const originFactor = value => value === 'left' || value === 'top' ? 0 : value === 'right' || value === 'bottom' ? 1 : .5;
  const angle = (Number(item.angle) || 0) * Math.PI / 180;
  const centerOffset = (xScale, yScale) => ({
    x: (.5 - originFactor(item.originX)) * (item.width || 0) * xScale,
    y: (.5 - originFactor(item.originY)) * (item.height || 0) * yScale,
  });
  const oldOffset = centerOffset(oldX, oldY), nextOffset = centerOffset(nextX, nextY);
  const rotate = offset => ({ x: offset.x * Math.cos(angle) - offset.y * Math.sin(angle), y: offset.x * Math.sin(angle) + offset.y * Math.cos(angle) });
  const oldWorld = rotate(oldOffset), nextWorld = rotate(nextOffset);
  const center = { x: (item.left || 0) + oldWorld.x, y: (item.top || 0) + oldWorld.y };
  item.scaleX = nextX;
  item.scaleY = nextY;
  item.left = center.x - nextWorld.x;
  item.top = center.y - nextWorld.y;
}
function scaleSvgLayers(svg, targets) {
  const byMarker = new Map(targets.map(target => [`data-weave-id="${escapeXmlAttribute(target.id)}"`, target]));
  const found = new Set();
  const scaled = svg.replace(/<g\b[^>]*>/g, tag => {
    const marker = tag.match(/\bdata-weave-id="[^"]*"/)?.[0];
    const target = byMarker.get(marker);
    if (!target) return tag;
    found.add(target.id);
    return scaleSvgGroupTag(tag, target.axis, target.ratio);
  });
  if (found.size !== targets.length) throw new Error('Il livello collegato non è identificabile nella tavola. Apri l’editor e salva di nuovo il livello.');
  return scaled;
}
function scaleSvgGroupTag(tag, axis, ratio) {
  const transform = tag.match(/\btransform="matrix\(([^\"]+)\)"/);
  if (!transform) throw new Error('La trasformazione del livello collegato non è valida. Apri l’editor e salva di nuovo il livello.');
  const matrix = transform[1].trim().split(/[\s,]+/).map(Number);
  if (matrix.length !== 6 || !matrix.every(Number.isFinite)) throw new Error('La trasformazione del livello collegato non è valida.');
  const indices = axis === 'x' ? [0, 1] : [2, 3];
  // SVG matrices store the local X and Y axes in separate column pairs.
  indices.forEach(index => { matrix[index] *= ratio; });
  const format = value => String(Number(value.toFixed(6)));
  return tag.replace(transform[0], `transform="matrix(${matrix.map(format).join(' ')})"`);
}
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
  if (value.measurementBinding != null && !validMeasurementBinding(value.measurementBinding)) return false;
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
  const boundIds = [], objectIds = [];
  const collectBindings = items => items.forEach(item => {
    if (typeof item.id === 'string') objectIds.push(item.id);
    if (item.measurementBinding) boundIds.push(item.id);
    if (item.objects) collectBindings(item.objects);
  });
  collectBindings(scene.json.objects);
  const svgIds = new Set([...scene.svg.matchAll(/\bdata-weave-id="([^"]*)"/g)].map(match => match[1]));
  if ((boundIds.length && new Set(objectIds).size !== objectIds.length) || boundIds.some(id => typeof id !== 'string' || !svgIds.has(escapeXmlAttribute(id)))) return false;
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

export function quoteKeyForMeasurement(index) { return `measurements:${index}`; }
export function quoteKeyForPart(key) { return `parts:${key}`; }
export function quoteValue(snapshot, quoteKey) {
  const quote = parseQuoteKey(quoteKey);
  if (!quote) return undefined;
  const value = quote.kind === 'measurement' ? snapshot.measurements?.[quote.index]?.value : snapshot.parts?.[quote.key];
  return Number.isFinite(value) && value > 0 ? value : undefined;
}
export function applyQuoteChange(snapshot, quoteKey, value) {
  const quote = parseQuoteKey(quoteKey), previousValue = quoteValue(snapshot, quoteKey);
  if (!quote || !Number.isFinite(value) || value <= 0 || previousValue === undefined) throw new Error('La quota selezionata non è valida.');
  const next = structuredClone(snapshot), ratio = value / previousValue;
  if (quote.kind === 'measurement') next.measurements[quote.index].value = value;
  else next.parts[quote.key] = value;
  if (ratio !== 1) {
    for (const scene of Object.values(next.artwork || {})) {
      const targets = [];
      const collectTargets = items => items.forEach(item => {
        if (item.measurementBinding?.quoteKey === quoteKey) targets.push(item);
        if (item.objects) collectTargets(item.objects);
      });
      collectTargets(scene.json.objects);
      for (const target of targets) {
        if (typeof target.id !== 'string') throw new Error('Il livello collegato non ha un identificativo stabile. Apri l’editor e salvalo di nuovo.');
        scaleVectorObject(target, target.measurementBinding.axis, ratio);
      }
      scene.svg = scaleSvgLayers(scene.svg, targets.map(target => ({ id: target.id, axis: target.measurementBinding.axis, ratio })));
      if (!validVectorScene(scene)) throw new Error('La modifica della quota ha prodotto una tavola non valida.');
    }
  }
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
