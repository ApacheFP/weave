import React, { useEffect, useRef, useState } from 'react';
import { modules } from '../modules.js';
import ProfileMenu from '../ProfileMenu.jsx';
import { useDemo } from './DemoContext.jsx';
import { Badge, Button, Card, Dialog, Empty, Icon, Metrics } from './ui.jsx';
import { DesignPage, TechnicalPage, MaterialsPage, PatternPage, GradingPage, PrototypePage, MarkerPage } from './DesignPages.jsx';
import { PricingPage, PlanningPage, ProcurementPage, ProductionPage, QualityPage } from './OperationsPages.jsx';
import { DecisionPage, PassportPage } from './IdentityPages.jsx';
import HomePage from './HomePage.jsx';
import ActivityPage from './ActivityPage.jsx';
import { ServiceContent } from './services.jsx';
import { CreateStyleDialog, StyleSwitcher, WorkspaceSearch } from './WorkspaceControls.jsx';
import Assistant from './Assistant.jsx';
import { ProductPhoto } from './Media.jsx';
import './dashboard.css';

const shortNames = { 1: 'Ideazione e design', 2: 'Disegno tecnico', 3: 'Materiali e BOM', 4: 'Modellistica', 5: 'Sviluppo taglie', 6: 'Prototipi', 7: 'Piazzamento', 9: 'Costi e pricing', 10: 'Pianificazione', 11: 'Acquisti', 12: 'Produzione', 13: 'Qualità', 19: 'Passaporto digitale', 21: 'Home', 22: 'Assistente' };
const moduleIcons = { 1: 'pencil', 2: 'ruler', 3: 'layers', 4: 'scissors', 5: 'ruler', 6: 'shirt', 7: 'grid', 9: 'chart', 10: 'calendar', 11: 'box', 12: 'activity', 13: 'check', 19: 'file', 21: 'home', 22: 'chat' };
const components = { 1: DesignPage, 2: TechnicalPage, 3: MaterialsPage, 4: PatternPage, 5: GradingPage, 6: PrototypePage, 7: MarkerPage, 9: PricingPage, 10: PlanningPage, 11: ProcurementPage, 12: ProductionPage, 13: QualityPage, 19: PassportPage, 21: HomePage, 22: DecisionPage };
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
  return <><Metrics items={[["Capi in Atelier", styles.length, 'Spazi di lavoro disponibili'], ['Capo selezionato', data.identityAssigned ? data.styleId : 'Bozza', data.title], ['Collezione', data.collection, 'Sviluppo prodotto']]} /><Card title="Capi" note="Ogni riga apre la filiera del prodotto" actions={<Button primary icon="plus" onClick={onCreate}>Nuovo capo</Button>}><div className="dw-search"><span><Icon name="search" size={16} /><input aria-label="Cerca nella lista capi" placeholder="Cerca per nome, codice o collezione…" value={query} onChange={e => setQuery(e.target.value)} /></span><span className="dw-muted">{rows.length} risultati</span></div><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Capo</th><th>Codice</th><th>Collezione</th><th>Variante</th><th /></tr></thead><tbody>{rows.map(item => <tr key={item.styleId}><td><span className="dw-product-cell"><span className="dw-style-thumb"><ProductPhoto variant={item.variant} sizes="44px" /></span><strong>{item.title}</strong>{data.styleId === item.styleId && <Badge>Attivo</Badge>}</span></td><td className="dw-code">{item.identityAssigned ? item.styleId : 'Bozza'}</td><td>{item.collection}</td><td>{item.variant}</td><td><Button onClick={() => { selectStyle(item.styleId); onOpen(); }}>Apri capo <Icon name="arrow" size={14} /></Button></td></tr>)}</tbody></table></div>{!rows.length && <Empty>Nessun capo corrisponde alla ricerca.</Empty>}</Card></>;
}

