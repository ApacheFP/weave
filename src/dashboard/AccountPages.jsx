import React, { useEffect, useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { Badge, Button, Card, Field, Icon, Tabs } from './ui.jsx';
import './account-pages.css';

const settingsSections = { profile: 'Profilo', notifications: 'Notifiche', workspace: 'Spazio di lavoro' };

function Preference({ label, description, checked, onChange }) {
  return <div className="dw-account-preference">
    <div><strong>{label}</strong><p>{description}</p></div>
    <button className="dw-account-switch" type="button" role="switch" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)}><span /></button>
  </div>;
}

export function SettingsPage({ section = 'profile' }) {
  const { data, styles, commit, preferences, updatePreferences } = useDemo();
  const [selected, setSelected] = useState(settingsSections[section] || 'Profilo');
  const [draft, setDraft] = useState(data.profile);
  const [message, setMessage] = useState('');
  const profile = data.profile;
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const changed = Object.keys(profile).some(key => (draft[key] || '').trim() !== profile[key]);

  useEffect(() => setSelected(settingsSections[section] || 'Profilo'), [section]);
  useEffect(() => setDraft(profile), [profile]);

  function saveProfile(event) {
    event.preventDefault();
    const next = { firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim() };
    if (!next.firstName || !next.lastName || !next.email) return;
    commit({ profile: next });
    setMessage('Profilo salvato.');
  }

  return <div className="dw-account-page">
    <header className="dw-page-head"><div><h2>Impostazioni</h2><p>Il tuo account e lo spazio Atelier.</p></div><Badge>Demo</Badge></header>
    <Tabs items={Object.values(settingsSections)} selected={selected} onChange={value => { setSelected(value); setMessage(''); }} label="Sezioni delle impostazioni" />
    {selected === 'Profilo' && <Card title="Profilo" note="Nome e contatto usati nelle attività dello spazio.">
      <div className="dw-account-identity"><img src="/illustrations/profile-avatar.webp" width="40" height="40" alt="" /><div><strong>{fullName}</strong><span>Designer · Atelier</span></div></div>
      <form className="dw-account-form" onSubmit={saveProfile}>
        <div className="dw-account-form-grid">
          <Field label="Nome"><input type="text" autoComplete="given-name" value={draft.firstName} required maxLength={80} pattern=".*\S.*" onChange={event => { setDraft({ ...draft, firstName: event.target.value }); setMessage(''); }} /></Field>
          <Field label="Cognome"><input type="text" autoComplete="family-name" value={draft.lastName} required maxLength={80} pattern=".*\S.*" onChange={event => { setDraft({ ...draft, lastName: event.target.value }); setMessage(''); }} /></Field>
        </div>
        <Field label="Email"><input type="email" autoComplete="email" value={draft.email} required maxLength={254} onChange={event => { setDraft({ ...draft, email: event.target.value }); setMessage(''); }} /></Field>
        <div className="dw-account-form-footer"><p role="status">{message}</p><div className="dw-actions">{changed && <Button onClick={() => { setDraft(profile); setMessage(''); }}>Annulla</Button>}<Button primary type="submit" disabled={!changed}>Salva modifiche</Button></div></div>
      </form>
    </Card>}
    {selected === 'Notifiche' && <Card title="Notifiche" note="Le tue preferenze per gli aggiornamenti dello spazio.">
      <Preference label="Avvisi della filiera" description="Aggiungi all’Inbox i nuovi aggiornamenti dei moduli." checked={preferences?.moduleAlerts ?? true} onChange={value => updatePreferences({ moduleAlerts: value })} />
      <Preference label="Novità di WEAVE" description="Memorizza la preferenza per gli aggiornamenti del prodotto nella demo." checked={preferences?.productNews ?? false} onChange={value => updatePreferences({ productNews: value })} />
      <p className="dw-account-note">Le preferenze si salvano automaticamente per questa sessione demo.</p>
    </Card>}
    {selected === 'Spazio di lavoro' && <Card title="Atelier" note="Lo spazio condiviso per lo sviluppo dei capi.">
      <dl className="dw-account-metadata"><div><dt>Spazio</dt><dd>Atelier</dd></div><div><dt>Capi</dt><dd>{styles.length}</dd></div><div><dt>Il tuo ruolo</dt><dd>Designer</dd></div><div><dt>Ambiente</dt><dd>Demo</dd></div></dl>
      <p className="dw-account-note">Capi, file e scelte sono disponibili durante questa sessione. Ricaricando la pagina riparti dai dati dimostrativi.</p>
    </Card>}
  </div>;
}

