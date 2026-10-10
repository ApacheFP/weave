import React, { useEffect, useRef, useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { Button, Dialog, Field, Icon } from './ui.jsx';
import './account-pages.css';

const settingsGroups = [
  ['Generale', [['workspace', 'Spazio di lavoro', 'home'], ['appearance', 'Aspetto', 'settings'], ['language', 'Lingua', 'list'], ['datetime', 'Data e ora', 'calendar']]],
  ['Spazio di lavoro', [['members', 'Membri', 'user'], ['teams', 'Team', 'user'], ['projects', 'Capi', 'shirt'], ['permissions', 'Permessi', 'settings']]],
  ['Notifiche', [['email', 'Email', 'inbox'], ['push', 'Push', 'bell'], ['mentions', 'Menzioni', 'chat'], ['assignments', 'Assegnazioni attività', 'list']]],
  ['Personale', [['profile', 'Profilo', 'user'], ['preferences', 'Preferenze', 'settings'], ['shortcuts', 'Scorciatoie da tastiera', 'list']]],
  ['Sicurezza', [['password', 'Password', 'settings'], ['sessions', 'Sessioni', 'list'], ['two-factor', 'Autenticazione a due fattori', 'settings']]],
  ['Fatturazione', [['plan', 'Piano', 'layers'], ['payment', 'Pagamento', 'list'], ['invoices', 'Fatture', 'file']]],
];
const sectionLabel = Object.fromEntries(settingsGroups.flatMap(([, items]) => items.map(([id, label]) => [id, label])));
const shortcutGroups = [
  ['Generale', [['Menu comandi', ['⌘', 'K']], ['Cerca', ['/']], ['Scorciatoie da tastiera', ['?']], ['Riduci sidebar', ['[']], ['Cambia tema chiaro/scuro', ['⌘', 'Shift', 'L']], ['Chiudi pannello o finestra', ['Esc']]]],
  ['Crea', [['Nuova attività', ['N']], ['Nuovo capo', ['P']], ['Invia modulo', ['⌘', '↵']], ['Invia commento', ['⌘', '↵']]]],
  ['Naviga', [['Vai alla Home', ['G', 'H']], ['Vai alle mie attività', ['G', 'T']], ['Vai ai capi', ['G', 'P']], ['Vai all’Inbox', ['G', 'I']], ['Vai alle impostazioni', ['G', 'S']]]],
  ['Menu comandi', [['Sposta selezione', ['↑', '↓']], ['Esegui comando', ['↵']], ['Passa ai risultati', ['Tab']]]],
];

function Preference({ label, description, checked, onChange }) {
  return <div className="dw-setting-row"><div><strong>{label}</strong><p>{description}</p></div><button className="dw-account-switch" type="button" role="switch" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)}><span /></button></div>;
}

