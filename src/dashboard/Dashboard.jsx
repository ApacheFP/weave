import React, { useEffect, useRef, useState } from 'react';
import { modules } from '../modules.js';
import ProfileMenu from '../ProfileMenu.jsx';
import { useDemo } from './DemoContext.jsx';
import { Badge, Button, Card, Dialog, Empty, Icon, Metrics } from './ui.jsx';
import { DesignPage, TechnicalPage, MaterialsPage, PatternPage, GradingPage, PrototypePage, MarkerPage } from './DesignPages.jsx';
import { PricingPage, PlanningPage, ProcurementPage, ProductionPage, QualityPage } from './OperationsPages.jsx';
import { ContextPage, DecisionPage, PassportPage } from './IdentityPages.jsx';
import { ServiceContent, serviceMap } from './services.jsx';
import { CreateStyleDialog, StyleSwitcher, WorkspaceSearch } from './WorkspaceControls.jsx';
import Assistant from './Assistant.jsx';
import './dashboard.css';

const notes = {
  1: 'Moodboard, brief creativo e varianti del capo.', 2: 'Tavole tecniche, punti di misura e tech pack.', 3: 'Distinta base, consumi, fornitori e tracciabilità.',
  4: 'Pezzi del modello, annotazioni e revisioni.', 5: 'Regole di grading e tabella misure per taglia.', 6: 'Campioni, fitting e approvazione del prototipo.',
  7: 'Configurazione del marker, consumi e scarto previsto.', 9: 'Costi unitari, scenari e approvazione del listino.', 10: 'Calendario, capacità dei laboratori e scadenze.',
  11: 'Fabbisogni, ordini di acquisto e stato delle consegne.', 12: 'Avanzamento del lotto, consumi e rilavorazioni.', 13: 'Controlli, non conformità e azioni correttive.',
  19: 'Identità, evidenze e viste del passaporto digitale.', 21: 'Stato dei moduli, relazioni ed eventi del capo.', 22: 'Conversazioni e scenari con il contesto del capo.',
};
const shortNames = { 1: 'Ideazione e design', 2: 'Disegno tecnico', 3: 'Materiali e BOM', 4: 'Modellistica', 5: 'Sviluppo taglie', 6: 'Prototipi', 7: 'Piazzamento', 9: 'Costi e pricing', 10: 'Pianificazione', 11: 'Acquisti', 12: 'Produzione', 13: 'Qualità', 19: 'Passaporto digitale', 21: 'Context Engine', 22: 'Assistente' };
const moduleIcons = { 1: 'pencil', 2: 'ruler', 3: 'layers', 4: 'scissors', 5: 'ruler', 6: 'shirt', 7: 'grid', 9: 'chart', 10: 'calendar', 11: 'box', 12: 'activity', 13: 'check', 19: 'file', 21: 'grid', 22: 'chat' };
const components = { 1: DesignPage, 2: TechnicalPage, 3: MaterialsPage, 4: PatternPage, 5: GradingPage, 6: PrototypePage, 7: MarkerPage, 9: PricingPage, 10: PlanningPage, 11: ProcurementPage, 12: ProductionPage, 13: QualityPage, 19: PassportPage, 21: ContextPage, 22: DecisionPage };
const serviceNotes = { 8: 'Ciclo di confezione e tempi standard', 14: 'Giacenze, lotti e ubicazioni', 15: 'Spedizioni e tracciamento ordini', 16: 'Clienti, quantità e ordini wholesale', 17: 'Listino, vendite e feedback retail', 18: 'Riparazioni e seconda vita', 20: 'Output e analisi per questo modulo' };

// Keep the shell navigable if a page fails, as in Prova1's stateFailed view.
class PageBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('WEAVE · pagina modulo:', error); }
  render() { return this.state.failed ? <Card title="La vista non si è caricata"><p>Puoi riaprire questo modulo oppure scegliere un altro modulo dalla sidebar.</p><Button onClick={() => this.setState({ failed: false })}>Riapri modulo</Button></Card> : this.props.children; }
}

function StylesPage({ onCreate, onOpen }) {
  const { data, styles, selectStyle } = useDemo(); const [query, setQuery] = useState('');
  const rows = styles.filter(item => `${item.title} ${item.styleId} ${item.collection}`.toLowerCase().includes(query.toLowerCase()));
  return <><Metrics items={[["Capi in Atelier", styles.length, 'Spazi di lavoro disponibili'], ['Capo selezionato', data.styleId, data.title], ['Collezione', data.collection, 'Sviluppo prodotto']]} /><Card title="Capi" note="Ogni riga apre la filiera del prodotto" actions={<Button primary icon="plus" onClick={onCreate}>Nuovo capo</Button>}><div className="dw-search"><span><Icon name="search" size={16} /><input aria-label="Cerca nella lista capi" placeholder="Cerca per nome, codice o collezione…" value={query} onChange={e => setQuery(e.target.value)} /></span><span className="dw-muted">{rows.length} risultati</span></div><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Capo</th><th>Codice</th><th>Collezione</th><th>Variante</th><th /></tr></thead><tbody>{rows.map(item => <tr key={item.styleId}><td><span className="dw-product-cell"><span className="dw-style-thumb"><Icon name="shirt" size={20} /></span><strong>{item.title}</strong>{data.styleId === item.styleId && <Badge>Attivo</Badge>}</span></td><td className="dw-code">{item.styleId}</td><td>{item.collection}</td><td>{item.variant}</td><td><Button onClick={() => { selectStyle(item.styleId); onOpen(); }}>Apri capo <Icon name="arrow" size={14} /></Button></td></tr>)}</tbody></table></div>{!rows.length && <Empty>Nessun capo corrisponde alla ricerca.</Empty>}</Card></>;
}

