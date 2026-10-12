import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { moduleGroups } from '../modules.js';
import { useDemo } from './DemoContext.jsx';
import { minQuantity } from './domain.js';
import { Badge, Button, Dialog, Empty, Field, Icon } from './ui.jsx';
import { ProductPhoto } from './Media.jsx';
import { productSearchText, productVariantId } from './productData.js';
import './workspace-switcher.css';

export function StyleSwitcher({ onCreate, onSelect, selected = true }) {
  const { data, products, selectStyle } = useDemo();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [popoverStyle, setPopoverStyle] = useState(null);
  const root = useRef(null); const trigger = useRef(null); const popover = useRef(null);
  const matchingStyles = products.filter(item => productSearchText(item).includes(query.toLowerCase().trim()));
  const activeProduct = products.find(item => item.variants.some(variant => variant.styleId === data.styleId));
  const season = collection => collection.replace('Autunno/Inverno', 'AI').replace('Primavera/Estate', 'PE');
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target) && !popover.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 12;
      const width = Math.min(320, window.innerWidth - margin * 2);
      const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
      const below = window.innerHeight - rect.bottom - 16;
      const top = below >= 260 ? rect.bottom + 8 : Math.max(margin, rect.top - Math.min(440, window.innerHeight - margin * 2));
      setPopoverStyle({ left, top, width, maxHeight: Math.max(220, window.innerHeight - top - margin) });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true); };
  }, [open]);
  return <div className="dw-switcher" ref={root}>
    <button type="button" ref={trigger} className="dw-workspace-trigger" aria-label={selected ? `Cambia capo: ${data.title}` : 'Seleziona il capo'} aria-expanded={open} aria-controls={open ? 'style-switcher' : undefined} onClick={() => { setOpen(!open); setQuery(''); }}>
      {selected && <span className="dw-workspace-photo"><ProductPhoto variant={data.variant} sizes="48px" alt="" /></span>}
      <span className="dw-workspace-name"><strong title={selected ? data.title : 'Seleziona il capo'}>{selected ? data.title : 'Seleziona il capo'}</strong><small title={selected ? data.collection : 'Scegli un capo per iniziare'}>{selected ? <>{data.identityAssigned ? data.styleId : 'Bozza'}{activeProduct.variants.length > 1 && ` · ${data.variant}`}<span aria-hidden="true"> · </span>{season(data.collection)}</> : 'Scegli un capo per iniziare'}</small></span>
      <span className="dw-workspace-chevron"><Icon name="chevron" size={14} /></span>
    </button>
    {open && popoverStyle && createPortal(<div id="style-switcher" className="dw-switcher dw-workspace-popover dw-switcher-portal" ref={popover} role="region" aria-label="Seleziona il capo" style={popoverStyle}>
      <div className="dw-switcher-heading"><div><strong>Seleziona un capo</strong><small>{products.length} {products.length === 1 ? 'capo disponibile' : 'capi disponibili'}</small></div></div>
      <div className="dw-popover-search"><Icon name="search" size={16} /><input autoFocus aria-label="Cerca capo" placeholder="Nome, codice o collezione…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div className="dw-style-list">{matchingStyles.map(item => <button type="button" key={item.styleId} aria-pressed={selected && item.styleId === data.styleId} onClick={() => { selectStyle(productVariantId(item, query)); setOpen(false); trigger.current?.focus(); onSelect?.(); }}>
        <span className="dw-style-thumb"><ProductPhoto product={item} sizes="48px" alt="" /></span>
        <span className="dw-style-description"><strong title={item.title}>{item.title}</strong><small>{item.identityAssigned ? item.productId : 'Bozza'} · {item.variants.length > 1 ? `${item.variants.length} varianti` : item.variant}</small><span>{season(item.collection)}</span></span>
        {selected && item.styleId === data.styleId && <span className="dw-style-selected" aria-label="Capo selezionato"><Icon name="check" size={12} /></span>}
      </button>)}{!matchingStyles.length && <Empty>Nessun capo trovato. Prova un altro nome o codice.</Empty>}</div>
      {selected && activeProduct.variants.length > 1 && <div className="dw-switcher-footer"><Field label="Variante · colore e materiale"><select value={data.styleId} onChange={event => { selectStyle(event.target.value); setOpen(false); trigger.current?.focus(); }}>{activeProduct.variants.map(item => <option key={item.styleId} value={item.styleId}>{item.variant} · {item.materialName.split(' · ')[0]}</option>)}</select></Field></div>}
      <div className="dw-switcher-footer"><button type="button" className="dw-create-style" onClick={() => { setOpen(false); onCreate(); }}><Icon name="plus" size={16} />Nuovo capo<Icon name="arrow" size={14} /></button></div>
    </div>, root.current?.closest('.dw-app') || document.body)}
  </div>;
}