export function HelpPage({ onNavigate, onOpenPage }) {
  const [selected, setSelected] = useState('Disegno e concept');
  return <div className="dw-account-page dw-help-page">
    <header className="dw-page-head"><div><h2>Aiuto e risorse</h2><p>I passaggi principali per lavorare in WEAVE.</p></div></header>
    <Tabs items={['Disegno e concept', 'Filiera', 'Navigazione']} selected={selected} onChange={setSelected} label="Guide di WEAVE" />
    {selected === 'Disegno e concept' && <div className="dw-help-grid">
      <Card title="1. Ideazione e design" note="Il punto di partenza è il tuo schizzo.">
        <p>Carica una foto, un file dal tablet o un PDF. Puoi anche usare lo schizzo demo già disponibile nel modulo.</p>
        <p>La ricerca creativa è facoltativa: genera o carica riferimenti per il moodboard e scegli una palette.</p>
        <div className="dw-help-callout"><Icon name="check" size={16} /><p>Prima di proseguire, conferma moodboard e palette oppure scegli esplicitamente di lasciarli vuoti. Una scelta già salvata può essere modificata.</p></div>
        <Button icon="arrow" onClick={() => onNavigate(1)}>Apri ideazione e design</Button>
      </Card>
      <Card title="2. Disegno tecnico" note="Dallo schizzo alle informazioni costruttive.">
        <p>Il modulo riceve lo schizzo e le scelte del concept. Da qui lavori sulle viste tecniche, aggiungi annotazioni e rivedi i dettagli.</p>
        <p>Le revisioni rimangono nelle versioni. Dopo il controllo puoi approvare il disegno ed esportare la scheda tecnica.</p>
        <div className="dw-help-callout"><Icon name="file" size={16} /><p>La generazione e le verifiche sono simulate nella demo.</p></div>
        <Button icon="arrow" onClick={() => onNavigate(2)}>Apri disegno tecnico</Button>
      </Card>
    </div>}
    {selected === 'Filiera' && <Card title="Dallo sviluppo alla produzione" note="Ogni capo ha i propri dati, file e attività.">
      <div className="dw-help-links">
        <button type="button" onClick={() => onNavigate(3)}><Icon name="layers" size={18} /><span><strong>Materiali e BOM</strong><small>Materiali, quantità e documenti della distinta base.</small></span><Icon name="arrow" size={16} /></button>
        <button type="button" onClick={() => onNavigate(10)}><Icon name="calendar" size={18} /><span><strong>Pianificazione</strong><small>Fasi, date e avanzamento del capo.</small></span><Icon name="arrow" size={16} /></button>
        <button type="button" onClick={() => onNavigate(13)}><Icon name="check" size={18} /><span><strong>Qualità</strong><small>Controlli e problemi da risolvere prima della consegna.</small></span><Icon name="arrow" size={16} /></button>
      </div>
      <p className="dw-account-note">Usa Panoramica per lavorare nel modulo e Attività per vedere chi ha aggiornato i suoi dati.</p>
    </Card>}
    {selected === 'Navigazione' && <Card title="Trova il lavoro da fare" note="La parte personale e i moduli del capo sono nella sidebar.">
      <dl className="dw-help-shortcuts"><div><dt>Cerca capi e moduli</dt><dd><kbd>⌘ / Ctrl</kbd> + <kbd>K</kbd></dd></div><div><dt>Chiudi menu o finestra</dt><dd><kbd>Esc</kbd></dd></div></dl>
      <div className="dw-help-links">
        <button type="button" onClick={() => onOpenPage('inbox')}><Icon name="chat" size={18} /><span><strong>Inbox</strong><small>Aggiornamenti e conversazioni dei capi nello spazio.</small></span><Icon name="arrow" size={16} /></button>
        <button type="button" onClick={() => onOpenPage('my-tasks')}><Icon name="list" size={18} /><span><strong>Le mie attività</strong><small>Il lavoro assegnato a te, organizzato per scadenza.</small></span><Icon name="arrow" size={16} /></button>
      </div>
      <p className="dw-account-note">Il selettore del capo cambia il contesto dei moduli. Impostazioni e profilo sono in fondo alla sidebar.</p>
    </Card>}
  </div>;
}