function ActivityPage({ moduleId, onNavigate, onService }) {
  const { data } = useDemo(); const [all, setAll] = useState(false);
  const events = data.events.filter(event => all || event.module === moduleId);
  return <Card title="Registro attività" note={`${data.title} · modifiche e decisioni della sessione`} actions={<label className="dw-check"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} />Tutta la filiera</label>}><div className="dw-event-list">{events.map(event => <div key={event.id}><span className="dw-event-dot" /><div><small>{event.time} · {modules.find(item => item.id === event.module)?.title}</small><button className="dw-event-link" onClick={() => components[event.module] ? onNavigate(event.module) : onService(event.module)}>{event.text}<Icon name="arrow" size={14} /></button></div></div>)}</div>{!events.length && <Empty>Le modifiche a questo modulo compariranno qui.</Empty>}</Card>;
}

function ConnectedServices({ moduleId }) {
  const list = serviceMap[moduleId] || []; const [selected, setSelected] = useState(list[0]);
  return <div className="dw-services-workspace"><nav aria-label="Servizi del modulo" className="dw-services-nav">{list.map(id => <button key={id} aria-pressed={selected === id} onClick={() => setSelected(id)}><Icon name={id === 20 ? 'spark' : id === 8 ? 'clock' : id === 14 ? 'box' : 'layers'} size={17} /><span><strong>{modules.find(item => item.id === id).title.replace(' e AI Specialistica', '').replace(' e Inventory', '')}</strong><small>{serviceNotes[id]}</small></span></button>)}</nav><div className="dw-page-content" key={selected}><ServiceContent moduleId={moduleId} serviceId={selected} /></div></div>;
}