export default function Dashboard({ moduleId, onNavigate, onHome, onSignOut }) {
  const { data } = useDemo();
  const [menu, setMenu] = useState(false); const [collapsed, setCollapsed] = useState(false);
  const [service, setService] = useState(null); const [chat, setChat] = useState(false); const [create, setCreate] = useState(false); const [search, setSearch] = useState(false);
  const [view, setView] = useState('workspace'); const [tab, setTab] = useState('work'); const page = useRef(null);
  const Content = components[moduleId];
  useEffect(() => { setService(null); setChat(false); setMenu(false); setView('workspace'); setTab('work'); page.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [moduleId, data.styleId]);
  useEffect(() => { const key = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); } if (e.key === 'Escape') setMenu(false); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, []);
  function navigate(id) { setMenu(false); setView('workspace'); setTab('work'); onNavigate(id); }
  function created() { setCreate(false); navigate(21); }
  return <div className={`dw-app ${collapsed ? 'dw-collapsed' : ''}`} data-module={moduleId}>
    <a className="dw-skip" href="#module-workspace" onClick={event => { event.preventDefault(); page.current?.focus(); page.current?.scrollIntoView({ block: 'start' }); }}>Vai al contenuto</a>
    <header className="dw-header"><button className="dw-icon-btn dw-mobile-menu" aria-label={menu ? 'Chiudi navigazione moduli' : 'Apri navigazione moduli'} aria-expanded={menu} aria-controls="workspace-nav" onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'} /></button><button className="dw-brand" onClick={onHome} aria-label="Torna al carosello weave">weave<span className="brand-dot" aria-hidden="true">.</span></button><nav className="dw-breadcrumb" aria-label="Percorso"><button onClick={() => setView('styles')}>Atelier</button><span>/</span><span className="dw-breadcrumb-product">{data.title}</span><span>/</span><strong>{view === 'styles' ? 'Capi' : shortNames[moduleId]}</strong></nav><span className="dw-header-demo">Demo</span><button className="dw-header-search" onClick={() => setSearch(true)} aria-label="Cerca moduli e capi"><Icon name="search" size={18} /><span>Cerca in Atelier…</span><kbd>⌘ K</kbd></button><ProfileMenu onSignOut={onSignOut} /></header>
    <div className="dw-layout">{menu && <button className="dw-nav-scrim" onClick={() => setMenu(false)} aria-label="Chiudi navigazione" />}
      <aside className={`dw-sidebar ${menu ? 'open' : ''}`} id="workspace-nav"><div className="dw-sidebar-top"><StyleSwitcher onCreate={() => setCreate(true)} onSelect={() => navigate(21)} /></div><div className="dw-side-scroll"><nav className="dw-nav-quick" aria-label="Spazio di lavoro"><button title="Home" aria-current={view === 'workspace' && moduleId === 21 ? 'page' : undefined} onClick={() => navigate(21)}><Icon name="home" size={16} /><span>Home</span></button><button aria-current={view === 'styles' ? 'page' : undefined} onClick={() => { setView('styles'); setMenu(false); }}><Icon name="shirt" size={16} /><span>Capi</span></button><button onClick={() => setCreate(true)}><Icon name="plus" size={16} /><span>Nuovo capo</span></button></nav><nav aria-label="Moduli della filiera">{[['Sviluppo prodotto', [1, 2, 3, 4, 5, 6, 7]], ['Operazioni', [9, 10, 11, 12, 13]], ['Identità e intelligence', [19, 22]]].map(([label, ids]) => <div className="dw-nav-group" key={label}><span>{label}</span>{ids.map(id => <button key={id} title={shortNames[id]} aria-current={view === 'workspace' && moduleId === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={moduleIcons[id]} size={16} /><span>{shortNames[id]}</span>{id === 11 && data.purchaseOrders.some(o => o.status === 'In ritardo') && <i className="dw-nav-dot" />}</button>)}</div>)}</nav></div><div className="dw-sidebar-bottom"><button className="dw-back-carousel" onClick={onHome} title="Torna al carosello"><Icon name="back" size={16} /><span>Torna al carosello</span></button><button className="dw-icon-btn dw-collapse" aria-label={collapsed ? 'Espandi sidebar' : 'Riduci sidebar'} onClick={() => setCollapsed(!collapsed)}><Icon name="panel" size={16} /></button></div></aside>
      <div className="dw-main"><main id="module-workspace" ref={page} tabIndex={-1} className="dw-page"><h1 className="sr-only">{view === 'styles' ? 'Capi in Atelier' : shortNames[moduleId]}</h1>
        {view === 'workspace' && <div className="dw-workspace-toolbar"><div className="dw-page-tabs" role="tablist" aria-label="Viste del modulo">{[['work', 'Panoramica', moduleId === 21 ? 'home' : 'grid'], ['activity', 'Attività', 'activity']].map(([id, label, icon]) => <button key={id} role="tab" id={`view-${id}`} aria-selected={tab === id} aria-controls="dashboard-view" onClick={() => setTab(id)}><Icon name={icon} size={15} />{label}</button>)}</div><Button icon="chat" onClick={() => setChat(true)}>Assistente</Button></div>}
        <div className="dw-page-content" id="dashboard-view" role={view === 'workspace' ? 'tabpanel' : undefined} aria-labelledby={view === 'workspace' ? `view-${tab}` : undefined} key={`${moduleId}-${data.styleId}-${view}-${tab}`}><PageBoundary>{view === 'styles' ? <StylesPage onCreate={() => setCreate(true)} onOpen={() => navigate(21)} /> : tab === 'activity' ? <ActivityPage moduleId={moduleId} onNavigate={navigate} onService={setService} /> : <Content onNavigate={navigate} onService={setService} onActivity={() => setTab('activity')} />}</PageBoundary></div>
      </main><footer className="dw-footer"><span>Atelier <i>/</i> {data.title}</span><span className="dw-code">{data.identityAssigned ? data.styleId : 'Bozza'}<span>·</span><span>Dati dimostrativi</span></span></footer></div>
    </div>
    {create && <CreateStyleDialog onClose={() => setCreate(false)} onCreated={created} />}
    {search && <WorkspaceSearch onNavigate={navigate} onClose={() => setSearch(false)} />}
    {service && <Dialog wide title={modules.find(m => m.id === service).title} note={`${shortNames[moduleId]} · ${data.title} / ${data.styleId}`} onClose={() => setService(null)}><ServiceContent serviceId={service} moduleId={moduleId} /></Dialog>}
    {chat && <Dialog wide title="Assistente weave" note={`${shortNames[moduleId]} · ${data.title} / ${data.styleId}`} onClose={() => setChat(false)}><Assistant key={`${moduleId}-${data.styleId}`} moduleId={moduleId} embedded /></Dialog>}
  </div>;
}
