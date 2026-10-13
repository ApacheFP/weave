import React, { useState } from 'react';
import { modules } from '../modules.js';
import { useDemo } from './DemoContext.jsx';
import { csv, techPack } from './exportFiles.js';
import { euro, number, retailAvailable, wholesaleAvailable } from './domain.js';
import { localDate } from './workspaceData.js';
import { Badge, Button, Card, Empty, Field, Icon, Metrics, Progress } from './ui.jsx';
import { markerConfiguration, materialUnit, piecesFor, productMedia, productSizes, productSpec } from './productData.js';
import TechnicalDrawing from './TechnicalDrawing.jsx';
import { technicalDefaults, versionSnapshot } from './technicalData.js';
import { MediaImage, ProductPhoto, fabricAsset } from './Media.jsx';

export const serviceMap = {
  1: [16, 17, 20], 2: [20], 3: [14, 20], 4: [8, 20], 5: [20], 6: [8, 20], 7: [8, 20],
  9: [8, 15, 16, 17, 20], 10: [8, 15, 16, 20], 11: [14, 15, 20], 12: [8, 14, 15, 20], 13: [8, 14, 20],
  19: [14, 15, 16, 17, 18, 20], 21: [8, 14, 15, 16, 17, 18], 22: [],
};
const aiOutputs = { 1: 'Moodboard e palette di direzione', 2: 'Disegno tecnico e punti di misura', 3: 'Distinta base con consumi', 4: 'Cartamodello digitale', 5: 'Sviluppo taglie', 6: 'Report di fitting', 7: 'Marker ottimizzato', 9: 'Tre scenari di costo', 10: 'Bozza del piano produttivo', 11: 'Fabbisogni e ordini di acquisto', 12: 'Report di avanzamento', 13: 'Evidenze di controllo qualità', 19: 'Bozza del passaporto digitale' };

export function ServiceStrip({ moduleId, onOpen }) {
  const list = serviceMap[moduleId] || [];
  if (!list.length) return null;
  return <section className="dw-service-strip"><div><span className="dw-eyebrow">Dentro questo modulo</span><h2>Servizi connessi</h2></div><div>{list.map(id => <button key={id} onClick={() => onOpen(id)}><Icon name={id === 20 ? 'chat' : id === 8 ? 'clock' : 'layers'} size={16} /><span>{modules.find(m => m.id === id).title.replace(' e AI Specialistica', '').replace(' e Inventory', '')}</span><Icon name="arrow" size={14} /></button>)}</div></section>;
}

