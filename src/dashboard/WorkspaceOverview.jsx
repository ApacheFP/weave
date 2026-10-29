import React, { useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { productWorkflow, styleLabel } from './productData.js';
import { modules } from '../modules.js';
import { Button, Card, Empty, Icon, Progress, Tabs } from './ui.jsx';
import { euro, number, totals } from './domain.js';
import { actorStyle, localDate } from './workspaceData.js';
import { sameActor } from './workspaceIdentity.js';
import './workspace-overview.css';

const dateLabel = value => value ? new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(new Date(value + 'T12:00:00')) : 'Senza scadenza';
const moduleLabel = id => id === 21 ? 'Panoramica del capo' : modules.find(item => item.id === id)?.title || 'Filiera';
const initials = name => name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('');
const expenseColors = { materials: 'var(--blue)', labor: 'var(--violet)', logistics: 'var(--amber)' };
const FORECAST_WIDTH = 620;
const FORECAST_HEIGHT = 260;
const FORECAST_PLOT = { left: 60, right: 608, top: 12, bottom: 222 };
const DAY_MS = 86_400_000;
const expenseCells = Array.from({ length: 120 }, (_, index) => {
  const row = Math.floor(index / 12);
  const column = index % 12;
  const x = 1 + column * 28 + (row % 2 ? 14 : 0);
  const y = 1 + row * 24;
  return { x, y, centerX: x + 14, centerY: y + 16 };
}).sort((a, b) => Math.hypot(a.centerX - 176, a.centerY - 124) - Math.hypot(b.centerX - 176, b.centerY - 124));

function expenseShares(values, slots) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return values.map(() => 0);
  const exact = values.map(value => value / total * slots);
  const whole = exact.map(Math.floor);
  let remaining = slots - whole.reduce((sum, value) => sum + value, 0);
  exact.map((value, index) => ({ index, remainder: value - whole[index] }))
    .sort((a, b) => b.remainder - a.remainder)
    .forEach(({ index }) => { if (remaining-- > 0) whole[index]++; });
  return whole;
}

function projectedShare({ start, end }, day) {
  return end > start ? Math.max(0, Math.min(1, (day - start) / (end - start))) : day >= end ? 1 : 0;
}

function compactEuro(value) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 0 }).format(value);
}

