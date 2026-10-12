import { productSizes } from './productData.js';
import React, { useState } from 'react';
import { modules } from '../modules.js';
import { useDemo } from './DemoContext.jsx';
import { euro, number } from './domain.js';
import { Button, Card, Icon, Progress, Tabs } from './ui.jsx';
import { actorStyle } from './workspaceData.js';
import './home.css';

const groups = [
  { name: 'Sviluppo', ids: [1, 2, 3, 4, 5, 6, 7] },
  { name: 'Operazioni', ids: [9, 10, 11, 12, 13] },
  { name: 'Identità', ids: [19, 22] },
];
const moduleTones = { 1: 'violet', 2: 'blue', 3: 'teal', 4: 'rose', 5: 'orange', 6: 'rose', 7: 'green', 9: 'green', 10: 'blue', 11: 'amber', 12: 'teal', 13: 'red', 19: 'violet', 21: 'accent', 22: 'blue' };
const moduleStyle = id => ({ '--module-color': `var(--${moduleTones[id] || 'accent'})` });
const icons = { 1: 'pencil', 2: 'ruler', 3: 'layers', 4: 'scissors', 5: 'ruler', 6: 'shirt', 7: 'grid', 9: 'chart', 10: 'calendar', 11: 'box', 12: 'activity', 13: 'check', 19: 'file', 22: 'chat' };
const path = [
  { name: 'Concept', ids: [1] },
  { name: 'Sviluppo tecnico', ids: [2, 3, 4, 5] },
  { name: 'Validazione', ids: [6, 7, 9] },
  { name: 'Produzione', ids: [10, 11, 12, 13] },
  { name: 'Passaporto', ids: [19] },
];
const reviewable = new Set([3, 4, 5, 7, 9, 10]);
const date = value => {
  const parsed = new Date(value + 'T12:00:00');
  return Number.isNaN(parsed.getTime()) ? 'Da definire' : new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
};
const moduleName = id => id === 21 ? 'Home' : modules.find(item => item.id === id)?.title;

