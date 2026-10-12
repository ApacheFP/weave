import React, { useEffect, useId, useRef, useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { demoMembers, demoTeams } from './accountData.js';
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

function moveRadioChoice(event) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  const choices = [...event.currentTarget.querySelectorAll('[role="radio"]')];
  const current = choices.indexOf(document.activeElement);
  if (current < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (current + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + choices.length) % choices.length;
  choices[next].focus();
  choices[next].click();
}

function AppearanceSettings({ preferences, updatePreferences }) {
  const theme = preferences?.theme || 'system';
  const accent = preferences?.accent || 'indigo';
  return <>
    <h1>Aspetto</h1><p className="dw-setting-lead">Personalizza l’aspetto di Atelier su questo dispositivo.</p>
    <section className="dw-setting-block"><h2>Tema</h2><div className="dw-theme-options" role="radiogroup" aria-label="Tema" onKeyDown={moveRadioChoice}>{[['light', 'Chiaro'], ['dark', 'Scuro'], ['system', 'Sistema']].map(([value, label]) => <button key={value} type="button" className={theme === value ? 'selected' : ''} role="radio" tabIndex={theme === value ? 0 : -1} aria-checked={theme === value} onClick={() => updatePreferences({ theme: value })}><span className={`dw-theme-preview ${value}`}><i /><i /><i /></span><span>{label}{theme === value && <Icon name="check" size={13} />}</span></button>)}</div></section>
    <section className="dw-setting-block"><h2>Colore principale</h2><div className="dw-setting-row"><div><strong>Accento</strong><p>Usato per pulsanti principali, selezione e indicatori.</p></div><div className="dw-accent-options" role="radiogroup" aria-label="Colore principale" onKeyDown={moveRadioChoice}>{[['indigo','#4b5bd6'],['blue','#2f6cd4'],['violet','#7348cc'],['teal','#1a7f7a'],['rose','#b93d68'],['graphite','#34332f']].map(([name,color]) => <button key={name} type="button" title={name} aria-label={name} role="radio" tabIndex={accent === name ? 0 : -1} aria-checked={accent === name} style={{'--swatch': color}} className={accent === name ? 'selected' : ''} onClick={() => updatePreferences({ accent: name })}>{accent === name && <Icon name="check" size={13} />}</button>)}</div></div></section>
    <section className="dw-setting-block"><h2>Densità</h2>{[['Sidebar', 'sideDensity', 'Compatta mostra più capi sullo schermo.'], ['Attività', 'taskDensity', 'Altezza delle righe nella lista attività.']].map(([label,key,description]) => <div className="dw-setting-row" key={key}><div><strong>{label}</strong><p>{description}</p></div><div className="dw-segmented">{[['comfortable','Confortevole'],['compact','Compatta']].map(([value,text]) => <button type="button" key={value} aria-pressed={(preferences?.[key] || 'comfortable') === value} onClick={() => updatePreferences({ [key]: value })}>{text}</button>)}</div></div>)}</section>
    <section className="dw-setting-block"><h2>Movimento</h2><div className="dw-setting-row"><div><strong>Animazioni</strong><p>Riduci le animazioni di menu e finestre.</p></div><select aria-label="Animazioni" value={preferences?.motion || 'system'} onChange={event => updatePreferences({ motion: event.target.value })}><option value="system">Segui il sistema</option><option value="reduce">Riduci movimento</option></select></div></section>
  </>;
}

function SettingsHeading({ title, lead }) { return <><h1>{title}</h1><p className="dw-setting-lead">{lead}</p></>; }

function LanguageSettings({ preferences, updatePreferences }) {
  return <><SettingsHeading title="Lingua" lead="Scegli lingua e convenzioni usate nell’area di lavoro." />
    <div className="dw-setting-row"><div><strong>Lingua dell’interfaccia</strong><p>La demo salva la scelta; i testi disponibili sono attualmente in italiano.</p></div><select aria-label="Lingua dell’interfaccia" value={preferences?.language || 'it'} onChange={event => updatePreferences({ language: event.target.value })}><option value="it">Italiano</option><option value="en">English · anteprima</option></select></div>
    <div className="dw-setting-row"><div><strong>Lingua dei contenuti</strong><p>Lingua predefinita per note, schede e commenti.</p></div><select aria-label="Lingua dei contenuti" value={preferences?.contentLanguage || 'it'} onChange={event => updatePreferences({ contentLanguage: event.target.value })}><option value="it">Italiano</option><option value="en">English · anteprima</option></select></div>
    <div className="dw-settings-info"><Icon name="info" size={15} /><span>Le preferenze vengono salvate su questo dispositivo. La traduzione completa sarà collegata quando sarà disponibile il catalogo multilingua.</span></div>
  </>;
}

function DateTimeSettings({ preferences, updatePreferences }) {
  return <><SettingsHeading title="Data e ora" lead="Imposta il fuso e il formato usati per scadenze e attività." />
    <div className="dw-setting-row"><div><strong>Fuso orario</strong><p>Fuso preferito salvato nelle impostazioni della demo.</p></div><select aria-label="Fuso orario" value={preferences?.timezone || 'Europe/Rome'} onChange={event => updatePreferences({ timezone: event.target.value })}><option value="Europe/Rome">Roma (UTC+1/+2)</option><option value="Europe/Paris">Parigi (UTC+1/+2)</option><option value="Europe/London">Londra (UTC+0/+1)</option><option value="America/New_York">New York (UTC−5/−4)</option></select></div>
    <div className="dw-setting-row"><div><strong>Formato data</strong><p>Formato preferito per le liste e i dettagli.</p></div><select aria-label="Formato data" value={preferences?.dateFormat || 'local'} onChange={event => updatePreferences({ dateFormat: event.target.value })}><option value="local">12 ott 2026</option><option value="iso">2026-10-12</option></select></div>
    <div className="dw-setting-row"><div><strong>Formato ora</strong><p>Formato preferito per notifiche e registro attività.</p></div><select aria-label="Formato ora" value={preferences?.timeFormat || '24h'} onChange={event => updatePreferences({ timeFormat: event.target.value })}><option value="24h">24 ore · 14:30</option><option value="12h">12 ore · 2:30 PM</option></select></div>
    <div className="dw-setting-row"><div><strong>Inizio settimana</strong><p>Giorno preferito per la vista calendario.</p></div><select aria-label="Inizio settimana" value={preferences?.weekStartsOn || 'monday'} onChange={event => updatePreferences({ weekStartsOn: event.target.value })}><option value="monday">Lunedì</option><option value="sunday">Domenica</option></select></div>
    <div className="dw-settings-info"><Icon name="info" size={15} /><span>Le scelte vengono salvate su questo dispositivo. Le date già presenti nei dati di esempio non cambiano formato dinamicamente.</span></div>
  </>;
}

export function SettingsPage({ section = 'appearance', onSectionChange }) {
  const { data, products, workspaceItems, updateProfile, preferences, updatePreferences } = useDemo();
  const [selected, setSelected] = useState(section === 'profile' ? 'profile' : section === 'notifications' ? 'email' : section);
  const [draft, setDraft] = useState(data.profile);
  const [message, setMessage] = useState('');
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(preferences?.workspaceName || 'Atelier');
  const [memberQuery, setMemberQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Designer');
  const [invites, setInvites] = useState([{ email: 'studio@atelier.demo', role: 'Collaboratore', sent: '10 ott', status: 'In attesa' }]);
  const [passwordDraft, setPasswordDraft] = useState({ current: '', next: '', confirm: '' });
  const [sessions, setSessions] = useState([{ id: 'current', device: 'Chrome · macOS', location: 'Milano, Italia', seen: 'Sessione attuale', current: true, revoked: false }, { id: 'mobile', device: 'Safari · iPhone', location: 'Milano, Italia', seen: 'Ieri, 19:42', current: false, revoked: false }, { id: 'studio', device: 'Chrome · Windows', location: 'Prato, Italia', seen: '8 ott, 16:10', current: false, revoked: false }]);
  const profile = data.profile;
  useEffect(() => setSelected(section === 'profile' ? 'profile' : section === 'notifications' ? 'email' : section), [section]);
  useEffect(() => setDraft(profile), [profile]);
  useEffect(() => setWorkspaceNameDraft(preferences?.workspaceName || 'Atelier'), [preferences?.workspaceName]);
  function selectSection(id) { setSelected(id); setMessage(''); onSectionChange?.(id); }

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

  function saveProfile(event) {
    event.preventDefault();
    const next = { firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim(), avatar: draft.avatar || null };
    if (!next.firstName || !next.lastName || !next.email) return;
    if (!updateProfile(next)) { setMessage('Verifica i dati del profilo.'); return; }
    setMessage('Profilo aggiornato.');
  }

  function inviteMember(event) {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || demoMembers.some(member => member.email === email) || invites.some(invite => invite.email === email)) { setMessage('Inserisci un indirizzo valido non già presente nel team.'); return; }
    setInvites(current => [{ email, role: inviteRole, sent: 'Ora', status: 'Invito inviato' }, ...current]);
    setInviteEmail('');
    setMessage(`Invito demo inviato a ${email}.`);
  }

  function savePassword(event) {
    event.preventDefault();
    if (passwordDraft.next.length < 8 || passwordDraft.next !== passwordDraft.confirm) { setMessage('La nuova password deve avere almeno 8 caratteri e i due campi devono coincidere.'); return; }
    setPasswordDraft({ current: '', next: '', confirm: '' });
    setMessage('Password aggiornata nella demo. Non è collegato un account reale.');
  }

  const unsupported = !Object.hasOwn(sectionLabel, selected);
  const filteredMembers = [{ id: 'current', name: `${profile.firstName} ${profile.lastName}`, email: profile.email, role: 'Designer · proprietario', team: 'Design', status: 'Attivo', seen: 'Ora', current: true }, ...demoMembers].filter(member => `${member.name} ${member.email} ${member.role} ${member.team}`.toLowerCase().includes(memberQuery.toLowerCase().trim()));
  const avatarChanged = (draft.avatar || '') !== (profile.avatar || '');
  const profileChanged = avatarChanged || ['firstName', 'lastName', 'email'].some(key => (draft[key] || '').trim() !== profile[key]);
  return <div className="dw-settings-layout">
    <nav className="dw-settings-nav" aria-label="Impostazioni">{settingsGroups.map(([group, items]) => <section key={group}><h2>{group}</h2>{items.map(([id, label, icon]) => <button type="button" key={id} aria-current={selected === id ? 'page' : undefined} onClick={() => selectSection(id)}><Icon name={icon} size={15} /><span>{label}</span></button>)}</section>)}</nav>
    <div className="dw-settings-scroll"><div className="dw-settings-inner">
      {selected === 'appearance' && <AppearanceSettings preferences={preferences} updatePreferences={updatePreferences} />}
      {selected === 'language' && <LanguageSettings preferences={preferences} updatePreferences={updatePreferences} />}
      {selected === 'datetime' && <DateTimeSettings preferences={preferences} updatePreferences={updatePreferences} />}
      {selected === 'profile' && <><SettingsHeading title="Profilo" lead="La tua identità e le informazioni visibili al team." /><div className="dw-profile-editor"><img src={draft.avatar || '/illustrations/profile-avatar.webp'} width="64" height="64" alt={`Foto profilo di ${profile.firstName} ${profile.lastName}`} /><div><strong>Foto profilo</strong><p>Immagine quadrata, massimo 2 MB. Viene salvata su questo dispositivo.</p><label className="dw-btn dw-avatar-upload">Cambia foto<input type="file" accept="image/*" onChange={chooseAvatar} /></label>{draft.avatar && draft.avatar !== '/illustrations/profile-avatar.webp' && <button type="button" className="dw-text-button" onClick={() => { setDraft({ ...draft, avatar: null }); setMessage('Foto rimossa. Salva il profilo per applicare la modifica.'); }}>Rimuovi foto</button>}</div></div><form className="dw-account-form" onSubmit={saveProfile}><div className="dw-account-form-grid"><Field label="Nome"><input value={draft.firstName} autoComplete="given-name" required maxLength={80} pattern=".*\S.*" onChange={event => setDraft({ ...draft, firstName: event.target.value })} /></Field><Field label="Cognome"><input value={draft.lastName} autoComplete="family-name" required maxLength={80} pattern=".*\S.*" onChange={event => setDraft({ ...draft, lastName: event.target.value })} /></Field></div><Field label="Email"><input type="email" value={draft.email} autoComplete="email" required maxLength={254} onChange={event => setDraft({ ...draft, email: event.target.value })} /></Field><div className="dw-setting-row"><div><strong>Ruolo nel workspace</strong><p>Ruolo dimostrativo del profilo.</p></div><span>Designer · proprietario</span></div><div className="dw-account-form-footer"><p role="status">{message}</p><Button primary type="submit" disabled={!profileChanged}>Salva modifiche</Button></div></form></>}
      {selected === 'workspace' && <><SettingsHeading title="Spazio di lavoro" lead="Identità e riepilogo dello spazio Atelier." /><form className="dw-account-form" onSubmit={event => { event.preventDefault(); const name = workspaceNameDraft.trim(); if (!name) return; updatePreferences({ workspaceName: name }); setMessage('Nome dello spazio aggiornato nella demo.'); }}><Field label="Nome dello spazio"><input value={workspaceNameDraft} required pattern=".*\S.*" maxLength={60} onChange={event => setWorkspaceNameDraft(event.target.value)} /></Field><Field label="Indirizzo"><input value="atelier.weave.demo" readOnly /></Field><div className="dw-account-form-footer"><span role="status">{message}</span><Button primary type="submit" disabled={workspaceNameDraft.trim() === (preferences?.workspaceName || 'Atelier')}>Salva nome</Button></div></form><section className="dw-setting-block"><h2>Riepilogo</h2><div className="dw-settings-stat-grid"><div><strong>{products.length}</strong><span>modelli</span></div><div><strong>{workspaceItems.length}</strong><span>capi e varianti</span></div><div><strong>{demoMembers.length + 1}</strong><span>membri attivi</span></div><div><strong>AI 2027</strong><span>collezione attiva</span></div></div></section><div className="dw-settings-info"><Icon name="info" size={15} /><span>Spazio dimostrativo: le modifiche restano in questa sessione e non cambiano un’organizzazione reale.</span></div></>}
      {selected === 'members' && <><SettingsHeading title="Membri" lead="Persone che collaborano sui capi e sulle attività di Atelier." /><div className="dw-settings-toolbar"><label className="dw-settings-search"><Icon name="search" size={14} /><input aria-label="Cerca membri" placeholder="Nome, email o team" value={memberQuery} onChange={event => setMemberQuery(event.target.value)} /></label><span>{demoMembers.length + 1} persone · {invites.length} inviti</span></div><div className="dw-settings-table-wrap"><table className="dw-settings-table"><thead><tr><th>Persona</th><th>Ruolo</th><th>Team</th><th>Stato</th><th>Ultima attività</th></tr></thead><tbody>{filteredMembers.map(member => <tr key={member.id}><td><strong>{member.name}</strong><small>{member.email}{member.current ? ' · Tu' : ''}</small></td><td>{member.role}</td><td>{member.team}</td><td><span className="dw-settings-status">{member.status}</span></td><td>{member.seen}</td></tr>)}</tbody></table></div><section className="dw-setting-block"><h2>Invita una persona</h2><form className="dw-settings-invite" onSubmit={inviteMember}><Field label="Email"><input type="email" required placeholder="nome@azienda.it" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} /></Field><Field label="Ruolo"><select value={inviteRole} onChange={event => setInviteRole(event.target.value)}><option>Designer</option><option>Collaboratore</option><option>Responsabile</option><option>Osservatore</option></select></Field><Button primary icon="plus" type="submit">Invia invito</Button></form><p className="dw-settings-feedback" role="status">{message}</p>{invites.map(invite => <div className="dw-settings-invite-row" key={invite.email}><span><strong>{invite.email}</strong><small>{invite.role} · {invite.sent}</small></span><span>{invite.status}</span></div>)}</section></>}
      {selected === 'teams' && <><SettingsHeading title="Team" lead="Gruppi di lavoro demo organizzati per fase della filiera." /><div className="dw-settings-team-grid">{demoTeams.map(team => <article className="dw-settings-team" key={team.name} style={{ '--team-color': `var(--${team.color})` }}><span className="dw-settings-team-icon"><Icon name="users" size={17} /></span><div><h2>{team.name}</h2><p>{team.detail}</p></div><span className="dw-settings-team-count">{team.members.length} membri</span><ul>{team.members.map(name => <li key={name}>{name}</li>)}</ul><button type="button" onClick={() => { selectSection('members'); setMemberQuery(team.name); }}>Vedi membri<Icon name="arrow" size={13} /></button></article>)}</div><div className="dw-settings-info"><Icon name="info" size={15} /><span>I gruppi sono esempi di organizzazione per Atelier; non assegnano permessi reali.</span></div></>}
      {selected === 'projects' && <><SettingsHeading title="Capi" lead="Modelli e varianti presenti nello spazio di lavoro." /><div className="dw-settings-table-wrap"><table className="dw-settings-table"><thead><tr><th>Capo</th><th>Codice</th><th>Variante</th><th>Collezione</th><th>Stato</th></tr></thead><tbody>{workspaceItems.map(item => <tr key={item.styleId}><td><strong>{item.title}</strong><small>{item.factory}</small></td><td>{item.styleId}</td><td>{item.variant}</td><td>{item.collection}</td><td><span className="dw-settings-status">{item.identityAssigned ? 'In sviluppo' : 'Bozza'}</span></td></tr>)}</tbody></table></div><p className="dw-settings-caption">I capi sono condivisi con tutto il team demo. Le varianti vengono gestite singolarmente.</p></>}
      {selected === 'permissions' && <><SettingsHeading title="Permessi" lead="Riepilogo dimostrativo dei livelli di accesso per ruolo." /><div className="dw-settings-table-wrap"><table className="dw-settings-table dw-permissions-table"><thead><tr><th>Ruolo</th><th>Leggi</th><th>Modifica</th><th>Approva</th><th>Gestisci team</th></tr></thead><tbody>{[['Proprietario', 'Tutto lo spazio', 'Tutti i moduli', 'Sì', 'Sì'], ['Responsabile', 'Tutto il team', 'Moduli assegnati', 'Per fase', 'Inviti'], ['Collaboratore', 'Capi assegnati', 'Attività assegnate', 'No', 'No'], ['Osservatore', 'Tutto lo spazio', 'No', 'No', 'No']].map(row => <tr key={row[0]}>{row.map((cell, index) => index ? <td key={index}>{cell}</td> : <th key={index} scope="row">{cell}</th>)}</tr>)}</tbody></table></div><div className="dw-settings-info"><Icon name="lock" size={15} /><span>I permessi sono solo un esempio visivo: la demo non applica controlli di accesso reali.</span></div></>}
      {selected === 'email' && <><SettingsHeading title="Email" lead="Riepiloghi e aggiornamenti che riceveresti via email." /><Preference label="Riepilogo giornaliero" description="Un recap delle scadenze e dei cambiamenti della filiera, ogni mattina." checked={preferences?.emailDigest ?? true} onChange={value => updatePreferences({ emailDigest: value })} /><Preference label="Menzioni e risposte" description="Ricevi un’email quando qualcuno ti menziona o risponde a una conversazione." checked={preferences?.emailMentions ?? true} onChange={value => updatePreferences({ emailMentions: value })} /><Preference label="Aggiornamenti dei moduli" description="Mostra gli aggiornamenti dei capi anche nell’Inbox della demo." checked={preferences?.moduleAlerts ?? true} onChange={value => updatePreferences({ moduleAlerts: value })} /></>}
      {selected === 'push' && <><SettingsHeading title="Push" lead="Avvisi immediati per le attività che richiedono attenzione." /><Preference label="Nuove assegnazioni" description="Avvisa quando ti viene assegnato un controllo o un’attività." checked={preferences?.pushAssignments ?? true} onChange={value => updatePreferences({ pushAssignments: value })} /><Preference label="Scadenze imminenti" description="Promemoria il giorno in cui un incarico è in scadenza." checked={preferences?.pushDeadlines ?? true} onChange={value => updatePreferences({ pushDeadlines: value })} /><div className="dw-settings-info"><Icon name="bell" size={15} /><span>Le notifiche push sono simulate: il browser non invia avvisi in background.</span></div></>}
      {selected === 'mentions' && <><SettingsHeading title="Menzioni" lead="Scegli quali conversazioni portare nella tua Inbox." /><Preference label="Menzioni dirette" description="Quando una persona ti cita in un commento o in una scheda." checked={preferences?.emailMentions ?? true} onChange={value => updatePreferences({ emailMentions: value })} /><Preference label="Commenti sui capi che seguo" description="Aggiornamenti sulle discussioni collegate ai tuoi capi." checked={preferences?.mentionComments ?? true} onChange={value => updatePreferences({ mentionComments: value })} /><Preference label="Aggiornamenti dei moduli" description="Modifiche di materiali, produzione e qualità nella Inbox." checked={preferences?.moduleAlerts ?? true} onChange={value => updatePreferences({ moduleAlerts: value })} /></>}
      {selected === 'assignments' && <><SettingsHeading title="Assegnazioni attività" lead="Controlla come ricevere e seguire gli incarichi del team." /><Preference label="Nuove attività assegnate" description="Aggiungi un aggiornamento all’Inbox quando ti assegnano un incarico." checked={preferences?.pushAssignments ?? true} onChange={value => updatePreferences({ pushAssignments: value })} /><Preference label="Promemoria prima della scadenza" description="Ricorda le attività ancora aperte in prossimità della data prevista." checked={preferences?.assignmentReminders ?? true} onChange={value => updatePreferences({ assignmentReminders: value })} /><div className="dw-setting-row"><div><strong>Vista iniziale attività</strong><p>Preferenza salvata nella demo; l’accesso segue la pagina corrente.</p></div><select aria-label="Vista iniziale attività" value={preferences?.defaultLanding || 'home'} onChange={event => updatePreferences({ defaultLanding: event.target.value })}><option value="home">Home</option><option value="my-tasks">Le mie attività</option><option value="inbox">Inbox</option></select></div></>}
      {selected === 'preferences' && <><SettingsHeading title="Preferenze" lead="Impostazioni personali per lavorare ogni giorno in Atelier." /><div className="dw-setting-row"><div><strong>Pagina iniziale</strong><p>Preferenza salvata nella demo; l’accesso segue la pagina corrente.</p></div><select aria-label="Pagina iniziale" value={preferences?.defaultLanding || 'home'} onChange={event => updatePreferences({ defaultLanding: event.target.value })}><option value="home">Home</option><option value="my-tasks">Le mie attività</option><option value="inbox">Inbox</option></select></div><div className="dw-setting-row"><div><strong>Riduci le animazioni</strong><p>Preferisci transizioni più discrete.</p></div><select aria-label="Movimento" value={preferences?.motion || 'system'} onChange={event => updatePreferences({ motion: event.target.value })}><option value="system">Segui il sistema</option><option value="reduce">Riduci movimento</option></select></div><div className="dw-setting-row"><div><strong>Densità delle attività</strong><p>Altezza delle righe nella lista incarichi.</p></div><div className="dw-segmented">{[['comfortable', 'Confortevole'], ['compact', 'Compatta']].map(([value, label]) => <button key={value} type="button" aria-pressed={(preferences?.taskDensity || 'comfortable') === value} onClick={() => updatePreferences({ taskDensity: value })}>{label}</button>)}</div></div></>}
      {selected === 'shortcuts' && <><SettingsHeading title="Scorciatoie da tastiera" lead="Comandi rapidi disponibili nella demo WEAVE." /><div className="dw-shortcut-columns">{shortcutGroups.map(([group, items]) => <section key={group}><h3>{group}</h3>{items.map(([label, keys]) => <div className="dw-shortcut-row" key={label}><span>{label}</span><span className="dw-shortcut-keys">{keys.map((key, index) => <React.Fragment key={`${key}-${index}`}>{index > 0 && keys[0] === 'G' && <small>poi</small>}<kbd>{key}</kbd></React.Fragment>)}</span></div>)}</section>)}</div></>}
      {selected === 'password' && <><SettingsHeading title="Password" lead="Aggiorna la password del tuo account." /><div className="dw-settings-info"><Icon name="info" size={15} /><span>La modifica è simulata e non aggiorna credenziali reali.</span></div><form className="dw-account-form dw-security-form" onSubmit={savePassword}><Field label="Password attuale"><input type="password" autoComplete="current-password" value={passwordDraft.current} onChange={event => setPasswordDraft({ ...passwordDraft, current: event.target.value })} required /></Field><Field label="Nuova password"><input type="password" autoComplete="new-password" minLength={8} value={passwordDraft.next} onChange={event => setPasswordDraft({ ...passwordDraft, next: event.target.value })} required /></Field><Field label="Conferma nuova password"><input type="password" autoComplete="new-password" minLength={8} value={passwordDraft.confirm} onChange={event => setPasswordDraft({ ...passwordDraft, confirm: event.target.value })} required /></Field><div className="dw-account-form-footer"><p role="status">{message}</p><Button primary type="submit">Aggiorna password</Button></div></form></>}
      {selected === 'sessions' && <><SettingsHeading title="Sessioni" lead="Dispositivi che hanno effettuato l’accesso allo spazio demo." /><div className="dw-settings-table-wrap"><table className="dw-settings-table"><thead><tr><th>Dispositivo</th><th>Posizione</th><th>Ultima attività</th><th /></tr></thead><tbody>{sessions.map(session => <tr key={session.id}><td><strong>{session.device}</strong><small>{session.current ? 'Questa sessione' : session.revoked ? 'Sessione terminata' : 'Sessione demo'}</small></td><td>{session.location}</td><td>{session.seen}</td><td>{session.current ? <span className="dw-settings-status">Attiva</span> : <button type="button" className="dw-text-button" disabled={session.revoked} onClick={() => { setSessions(current => current.map(item => item.id === session.id ? { ...item, revoked: true } : item)); setMessage('Sessione terminata nella demo.'); }}>Disconnetti</button>}</td></tr>)}</tbody></table></div><p className="dw-settings-feedback" role="status">{message}</p></>}
      {selected === 'two-factor' && <><SettingsHeading title="Autenticazione a due fattori" lead="Aggiungi un secondo passaggio di verifica all’accesso." /><div className="dw-settings-security-card"><span className="dw-settings-security-icon"><Icon name="shield-check" size={20} /></span><div><strong>{preferences?.twoFactorEnabled ? 'Verifica in due passaggi attiva' : 'Proteggi l’accesso al tuo account'}</strong><p>Usa un’app di autenticazione per generare codici temporanei.</p></div><Button primary={!preferences?.twoFactorEnabled} onClick={() => { updatePreferences({ twoFactorEnabled: !preferences?.twoFactorEnabled }); setMessage(preferences?.twoFactorEnabled ? 'Verifica disattivata nella demo.' : 'Configurazione dimostrativa avviata.'); }}>{preferences?.twoFactorEnabled ? 'Disattiva' : 'Configura'}</Button></div><p className="dw-settings-feedback" role="status">{message}</p><div className="dw-settings-info"><Icon name="info" size={15} /><span>La configurazione è solo dimostrativa: non genera codici e non modifica un account reale.</span></div></>}
      {selected === 'plan' && <><SettingsHeading title="Piano" lead="Riepilogo del piano associato allo spazio demo." /><div className="dw-settings-plan"><div><span className="dw-settings-plan-label">Piano attuale</span><h2>WEAVE Studio <span>Demo</span></h2><p>Accesso dimostrativo · nessun addebito</p></div><strong>€0 <small>/ demo</small></strong></div><div className="dw-setting-block"><h2>Incluso nella demo</h2>{[['Membri', '8 persone'], ['Capi e varianti', `${workspaceItems.length} elementi`], ['Spazio file', 'Anteprima dimostrativa'], ['Supporto', 'Centro assistenza']].map(([label, value]) => <div className="dw-setting-row" key={label}><div><strong>{label}</strong></div><span>{value}</span></div>)}</div><div className="dw-settings-info"><Icon name="info" size={15} /><span>Il piano e i prezzi sono dati di esempio, non costituiscono un’offerta commerciale.</span></div></>}
      {selected === 'payment' && <><SettingsHeading title="Pagamento" lead="Metodo di pagamento registrato per lo spazio." /><div className="dw-settings-payment"><span className="dw-settings-payment-mark">VISA</span><div><strong>•••• •••• •••• 4242</strong><small>Demo · scadenza 08/28 · intestato ad Atelier</small></div><span className="dw-settings-status">Predefinito</span></div><Button onClick={() => setMessage('Aggiornamento del metodo di pagamento simulato.')}>Aggiorna metodo</Button><p className="dw-settings-feedback" role="status">{message}</p><div className="dw-settings-info"><Icon name="lock" size={15} /><span>Nessun dato di pagamento reale è salvato in questa demo.</span></div></>}
      {selected === 'invoices' && <><SettingsHeading title="Fatture" lead="Storico dimostrativo dei documenti di fatturazione." /><div className="dw-settings-table-wrap"><table className="dw-settings-table"><thead><tr><th>Documento</th><th>Data</th><th>Descrizione</th><th>Importo</th><th>Stato</th></tr></thead><tbody>{[['INV-DEMO-024', '01 ott 2026', 'Piano WEAVE Studio · demo', '€0,00'], ['INV-DEMO-023', '01 set 2026', 'Piano WEAVE Studio · demo', '€0,00'], ['INV-DEMO-022', '01 ago 2026', 'Piano WEAVE Studio · demo', '€0,00']].map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}<td><span className="dw-settings-status">Dimostrativa</span></td></tr>)}</tbody></table></div></>}
      {unsupported && <><h1>{sectionLabel[selected] || 'Impostazioni'}</h1><p className="dw-setting-lead">Questa sezione non è disponibile nella demo Atelier.</p></>}
    </div></div>
  </div>;
}

