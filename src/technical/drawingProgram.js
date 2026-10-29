// Programs are data, never markup. Limits keep previews and saved documents bounded.
const styles = {
  contour: { stroke: '#242424', width: 1.5, dash: '' },
  seam: { stroke: '#343434', width: 1, dash: '' },
  stitch: { stroke: '#464646', width: 0.5, dash: '6 5' },
  detail: { stroke: '#343434', width: 0.25, dash: '' },
};
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const finite = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 10000;
const pair = point => Array.isArray(point) && point.length === 2 && point.every(finite);
const number = value => Number(value.toFixed(4));
const pathCommands = { M: 2, L: 2, C: 6, Q: 4, Z: 0 };
const validPath = commands => Array.isArray(commands) && commands.length > 1 && commands.length <= 200 && commands[0]?.[0] === 'M' && commands.every(command => Array.isArray(command) && Object.hasOwn(pathCommands, command[0]) && command.length === pathCommands[command[0]] + 1 && command.slice(1).every(finite));
const validPoints = points => Array.isArray(points) && points.length >= 2 && points.length <= 200 && points.every(pair);
function styleAttrs(op, closed = false) {
  const style = styles[op.style || 'contour'];
  if (!style) throw Error('Tipo di linea non riconosciuto.');
  if (op.fill != null && !['none', 'white', 'gray'].includes(op.fill)) throw Error('Riempimento non valido.');
  if (op.fill && op.fill !== 'none' && !closed) throw Error('Un riempimento richiede un percorso chiuso.');
  return `fill="${op.fill || 'none'}" stroke="${style.stroke}" stroke-width="${style.width}" stroke-linecap="round" stroke-linejoin="round"${style.dash ? ` stroke-dasharray="${style.dash}"` : ''}`;
}
function parallel(points, distance) {
  return points.map(([x, y], index) => {
    const prev = points[Math.max(0, index - 1)], next = points[Math.min(points.length - 1, index + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1], length = Math.hypot(dx, dy);
    if (!length) throw Error('L’offset richiede punti distinti.');
    return [number(x - dy / length * distance), number(y + dx / length * distance)];
  });
}
function wave(points, amplitude, wavelength) {
  const result = [points[0]]; let distance = 0;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i - 1], dx = points[i][0] - x, dy = points[i][1] - y, len = Math.hypot(dx, dy);
    if (!len) throw Error('L’onda richiede punti distinti.');
    const steps = Math.ceil(len / Math.max(wavelength / 8, 1));
    if (result.length + steps > 2000) throw Error('Onda troppo dettagliata.');
    for (let j = 1; j <= steps; j++) {
      const t = j / steps, shift = amplitude * Math.sin(2 * Math.PI * (distance + len * t) / wavelength);
      result.push([number(x + dx * t - dy / len * shift), number(y + dy * t + dx / len * shift)]);
    }
    distance += len;
  }
  return result;
}
const pointsAttr = points => points.map(point => point.map(number).join(',')).join(' ');
function draw(op, state, depth = 0) {
  if (!op || typeof op !== 'object' || Array.isArray(op) || depth > 8 || ++state.count > 1000) throw Error('Operazione non valida o programma troppo complesso.');
  const children = () => {
    if (!Array.isArray(op.operations) || !op.operations.length || op.operations.length > 200) throw Error('Gruppo vuoto o non valido.');
    return op.operations.map(child => draw(child, state, depth + 1)).join('');
  };
  switch (op.type) {
    case 'path': {
      if (!validPath(op.commands)) throw Error('Percorso non valido.');
      const closed = op.commands.at(-1)[0] === 'Z';
      return `<path ${styleAttrs(op, closed)} d="${op.commands.map(command => command.join(' ')).join(' ')}"/>`;
    }
    case 'polyline':
      if (!validPoints(op.points)) throw Error('Polilinea non valida.');
      return `<polyline ${styleAttrs(op)} points="${pointsAttr(op.points)}"/>`;
    case 'ellipse':
      if (![op.cx, op.cy, op.rx, op.ry].every(finite) || op.rx <= 0 || op.ry <= 0) throw Error('Ellisse non valida.');
      return `<ellipse ${styleAttrs(op, true)} cx="${op.cx}" cy="${op.cy}" rx="${op.rx}" ry="${op.ry}"/>`;
    case 'rect':
      if (![op.x, op.y, op.width, op.height].every(finite) || op.width <= 0 || op.height <= 0) throw Error('Rettangolo non valido.');
      return `<rect ${styleAttrs(op, true)} x="${op.x}" y="${op.y}" width="${op.width}" height="${op.height}"/>`;
    case 'group': return `<g>${children()}</g>`;
    case 'align': {
      if (![op.fromX, op.fromY, op.toX, op.toY].every(finite)) throw Error('Allineamento non valido.');
      return `<g transform="translate(${number(op.toX - op.fromX)} ${number(op.toY - op.fromY)})">${children()}</g>`;
    }
    case 'clipRect': {
      if (![op.x, op.y, op.width, op.height].every(finite) || op.width <= 0 || op.height <= 0) throw Error('Ritaglio non valido.');
      const id = `weave-clip-${++state.clips}`, content = children();
      return `<g data-weave-clip="${op.x} ${op.y} ${op.width} ${op.height}"><clipPath id="${id}"><rect x="${op.x}" y="${op.y}" width="${op.width}" height="${op.height}"/></clipPath><g clip-path="url(#${id})">${content}</g></g>`;
    }
    case 'mirror':
      if (!finite(op.axis)) throw Error('Asse di simmetria non valido.');
      return `<g transform="translate(${2 * op.axis} 0) scale(-1 1)">${children()}</g>`;
    case 'translate':
      if (![op.x, op.y].every(finite)) throw Error('Traslazione non valida.');
      return `<g transform="translate(${op.x} ${op.y})">${children()}</g>`;
    case 'rotate':
      if (![op.angle, op.cx, op.cy].every(finite)) throw Error('Rotazione non valida.');
      return `<g transform="rotate(${op.angle} ${op.cx} ${op.cy})">${children()}</g>`;
    case 'scale':
      if (![op.x, op.y].every(finite) || !op.x || !op.y || Math.abs(op.x) > 100 || Math.abs(op.y) > 100) throw Error('Scala non valida.');
      return `<g transform="scale(${op.x} ${op.y})">${children()}</g>`;
    case 'repeat': {
      if (!Number.isInteger(op.count) || op.count < 1 || op.count > 100 || ![op.dx, op.dy].every(finite)) throw Error('Ripetizione non valida.');
      const content = children();
      if (content.length * op.count > 1000000) throw Error('Ripetizione troppo complessa.');
      state.expanded += op.count;
      if (state.expanded > 2000) throw Error('Troppe ripetizioni.');
      return Array.from({ length: op.count }, (_, i) => `<g transform="translate(${number(i * op.dx)} ${number(i * op.dy)})">${content}</g>`).join('');
    }
    case 'repeatPath': {
      if (!validPoints(op.points) || !Number.isInteger(op.count) || op.count < 1 || op.count > 100) throw Error('Ripetizione lungo percorso non valida.');
      const lengths = op.points.slice(1).map((point, index) => Math.hypot(point[0] - op.points[index][0], point[1] - op.points[index][1]));
      const total = lengths.reduce((sum, length) => sum + length, 0);
      if (!total || lengths.some(length => !length)) throw Error('Il percorso di ripetizione richiede punti distinti.');
      const content = children();
      if (content.length * op.count > 1000000 || (state.expanded += op.count) > 2000) throw Error('Ripetizione troppo complessa.');
      return Array.from({ length: op.count }, (_, i) => {
        let distance = op.count === 1 ? 0 : total * i / (op.count - 1), index = 0;
        while (index < lengths.length - 1 && distance > lengths[index]) { distance -= lengths[index]; index++; }
        const start = op.points[index], end = op.points[index + 1], fraction = distance / lengths[index];
        return `<g transform="translate(${number(start[0] + (end[0] - start[0]) * fraction)} ${number(start[1] + (end[1] - start[1]) * fraction)})">${content}</g>`;
      }).join('');
    }
    case 'offset':
      if (!validPoints(op.points) || !finite(op.distance)) throw Error('Offset non valido.');
      return `<polyline ${styleAttrs(op)} points="${pointsAttr(parallel(op.points, op.distance))}"/>`;
    case 'wave':
      if (!validPoints(op.points) || !finite(op.amplitude) || !finite(op.wavelength) || op.wavelength <= 0) throw Error('Onda non valida.');
      return `<polyline ${styleAttrs(op)} points="${pointsAttr(wave(op.points, op.amplitude, op.wavelength))}"/>`;
    default: throw Error(`Operazione non riconosciuta: ${String(op.type).slice(0, 50)}.`);
  }
}
export function renderProgram(program) {
  if (!program || program.version !== 1 || typeof program.garment !== 'string' || !program.garment.trim() || program.garment.length > 100 || !Array.isArray(program.parts) || !program.parts.length || program.parts.length > 100) throw Error('Programma non valido: servono versione, tipo di capo e parti.');
  const state = { count: 0, expanded: 0, clips: 0 };
  const groups = program.parts.map(part => {
    if (!part || typeof part.name !== 'string' || !part.name.trim() || part.name.length > 100 || typeof part.description !== 'string' || part.description.length > 500 || !Array.isArray(part.operations) || !part.operations.length || part.operations.length > 200) throw Error('Parte non valida.');
    return `<g data-label="${escape(part.name)}">${part.operations.map(op => draw(op, state)).join('')}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-600 0 1200 1000" role="img" aria-label="${escape(program.garment)}">${groups.join('')}</svg>`;
}
export function validProgram(program) { try { renderProgram(program); return JSON.stringify(program).length <= 200000; } catch { return false; } }
