import React, { useEffect, useRef, useState } from 'react';
import { modules } from '../modules.js';
import ProfileMenu from '../ProfileMenu.jsx';
import { useDemo } from './DemoContext.jsx';
import { sameActor } from './workspaceIdentity.js';
import WorkspaceStorageStatus from './WorkspaceStorageStatus.jsx';
import { Badge, Button, Card, Dialog, Empty, Icon, Tabs } from './ui.jsx';
import { DesignPage, TechnicalPage, MaterialsPage, PatternPage, GradingPage, PrototypePage, MarkerPage } from './DesignPages.jsx';
import { PricingPage, PlanningPage, ProcurementPage, ProductionPage, QualityPage } from './OperationsPages.jsx';
import { DecisionPage, PassportPage } from './IdentityPages.jsx';
import HomePage from './HomePage.jsx';
import ActivityPage from './ActivityPage.jsx';
import { ServiceContent } from './services.jsx';
import { CreateStyleDialog, StyleSwitcher, WorkspaceSearch } from './WorkspaceControls.jsx';
import Assistant from './Assistant.jsx';
import { ProductPhoto } from './Media.jsx';
import WorkspaceHome, { WorkspaceActivityPage } from './WorkspaceOverview.jsx';
import { CreateTaskDialog, InboxPage, MyTasksPage } from './PersonalPages.jsx';
import { SettingsPage, HelpMenu } from './AccountPages.jsx';
import NotificationsPage from './NotificationsPage.jsx';
import CollectionsPage from './CollectionsPage.jsx';
import './dashboard.css';
import './workspace-shell.css';

const shortNames = { 1: 'Ideazione e design', 2: 'Disegno tecnico', 3: 'Materiali e BOM', 4: 'Modellistica', 5: 'Sviluppo taglie', 6: 'Prototipi', 7: 'Piazzamento', 9: 'Costi e pricing', 10: 'Pianificazione', 11: 'Acquisti', 12: 'Produzione', 13: 'Qualità', 19: 'Passaporto digitale', 21: 'Panoramica del capo', 22: 'Assistente' };
const pageNames = { home: 'Home', inbox: 'Inbox', 'my-tasks': 'Le mie attività', notifications: 'Notifiche', capi: 'Capi', collections: 'Collezioni', activity: 'Attività della filiera', settings: 'Impostazioni', profile: 'Il tuo profilo' };
const moduleIcons = { 1: 'pencil', 2: 'ruler', 3: 'layers', 4: 'scissors', 5: 'ruler', 6: 'shirt', 7: 'grid', 9: 'chart', 10: 'calendar', 11: 'box', 12: 'activity', 13: 'check', 19: 'file', 21: 'home', 22: 'chat' };
const components = { 1: DesignPage, 2: TechnicalPage, 3: MaterialsPage, 4: PatternPage, 5: GradingPage, 6: PrototypePage, 7: MarkerPage, 9: PricingPage, 10: PlanningPage, 11: ProcurementPage, 12: ProductionPage, 13: QualityPage, 19: PassportPage, 21: HomePage, 22: DecisionPage };
// Keep the shell navigable if a page fails, as in Prova1's stateFailed view.
class PageBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('WEAVE · pagina modulo:', error); }
  render() { return this.state.failed ? <Card title="La vista non si è caricata"><p>Il browser non ha completato il caricamento. Ricarica la pagina per riprovare oppure scegli un altro modulo dalla sidebar.</p><Button onClick={() => window.location.reload()}>Ricarica la pagina</Button></Card> : this.props.children; }
}

