import React, { useCallback, useEffect, useRef, useState } from 'react';
import { moduleGroups } from './modules.js';
import { createModuleCards } from './cards.js';
import AuthPage from './AuthPage.jsx';
import ProfileMenu from './ProfileMenu.jsx';
import { DemoProvider } from './dashboard/DemoContext.jsx';
import Dashboard from './dashboard/Dashboard.jsx';

function Arrow({ direction }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={direction === 'left' ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'} /></svg>;
}

function CardCarousel({ group, onReady, onEnter, startIndex = 0, onIndexChange }) {
  const { items, label } = group;
  const host = useRef(null);
  const carousel = useRef(null);
  const entry = useRef(null);
  const infoButton = useRef(null);
  const [index, setIndex] = useState(startIndex);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [infoCard, setInfoCard] = useState(null);
  const infoState = infoCard?.id === items[index].id ? infoCard.state : '';

  useEffect(() => {
    let active = true;
    let engine;

    async function boot() {
      try {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const cards = await createModuleCards(items);
        if (!active) return;
        engine = window.MFCarousel.createCarousel(host.current, {
          startCard: startIndex,
          ...(reducedMotion ? { thAmount: 0, motionBlur: 0, stiffness: 30 } : {}),
        }, cards, {
          start: startIndex,
          onIndex: next => { if (active) { setIndex(next); setInfoCard(null); onIndexChange(group.id, next); } },
          onFrame: bounds => {
            if (!active || !entry.current) return;
            const element = entry.current;
            element.style.left = `${bounds.left}px`;
            element.style.top = `${bounds.top}px`;
            element.style.width = `${bounds.width}px`;
            element.style.height = `${bounds.height}px`;
            element.style.setProperty('--card-copy-size', `${bounds.width * .038}px`);
            element.dataset.moving = !bounds.settled;
          },
        });
        carousel.current = engine;
        engine.renderer.domElement.setAttribute('aria-hidden', 'true');
        await engine.ready;
        if (active) {
          setReady(true);
          onReady();
        }
      } catch (cause) {
        console.error('Impossibile avviare il carosello:', cause);
        if (active) {
          setError('Impossibile caricare il carosello. Ricarica la pagina per riprovare.');
          onReady();
        }
      }
    }

    boot();
    return () => {
      active = false;
      engine?.dispose();
      carousel.current = null;
    };
  }, [items, onReady, onEnter, onIndexChange, group.id]);

  function handleKey(event) {
    if (event.target !== host.current) return;
    if (!carousel.current) return;
    if (event.key === 'ArrowLeft') carousel.current.go(-1);
    else if (event.key === 'ArrowRight') carousel.current.go(1);
    else if (event.key === 'Home') carousel.current.show(0);
    else if (event.key === 'End') carousel.current.show(items.length - 1);
    else if (event.key === 'Enter' && group.id === 'modules' && ready) onEnter(items[index].id);
    else return;
    event.preventDefault();
  }

  function closeServiceInfo() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInfoCard(null);
      infoButton.current?.focus({ preventScroll: true });
    } else {
      setInfoCard({ id: items[index].id, state: 'closing' });
    }
  }

  return (
    <section className="carousel" id={`carousel-${group.id}`} role="tabpanel" aria-labelledby={`tab-${group.id}`} aria-describedby="carousel-context carousel-hint" aria-roledescription="carosello" onKeyDown={handleKey}>
      <div className="carousel-stage" ref={host} tabIndex={0} aria-label={`Esplora ${label.toLowerCase()} con le frecce della tastiera`} aria-describedby="carousel-hint">
        <div className="card-entry" ref={entry} data-moving="true">
          {group.id === 'modules' && <div className="card-entry-footer"><p>{items[index].copy.join(' ')}</p><button type="button" className="card-enter-button" disabled={!ready} aria-label={`Entra nel modulo ${items[index].title}`} onClick={event => { event.stopPropagation(); onEnter(items[index].id); }} onKeyDown={event => event.stopPropagation()}><span>Entra</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" /></svg></button></div>}
          {group.id === 'services' && <>
            <button ref={infoButton} type="button" className="card-info-button" aria-label={`Scopri di più su ${items[index].title}`} aria-expanded={Boolean(infoState)} aria-controls={infoState ? `service-info-${items[index].id}` : undefined} onClick={event => { event.stopPropagation(); setInfoCard({ id: items[index].id, state: 'opening' }); }} onKeyDown={event => event.stopPropagation()}><span className="card-info-mark" aria-hidden="true">i</span><span>Scopri di più</span></button>
            {infoState && <div id={`service-info-${items[index].id}`} className={`service-info-back is-${infoState}`} role="group" aria-label={`Informazioni sul servizio ${items[index].title}`} onAnimationEnd={event => {
              if (event.animationName === 'service-info-flip-out') {
                setInfoCard(null);
                infoButton.current?.focus({ preventScroll: true });
              }
            }}>
              <h2>{items[index].lines.map(line => <span key={line}>{line}</span>)}</h2>
              <p>{items[index].serviceInfo}</p>
              <button type="button" className="service-info-return card-info-button" aria-label="Torna alla card" onClick={closeServiceInfo}><span className="card-info-mark card-return-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m14 6-6 6 6 6" /></svg></span><span>Torna alla card</span></button>
            </div>}
          </>}
        </div>
      </div>
      {!ready && <p className="carousel-message" role="status">{error || `Caricamento ${label.toLowerCase()}…`}</p>}

      <footer className="carousel-footer">
        <div className="carousel-controls">
          <button type="button" aria-label="Card precedente" disabled={!ready} onClick={() => carousel.current?.go(-1)}><Arrow direction="left" /></button>
          <span className="carousel-count" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><span className="count-separator">/</span><span>{String(items.length).padStart(2, '0')}</span></span>
          <button type="button" aria-label="Card successiva" disabled={!ready} onClick={() => carousel.current?.go(1)}><Arrow direction="right" /></button>
        </div>
        <p id="carousel-hint">Trascina o scorri per esplorare la filiera</p>
      </footer>

      <p className="sr-only" aria-live="polite" aria-atomic="true">{group.id === 'services' ? 'Servizio integrato' : 'Modulo'}, card {index + 1} di {items.length}: {items[index].title}. {items[index].copy.join(' ')}</p>
      <ol className={error ? 'carousel-fallback' : 'sr-only'}>{items.map(module => <li key={module.id}>{group.id === 'modules' ? <button onClick={() => onEnter(module.id)}>{module.title} · Entra</button> : `Servizio: ${module.title}`}. {module.copy.join(' ')}</li>)}</ol>
    </section>
  );
}

