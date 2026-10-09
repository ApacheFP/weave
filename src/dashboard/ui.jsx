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
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  };
  return <svg className="dw-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name] || paths.layers}</svg>;
}
export function Button({ children, primary, icon, className = '', ...props }) {
  return <button type="button" className={`dw-btn ${primary ? 'dw-primary' : ''} ${className}`} {...props}>{icon && <Icon name={icon} size={16} />}{children}</button>;
}
export function Card({ title, note, actions, children, className = '', ...props }) {
  return <section className={`dw-card ${className}`} {...props}>{(title || actions) && <header className="dw-card-head"><div><h2>{title}</h2>{note && <p>{note}</p>}</div>{actions && <div className="dw-actions">{actions}</div>}</header>}<div className="dw-card-body">{children}</div></section>;
}
export function Badge({ children, tone = '' }) { return <span className={`dw-badge ${tone}`}>{children}</span>; }
export function Metrics({ items }) { return <div className="dw-metrics">{items.map(([label, value, note]) => <div className="dw-metric" key={label}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>)}</div>; }
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
export function Artwork({ id = 2, className = '' }) { return <img className={`dw-artwork ${className}`} src={`/illustrations/module-${String(id).padStart(2, '0')}.webp`} alt="" loading="lazy" />; }

export function Jacket({ back = false, sketch = false, marks = true, highlight = false, onDefect, scale = 1, tone = '#ede4d6' }) {
  return <svg className={`dw-jacket ${sketch ? 'is-sketch' : ''}`} viewBox="0 0 400 450" role="img" aria-label={back ? 'Disegno tecnico del retro della giacca' : 'Disegno tecnico del davanti della giacca'}>
    <defs><pattern id="sketch-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dcd5ca" strokeWidth=".4" /></pattern></defs>
    <rect width="400" height="450" fill="url(#sketch-grid)" opacity=".5" />
    <g transform={`translate(200 220) scale(${scale}) translate(-200 -220)`} stroke="#484138" strokeWidth={sketch ? '1.2' : '1.6'} fill={tone} strokeLinejoin="round">
      <path d="m150 65-50 24-28 45-37 202 40 13 37-158-3 213h182l-3-213 37 158 40-13-37-202-28-45-50-24-17 18h-36l-17-18Z" />
      {back ? <><path d="M150 65q50 40 100 0M200 90v280m0 0-12 34m12-34 12 34M110 195h180" fill="none" /><path d="M111 350h178" fill="none" /></> : <><path d="m150 65 36 123-46-38 18-32-23-16m115-37-36 123 46-38-18-32 23-16M200 128v276" fill="none" /><path d="M127 247h49v8h-49Zm98 0h49v8h-49Z" /><path d="m131 256-4 28h49v-28m53 0v28h49l-4-28" fill="none" />{[217, 265, 313].map(y => <circle key={y} cx="205" cy={y} r="3" fill="#484138" />)}</>}
      <path d="m72 319 42 9m174 0 42-9" fill="none" />
    </g>
    {marks && <g fill="none" stroke="#aa8a58" strokeWidth="1"><path d="M104 40h192M104 34v12m192-12v12M380 85v319m-6-319h12m-12 319h12" /><g fill="#806947" stroke="none" fontSize="11" fontFamily="system-ui"><text x="165" y="30">A · SPALLE</text><text x="368" y="265" transform="rotate(-90 368 265)">B · LUNGHEZZA</text><text x="66" y="431">GJ-0421 / 42 / FRONTE {back && '→ RETRO'}</text></g></g>}
    {highlight && <g className="dw-defect" role="button" tabIndex="0" aria-label="Apri difetto cucitura sulla spalla sinistra" onClick={onDefect} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onDefect?.(); } }}><circle cx="127" cy="86" r="26" fill="#c79c5328" stroke="#a87833" strokeWidth="2" strokeDasharray="4 3" /><circle cx="127" cy="86" r="5" fill="#a87833" /><path d="M154 86h49" stroke="#a87833" /><rect x="203" y="73" width="78" height="26" rx="8" fill="#fff" stroke="#d5c4a7" /><text x="215" y="90" fontSize="11" fill="#6e5531">NC-018</text></g>}
  </svg>;
}

export const patternPieces = [
  { name: 'Davanti', path: 'M20 8 60 0 80 28 68 68 82 152 5 152 12 55Z', qty: 2 },
  { name: 'Dietro', path: 'M15 8 60 0 76 38 64 70 75 150 5 150 12 65Z', qty: 2 },
  { name: 'Manica sopra', path: 'M20 20Q42-15 65 20L75 140 5 140Z', qty: 2 },
  { name: 'Manica sotto', path: 'M25 8 54 4 65 142 12 142Z', qty: 2 },
  { name: 'Colletto', path: 'M5 38 15 20 70 10 92 26 76 40Z', qty: 1 },
  { name: 'Rever', path: 'M20 0 62 14 52 140 25 140Z', qty: 2 },
];
export function Pattern({ index = 0, scale = 1, notches = true, grain = true, nested = false, active = false }) {
  const piece = patternPieces[index % patternPieces.length];
  return <svg className="dw-pattern" viewBox="0 0 100 170" aria-label={`Cartamodello ${piece.name}`} role="img"><g transform={`translate(50 85) scale(${scale}) translate(-50 -85)`}>{nested && [.86, .92, 1.06, 1.12].map((factor, n) => <path key={factor} d={piece.path} transform={`translate(45 80) scale(${factor}) translate(-45 -80)`} fill="none" stroke={['#d5c7b1', '#bca785', '#7f725e', '#4b463e'][n]} strokeWidth=".7" />)}<path d={piece.path} fill={active ? '#e6d4b3' : '#f2e9d9'} stroke="#7e6a4e" strokeWidth="1.2" /><path d={piece.path} transform="translate(3 3) scale(.93)" fill="none" stroke="#a99b86" strokeDasharray="2 2" strokeWidth=".6" />{grain && <path d="M40 45v65m-3-61 3-4 3 4m-6 57 3 4 3-4" fill="none" stroke="#7e6a4e" strokeWidth=".8" />}{notches && <path d="m10 62 5 2-5 2m60-32-3 2 3 2" fill="none" stroke="#4d463a" strokeWidth="1.4" />}</g></svg>;
}
