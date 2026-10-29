export type Point = { x: number; y: number };

export function linePath(points: Point[]) {
  return points.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ');
}

export function areaPath(points: Point[], height: number, offset = 0) {
  if (!points.length) return '';
  return `${linePath(points)} L${points.at(-1)!.x} ${height} L${points[0].x} ${height} Z`;
}

export function fittedDash(length: number, dash = 4, gap = 4) {
  const periods = Math.max(1, Math.round(length / (dash + gap)));
  const size = length / periods;
  return { strokeDasharray: `${Math.max(1, size * dash / (dash + gap))} ${Math.max(1, size * gap / (dash + gap))}`, strokeDashoffset: 0 };
}

export function niceTicks(min: number, max: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 25, 50, 75, 100];
  if (max < min) [min, max] = [max, min];
  const rough = (max - min) / 4 || Math.max(1, Math.abs(max) / 4);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].find(value => value * magnitude >= rough)! * magnitude;
  let low = Math.floor(min / step) * step;
  let high = Math.ceil(max / step) * step;
  if (low === high) { low -= step; high += step; }
  const ticks: number[] = [];
  for (let value = low, guard = 0; value <= high + step / 2 && guard < 20; value += step, guard++) ticks.push(Number(value.toPrecision(12)));
  return ticks;
}

export function valueAt(points: Point[], x: number) {
  if (!points.length) return 0;
  if (points.length === 1 || x <= points[0].x) return points[0].y;
  for (let index = 1; index < points.length; index++) {
    if (x <= points[index].x) {
      const before = points[index - 1], after = points[index];
      const ratio = (x - before.x) / (after.x - before.x || 1);
      return before.y + (after.y - before.y) * ratio;
    }
  }
  return points.at(-1)!.y;
}

function lengthAtX(points: Point[], x: number) {
  if (points.length < 2) return 0;
  let length = 0;
  for (let index = 1; index < points.length; index++) {
    const before = points[index - 1], after = points[index];
    const segment = Math.hypot(after.x - before.x, after.y - before.y);
    if (x >= after.x) length += segment;
    else if (x > before.x) return length + segment * (x - before.x) / (after.x - before.x || 1);
    else break;
  }
  return length;
}

export function reachAt(points: Point[], x: number) {
  const length = points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
  return length ? lengthAtX(points, x) / length : 0;
}

export function xAtLength(points: Point[], progress: number) {
  if (!points.length) return 0;
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let remaining = Math.max(0, Math.min(1, progress)) * total;
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index]) return points[index].x + (points[index + 1].x - points[index].x) * remaining / (lengths[index] || 1);
    remaining -= lengths[index];
  }
  return points.at(-1)!.x;
}

function sample(points: Point[], t: number) {
  if (points.length < 2) return points[0]?.y ?? 0;
  const at = Math.max(0, Math.min(1, t)) * (points.length - 1);
  const index = Math.floor(at);
  const next = points[Math.min(index + 1, points.length - 1)];
  return points[index].y + (next.y - points[index].y) * (at - index);
}

export function alignPolylines(before: Point[], after: Point[]) {
  const count = Math.max(2, before.length, after.length);
  const left = Math.min(before[0].x, after[0].x), right = Math.max(before.at(-1)!.x, after.at(-1)!.x);
  return {
    xs: Array.from({ length: count }, (_, index) => left + (right - left) * index / (count - 1)),
    from: Array.from({ length: count }, (_, index) => sample(before, index / (count - 1))),
    to: Array.from({ length: count }, (_, index) => sample(after, index / (count - 1))),
  };
}
