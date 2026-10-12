import React, { useCallback, useEffect, useRef, useState } from 'react';
import { carouselGroup, moduleGroups } from './modules.js';
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
    let removeLayoutListener;

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
            element.style.setProperty('--card-copy-size', `${bounds.width * .043}px`);
            element.dataset.positioned = 'true';
          },
        });
        const mobile = window.matchMedia('(max-width: 600px)');
        const compact = window.matchMedia('(max-height: 1100px)');
        const mobileLayout = { hFrac: .88, wFrac: .8, wFracTall: .8, gap: .07, gapTall: .07, lift: 0 };
        const desktopLayout = Object.fromEntries(Object.keys(mobileLayout).map(key => [key, engine.values[key]]));
        const updateLayout = () => {
          engine.set(mobile.matches ? mobileLayout : compact.matches ? { ...desktopLayout, hFrac: .88 } : desktopLayout);
          engine.renderer.domElement.style.touchAction = mobile.matches ? 'pan-y' : 'none';
        };
        updateLayout();
        mobile.addEventListener('change', updateLayout);
        compact.addEventListener('change', updateLayout);
        removeLayoutListener = () => { mobile.removeEventListener('change', updateLayout); compact.removeEventListener('change', updateLayout); };
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
      removeLayoutListener?.();
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
    else if (event.key === 'Enter' && !items[index].serviceInfo && ready) onEnter(items[index].routeId);
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
    <section className="carousel" id={`carousel-${group.id}`} aria-describedby="carousel-context carousel-hint" aria-roledescription="carosello" onKeyDown={handleKey}>
      <div className="carousel-stage" ref={host} tabIndex={0} aria-label={`Esplora ${label.toLowerCase()} con le frecce della tastiera`} aria-describedby="carousel-hint">
        <div className="card-entry" ref={entry} data-positioned="false">
          <div className="card-entry-footer"><p aria-hidden="true">{items[index].copy.join(' ')}</p>{!items[index].serviceInfo
            ? <button type="button" className="card-enter-button" disabled={!ready} aria-label={`Entra nel modulo ${items[index].title}`} onClick={event => { event.stopPropagation(); onEnter(items[index].routeId); }} onKeyDown={event => event.stopPropagation()}><span>Entra</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" /></svg></button>
            : <button ref={infoButton} type="button" className="card-enter-button card-details-button" disabled={!ready} aria-label={`Scopri di più su ${items[index].title}`} aria-expanded={Boolean(infoState)} aria-controls={infoState ? `service-info-${items[index].id}` : undefined} onClick={event => { event.stopPropagation(); setInfoCard({ id: items[index].id, state: 'opening' }); }} onKeyDown={event => event.stopPropagation()}><span>Scopri di più</span></button>
          }</div>
          {items[index].serviceInfo && <>
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

      <p className="sr-only" aria-live="polite" aria-atomic="true">Card {index + 1} di {items.length}: {items[index].title}. {items[index].copy.join(' ')}</p>
      <ol className={error ? 'carousel-fallback' : 'carousel-access sr-only'} aria-label="Accesso ai moduli e ai servizi">{items.map(module => <li key={module.id}>
        {module.serviceInfo
          ? <details><summary>{module.title}</summary><p>{module.serviceInfo}</p></details>
          : <button type="button" onClick={() => onEnter(module.routeId)}>Entra in {module.title}</button>}
        <span>{module.copy.join(' ')}</span>
      </li>)}</ol>
    </section>
  );
}

function ProductPage({ onSignOut, onEnter, index, onIndexChange }) {
  const page = useRef(null);
  const onReady = useCallback(() => {}, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    page.current.focus({ preventScroll: true });
  }, []);

  return (
    <main className="demo-page" ref={page} tabIndex={-1}>
      <header className="demo-header">
        <ProfileMenu onSignOut={onSignOut} />
        <h1>weave</h1>
        <p className="carousel-context" id="carousel-context">Dall’idea al passaporto digitale, tutti i moduli della filiera tessile in un unico percorso.</p>
      </header>
      <CardCarousel group={carouselGroup} onReady={onReady} onEnter={onEnter} startIndex={index} onIndexChange={onIndexChange} />
    </main>
  );
}

function readRoute() {
  const match = window.location.hash.match(/^#\/moduli\/(\d+)$/);
  const id = match ? Number(match[1]) : null;
  if (moduleGroups[0].items.some(module => module.id === id)) return { moduleId: id, page: null };
  const [page, query] = window.location.hash.slice(2).split('?');
  return ['home', 'inbox', 'my-tasks', 'notifications', 'capi', 'activity', 'settings', 'profile'].includes(page) ? { moduleId: 21, page, inboxId: new URLSearchParams(query).get('message'), settingsSection: new URLSearchParams(query).get('section') } : null;
}

function Workspace({ onSignOut }) {
  const [route, setRoute] = useState(readRoute);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const change = () => setRoute(readRoute());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const navigate = useCallback(id => {
    window.location.hash = `/moduli/${id}`;
    setRoute({ moduleId: id, page: null });
  }, []);
  const openPage = useCallback(page => {
    window.location.hash = `/${page}`;
    setRoute(readRoute());
  }, []);
  const rememberIndex = useCallback((_id, nextIndex) => setIndex(nextIndex), []);
  function home() { window.location.hash = '/moduli'; setRoute(null); }
  return route
    ? <Dashboard moduleId={route.moduleId} workspacePage={route.page} inboxId={route.inboxId} settingsSection={route.settingsSection} onOpenPage={openPage} onNavigate={navigate} onHome={home} onSignOut={onSignOut} />
    : <ProductPage onSignOut={onSignOut} onEnter={navigate} index={index} onIndexChange={rememberIndex} />;
}

export default function App() {
  const [entered, setEntered] = useState(false);
  return entered
    ? <DemoProvider><Workspace onSignOut={() => { setEntered(false); history.replaceState(null, '', `${location.pathname}${location.search}#/moduli`); }} /></DemoProvider>
    : <AuthPage onEnter={() => setEntered(true)} />;
}
