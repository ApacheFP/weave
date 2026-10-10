import React, { useEffect, useRef } from 'react';

export function Icon({ name = 'grid', size = 20 }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    home: <><path d="m3 10 9-7 9 7v11H3V10Z" /><path d="M9 21v-8h6v8" /></>,
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
export function Button({ children, primary, icon, static: staticButton = false, className = '', ...props }) {
  return <button type="button" className={`dw-btn ${primary ? 'dw-primary' : ''} ${staticButton ? 'dw-static' : ''} ${className}`} {...props}>{icon && <Icon name={icon} size={16} />}{children}</button>;
}
export function Card({ title, note, actions, children, className = '', flush = false, ...props }) {
  return <section className={`dw-card ${className}`} {...props}>{(title || note || actions) && <header className="dw-card-head"><div>{title && <h2>{title}</h2>}{note && <p>{note}</p>}</div>{actions && <div className="dw-actions">{actions}</div>}</header>}<div className={`dw-card-body ${flush ? 'dw-card-flush' : ''}`}>{children}</div></section>;
}
export function Badge({ children, tone = '' }) { return <span className={`dw-badge ${tone}`}>{children}</span>; }
export function Metrics({ items }) {
  return <div className="dw-metrics" style={{ '--metric-count': items.length }}>{items.map(([label, value, note, detail = {}]) => {
    const percentage = detail.progress == null ? null : Math.max(0, Math.min(100, detail.progress));
    return <section className={`dw-metric ${String(value).length > 12 ? 'dw-metric-compact' : ''}`} key={label} aria-label={label}>
      <div className="dw-metric-heading"><span>{label}</span><span className="dw-metric-icon"><Icon name={detail.icon || 'chart'} size={18} /></span></div>
      <strong>{value}</strong>{note && <small>{note}</small>}
      {percentage != null && <div className="dw-metric-ticks" role="progressbar" aria-label={label} aria-valuenow={Math.round(percentage)} aria-valuemin={0} aria-valuemax={100}>{Array.from({ length: 40 }, (_, index) => <i key={index} aria-hidden="true" className={index < Math.round(percentage * .4) ? 'filled' : ''} />)}</div>}
    </section>;
  })}</div>;
}
export function Field({ label, hint, children }) { return <label className="dw-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Tabs({ items, selected, onChange, label = 'Vista' }) {
  return <div className="dw-tabs" role="group" aria-label={label}>{items.map(item => <button key={item} type="button" aria-pressed={selected === item} onClick={() => onChange(item)}>{item}</button>)}</div>;
}
export function Progress({ value, label }) { return <div className="dw-progress" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
export function Dialog({ title, note, children, onClose, wide, instant = false }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); ref.current.querySelector('[data-autofocus]')?.focus(); }, []);
  return <dialog className={`dw-dialog ${wide ? 'wide' : ''} ${instant ? 'dw-instant' : ''}`} ref={ref} onClose={onClose} aria-label={title} onClick={event => { if (event.target !== event.currentTarget) return; const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.currentTarget.close(); }}><header><div><h2>{title}</h2>{note && <p>{note}</p>}</div><button className="dw-icon-btn" onClick={() => ref.current.close()} aria-label="Chiudi finestra"><Icon name="close" /></button></header><div className="dw-dialog-body">{children}</div></dialog>;
}
export function Empty({ children }) { return <div className="dw-empty"><Icon name="search" /><p>{children}</p></div>; }
