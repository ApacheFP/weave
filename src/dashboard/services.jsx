import React, { useState } from 'react';
import { modules } from '../modules.js';
import { csv, euro, number, operations, sizes, useDemo } from './DemoContext.jsx';
import { Artwork, Badge, Button, Card, Empty, Field, Icon, Metrics, Progress } from './ui.jsx';

export const serviceMap = {
  1: [16, 17, 20], 2: [20], 3: [14, 20], 4: [8, 20], 5: [20], 6: [8, 20], 7: [8, 20],
  9: [8, 15, 16, 17, 20], 10: [8, 15, 16, 20], 11: [14, 15, 20], 12: [8, 14, 15, 20], 13: [8, 14, 20],
  19: [14, 15, 16, 17, 18, 20], 21: [8, 14, 15, 16, 17, 18], 22: [],
};
const aiOutputs = { 1: 'Tre varianti di concept', 2: 'Disegno tecnico e punti di misura', 3: 'Distinta base con consumi', 4: 'Cartamodello digitale', 5: 'Sviluppo delle sei taglie', 6: 'Report di fitting', 7: 'Marker ottimizzato', 9: 'Tre scenari di costo', 10: 'Bozza del piano produttivo', 11: 'Fabbisogni e ordini di acquisto', 12: 'Report di avanzamento', 13: 'Evidenze di controllo qualità', 19: 'Bozza del passaporto digitale' };

export function ServiceStrip({ moduleId, onOpen }) {
  const list = serviceMap[moduleId] || [];
  if (!list.length) return null;
  return <section className="dw-service-strip"><div><span className="dw-eyebrow">Dentro questo modulo</span><h2>Servizi connessi</h2></div><div>{list.map(id => <button key={id} onClick={() => onOpen(id)}><Icon name={id === 20 ? 'spark' : id === 8 ? 'clock' : 'layers'} size={16} /><span>{modules.find(m => m.id === id).title.replace(' e AI Specialistica', '').replace(' e Inventory', '')}</span><Icon name="arrow" size={14} /></button>)}</div></section>;
}