function AppearanceSettings({ preferences, updatePreferences }) {
  const theme = preferences?.theme || 'system';
  const accent = preferences?.accent || 'graphite';
  return <>
    <h1>Aspetto</h1><p className="dw-setting-lead">Personalizza l’aspetto di Atelier su questo dispositivo.</p>
    <section className="dw-setting-block"><h2>Tema</h2><div className="dw-theme-options" role="radiogroup" aria-label="Tema">{[['light', 'Chiaro'], ['dark', 'Scuro'], ['system', 'Sistema']].map(([value, label]) => <button key={value} type="button" className={theme === value ? 'selected' : ''} role="radio" aria-checked={theme === value} onClick={() => updatePreferences({ theme: value })}><span className={`dw-theme-preview ${value}`}><i /><i /><i /></span><span>{label}{theme === value && <Icon name="check" size={13} />}</span></button>)}</div></section>
    <section className="dw-setting-block"><h2>Colore principale</h2><div className="dw-setting-row"><div><strong>Accento</strong><p>Usato per pulsanti principali, selezione e indicatori.</p></div><div className="dw-accent-options" role="radiogroup" aria-label="Colore principale">{[['indigo','#4b5bd6'],['blue','#2f6cd4'],['violet','#7348cc'],['teal','#1a7f7a'],['rose','#b93d68'],['graphite','#34332f']].map(([name,color]) => <button key={name} type="button" title={name} aria-label={name} role="radio" aria-checked={accent === name} style={{'--swatch': color}} className={accent === name ? 'selected' : ''} onClick={() => updatePreferences({ accent: name })}>{accent === name && <Icon name="check" size={13} />}</button>)}</div></div></section>
    <section className="dw-setting-block"><h2>Densità</h2>{[['Sidebar', 'sideDensity', 'Compatta mostra più capi sullo schermo.'], ['Attività', 'taskDensity', 'Altezza delle righe nella lista attività.']].map(([label,key,description]) => <div className="dw-setting-row" key={key}><div><strong>{label}</strong><p>{description}</p></div><div className="dw-segmented">{[['comfortable','Confortevole'],['compact','Compatta']].map(([value,text]) => <button type="button" key={value} aria-pressed={(preferences?.[key] || 'comfortable') === value} onClick={() => updatePreferences({ [key]: value })}>{text}</button>)}</div></div>)}</section>
    <section className="dw-setting-block"><h2>Movimento</h2><div className="dw-setting-row"><div><strong>Animazioni</strong><p>Riduci le animazioni di menu e finestre.</p></div><select aria-label="Animazioni" value={preferences?.motion || 'system'} onChange={event => updatePreferences({ motion: event.target.value })}><option value="system">Segui il sistema</option><option value="reduce">Riduci movimento</option></select></div></section>
  </>;
}

export function SettingsPage({ section = 'appearance' }) {
  const { data, styles, commit, preferences, updatePreferences } = useDemo();
  const [selected, setSelected] = useState(section === 'profile' ? 'profile' : section === 'notifications' ? 'email' : section);
  const [draft, setDraft] = useState(data.profile);
  const [message, setMessage] = useState('');
  const profile = data.profile;
  useEffect(() => setSelected(section === 'profile' ? 'profile' : section === 'notifications' ? 'email' : section), [section]);
  useEffect(() => setDraft(profile), [profile]);

  function saveProfile(event) {
    event.preventDefault();
    const next = { firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim() };
    if (!next.firstName || !next.lastName || !next.email) return;
    commit({ profile: next });
    setMessage('Profilo salvato.');
  }

  const unsupported = !['appearance', 'workspace', 'profile', 'email', 'push', 'mentions', 'assignments'].includes(selected);
  return <div className="dw-settings-layout">
    <nav className="dw-settings-nav" aria-label="Impostazioni">{settingsGroups.map(([group, items]) => <section key={group}><h2>{group}</h2>{items.map(([id, label, icon]) => <button type="button" key={id} aria-current={selected === id ? 'page' : undefined} onClick={() => { setSelected(id); setMessage(''); }}><Icon name={icon} size={15} /><span>{label}</span></button>)}</section>)}</nav>
    <div className="dw-settings-scroll"><div className="dw-settings-inner">
      {selected === 'appearance' && <AppearanceSettings preferences={preferences} updatePreferences={updatePreferences} />}
      {selected === 'profile' && <><h1>Profilo</h1><p className="dw-setting-lead">Informazioni del tuo profilo personale.</p><div className="dw-profile-summary"><img src="/illustrations/profile-avatar.webp" width="36" height="36" alt="" /><div><strong>{profile.firstName} {profile.lastName}</strong><span>Atelier · Designer</span></div></div><form className="dw-account-form" onSubmit={saveProfile}><div className="dw-account-form-grid"><Field label="Nome"><input value={draft.firstName} autoComplete="given-name" required maxLength={80} pattern=".*\S.*" onChange={event => setDraft({ ...draft, firstName: event.target.value })} /></Field><Field label="Cognome"><input value={draft.lastName} autoComplete="family-name" required maxLength={80} pattern=".*\S.*" onChange={event => setDraft({ ...draft, lastName: event.target.value })} /></Field></div><Field label="Email"><input type="email" value={draft.email} autoComplete="email" required maxLength={254} onChange={event => setDraft({ ...draft, email: event.target.value })} /></Field><div className="dw-account-form-footer"><p role="status">{message}</p><Button primary type="submit" disabled={!Object.keys(profile).some(key => (draft[key] || '').trim() !== profile[key])}>Salva modifiche</Button></div></form></>}
      {selected === 'workspace' && <><h1>Spazio di lavoro</h1><p className="dw-setting-lead">Informazioni dello spazio Atelier.</p><div className="dw-setting-row"><div><strong>Nome</strong></div><span>Atelier</span></div><div className="dw-setting-row"><div><strong>Capi</strong></div><span>{styles.length}</span></div></>}
      {['email', 'push', 'mentions', 'assignments'].includes(selected) && <><h1>{sectionLabel[selected]?.[1]}</h1><p className="dw-setting-lead">Preferenze per gli aggiornamenti dei capi e delle attività.</p><Preference label="Aggiornamenti dei moduli" description="Mostra gli aggiornamenti della filiera nella tua Inbox." checked={preferences?.moduleAlerts ?? true} onChange={value => updatePreferences({ moduleAlerts: value })} /><Preference label="Novità di Atelier" description="Ricevi aggiornamenti sul prodotto nella demo." checked={preferences?.productNews ?? false} onChange={value => updatePreferences({ productNews: value })} /></>}
      {unsupported && <><h1>{sectionLabel[selected]?.[1] || 'Impostazioni'}</h1><p className="dw-setting-lead">Questa sezione non è disponibile nella demo Atelier.</p></>}
    </div></div>
  </div>;
}

