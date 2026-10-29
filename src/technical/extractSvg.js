import { renderProgram } from './drawingProgram.js';

// This extractor intentionally accepts only the normalized SVG emitted by this generator.
// Illustrator import requires a separate parser and round-trip validation against real files.
export function extractSvg(source) {
  if (typeof source !== 'string' || source.length > 1000000 || /<!DOCTYPE|<!ENTITY/i.test(source)) throw Error('SVG non valido o troppo grande.');
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (document.querySelector('parsererror')) throw Error('SVG non leggibile.');
  const root = document.documentElement;
  if (root.localName !== 'svg' || root.getAttribute('viewBox') !== '-600 0 1200 1000') throw Error('Usa un SVG normalizzato esportato dal generatore WEAVE.');
  const read = (element, name) => {
    const value = element.getAttribute(name);
    if (value == null || value.trim() === '' || !Number.isFinite(Number(value))) throw Error(`Attributo ${name} non valido.`);
    return Number(value);
  };
  const style = element => {
    const rawFill = element.getAttribute('fill');
    const fill = /^rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)$/i.test(rawFill || '') ? 'white' : /^rgb\(\s*128\s*,\s*128\s*,\s*128\s*\)$/i.test(rawFill || '') ? 'gray' : rawFill;
    return { style: element.hasAttribute('stroke-dasharray') ? 'stitch' : Number.parseFloat(element.getAttribute('stroke-width')) >= 1.4 ? 'contour' : Number.parseFloat(element.getAttribute('stroke-width')) >= 0.9 ? 'seam' : 'detail', ...(fill && fill !== 'none' ? { fill } : {}) };
  };
  function transform(value, operations) {
    const pieces = [...value.matchAll(/(translate|scale|rotate)\(([^)]*)\)/g)];
    if (!pieces.length || pieces.map(match => match[0]).join(' ').replace(/\s/g, '') !== value.replace(/\s/g, '')) throw Error('Trasformazione SVG non supportata.');
    for (const part of pieces.reverse()) {
      const values = part[2].trim().split(/[\s,]+/).map(Number);
      if (!values.every(Number.isFinite)) throw Error('Trasformazione SVG non valida.');
      if (part[1] === 'translate' && values.length === 2) operations = [{ type: 'translate', x: values[0], y: values[1], operations }];
      else if (part[1] === 'scale' && values.length === 2) operations = [{ type: 'scale', x: values[0], y: values[1], operations }];
      else if (part[1] === 'rotate' && values.length === 3) operations = [{ type: 'rotate', angle: values[0], cx: values[1], cy: values[2], operations }];
      else throw Error('Trasformazione SVG non supportata.');
    }
    return operations;
  }
  function parsePath(value) {
    const tokens = value.match(/[MLCQZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) || [];
    if (tokens.join('').toLowerCase() !== value.replace(/[\s,]/g, '').toLowerCase()) throw Error('Il tracciato usa comandi SVG non supportati.');
    const sizes = { M: 2, L: 2, C: 6, Q: 4, Z: 0 }, result = [];
    for (let i = 0; i < tokens.length;) {
      const command = tokens[i++], count = sizes[command];
      if (count == null || i + count > tokens.length) throw Error('Tracciato SVG non valido.');
      const values = tokens.slice(i, i + count).map(Number);
      if (!values.every(Number.isFinite)) throw Error('Coordinate SVG non valide.');
      result.push([command, ...values]); i += count;
    }
    return result;
  }
  let nodes = 0;
  function convert(element, depth = 0) {
    if (depth > 8 || ++nodes > 2000) throw Error('SVG troppo complesso.');
    const tag = element.localName;
    if ([...element.attributes].some(attr => /^on/i.test(attr.name) || /href/i.test(attr.name))) throw Error('Collegamenti e script non sono supportati.');
    if (element.hasAttribute('clip-path')) throw Error('Ritaglio SVG non supportato.');
    let operations;
    if (tag === 'g' && element.hasAttribute('data-weave-clip')) {
      const values = element.getAttribute('data-weave-clip').trim().split(/\s+/).map(Number);
      const [clip, content] = element.children;
      const rect = clip?.children[0], id = clip?.getAttribute('id');
      if (values.length !== 4 || !values.every(Number.isFinite) || values[2] <= 0 || values[3] <= 0 || element.children.length !== 2 || clip?.localName !== 'clipPath' || clip.children.length !== 1 || rect?.localName !== 'rect' || !/^weave-clip-\d+$/.test(id || '') || content?.localName !== 'g' || content.getAttribute('clip-path') !== `url(#${id})` || ['x', 'y', 'width', 'height'].some((name, i) => read(rect, name) !== values[i])) throw Error('Ritaglio SVG non supportato.');
      operations = [{ type: 'clipRect', x: values[0], y: values[1], width: values[2], height: values[3], operations: [...content.children].flatMap(child => convert(child, depth + 1)) }];
    }
    else if (tag === 'g') operations = [...element.children].flatMap(child => convert(child, depth + 1));
    else if (tag === 'path') operations = [{ type: 'path', ...style(element), commands: parsePath(element.getAttribute('d') || '') }];
    else if (tag === 'polyline') {
      const values = (element.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      if (values.length < 4 || values.length % 2 || !values.every(Number.isFinite)) throw Error('Polilinea SVG non valida.');
      operations = [{ type: 'polyline', ...style(element), points: Array.from({ length: values.length / 2 }, (_, index) => values.slice(index * 2, index * 2 + 2)) }];
    } else if (tag === 'ellipse') operations = [{ type: 'ellipse', ...style(element), cx: read(element, 'cx'), cy: read(element, 'cy'), rx: read(element, 'rx'), ry: read(element, 'ry') }];
    else if (tag === 'rect') operations = [{ type: 'rect', ...style(element), x: read(element, 'x'), y: read(element, 'y'), width: read(element, 'width'), height: read(element, 'height') }];
    else throw Error(`Elemento SVG non supportato: ${tag}.`);
    if (!operations.length) throw Error('Gruppo SVG vuoto.');
    return element.hasAttribute('transform') ? transform(element.getAttribute('transform'), operations) : operations;
  }
  const parts = [...root.children].filter(element => !(element.localName === 'rect' && element.getAttribute('x') === '-600' && element.getAttribute('y') === '0' && element.getAttribute('width') === '1200' && element.getAttribute('height') === '1000')).map((element, index) => ({ name: element.getAttribute('data-label') || `Parte ${index + 1}`, description: '', operations: convert(element) }));
  const program = { version: 1, garment: root.getAttribute('aria-label') || 'Capo', parts };
  renderProgram(program);
  return program;
}