function StylesPage({ onCreate, onOpen }) {
  const { workspaceItems, workspaceCollections, selectStyle } = useDemo();
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState('Griglia');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const search = query.toLowerCase().trim();
  const collections = [...new Set([...Object.keys(workspaceCollections), ...workspaceItems.map(item => item.collection)])].sort((a, b) => a.localeCompare(b, 'it-IT'));
  const rows = workspaceItems.filter(item => (collectionFilter === 'all' || item.collection === collectionFilter) && [item.title, item.collection, item.productId, item.styleId, item.variant].join(' ').toLowerCase().includes(search));
  const openStyle = id => { selectStyle(id); onOpen(); };
  return <div className="dw-styles-page">
    <div className="dw-page-head"><div><h2>Capi</h2><p>{workspaceItems.length} capi e varianti in Atelier · {workspaceItems.filter(item => !item.identityAssigned).length} in bozza</p></div><Button primary icon="plus" onClick={onCreate}>Nuovo capo</Button></div>
    <div className="dw-styles-toolbar"><div className="dw-styles-filters"><div className="dw-search"><span><Icon name="search" size={14} /><input aria-label="Cerca nella lista capi" placeholder="Cerca un capo…" value={query} onChange={e => setQuery(e.target.value)} /></span></div><select className="dw-styles-collection-filter" aria-label="Filtra per collezione" value={collectionFilter} onChange={event => setCollectionFilter(event.target.value)}><option value="all">Tutte le collezioni</option>{collections.map(name => <option key={name} value={name}>{name}</option>)}</select></div><Tabs items={['Griglia', 'Lista']} selected={layout} onChange={setLayout} label="Vista dei capi" /></div>
    {layout === 'Griglia' ? <div className="dw-style-grid dw-collection-products">{rows.map(item => <button type="button" className="dw-collection-product" key={item.styleId} onClick={() => openStyle(item.styleId)} aria-label={`Apri ${item.title} · ${item.variant}`}>
      <span className="dw-collection-product-image"><ProductPhoto product={item} sizes="(max-width: 760px) 100vw, 25vw" alt="" /></span>
      <span className="dw-collection-product-info"><span className="dw-collection-product-heading"><strong>{item.title}</strong></span><span className="dw-collection-product-footer"><small className="dw-collection-product-variant">{item.variant}</small><span className="dw-collection-product-action"><small className="dw-collection-product-model">{item.styleId}</small><span className="dw-collection-product-cta">Apri capo<Icon name="arrow" size={15} /></span></span></span></span>
    </button>)}</div> : <Card flush><div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Capo</th><th>Codice</th><th>Collezione</th><th>Variante</th><th /></tr></thead><tbody>{rows.map(item => <tr key={item.styleId}><td><span className="dw-product-cell"><span className="dw-style-card-photo"><ProductPhoto product={item} sizes="40px" alt="" /></span><strong>{item.title}</strong></span></td><td className="dw-code">{item.styleId}</td><td>{item.collection}</td><td>{item.variant}</td><td><Button onClick={() => openStyle(item.styleId)}>Apri capo<Icon name="arrow" size={14} /></Button></td></tr>)}</tbody></table></div></Card>}
    {!rows.length && <Empty>Nessun capo corrisponde ai filtri selezionati.</Empty>}
  </div>;
}