function AtelierCostForecast({ items }) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(null);
  const id = React.useId().replace(/:/g, '');
  const planned = items.map(item => ({ amount: totals(item).cost * item.quantity, start: Date.parse(`${item.start}T00:00:00Z`), end: Date.parse(`${item.end}T00:00:00Z`) }));
  const start = Math.min(...planned.map(row => row.start));
  const end = Math.max(...planned.map(row => row.end));
  const span = Math.max(0, end - start);
  const data = Array.from({ length: 9 }, (_, index) => {
    const day = start + Math.round(span * index / 8);
    return { date: new Date(day).toISOString().slice(0, 10), value: planned.reduce((sum, row) => sum + row.amount * projectedShare(row, day), 0) };
  });
  const total = planned.reduce((sum, row) => sum + row.amount, 0);
  const today = new Date();
  const todayStart = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const nextMonth = todayStart + 30 * DAY_MS;
  const upcoming = planned.reduce((sum, row) => sum + row.amount * Math.max(0, projectedShare(row, nextMonth) - projectedShare(row, todayStart)), 0);
  const max = Math.max(...data.map(point => point.value), 1);
  const exponent = 10 ** Math.floor(Math.log10(max));
  const factor = [1, 2, 5, 10].find(value => value * exponent >= max) || 10;
  const ceiling = factor * exponent;
  const plotWidth = FORECAST_PLOT.right - FORECAST_PLOT.left;
  const plotHeight = FORECAST_PLOT.bottom - FORECAST_PLOT.top;
  const points = data.map((point, index) => ({ ...point, x: FORECAST_PLOT.left + plotWidth * index / (data.length - 1), y: FORECAST_PLOT.bottom - point.value / ceiling * plotHeight }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ');
  const area = `${line} L${FORECAST_PLOT.right} ${FORECAST_PLOT.bottom} L${FORECAST_PLOT.left} ${FORECAST_PLOT.bottom} Z`;
  const active = points[hovered ?? selected];
  const axisDate = value => new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
  const indexAt = event => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / (box.width || 1) * FORECAST_WIDTH;
    return Math.min(data.length - 1, Math.max(0, Math.round((x - FORECAST_PLOT.left) / plotWidth * (data.length - 1))));
  };
  const move = event => setHovered(indexAt(event));
  const keyDown = event => {
    const next = { ArrowRight: selected + 1, ArrowUp: selected + 1, ArrowLeft: selected - 1, ArrowDown: selected - 1, Home: 0, End: data.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setHovered(null);
    setSelected(Math.min(data.length - 1, Math.max(0, next)));
  };

  return <Card className="dw-workspace-cost-forecast" title="Andamento dei costi stimati" note="Tutti i capi · proiezione lineare sulle date di produzione">
    <div className="dw-workspace-forecast-totals">
      <div><span>Costo pianificato</span><strong>{euro(total)}</strong></div>
      <i aria-hidden="true" />
      <div><span>Prossimi 30 giorni</span><strong>{euro(upcoming)}</strong></div>
    </div>
    <p className="dw-workspace-forecast-reading"><span>{axisDate(active.date)}</span><strong>{euro(active.value)} cumulativi previsti</strong></p>
    <div className="dw-workspace-forecast-plot" role="slider" tabIndex={0} aria-label="Costi cumulativi previsti dell’Atelier" aria-valuemin={0} aria-valuemax={ceiling} aria-valuenow={Math.round(active.value)} aria-valuetext={`${axisDate(active.date)}: ${euro(active.value)} cumulativi previsti`} onPointerMove={move} onPointerLeave={() => setHovered(null)} onPointerUp={event => setSelected(indexAt(event))} onKeyDown={keyDown}>
      <svg aria-hidden="true" viewBox={`0 0 ${FORECAST_WIDTH} ${FORECAST_HEIGHT}`}>
        <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--blue)" stopOpacity=".24" /><stop offset="1" stopColor="var(--blue)" stopOpacity="0" /></linearGradient></defs>
        {Array.from({ length: 5 }, (_, index) => {
          const value = ceiling * index / 4;
          const y = FORECAST_PLOT.bottom - plotHeight * index / 4;
          return <g key={index}><line x1={FORECAST_PLOT.left} x2={FORECAST_PLOT.right} y1={y} y2={y} className="dw-workspace-forecast-grid" /><text x={FORECAST_PLOT.left - 8} y={y + 3} textAnchor="end" className="dw-workspace-forecast-axis">{compactEuro(value)}</text></g>;
        })}
        <path d={area} fill={`url(#${id}-area)`} />
        <path d={line} fill="none" className="dw-workspace-forecast-line" />
        {points.filter((_, index) => index % 2 === 0 || index === points.length - 1).map(point => <text key={point.date} x={point.x} y={FORECAST_HEIGHT - 6} textAnchor="middle" className="dw-workspace-forecast-axis">{axisDate(point.date)}</text>)}
        <line x1={active.x} x2={active.x} y1={FORECAST_PLOT.top} y2={FORECAST_PLOT.bottom} className="dw-workspace-forecast-cursor" />
        <circle cx={active.x} cy={active.y} r="5" className="dw-workspace-forecast-point" />
      </svg>
    </div>
  </Card>;
}