export function CreateStyleDialog({ onClose, onCreated }) {
  const { data, styles, createStyle } = useDemo();
  const next = Math.max(420, ...styles.map(item => Number(item.styleId.match(/\d+$/)?.[0]) || 0)) + 1;
  const [draft, setDraft] = useState({ title: '', styleId: `MG-${String(next).padStart(4, '0')}`, collection: data.collection, quantity: 300, copy: false });
  const [error, setError] = useState('');
  return <Dialog title="Nuovo capo" note="Atelier · crea uno spazio per il prossimo prodotto" onClose={onClose}><form className="dw-stack" onSubmit={event => { event.preventDefault(); if (!createStyle(draft)) { setError('Verifica nome, collezione, quantità e codice: il codice deve essere univoco.'); return; } onCreated(); }}>
    <Field label="Nome del capo"><input data-autofocus required maxLength={80} pattern=".*\S.*" placeholder="Es. Maglia Essential" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></Field>
    <div className="dw-two"><Field label="Codice riservato" hint="Diventa lo Style ID al caricamento dello schizzo."><input required maxLength={24} pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*" value={draft.styleId} onChange={e => { setDraft({ ...draft, styleId: e.target.value.toUpperCase() }); setError(''); }} /></Field><Field label="Quantità prevista"><input required type="number" min={draft.copy ? minQuantity(data) : 1} max="10000" step="1" value={draft.quantity} onChange={e => setDraft({ ...draft, quantity: e.target.value })} /></Field></div>
    <Field label="Collezione"><input required maxLength={80} pattern=".*\S.*" value={draft.collection} onChange={e => setDraft({ ...draft, collection: e.target.value })} /></Field>
    <label className="dw-check"><input type="checkbox" checked={draft.copy} onChange={e => setDraft({ ...draft, copy: e.target.checked, quantity: e.target.checked ? Math.max(Number(draft.quantity), minQuantity(data)) : draft.quantity })} />Duplica specifiche e ordini di {data.title}</label>
    <p className="dw-muted">Il modello base è una maglia: misure, filato e lavorazioni sono precompilati e modificabili. I nuovi capi restano disponibili durante questa sessione demo.</p>
    {error && <p className="dw-error" role="alert">{error}</p>}
    <div className="dw-dialog-actions"><Button onClick={onClose}>Annulla</Button><Button primary icon="plus" type="submit">Crea capo</Button></div>
  </form></Dialog>;
}

export function WorkspaceSearch({ onNavigate, onOpenPage, onClose }) {
  const { data, products: allProducts, selectStyle } = useDemo(); const [query, setQuery] = useState('');
  const results = useRef(null);
  const matches = text => text.toLowerCase().includes(query.toLowerCase());
  const pages = [['home', 'Home', 'home'], ['inbox', 'Inbox', 'inbox'], ['my-tasks', 'Le mie attività', 'list'], ['notifications', 'Notifiche', 'bell'], ['capi', 'Capi', 'shirt'], ['activity', 'Attività della filiera', 'activity'], ['settings', 'Impostazioni', 'settings'], ['profile', 'Il tuo profilo', 'user']].filter(([, title]) => matches(title));
  const rows = moduleGroups[0].items.map(item => item.id === 21 ? { ...item, title: 'Panoramica del capo' } : item).sort((a, b) => Number(b.id === 21) - Number(a.id === 21)).filter(item => matches(item.title) || item.id === 21 && matches('Context Engine Digital Twin'));
  const products = allProducts.filter(item => matches(productSearchText(item)));
  function moveResult(event) {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const buttons = [...(results.current?.querySelectorAll('button') || [])];
    if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement);
    buttons[(current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus();
  }
  return <Dialog instant title="Cerca in Atelier" note="Apri una pagina, un modulo oppure cambia capo" onClose={onClose}>
    <div className="dw-command-search"><Icon name="search" size={18} /><input data-autofocus aria-label="Cerca pagine, moduli e capi" placeholder="Pagine, moduli, codici, capi…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={event => { if (['ArrowDown', 'Tab'].includes(event.key) && !event.shiftKey) { const first = results.current?.querySelector('button'); if (first) { event.preventDefault(); first.focus(); } } }} /></div>
    <div className="dw-command-results" ref={results} onKeyDown={moveResult}>
      {pages.length > 0 && <><span className="dw-eyebrow">Spazio di lavoro</span>{pages.map(([id, label, icon]) => <button key={id} onClick={() => { onOpenPage(id); onClose(); }}><Icon name={icon} size={16} /><span>{label}</span><Icon name="arrow" size={14} /></button>)}</>}
      {rows.length > 0 && <><span className="dw-eyebrow">Moduli · {data.title}</span>{rows.map(item => <button key={item.id} onClick={() => { onNavigate(item.id); onClose(); }}><Icon name={item.id === 21 ? 'home' : 'grid'} size={16} /><span>{item.title}</span><Icon name="arrow" size={14} /></button>)}</>}
      {products.length > 0 && <><span className="dw-eyebrow">Capi</span>{products.map(item => <button key={item.styleId} onClick={() => { selectStyle(productVariantId(item, query)); onNavigate(21); onClose(); }}><Icon name="shirt" size={16} /><span>{item.title} <small>{item.identityAssigned ? item.productId : 'Bozza'}{item.variants.length > 1 && ` · ${item.variants.length} varianti`}</small></span>{item.styleId === data.styleId && <Icon name="check" size={14} />}</button>)}</>}
      {!pages.length && !rows.length && !products.length && <Empty>Nessun risultato per “{query}”.</Empty>}
    </div>
  </Dialog>;
}
