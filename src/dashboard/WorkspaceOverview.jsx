import React, { useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { styleLabel } from './productData.js';
import { modules } from '../modules.js';
import { Badge, Button, Card, Empty, Icon, Tabs } from './ui.jsx';
import { ProductPhoto } from './Media.jsx';
import { actorStyle, localDate } from './workspaceData.js';
import { sameActor } from './workspaceIdentity.js';
import './workspace-overview.css';

const dateLabel = value => value ? new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(new Date(value + 'T12:00:00')) : 'Senza scadenza';
const moduleLabel = id => id === 21 ? 'Panoramica del capo' : modules.find(item => item.id === id)?.title || 'Filiera';
const initials = name => name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('');
const stateLabel = item => item.passportPublished ? 'Passaporto pubblicato' : item.produced ? 'In produzione' : item.technical?.approvedId ? 'Sviluppo tecnico' : item.sketchFile ? 'Concept pronto' : 'Concept in bozza';
const stateTone = item => item.passportPublished || item.produced ? 'success' : item.technical?.approvedId ? 'info' : item.sketchFile ? 'violet' : '';

function eventTime(event) {
  if (event.at) return Date.parse(event.at);
  const parts = event.time.match(/(\d+)\s+(\w+)\s*·\s*(\d+):(\d+)/);
  const month = { gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5, lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11 };
  return parts && month[parts[2]] != null ? new Date(new Date().getFullYear(), month[parts[2]], Number(parts[1]), Number(parts[3]), Number(parts[4])).getTime() : 0;
}
function eventsOf(items) {
  return items.flatMap(item => item.events.map(event => ({ ...event, styleId: item.styleId, productId: item.productId || item.styleId, styleTitle: styleLabel(item) }))).sort((a, b) => eventTime(b) - eventTime(a));
}
function EventRows({ events, onOpenModule }) {
  return <div className="dw-workspace-events">{events.map(event => <div className="dw-workspace-event" key={`${event.styleId}-${event.id}`}>
    <span className="dw-workspace-avatar" style={actorStyle(event.actor)} aria-label={event.actor?.name || 'WEAVE'}>{initials(event.actor?.name || 'WEAVE')}</span>
    <div><div className="dw-workspace-event-head"><strong>{event.actor?.name || 'WEAVE'}</strong><time>{event.time}</time></div><p>{event.text}</p><button type="button" onClick={() => onOpenModule(event.styleId, event.module)}>{event.styleTitle}<span>·</span>{moduleLabel(event.module)}</button></div>
  </div>)}</div>;
}

export default function WorkspaceHome({ onOpenPage, onOpenModule, onCreate }) {
  const { data, products, workspaceItems, tasks, inbox, updateTask } = useDemo();
  const [taskView, setTaskView] = useState('Prossime');
  const today = localDate();
  const mine = tasks.filter(task => sameActor(task.assignee, data.profile));
  const open = mine.filter(task => task.status !== 'Completata');
  const overdue = open.filter(task => task.due && task.due < today);
  const done = mine.filter(task => task.status === 'Completata');
  const lists = { Prossime: open.filter(task => !task.due || task.due >= today), 'In ritardo': overdue, Completate: done };
  const ordered = list => [...list].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  const unread = inbox.filter(item => !item.read).length;
  const recent = eventsOf(workspaceItems).slice(0, 4);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const date = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const styleName = id => styleLabel(workspaceItems.find(item => item.styleId === id)) || id;
  return <div className="dw-workspace-home">
    <header className="dw-workspace-page-head"><div><h2>{greeting}, {data.profile.firstName}</h2><p>{date} · Il lavoro di oggi in Atelier.</p></div><Button primary icon="plus" onClick={onCreate}>Nuovo capo</Button></header>
    <div className="dw-home-metrics" aria-label="Riepilogo Atelier">
      {[
        ['Capi', products.length, 'Nella collezione e in sviluppo', 'shirt', 'capi', 'violet'],
        ['Le mie attività', open.length, `${mine.length} incarichi assegnati a te`, 'list', 'my-tasks', 'blue'],
        ['Inbox', unread, 'Aggiornamenti da leggere', 'inbox', 'inbox', 'teal'],
        ['In ritardo', overdue.length, overdue.length ? 'Incarichi da riprendere' : 'Scadenze sotto controllo', 'clock', 'my-tasks', 'red'],
      ].map(([label, value, note, icon, target, tone]) => <button key={label} type="button" data-tone={tone} onClick={() => onOpenPage(target)}><span className="dw-home-metric-label"><Icon name={icon} size={14} />{label}</span><strong>{value}</strong><small>{note}</small></button>)}
    </div>
    <div className="dw-home-columns">
      <div className="dw-home-main">
        <Card flush title="Le mie attività" actions={<Button icon="arrow" onClick={() => onOpenPage('my-tasks')}>Tutte</Button>}>
          <div className="dw-workspace-task-tabs"><Tabs items={['Prossime', 'In ritardo', 'Completate']} selected={taskView} onChange={setTaskView} label="Attività personali" /></div>
          {ordered(lists[taskView]).slice(0, 5).map(task => <div className="dw-workspace-task" key={task.id}>
            <input type="checkbox" aria-label={`Completa ${task.title}`} checked={task.status === 'Completata'} onChange={event => updateTask(task.id, { status: event.target.checked ? 'Completata' : 'Da fare' })} />
            <button type="button" onClick={() => onOpenModule(task.styleId, task.moduleId)}><strong>{task.title}</strong><small>{styleName(task.styleId)} · {moduleLabel(task.moduleId)}</small></button>
            <time className={task.status !== 'Completata' && task.due && task.due < today ? 'dw-workspace-late' : ''}>{task.due === today ? 'Oggi' : dateLabel(task.due)}</time>
          </div>)}
          {!lists[taskView].length && <Empty>{taskView === 'In ritardo' ? 'Nessun incarico in ritardo.' : 'Nessun incarico in questa vista.'}</Empty>}
        </Card>
        <Card flush title="Capi in Atelier" actions={<Button onClick={() => onOpenPage('capi')}>Tutti i capi</Button>}>
          <div className="dw-table-wrap"><table className="dw-table dw-workspace-portfolio"><thead><tr><th>Capo</th><th>Fase attuale</th><th>Produzione</th><th>Consegna</th></tr></thead><tbody>{products.map(item => <tr key={item.styleId}>
            <td><button type="button" className="dw-workspace-style-link" onClick={() => onOpenModule(item.styleId, 21)}><span className="dw-style-card-photo"><ProductPhoto product={item} sizes="40px" alt="" /></span><span><strong>{item.title}</strong><small className="dw-code">{item.productId}{item.variants.length > 1 && ` · ${item.variants.length} varianti`}</small></span></button></td>
            <td><Badge tone={stateTone(item)}>{stateLabel(item)}</Badge></td><td>{item.totalProduced} / {item.totalQuantity}</td><td>{dateLabel(item.delivery)}</td>
          </tr>)}</tbody></table></div>
        </Card>
      </div>
      <div className="dw-home-side">
        <Card flush title="Scadenze" actions={<Button onClick={() => onOpenPage('my-tasks')}>Vedi tutte</Button>}>
          {ordered(open.filter(task => task.due)).slice(0, 5).map(task => <button type="button" className="dw-workspace-deadline" key={task.id} onClick={() => onOpenModule(task.styleId, task.moduleId)}><span><strong>{task.title}</strong><small>{styleName(task.styleId)}</small></span><time className={task.due < today ? 'dw-workspace-late' : ''}>{task.due === today ? 'Oggi' : dateLabel(task.due)}</time></button>)}
          {!open.some(task => task.due) && <Empty>Nessuna scadenza aperta.</Empty>}
        </Card>
        <Card flush title="Attività recente" actions={<Button onClick={() => onOpenPage('activity')}>Vedi tutte</Button>}><EventRows events={recent} onOpenModule={onOpenModule} /></Card>
      </div>
    </div>
    <p className="dw-workspace-session">Incarichi e conversazioni dimostrativi · i dati vengono salvati su questo dispositivo.</p>
  </div>;
}

export function WorkspaceActivityPage({ onOpenModule }) {
  const { products, workspaceItems } = useDemo();
  const [styleId, setStyleId] = useState('all');
  const [limit, setLimit] = useState(12);
  const events = eventsOf(workspaceItems).filter(event => styleId === 'all' || event.productId === styleId);
  return <div className="dw-workspace-activity">
    <header className="dw-workspace-page-head"><div><h2>Attività della filiera</h2><p>Modifiche e decisioni sui capi di Atelier.</p></div><select aria-label="Filtra attività per capo" value={styleId} onChange={event => { setStyleId(event.target.value); setLimit(12); }}><option value="all">Tutti i capi</option>{products.map(item => <option value={item.productId} key={item.productId}>{item.title}</option>)}</select></header>
    <EventRows events={events.slice(0, limit)} onOpenModule={onOpenModule} />
    {!events.length && <Empty>Nessuna attività registrata per questo capo.</Empty>}
    {events.length > limit && <Button onClick={() => setLimit(count => count + 12)}>Mostra altre attività</Button>}
    <p className="dw-workspace-session">Gli eventi iniziali sono esempi demo; le azioni nei moduli aggiornano questo registro.</p>
  </div>;
}
