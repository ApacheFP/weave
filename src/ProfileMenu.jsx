import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDemo } from './dashboard/DemoContext.jsx';
import './dashboard/account-pages.css';

const initialProfile = { firstName: 'Alex', lastName: 'Rossi', email: 'demo@weave.it', avatar: '/illustrations/profile-avatar.webp' };
const avatar = '/illustrations/profile-avatar.webp';

function Icon({ name }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    settings: <><path d="M3 6h6m4 0h8M3 12h10m4 0h4M3 18h3m4 0h11" /><circle cx="11" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
    exit: <><path d="M10 4H5v16h5m1-8h10m-4-4 4 4-4 4" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    back: <path d="m14 6-6 6 6 6" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    chevrons: <path d="m9 8 3-3 3 3m-6 8 3 3 3-3" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name]}</svg>;
}

export default function ProfileMenu({ onSignOut, sidebar = false, compact = false, collapsed = false, onSettings, onProfile }) {
  const [view, setView] = useState(null);
  const [transition, setTransition] = useState('');
  const { data, updateProfile, preferences, updatePreferences } = useDemo();
  const panelId = useId();
  const profile = data.profile;
  const [draft, setDraft] = useState(initialProfile);
  const moduleAlerts = preferences?.moduleAlerts ?? data.moduleAlerts ?? true;
  const productNews = preferences?.productNews ?? data.productNews ?? false;
  const setModuleAlerts = value => updatePreferences({ moduleAlerts: typeof value === 'function' ? value(moduleAlerts) : value });
  const setProductNews = value => updatePreferences({ productNews: typeof value === 'function' ? value(productNews) : value });
  const [message, setMessage] = useState('');
  const root = useRef(null);
  const trigger = useRef(null);
  const panel = useRef(null);
  const transitionTimer = useRef(null);
  const fullName = `${profile.firstName} ${profile.lastName}`;

  const closePanel = useCallback((restoreFocus = false) => {
    window.clearTimeout(transitionTimer.current);
    if (restoreFocus) trigger.current.focus({ preventScroll: true });

    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160;
    if (!view || !duration) {
      setView(null);
      setTransition('');
      return;
    }

    setTransition('closing');
    transitionTimer.current = window.setTimeout(() => {
      setView(null);
      setTransition('');
    }, duration);
  }, [view]);

  useEffect(() => {
    if (!view) return;
    panel.current.querySelector('button, input')?.focus({ preventScroll: true });
    function outside(event) {
      if (!root.current.contains(event.target)) closePanel();
    }
    function escape(event) {
      if (event.key === 'Escape') closePanel(true);
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [view, closePanel]);

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  function show(next) {
    setMessage('');
    if (next === 'profile') setDraft(profile);
    window.clearTimeout(transitionTimer.current);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 120;
    if (!view || view === next || !duration) {
      setView(next);
      setTransition('');
      return;
    }

    setTransition('leaving');
    transitionTimer.current = window.setTimeout(() => {
      setView(next);
      setTransition('entering');
      transitionTimer.current = window.setTimeout(() => setTransition(''), 200);
    }, duration);
  }

  function saveProfile(event) {
    event.preventDefault();
    if (!updateProfile({ firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim(), avatar: draft.avatar || null })) { setMessage('Verifica i dati del profilo.'); return; }
    setMessage('Profilo aggiornato nella demo.');
  }

  function chooseAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) { setMessage('Scegli un’immagine fino a 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setDraft(current => ({ ...current, avatar: String(reader.result) })); setMessage('Foto pronta. Salva il profilo per applicarla.'); };
    reader.onerror = () => setMessage('Non sono riuscito a leggere questa immagine.');
    reader.readAsDataURL(file);
  }

  function openAccountPage(callback, fallback) {
    if (!callback) {
      show(fallback);
      return;
    }
    window.clearTimeout(transitionTimer.current);
    setView(null);
    setTransition('');
    callback();
  }

  return (
    <div className={`profile-menu${sidebar ? ' dw-profile-sidebar' : ''}${compact ? ' dw-profile-compact' : ''}`} data-collapsed={sidebar && collapsed} ref={root}>
      <button className="profile-trigger" type="button" ref={trigger} aria-label={`Profilo di ${fullName}`} aria-haspopup="dialog" aria-expanded={Boolean(view)} aria-controls={view ? panelId : undefined} onClick={() => view ? closePanel(true) : show('menu')}>
        <img src={profile.avatar || avatar} width={sidebar ? '26' : '36'} height={sidebar ? '26' : '36'} alt="" />
        <span className="profile-trigger-name">{fullName}</span>
        <span className="profile-caret" data-open={Boolean(view)}><Icon name={sidebar ? 'chevrons' : 'chevron'} /></span>
      </button>

      {view && (
        <div className={`profile-panel${transition ? ` is-${transition}` : ''}`} id={panelId} role="dialog" aria-label={view === 'menu' ? 'Il tuo account' : view === 'profile' ? 'Il tuo profilo' : 'Impostazioni'} ref={panel} inert={transition === 'leaving' || transition === 'closing'}>
          <div className="profile-panel-top">
            {view !== 'menu' ? <button className="profile-icon-button" type="button" aria-label="Torna al menu profilo" onClick={() => show('menu')}><Icon name="back" /></button> : <span className="profile-demo-tag">Account demo</span>}
            <button className="profile-icon-button" type="button" aria-label="Chiudi profilo" onClick={() => closePanel(true)}><Icon name="close" /></button>
          </div>

          {view === 'menu' ? <>
            <div className="profile-summary"><img src={profile.avatar || avatar} width="52" height="52" alt="Ritratto del profilo demo" /><div><strong>{fullName}</strong><span>{profile.email}</span><small>Designer · WEAVE</small></div></div>
            <div className="profile-actions">
              <button type="button" onClick={() => openAccountPage(onProfile, 'profile')}><Icon name="user" /><span>Il tuo profilo</span><Icon name="chevron" /></button>
              <button type="button" onClick={() => openAccountPage(onSettings, 'settings')}><Icon name="settings" /><span>Impostazioni</span><Icon name="chevron" /></button>
            </div>
            <button className="profile-signout" type="button" onClick={onSignOut}><Icon name="exit" /><span>Esci da weave</span></button>
          </> : view === 'profile' ? <>
            <h2>Il tuo profilo</h2>
            <p className="profile-description">Il tuo spazio, la tua identità.</p>
            <form onSubmit={saveProfile}>
              <div className="profile-avatar-edit"><img src={draft.avatar || avatar} width="48" height="48" alt="Anteprima foto profilo" /><label>Cambia foto<input type="file" accept="image/*" onChange={chooseAvatar} /></label>{draft.avatar && draft.avatar !== avatar && <button type="button" onClick={() => { setDraft(current => ({ ...current, avatar: null })); setMessage('Foto rimossa. Salva il profilo per applicare la modifica.'); }}>Rimuovi</button>}</div>
              {[
                ['firstName', 'Nome', 'text'],
                ['lastName', 'Cognome', 'text'],
                ['email', 'Email', 'email'],
              ].map(([key, label, type]) => <label className="profile-field" key={key}>{label}<input type={type} value={draft[key]} required maxLength={key === 'email' ? 254 : 80} pattern={type === 'text' ? '.*\\S.*' : undefined} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
              <button className="profile-save" type="submit">Salva profilo</button>
            </form>
          </> : <>
            <h2>Impostazioni</h2>
            <p className="profile-description">Scegli cosa seguire nel tuo spazio.</p>
            <div className="profile-preference"><div><strong>Avvisi sui moduli</strong><small>Stato e avanzamento della filiera.</small></div><button className="profile-switch" type="button" role="switch" aria-label="Avvisi sui moduli" aria-checked={moduleAlerts} onClick={() => setModuleAlerts(value => !value)}><span /></button></div>
            <div className="profile-preference"><div><strong>Novità di weave</strong><small>Aggiornamenti del prodotto.</small></div><button className="profile-switch" type="button" role="switch" aria-label="Novità di weave" aria-checked={productNews} onClick={() => setProductNews(value => !value)}><span /></button></div>
            <button className="profile-save" type="button" onClick={() => setMessage('Preferenze aggiornate nella demo.')}>Salva impostazioni</button>
          </>}
          {message && <p className="profile-status" role="status">{message}</p>}
          {view !== 'menu' && <p className="profile-footnote">Dati e preferenze simulati per questa demo.</p>}
        </div>
      )}
    </div>
  );
}