function AtelierExpensesChart({ items }) {
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const aggregate = items.reduce((sum, item) => {
    const cost = totals(item);
    return {
      garments: sum.garments + item.quantity,
      materials: sum.materials + cost.materials * item.quantity,
      labor: sum.labor + cost.labor * item.quantity,
      logistics: sum.logistics + item.logisticsCost * item.quantity,
    };
  }, { garments: 0, materials: 0, labor: 0, logistics: 0 });
  const categories = [
    { id: 'materials', label: 'Materiali', value: aggregate.materials },
    { id: 'labor', label: 'Lavorazione', value: aggregate.labor },
    { id: 'logistics', label: 'Logistica', value: aggregate.logistics },
  ];
  const total = categories.reduce((sum, category) => sum + category.value, 0);
  const counts = expenseShares(categories.map(category => category.value), expenseCells.length);
  const owners = categories.flatMap((category, index) => Array(counts[index]).fill(category.id));
  const highlighted = preview || selected;
  const summary = categories.map(category => `${category.label}: ${euro(category.value)} (${total ? Math.round(category.value / total * 100) : 0}%)`).join(', ');

  return <Card className="dw-workspace-expenses" title="Spese stimate per tutti i capi" note={`${number(items.length)} varianti · ${number(aggregate.garments)} capi pianificati`}>
    <div className="dw-workspace-expense-total"><span>Totale stimato</span><strong>{euro(total)}</strong><small>Costi unitari × quantità pianificate</small></div>
    <svg className="dw-workspace-expense-chart" viewBox="0 0 352 250" role="img" aria-label={`Composizione dei costi stimati dell’Atelier. ${summary}`}>
      {expenseCells.map((cell, index) => {
        const owner = owners[index];
        const category = categories.find(item => item.id === owner);
        const { x, y } = cell;
        const outer = `M${x + 14} ${y}L${x + 27} ${y + 8}V${y + 24}L${x + 14} ${y + 32}L${x + 1} ${y + 24}V${y + 8}Z`;
        const inner = `M${x + 14} ${y + 1.2}L${x + 25.8} ${y + 8.5}V${y + 23.5}L${x + 14} ${y + 30.8}L${x + 2.2} ${y + 23.5}V${y + 8.5}Z`;
        return <g key={`${x}-${y}`} style={{ opacity: highlighted && highlighted !== owner ? .28 : 1 }}>
          <path d={outer} fill="var(--surface)" />
          <path d={inner} fill={category ? expenseColors[category.id] : 'var(--surface-3)'} opacity={category ? .65 + (index % 4) * .1 : .75} />
        </g>;
      })}
    </svg>
    <div className="dw-workspace-expense-legend" role="group" aria-label="Costi per categoria">
      {categories.map(category => {
        const percent = total ? Math.round(category.value / total * 100) : 0;
        return <button type="button" key={category.id} aria-pressed={selected === category.id} onClick={() => setSelected(value => value === category.id ? null : category.id)} onPointerEnter={event => event.pointerType === 'mouse' && setPreview(category.id)} onPointerLeave={event => event.pointerType === 'mouse' && setPreview(null)}>
          <span className="dw-workspace-expense-label"><i style={{ background: expenseColors[category.id] }} />{category.label}</span>
          <strong>{euro(category.value)}</strong><small>{percent}%</small>
        </button>;
      })}
    </div>
  </Card>;
}

function eventTime(event) {
  if (event.at) return Date.parse(event.at);
  const parts = event.time.match(/(\d+)\s+(\w+)\s*·\s*(\d+):(\d+)/);
  const month = { gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5, lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11 };
  return parts && month[parts[2]] != null ? new Date(new Date().getFullYear(), month[parts[2]], Number(parts[1]), Number(parts[3]), Number(parts[4])).getTime() : 0;
}
function eventsOf(items) {
  return items.flatMap(item => item.events.map(event => ({ ...event, styleId: item.styleId, productId: item.productId || item.styleId, styleTitle: styleLabel(item) }))).sort((a, b) => eventTime(b) - eventTime(a));
}
function EventRows({ events, profile, onOpenModule }) {
  return <div className="dw-workspace-events">{events.map(event => <div className="dw-workspace-event" key={`${event.styleId}-${event.id}`}>
    <span className="dw-workspace-avatar" style={actorStyle(event.actor)} aria-label={event.actor?.name || 'WEAVE'}>{sameActor(event.actor, profile) ? <img src={profile.avatar || '/illustrations/profile-avatar.webp'} alt="" /> : initials(event.actor?.name || 'WEAVE')}</span>
    <div><div className="dw-workspace-event-head"><strong>{event.actor?.name || 'WEAVE'}</strong><time>{event.time}</time></div><p>{event.text}</p><button type="button" onClick={() => onOpenModule(event.styleId, event.module)}>{event.styleTitle}<span>·</span>{moduleLabel(event.module)}</button></div>
  </div>)}</div>;
}