export function HelpMenu({ onSearch }) {
  const [open, setOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const root = useRef(null);
  const { notify } = useDemo();
  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') setOpen(false);
      if (event.type === 'pointerdown' && !root.current?.contains(event.target)) setOpen(false);
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) { setOpen(false); setShortcuts(true); }
    };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);
  const unavailable = () => { setOpen(false); notify('Questa risorsa non è disponibile nella demo Atelier.'); };
  return <div className="dw-help-menu" ref={root}>
    <button type="button" className="dw-help-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><Icon name="help" size={16} /><span>Aiuto e risorse</span></button>
    {open && <div className="dw-help-popover" role="menu" aria-label="Aiuto e risorse"><strong>Aiuto e risorse</strong><button role="menuitem" onClick={() => { setOpen(false); setShortcuts(true); }}><Icon name="list" size={15} />Scorciatoie da tastiera<kbd>?</kbd></button><button role="menuitem" onClick={() => { setOpen(false); onSearch(); }}><Icon name="search" size={15} />Menu comandi<kbd>⌘K</kbd></button><button role="menuitem" onClick={unavailable}><Icon name="layers" size={15} />Sistema di design</button><button role="menuitem" onClick={unavailable}><Icon name="grid" size={15} />Stati di sistema</button><hr /><strong>Prototipo</strong><button role="menuitem" onClick={unavailable}><Icon name="spark" size={15} />Ripeti introduzione</button><button role="menuitem" onClick={unavailable}><Icon name="activity" size={15} />Simula offline</button><button role="menuitem" onClick={unavailable}><Icon name="file" size={15} />Apri un link non valido</button><button role="menuitem" onClick={unavailable}><Icon name="settings" size={15} />Ripristina dati demo</button></div>}
    {shortcuts && <Dialog title="Scorciatoie da tastiera" className="dw-shortcuts-dialog" onClose={() => setShortcuts(false)}><div className="dw-shortcut-columns">{shortcutGroups.map(([group, items]) => <section key={group}><h3>{group}</h3>{items.map(([label, keys]) => <div className="dw-shortcut-row" key={label}><span>{label}</span><span className="dw-shortcut-keys">{keys.map((key, index) => <React.Fragment key={`${key}-${index}`}>{index > 0 && keys[0] === 'G' && <small>poi</small>}<kbd>{key}</kbd></React.Fragment>)}</span></div>)}</section>)}</div></Dialog>}
  </div>;
}
