import React from 'react';

export default function TechnicalDrawing({ snapshot, view = 'Fronte', selected, onSelect, color = '#e9e4db', exportMode = false }) {
  const m = snapshot.measurements;
  const shoulder = m[1].value * 3.8, chest = m[2].value * 1.9, body = m[0].value * 4, sleeve = m[3].value * 3.8;
  const left = 300 - chest / 2, right = 300 + chest / 2, top = 100, hem = top + body;
  const height = Math.max(500, hem + 80, top + sleeve + 80);
  const minX = Math.min(-40, left - 140, 240 - shoulder / 2), width = Math.max(640, right + 140, 360 + shoulder / 2) - minX;
  const part = (key, label, children) => <g role={exportMode ? undefined : 'button'} tabIndex={exportMode ? undefined : 0} aria-label={exportMode ? undefined : `Seleziona ${label}`} onClick={() => onSelect?.(key)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(key); } }} stroke={selected === key ? 'var(--accent,#8e9af3)' : 'var(--text-2,#b5b2ab)'} strokeWidth={selected === key ? 3 : 1.5} style={{ cursor: exportMode ? undefined : 'pointer' }}>{children}</g>;
  const quote = (x1, y1, x2, y2, label, tx, ty) => <g stroke="var(--text-3,#9a968f)" strokeWidth="1" fill="none"><path d={`M${x1} ${y1} L${x2} ${y2}`} /><path d={`M${x1 - 4} ${y1 - 4}l8 8M${x2 - 4} ${y2 - 4}l8 8`} /><text x={tx} y={ty} fill="var(--text-2,#b5b2ab)" stroke="none" fontSize="12" textAnchor="middle">{label}</text></g>;
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
