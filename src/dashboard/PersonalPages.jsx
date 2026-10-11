import React, { useEffect, useRef, useState } from 'react';
import { modules } from '../modules.js';
import { useDemo } from './DemoContext.jsx';
import { Button, Dialog, Field, Icon } from './ui.jsx';
import './personal-pages.css';

const categories = [
  ['all', 'Tutte'], ['mention', 'Menzioni'], ['assign', 'Assegnate'],
  ['comment', 'Commenti'], ['update', 'Novità'],
];
const taskStatuses = ['Da fare', 'In corso', 'Completata'];
const taskModuleIds = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 19, 21, 22];
const moduleName = id => id === 21 ? 'Panoramica del capo' : id === 22 ? 'Assistente' : modules.find(item => item.id === Number(id))?.title || 'Modulo';
const actorName = actor => actor?.name || 'Team Atelier';
const fullDate = value => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parsed);
};
const ago = value => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 1) return 'Ora';
  if (minutes < 60) return `${minutes} min fa`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h fa`;
  return `${Math.floor(minutes / 1440)} g fa`;
};
const summaryTitle = item => {
  const first = actorName(item.actor).split(' ')[0];
  return item.title.startsWith(`${first} `) ? item.title.slice(first.length + 1) : item.title;
};
const dayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};
const shortDate = value => {
  if (!value) return 'Da definire';
  if (value === dayKey()) return 'Oggi';
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'Da definire' : new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', ...(parsed.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }).format(parsed);
};

function Avatar({ actor }) {
  const { data } = useDemo();
  const name = actorName(actor);
  const colors = { 'marta@atelier.demo': 'var(--rose)', 'elena@atelier.demo': 'var(--blue)', 'luca@atelier.demo': 'var(--green)' };
  return <span className="dw-personal-avatar" style={{ '--actor-color': colors[actor?.email] || 'var(--violet)' }} aria-hidden="true">{actor?.email === data.profile.email ? <img src="/illustrations/profile-avatar.webp" alt="" /> : name.split(' ').filter(Boolean).map(word => word[0]).slice(0, 2).join('')}</span>;
}

export function InboxPage({ onOpenModule, initialSelectedId = null }) {
  const { workspaceItems, inbox, markInboxRead, markAllInboxRead, replyInbox } = useDemo();
  const [category, setCategory] = useState('Tutte');
  const [unread, setUnread] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState('');
  const [feedback, setFeedback] = useState('');
  const previewRef = useRef(null);
  const selected = inbox.find(item => item.id === selectedId);
  const categoryKey = categories.find(([, label]) => label === category)?.[0] || 'all';
  const visible = inbox.filter(item => (categoryKey === 'all' || item.type === categoryKey) && (!unread || !item.read)).sort((a, b) => new Date(b.at) - new Date(a.at));
  const unreadCount = inbox.filter(item => !item.read).length;
  const styleFor = id => workspaceItems.find(item => item.styleId === id);

  useEffect(() => { setReply(''); setFeedback(''); }, [selectedId]);
  useEffect(() => {
    if (!initialSelectedId) { setSelectedId(null); return; }
    if (inbox.some(item => item.id === initialSelectedId)) { setSelectedId(initialSelectedId); markInboxRead(initialSelectedId); }
  }, [initialSelectedId]);
  const select = item => {
    setSelectedId(item.id);
    markInboxRead(item.id);
    requestAnimationFrame(() => previewRef.current?.focus());
  };
  const submitReply = event => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    if (replyInbox(selected.id, reply.trim()) !== false) {
      setReply('');
      setFeedback('Risposta salvata nella conversazione demo.');
    }
  };

  const categoryCount = key => inbox.filter(item => !item.read && (key === 'all' || item.type === key)).length;
  const moveCategory = event => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const current = categories.findIndex(([, label]) => label === category);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? categories.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + categories.length) % categories.length;
    event.preventDefault();
    setCategory(categories[next][1]);
    event.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
  };
  return <section className="dw-personal dw-inbox-page" aria-labelledby="dw-inbox-heading">
    <div className={`dw-inbox-workspace ${selected ? 'has-selection' : ''}`}>
      <div className="dw-inbox-master">
        <header className="dw-inbox-master-heading"><h2 id="dw-inbox-heading" title="Messaggi e conversazioni demo di Atelier">Inbox</h2><label className="dw-inbox-unread-toggle"><input type="checkbox" checked={unread} onChange={event => setUnread(event.target.checked)} />Da leggere</label><button type="button" className="dw-inbox-mark-all" disabled={!unreadCount} onClick={markAllInboxRead} aria-label="Segna tutto come letto" title="Segna tutto come letto"><Icon name="check" size={15} /></button></header>
        <div className="dw-inbox-categories" role="tablist" aria-label="Categorie dell’inbox" onKeyDown={moveCategory}>{categories.map(([key, label]) => <button key={key} type="button" role="tab" id={`dw-inbox-category-${key}`} aria-selected={category === label} aria-controls="dw-inbox-list" tabIndex={category === label ? 0 : -1} onClick={() => setCategory(label)}>{label}{categoryCount(key) > 0 && <span>{categoryCount(key)}</span>}</button>)}</div>
        <div className="dw-inbox-list" id="dw-inbox-list" role="tabpanel" aria-labelledby={`dw-inbox-category-${categoryKey}`}>
          {visible.map(item => {
            const style = styleFor(item.styleId);
            const authored = item.type !== 'update';
            return <div key={item.id} className={`dw-inbox-row ${selectedId === item.id ? 'selected' : ''}`}>
              {!item.read && <span className="dw-inbox-unread-dot" aria-label="Da leggere" />}
              <button type="button" className="dw-inbox-item" onClick={() => select(item)} aria-current={selectedId === item.id ? 'true' : undefined}>
                <Avatar actor={item.actor} /><span className="dw-inbox-item-copy"><span className="dw-inbox-item-title">{authored ? <><strong>{actorName(item.actor)}</strong> <span>{summaryTitle(item)}</span></> : <strong>{item.title}</strong>}</span><span className="dw-inbox-item-snippet">{item.body}</span><span className="dw-inbox-item-meta"><Icon name={item.type === 'comment' || item.type === 'mention' ? 'chat' : item.type === 'assign' ? 'user' : 'activity'} size={11} /><i /><span>{style?.title || item.styleId}</span><span>·</span><time dateTime={item.at} title={fullDate(item.at)}>{ago(item.at)}</time></span></span>
              </button>
              <button type="button" className="dw-inbox-read" aria-label={`${item.read ? 'Segna come da leggere' : 'Segna come letto'}: ${item.title}`} title={item.read ? 'Segna come da leggere' : 'Segna come letto'} onClick={() => markInboxRead(item.id, !item.read)}><Icon name={item.read ? 'inbox' : 'check'} size={13} /></button>
            </div>;
          })}
          {!visible.length && <div className="dw-inbox-list-empty"><Icon name="inbox" size={22} /><h3>Sei in pari.</h3><p>{unread ? 'Nessun messaggio da leggere in questa categoria.' : 'Menzioni, assegnazioni e commenti appariranno qui.'}</p></div>}
        </div>
      </div>
      <div className="dw-inbox-preview" ref={previewRef} tabIndex={-1} aria-label="Conversazione selezionata">
        {selected ? <>
          <header className="dw-inbox-preview-bar"><button type="button" className="dw-inbox-back" onClick={() => setSelectedId(null)} aria-label="Torna all’inbox"><Icon name="back" size={15} /></button><span className="dw-inbox-product-dot" /><span>{styleFor(selected.styleId)?.title || selected.styleId}</span><small>{selected.styleId}</small><Button icon="arrow" onClick={() => onOpenModule(selected.styleId, selected.moduleId)}>Apri modulo</Button></header>
          <div className="dw-inbox-conversation">
            <h3>{selected.title}</h3><p className="dw-inbox-conversation-module">{moduleName(selected.moduleId)}</p>
            <article className="dw-inbox-message"><Avatar actor={selected.actor} /><div><div className="dw-inbox-message-meta"><strong>{actorName(selected.actor)}</strong><time dateTime={selected.at}>{fullDate(selected.at)}</time></div><p>{selected.body}</p></div></article>
            {(selected.replies || []).map(item => <article key={item.id} className="dw-inbox-message"><Avatar actor={item.actor} /><div><div className="dw-inbox-message-meta"><strong>{actorName(item.actor)}</strong><time dateTime={item.at}>{fullDate(item.at)}</time></div><p>{item.body}</p></div></article>)}
            <form className="dw-inbox-composer" onSubmit={submitReply}>
              <Field label="Rispondi alla conversazione"><textarea value={reply} maxLength={2000} rows={3} placeholder="Rispondi…" onChange={event => { setReply(event.target.value); setFeedback(''); }} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); submitReply(event); } }} /></Field>
              <div><span>Risposta demo · salvata nella sessione</span><Button type="submit" primary disabled={!reply.trim()}>Rispondi</Button></div>
              <p className="dw-inbox-feedback" role="status">{feedback}</p>
            </form>
          </div>
        </> : <div className="dw-inbox-start"><Icon name="inbox" size={20} /><h3>Seleziona un messaggio</h3><p>Leggi la conversazione e rispondi senza uscire dall’inbox.</p></div>}
      </div>
    </div>
  </section>;
}

export function CreateTaskDialog({ onClose, initialDue = '', initialStatus = 'Da fare' }) {
  const { data, workspaceItems, createTask } = useDemo();
  const [title, setTitle] = useState('');
  const [styleId, setStyleId] = useState(data.styleId);
  const [moduleId, setModuleId] = useState(1);
  const [due, setDue] = useState(initialDue);
  const [priority, setPriority] = useState('Media');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const create = event => {
    event.preventDefault();
    if (!title.trim()) { setError('Inserisci il nome dell’attività.'); return; }
    if (!workspaceItems.some(item => item.styleId === styleId) || !taskModuleIds.includes(Number(moduleId))) { setError('Seleziona un capo e un modulo disponibili.'); return; }
    if (createTask({ title: title.trim(), styleId, moduleId: Number(moduleId), due, priority, note: note.trim(), status: initialStatus }) === false) { setError('L’attività non è stata creata. Controlla i dati.'); return; }
    onClose();
  };
  return <Dialog title="Nuova attività" note="Assegnata a te, collegata a un capo e a un modulo." onClose={onClose}>
    <form className="dw-new-task-form" onSubmit={create}>
      <Field label="Attività"><input data-autofocus required maxLength={120} value={title} onChange={event => { setTitle(event.target.value); setError(''); }} placeholder="Es. Rivedere le misure del campione" /></Field>
      <div className="dw-new-task-pair"><Field label="Capo"><select value={styleId} onChange={event => setStyleId(event.target.value)}>{workspaceItems.map(item => <option key={item.styleId} value={item.styleId}>{item.title} · {item.styleId}</option>)}</select></Field><Field label="Modulo"><select value={moduleId} onChange={event => setModuleId(Number(event.target.value))}>{taskModuleIds.map(id => <option key={id} value={id}>{moduleName(id)}</option>)}</select></Field></div>
      <div className="dw-new-task-pair"><Field label="Scadenza" hint="Facoltativa"><input type="date" value={due} onChange={event => setDue(event.target.value)} /></Field><Field label="Priorità"><select value={priority} onChange={event => setPriority(event.target.value)}>{['Alta', 'Media', 'Bassa'].map(item => <option key={item}>{item}</option>)}</select></Field></div>
      <Field label="Note" hint="Facoltative"><textarea rows={3} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} placeholder="Indicazioni per svolgere l’attività" /></Field>
      {error && <p className="dw-error" role="alert">{error}</p>}
      <div className="dw-dialog-actions"><Button onClick={onClose}>Annulla</Button><Button type="submit" primary icon="plus">Crea attività</Button></div>
    </form>
  </Dialog>;
}

const taskKey = item => item.key || `ACT-${/task-(\d+)$/.test(item.id) ? item.id.match(/task-(\d+)$/)[1].padStart(3, '0') : item.id.slice(-6).toUpperCase()}`;
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function TasksCalendar({ items, onOpenModule, onAdd, styleFor }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const startOffset = (month.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startOffset + totalDays) / 7) * 7 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - startOffset + 1));
  const monthTitle = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(month);
  return <div className="dw-tasks-calendar">
    <header className="dw-calendar-heading"><h3>{monthTitle}</h3><div><button type="button" aria-label="Mese precedente" onClick={() => setMonth(value => new Date(value.getFullYear(), value.getMonth() - 1, 1))}><Icon name="back" size={15} /></button><Button onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Oggi</Button><button type="button" aria-label="Mese successivo" onClick={() => setMonth(value => new Date(value.getFullYear(), value.getMonth() + 1, 1))}><Icon name="back" size={15} /></button></div></header>
    <div className="dw-calendar-scroll"><div className="dw-calendar-week">{['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => <span key={day}>{day}</span>)}</div><div className="dw-calendar-grid">{cells.map(date => {
      const key = dateKey(date);
      return <section key={key} className={`dw-calendar-day ${date.getMonth() !== month.getMonth() ? 'outside' : ''} ${key === dayKey() ? 'today' : ''}`} aria-label={new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' }).format(date)}><span className="dw-calendar-day-number">{date.getDate()}</span><button type="button" className="dw-calendar-add" aria-label={`Nuova attività per ${shortDate(key)}`} onClick={() => onAdd(key)}><Icon name="plus" size={13} /></button>{items.filter(item => item.due === key).map(item => <button key={item.id} type="button" className={`dw-calendar-task ${item.status === 'Completata' ? 'completed' : ''}`} title={`${item.title} · ${styleFor(item.styleId)?.title || item.styleId}`} onClick={() => onOpenModule(item.styleId, item.moduleId)}><span className="dw-task-status-dot" data-status={item.status} /><span>{item.title}</span></button>)}</section>;
    })}</div></div>
    {items.some(item => !item.due) && <p className="dw-calendar-undated">{items.filter(item => !item.due).length} attività senza scadenza sono disponibili nella vista Lista.</p>}
  </div>;
}

export function MyTasksPage({ onOpenModule }) {
  const { data, workspaceItems, tasks, updateTask } = useDemo();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Tutte');
  const [style, setStyle] = useState('all');
  const [sort, setSort] = useState('due');
  const [view, setView] = useState('Lista');
  const [create, setCreate] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({ completed: true });
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const today = dayKey();
  const yesterday = new Date(`${today}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const mine = tasks.filter(item => item.assignee?.email === data.profile.email);
  const styleFor = id => workspaceItems.find(item => item.styleId === id);
  const text = query.trim().toLocaleLowerCase('it-IT');
  const visible = mine.filter(item => (style === 'all' || item.styleId === style) && (status === 'Tutte' || item.status === status) && (!text || `${item.title} ${item.note || ''} ${taskKey(item)} ${item.styleId} ${styleFor(item.styleId)?.title || ''} ${moduleName(item.moduleId)}`.toLocaleLowerCase('it-IT').includes(text))).sort((a, b) => {
    const byDue = (a.due || '9999').localeCompare(b.due || '9999');
    const ranks = { Alta: 0, Media: 1, Bassa: 2 };
    return sort === 'priority' ? (ranks[a.priority] ?? 1) - (ranks[b.priority] ?? 1) || byDue : sort === 'title' ? a.title.localeCompare(b.title, 'it-IT') : byDue;
  });
  const groups = [
    { id: 'overdue', title: 'In ritardo', icon: 'clock', items: visible.filter(item => item.status !== 'Completata' && item.due && item.due < today), due: dateKey(yesterday) },
    { id: 'today', title: 'Oggi', icon: 'calendar', items: visible.filter(item => item.status !== 'Completata' && item.due === today), due: today },
    { id: 'upcoming', title: 'Prossime', icon: 'calendar', items: visible.filter(item => item.status !== 'Completata' && (!item.due || item.due > today)), due: '' },
    { id: 'completed', title: 'Completate', icon: 'check', items: visible.filter(item => item.status === 'Completata'), due: '' },
  ];
  const overdueCount = mine.filter(item => item.status !== 'Completata' && item.due && item.due < today).length;
  const todayCount = mine.filter(item => item.status !== 'Completata' && item.due === today).length;
  const upcomingCount = mine.filter(item => item.status !== 'Completata' && (!item.due || item.due > today)).length;
  const filterCount = Number(status !== 'Tutte') + Number(style !== 'all');
  useEffect(() => {
    const dismiss = event => {
      if (!filterRef.current?.contains(event.target)) setFilterOpen(false);
      if (!sortRef.current?.contains(event.target)) setSortOpen(false);
    };
    const escape = event => { if (event.key === 'Escape') { setFilterOpen(false); setSortOpen(false); } };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, []);
  const add = group => setCreate({ due: group.due, status: group.id === 'completed' ? 'Completata' : 'Da fare' });
  return <section className="dw-personal dw-my-tasks" aria-labelledby="dw-my-tasks-heading">
    <header className="dw-personal-heading dw-task-page-heading"><div><h2 id="dw-my-tasks-heading">Le mie attività</h2><p>{todayCount} in scadenza oggi · {overdueCount} in ritardo · {upcomingCount} prossime</p></div><div className="dw-task-page-actions"><div className="dw-task-view" role="group" aria-label="Vista delle attività">{['Lista', 'Calendario'].map(item => <button type="button" key={item} aria-pressed={view === item} onClick={() => setView(item)}><Icon name={item === 'Lista' ? 'list' : 'calendar'} size={13} />{item}</button>)}</div><Button primary icon="plus" onClick={() => setCreate({ due: '', status: 'Da fare' })}>Nuova attività</Button></div></header>
    <div className="dw-personal-toolbar dw-task-page-toolbar"><label className="dw-personal-search"><Icon name="search" size={14} /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="Cerca nelle tue attività" placeholder="Cerca attività…" /></label>
      <div className="dw-task-popover-anchor" ref={filterRef}><button type="button" className="dw-task-toolbar-button" aria-expanded={filterOpen} onClick={() => { setFilterOpen(value => !value); setSortOpen(false); }}><Icon name="filter" size={13} />Filtra{filterCount > 0 && <span>{filterCount}</span>}</button>{filterOpen && <div className="dw-task-toolbar-popover"><Field label="Stato"><select value={status} onChange={event => { setStatus(event.target.value); if (event.target.value === 'Completata') setCollapsed(previous => ({ ...previous, completed: false })); }}><option>Tutte</option>{taskStatuses.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Capo"><select value={style} onChange={event => setStyle(event.target.value)}><option value="all">Tutti i capi</option>{workspaceItems.map(item => <option key={item.styleId} value={item.styleId}>{item.title}</option>)}</select></Field>{filterCount > 0 && <Button onClick={() => { setStatus('Tutte'); setStyle('all'); }}>Rimuovi filtri</Button>}</div>}</div>
      <div className="dw-task-popover-anchor" ref={sortRef}><button type="button" className="dw-task-toolbar-button" aria-expanded={sortOpen} onClick={() => { setSortOpen(value => !value); setFilterOpen(false); }}><Icon name="sort" size={13} />Ordina: {{ due: 'Scadenza', priority: 'Priorità', title: 'Nome' }[sort]}</button>{sortOpen && <div className="dw-task-toolbar-popover dw-task-sort-popover" role="group" aria-label="Ordine delle attività">{[['due', 'Scadenza'], ['priority', 'Priorità'], ['title', 'Nome']].map(([key, label]) => <button key={key} type="button" aria-pressed={sort === key} onClick={() => { setSort(key); setSortOpen(false); }}>{label}{sort === key && <Icon name="check" size={13} />}</button>)}</div>}</div>
    </div>
    {view === 'Calendario' ? <TasksCalendar items={visible} onOpenModule={onOpenModule} styleFor={styleFor} onAdd={due => setCreate({ due, status: 'Da fare' })} /> : <div className="dw-table-wrap dw-personal-task-wrap"><table className="dw-table dw-personal-task-table"><colgroup><col /><col style={{ width: 160 }} /><col style={{ width: 126 }} /><col style={{ width: 108 }} /><col style={{ width: 104 }} /></colgroup><thead><tr><th scope="col">Attività</th><th scope="col">Capo</th><th scope="col">Stato</th><th scope="col">Priorità</th><th scope="col">Scadenza</th></tr></thead>
      {groups.map(group => <tbody key={group.id} data-group={group.id}>
        <tr className="dw-task-group-space" aria-hidden="true"><td colSpan={5} /></tr><tr className="dw-task-group"><th scope="rowgroup" colSpan={5}><div><button type="button" aria-expanded={!collapsed[group.id]} onClick={() => setCollapsed(previous => ({ ...previous, [group.id]: !previous[group.id] }))}><span className="dw-task-group-chevron" data-open={!collapsed[group.id]}><Icon name="back" size={13} /></span><Icon name={group.icon} size={14} /><span>{group.title}</span><span className="dw-personal-count">{group.items.length}</span></button><button type="button" className="dw-task-group-add" aria-label={`Aggiungi attività a ${group.title}`} onClick={() => add(group)}><Icon name="plus" size={13} /></button></div></th></tr>
        {!collapsed[group.id] && group.items.map(item => <tr key={item.id} className={item.status === 'Completata' ? 'dw-task-completed' : ''}>
          <td><div className="dw-task-title-cell"><label className="dw-task-complete-control"><input type="checkbox" checked={item.status === 'Completata'} onChange={event => updateTask(item.id, { status: event.target.checked ? 'Completata' : 'Da fare' })} aria-label={`${item.status === 'Completata' ? 'Riapri' : 'Completa'} attività: ${item.title}`} /></label><button type="button" onClick={() => onOpenModule(item.styleId, item.moduleId)} title={`${moduleName(item.moduleId)}${item.note ? ` · ${item.note}` : ''}`}><span className="dw-task-key">{taskKey(item)}</span><strong>{item.title}</strong></button></div></td>
          <td><button type="button" className="dw-task-style-link" data-style={item.styleId} onClick={() => onOpenModule(item.styleId, 21)} title={item.styleId}><i /><span>{styleFor(item.styleId)?.title || item.styleId}</span></button></td>
          <td><span className="dw-task-status-cell"><span className="dw-task-status-dot" data-status={item.status} /><select value={item.status} onChange={event => updateTask(item.id, { status: event.target.value })} aria-label={`Stato di ${item.title}`}>{taskStatuses.map(value => <option key={value}>{value}</option>)}</select></span></td>
          <td><span className="dw-task-priority" data-priority={item.priority}><i />{item.priority}</span></td>
          <td><time className={item.status !== 'Completata' && item.due && item.due < today ? 'dw-task-overdue' : ''} dateTime={item.due || undefined} title={item.due || 'Scadenza non definita'}><Icon name="calendar" size={13} />{shortDate(item.due)}</time></td>
        </tr>)}
        {!collapsed[group.id] && <tr className="dw-task-add-row"><td colSpan={5}><button type="button" onClick={() => add(group)}><Icon name="plus" size={14} />Aggiungi attività</button></td></tr>}
      </tbody>)}
    </table></div>}
    {create && <CreateTaskDialog initialDue={create.due} initialStatus={create.status} onClose={() => setCreate(null)} />}
  </section>;
}
