import React, { useEffect, useRef, useState } from 'react';
import { moduleGroups } from '../modules.js';
import { minQuantity, useDemo } from './DemoContext.jsx';
import { Badge, Button, Dialog, Empty, Field, Icon } from './ui.jsx';
import { ProductPhoto } from './Media.jsx';

export function StyleSwitcher({ onCreate, onSelect }) {
  const { data, styles, selectStyle } = useDemo();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef(null); const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className="dw-switcher" ref={root}>
    <button ref={trigger} className="dw-workspace-trigger" aria-label={`Cambia capo: ${data.title}`} aria-expanded={open} aria-controls="style-switcher" onClick={() => { setOpen(!open); setQuery(''); }}>
      <span className="dw-workspace-mark"><Icon name="shirt" size={17} /></span><span className="dw-workspace-name"><strong>{data.title}</strong><small>{data.styleId} · {data.collection}</small></span><Icon name="chevrons" size={14} />
    </button>
    {open && <div id="style-switcher" className="dw-workspace-popover" aria-label="I tuoi capi"><div className="dw-popover-heading">Capi nello spazio Atelier <Badge>{styles.length}</Badge></div><div className="dw-popover-search"><Icon name="search" size={15} /><input autoFocus aria-label="Cerca capo" placeholder="Cerca un capo…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="dw-style-list">{styles.filter(item => `${item.title} ${item.styleId}`.toLowerCase().includes(query.toLowerCase())).map(item => <button key={item.styleId} aria-pressed={item.styleId === data.styleId} onClick={() => { selectStyle(item.styleId); setOpen(false); onSelect?.(); }}><span className="dw-style-thumb"><ProductPhoto variant={item.variant} sizes="40px" /></span><span><strong>{item.title}</strong><small>{item.styleId} · {item.variant}</small></span>{item.styleId === data.styleId && <Icon name="check" size={15} />}</button>)}</div><button className="dw-create-style" onClick={() => { setOpen(false); onCreate(); }}><Icon name="plus" size={16} />Nuovo capo</button><p className="dw-popover-foot">Ogni capo ha dati e attività propri.</p></div>}
  </div>;
}

export function CreateStyleDialog({ onClose, onCreated }) {
  const { data, styles, createStyle } = useDemo();
  const next = Math.max(420, ...styles.map(item => Number(item.styleId.match(/\d+$/)?.[0]) || 0)) + 1;
  const [draft, setDraft] = useState({ title: '', styleId: `GJ-${String(next).padStart(4, '0')}`, collection: data.collection, quantity: 300, copy: false });
  const [error, setError] = useState('');
  return <Dialog title="Nuovo capo" note="Atelier · crea uno spazio per il prossimo prodotto" onClose={onClose}><form className="dw-stack" onSubmit={event => { event.preventDefault(); if (!createStyle(draft)) { setError('Questo codice è già assegnato a un capo. Scegline un altro.'); return; } onCreated(); }}>
    <Field label="Nome del capo"><input data-autofocus required maxLength={80} pattern=".*\S.*" placeholder="Es. Giacca Essential" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></Field>
    <div className="dw-two"><Field label="Codice prodotto"><input required maxLength={24} pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*" value={draft.styleId} onChange={e => { setDraft({ ...draft, styleId: e.target.value.toUpperCase() }); setError(''); }} /></Field><Field label="Quantità prevista"><input required type="number" min={draft.copy ? minQuantity(data) : 1} max="10000" step="1" value={draft.quantity} onChange={e => setDraft({ ...draft, quantity: e.target.value })} /></Field></div>
    <Field label="Collezione"><input required maxLength={80} pattern=".*\S.*" value={draft.collection} onChange={e => setDraft({ ...draft, collection: e.target.value })} /></Field>
    <label className="dw-check"><input type="checkbox" checked={draft.copy} onChange={e => setDraft({ ...draft, copy: e.target.checked, quantity: e.target.checked ? Math.max(Number(draft.quantity), minQuantity(data)) : draft.quantity })} />Duplica specifiche e ordini di {data.title}</label>
    <p className="dw-muted">Il modello base è una giacca: misure e materiali sono precompilati e modificabili. I nuovi capi restano disponibili durante questa sessione demo.</p>
    {error && <p className="dw-error" role="alert">{error}</p>}
    <div className="dw-dialog-actions"><Button onClick={onClose}>Annulla</Button><Button primary icon="plus" type="submit">Crea capo</Button></div>
  </form></Dialog>;
}

export function WorkspaceSearch({ onNavigate, onClose }) {
  const { data, styles, selectStyle } = useDemo(); const [query, setQuery] = useState('');
  const matches = text => text.toLowerCase().includes(query.toLowerCase());
  const rows = moduleGroups[0].items.map(item => item.id === 21 ? { ...item, title: 'Home' } : item).sort((a, b) => Number(b.id === 21) - Number(a.id === 21)).filter(item => matches(item.title) || item.id === 21 && matches('Context Engine Digital Twin'));
  const products = styles.filter(item => matches(`${item.title} ${item.styleId}`));
  return <Dialog instant title="Cerca in Atelier" note="Apri un modulo oppure cambia capo" onClose={onClose}><div className="dw-command-search"><Icon name="search" size={18} /><input data-autofocus aria-label="Cerca moduli e capi" placeholder="Moduli, codici, capi…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="dw-command-results"><span className="dw-eyebrow">Moduli · {data.title}</span>{rows.map(item => <button key={item.id} onClick={() => { onNavigate(item.id); onClose(); }}><Icon name={item.id === 21 ? 'home' : 'grid'} size={16} /><span>{item.title}</span><Icon name="arrow" size={14} /></button>)}{products.length > 0 && <><span className="dw-eyebrow">Capi</span>{products.map(item => <button key={item.styleId} onClick={() => { selectStyle(item.styleId); onNavigate(21); onClose(); }}><Icon name="shirt" size={16} /><span>{item.title} <small>{item.styleId}</small></span>{item.styleId === data.styleId && <Icon name="check" size={14} />}</button>)}</>}{!rows.length && !products.length && <Empty>Nessun risultato per “{query}”.</Empty>}</div></Dialog>;
}
