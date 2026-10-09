import React, { useEffect, useRef, useState } from 'react';
import { modules, moduleGroups } from '../modules.js';
import ProfileMenu from '../ProfileMenu.jsx';
import { useDemo } from './DemoContext.jsx';
import { Badge, Button, Dialog, Icon } from './ui.jsx';
import { DesignPage, TechnicalPage, MaterialsPage, PatternPage, GradingPage, PrototypePage, MarkerPage } from './DesignPages.jsx';
import { PricingPage, PlanningPage, ProcurementPage, ProductionPage, QualityPage } from './OperationsPages.jsx';
import { ContextPage, DecisionPage, PassportPage } from './IdentityPages.jsx';
import { ServiceContent, ServiceStrip, serviceMap } from './services.jsx';
import Assistant from './Assistant.jsx';
import './dashboard.css';

const notes = {
  1: 'Dai riferimenti a una direzione creativa condivisa.', 2: 'Lo schizzo diventa un linguaggio preciso.', 3: 'Ogni materiale, il suo costo e la sua origine.',
  4: 'Costruisci la forma, conserva ogni revisione.', 5: 'La stessa idea, in ogni proporzione.', 6: 'Prova, correggi e approva il primo capo.',
  7: 'Meno spazio perso, più valore nella materia.', 9: 'Comprendi il costo prima di scegliere il prezzo.', 10: 'Persone, capacità e scadenze sullo stesso piano.',
  11: 'Ordini e materiali, dal fornitore al laboratorio.', 12: 'Segui il capo mentre prende forma.', 13: 'Dalle evidenze a una qualità verificata.',
  19: 'L’identità del capo, costruita lungo tutta la filiera.', 21: 'Stato, eventi e relazioni del tuo prodotto.', 22: 'Un assistente per scenari, segnali e decisioni.',
};
const shortNames = { 1: 'Ideazione e design', 2: 'Disegno tecnico', 3: 'Materiali e BOM', 4: 'Modellistica', 5: 'Sviluppo taglie', 6: 'Prototipi', 7: 'Piazzamento', 9: 'Costi e pricing', 10: 'Pianificazione', 11: 'Acquisti', 12: 'Produzione', 13: 'Qualità', 19: 'Passaporto digitale', 21: 'Context Engine', 22: 'Assistente' };
const components = { 1: DesignPage, 2: TechnicalPage, 3: MaterialsPage, 4: PatternPage, 5: GradingPage, 6: PrototypePage, 7: MarkerPage, 9: PricingPage, 10: PlanningPage, 11: ProcurementPage, 12: ProductionPage, 13: QualityPage, 19: PassportPage, 21: ContextPage, 22: DecisionPage };

export default function Dashboard({ moduleId, onNavigate, onHome, onSignOut }) {
  const { data } = useDemo(); const [menu, setMenu] = useState(false); const [service, setService] = useState(null); const [chat, setChat] = useState(false); const page = useRef(null);
  const module = modules.find(m => m.id === moduleId); const Content = components[moduleId];
  useEffect(() => { setService(null); setChat(false); setMenu(false); page.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [moduleId]);
  useEffect(() => { if (!menu) return; const escape = e => { if (e.key === 'Escape') setMenu(false); }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape); }, [menu]);
  function navigate(id) { setMenu(false); onNavigate(id); }
  return <div className="dw-app" data-module={moduleId}>
    <a className="dw-skip" href="#module-workspace">Vai al contenuto</a>
    <header className="dw-header"><button className="dw-icon-btn dw-mobile-menu" aria-label={menu ? 'Chiudi navigazione moduli' : 'Apri navigazione moduli'} aria-expanded={menu} aria-controls="workspace-nav" onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'} /></button><button className="dw-brand" onClick={onHome} aria-label="Torna al carosello weave">weave<span className="brand-dot" aria-hidden="true">.</span></button><nav className="dw-breadcrumb" aria-label="Percorso"><button onClick={onHome}>Moduli</button><span>/</span><strong>{shortNames[moduleId]}</strong></nav><Badge>Demo</Badge><ProfileMenu onSignOut={onSignOut} /></header>
    <div className="dw-layout">{menu && <button className="dw-nav-scrim" onClick={() => setMenu(false)} aria-label="Chiudi navigazione" />}
      <aside className={`dw-sidebar ${menu ? 'open' : ''}`} id="workspace-nav"><div className="dw-sidebar-top"><span className="dw-eyebrow">IL TUO SPAZIO</span><strong>Atelier / AI 2027</strong><span className="dw-sidebar-product"><Icon name="shirt" size={16} />GJ-0421</span></div><nav aria-label="Moduli della filiera">{[['CREAZIONE', [1, 2, 3, 4, 5, 6, 7]], ['OPERAZIONI', [9, 10, 11, 12, 13]], ['IDENTITÀ E INTELLIGENZA', [19, 21, 22]]].map(([label, ids]) => <div className="dw-nav-group" key={label}><span>{label}</span>{ids.map(id => <button key={id} aria-current={moduleId === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={id === 22 ? 'chat' : id === 21 ? 'grid' : id === 19 ? 'file' : id <= 7 ? 'shirt' : 'layers'} size={17} /><span>{shortNames[id]}</span>{id === 11 && data.purchaseOrders.some(o => o.status === 'In ritardo') && <i className="dw-nav-dot" />}</button>)}</div>)}</nav><button className="dw-back-carousel" onClick={onHome}><Icon name="back" size={15} />Torna al carosello</button></aside>
      <div className="dw-main"><main id="module-workspace" ref={page} tabIndex={-1} key={moduleId} className="dw-page"><div className="dw-page-head"><div><span className="dw-eyebrow">{module.category} <span>/</span> GJ-0421</span><h1>{module.title}</h1><p>{notes[moduleId]}</p></div>{moduleId !== 22 && <Button icon="chat" onClick={() => setChat(true)}>Chiedi a weave</Button>}</div><div className="dw-page-content"><Content onNavigate={navigate} onService={setService} /><ServiceStrip moduleId={moduleId} onOpen={setService} /></div></main><footer className="dw-footer"><span><b>weave<span className="brand-dot">.</span></b>Un filo comune, dall’idea al capo.</span><span>GJ-0421 <i>·</i> Dati dimostrativi</span></footer></div>
    </div>
    {service && <Dialog wide title={modules.find(m => m.id === service).title} note={`Dentro ${module.title.toLowerCase()} · GJ-0421`} onClose={() => setService(null)}><ServiceContent serviceId={service} moduleId={moduleId} /></Dialog>}
    {chat && <Dialog wide title="Assistente weave" note={`Contesto: ${module.title} · GJ-0421`} onClose={() => setChat(false)}><Assistant key={moduleId} moduleId={moduleId} embedded /></Dialog>}
  </div>;
}
