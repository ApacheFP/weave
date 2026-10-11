import { writeFileSync } from 'node:fs';
import { categorySpecs } from '../src/dashboard/productData.js';

// Original schematic documents: illustrative demo geometry, not production CAD.
const outlines = {
  trousers: {
    front: 'M68 20L133 15Q149 42 149 80L170 105Q158 114 143 112L130 282H55L61 118Q48 87 58 53Z',
    back: 'M58 24L131 13Q153 45 151 85L183 107Q167 122 149 117L136 282H50L54 127Q32 89 44 56Z',
    waistband: 'M22 125Q100 110 178 125L176 149Q100 137 24 149Z',
    pocket: 'M60 64H145L153 168Q104 205 48 167Z',
    fly: 'M75 68H122V224Q100 243 75 227Z',
  },
  bag: {
    front: 'M26 60H174L160 245H40Z', base: 'M28 111H172V178H28Z', zipper: 'M20 125H180V147H20Z',
    handle: 'M86 20H114V280H86Z', pocket: 'M52 92H148V208H52Z',
  },
  knit: {
    front: 'M73 25Q100 58 127 25L156 35Q156 78 178 94V270H22V94Q44 78 44 35Z',
    back: 'M73 25Q100 34 127 25L156 35Q156 78 178 94V270H22V94Q44 78 44 35Z',
    sleeve: 'M47 70Q100 -6 153 70L133 279H67Z', neckband: 'M20 130H180V151H20Z',
  },
};
const svg = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>${title}</title><defs><marker id="arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8" fill="#70695e"/></marker></defs><rect width="${w}" height="${h}" fill="#f8f5ee"/><g stroke="#59554c" fill="none" stroke-width="1.3" stroke-linejoin="round">${body}</g></svg>`;
function piece(category, key, grade = 0) {
  const path = outlines[category][key];
  const inset = category === 'knit' ? '' : `<path d="${path}" transform="translate(5 7) scale(.95)" stroke-dasharray="4 3" stroke-width=".9"/>`;
  const detail = category === 'trousers' && ['front', 'back'].includes(key) ? '<path d="M108 25l-7 45 14-2-7-43M98 98V269" stroke-dasharray="3 3"/>' : category === 'knit' && ['front', 'back', 'sleeve'].includes(key) ? '<path d="M36 253h128" stroke-dasharray="2 3"/>' : '';
  return `<g transform="translate(${-grade * 2} ${-grade * 1.5}) scale(${1 + grade * .022} ${1 + grade * .006})"><path d="${path}"/>${grade ? '' : inset + detail + '<path d="M100 107V210" marker-start="url(#arrow)" marker-end="url(#arrow)" stroke-width=".8"/>'}</g>`;
}
const out = (key, value) => writeFileSync(new URL(`../public/images/dashboard/${key}.svg`, import.meta.url), value + '\n');
for (const category of ['trousers', 'bag', 'knit']) {
  const spec = categorySpecs[category];
  for (const [name, key] of spec.pieces) out(`${spec.prefix}-pattern-${key}`, svg(320, 400, `<g transform="translate(60 45)">${piece(category, key)}</g>`, `${spec.label} / ${name} / modello demo`));
  const board = spec.pieces.map(([, key], i) => `<g transform="translate(${38 + i * 208} 35)">${piece(category, key)}</g>`).join('');
  out(`${spec.prefix}-pattern`, svg(spec.pieces.length * 208 + 70, 360, board, `${spec.label} / pannelli del modello base`));
  if (category !== 'bag') {
    const groups = [spec.pieces[0][1], spec.pieces[category === 'knit' ? 2 : 1][1]];
    const graded = groups.map((key, i) => `<g transform="translate(${90 + i * 320} 70)">${spec.sizes.map((_, n) => `<g opacity="${.45 + n * .09}">${piece(category, key, n - spec.sizes.indexOf(spec.baseSize))}</g>`).join('')}</g>`).join('');
    out(`${spec.prefix}-grading`, svg(740, 410, graded, `${spec.label} / sviluppo ${spec.sizes.join(' ')} / tavola dimostrativa`));
  }
  if (category !== 'knit') for (const optimized of [false, true]) {
    // Non-overlapping, horizontal warp: each normalized piece occupies its own cell.
    const cols = 5, cellW = optimized ? 150 : 180, cellH = 112, scale = .41;
    const placement = Array.from({ length: 10 }, (_, i) => {
      const key = spec.pieces[i % spec.pieces.length][1], x = 20 + i % cols * cellW, y = 20 + Math.floor(i / cols) * cellH;
      return `<g transform="translate(${x} ${y + 90}) rotate(-90) scale(${scale})">${piece(category, key)}</g>`;
    }).join('');
    out(`${spec.prefix}-marker-${optimized ? 'optimized' : 'base'}`, svg(1020, 264, '<path d="M10 10H1010V254H10Z" stroke="#b5a78e"/>' + placement, `${spec.label} / piazzamento ${optimized ? 'ottimizzato' : 'base'} / schema demo`));
  }
}
console.log('23 documenti vettoriali della capsule creati');
