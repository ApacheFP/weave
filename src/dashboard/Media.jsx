import React, { useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { Card, Dialog, Empty, Icon, Tabs } from './ui.jsx';
import { additionalFabrics, categorySpecs, productMedia } from './productData.js';

const root = '/images/dashboard/';
export const media = {};
const roleNames = { front: 'Fronte', back: 'Retro', sketch: 'Schizzo designer', fabric: 'Materiale principale', trims: 'Accessori e finiture', sample: 'Campione atelier', quality: 'Evidenza qualità' };
for (const spec of Object.values(categorySpecs).filter(item => item.prefix)) {
  for (const [role, name] of Object.entries(roleNames)) media[`${spec.prefix}-${role}`] = { name: `${spec.label} · ${name}`, kind: ['fabric', 'trims'].includes(role) ? 'Materiali' : role === 'sketch' ? 'Tavole' : 'Foto', alt: `${name} del ${spec.label.toLowerCase()} della capsule Atelier` };
  const documents = [['pattern', 'Modello base'], ...spec.pieces.map(([name, key]) => [`pattern-${key}`, name]), ...(spec.label === 'Borsa' ? [] : [['grading', 'Sviluppo taglie']]), ...(spec.label === 'Maglia' ? [] : [['marker-base', 'Piazzamento base'], ['marker-optimized', 'Piazzamento ottimizzato']])];
  for (const [key, name] of documents) media[`${spec.prefix}-${key}`] = { name: `${spec.label} · ${name}`, kind: 'Tavole', format: 'SVG', alt: `Tavola vettoriale ${name.toLowerCase()} del ${spec.label.toLowerCase()}` };
}
for (const color of ['salvia', 'grafite']) for (const [role, name] of Object.entries(roleNames)) {
  media[`knit-${color}-${role}`] = { ...media[`knit-${role}`], name: `Maglia Luce · ${color} · ${name}`, alt: `${name} della Maglia Luce nella variante ${color}` };
}
export const fabricAsset = id => additionalFabrics.find(item => item.id === id)?.asset;
export const productAsset = (product, back = false) => productMedia(product, back ? 'back' : 'front');
export const mediaSrc = key => `${root}${key}.${media[key]?.format === 'SVG' ? 'svg' : 'webp'}`;
const mediaSrcSet = key => media[key]?.format === 'SVG' ? undefined : `${root}${key}-thumb.webp 480w, ${mediaSrc(key)} 1120w`;

export function MediaImage({ asset, className = '', alt, ...props }) {
  return <img className={`dw-media-image ${className}`} src={mediaSrc(asset)} srcSet={mediaSrcSet(asset)} sizes="(max-width: 760px) 100vw, 640px" alt={alt ?? media[asset]?.alt ?? ''} loading="lazy" decoding="async" {...props} />;
}
export function ProductPhoto({ product, variant, back = false, ...props }) {
  const { data } = useDemo();
  return <MediaImage asset={productAsset(product || { ...data, variant: variant || data.variant }, back)} {...props} />;
}

export function MediaViewer({ item, onClose }) {
  const { data } = useDemo();
  const src = item.src || mediaSrc(item.asset);
  const name = item.name || media[item.asset]?.name || item.asset;
  return <Dialog wide title={name} note={`${data.title} / ${data.styleId}`} onClose={onClose}>
    <div className="dw-media-viewer"><div className="dw-media-viewer-image"><img src={src} alt={item.alt || media[item.asset]?.alt || name} /></div><aside>
      <span className="dw-eyebrow">Scheda del file</span><h3>{name}</h3><dl className="dw-kv"><dt>Categoria</dt><dd>{item.kind || media[item.asset]?.kind}</dd><dt>Capo</dt><dd>{data.styleId}</dd><dt>Collezione</dt><dd>{data.collection}</dd><dt>Formato</dt><dd>{item.src ? 'Immagine caricata' : media[item.asset]?.format || 'WebP'}</dd><dt>Origine</dt><dd>{item.src ? 'Caricamento del team' : 'Visuale generata · demo'}</dd></dl>
      <a className="dw-btn" href={src} download={item.src ? name : `${item.asset}.${media[item.asset]?.format === 'SVG' ? 'svg' : 'webp'}`}><Icon name="download" size={16} />Scarica immagine</a>
    </aside></div>
  </Dialog>;
}

// Prova2 MediaBrowser: ruled toolbar, category tabs, grid/table views,
// thumbnail + file metadata, preview/download actions and a results footer.
export function MediaBoard({ title = 'Riferimenti del capo', note, items, actions, onRemove }) {
  const [view, setView] = useState('Griglia'); const [kind, setKind] = useState('Tutti'); const [query, setQuery] = useState('');
  const [opened, setOpened] = useState(null); const [ascending, setAscending] = useState(true);
  const files = items.map(item => ({ ...media[item.asset], ...item }));
  const shown = files.filter(item => (kind === 'Tutti' || item.kind === kind) && item.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, 'it') * (ascending ? 1 : -1));
  const categories = ['Tutti', ...new Set(files.map(item => item.kind))];
  const thumb = item => <img src={item.src || mediaSrc(item.asset)} srcSet={item.src ? undefined : mediaSrcSet(item.asset)} sizes={view === 'Elenco' ? '56px' : '(max-width: 560px) 45vw, 240px'} alt={item.alt || item.name} loading="lazy" decoding="async" />;
  const fileActions = item => <div className="dw-media-file-actions"><button type="button" className="dw-icon-btn" onClick={() => setOpened(item)} aria-label={`Anteprima ${item.name}`}><Icon name="eye" size={16} /></button><a className="dw-icon-btn" href={item.src || mediaSrc(item.asset)} download={item.src ? item.name : `${item.asset}.${media[item.asset]?.format === 'SVG' ? 'svg' : 'webp'}`} aria-label={`Scarica ${item.name}`}><Icon name="download" size={16} /></a>{item.id && onRemove && <button type="button" className="dw-icon-btn" onClick={() => onRemove(item.id)} aria-label={`Rimuovi ${item.name}`}><Icon name="close" size={16} /></button>}</div>;
  return <><Card flush title={title} note={note} actions={actions}>
    <div className="dw-media-bar"><select className="dw-media-kind-select" aria-label="Filtra per categoria" value={kind} onChange={event => setKind(event.target.value)}>{categories.map(category => <option key={category} value={category}>{category === 'Tutti' ? 'Tutte le categorie' : category}</option>)}</select><div className="dw-media-tools"><label className="dw-media-search"><Icon name="search" size={16} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} aria-label="Cerca riferimento" placeholder="Cerca un file…" /></label><Tabs items={['Griglia', 'Elenco']} selected={view} onChange={setView} label="Visualizzazione dei riferimenti" /></div></div>
    {!shown.length ? <Empty>Nessun riferimento corrisponde alla ricerca.</Empty> : view === 'Griglia' ? <div className="dw-media-grid">{shown.map(item => <article className="dw-media-file" key={item.id || item.asset}><button type="button" className="dw-media-preview" onClick={() => setOpened(item)} aria-label={`Apri ${item.name}`}>{thumb(item)}</button><div className="dw-media-meta"><strong>{item.name}</strong><small>{item.kind} · {item.src ? 'Caricato dal team' : item.format || 'WebP'}</small></div>{fileActions(item)}</article>)}</div> : <div className="dw-table-wrap"><table className="dw-table dw-media-table"><thead><tr><th aria-label="Anteprima" /><th><button type="button" className="dw-sort-btn" onClick={() => setAscending(!ascending)}>Nome <Icon name="chevrons" size={12} /></button></th><th>Categoria</th><th>Formato</th><th aria-label="Azioni" /></tr></thead><tbody>{shown.map(item => <tr key={item.id || item.asset}><td><button type="button" className="dw-media-mini" onClick={() => setOpened(item)} aria-label={`Apri ${item.name}`}>{thumb(item)}</button></td><td><strong>{item.name}</strong><small>{item.src ? 'Caricato dal team' : 'Visuale demo'}</small></td><td>{item.kind}</td><td>{item.src ? 'Upload' : item.format || 'WebP'}</td><td>{fileActions(item)}</td></tr>)}</tbody></table></div>}
    <footer className="dw-board-foot"><span>{shown.length} di {files.length} riferimenti</span><span>Atelier / libreria del capo</span></footer>
  </Card>{opened && <MediaViewer item={opened} onClose={() => setOpened(null)} />}</>;
}

export function ReferenceFile({ asset, note }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="dw-reference-row" onClick={() => setOpen(true)}><MediaImage asset={asset} sizes="56px" /><span><strong>{media[asset].name}</strong><small>{note || 'WebP · visuale di riferimento'}</small></span><Icon name="eye" size={16} /></button>{open && <MediaViewer item={{ asset }} onClose={() => setOpen(false)} />}</>;
}