function ProductPage({ onSignOut, onEnter, initialGroup, indices, onGroupChange, onIndexChange }) {
  const [selected, setSelected] = useState(initialGroup);
  const [displayed, setDisplayed] = useState(initialGroup);
  const [phase, setPhase] = useState('waiting');
  const tabs = useRef([]);
  const page = useRef(null);

  useEffect(() => {
    page.current.focus({ preventScroll: true });
  }, []);

  const finishEntry = useCallback(() => {
    setPhase(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'idle' : 'in');
  }, []);

  function selectGroup(next) {
    if (next === selected) return;
    setSelected(next);
    onGroupChange(next);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || phase === 'waiting') {
      setDisplayed(next);
      setPhase('waiting');
    } else if (next !== displayed) {
      setPhase('out');
    } else if (phase === 'out') {
      setPhase('in');
    }
  }

  function finishZoom(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
    if (phase === 'out') {
      setDisplayed(selected);
      setPhase('waiting');
    } else if (phase === 'in') {
      setPhase('idle');
    }
  }

  function handleTabKey(event) {
    let next;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') next = 1 - selected;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 1;
    else return;
    event.preventDefault();
    selectGroup(next);
    tabs.current[next].focus();
  }

  return (
    <main className="demo-page" ref={page} tabIndex={-1}>
      <header className="demo-header">
        <ProfileMenu onSignOut={onSignOut} />
        <h1>weave<span className="brand-dot" aria-hidden="true">.</span></h1>
        <div className="module-selector" role="tablist" aria-label="Esplora WEAVE" style={{ '--selected': selected }} onKeyDown={handleTabKey}>
          <span className="selector-pill" aria-hidden="true" />
          {moduleGroups.map((group, index) => (
            <button key={group.id} ref={element => { tabs.current[index] = element; }} id={`tab-${group.id}`} type="button" role="tab" aria-selected={index === selected} aria-controls={`carousel-${group.id}`} tabIndex={index === selected ? 0 : -1} onClick={() => selectGroup(index)}>
              <span>{group.label}</span><span className="selector-count" aria-hidden="true">{group.items.length}</span>
            </button>
          ))}
        </div>
        <p className="carousel-context" id="carousel-context" data-group={moduleGroups[displayed].id} aria-live="polite">
          {moduleGroups[displayed].id === 'services'
            ? <>Esplora i servizi a cui potrai accedere all’interno dei nostri <button type="button" className="carousel-context-link" aria-label="Vai ai moduli" onClick={() => { selectGroup(0); tabs.current[0]?.focus(); }}>moduli</button>.</>
            : <>Esplora i moduli: dall’idea alla vendita e alla seconda vita.<span className="carousel-context-second-line">Un percorso integrato dai nostri <button type="button" className="carousel-context-link" aria-label="Vai ai servizi integrati" onClick={() => { selectGroup(1); tabs.current[1]?.focus(); }}>servizi</button>.</span></>}
        </p>
      </header>
      <div className="carousel-switch" data-phase={phase} aria-busy={phase !== 'idle'} inert={phase !== 'idle'} onTransitionEnd={finishZoom}>
        {moduleGroups.map((group, index) => index === displayed
          ? <CardCarousel key={group.id} group={group} onReady={finishEntry} onEnter={onEnter} startIndex={indices[group.id]} onIndexChange={onIndexChange} />
          : <section key={group.id} id={`carousel-${group.id}`} role="tabpanel" aria-labelledby={`tab-${group.id}`} hidden />)}
      </div>
    </main>
  );
}