export function HelpMenu({ onSearch }) {
  const [open, setOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const menuId = useId();
  const { notify } = useDemo();
  const closeMenu = restoreFocus => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  useEffect(() => {
    if (open) menu.current?.querySelector('[tabindex="0"]')?.focus();
  }, [open]);
  useEffect(() => {
    const close = event => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === 'Escape' && open) { event.preventDefault(); closeMenu(true); }
      if (event.type === 'pointerdown' && !root.current?.contains(event.target)) closeMenu(false);
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) { event.preventDefault(); if (open) closeMenu(true); setShortcuts(true); }
    };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  const itemProps = index => ({ role: 'menuitem', tabIndex: menuIndex === index ? 0 : -1, onFocus: () => setMenuIndex(index) });
  const moveMenu = event => {
    if (event.key === 'Tab') { closeMenu(true); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = [...menu.current.querySelectorAll('[role="menuitem"]')];
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (items.indexOf(document.activeElement) + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[index]?.focus();
  };
  const unavailable = () => { closeMenu(true); notify('Questa risorsa non è disponibile nella demo Atelier.'); };
  return <div className="dw-help-menu" ref={root}>
    <button type="button" ref={trigger} className="dw-help-trigger" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => { setMenuIndex(0); setOpen(value => !value); }} onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setMenuIndex(event.key === 'ArrowDown' ? 0 : 7); setOpen(true); } }}><Icon name="help" size={16} /><span>Aiuto e risorse</span></button>
    {open && <div ref={menu} id={menuId} className="dw-help-popover" role="menu" aria-label="Aiuto e risorse" onKeyDown={moveMenu}><strong>Aiuto e risorse</strong><button type="button" {...itemProps(0)} onClick={() => { closeMenu(true); setShortcuts(true); }}><Icon name="list" size={15} />Scorciatoie da tastiera<kbd>?</kbd></button><button type="button" {...itemProps(1)} onClick={() => { closeMenu(true); onSearch(); }}><Icon name="search" size={15} />Menu comandi<kbd>⌘K</kbd></button><button type="button" {...itemProps(2)} onClick={unavailable}><Icon name="layers" size={15} />Sistema di design</button><button type="button" {...itemProps(3)} onClick={unavailable}><Icon name="grid" size={15} />Stati di sistema</button><hr /><strong>Prototipo</strong><button type="button" {...itemProps(4)} onClick={unavailable}><Icon name="rotate-cw" size={15} />Ripeti introduzione</button><button type="button" {...itemProps(5)} onClick={unavailable}><Icon name="activity" size={15} />Simula offline</button><button type="button" {...itemProps(6)} onClick={unavailable}><Icon name="file" size={15} />Apri un link non valido</button><button type="button" {...itemProps(7)} onClick={unavailable}><Icon name="settings" size={15} />Ripristina dati demo</button></div>}
    {shortcuts && <Dialog title="Scorciatoie da tastiera" className="dw-shortcuts-dialog" onClose={() => setShortcuts(false)}><div className="dw-shortcut-columns">{shortcutGroups.map(([group, items]) => <section key={group}><h3>{group}</h3>{items.map(([label, keys]) => <div className="dw-shortcut-row" key={label}><span>{label}</span><span className="dw-shortcut-keys">{keys.map((key, index) => <React.Fragment key={`${key}-${index}`}>{index > 0 && keys[0] === 'G' && <small>poi</small>}<kbd>{key}</kbd></React.Fragment>)}</span></div>)}</section>)}</div></Dialog>}
  </div>;
}
