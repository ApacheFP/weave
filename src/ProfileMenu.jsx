import React, { useEffect, useRef, useState } from 'react';

const initialProfile = { firstName: 'Alex', lastName: 'Rossi', email: 'demo@weave.it' };
const avatar = '/illustrations/profile-avatar.webp';

function Icon({ name }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    settings: <><path d="M3 6h6m4 0h8M3 12h10m4 0h4M3 18h3m4 0h11" /><circle cx="11" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
    exit: <><path d="M10 4H5v16h5m1-8h10m-4-4 4 4-4 4" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    back: <path d="m14 6-6 6 6 6" />,
    chevron: <path d="m9 6 6 6-6 6" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name]}</svg>;
}

export default function ProfileMenu({ onSignOut }) {
  const [view, setView] = useState(null);
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [moduleAlerts, setModuleAlerts] = useState(true);
  const [productNews, setProductNews] = useState(false);
  const [message, setMessage] = useState('');
  const root = useRef(null);
  const trigger = useRef(null);
  const panel = useRef(null);
  const fullName = `${profile.firstName} ${profile.lastName}`;

  useEffect(() => {
    if (!view) return;
    panel.current.querySelector('button, input')?.focus({ preventScroll: true });
    function outside(event) {
      if (!root.current.contains(event.target)) setView(null);
    }
    function escape(event) {
      if (event.key === 'Escape') {
        setView(null);
        trigger.current.focus({ preventScroll: true });
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [view]);

  function show(next) {
    setMessage('');
    if (next === 'profile') setDraft(profile);
    setView(next);
  }

  function close() {
    setView(null);
    trigger.current.focus({ preventScroll: true });
  }

  function saveProfile(event) {
    event.preventDefault();
    setProfile({ firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim() });
    setMessage('Profilo aggiornato nella demo.');
  }

  return (
    <div className="profile-menu" ref={root}>
      <button className="profile-trigger" type="button" ref={trigger} aria-label={`Profilo di ${fullName}`} aria-haspopup="dialog" aria-expanded={Boolean(view)} aria-controls={view ? 'profile-panel' : undefined} onClick={() => view ? close() : show('menu')}>
        <img src={avatar} width="36" height="36" alt="" />
        <span className="profile-trigger-name">{fullName}</span>
        <span className="profile-caret" data-open={Boolean(view)}><Icon name="chevron" /></span>
      </button>

      {view && (
        <div className="profile-panel" id="profile-panel" role="dialog" aria-label={view === 'menu' ? 'Il tuo account' : view === 'profile' ? 'Il tuo profilo' : 'Impostazioni'} ref={panel}>
          <div className="profile-panel-top">
            {view !== 'menu' ? <button className="profile-icon-button" type="button" aria-label="Torna al menu profilo" onClick={() => show('menu')}><Icon name="back" /></button> : <span className="profile-demo-tag">Account demo</span>}
            <button className="profile-icon-button" type="button" aria-label="Chiudi profilo" onClick={close}><Icon name="close" /></button>
          </div>

          {view === 'menu' ? <>
            <div className="profile-summary"><img src={avatar} width="52" height="52" alt="Ritratto del profilo demo" /><div><strong>{fullName}</strong><span>{profile.email}</span><small>Designer · WEAVE</small></div></div>
            <div className="profile-actions">
              <button type="button" onClick={() => show('profile')}><Icon name="user" /><span>Il tuo profilo</span><Icon name="chevron" /></button>
              <button type="button" onClick={() => show('settings')}><Icon name="settings" /><span>Impostazioni</span><Icon name="chevron" /></button>
            </div>
            <button className="profile-signout" type="button" onClick={onSignOut}><Icon name="exit" /><span>Esci da weave</span></button>
          </> : view === 'profile' ? <>
            <h2>Il tuo profilo</h2>
            <p className="profile-description">Il tuo spazio, la tua identità.</p>
            <form onSubmit={saveProfile}>
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