function Industrialization() {
  const { data, commit, notify } = useDemo();
  const [minutes, setMinutes] = useState(data.laborMinutes);
  return <><Metrics items={[["Operazioni", '24', '8 gruppi di lavorazione'], ['Tempo standard', `${data.laborMinutes} min`, 'per capo'], ['Modello', `v${data.modelVersion}`, data.sampleApproved ? 'Campione approvato' : 'Campione in verifica']]} /><Card title="Ciclo di confezione" note="Giacca GJ-0421 · sequenza industriale"><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Sequenza</th><th>Lavorazione</th><th>Macchina</th><th>Minuti base</th></tr></thead><tbody>{operations.map(([name, machine, time], i) => <tr key={name}><td>{String(i + 1).padStart(2, '0')}</td><td>{name}</td><td>{machine}</td><td>{time}</td></tr>)}</tbody></table></div><form className="dw-inline-form" onSubmit={e => { e.preventDefault(); commit({ laborMinutes: Number(minutes) }, 'Tempo standard aggiornato: ' + minutes + ' minuti', 8); }}><Field label="Tempo totale (min/capo)"><input type="number" min="1" max="240" required value={minutes} onChange={e => setMinutes(e.target.value)} /></Field><Button primary type="submit">Salva ciclo</Button><Button icon="download" onClick={() => { csv('GJ-0421-ciclo.csv', [['Lavorazione', 'Macchina', 'Minuti base'], ...operations]); notify('Ciclo produttivo esportato'); }}>Esporta</Button></form></Card></>;
}
function Inventory({ moduleId }) {
  const { data, stock, fabric, commit } = useDemo();
  const [location, setLocation] = useState(data.location || 'C-12');
  const materialView = [3, 11].includes(moduleId);
  const fabricPurchased = data.quantity * data.consumption;
  const base = Math.floor(stock / 6);
  return <><Metrics items={materialView ? [['Tessuto residuo', `${number((data.quantity - data.produced) * data.consumption, 1)} m`, fabric.code], ['Fabbisogno ordine', `${number(fabricPurchased, 1)} m`, `${data.quantity} capi`], ['Lotto', 'T-7781', fabric.supplier]] : [['Disponibile', stock, 'approvati meno capi distribuiti'], ['Lotto', 'L-0421-A', 'GJ-0421 · 6 taglie'], ['Rilavorazioni', data.reworks, 'escluse dallo stock']]} /><Card title={materialView ? 'Scorte per la distinta base' : 'Stock per taglia'}><div className="dw-table-wrap"><table className="dw-table"><thead><tr>{(materialView ? ['Materiale', 'Lotto', 'Fabbisogno', 'Residuo teorico'] : ['SKU / Taglia', 'Ubicazione', 'Disponibile', 'Stato']).map(t => <th key={t}>{t}</th>)}</tr></thead><tbody>{materialView ? <><tr><td>{fabric.name}</td><td>T-7781</td><td>{number(fabricPurchased, 1)} m</td><td>{number((data.quantity - data.produced) * data.consumption, 1)} m</td></tr>{data.trims.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.code}-A</td><td>{number(row.qty * data.quantity, 1)} {row.unit}</td><td>{number(row.qty * (data.quantity - data.produced), 1)} {row.unit}</td></tr>)}</> : sizes.map((size, i) => <tr key={size}><td>GJ-0421 / {size}</td><td>{data.location || 'C-12'}</td><td>{i === 5 ? stock - base * 5 : base}</td><td><Badge>Disponibile</Badge></td></tr>)}</tbody></table></div><p className="dw-muted">{materialView ? 'Il residuo teorico segue consumo unitario e quantità ancora da produrre. I lotti sono dimostrativi.' : `Ricevuti ${data.produced - data.reworks} capi approvati; 160 wholesale e ${data.retailSold} retail già distribuiti. Nuove produzioni e spedizioni aggiornano lo stock.`}</p><form className="dw-inline-form" onSubmit={e => { e.preventDefault(); commit({ location: location.trim() }, 'Ubicazione aggiornata: ' + location.trim(), 14); }}><Field label="Ubicazione"><input value={location} onChange={e => setLocation(e.target.value)} required maxLength={20} pattern=".*\S.*" /></Field><Button primary type="submit">Sposta ubicazione</Button></form></Card></>;
}
function Logistics({ moduleId }) {
  const { data, stock, commit } = useDemo();
  const [qty, setQty] = useState(10);
  const [client, setClient] = useState('Negozio X');
  const pending = data.wholesaleOrders.filter(o => o.qty > o.shipped);
  const chosen = pending.find(o => o.client === client);
  const max = Math.min(stock, chosen ? chosen.qty - chosen.shipped : 0);
  return <><Metrics items={[["Tracking", 'TRK-88214', 'Magazzino → Hub → Negozio X'], ['Costo unitario', euro(data.logisticsCost), moduleId === 9 ? 'Incluso nel costo industriale' : 'Corriere espresso · 2 giorni'], ['Spedibile', stock, 'capi disponibili in magazzino']]} /><Card title="Spedizioni del capo"><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Tracking</th><th>Destinazione</th><th>Capi</th><th>Stato</th><th /></tr></thead><tbody>{data.shipments.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.client}</td><td>{row.qty}</td><td><Badge>{row.status}</Badge></td><td>{row.status === 'In consegna' && <Button onClick={() => commit(previous => ({ shipments: previous.shipments.map(s => s.id === row.id ? { ...s, status: 'Consegnata' } : s) }), row.id + ': consegna registrata', 15)}>Conferma consegna</Button>}</td></tr>)}</tbody></table></div><div className="dw-custody"><span><Icon name="box" />Magazzino C-12</span><Icon name="arrow" /><span>Hub Firenze</span><Icon name="arrow" /><span>Retailer</span></div>{pending.length > 0 && <form className="dw-inline-form" onSubmit={e => { e.preventDefault(); const amount = Number(qty); if (!Number.isInteger(amount) || amount < 1 || amount > max) return; const id = 'TRK-' + String(Date.now()).slice(-6); commit(previous => ({ shipments: [{ id, client, qty: amount, status: 'In consegna' }, ...previous.shipments], wholesaleOrders: previous.wholesaleOrders.map(o => o.client === client ? { ...o, shipped: o.shipped + amount, status: o.shipped + amount >= o.qty ? 'Spedito' : 'Parziale' } : o) }), `Spediti ${amount} capi a ${client}`, 15); }}><Field label="Ordine da evadere"><select value={client} onChange={e => setClient(e.target.value)}>{pending.map(o => <option key={o.id}>{o.client}</option>)}</select></Field><Field label={`Quantità · max ${max}`}><input type="number" min="1" max={max || 1} required value={qty} onChange={e => setQty(e.target.value)} /></Field><Button primary type="submit" disabled={!max}>Crea spedizione</Button></form>}</Card></>;
}
function Wholesale({ moduleId }) {
  const { data, commit } = useDemo();
  const [client, setClient] = useState('Atelier H');
  const [qty, setQty] = useState(30);
  const ordered = data.wholesaleOrders.reduce((sum, o) => sum + o.qty, 0);
  const available = Math.max(0, data.quantity - ordered);
  return <><Metrics items={[["Ordini B2B", ordered, 'capi impegnati'], ['Listino wholesale', euro(data.wholesale), 'AI 2027 · pagamento 60 giorni'], ['Valore ordini', euro(ordered * data.wholesale), moduleId === 1 ? 'Segnale di domanda per il concept' : 'Ordini confermati']]} /><Card title="Retailer e ordini"><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Ordine</th><th>Cliente</th><th>Capi</th><th>Spediti</th><th>Valore</th><th>Stato</th></tr></thead><tbody>{data.wholesaleOrders.map(o => <tr key={o.id}><td>{o.id}</td><td>{o.client}</td><td>{o.qty}</td><td>{o.shipped}</td><td>{euro(o.qty * data.wholesale)}</td><td><Badge>{o.status}</Badge></td></tr>)}</tbody></table></div><form className="dw-inline-form" onSubmit={e => { e.preventDefault(); const amount = Number(qty); if (!Number.isInteger(amount) || amount < 1 || amount > available) return; commit(previous => ({ wholesaleOrders: [...previous.wholesaleOrders, { id: 'W-' + String(Date.now()).slice(-5), client: client.trim(), qty: amount, shipped: 0, status: 'Da preparare' }] }), `Nuovo ordine wholesale: ${client.trim()}, ${amount} capi`, 16); }}><Field label="Retailer"><input value={client} onChange={e => setClient(e.target.value)} required maxLength={80} pattern=".*\S.*" /></Field><Field label={`Capi · ${available} ordinabili`}><input type="number" min="1" max={available || 1} value={qty} onChange={e => setQty(e.target.value)} required /></Field><Button primary type="submit" disabled={!available}>Aggiungi ordine</Button></form></Card></>;
}
function Retail({ moduleId }) {
  const { data, stock, commit } = useDemo();
  const [price, setPrice] = useState(data.retail);
  return <><Metrics items={[["Venduti retail", data.retailSold, 'GJ-0421 · canale B2C'], ['Prezzo medio', euro(data.retailAverage), `Listino ${euro(data.retail)}`], ['Feedback', `${data.retailFeedback} / 5`, 'Regular fit, buona vestibilità']]} /><Card title={moduleId === 1 ? 'Segnali dal mercato' : 'Performance retail'}><div className="dw-retail-summary"><Artwork id={17} /><div><h3>{data.title}</h3><p>Le taglie 42 e 44 guidano la domanda. I clienti apprezzano la struttura e la mano della lana; una richiesta di cambio taglia è stata ricevuta.</p><Progress label="Sell-through campagna retail" value={data.retailSold / 320 * 100} /><p className="dw-muted">Sell-through: {number(data.retailSold / 320 * 100, 1)}% su 320 capi obiettivo di campagna.</p></div></div><form className="dw-inline-form" onSubmit={e => { e.preventDefault(); commit({ retail: Number(price) }, 'Listino retail aggiornato: ' + euro(Number(price)), 17); }}><Field label="Listino retail (€)"><input type="number" min="1" max="3000" value={price} onChange={e => setPrice(e.target.value)} required /></Field><Button primary type="submit">Aggiorna prezzo</Button><Button disabled={stock < 1} onClick={() => commit(previous => ({ retailSold: previous.retailSold + 1, retailAverage: Number(((previous.retailAverage * previous.retailSold + previous.retail) / (previous.retailSold + 1)).toFixed(2)) }), 'Registrata una vendita retail GJ-0421', 17)}>Simula una vendita</Button></form></Card></>;
}
export function Lifecycle() {
  const { data, commit } = useDemo();
  const [type, setType] = useState('Riparazione'); const [note, setNote] = useState(''); const [date, setDate] = useState('2027-06-18');
  return <Card title="La vita continua" note="Eventi effettivi e scenari futuri restano distinti"><div className="dw-event-list">{data.lifecycle.map(row => <div key={row.id}><span className="dw-event-dot" /><div><strong>{row.type}</strong><p>{row.note}</p><small>{new Date(row.date + 'T12:00:00').toLocaleDateString('it-IT')}{row.future && ' · Scenario futuro'}</small></div></div>)}</div><form className="dw-stack" onSubmit={e => { e.preventDefault(); commit(previous => ({ lifecycle: [...previous.lifecycle, { id: crypto.randomUUID(), type, note: note.trim(), date, future: false }] }), 'Evento del ciclo di vita registrato: ' + type.toLowerCase(), 18); setNote(''); }}><div className="dw-two"><Field label="Tipo evento"><select value={type} onChange={e => setType(e.target.value)}>{['Riparazione', 'Reso', 'Seconda vita', 'Riciclo'].map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Data"><input type="date" required value={date} onChange={e => setDate(e.target.value)} /></Field></div><Field label="Descrizione"><textarea value={note} onChange={e => setNote(e.target.value)} required maxLength={500} rows={2} placeholder="Intervento, condizioni del capo, operatore…" /></Field><Button primary type="submit" disabled={!note.trim()} icon="plus">Registra evento</Button></form></Card>;
}
function Intelligence({ moduleId }) {
  const { data, commit, notify } = useDemo();
  const [busy, setBusy] = useState(false);
  const output = aiOutputs[moduleId] || 'Dati della filiera';
  // Prepared outputs are regenerated locally; decisions belong to the assistant.
  function generate() {
    setBusy(true);
    commit(previous => ({ aiRuns: { ...previous.aiRuns, [moduleId]: (previous.aiRuns[moduleId] || 0) + 1 }, ...(moduleId === 2 ? { techGenerated: true } : {}), ...(moduleId === 7 && !previous.optimized ? { optimized: true, waste: 11, consumption: Number((previous.consumption * .86 / .89).toFixed(4)) } : {}) }), output + ': output aggiornato', moduleId);
    setBusy(false);
  }
  return <Card title="Automatizzato con AI" note={`Specialista per ${modules.find(m => m.id === moduleId)?.title.toLowerCase()}`}><div className="dw-ai-output"><Artwork id={20} /><div><Badge>Output preparato</Badge><h3>{output}</h3><p>Input: GJ-0421 · modello v{data.modelVersion} · distinta base corrente. Il risultato compare nello spazio di lavoro e alimenta la storia del capo.</p><small>Generazioni nella sessione: {data.aiRuns[moduleId] || 0}</small></div></div><div className="dw-actions"><Button primary icon="spark" disabled={busy} onClick={generate}>Genera output demo</Button><Button icon="download" onClick={() => { csv(`GJ-0421-output-${moduleId}.csv`, [['Capo', 'Modulo', 'Output', 'Versione'], ['GJ-0421', moduleId, output, data.modelVersion]]); notify('Output esportato'); }}>Esporta scheda output</Button></div><p className="dw-muted">Risultati simulati. Per scenari e decisioni usa l’assistente del modulo.</p></Card>;
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
