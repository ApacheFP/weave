import React, { useState } from 'react';
import { modules } from '../modules.js';
import { euro, number, useDemo } from './DemoContext.jsx';
import { ProductPhoto } from './Media.jsx';
import { Badge, Button, Card, Icon, Metrics, Progress, Tabs } from './ui.jsx';
import './home.css';

const groups = [
  { name: 'Sviluppo', ids: [1, 2, 3, 4, 5, 6, 7] },
  { name: 'Operazioni', ids: [9, 10, 11, 12, 13] },
  { name: 'Identità', ids: [19, 22] },
];
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
    ...(!data.brief.trim() ? [{ key: 'brief', id: 1, title: 'Definisci il brief del nuovo capo', note: 'Concept, direzione creativa e varianti' }] : []),
    ...(!data.techGenerated ? [{ key: 'tech', id: 2, title: 'Prepara il tech pack', note: 'Tavole tecniche e punti di misura' }] : []),
    ...(!data.sampleApproved ? [{ key: 'sample', id: 6, title: 'Completa il fitting del campione', note: `${data.sampleChecks.filter(Boolean).length} di ${data.sampleChecks.length} verifiche registrate` }] : []),
    ...(data.sampleApproved && remaining ? [{ key: 'production', id: 12, title: 'Prosegui con il lotto produttivo', note: `${number(remaining)} capi ancora da completare` }] : []),
    ...(!data.passportPublished && data.techGenerated ? [{ key: 'passport', id: 19, title: 'Prepara il passaporto digitale', note: 'Riunisci identità, materiali ed evidenze' }] : []),
  ];
  const next = actions[0];
  const continueId = !data.brief.trim() ? 1 : next?.urgent || !data.techGenerated ? next.id : data.produced ? 12 : next?.id || 1;
  const continueLabel = !data.brief.trim() ? 'Completa il brief' : next?.urgent ? 'Verifica ' + (next.id === 11 ? 'acquisti' : 'qualità') : data.produced ? 'Apri produzione' : 'Continua lo sviluppo';
  const statuses = {
    1: data.brief.trim() ? 'Brief disponibile' : 'Da iniziare',
    2: data.techGenerated ? 'Tech pack disponibile' : 'Da generare',
    3: `${data.trims.length + 1} materiali nella BOM`,
    4: `Modello v${data.modelVersion}`,
    5: '6 taglie · 38–48',
    6: data.sampleApproved ? 'Campione approvato' : data.sampleChecks.some(Boolean) ? 'Fitting in corso' : 'Fitting da avviare',
    7: data.optimized ? 'Marker ottimizzato' : 'Marker di base',
    9: `${euro(cost)} / capo`,
    10: `Consegna · ${date(data.delivery)}`,
    11: delayed.length ? `${delayed.length} ordini in ritardo` : `${data.purchaseOrders.length} ordini di acquisto`,
    12: `${number(data.produced)} di ${number(data.quantity)} capi`,
    13: !data.produced ? 'Controlli da avviare' : qualityAlert ? 'Non conformità aperta' : 'Non conformità risolta',
    19: data.passportPublished ? 'Passaporto pubblicato' : 'Passaporto in bozza',
    22: 'Scenari e decisioni del capo',
  };
  const costs = [['Materiali', materials, '#b89c72'], ['Lavorazione', labor, '#d1bfa2'], ['Logistica', data.logisticsCost, '#e7ded0']];
  const openEvent = event => modules.find(item => item.id === event.module)?.serviceInfo || event.module === 20 ? onService(event.module) : onNavigate(event.module);
  const outputs = { 1: Boolean(data.brief.trim()) && data.designChecks.every(Boolean), 2: data.techGenerated, 6: data.sampleApproved, 7: data.optimized, 11: data.purchaseOrders.length > 0 && data.purchaseOrders.every(order => order.status === 'Consegnato'), 12: data.produced >= data.quantity, 13: data.produced >= data.quantity && data.qualityResolved && !data.reworks, 19: data.passportPublished };
  const started = { 1: Boolean(data.brief.trim()) || data.references.length > 0, 6: data.sampleChecks.some(Boolean), 9: data.produced > 0, 10: data.purchaseOrders.length > 0 || data.produced > 0, 11: data.purchaseOrders.length > 0, 12: data.produced > 0, 13: data.produced > 0, 19: data.produced > 0 };
  const phaseState = id => outputs[id] || data.phaseReviews?.[id] ? 'done' : started[id] || data.phaseReviews?.[id] === false || data.events.some(event => event.module === id) ? 'active' : 'pending';
  const phaseLabel = state => ({ done: 'Completata', active: 'In corso', pending: 'Da iniziare' }[state]);
  const phaseIds = path.flatMap(item => item.ids);
  const complete = phaseIds.filter(id => phaseState(id) === 'done').length;
  const inProgress = phaseIds.filter(id => phaseState(id) === 'active').length;
  const reviewPhase = (id, checked) => commit(previous => ({ phaseReviews: { ...previous.phaseReviews, [id]: checked } }), `${checked ? 'Confermata' : 'Riaperta'} la revisione: ${moduleName(id)}`, id);

  return <div className="dw-home">
    <Card className="dw-home-product" title={data.title} note={`${data.styleId} · ${data.collection}`} actions={<Badge tone={alerts ? 'warn' : ''}>{stage}</Badge>}>
      <div className="dw-home-product-body">
        <figure className="dw-home-photo"><ProductPhoto sizes="(max-width: 760px) 96px, 132px" /><figcaption>Visuale demo</figcaption></figure>
        <div className="dw-home-product-info">
          <div className="dw-home-identity"><Badge>{data.variant}</Badge><span>{fabric.composition}</span></div>
          <p>{data.brief.trim() || 'Il tuo nuovo capo parte da qui. Definisci il brief e personalizza i materiali e le misure del modello base.'}</p>
          <div className="dw-home-product-actions"><Button primary icon={icons[continueId]} onClick={() => onNavigate(continueId)}>{continueLabel}<Icon name="arrow" size={16} /></Button><Button icon="file" onClick={() => onNavigate(2)}>Scheda tecnica</Button></div>
        </div>
        <div className="dw-home-delivery"><span className="dw-eyebrow">Obiettivo di consegna</span><strong>{date(data.delivery)}</strong><span>{data.factory}</span><span>{number(data.quantity)} capi previsti</span><Button icon="calendar" onClick={() => onNavigate(10)}>Apri pianificazione</Button></div>
      </div>
    </Card>

    <Card className="dw-home-path" title="Le fasi del capo" note={`${complete} ${complete === 1 ? 'completata' : 'completate'} · ${inProgress} in corso · ${phaseIds.length - complete - inProgress} da iniziare`} actions={<Badge>{complete} / {phaseIds.length} completate</Badge>}>
      <ol className="dw-home-path-steps">{path.map((step, index) => {
        const done = step.ids.filter(id => phaseState(id) === 'done').length;
        const state = done === step.ids.length ? 'done' : step.ids.some(id => phaseState(id) !== 'pending') ? 'active' : 'pending';
        const target = step.ids.find(id => phaseState(id) === 'active') || step.ids.find(id => phaseState(id) === 'pending') || step.ids[0];
        return <li key={step.name} data-phase={state}><button onClick={() => onNavigate(target)} aria-label={`${step.name}: ${phaseLabel(state)}, ${done} di ${step.ids.length} fasi completate. Apri ${moduleName(target)}`}><span className="dw-home-step-number">{state === 'done' ? <Icon name="check" size={18} /> : String(index + 1).padStart(2, '0')}</span><strong>{step.name}</strong><span className="dw-phase-label">{phaseLabel(state)}</span><small>{done} / {step.ids.length} fasi completate</small></button></li>;
      })}</ol>
      <div className="dw-home-path-legend"><span><i data-phase="done" />Completata</span><span><i data-phase="active" />In corso</span><span><i data-phase="pending" />Da iniziare</span><small>Apri una fase per continuare il lavoro.</small></div>
    </Card>

    <Metrics items={[
      ['Produzione', `${number(data.produced)} / ${number(data.quantity)}`, `${progress}% dell’ordine completato`, { icon: 'activity', progress }],
      ['Costo industriale', euro(cost), 'Stima dai materiali e tempi correnti', { icon: 'chart' }],
      ['Stock disponibile', number(stock), data.produced ? 'Capi approvati, al netto delle vendite' : 'Nessun capo ancora prodotto', { icon: 'box' }],
      ['Segnali da seguire', alerts, alerts ? 'Acquisti e qualità richiedono attenzione' : 'Nessuna anomalia registrata', { icon: 'eye' }],
    ]} />

    <div className="dw-home-columns">
      <Card title="Prossime azioni" note="Le priorità di questo capo" actions={<Badge>{actions.length} da seguire</Badge>}>
        {actions.length ? <ol className="dw-home-tasks">{actions.slice(0, 5).map(action => <li key={action.key}><button onClick={() => onNavigate(action.id)}><span className={`dw-home-task-icon ${action.urgent ? 'urgent' : ''}`}><Icon name={icons[action.id]} size={18} /></span><span className="dw-home-task-copy"><strong>{action.title}</strong><small>{action.note}</small></span>{action.urgent && <Badge tone="warn">Verifica</Badge>}<Icon name="arrow" size={16} /></button></li>)}</ol> : <div className="dw-home-clear"><Icon name="check" /><strong>Le attività principali sono completate.</strong><p>Puoi proseguire nei moduli o seguire il capo nel passaporto digitale.</p><Button onClick={() => onNavigate(19)}>Apri passaporto</Button></div>}
        {actions.length > 5 && <p className="dw-muted">Altre {actions.length - 5} attività disponibili nei rispettivi moduli.</p>}
      </Card>

      <Card title="Avanzamento del lotto" note={data.produced ? `${data.orderId} · ${data.lotId}` : 'La produzione inizierà dopo lo sviluppo'} actions={<Button onClick={() => onNavigate(12)}>Apri <Icon name="arrow" size={14} /></Button>}>
        <div className="dw-home-progress"><strong>{progress}<span>%</span></strong><span>{number(remaining)} capi da completare</span></div>
        <Progress value={progress} label="Avanzamento della produzione del capo" />
        <dl className="dw-home-lot-stats"><div><dt>Approvati</dt><dd>{number(approved)}</dd></div><div><dt>Rilavorazione</dt><dd>{number(data.reworks)}</dd></div><div><dt>Da produrre</dt><dd>{number(remaining)}</dd></div></dl>
        {data.productionDays.length > 0 ? <div className="dw-home-chart"><span>Ultime rilevazioni · capi prodotti</span><div role="img" aria-label={`Produzione per rilevazione: ${data.productionDays.map(value => number(value)).join(', ')} capi`}>{data.productionDays.slice(-7).map((value, index) => <div key={index}><span>{number(value)}</span><i style={{ height: `${Math.max(2, value / Math.max(...data.productionDays, 1) * 70)}px` }} /><small>{index + 1}</small></div>)}</div></div> : <div className="dw-home-production-empty"><Icon name="activity" size={18} /><p>Le rilevazioni appariranno qui quando registrerai i primi capi prodotti.</p></div>}
      </Card>
    </div>

    <div className="dw-home-columns">
      <Card title="Il percorso del capo" note="Apri un modulo per lavorare sui suoi dati" actions={<Tabs items={groups.map(item => item.name)} selected={group} onChange={setGroup} label="Fasi del percorso del capo" />}>
        <div className="dw-home-modules">{groups.find(item => item.name === group).ids.map(id => <article key={id} data-phase={id === 22 ? undefined : phaseState(id)}><button onClick={() => onNavigate(id)}><span className="dw-home-module-icon"><Icon name={phaseState(id) === 'done' ? 'check' : icons[id]} size={20} /></span><strong>{moduleName(id)}</strong>{id !== 22 && <span className="dw-phase-label">{phaseLabel(phaseState(id))}</span>}<small>{statuses[id]}</small><Icon name="arrow" size={15} /></button>{reviewable.has(id) && !outputs[id] && <label className="dw-home-review"><input type="checkbox" checked={Boolean(data.phaseReviews?.[id])} onChange={event => reviewPhase(id, event.target.checked)} />Revisione confermata</label>}</article>)}</div>
        <p className="dw-home-modules-note"><Icon name="layers" size={15} />{!data.brief.trim() ? 'Materiali, modello e taglie partono dai dati base modificabili.' : 'Dati condivisi tra moduli: ogni modifica aggiorna questa Home.'}</p>
      </Card>
      <div className="dw-stack">
        <Card title="Attività recenti" note="Modifiche e decisioni del capo" actions={<Button onClick={onActivity}>Vedi tutte</Button>}>
          <div className="dw-home-feed">{data.events.slice(0, 4).map(event => <button key={event.id} onClick={() => openEvent(event)}><span className="dw-event-dot" /><span><small>{event.actor?.name || 'Utente non registrato'} · {event.time}</small><strong>{event.text}</strong></span><Icon name="arrow" size={14} /></button>)}</div>
        </Card>
        <Card title="Composizione del costo" note="Stima unitaria · dati correnti" actions={<Button onClick={() => onNavigate(9)}>Pricing <Icon name="arrow" size={14} /></Button>}>
          <div className="dw-home-cost-bar" role="img" aria-label={costs.map(([label, value]) => `${label}: ${euro(value)}`).join(', ')}>{costs.map(([label, value, color]) => <span key={label} style={{ flex: value, background: color }} />)}</div>
          <dl className="dw-home-costs">{costs.map(([label, value, color]) => <div key={label}><dt><i style={{ background: color }} />{label}</dt><dd>{euro(value)}</dd></div>)}<div className="dw-home-cost-total"><dt>Totale / capo</dt><dd>{euro(cost)}</dd></div></dl>
        </Card>
      </div>
    </div>
  </div>;
}