export default function Dashboard({ moduleId, onNavigate, onHome, onSignOut }) {
  const { data } = useDemo();
  const [menu, setMenu] = useState(false); const [collapsed, setCollapsed] = useState(false);
  const [service, setService] = useState(null); const [chat, setChat] = useState(false); const [create, setCreate] = useState(false); const [search, setSearch] = useState(false);
  const [view, setView] = useState('workspace'); const [tab, setTab] = useState('work'); const page = useRef(null);
  const module = modules.find(m => m.id === moduleId); const Content = components[moduleId]; const services = serviceMap[moduleId] || [];
  useEffect(() => { setService(null); setChat(false); setMenu(false); setView('workspace'); setTab('work'); page.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [moduleId, data.styleId]);
  useEffect(() => { const key = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); } if (e.key === 'Escape') setMenu(false); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, []);
  function navigate(id) { setMenu(false); setView('workspace'); setTab('work'); onNavigate(id); }
  function created() { setCreate(false); navigate(1); }
  return <div className={`dw-app ${collapsed ? 'dw-collapsed' : ''}`} data-module={moduleId}>
    <a className="dw-skip" href="#module-workspace" onClick={event => { event.preventDefault(); page.current?.focus(); page.current?.scrollIntoView({ block: 'start' }); }}>Vai al contenuto</a>
    <header className="dw-header"><button className="dw-icon-btn dw-mobile-menu" aria-label={menu ? 'Chiudi navigazione moduli' : 'Apri navigazione moduli'} aria-expanded={menu} aria-controls="workspace-nav" onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'} /></button><button className="dw-brand" onClick={onHome} aria-label="Torna al carosello weave">weave<span className="brand-dot" aria-hidden="true">.</span></button><nav className="dw-breadcrumb" aria-label="Percorso"><button onClick={() => setView('styles')}>Atelier</button><span>/</span><span className="dw-breadcrumb-product">{data.title}</span><span>/</span><strong>{view === 'styles' ? 'Capi' : shortNames[moduleId]}</strong></nav><span className="dw-header-demo">Demo</span><ProfileMenu onSignOut={onSignOut} /></header>
    <div className="dw-layout">{menu && <button className="dw-nav-scrim" onClick={() => setMenu(false)} aria-label="Chiudi navigazione" />}
      <aside className={`dw-sidebar ${menu ? 'open' : ''}`} id="workspace-nav"><div className="dw-sidebar-top"><StyleSwitcher onCreate={() => setCreate(true)} onSelect={() => setView('workspace')} /></div><div className="dw-side-scroll"><nav className="dw-nav-quick" aria-label="Spazio di lavoro"><button onClick={() => setSearch(true)}><Icon name="search" size={16} /><span>Cerca</span><kbd>⌘ K</kbd></button><button aria-current={view === 'styles' ? 'page' : undefined} onClick={() => { setView('styles'); setMenu(false); }}><Icon name="shirt" size={16} /><span>Capi</span></button><button onClick={() => setCreate(true)}><Icon name="plus" size={16} /><span>Nuovo capo</span></button></nav><nav aria-label="Moduli della filiera">{[['Sviluppo prodotto', [1, 2, 3, 4, 5, 6, 7]], ['Operazioni', [9, 10, 11, 12, 13]], ['Identità e intelligence', [19, 21, 22]]].map(([label, ids]) => <div className="dw-nav-group" key={label}><span>{label}</span>{ids.map(id => <button key={id} title={shortNames[id]} aria-current={view === 'workspace' && moduleId === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={moduleIcons[id]} size={16} /><span>{shortNames[id]}</span>{id === 11 && data.purchaseOrders.some(o => o.status === 'In ritardo') && <i className="dw-nav-dot" />}</button>)}</div>)}</nav></div><div className="dw-sidebar-bottom"><button className="dw-back-carousel" onClick={onHome} title="Torna al carosello"><Icon name="back" size={16} /><span>Torna al carosello</span></button><button className="dw-icon-btn dw-collapse" aria-label={collapsed ? 'Espandi sidebar' : 'Riduci sidebar'} onClick={() => setCollapsed(!collapsed)}><Icon name="panel" size={16} /></button></div></aside>
      <div className="dw-main"><main id="module-workspace" ref={page} tabIndex={-1} className="dw-page"><div className="dw-page-head"><div><div className="dw-page-kicker"><span className="dw-code">{data.styleId}</span><span>·</span><span>{data.collection}</span></div><h1>{view === 'styles' ? 'Capi in Atelier' : shortNames[moduleId]}</h1><p>{view === 'styles' ? 'Gestisci i prodotti e apri il relativo spazio di lavoro.' : notes[moduleId]}</p></div><div className="dw-actions">{view === 'styles' ? <Button primary icon="plus" onClick={() => setCreate(true)}>Nuovo capo</Button> : moduleId !== 22 && <Button icon="chat" onClick={() => setChat(true)}>Assistente</Button>}</div></div>
        {view === 'workspace' && <div className="dw-workspace-toolbar"><div className="dw-page-tabs" role="tablist" aria-label="Viste del modulo">{[['work', 'Spazio di lavoro', 'grid'], ...(services.length ? [['services', 'Servizi integrati', 'layers']] : []), ['activity', 'Attività', 'activity']].map(([id, label, icon]) => <button key={id} role="tab" id={`view-${id}`} aria-selected={tab === id} aria-controls="dashboard-view" onClick={() => setTab(id)}><Icon name={icon} size={15} />{label}{id === 'services' && <span>{services.length}</span>}</button>)}</div><span className="dw-toolbar-product"><span className="dw-status-dot" />{data.produced ? 'In produzione' : 'In sviluppo'}</span></div>}
        <div className="dw-page-content" id="dashboard-view" role={view === 'workspace' ? 'tabpanel' : undefined} aria-labelledby={view === 'workspace' ? `view-${tab}` : undefined} key={`${moduleId}-${data.styleId}-${view}-${tab}`}><PageBoundary>{view === 'styles' ? <StylesPage onCreate={() => setCreate(true)} onOpen={() => navigate(1)} /> : tab === 'services' ? <ConnectedServices moduleId={moduleId} /> : tab === 'activity' ? <ActivityPage moduleId={moduleId} onNavigate={navigate} onService={setService} /> : <Content onNavigate={navigate} onService={setService} />}</PageBoundary></div>
      </main><footer className="dw-footer"><span>Atelier <i>/</i> {data.title}</span><span className="dw-code">{data.styleId}<span>·</span><span>Dati dimostrativi</span></span></footer></div>
    </div>
    {create && <CreateStyleDialog onClose={() => setCreate(false)} onCreated={created} />}
    {search && <WorkspaceSearch onNavigate={navigate} onClose={() => setSearch(false)} />}
    {service && <Dialog wide title={modules.find(m => m.id === service).title} note={`${module.title} · ${data.title} / ${data.styleId}`} onClose={() => setService(null)}><ServiceContent serviceId={service} moduleId={moduleId} /></Dialog>}
    {chat && <Dialog wide title="Assistente weave" note={`${module.title} · ${data.title} / ${data.styleId}`} onClose={() => setChat(false)}><Assistant key={`${moduleId}-${data.styleId}`} moduleId={moduleId} embedded /></Dialog>}
  </div>;
}
