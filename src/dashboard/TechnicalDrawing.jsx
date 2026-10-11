import React from 'react';
import { productSpec } from './productData.js';

export default function TechnicalDrawing({ snapshot, view = 'Fronte', selected, onSelect, color = '#e9e4db', exportMode = false }) {
  const m = snapshot.measurements;
  const shoulder = m[1].value * 3.8, chest = m[2].value * 1.9, body = m[0].value * 4, sleeve = m[3].value * 3.8;
  const left = 300 - chest / 2, right = 300 + chest / 2, top = 100, hem = top + body;
  const height = Math.max(500, hem + 80, top + sleeve + 80);
  const minX = Math.min(-40, left - 140, 240 - shoulder / 2), width = Math.max(640, right + 140, 360 + shoulder / 2) - minX;
  const part = (key, label, children) => <g role={exportMode ? undefined : 'button'} tabIndex={exportMode ? undefined : 0} aria-label={exportMode ? undefined : `Seleziona ${label}`} onClick={() => onSelect?.(key)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(key); } }} stroke={selected === key ? 'var(--accent,#8e9af3)' : 'var(--text-2,#b5b2ab)'} strokeWidth={selected === key ? 3 : 1.5} style={{ cursor: exportMode ? undefined : 'pointer' }}>{children}</g>;
  const quote = (x1, y1, x2, y2, label, tx, ty) => <g stroke="var(--text-3,#9a968f)" strokeWidth="1" fill="none"><path d={`M${x1} ${y1} L${x2} ${y2}`} /><path d={`M${x1 - 4} ${y1 - 4}l8 8M${x2 - 4} ${y2 - 4}l8 8`} /><text x={tx} y={ty} fill="var(--text-2,#b5b2ab)" stroke="none" fontSize="12" textAnchor="middle">{label}</text></g>;
  if (snapshot.category && snapshot.category !== 'jacket') {
    const spec = productSpec(snapshot), back = view === 'Retro';
    const shell = children => <svg className="dw-technical-vector" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 650" aria-label={`${spec.label} · ${view}`}><title>{spec.label} · {view} · quote demo</title><rect width="600" height="650" fill="var(--surface-2,#faf8f3)" /><g fill={color} strokeLinejoin="round">{children}</g><text x="300" y="627" textAnchor="middle" fill="var(--text-3,#9a968f)" fontSize="11">{view} · base {snapshot.baseSize || spec.baseSize} · misure demo</text></svg>;
    if (view === 'Dettagli') return shell(<>
      {Object.entries(spec.partLabels).filter(([key]) => key !== 'seam').map(([key, label], i) => <React.Fragment key={key}>{part(key, label, <><rect x={80 + i * 265} y="150" width="175" height={key === 'handle' ? snapshot.parts[key] * 12 : key === 'pocket' || key === 'zipper' ? 130 : snapshot.parts[key] * 12} rx={key === 'pocket' ? 5 : 0} /><path d={`M${90 + i * 265} 158h155`} strokeDasharray="4 3" />{(key === 'rib' || key === 'neckband') && Array.from({ length: 22 }, (_, n) => <path key={n} d={`M${86 + i * 265 + n * 7} 153v${snapshot.parts[key] * 12 - 6}`} />)}</>)}{quote(80 + i * 265, 325, 255 + i * 265, 325, `${label} · ${snapshot.parts[key]} cm`, 167 + i * 265, 350)}</React.Fragment>)}
      {part('seam', spec.partLabels.seam, <><path d="M120 450h360M120 464h360" fill="none" /><path d="M120 457h360" strokeDasharray="4 3" /><text x="300" y="505" textAnchor="middle" stroke="none" fill="var(--text-2,#68665e)" fontSize="14">{spec.partLabels.seam} · {snapshot.parts.seam} cm</text></>)}
    </>);
    if (snapshot.category === 'trousers') {
      const waist = m[1].value * 2, hip = m[2].value * 2, length = m[0].value * 4, y = 80, bottom = y + length, l = 300 - hip / 2, r = 300 + hip / 2, crotch = y + Math.max(65, (m[0].value - m[3].value) * 4);
      return shell(<>
        {part(0, m[0].point, <path d={`M${300 - waist / 2} ${y}L${l} ${y + 65}L${l + 8} ${bottom}H285L300 ${crotch}L315 ${bottom}H${r - 8}L${r} ${y + 65}L${300 + waist / 2} ${y}Z`} />)}
        {part('waistband', 'Cintura', <><path d={`M${300 - waist / 2} ${y}h${waist}v${snapshot.parts.waistband * 4}h-${waist}Z`} /><path d={`M${300 - waist / 2 + 25} ${y}v22M${300 + waist / 2 - 25} ${y}v22`} /></>)}
        {part('pocket', 'Tasche', back ? <><path d={`M${l + 25} ${y + 45}h${snapshot.parts.pocket * 3}v6h-${snapshot.parts.pocket * 3}Z`} /><path d={`M${r - 25} ${y + 45}h-${snapshot.parts.pocket * 3}v6h${snapshot.parts.pocket * 3}Z`} /><path d={`M250 ${y + 15}l-6 40M350 ${y + 15}l6 40`} fill="none" /></> : <><path d={`M${l + 17} ${y + 20}l-12 65M${r - 17} ${y + 20}l12 65M300 ${y + 18}v75q20 0 20-20v-55`} fill="none" /><circle cx="306" cy={y + 8} r="3" /></>)}
        {part(3, m[3].point, <><path d={`M250 ${y + 38}L248 ${bottom - 5}M350 ${y + 38}L352 ${bottom - 5}`} fill="none" strokeDasharray={back ? '3 3' : undefined} /><path d={`M${l + 8} ${bottom - 10}h76M315 ${bottom - 10}h${r - 323}`} fill="none" /></>)}
        {quote(l - 35, y, l - 35, bottom, `A · ${m[0].value} cm`, l - 50, y + length / 2)}
        {quote(300 - waist / 2, y - 25, 300 + waist / 2, y - 25, `B · vita ${m[1].value} cm`, 300, y - 40)}
        {quote(l, y + 80, r, y + 80, `C · bacino ${m[2].value} cm`, 300, y + 100)}
        {quote(r + 35, crotch, r + 35, bottom, `D · ${m[3].value} cm`, r + 40, bottom + 25)}
      </>);
    }
    if (snapshot.category === 'bag') {
      const w = m[0].value * 9, h = m[1].value * 8, x = 300 - w / 2, y = 270, bottom = y + h, rise = m[3].value * 2.4;
      return shell(<>
        {part(0, m[0].point, <path d={`M${x - 20} ${y}H${x + w + 20}L${x + w} ${bottom}H${x}Z`} />)}
        {part(3, m[3].point, <><path d={`M${x + 70} ${y + 25}V${y - rise / 2}Q300 ${y - rise - 40} ${x + w - 70} ${y - rise / 2}V${y + 25}`} fill="none" strokeWidth={snapshot.parts.handle * 9} /><rect x={x + 60} y={y - 3} width="20" height="48" fill="#534238" /><rect x={x + w - 80} y={y - 3} width="20" height="48" fill="#534238" /><path d={`M${x + 65} ${y + 1}v36h10v-36M${x + w - 75} ${y + 1}v36h10v-36`} strokeDasharray="3 2" fill="none" /></>)}
        {part('zipper', 'Zip', <><path d={`M${x - 15} ${y + 5}h${w + 30}`} /><path d={`M${x - 15} ${y + 9}h${w + 30}`} strokeDasharray="2 3" />{!back && <rect x={x - 10} y={y + 3} width="8" height="14" fill="#b69a61" />}</>)}
        {part(2, m[2].point, <><path d={`M${x} ${bottom - 45}l24 45h-24ZM${x + w} ${bottom - 45}l-24 45h24Z`} fill="#534238" /><path d={`M${x + 24} ${bottom - 12}h${w - 48}`} fill="none" /></>)}
        {quote(x, bottom + 25, x + w, bottom + 25, `A · ${m[0].value} cm`, 300, bottom + 45)}
        {quote(x - 55, y, x - 55, bottom, `B · ${m[1].value} cm`, x - 75, y + h / 2)}
        {quote(x + w + 55, bottom - m[2].value * 4, x + w + 55, bottom, `C · fondo ${m[2].value} cm`, x + w + 28, bottom - 65)}
        <text x="300" y={y - rise - 20} fill="var(--text-2,#68665e)" fontSize="12" textAnchor="middle">D · manico {m[3].value} cm</text>
      </>);
    }
    const w = m[2].value * 1.9, sw = m[1].value * 3.8, len = m[0].value * 4, sl = m[3].value * 3.8, x = 300 - w / 2, y = 95, bottom = y + len;
    return shell(<>
      {part(0, m[0].point, <path d={`M260 ${y}L${300 - sw / 2} ${y + 20}L${x} ${y + 80}V${bottom}H${x + w}V${y + 80}L${300 + sw / 2} ${y + 20}L340 ${y}Q300 ${back ? y + 22 : y + 65} 260 ${y}Z`} />)}
      {part(3, m[3].point, <><path d={`M${300 - sw / 2} ${y + 20}L${x - 100} ${y + sl}l43 18L${x} ${y + 80}Z`} /><path d={`M${300 + sw / 2} ${y + 20}L${x + w + 100} ${y + sl}l-43 18L${x + w} ${y + 80}Z`} /></>)}
      {part('neckband', 'Bordo collo', <><path d={`M260 ${y}Q300 ${back ? y + 22 : y + 65} 340 ${y}M258 ${y + snapshot.parts.neckband * 3}Q300 ${back ? y + 32 : y + 75} 342 ${y + snapshot.parts.neckband * 3}`} fill="none" /><path d={`M${x + 10} ${y + 73}l10 12M${x + w - 10} ${y + 73}l-10 12`} strokeDasharray="2 2" /></>)}
      {part('rib', 'Costa fondo e polsi', <><path d={`M${x} ${bottom - snapshot.parts.rib * 4}h${w}M${x - 94} ${y + sl - 16}l43 18M${x + w + 94} ${y + sl - 16}l-43 18`} fill="none" />{Array.from({ length: 30 }, (_, n) => <path key={n} d={`M${x + 4 + n * (w - 8) / 29} ${bottom - snapshot.parts.rib * 4}v${snapshot.parts.rib * 4}`} />)}</>)}
      {quote(x - 125, y, x - 125, bottom, `A · ${m[0].value} cm`, x - 125, bottom + 30)}
      {quote(300 - sw / 2, y - 25, 300 + sw / 2, y - 25, `B · ${m[1].value} cm`, 300, y - 40)}
      {quote(x, y + 130, x + w, y + 130, `C · torace ${m[2].value} cm`, 300, y + 150)}
      {quote(x + w + 110, y + 20, x + w + 110, y + sl, `D · ${m[3].value} cm`, x + w + 90, y + sl + 42)}
    </>);
  }
  if (view === 'Dettagli') return <svg className="dw-technical-vector" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" aria-label="Dettagli costruttivi della giacca"><title>Colletto, tasca e cuciture · quote demo</title><rect width="600" height="400" fill="var(--surface-2,#252524)" />
    <g fill={color} strokeLinejoin="round">
      {part('collar', 'Colletto', <><path d={`M110 40l45 110-55 -${snapshot.parts.collar * 5} -35 -35Z`} /><path d={`M200 40l-45 110 55 -${snapshot.parts.collar * 5} 35 -35Z`} /><text x="155" y="184" fill="var(--text-2,#b5b2ab)" stroke="none" textAnchor="middle" fontSize="13">Colletto · {snapshot.parts.collar} cm</text></>)}
      {part('pocket', 'Tasca', <><rect x="335" y="75" width={Math.min(210, snapshot.parts.pocket * 10)} height="26" rx="2" /><path d={`M340 101v50h${Math.min(200, snapshot.parts.pocket * 10 - 10)}v-50`} /><text x="440" y="184" fill="var(--text-2,#b5b2ab)" stroke="none" textAnchor="middle" fontSize="13">Tasca · {snapshot.parts.pocket} cm</text></>)}
      {part('seam', 'Cuciture', <><path d="M100 230h400v80H100Z" /><path d={`M100 ${230 + snapshot.parts.seam * 15}h400`} strokeDasharray="5 4" fill="none" /><text x="300" y="344" fill="var(--text-2,#b5b2ab)" stroke="none" textAnchor="middle" fontSize="13">Margine cucitura · {snapshot.parts.seam} cm</text></>)}
    </g><text x="300" y="378" textAnchor="middle" fill="var(--text-3,#9a968f)" fontSize="11">Dettagli · schema dimostrativo</text></svg>;
  return <svg className="dw-technical-vector" xmlns="http://www.w3.org/2000/svg" viewBox={`${minX} 0 ${width} ${height}`} aria-label={`Disegno tecnico ${view.toLowerCase()}`}>
    <title>Giacca · {view} · base 42</title><rect x={minX} width={width} height={height} fill="var(--surface-2,#252524)" />
    <g strokeLinejoin="round" fill={color}>
      {part(0, 'Corpo', <path d={`M${300 - shoulder / 2} 90 L${left} 130 L${left + 8} ${hem} Q300 ${hem + 12} ${right - 8} ${hem} L${right} 130 L${300 + shoulder / 2} 90 L328 76 L272 76Z`} />)}
      {part(3, 'Manica', <><path d={`M${300 - shoulder / 2} 90 Q${left - 30} 106 ${left - 38} 143 L${left - 75} ${top + sleeve} L${left - 38} ${top + sleeve + 8} L${left + 12} 156Z`} /><path d={`M${300 + shoulder / 2} 90 Q${right + 30} 106 ${right + 38} 143 L${right + 75} ${top + sleeve} L${right + 38} ${top + sleeve + 8} L${right - 12} 156Z`} /></>)}
      {view !== 'Retro' && part('collar', 'Colletto', <><path d={`M272 76 L300 150 L266 ${136 + snapshot.parts.collar * 2} L${253 - snapshot.parts.collar} 111Z`} /><path d={`M328 76 L300 150 L334 ${136 + snapshot.parts.collar * 2} L${347 + snapshot.parts.collar} 111Z`} /></>)}
      {view !== 'Retro' && part('pocket', 'Tasca', <>{[left + 24, right - 24 - snapshot.parts.pocket * 3].map(x => <g key={x}><rect x={x} y={hem - 85} width={snapshot.parts.pocket * 3} height="12" rx="1" /><path d={`M${x + 3} ${hem - 73}v24h${snapshot.parts.pocket * 3 - 6}v-24`} /></g>)}</>)}
      {part('seam', 'Cuciture', <path d={`M${left + snapshot.parts.seam * 10} 166L${left + snapshot.parts.seam * 10 + 7} ${hem - 8}M${right - snapshot.parts.seam * 10} 166L${right - snapshot.parts.seam * 10 - 7} ${hem - 8}`} fill="none" strokeDasharray="4 3" />)}
      {view === 'Retro' ? <path d={`M300 86v${body + 12}m-7 0v-42`} fill="none" stroke="var(--text-2,#b5b2ab)" /> : <g fill="var(--text-2,#b5b2ab)">{[198, 230, 262].map(y => <circle key={y} cx="304" cy={y} r="3" />)}<path d={`M300 150v${hem - 150}`} fill="none" stroke="var(--text-2,#b5b2ab)" /></g>}
    </g>
    {part(1, 'Spalle', quote(300 - shoulder / 2, 54, 300 + shoulder / 2, 54, `B · ${m[1].value} cm`, 300, 43))}
    {quote(left - 103, top, left - 103, hem, `A · ${m[0].value} cm`, left - 107, hem + 22)}
    {part(2, 'Torace', quote(left, 180, right, 180, `C · ${m[2].value} cm`, 300, 172))}
    {quote(right + 93, top, right + 93, top + sleeve, `D · ${m[3].value} cm`, right + 80, top + sleeve + 26)}
    <text x="300" y={height - 20} textAnchor="middle" fill="var(--text-3,#9a968f)" fontSize="11">{view} · base 42 · misure demo</text>
  </svg>;
}