function Industrialization() {
  const { data, saveIndustrialCycle, notify } = useDemo();
  const [minutes, setMinutes] = useState(data.laborMinutes);
  const spec = productSpec(data), operations = spec.operations, totalMinutes = operations.reduce((sum, row) => sum + row[2], 0);
  return <><Metrics items={[["Operazioni", operations.length, `${operations.length} gruppi di lavorazione`], ['Tempo standard', `${data.laborMinutes} min`, 'per capo'], ['Modello', `v${data.modelVersion}`, data.sampleApproved ? 'Campione approvato' : 'Campione in verifica']]} /><Card title="Ciclo di confezione" note={`${data.title} · ${data.styleId} · sequenza industriale`}><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Sequenza</th><th>Lavorazione</th><th>Macchina</th><th>Minuti standard</th></tr></thead><tbody>{operations.map(([name, machine, time], i) => <tr key={name}><td>{String(i + 1).padStart(2, '0')}</td><td>{name}</td><td>{machine}</td><td>{number(time * data.laborMinutes / totalMinutes, 1)}</td></tr>)}</tbody></table></div><form className="dw-inline-form" onSubmit={e => { e.preventDefault(); saveIndustrialCycle({ laborMinutes: Number(minutes) }, 'Tempo standard aggiornato: ' + minutes + ' minuti', 8); }}><Field label="Tempo totale (min/capo)"><input type="number" min="1" max="240" required value={minutes} onChange={e => setMinutes(e.target.value)} /></Field><Button primary type="submit">Salva ciclo</Button><Button icon="download" onClick={() => { csv(`${data.styleId}-ciclo.csv`, [['Lavorazione', 'Macchina', 'Minuti standard'], ...operations.map(([name, machine, time]) => [name, machine, number(time * data.laborMinutes / totalMinutes, 1)])]); notify('Ciclo produttivo esportato'); }}>Esporta</Button></form></Card></>;
}
function Inventory({ moduleId }) {
  const { data, stock, shipped, fabric, saveInventoryLocation } = useDemo();
  const [location, setLocation] = useState(data.location || 'C-12');
  const materialView = [3, 11].includes(moduleId);
  const fabricPurchased = data.quantity * data.consumption;
  const sizes = productSizes(data), unit = materialUnit(data);
  const base = Math.floor(stock / sizes.length);
  return <><Metrics items={materialView ? [[`${productSpec(data).materialLabel} residuo`, `${number((data.quantity - data.produced) * data.consumption, 1)} ${unit}`, fabric.code], ['Fabbisogno ordine', `${number(fabricPurchased, 1)} ${unit}`, `${data.quantity} capi`], ['Lotto', `${data.fabricLot}`, fabric.supplier]] : [['Disponibile', stock, 'approvati meno capi distribuiti'], ['Lotto', `${data.lotId}`, `${data.styleId} · ${sizes.length} taglie`], ['Rilavorazioni', data.reworks, 'escluse dallo stock']]} /><Card title={materialView ? 'Scorte per la distinta base' : 'Stock per taglia'}><div className="dw-table-wrap"><table className="dw-table"><thead><tr>{(materialView ? ['Materiale', 'Lotto', 'Fabbisogno', 'Residuo teorico'] : ['SKU / Taglia', 'Ubicazione', 'Disponibile', 'Stato']).map(t => <th key={t}>{t}</th>)}</tr></thead><tbody>{materialView ? <><tr><td>{fabric.name}</td><td>{data.fabricLot}</td><td>{number(fabricPurchased, 1)} {unit}</td><td>{number((data.quantity - data.produced) * data.consumption, 1)} {unit}</td></tr>{data.trims.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.code}-A</td><td>{number(row.qty * data.quantity, 1)} {row.unit}</td><td>{number(row.qty * (data.quantity - data.produced), 1)} {row.unit}</td></tr>)}</> : sizes.map((size, i) => <tr key={size}><td>{data.styleId} / {size}</td><td>{data.location || 'C-12'}</td><td>{i === sizes.length - 1 ? stock - base * (sizes.length - 1) : base}</td><td><Badge>Disponibile</Badge></td></tr>)}</tbody></table></div><p className="dw-muted">{materialView ? 'Il residuo teorico segue consumo unitario e quantità ancora da produrre. I lotti sono dimostrativi.' : `Ricevuti ${data.produced - data.reworks} capi approvati; ${shipped} wholesale e ${data.retailSold} retail già distribuiti. Nuove produzioni e spedizioni aggiornano lo stock.`}</p><form className="dw-inline-form" onSubmit={e => { e.preventDefault(); saveInventoryLocation({ location: location.trim() }, 'Ubicazione aggiornata: ' + location.trim(), 14); }}><Field label="Ubicazione"><input value={location} onChange={e => setLocation(e.target.value)} required maxLength={20} pattern=".*\S.*" /></Field><Button primary type="submit">Sposta ubicazione</Button></form></Card></>;
}
function Logistics({ moduleId }) {
  const { data, stock, createShipment, confirmShipment } = useDemo();
  const [qty, setQty] = useState(10);
  const [orderId, setOrderId] = useState(() => data.wholesaleOrders.find(o => o.qty > o.shipped)?.id || '');
  const pending = data.wholesaleOrders.filter(o => o.qty > o.shipped);
  const currentOrderId = pending.some(o => o.id === orderId) ? orderId : pending[0]?.id || '';
  const chosen = pending.find(o => o.id === currentOrderId);
  const max = Math.min(stock, chosen ? chosen.qty - chosen.shipped : 0);
  return <><Metrics items={[["Tracking", data.shipments[0]?.id || 'Da creare', `Magazzino → Hub → ${data.shipments[0]?.client || 'Retailer'}`], ['Costo unitario', euro(data.logisticsCost), moduleId === 9 ? 'Incluso nel costo industriale' : 'Corriere espresso · 2 giorni'], ['Spedibile', stock, 'capi disponibili in magazzino']]} /><Card title="Spedizioni del capo"><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Tracking</th><th>Destinazione</th><th>Capi</th><th>Stato</th><th /></tr></thead><tbody>{data.shipments.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.client}</td><td>{row.qty}</td><td><Badge>{row.status}</Badge></td><td>{row.status === 'In consegna' && <Button onClick={() => confirmShipment(row.recordId || row.id)}>Conferma consegna</Button>}</td></tr>)}</tbody></table></div><div className="dw-custody"><span><Icon name="box" />Magazzino C-12</span><Icon name="arrow" /><span>Hub Firenze</span><Icon name="arrow" /><span>Retailer</span></div>{pending.length > 0 && <form className="dw-inline-form" onSubmit={e => { e.preventDefault(); createShipment({ orderId: currentOrderId, quantity: qty }); }}><Field label="Ordine da evadere"><select value={currentOrderId} onChange={e => setOrderId(e.target.value)}>{pending.map(o => <option key={o.id} value={o.id}>{o.client} · {o.id}</option>)}</select></Field><Field label={`Quantità · max ${max}`}><input type="number" min="1" max={max || 1} required value={qty} onChange={e => setQty(e.target.value)} /></Field><Button primary type="submit" disabled={!max}>Crea spedizione</Button></form>}</Card></>;
}
function Wholesale({ moduleId }) {
  const { data, createWholesaleOrder } = useDemo();
  const [client, setClient] = useState('Atelier H');
  const [qty, setQty] = useState(30);
  const ordered = data.wholesaleOrders.reduce((sum, o) => sum + o.qty, 0);
  const available = wholesaleAvailable(data);
  return <><Metrics items={[["Ordini B2B", ordered, 'capi impegnati'], ['Listino wholesale', euro(data.wholesale), 'AI 2027 · pagamento 60 giorni'], ['Valore ordini', euro(ordered * data.wholesale), moduleId === 1 ? 'Segnale di domanda per il concept' : 'Ordini confermati']]} /><Card title="Retailer e ordini"><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Ordine</th><th>Cliente</th><th>Capi</th><th>Spediti</th><th>Valore</th><th>Stato</th></tr></thead><tbody>{data.wholesaleOrders.map(o => <tr key={o.id}><td>{o.id}</td><td>{o.client}</td><td>{o.qty}</td><td>{o.shipped}</td><td>{euro(o.qty * data.wholesale)}</td><td><Badge>{o.status}</Badge></td></tr>)}</tbody></table></div><form className="dw-inline-form" onSubmit={e => { e.preventDefault(); createWholesaleOrder({ client, quantity: qty }); }}><Field label="Retailer"><input value={client} onChange={e => setClient(e.target.value)} required maxLength={80} pattern=".*\S.*" /></Field><Field label={`Capi · ${available} ordinabili`}><input type="number" min="1" max={available || 1} value={qty} onChange={e => setQty(e.target.value)} required /></Field><Button primary type="submit" disabled={!available}>Aggiungi ordine</Button></form></Card></>;
}
function Retail({ moduleId }) {
  const { data, saveRetailPrice, recordRetailSale } = useDemo();
  const available = retailAvailable(data);
  const [price, setPrice] = useState(data.retail);
  return <><Metrics items={[["Venduti retail", data.retailSold, `${data.styleId} · canale B2C`], ['Prezzo medio', euro(data.retailAverage), `Listino ${euro(data.retail)}`], ['Feedback', `${data.retailFeedback} / 5`, productSpec(data).fit]]} /><Card title={moduleId === 1 ? 'Segnali dal mercato' : 'Performance retail'}><div className="dw-retail-summary"><ProductPhoto sizes="160px" /><div><h3>{data.title}</h3><p>{productSpec(data).retailNote}</p><Progress label="Sell-through campagna retail" value={data.retailSold / (data.retailTarget || 320) * 100} /><p className="dw-muted">Sell-through: {number(data.retailSold / (data.retailTarget || 320) * 100, 1)}% su {data.retailTarget || 320} articoli obiettivo di campagna.</p></div></div><form className="dw-inline-form" onSubmit={e => { e.preventDefault(); saveRetailPrice({ retail: Number(price) }, 'Listino retail aggiornato: ' + euro(Number(price)), 17); }}><Field label="Listino retail (€)"><input type="number" min="1" max="3000" value={price} onChange={e => setPrice(e.target.value)} required /></Field><Button primary type="submit">Aggiorna prezzo</Button><Button disabled={available < 1} onClick={() => recordRetailSale()}>Simula una vendita</Button></form></Card></>;
}
export function Lifecycle() {
  const { data, recordLifecycleEvent } = useDemo();
  const [type, setType] = useState('Riparazione'); const [note, setNote] = useState(''); const [date, setDate] = useState(() => localDate());
  return <Card title="La vita continua" note="Eventi effettivi e scenari futuri restano distinti"><div className="dw-event-list">{data.lifecycle.map(row => <div key={row.id}><span className="dw-event-dot" /><div><strong>{row.type}</strong><p>{row.note}</p><small>{new Date(row.date + 'T12:00:00').toLocaleDateString('it-IT')}{row.future && ' · Scenario futuro'}</small></div></div>)}</div><form className="dw-stack" onSubmit={e => { e.preventDefault(); if (recordLifecycleEvent({ type, note, date })) setNote(''); }}><div className="dw-two"><Field label="Tipo evento"><select value={type} onChange={e => setType(e.target.value)}>{['Riparazione', 'Reso', 'Seconda vita', 'Riciclo'].map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Data"><input type="date" required value={date} onChange={e => setDate(e.target.value)} /></Field></div><Field label="Descrizione"><textarea value={note} onChange={e => setNote(e.target.value)} required maxLength={500} rows={2} placeholder="Intervento, condizioni del capo, operatore…" /></Field><Button primary type="submit" disabled={!note.trim()} icon="plus">Registra evento</Button></form></Card>;
}
function Intelligence({ moduleId }) {
  const { data, fabric, materials, cost, suggestedWholesale, generateDemoOutput, notify, productDirection } = useDemo();
  const spec = productSpec(data), unit = materialUnit(data), sizes = productSizes(data), pieces = piecesFor(data);
  const snapshot = data.technical?.versions.find(version => version.id === data.technical.approvedId)?.snapshot || data.technical?.versions.at(-1)?.snapshot || versionSnapshot(data, data.technical || technicalDefaults(data));
  const output = moduleId === 5 && data.category === 'bag' ? 'Scheda dimensionale' : moduleId === 7 && data.category === 'knit' ? 'Piano pannelli e filato' : aiOutputs[moduleId] || 'Dati della filiera';
  const results = {
    1: [['Capo', data.title], ['Direzione', productDirection.moodboard.some(item => item.atmosphere) ? 'Moodboard e palette disponibili' : 'Facoltativa · non generata'], ['Stato', data.sketchFile ? 'Schizzo caricato' : 'Spunti facoltativi']],
    2: data.measurements.map(row => [row.point, number(row.value, 1) + ' cm']),
    3: [[spec.materialLabel, fabric.name], ['Consumo', number(data.consumption, 2) + ' ' + unit], ['Distinta completa', euro(materials)]],
    4: [['Modello', 'v' + data.modelVersion], ['Pezzi', pieces.map(piece => `${piece.name} ×${piece.qty}`).join(', ')], ['Margine', data.seam + ' cm']],
    5: [['Taglie', sizes.join(' / ')], ['Sviluppo', spec.gradeIndex === null ? 'Dimensione unica' : data.measurements[spec.gradeIndex].point + ' +' + data.gradingChest + ' cm'], ['Base', String(spec.baseSize)]],
    6: [['Verifiche', data.sampleChecks.filter(Boolean).length + ' / 3'], ['Verifiche richieste', spec.checks.join('; ')], ['Campione', data.sampleApproved ? 'Approvato' : 'In revisione']],
    7: [[data.category === 'knit' ? 'Finezza' : 'Larghezza', data.category === 'knit' ? '7 · Nm 2/28' : data.markerWidth + ' cm'], ['Consumo / capo', number(data.consumption, 2) + ' ' + unit], ['Scarto teorico', data.waste + '%']],
    9: [['Costo industriale', euro(cost)], ['Wholesale proposto', euro(suggestedWholesale)], ['Retail proposto', euro(suggestedWholesale * 2)]],
    10: [['Ordine', data.quantity + ' capi'], ['Laboratorio', data.factory], ['Periodo', data.start + ' → ' + data.end]],
    11: [['Fabbisogno materiale', number(data.quantity * data.consumption, 1) + ' ' + unit], ['Fornitore', fabric.supplier], ['Ordini', String(data.purchaseOrders.length)]],
    12: [['Completati', data.produced + ' / ' + data.quantity], ['Rilavorazioni', String(data.reworks)], ['Scarto reale', data.actualWaste + '%']],
    13: [['Esito', data.qualityResolved ? 'Conforme' : 'Non conforme'], ['Punteggio', data.qualityScore + ' / 100'], ['Evidenza', spec.quality.id + ' · ' + spec.quality.title]],
    19: [['Identità', `${data.styleId}`], ['Composizione', fabric.composition], ['Origine / Lotto', fabric.origin + ` / ${data.lotId}`]],
  }[moduleId] || [['Identità', `${data.styleId}`]];
  // Prepared outputs are regenerated locally; decisions belong to the assistant.
  function generate() {
    generateDemoOutput(previous => ({ aiRuns: { ...previous.aiRuns, [moduleId]: (previous.aiRuns[moduleId] || 0) + 1 }, ...(moduleId === 7 && !previous.optimized ? markerConfiguration(previous, previous.markerWidth, true) : {}) }), output + ': output aggiornato', moduleId);
  }
  return <Card title="Automatizzato con AI" note={`Specialista per ${modules.find(m => m.id === moduleId)?.title.toLowerCase()}`}><div className="dw-ai-output">{[2, 3, 4, 5, 6, 7, 13, 19].includes(moduleId) ? [2, 19].includes(moduleId) ? <div className="dw-media-image"><TechnicalDrawing snapshot={snapshot} exportMode /></div> : <MediaImage asset={{ 3: fabricAsset(data.fabricId), 4: pieces[0].asset, 5: productMedia(data, 'grading'), 6: productMedia(data, 'sample'), 7: productMedia(data, data.optimized ? 'marker-optimized' : 'marker-base'), 13: productMedia(data, 'quality') }[moduleId]} sizes="160px" /> : <span className="dw-output-icon"><Icon name="file" size={28} /></span>}<div><Badge>Output preparato</Badge><h3>{output}</h3><p>Input: {data.styleId} · modello v{data.modelVersion} · distinta base corrente. Il risultato compare nello spazio di lavoro e alimenta la storia del capo.</p><small>Generazioni nella sessione: {data.aiRuns[moduleId] || 0}</small></div></div><table className="dw-table dw-ai-results"><tbody>{results.map(([name, value]) => <tr key={name}><td>{name}</td><td>{value}</td></tr>)}</tbody></table><div className="dw-actions"><Button primary onClick={generate}>Genera output demo</Button><Button icon="download" onClick={() => { if (moduleId === 2) techPack(data); else csv(`${data.styleId}-output-${moduleId}.csv`, [['Dato', 'Valore'], ['Capo', `${data.styleId}`], ['Output', output], ...results]); notify('Output esportato'); }}>Esporta scheda output</Button></div><p className="dw-muted">Risultati simulati. Per scenari e decisioni usa l’assistente del modulo.</p></Card>;
}
export function ServiceContent({ serviceId, moduleId }) {
  switch (serviceId) {
    case 8: return <Industrialization />;
    case 14: return <Inventory moduleId={moduleId} />;
    case 15: return <Logistics moduleId={moduleId} />;
    case 16: return <Wholesale moduleId={moduleId} />;
    case 17: return <Retail moduleId={moduleId} />;
    case 18: return <Lifecycle />;
    case 20: return <Intelligence moduleId={moduleId} />;
    default: return <Empty>Nessun servizio disponibile.</Empty>;
  }
}
