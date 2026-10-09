import React, { useEffect, useRef } from 'react';

export function Icon({ name = 'grid', size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />, back: <path d="m14 5-7 7 7 7" />, close: <path d="m6 6 12 12M6 18 18 6" />,
    plus: <path d="M12 4v16M4 12h16" />, check: <path d="m5 12 4 4L19 6" />, search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></>,
    chat: <><path d="M4 4h16v12H9l-5 4V4Z" /><path d="M8 8h8M8 12h5" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /></>,
    layers: <><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shirt: <path d="m8 3 4 2 4-2 6 5-3 4-3-2v11H8V10l-3 2-3-4 6-5Z" />,
    file: <><path d="M5 3h9l5 5v13H5V3Zm9 0v6h5M8 13h8M8 17h6" /></>,
    box: <><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4m-9 4v10M7 5l9 4" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    chevrons: <path d="m9 8 3-3 3 3m-6 8 3 3 3-3" />,
    panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
    pencil: <><path d="m4 16-1 5 5-1L20 8l-4-4L4 16Zm10-10 4 4" /></>,
    ruler: <><path d="m3 16 13-13 5 5L8 21l-5-5Z" /><path d="m12 7 2 2m-5 1 2 2m-5 1 2 2" /></>,
    scissors: <><circle cx="5" cy="6" r="3" /><circle cx="5" cy="18" r="3" /><path d="m8 8 13 13M8 16 21 3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18M7 15h2m4 0h2" /></>,
    chart: <><path d="M4 3v18h17M8 15l4-6 4 3 5-8" /></>,
    activity: <path d="M2 12h5l3-8 4 16 3-8h5" />,
    list: <><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4" cy="6" r=".5" /><circle cx="4" cy="12" r=".5" /><circle cx="4" cy="18" r=".5" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  };
  return <svg className="dw-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name] || paths.layers}</svg>;
}
export function Button({ children, primary, icon, className = '', ...props }) {
  return <button type="button" className={`dw-btn ${primary ? 'dw-primary' : ''} ${className}`} {...props}>{icon && <Icon name={icon} size={16} />}{children}</button>;
}
export function Card({ title, note, actions, children, className = '', frame = false, flush = false, ...props }) {
  return <section className={`dw-card ${frame ? 'dw-frame' : ''} ${className}`} {...props}>{(title || note || actions) && <header className="dw-card-head"><div>{title && <h2>{title}</h2>}{note && <p>{note}</p>}</div>{actions && <div className="dw-actions">{actions}</div>}</header>}<div className={`dw-card-body ${flush ? 'dw-card-flush' : ''}`}>{children}</div></section>;
}
export function Badge({ children, tone = '' }) { return <span className={`dw-badge ${tone}`}>{children}</span>; }
export function Metrics({ items }) { return <div className="dw-metrics" style={{ '--metric-count': items.length }}>{items.map(([label, value, note]) => <div className="dw-metric" key={label}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>)}</div>; }
export function Field({ label, hint, children }) { return <label className="dw-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Tabs({ items, selected, onChange, label = 'Vista' }) {
  return <div className="dw-tabs" role="group" aria-label={label}>{items.map(item => <button key={item} type="button" aria-pressed={selected === item} onClick={() => onChange(item)}>{item}</button>)}</div>;
}
export function Progress({ value, label }) { return <div className="dw-progress" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
export function Dialog({ title, note, children, onClose, wide }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog className={`dw-dialog ${wide ? 'wide' : ''}`} ref={ref} onClose={onClose} aria-label={title} onClick={event => { if (event.target !== event.currentTarget) return; const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.currentTarget.close(); }}><header><div><h2>{title}</h2>{note && <p>{note}</p>}</div><button className="dw-icon-btn" onClick={() => ref.current.close()} aria-label="Chiudi finestra"><Icon name="close" /></button></header><div className="dw-dialog-body">{children}</div></dialog>;
}
export function Empty({ children }) { return <div className="dw-empty"><Icon name="search" /><p>{children}</p></div>; }
export const patternPieces = [
  { name: 'Davanti', path: 'M31 5L59 12Q57 28 63 38Q69 48 79 50L72 84Q70 106 78 156Q42 164 9 157L14 102Q18 75 17 59L9 47L25 38L20 27L34 22Z', qty: 2 },
  { name: 'Dietro', path: 'M12 5Q30 11 42 4L71 15Q61 32 66 44Q69 52 79 55L70 87Q68 105 77 157L11 157L14 95L12 5Z', qty: 2 },
  { name: 'Manica sopra', path: 'M12 40Q14 22 31 10Q44 0 56 8Q74 18 80 42Q75 66 72 93L63 151L27 151L15 93Q11 67 12 40Z', qty: 2 },
  { name: 'Manica sotto', path: 'M25 18Q40 9 55 20Q59 49 55 77L53 147L27 149Q25 113 19 83Q15 49 25 18Z', qty: 2 },
  { name: 'Colletto', path: 'M7 66Q42 40 86 55L93 78Q52 63 18 87Z', qty: 1 },
  { name: 'Rever', path: 'M35 7L66 19L53 47Q40 78 34 113L40 155L16 155L18 102Q20 64 31 34L20 24Z', qty: 2 },
];
export function Pattern({ index = 0, scale = 1, notches = true, grain = true, nested = false, active = false }) {
  const piece = patternPieces[index % patternPieces.length];
  return <svg className="dw-pattern" viewBox="0 0 100 170" aria-label={`Cartamodello ${piece.name}`} role="img"><g transform={`translate(50 85) scale(${scale}) translate(-50 -85)`}>{nested && [.86, .92, 1.06, 1.12].map((factor, n) => <path key={factor} d={piece.path} transform={`translate(45 80) scale(${factor}) translate(-45 -80)`} fill="none" stroke={['#d5c7b1', '#bca785', '#7f725e', '#4b463e'][n]} strokeWidth=".7" />)}<path d={piece.path} fill={active ? '#e6d4b3' : '#f2e9d9'} stroke="#7e6a4e" strokeWidth="1.2" /><path d={piece.path} transform="translate(3 3) scale(.93)" fill="none" stroke="#a99b86" strokeDasharray="2 2" strokeWidth=".6" />{grain && <path d="M40 45v65m-3-61 3-4 3 4m-6 57 3 4 3-4" fill="none" stroke="#7e6a4e" strokeWidth=".8" />}{notches && <path d="m10 62 5 2-5 2m60-32-3 2 3 2" fill="none" stroke="#4d463a" strokeWidth="1.4" />}</g></svg>;
}
