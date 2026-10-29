import { renderProgram } from './drawingProgram.js';

function intersects(a, b, c, d) {
  const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
}

// Checks straight segments only; Bézier intersections require geometric analysis.
export function reviewProgram(program) {
  const svg = renderProgram(program), warnings = [], counts = {};
  function visit(op, part) {
    counts[op.type] = (counts[op.type] || 0) + 1;
    if (op.type === 'path') {
      const commands = op.commands;
      if (commands.at(-1)[0] !== 'Z' && op.fill && op.fill !== 'none') warnings.push(`${part}: percorso riempito non chiuso.`);
      if (commands.every(command => ['M', 'L', 'Z'].includes(command[0])) && commands.at(-1)[0] === 'Z') {
        const points = commands.filter(command => command[0] !== 'Z').map(command => command.slice(1));
        const segments = points.map((point, i) => [point, points[(i + 1) % points.length]]);
        if (segments.some(([a, b], i) => segments.some(([c, d], j) => j > i + 1 && !(i === 0 && j === segments.length - 1) && intersects(a, b, c, d)))) warnings.push(`${part}: possibile autointersezione in un percorso rettilineo.`);
      }
    }
    if (op.operations) op.operations.forEach(child => visit(child, part));
  }
  program.parts.forEach(part => part.operations.forEach(op => visit(op, part.name)));
  return { parts: program.parts.length, operations: Object.values(counts).reduce((sum, count) => sum + count, 0), counts, svgElements: (svg.match(/<(?:path|polyline|rect|ellipse)\b/g) || []).length, characters: JSON.stringify(program).length, warnings };
}

const coordinateKeys = new Set(['x', 'y', 'cx', 'cy', 'rx', 'ry', 'width', 'height', 'axis', 'dx', 'dy', 'fromX', 'fromY', 'toX', 'toY', 'distance', 'amplitude', 'wavelength']);
export function quantizeProgram(program, step = 2) {
  if (!Number.isFinite(step) || step <= 0) throw Error('Passo di quantizzazione non valido.');
  const round = value => Math.round(value / step) * step || 0;
  function convert(op) {
    const next = { ...op };
    for (const key of coordinateKeys) if (!(op.type === 'scale' && (key === 'x' || key === 'y')) && typeof next[key] === 'number') next[key] = round(next[key]);
    if (op.points) next.points = op.points.map(point => point.map(round));
    if (op.commands) next.commands = op.commands.map(([command, ...values]) => [command, ...values.map(round)]);
    if (op.operations) next.operations = op.operations.map(convert);
    return next;
  }
  const next = { ...program, parts: program.parts.map(part => ({ ...part, operations: part.operations.map(convert) })) };
  renderProgram(next);
  return next;
}