function readRoute() {
  const match = window.location.hash.match(/^#\/moduli\/(\d+)$/);
  const id = match ? Number(match[1]) : null;
  return moduleGroups[0].items.some(module => module.id === id) ? id : null;
}

function Workspace({ onSignOut }) {
  const [moduleId, setModuleId] = useState(readRoute);
  const [group, setGroup] = useState(0);
  const [indices, setIndices] = useState({ modules: 0, services: 0 });
  useEffect(() => {
    const change = () => setModuleId(readRoute());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const navigate = useCallback(id => {
    window.location.hash = `/moduli/${id}`;
    setModuleId(id);
  }, []);
  const rememberIndex = useCallback((id, index) => setIndices(previous => ({ ...previous, [id]: index })), []);
  function home() { window.location.hash = '/moduli'; setModuleId(null); }
  return moduleId
    ? <Dashboard moduleId={moduleId} onNavigate={navigate} onHome={home} onSignOut={onSignOut} />
    : <ProductPage onSignOut={onSignOut} onEnter={navigate} initialGroup={group} indices={indices} onGroupChange={setGroup} onIndexChange={rememberIndex} />;
}

export default function App() {
  const [entered, setEntered] = useState(false);
  return entered
    ? <DemoProvider><Workspace onSignOut={() => { setEntered(false); history.replaceState(null, '', `${location.pathname}${location.search}#/moduli`); }} /></DemoProvider>
    : <AuthPage onEnter={() => setEntered(true)} />;
}
