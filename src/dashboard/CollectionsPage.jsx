import React, { useMemo, useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { Button, Card, Dialog, Empty, Field, Icon, Tabs } from './ui.jsx';
import { ProductPhoto } from './Media.jsx';
import { actorStyle } from './workspaceData.js';
import { sameActor } from './workspaceIdentity.js';
import './collections.css';

const phases = ['Passata', 'Attuale', 'Futura', 'Programmata'];
function collectionPhase(name, metadata) {
  if (phases.includes(metadata?.phase)) return metadata.phase;
  const year = Number(name.match(/\b20\d{2}\b/)?.[0]);
  if (!year) return 'Programmata';
  if (year < new Date().getFullYear()) return 'Passata';
  if (year === new Date().getFullYear()) return 'Attuale';
  return 'Programmata';
}

export default function CollectionsPage({ onOpenModule }) {
  const { data, workspaceItems, workspaceCollections, tasks, inbox, createCollection, updateCollection, updateCollectionPhase, assignProductToCollection, sendTeamMessage } = useDemo();
  const [selectedName, setSelectedName] = useState(null);
  const [filter, setFilter] = useState('Tutte');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [contact, setContact] = useState(null);
  const names = useMemo(() => [...new Set([...Object.keys(workspaceCollections), ...workspaceItems.map(item => item.collection)])].sort((a, b) => a.localeCompare(b, 'it-IT')), [workspaceCollections, workspaceItems]);
  const collections = names.map(name => ({ name, items: workspaceItems.filter(item => item.collection === name), phase: collectionPhase(name, workspaceCollections[name]) }));
  const visible = filter === 'Tutte' ? collections : collections.filter(item => item.phase === filter);
  const selected = collections.find(item => item.name === selectedName);
  const available = workspaceItems.filter(item => item.collection !== selectedName);
  const team = selected ? collectionTeam(selected.items, tasks, inbox) : [];

  return <div className="dw-collections-page">
    {!selected ? <>
      <header className="dw-page-head"><div><h2>Collezioni</h2><p>Organizza i capi per stagione e stato della collezione.</p></div><Button primary icon="plus" onClick={() => setCreateOpen(true)}>Nuova collezione</Button></header>
      <div className="dw-collections-summary">{phases.map(phase => <div key={phase}><span>{phase}</span><strong>{collections.filter(item => item.phase === phase).length}</strong></div>)}</div>
      <Tabs items={['Tutte', ...phases]} selected={filter} onChange={setFilter} label="Filtra le collezioni" />
      {visible.length ? <div className="dw-collection-grid">{visible.map(item => <article className="dw-collection-card" key={item.name}>
        <strong>{item.name}</strong>
        <span className="dw-collection-card-count">{item.items.length} {item.items.length === 1 ? 'capo' : 'capi'}</span>
        <div className="dw-collection-card-actions"><Button onClick={() => setEditingName(item.name)}>Modifica</Button><Button onClick={() => setSelectedName(item.name)}>Apri collezione</Button></div>
      </article>)}</div> : <Empty>Nessuna collezione in questa categoria.</Empty>}
      {createOpen && <CreateCollectionDialog onClose={() => setCreateOpen(false)} onCreate={input => { if (!createCollection(input)) return false; setCreateOpen(false); setFilter('Tutte'); setSelectedName(input.name.trim()); return true; }} />}
      {editingName && <EditCollectionDialog collection={collections.find(item => item.name === editingName)} onClose={() => setEditingName(null)} onSave={input => { if (!updateCollection(editingName, input)) return false; setEditingName(null); return true; }} />}
    </> : <>
      <header className="dw-page-head dw-collection-detail-head"><div><button className="dw-collection-back" type="button" onClick={() => setSelectedName(null)}><Icon name="back" size={14} />Tutte le collezioni</button><h2>{selected.name}</h2><p>{selected.items.length} {selected.items.length === 1 ? 'capo associato' : 'capi associati'}</p></div><Button primary icon="plus" onClick={() => setAddOpen(true)}>Aggiungi capi</Button></header>
      <Card className="dw-collection-settings" title="Stato della collezione" note="Puoi aggiornarlo quando la stagione cambia"><Field label="Stato"><select value={selected.phase} onChange={event => updateCollectionPhase(selected.name, event.target.value)}>{phases.map(phase => <option key={phase}>{phase}</option>)}</select></Field></Card>
      <Card title="Capi associati" note="Apri un capo per continuare a lavorarci">
        {selected.items.length ? <div className="dw-collection-products">{selected.items.map(item => <button type="button" className="dw-collection-product" key={item.styleId} onClick={() => onOpenModule(item.styleId, 21)} aria-label={`Apri ${item.title}, variante ${item.variant}`}>
          <span className="dw-collection-product-image"><ProductPhoto product={item} sizes="(max-width: 760px) 100vw, 25vw" alt="" /></span>
          <span className="dw-collection-product-info"><span className="dw-collection-product-heading"><strong>{item.title}</strong></span><span className="dw-collection-product-footer"><small className="dw-collection-product-variant">{item.variant}</small><span className="dw-collection-product-action"><small className="dw-collection-product-model">{item.styleId}</small><span className="dw-collection-product-cta">Apri capo<Icon name="arrow" size={15} /></span></span></span></span>
        </button>)}</div> : <Empty>Non ci sono ancora capi associati. Aggiungine uno per iniziare.</Empty>}
      </Card>
      <Card className="dw-collection-team-card" title="Team della collezione" note="Persone coinvolte, suddivise per fase del percorso">
        {team.length ? <div className="dw-collection-team">{team.map(section => <section className="dw-collection-team-section" key={section.label}>
          <h3>{section.label}</h3>
          <div className="dw-collection-team-members">{section.members.map(member => {
            const isSelf = sameActor(member.actor, data.profile);
            return <button type="button" className={`dw-collection-teammate ${isSelf ? 'is-self' : ''}`} key={member.key} title={member.actor.name} aria-label={member.actor.name} data-name={member.actor.name} disabled={isSelf} onClick={() => setContact({ ...member, kind: null, body: '' })}>
            <CollectionAvatar actor={member.actor} profile={data.profile} />
          </button>;
          })}</div>
        </section>)}</div> : <Empty>Le persone coinvolte appariranno qui quando ci saranno attività o aggiornamenti.</Empty>}
      </Card>
      {addOpen && <Dialog title="Aggiungi capi" note={`Scegli i capi da associare a ${selected.name}`} onClose={() => setAddOpen(false)}>
        {available.length ? <div className="dw-collection-add-list">{available.map(item => <div key={item.styleId}><span className="dw-style-card-photo"><ProductPhoto product={item} sizes="40px" alt="" /></span><span><strong>{item.title}</strong><small>{item.variant} · {item.collection}</small></span><Button icon="plus" onClick={() => assignProductToCollection(item.styleId, selected.name)}>Aggiungi</Button></div>)}</div> : <Empty>Tutti i capi sono già associati a questa collezione.</Empty>}
      </Dialog>}
      {contact && <CollectionContactDialog contact={contact} items={selected.items} onClose={() => setContact(null)} onSend={input => {
        const success = sendTeamMessage({ ...input, recipient: contact.actor, styleId: selected.items[0]?.styleId, moduleId: contact.moduleId });
        if (success) setContact(null);
        return success;
      }} />}
    </>}
  </div>;
}

function collectionTeam(items, tasks, inbox) {
  const styleIds = new Set(items.map(item => item.styleId));
  const labels = ['Sviluppo prodotto', 'Operazioni', 'Identità e intelligence'];
  const sections = new Map(labels.map(label => [label, new Map()]));
  const sectionFor = id => {
    const moduleId = Number(id);
    return moduleId <= 7 ? labels[0] : moduleId <= 18 ? labels[1] : labels[2];
  };
  const add = (actor, moduleId) => {
    if (!actor?.name) return;
    const key = actor.id || actor.email || actor.name;
    const members = sections.get(sectionFor(moduleId));
    if (!members.has(key)) members.set(key, { key, actor, moduleId: Number(moduleId) || 1 });
  };
  for (const item of items) for (const event of item.events || []) add(event.actor, event.module);
  for (const task of tasks) if (styleIds.has(task.styleId)) add(task.assignee, task.moduleId);
  for (const message of inbox) if (styleIds.has(message.styleId)) {
    add(message.actor, message.moduleId);
    add(message.recipient, message.moduleId);
    for (const reply of message.replies || []) add(reply.actor, message.moduleId);
  }
  return labels.map(label => ({ label, members: [...sections.get(label).values()].sort((a, b) => a.actor.name.localeCompare(b.actor.name, 'it-IT')) })).filter(section => section.members.length);
}

function CollectionAvatar({ actor, profile }) {
  const initials = actor.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('');
  return <span className="dw-collection-avatar" style={actorStyle(actor)} aria-hidden="true">{sameActor(actor, profile) ? <img src={profile.avatar || '/illustrations/profile-avatar.webp'} alt="" /> : initials}</span>;
}

function CollectionContactDialog({ contact, items, onClose, onSend }) {
  const [kind, setKind] = useState(contact.kind);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const isReminder = kind === 'reminder';
  const collectionName = items[0]?.collection || 'Collezione';
  return <Dialog className="dw-collection-contact-dialog" title={!kind ? 'Contatta il team' : isReminder ? 'Invia un promemoria' : 'Nuovo messaggio'} note={!kind ? 'Scegli come raggiungere questa persona.' : `A ${contact.actor.name} · ${collectionName}`} onClose={onClose}>
    <div className="dw-collection-contact-recipient">
      <span className="dw-collection-contact-avatar"><CollectionAvatar actor={contact.actor} profile={null} /></span>
      <span className="dw-collection-contact-recipient-copy"><small>DESTINATARIO</small><strong>{contact.actor.name}</strong><span>{collectionName}{items[0]?.title ? ` · ${items[0].title}` : ''}</span></span>
    </div>
    {kind ? <form className="dw-collection-contact-form" onSubmit={event => {
      event.preventDefault();
      if (!body.trim()) { setError('Scrivi un testo prima di inviare.'); return; }
      if (!onSend({ kind, body })) setError('Il messaggio non è stato inviato. Riprova.');
    }}>
      <Field label={isReminder ? 'Il tuo promemoria' : 'Il tuo messaggio'}><textarea data-autofocus rows={4} maxLength={2000} value={body} placeholder={isReminder ? 'Es. Puoi verificare la palette entro venerdì?' : 'Scrivi un messaggio…'} onChange={event => { setBody(event.target.value); setError(''); }} /></Field>
      {error && <p className="dw-error" role="alert">{error}</p>}
      <div className="dw-collection-contact-footer"><span>La conversazione sarà disponibile nella Inbox.</span><div className="dw-dialog-actions"><Button onClick={() => { setKind(null); setError(''); }}>Indietro</Button><Button primary icon="arrow" type="submit">Invia</Button></div></div>
    </form> : <div className="dw-collection-contact-actions" aria-label="Scegli il tipo di comunicazione">
      <p className="dw-collection-contact-prompt">Come vuoi contattarlo?</p>
      <button type="button" className="dw-collection-contact-option is-message" onClick={() => setKind('message')}>
        <span className="dw-collection-contact-option-icon"><Icon name="chat" size={19} /></span><span className="dw-collection-contact-option-copy"><strong>Invia messaggio</strong><small>Apri una conversazione nella Inbox</small></span><Icon name="arrow" size={16} />
      </button>
      <button type="button" className="dw-collection-contact-option is-reminder" onClick={() => setKind('reminder')}>
        <span className="dw-collection-contact-option-icon"><Icon name="bell" size={19} /></span><span className="dw-collection-contact-option-copy"><strong>Invia promemoria</strong><small>Richiama un’attività da completare</small></span><Icon name="arrow" size={16} />
      </button>
    </div>}
  </Dialog>;
}

function EditCollectionDialog({ collection, onClose, onSave }) {
  const [name, setName] = useState(collection?.name || '');
  const [phase, setPhase] = useState(collection?.phase || 'Programmata');
  const [error, setError] = useState('');
  return <Dialog title="Modifica collezione" note="Aggiorna il nome o lo stato della stagione" onClose={onClose}><form className="dw-stack" onSubmit={event => {
    event.preventDefault();
    if (!onSave({ name, phase })) setError('Controlla il nome: potrebbe essere già utilizzato.');
  }}>
    <Field label="Nome della collezione"><input data-autofocus required maxLength={80} pattern=".*\\S.*" value={name} onChange={event => { setName(event.target.value); setError(''); }} /></Field>
    <Field label="Stato"><select value={phase} onChange={event => setPhase(event.target.value)}>{phases.map(item => <option key={item}>{item}</option>)}</select></Field>
    {error && <p className="dw-error" role="alert">{error}</p>}
    <div className="dw-dialog-actions"><Button onClick={onClose}>Annulla</Button><Button primary icon="check" type="submit">Salva modifiche</Button></div>
  </form></Dialog>;
}

function CreateCollectionDialog({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [phase, setPhase] = useState('Programmata');
  const [error, setError] = useState('');
  return <Dialog title="Nuova collezione" note="Dai un nome alla stagione e scegli il suo stato" onClose={onClose}><form className="dw-stack" onSubmit={event => {
    event.preventDefault();
    if (!onCreate({ name, phase })) setError('Controlla il nome: potrebbe essere già utilizzato.');
  }}>
    <Field label="Nome della collezione"><input data-autofocus required maxLength={80} pattern=".*\S.*" placeholder="Es. Primavera/Estate 2028" value={name} onChange={event => { setName(event.target.value); setError(''); }} /></Field>
    <Field label="Stato"><select value={phase} onChange={event => setPhase(event.target.value)}>{phases.map(item => <option key={item}>{item}</option>)}</select></Field>
    {error && <p className="dw-error" role="alert">{error}</p>}
    <div className="dw-dialog-actions"><Button onClick={onClose}>Annulla</Button><Button primary icon="plus" type="submit">Crea collezione</Button></div>
  </form></Dialog>;
}
