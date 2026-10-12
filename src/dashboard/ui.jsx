import React, { useEffect, useRef } from 'react';
import { ICONS } from 'virtual:icons';

export function Icon({ name = 'grid', size = 20 }) {
  const icons = { close: 'x', arrow: 'arrow-right', back: 'arrow-left', chevron: 'chevron-down', exit: 'log-out', grid: 'layout-grid', chat: 'message-square', file: 'file-text', box: 'package', chevrons: 'chevrons-up-down', panel: 'panel-left', chart: 'chart-no-axes-column-increasing', help: 'circle-help', sort: 'arrow-down-up' };
  const icon = icons[name] || name;
  return <svg className={`dw-icon lucide lucide-${icon}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[icon] || ICONS['circle-help'] }} />;
}
export function Button({ children, primary, icon, className = '', ...props }) {
  return <button type="button" className={`dw-btn ${primary ? 'dw-primary' : ''} ${className}`} {...props}>{icon && <Icon name={icon} size={16} />}{children}</button>;
}
export function Card({ title, note, actions, children, className = '', flush = false, ...props }) {
  return <section className={`dw-card ${className}`} {...props}>{(title || note || actions) && <header className="dw-card-head"><div>{title && <h2>{title}</h2>}{note && <p>{note}</p>}</div>{actions && <div className="dw-actions">{actions}</div>}</header>}<div className={`dw-card-body ${flush ? 'dw-card-flush' : ''}`}>{children}</div></section>;
}
export function Badge({ children, tone = '' }) { return <span className={`dw-badge ${tone}`}>{children}</span>; }
export function Metrics({ items }) {
  return <div className="dw-metrics" style={{ '--metric-count': items.length }}>{items.map(([label, value, note, detail = {}]) => {
    return <section className={`dw-metric ${String(value).length > 12 ? 'dw-metric-compact' : ''}`} key={label} aria-label={label}>
      <div className="dw-metric-heading"><Icon name={detail.icon || 'chart'} size={14} /><span>{label}</span></div>
      <strong>{value}</strong>{note && <small>{note}</small>}
      {detail.progress != null && <Progress value={detail.progress} label={label} />}
    </section>;
  })}</div>;
}
export function Field({ label, hint, children }) { return <label className="dw-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Tabs({ items, selected, onChange, label = 'Vista', variant = 'segmented' }) {
  return <div className={`dw-tabs ${variant === 'underline' ? 'dw-tabs-underline' : ''}`} role="group" aria-label={label}>{items.map(item => <button key={item} type="button" aria-pressed={selected === item} onClick={() => onChange(item)}>{item}</button>)}</div>;
}
export function Progress({ value, label }) {
  const percentage = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <div className="dw-progress" role="progressbar" aria-label={label} aria-valuenow={Math.round(percentage)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percentage}%` }} /></div>;
}
export function Dialog({ title, note, children, onClose, beforeClose, wide, instant = false, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current, opener = document.activeElement;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-autofocus]')?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  function requestClose(event) { event?.preventDefault(); if (beforeClose?.() !== false) ref.current.close(); }
  return <dialog className={`dw-dialog ${wide ? 'wide' : ''} ${instant ? 'dw-instant' : ''} ${className}`} ref={ref} onCancel={requestClose} onClose={event => { if (!event.currentTarget.open) onClose?.(); }} aria-label={title} onClick={event => { if (event.target !== event.currentTarget) return; const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) requestClose(event); }}><header><div><h2>{title}</h2>{note && <p>{note}</p>}</div><button type="button" className="dw-icon-btn" onClick={requestClose} aria-label="Chiudi finestra"><Icon name="close" /></button></header><div className="dw-dialog-body">{children}</div></dialog>;
}
export function Empty({ children }) { return <div className="dw-empty"><Icon name="search" /><p>{children}</p></div>; }