export default function HomePage({ onNavigate, onService, onActivity }) {
  const { data, cost, stock, approved, materials, labor, fabric, commit } = useDemo();
  const [group, setGroup] = useState('Sviluppo');
  const delayed = data.purchaseOrders.filter(order => order.status === 'In ritardo');
  const qualityAlert = !data.qualityResolved;
  const alerts = delayed.length + Number(qualityAlert);
  const progress = Math.min(100, Math.round(data.produced / data.quantity * 100));
  const remaining = Math.max(0, data.quantity - data.produced);
  const stage = data.produced >= data.quantity ? 'Lotto completato' : data.productionPaused ? 'In pausa' : data.produced ? 'In produzione' : data.sampleApproved ? 'Pronto per la produzione' : data.brief.trim() ? 'In sviluppo' : 'Da sviluppare';
  const actions = [
    ...delayed.map(order => ({ key: order.id, id: 11, title: order.material + ': consegna in ritardo', note: `${order.supplier} · ${order.id}`, urgent: true })),
    ...(qualityAlert ? [{ key: 'quality', id: 13, title: 'Verifica la non conformità del lotto', note: `${data.lotId} · ${data.reworks} capi in rilavorazione`, urgent: true }] : []),
    ...(!data.sketchFile ? [{ key: 'concept', id: 1, title: 'Prepara il concept del capo', note: 'Carica il disegno finale o esplora moodboard e palette' }] : []),
    ...(!data.techGenerated ? [{ key: 'tech', id: 2, title: 'Prepara il tech pack', note: 'Tavole tecniche e punti di misura' }] : []),
    ...(!data.sampleApproved ? [{ key: 'sample', id: 6, title: 'Completa il fitting del campione', note: `${data.sampleChecks.filter(Boolean).length} di ${data.sampleChecks.length} verifiche registrate` }] : []),
    ...(data.sampleApproved && remaining ? [{ key: 'production', id: 12, title: 'Prosegui con il lotto produttivo', note: `${number(remaining)} capi ancora da completare` }] : []),
    ...(!data.passportPublished && data.techGenerated ? [{ key: 'passport', id: 19, title: 'Prepara il passaporto digitale', note: 'Riunisci identità, materiali ed evidenze' }] : []),
  ];
  const next = actions[0];
  const continueId = !data.brief.trim() ? 1 : next?.urgent || !data.techGenerated ? next.id : data.produced ? 12 : next?.id || 1;
  const continueLabel = !data.brief.trim() ? 'Completa il brief' : next?.urgent ? 'Verifica ' + (next.id === 11 ? 'acquisti' : 'qualità') : data.produced ? 'Apri produzione' : 'Continua lo sviluppo';
  const statuses = {
    1: data.sketchFile ? 'Schizzo caricato' : data.creative?.round ? 'Spunti in esplorazione' : 'Schizzo da preparare',
    2: data.technical?.approvedId === data.technical?.currentId && data.technical?.approvedId ? 'Disegno tecnico approvato' : data.techGenerated ? 'Disegno in revisione' : 'Da generare',
    3: `${data.trims.length + 1} materiali nella BOM`,
    4: `Modello v${data.modelVersion}`,
    5: `${productSizes(data).length} taglie · ${productSizes(data).join(' / ')}`,
    6: data.sampleApproved ? 'Campione approvato' : data.sampleChecks.some(Boolean) ? 'Fitting in corso' : 'Fitting da avviare',
    7: data.category === 'knit' ? data.optimized ? 'Piano filato ottimizzato' : 'Piano filato base' : data.optimized ? 'Marker ottimizzato' : 'Marker di base',
    9: `${euro(cost)} / capo`,
    10: `Consegna · ${date(data.delivery)}`,
    11: delayed.length ? `${delayed.length} ordini in ritardo` : `${data.purchaseOrders.length} ordini di acquisto`,
    12: `${number(data.produced)} di ${number(data.quantity)} capi`,
    13: !data.produced ? 'Controlli da avviare' : qualityAlert ? 'Non conformità aperta' : 'Non conformità risolta',
    19: data.passportPublished ? 'Passaporto pubblicato' : 'Passaporto in bozza',
    22: 'Scenari e decisioni del capo',
  };
  const costs = [['Materiali', materials, 'var(--blue)'], ['Lavorazione', labor, 'var(--violet)'], ['Logistica', data.logisticsCost, 'var(--amber)']];
  const openEvent = event => modules.find(item => item.id === event.module)?.serviceInfo || event.module === 20 ? onService(event.module) : onNavigate(event.module);
  const outputs = { 1: Boolean(data.sketchFile), 2: Boolean(data.technical?.approvedId && data.technical.approvedId === data.technical.currentId), 6: data.sampleApproved, 7: data.optimized, 11: data.purchaseOrders.length > 0 && data.purchaseOrders.every(order => order.status === 'Consegnato'), 12: data.produced >= data.quantity, 13: data.produced >= data.quantity && data.qualityResolved && !data.reworks, 19: data.passportPublished };
  const started = { 1: Boolean(data.brief.trim()) || data.references.length > 0, 6: data.sampleChecks.some(Boolean), 9: data.produced > 0, 10: data.purchaseOrders.length > 0 || data.produced > 0, 11: data.purchaseOrders.length > 0, 12: data.produced > 0, 13: data.produced > 0, 19: data.produced > 0 };
  const phaseState = id => outputs[id] || (![1, 2].includes(id) && data.phaseReviews?.[id]) ? 'done' : started[id] || data.phaseReviews?.[id] === false || data.events.some(event => event.module === id) ? 'active' : 'pending';
  const phaseLabel = state => ({ done: 'Completata', active: 'In corso', pending: 'Da iniziare' }[state]);
  const phaseIds = path.flatMap(item => item.ids);
  const complete = phaseIds.filter(id => phaseState(id) === 'done').length;
  const inProgress = phaseIds.filter(id => phaseState(id) === 'active').length;
  const reviewPhase = (id, checked) => commit(previous => ({ phaseReviews: { ...previous.phaseReviews, [id]: checked } }), `${checked ? 'Confermata' : 'Riaperta'} la revisione: ${moduleName(id)}`, id);

  const metricItems = [
    { label: 'Produzione', value: `${number(data.produced)} / ${number(data.quantity)}`, note: `${progress}% dell’ordine completato`, icon: 'activity', target: 12 },
    { label: 'Costo industriale', value: euro(cost), note: 'Stima per capo', icon: 'chart', target: 9 },
    { label: 'Stock disponibile', value: number(stock), note: data.produced ? 'Capi approvati al netto delle vendite' : 'Produzione da avviare', icon: 'box', target: 12 },
    { label: 'Da verificare', value: alerts, note: alerts ? 'Acquisti e qualità' : 'Nessuna anomalia aperta', icon: 'eye', target: delayed.length ? 11 : 13 },
  ];

  return <div className="dw-home">
    <header className="dw-home-header">
      <div><h2>Panoramica del capo</h2><p><span className="dw-home-stage"><i />{stage}</span><span>{data.collection}</span></p></div>
      <div className="dw-home-header-actions"><Button icon="file" onClick={() => onNavigate(2)}>Scheda tecnica</Button><Button primary icon={icons[continueId]} onClick={() => onNavigate(continueId)}>{continueLabel}<Icon name="arrow" size={14} /></Button></div>
    </header>

    <div className="dw-home-metrics" aria-label="Dati principali del capo">{metricItems.map(item => <button type="button" key={item.label} data-module={item.target} style={moduleStyle(item.target)} onClick={() => onNavigate(item.target)}>
      <span className="dw-home-metric-label"><Icon name={item.icon} size={14} />{item.label}</span><strong>{item.value}</strong><small>{item.note}</small>
    </button>)}</div>

    <div className="dw-home-columns">
      <div className="dw-home-main">
        <Card className="dw-home-portfolio" data-module={groups.find(item => item.name === group).ids[0]} style={moduleStyle(groups.find(item => item.name === group).ids[0])} flush title="Avanzamento della filiera" actions={<Tabs items={groups.map(item => item.name)} selected={group} onChange={setGroup} label="Fasi del percorso del capo" />}>
          <div className="dw-home-phase-overview"><div><span>{complete} di {phaseIds.length} fasi completate</span><span>{inProgress} in corso</span></div><Progress value={complete / phaseIds.length * 100} label="Fasi del capo completate" /></div>
          <ol className="dw-home-phases">{path.map(step => {
            const done = step.ids.filter(id => phaseState(id) === 'done').length;
            const state = done === step.ids.length ? 'done' : step.ids.some(id => phaseState(id) !== 'pending') ? 'active' : 'pending';
            const target = step.ids.find(id => phaseState(id) === 'active') || step.ids.find(id => phaseState(id) === 'pending') || step.ids[0];
            return <li key={step.name} data-phase={state} data-module={step.ids[0]} style={moduleStyle(step.ids[0])}><button type="button" onClick={() => onNavigate(target)} aria-label={`${step.name}: ${phaseLabel(state)}, ${done} di ${step.ids.length} fasi completate. Apri ${moduleName(target)}`}><i /><span>{step.name}</span><small>{done}/{step.ids.length}</small></button></li>;
          })}</ol>
          <div className="dw-table-wrap"><table className="dw-table dw-home-module-table"><thead><tr><th>Modulo</th><th>Stato</th><th>Dati correnti</th><th>Revisione</th></tr></thead><tbody>{groups.find(item => item.name === group).ids.map(id => <tr key={id} data-module={id} style={moduleStyle(id)} data-phase={id === 22 ? undefined : phaseState(id)}>
            <td><button type="button" className="dw-home-module-link" onClick={() => onNavigate(id)}><span className="dw-home-module-icon"><Icon name={icons[id]} size={14} /></span>{moduleName(id)}</button></td>
            <td>{id === 22 ? <span className="dw-muted">—</span> : <span className="dw-home-state"><i />{phaseLabel(phaseState(id))}</span>}</td>
            <td>{statuses[id]}</td>
            <td>{reviewable.has(id) && !outputs[id] ? <label className="dw-home-review"><input type="checkbox" checked={Boolean(data.phaseReviews?.[id])} onChange={event => reviewPhase(id, event.target.checked)} aria-label={`Conferma la revisione di ${moduleName(id)}`} /><span>{data.phaseReviews?.[id] ? 'Confermata' : 'Conferma'}</span></label> : <span className="dw-home-review-source">{id === 22 ? '—' : phaseState(id) === 'done' ? <><Icon name="check" size={12} />Completata</> : 'Nel modulo'}</span>}</td>
          </tr>)}</tbody></table></div>
          <footer className="dw-home-portfolio-foot"><Icon name="layers" size={13} /><span>{!data.brief.trim() ? 'Materiali, modello e taglie partono dai dati base modificabili.' : 'Ogni modifica nei moduli aggiorna i dati di questa panoramica.'}</span></footer>
          <details className="dw-home-brief"><summary>Brief e materiali del capo</summary><p>{data.brief.trim() || 'Definisci il brief per iniziare lo sviluppo del capo.'}</p><dl><div><dt>Variante</dt><dd>{data.variant}</dd></div><div><dt>Composizione</dt><dd>{fabric.composition}</dd></div></dl></details>
        </Card>

        <Card className="dw-home-priorities" data-module={next?.id || 19} style={moduleStyle(next?.id || 19)} flush title="Prossime attività" actions={<span className="dw-home-panel-count">{actions.length} da seguire</span>}>
          {actions.length ? <ol className="dw-home-tasks">{actions.slice(0, 5).map(action => <li key={action.key}><button type="button" onClick={() => onNavigate(action.id)}><span className={`dw-home-task-icon ${action.urgent ? 'urgent' : ''}`} style={moduleStyle(action.id)}><Icon name={icons[action.id]} size={14} /></span><span className="dw-home-task-copy"><strong>{action.title}</strong><small>{action.note}</small></span><span className="dw-home-task-module">{moduleName(action.id)}</span><Icon name="arrow" size={13} /></button></li>)}</ol> : <div className="dw-home-clear"><Icon name="check" size={16} /><span>Le attività principali sono completate.</span><Button onClick={() => onNavigate(19)}>Apri passaporto</Button></div>}
          {actions.length > 5 && <p className="dw-home-more">Altre {actions.length - 5} attività nei rispettivi moduli.</p>}
        </Card>
      </div>

      <aside className="dw-home-aside" aria-label="Ordine, attività e costi">
        <Card className="dw-home-production" data-module="12" style={moduleStyle(12)} title="Avanzamento del lotto" actions={<Button onClick={() => onNavigate(12)}>Produzione<Icon name="arrow" size={13} /></Button>}>
          <div className="dw-home-progress"><strong>{progress}%</strong><span>{number(data.produced)} di {number(data.quantity)} capi</span></div><Progress value={progress} label="Avanzamento della produzione del capo" />
          <dl className="dw-home-lot-stats"><div><dt>Approvati</dt><dd>{number(approved)}</dd></div><div><dt>Rilavorazione</dt><dd>{number(data.reworks)}</dd></div><div><dt>Da produrre</dt><dd>{number(remaining)}</dd></div></dl>
          {data.productionDays.length > 0 ? <div className="dw-home-chart"><span>Ultime rilevazioni · capi prodotti</span><div role="img" aria-label={`Produzione per rilevazione: ${data.productionDays.map(value => number(value)).join(', ')} capi`}>{data.productionDays.slice(-7).map((value, index) => <div key={index}><span>{number(value)}</span><i style={{ height: `${Math.max(2, value / Math.max(...data.productionDays, 1) * 42)}px` }} /><small>{index + 1}</small></div>)}</div></div> : <p className="dw-home-production-empty">Le rilevazioni appariranno dopo la registrazione dei primi capi.</p>}
          <button type="button" className="dw-home-delivery" onClick={() => onNavigate(10)}><span><Icon name="calendar" size={13} />Consegna prevista</span><strong>{date(data.delivery)}</strong><Icon name="arrow" size={13} /></button>
          <p className="dw-home-order">{data.factory} · {data.orderId} · {data.lotId}</p>
        </Card>

        <Card data-module={data.events[0]?.module || 21} style={moduleStyle(data.events[0]?.module || 21)} title="Attività recenti" actions={<Button onClick={onActivity}>Vedi tutte</Button>}>
          <div className="dw-home-feed">{data.events.slice(0, 4).map(event => {
            const name = event.actor?.name || 'Utente non registrato';
            const initials = name.split(' ').map(word => word[0]).slice(0, 2).join('');
            return <button type="button" key={event.id} onClick={() => openEvent(event)}><span className="dw-home-avatar" style={actorStyle(event.actor)} aria-hidden="true">{event.actor?.email === data.profile.email ? <img src={data.profile.avatar || '/illustrations/profile-avatar.webp'} alt="" /> : initials}</span><span className="dw-home-feed-copy"><strong>{name}</strong><span>{event.text}</span><small>{moduleName(event.module) || 'Servizi'} · {event.time.split(/[·,]/)[0].trim()}</small></span><time>{event.time.split(/[·,]/).at(-1).trim()}</time></button>;
          })}</div>
        </Card>

        <Card data-module="9" style={moduleStyle(9)} title="Composizione del costo" actions={<Button onClick={() => onNavigate(9)}>Pricing<Icon name="arrow" size={13} /></Button>}>
          <div className="dw-home-cost-bar" role="img" aria-label={costs.map(([label, value]) => `${label}: ${euro(value)}`).join(', ')}>{costs.map(([label, value, color]) => <span key={label} style={{ flex: value, background: color }} />)}</div>
          <dl className="dw-home-costs">{costs.map(([label, value, color]) => <div key={label}><dt><i style={{ background: color }} />{label}</dt><dd>{euro(value)}</dd></div>)}<div className="dw-home-cost-total"><dt>Totale / capo</dt><dd>{euro(cost)}</dd></div></dl>
        </Card>
      </aside>
    </div>
  </div>;
}
