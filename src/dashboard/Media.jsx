import React, { useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { Dialog, Icon } from './ui.jsx';
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

export function ReferenceFile({ asset, note }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="dw-reference-row" onClick={() => setOpen(true)}><MediaImage asset={asset} sizes="56px" /><span><strong>{media[asset].name}</strong><small>{note || 'WebP · visuale di riferimento'}</small></span><Icon name="eye" size={16} /></button>{open && <MediaViewer item={{ asset }} onClose={() => setOpen(false)} />}</>;
}