export default function Dashboard({ moduleId, workspacePage, inboxId, settingsSection, initialServiceId, onInitialServiceOpened, onOpenPage, onNavigate, onHome, onSignOut }) {
  const { data, notice, hasSelectedStyle, tasks, inbox, selectStyle, preferences, updatePreferences, storage, retrySave, reloadSavedWorkspace, exportWorkspace } = useDemo();
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [service, setService] = useState(null);
  const [chat, setChat] = useState(false);
  const [create, setCreate] = useState(false);
  const [createVariant, setCreateVariant] = useState(false);
  const [search, setSearch] = useState(false);
  const [newMenu, setNewMenu] = useState(false);
  const [createTask, setCreateTask] = useState(false);
  const [tab, setTab] = useState('work');
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const page = useRef(null);
  const content = useRef(null);
  const mobileTrigger = useRef(null);
  const newTrigger = useRef(null);
  const newRoot = useRef(null);
  const chatPanel = useRef(null);
  const chatTrigger = useRef(null);
  const pendingService = useRef(null);
  const navChord = useRef(false);
  const navChordTimer = useRef(null);
  const isModule = !workspacePage;
  const Content = components[moduleId];
  const title = isModule ? shortNames[moduleId] : pageNames[workspacePage];
  const unread = inbox.filter(item => !item.read).length;
  const mineOpen = tasks.filter(task => sameActor(task.assignee, data.profile) && task.status !== 'Completata').length;
  const theme = !preferences?.theme || preferences.theme === 'system' ? systemDark ? 'dark' : 'light' : preferences.theme;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const change = () => setSystemDark(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => () => clearTimeout(navChordTimer.current), []);
  useEffect(() => { if (chat) chatPanel.current?.querySelector('textarea')?.focus({ preventScroll: true }); }, [chat]);
  useEffect(() => { content.current?.scrollTo(0, 0); }, [moduleId, workspacePage, data.styleId, tab]);
  useEffect(() => {
    setService(pendingService.current); pendingService.current = null;
    setChat(false); setMenu(false); setNewMenu(false); setTab('work');
    page.current?.focus({ preventScroll: true });
  }, [moduleId, workspacePage, data.styleId]);
  useEffect(() => {
    if (!initialServiceId) return;
    setService({ id: initialServiceId, contextModuleId: ({ 15: 12, 17: 9 })[initialServiceId] || 21 });
    onInitialServiceOpened?.();
  }, [initialServiceId, onInitialServiceOpened]);
  useEffect(() => {
    const key = event => {
      if (event.defaultPrevented || event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        if (!document.querySelector('dialog[open]')) { event.preventDefault(); setSearch(true); }
        return;
      }
      if (event.key === 'Escape') {
        if (document.querySelector('.profile-panel,.dw-workspace-popover,.dw-help-popover,dialog[open]')) return;
        if (newMenu) { setNewMenu(false); newTrigger.current?.focus(); return; }
        setMenu(false);
        if (chat) closeAssistant();
        else if (menu) mobileTrigger.current?.focus();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key === 'Enter') {
        const form = document.activeElement?.closest('form');
        if (form) { event.preventDefault(); form.requestSubmit(); }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.shiftKey && event.key.toLowerCase() === 'l') { event.preventDefault(); updatePreferences({ theme: theme === 'dark' ? 'light' : 'dark' }); return; }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector('dialog[open],.profile-panel,.dw-workspace-popover,.dw-help-popover')) return;
      if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
      if (event.key === '/') { event.preventDefault(); setSearch(true); return; }
      const pressed = event.key.toLowerCase();
      if (navChord.current) {
        navChord.current = false; clearTimeout(navChordTimer.current);
        const routes = { h: 'home', t: 'my-tasks', p: 'capi', i: 'inbox', s: 'settings' };
        if (routes[pressed]) { event.preventDefault(); openPage(routes[pressed]); }
        return;
      }
      if (pressed === 'g') { navChord.current = true; event.preventDefault(); navChordTimer.current = setTimeout(() => { navChord.current = false; }, 900); return; }
      if (pressed === 'n') { event.preventDefault(); setCreateTask(true); }
      if (pressed === 'p') { event.preventDefault(); setCreate(true); }
      if (event.key === '[') { event.preventDefault(); setCollapsed(value => !value); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [menu, newMenu, chat, theme, updatePreferences]);
  useEffect(() => {
    if (!newMenu) return;
    newRoot.current?.querySelector('.dw-header-new-menu button')?.focus();
    const outside = event => { if (!newRoot.current?.contains(event.target)) setNewMenu(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [newMenu]);
  function navigate(id) { setMenu(false); setTab('work'); onNavigate(id); }
  function openPage(target) { setMenu(false); onOpenPage(target); }
  function closeAssistant() { setChat(false); if (chatTrigger.current?.isConnected) chatTrigger.current.focus({ preventScroll: true }); }
  function toggleAssistant(event) { if (chat) closeAssistant(); else { chatTrigger.current = event.currentTarget; setChat(true); } }
  function openModule(styleId, id) {
    const integrated = modules.find(item => item.id === id)?.serviceInfo || id === 20;
    const value = integrated ? { id, contextModuleId: ({ 8: 10, 14: 3, 15: 12, 16: 9, 17: 9, 18: 19, 20: 1 })[id] || 21 } : null;
    if (value && styleId !== data.styleId) pendingService.current = value;
    selectStyle(styleId);
    if (value) setService(value);
    else navigate(components[id] ? id : 21);
  }
  function openService(id) { setService({ id, contextModuleId: moduleId }); }
  function created() { setCreate(false); navigate(21); }
  function navItem(label, icon, action, selected, count, moduleId, navTone) {
    return <button type="button" key={label} title={label} data-module={moduleId} data-nav-tone={navTone} aria-current={selected ? 'page' : undefined} onClick={action}><Icon name={icon} size={16} /><span>{label}</span>{count > 0 && <small className="dw-nav-count">{count}</small>}</button>;
  }
  const globalContent = {
    home: <WorkspaceHome onOpenPage={openPage} onOpenModule={openModule} onCreate={() => setCreate(true)} />,
    inbox: <InboxPage initialSelectedId={inboxId} onSelectMessage={id => openPage(`inbox?message=${encodeURIComponent(id)}`)} onOpenModule={openModule} />,
    notifications: <NotificationsPage onSelectMessage={id => openPage(`inbox?message=${encodeURIComponent(id)}`)} onOpenPage={openPage} />,
    'my-tasks': <MyTasksPage onOpenModule={openModule} />,
    capi: <StylesPage onCreate={() => setCreate(true)} onOpen={() => navigate(21)} />,
    collections: <CollectionsPage onOpenModule={openModule} />,
    activity: <WorkspaceActivityPage onOpenModule={openModule} />,
    settings: <SettingsPage section={settingsSection || 'appearance'} onSectionChange={section => openPage(`settings?section=${section}`)} />,
    profile: <SettingsPage section="profile" onSectionChange={section => openPage(`settings?section=${section}`)} />,
  };
  return <div className={`dw-app ${collapsed ? 'dw-collapsed' : ''}`} data-module={isModule ? moduleId : undefined} data-workspace-page={workspacePage || undefined} data-ui-theme={theme} data-ui-accent={preferences?.accent || 'graphite'} data-sidebar-density={preferences?.sideDensity || 'comfortable'} data-task-density={preferences?.taskDensity || 'comfortable'} data-motion={preferences?.motion || 'system'}>
    <a className="dw-skip" href="#module-workspace" onClick={event => { event.preventDefault(); page.current?.focus(); content.current?.scrollTo(0, 0); }}>Vai al contenuto</a>
    <div className="dw-layout">
      {menu && <button className="dw-nav-scrim" onClick={() => { setMenu(false); mobileTrigger.current?.focus(); }} aria-label="Chiudi navigazione" />}
      <aside className={`dw-sidebar ${menu ? 'open' : ''}`} id="workspace-nav">
        <div className="dw-sidebar-brand">
          <button className="dw-brand" onClick={() => openPage('home')} aria-label="Home di WEAVE"><strong>weave</strong></button>
          <button className="dw-icon-btn dw-collapse" aria-label={collapsed ? 'Espandi sidebar' : 'Riduci sidebar'} onClick={() => setCollapsed(!collapsed)}><Icon name="panel" size={16} /></button>
        </div>
        <div className="dw-sidebar-workspace-nav">
          <div className="dw-sidebar-workspace">
            <details className="dw-company-switcher">
              <summary><span className="dw-company-label"><strong>{preferences?.workspaceName || 'Atelier'}</strong><span className="dw-company-demo">Demo</span></span><Icon name="chevron" size={15} /></summary>
              <div className="dw-company-options"><button type="button" aria-current="true"><span><strong>{preferences?.workspaceName || 'Atelier'}</strong><small>Azienda attiva</small></span><Icon name="check" size={15} /></button><button type="button" disabled><span><strong>Atelier Studio</strong><small>Dati demo · anteprima</small></span><Badge>Demo</Badge></button></div>
            </details>
          </div>
          <nav className="dw-nav-quick dw-personal-nav" aria-label="Navigazione principale"><div className="dw-nav-group-card">
            {navItem('Home', 'home', () => openPage('home'), workspacePage === 'home', 0, undefined, 'home')}
            {navItem('Inbox', 'inbox', () => openPage('inbox'), workspacePage === 'inbox', unread, undefined, 'inbox')}
            {navItem('Le mie attività', 'list', () => openPage('my-tasks'), workspacePage === 'my-tasks', mineOpen, undefined, 'tasks')}
            {navItem('Collezioni', 'layers', () => openPage('collections'), workspacePage === 'collections', 0, undefined, 'collections')}
            {navItem('Capi', 'shirt', () => openPage('capi'), workspacePage === 'capi', 0, undefined, 'styles')}
            {navItem('Notifiche', 'bell', () => openPage('notifications'), workspacePage === 'notifications', unread, undefined, 'notifications')}
            {navItem('Attività della filiera', 'activity', () => openPage('activity'), workspacePage === 'activity', 0, undefined, 'activity')}
          </div>
          </nav>
        </div>
        <div className="dw-side-scroll">
          <div className="dw-sidebar-top"><span className="dw-sidebar-kicker">{hasSelectedStyle ? 'CAPO SELEZIONATO' : 'SELEZIONA CAPO'}</span><div className="dw-sidebar-product-card"><StyleSwitcher selected={hasSelectedStyle} onCreate={() => { setCreateVariant(false); setCreate(true); }} onCreateVariant={() => { setCreateVariant(true); setCreate(true); }} onSelect={() => navigate(21)} />
            {hasSelectedStyle && <nav className="dw-nav-group dw-cap-overview" aria-label="Panoramica del capo">{navItem('Panoramica del capo', 'grid', () => navigate(21), isModule && moduleId === 21, 0, 21, 'overview')}</nav>}
          </div></div>
          {hasSelectedStyle && <>
            <nav className="dw-cap-nav" aria-label={`Moduli di ${data.title}`}>
              {[['Sviluppo prodotto', [1, 2, 3, 4, 5, 6, 7]], ['Operazioni', [9, 10, 11, 12, 13]], ['Identità e intelligence', [19, 22]]].map(([label, ids]) => <div className="dw-nav-group" key={label}><span>{label}</span><div className="dw-nav-group-card">{ids.map(id => <button key={id} type="button" title={shortNames[id]} data-module={id} aria-current={isModule && moduleId === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={moduleIcons[id]} size={16} /><span>{shortNames[id]}</span>{id === 11 && data.purchaseOrders.some(order => order.status === 'In ritardo') && <i className="dw-nav-dot" />}</button>)}</div></div>)}
            </nav>
          </>}
        </div>
        <div className="dw-sidebar-bottom">
          <div className="dw-sidebar-bottom-card">
            <nav className="dw-nav-quick dw-account-nav" aria-label="Account e risorse">
              <HelpMenu onSearch={() => setSearch(true)} />
              {navItem('Impostazioni', 'settings', () => openPage('settings'), workspacePage === 'settings' || workspacePage === 'profile')}
            </nav>
            <ProfileMenu sidebar collapsed={collapsed} onSignOut={onSignOut} onProfile={() => openPage('profile')} onSettings={() => openPage('settings')} />
          </div>
        </div>
      </aside>
      <div className="dw-main">
        <header className="dw-header">
          <button ref={mobileTrigger} className="dw-icon-btn dw-mobile-menu" aria-label={menu ? 'Chiudi navigazione' : 'Apri navigazione'} aria-expanded={menu} aria-controls="workspace-nav" onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'} /></button>
          <nav className="dw-breadcrumb" aria-label="Percorso">{hasSelectedStyle && isModule && moduleId !== 21 && <><button className="dw-breadcrumb-product" onClick={() => navigate(21)}>{data.title}</button><span>/</span></>}<strong>{hasSelectedStyle ? isModule && moduleId === 21 ? data.title : title : 'Seleziona un capo'}</strong></nav>
          <div className="dw-header-tools"><WorkspaceStorageStatus storage={storage} onRetry={retrySave} onReload={reloadSavedWorkspace} onExport={exportWorkspace} />
            <button className="dw-header-search" onClick={() => setSearch(true)} aria-label="Cerca pagine, moduli e capi"><Icon name="search" size={15} /><span>Cerca in Atelier…</span><kbd>⌘ K</kbd></button>
            <button className="dw-icon-btn dw-header-inbox" aria-label={`Notifiche${unread ? `, ${unread} da leggere` : ''}`} onClick={() => openPage('notifications')}><Icon name="bell" size={17} />{unread > 0 && <i aria-hidden="true" />}</button>
            <div className="dw-header-new" ref={newRoot}>
              <button ref={newTrigger} type="button" className="dw-btn dw-header-create" aria-label="Crea nuovo" aria-expanded={newMenu} aria-controls={newMenu ? 'header-create-menu' : undefined} onClick={() => setNewMenu(open => !open)}><Icon name="plus" size={14} /><span>Nuovo</span><span className="dw-header-new-chevron"><Icon name="back" size={12} /></span></button>
              {newMenu && <div className="dw-header-new-menu" id="header-create-menu" role="group" aria-label="Azioni rapide">
                <button type="button" onClick={() => { setNewMenu(false); setCreate(true); }}><Icon name="shirt" size={15} />Nuovo capo</button>
                <button type="button" onClick={() => { setNewMenu(false); setCreateTask(true); }}><Icon name="list" size={15} />Nuova attività</button>
                <button type="button" onClick={onHome}><Icon name="layers" size={15} />Carosello dei moduli</button>
              </div>}
            </div>
            <ProfileMenu compact onSignOut={onSignOut} onProfile={() => openPage('profile')} onSettings={() => openPage('settings')} />
          </div>
        </header>
        <div className="dw-content" ref={content}>
          <main id="module-workspace" ref={page} tabIndex={-1} className={`dw-page ${['capi', 'collections'].includes(workspacePage) ? 'dw-page-wide' : ''} ${workspacePage === 'inbox' ? 'dw-page-inbox' : ''} ${workspacePage === 'my-tasks' ? 'dw-page-my-tasks' : ''}`}>
            <h1 className="sr-only">{title}</h1>
            {isModule && hasSelectedStyle && <div className="dw-workspace-toolbar"><div className="dw-page-tabs" role="tablist" aria-label="Viste del modulo">{[['work', 'Panoramica', moduleId === 21 ? 'home' : 'grid'], ['activity', 'Attività', 'activity']].map(([id, label, icon], index, all) => <button key={id} role="tab" id={`view-${id}`} tabIndex={tab === id ? 0 : -1} aria-selected={tab === id} aria-controls="dashboard-view" onClick={() => setTab(id)} onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? all.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
              setTab(all[next][0]); document.getElementById(`view-${all[next][0]}`)?.focus();
            }}><Icon name={icon} size={15} />{label}</button>)}</div></div>}
            <div className="dw-page-content" id="dashboard-view" role={isModule ? 'tabpanel' : undefined} aria-labelledby={isModule ? `view-${tab}` : undefined} key={`${workspacePage || moduleId}-${isModule ? data.styleId : ''}-${tab}`}>
              <PageBoundary>{!isModule ? globalContent[workspacePage] : !hasSelectedStyle ? <Empty>Seleziona un capo dalla sidebar per aprire la dashboard del prodotto.</Empty> : tab === 'activity' ? <ActivityPage moduleId={moduleId} onNavigate={navigate} onService={openService} /> : <Content onNavigate={navigate} onService={openService} onActivity={() => setTab('activity')} />}</PageBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
    {create && <CreateStyleDialog variant={createVariant} onClose={() => { setCreate(false); setCreateVariant(false); }} onCreated={() => { setCreateVariant(false); created(); }} />}
    {createTask && <CreateTaskDialog onClose={() => setCreateTask(false)} />}
    {search && <WorkspaceSearch onNavigate={navigate} onOpenPage={openPage} onClose={() => setSearch(false)} />}
    {service && <Dialog wide title={modules.find(item => item.id === service.id)?.title || 'Servizio WEAVE'} note={`${shortNames[service.contextModuleId]} · ${data.title} / ${data.styleId}`} onClose={() => setService(null)}><ServiceContent key={`${service.id}-${data.styleId}`} serviceId={service.id} moduleId={service.contextModuleId} /></Dialog>}
    {isModule && hasSelectedStyle && moduleId !== 22 && <div className="dw-assistant-dock">
      {chat && <section ref={chatPanel} id="weave-assistant-panel" className="dw-assistant-panel" role="dialog" aria-label="Assistente weave" aria-modal="false"><Assistant key={`${moduleId}-${data.styleId}`} moduleId={moduleId} embedded onClose={closeAssistant} /></section>}
      <div className="dw-assistant-launcher-row">
        <button className={`dw-assistant-launcher ${chat ? 'is-open' : ''}`} type="button" aria-expanded={chat} aria-controls={chat ? 'weave-assistant-panel' : undefined} onClick={toggleAssistant}><span className="dw-assistant-launcher-copy"><small>Hai un dubbio?</small><strong>{chat ? 'Chiudi Filo' : 'Chiedi a Filo'}</strong></span></button>
        <button className="dw-assistant-filo" type="button" aria-label={chat ? 'Chiudi Filo' : 'Apri l’assistente Filo'} aria-expanded={chat} aria-controls={chat ? 'weave-assistant-panel' : undefined} onClick={toggleAssistant}><picture>{preferences?.motion !== 'reduce' && <source srcSet="/filo-saluta.gif" type="image/gif" media="(prefers-reduced-motion: no-preference)" />}<img src="/mascot-filo.png" alt="" /></picture></button>
      </div>
    </div>}
    <div className="dw-toast" role="status" aria-live="polite">{notice && <span key={notice}>{notice}</span>}</div>
  </div>;
}