export default function WorkspaceHome({ onOpenPage, onOpenModule, onCreate }) {
  const { data, products, workspaceItems, workspaceCollections, tasks, inbox, updateTask } = useDemo();
  const [taskView, setTaskView] = useState('Prossime');
  const today = localDate();
  const mine = tasks.filter(task => sameActor(task.assignee, data.profile));
  const open = mine.filter(task => task.status !== 'Completata');
  const overdue = open.filter(task => task.due && task.due < today);
  const done = mine.filter(task => task.status === 'Completata');
  const lists = { Prossime: open.filter(task => !task.due || task.due >= today), 'In ritardo': overdue, Completate: done };
  const ordered = list => [...list].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  const unreadMessages = [...inbox].filter(item => !item.read).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const unread = unreadMessages.length;
  const recentNotices = unreadMessages.slice(0, 4);
  const recent = eventsOf(workspaceItems).slice(0, 4);
  const collectionNames = [...new Set([...Object.keys(workspaceCollections), ...workspaceItems.map(item => item.collection)])].sort((a, b) => a.localeCompare(b, 'it-IT'));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const date = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const styleName = id => styleLabel(workspaceItems.find(item => item.styleId === id)) || id;
  return <div className="dw-workspace-home">
    <header className="dw-workspace-page-head"><div><h2>{greeting}, {data.profile.firstName}</h2><p>{date} · Il lavoro di oggi in Atelier.</p></div><Button primary icon="plus" onClick={onCreate}>Nuovo capo</Button></header>
    <div className="dw-home-metrics" aria-label="Riepilogo Atelier">
      {[
        ['Varianti', workspaceItems.length, `${products.length} modelli in sviluppo`, 'shirt', 'capi', 'violet'],
        ['Le mie attività', open.length, `${mine.length} incarichi assegnati a te`, 'list', 'my-tasks', 'blue'],
        ['Inbox', unread, 'Aggiornamenti da leggere', 'inbox', 'inbox', 'teal'],
        ['In ritardo', overdue.length, overdue.length ? 'Incarichi da riprendere' : 'Scadenze sotto controllo', 'clock', 'my-tasks', 'red'],
      ].map(([label, value, note, icon, target, tone]) => <button key={label} type="button" data-tone={tone} onClick={() => onOpenPage(target)}><span className="dw-home-metric-label"><Icon name={icon} size={14} />{label}</span><strong>{value}</strong><small>{note}</small></button>)}
    </div>
    <div className="dw-home-columns">
      <div className="dw-home-main">
        <AtelierCostForecast items={workspaceItems} />
        <AtelierExpensesChart items={workspaceItems} />
        <Card flush title="Le mie attività" actions={<Button icon="arrow" onClick={() => onOpenPage('my-tasks')}>Tutte</Button>}>
          <div className="dw-workspace-task-tabs"><Tabs items={['Prossime', 'In ritardo', 'Completate']} selected={taskView} onChange={setTaskView} label="Attività personali" /></div>
          {ordered(lists[taskView]).slice(0, 5).map(task => <div className="dw-workspace-task" key={task.id}>
            <input type="checkbox" aria-label={`Completa ${task.title}`} checked={task.status === 'Completata'} onChange={event => updateTask(task.id, { status: event.target.checked ? 'Completata' : 'Da fare' })} />
            <button type="button" onClick={() => onOpenModule(task.styleId, task.moduleId)}><strong>{task.title}</strong><small>{styleName(task.styleId)} · {moduleLabel(task.moduleId)}</small></button>
            <time className={task.status !== 'Completata' && task.due && task.due < today ? 'dw-workspace-late' : ''}>{task.due === today ? 'Oggi' : dateLabel(task.due)}</time>
          </div>)}
          {!lists[taskView].length && <Empty>{taskView === 'In ritardo' ? 'Nessun incarico in ritardo.' : 'Nessun incarico in questa vista.'}</Empty>}
        </Card>
        <Card flush title="Avanzamento dei capi" actions={<Button onClick={() => onOpenPage('capi')}>Tutti i capi</Button>}>
          <div className="dw-workspace-products">{workspaceItems.map(item => {
            const workflow = productWorkflow(item);
            return <button type="button" className="dw-workspace-product" key={item.styleId} onClick={() => onOpenModule(item.styleId, 21)}>
              <span className="dw-workspace-product-name"><strong>{item.title}</strong><small>{item.variant} · {item.styleId}</small></span>
              <span className="dw-workspace-product-stage" data-phase={workflow.phases.find(phase => phase.state === 'active')?.state || 'pending'}>{workflow.stageLabel}</span>
              <Progress value={workflow.percent} label={`${item.title} ${item.variant}: ${workflow.complete} di ${workflow.total} fasi completate`} />
              <Icon name="arrow" size={13} />
            </button>;
          })}</div>
        </Card>
        <Card flush title="Collezioni in Atelier" actions={<Button onClick={() => onOpenPage('collections')}>Tutte le collezioni</Button>}>
          <div className="dw-table-wrap"><table className="dw-table"><thead><tr><th>Collezione</th><th>Capi associati</th></tr></thead><tbody>{collectionNames.map(name => <tr key={name}>
            <td><strong>{name}</strong></td><td>{workspaceItems.filter(item => item.collection === name).length}</td>
          </tr>)}</tbody></table></div>
        </Card>
      </div>
      <div className="dw-home-side">
        <Card flush title="Scadenze" actions={<Button onClick={() => onOpenPage('my-tasks')}>Vedi tutte</Button>}>
          {ordered(open.filter(task => task.due)).slice(0, 5).map(task => <button type="button" className="dw-workspace-deadline" key={task.id} onClick={() => onOpenModule(task.styleId, task.moduleId)}><span><strong>{task.title}</strong><small>{styleName(task.styleId)}</small></span><time className={task.due < today ? 'dw-workspace-late' : ''}>{task.due === today ? 'Oggi' : dateLabel(task.due)}</time></button>)}
          {!open.some(task => task.due) && <Empty>Nessuna scadenza aperta.</Empty>}
        </Card>
        <Card flush title="Notifiche da leggere" actions={<Button onClick={() => onOpenPage('notifications')}>Tutte</Button>}>
          <div className="dw-workspace-notices">{recentNotices.map(item => <button type="button" key={item.id} onClick={() => onOpenPage(`inbox?message=${encodeURIComponent(item.id)}`)}>
            <i aria-hidden="true" /><span><strong>{item.title}</strong><small>{styleName(item.styleId)} · {item.actor?.name || 'Team Atelier'} · {new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(item.at))}</small></span><Icon name="arrow" size={13} />
          </button>)}{!recentNotices.length && <Empty>Non ci sono notifiche da leggere.</Empty>}</div>
        </Card>
        <Card flush title="Attività recente" actions={<Button onClick={() => onOpenPage('activity')}>Vedi tutte</Button>}><EventRows events={recent} profile={data.profile} onOpenModule={onOpenModule} /></Card>
      </div>
    </div>
    <p className="dw-workspace-session">Incarichi e conversazioni dimostrativi · i dati vengono salvati su questo dispositivo.</p>
  </div>;
}

export function WorkspaceActivityPage({ onOpenModule }) {
  const { data, products, workspaceItems } = useDemo();
  const [styleId, setStyleId] = useState('all');
  const [limit, setLimit] = useState(12);
  const events = eventsOf(workspaceItems).filter(event => styleId === 'all' || event.productId === styleId);
  return <div className="dw-workspace-activity">
    <header className="dw-workspace-page-head"><div><h2>Attività della filiera</h2><p>Modifiche e decisioni sui capi di Atelier.</p></div><select aria-label="Filtra attività per capo" value={styleId} onChange={event => { setStyleId(event.target.value); setLimit(12); }}><option value="all">Tutti i capi</option>{products.map(item => <option value={item.productId} key={item.productId}>{item.title}</option>)}</select></header>
    <EventRows events={events.slice(0, limit)} profile={data.profile} onOpenModule={onOpenModule} />
    {!events.length && <Empty>Nessuna attività registrata per questo capo.</Empty>}
    {events.length > limit && <Button onClick={() => setLimit(count => count + 12)}>Mostra altre attività</Button>}
    <p className="dw-workspace-session">Gli eventi iniziali sono esempi demo; le azioni nei moduli aggiornano questo registro.</p>
  </div>;
}
