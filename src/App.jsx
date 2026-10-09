import React, { useCallback, useEffect, useRef, useState } from 'react';
import { moduleGroups } from './modules.js';
import { createModuleCards } from './cards.js';
import AuthPage from './AuthPage.jsx';
import ProfileMenu from './ProfileMenu.jsx';

function Arrow({ direction }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={direction === 'left' ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'} /></svg>;
}

function CardCarousel({ group, onReady }) {
  const { items, label } = group;
  const host = useRef(null);
  const carousel = useRef(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let engine;

    async function boot() {
      try {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const cards = await createModuleCards(items);
        if (!active) return;
        engine = window.MFCarousel.createCarousel(host.current, {
          startCard: 0,
          ...(reducedMotion ? { thAmount: 0, motionBlur: 0, stiffness: 30 } : {}),
        }, cards, { start: 0, onIndex: next => active && setIndex(next) });
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
  }, [items, onReady]);

  function handleKey(event) {
    if (!carousel.current) return;
    if (event.key === 'ArrowLeft') carousel.current.go(-1);
    else if (event.key === 'ArrowRight') carousel.current.go(1);
    else if (event.key === 'Home') carousel.current.show(0);
    else if (event.key === 'End') carousel.current.show(items.length - 1);
    else return;
    event.preventDefault();
  }

  return (
    <section className="carousel" id={`carousel-${group.id}`} role="tabpanel" aria-labelledby={`tab-${group.id}`} aria-roledescription="carosello" onKeyDown={handleKey}>
      <div className="carousel-stage" ref={host} tabIndex={0} aria-label={`Esplora ${label.toLowerCase()} con le frecce della tastiera`} aria-describedby="carousel-hint" />
      {!ready && <p className="carousel-message" role="status">{error || `Caricamento ${label.toLowerCase()}…`}</p>}

      <footer className="carousel-footer">
        <div className="carousel-controls">
          <button type="button" aria-label="Card precedente" disabled={!ready} onClick={() => carousel.current?.go(-1)}><Arrow direction="left" /></button>
          <span className="carousel-count" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><span className="count-separator">/</span><span>{String(items.length).padStart(2, '0')}</span></span>
          <button type="button" aria-label="Card successiva" disabled={!ready} onClick={() => carousel.current?.go(1)}><Arrow direction="right" /></button>
        </div>
        <p id="carousel-hint">Trascina o scorri per esplorare la filiera</p>
      </footer>

      <p className="sr-only" aria-live="polite" aria-atomic="true">{label}, card {index + 1} di {items.length}: {items[index].title}. {items[index].copy.join(' ')}</p>
      <ol className="sr-only">{items.map(module => <li key={module.id}>{module.title}. {module.copy.join(' ')}</li>)}</ol>
    </section>
  );
}

function ProductPage({ onSignOut }) {
  const [selected, setSelected] = useState(0);
  const [displayed, setDisplayed] = useState(0);
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
      </header>
      <div className="carousel-switch" data-phase={phase} aria-busy={phase !== 'idle'} inert={phase !== 'idle'} onTransitionEnd={finishZoom}>
        {moduleGroups.map((group, index) => index === displayed
          ? <CardCarousel key={group.id} group={group} onReady={finishEntry} />
          : <section key={group.id} id={`carousel-${group.id}`} role="tabpanel" aria-labelledby={`tab-${group.id}`} hidden />)}
      </div>
    </main>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  return entered
    ? <ProductPage onSignOut={() => setEntered(false)} />
    : <AuthPage onEnter={() => setEntered(true)} />;
}
