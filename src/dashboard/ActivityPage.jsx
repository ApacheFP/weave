import React, { useState } from 'react';
import { modules } from '../modules.js';
import { useDemo } from './DemoContext.jsx';
import { Empty, Icon } from './ui.jsx';
import './activity.css';

export default function ActivityPage({ moduleId, onNavigate, onService }) {
  const { data } = useDemo();
  const [all, setAll] = useState(moduleId === 21);
  const [actor, setActor] = useState('all');
  const actors = [...new Map(data.events.map(event => [event.actor?.email || 'unknown', event.actor || { name: 'Utente non registrato', email: 'unknown' }])).values()];
  const events = data.events.filter(event => (all || event.module === moduleId) && (actor === 'all' || (event.actor?.email || 'unknown') === actor));
  const days = new Map();
  events.forEach(event => {
    const day = `${event.time.split(/[·,]/)[0].trim()}${event.demo ? ' · esempi demo' : ''}`;
    if (!days.has(day)) days.set(day, []);
    days.get(day).push(event);
  });
  return <section className="dw-activity-page" aria-labelledby="dw-activity-title">
    <header className="dw-activity-heading"><h2 id="dw-activity-title">Registro attività</h2><p>Modifiche e decisioni del team</p></header>
    <div className="dw-activity-filters"><label className="dw-check"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} />Tutta la filiera</label><label className="dw-activity-user">Utente<select aria-label="Filtra attività per utente" value={actor} onChange={e => setActor(e.target.value)}><option value="all">Tutti gli utenti</option>{actors.map(item => <option key={item.email} value={item.email}>{item.name}</option>)}</select></label><span>{events.length} attività</span></div>
    {[...days].map(([day, rows]) => <section className="dw-activity-day" key={day}><h3>{day}</h3><ol className="dw-activity-feed">{rows.map(event => {
      const name = event.actor?.name || 'Utente non registrato';
      const initials = name.split(' ').map(word => word[0]).slice(0, 2).join('');
      const module = event.module === 21 ? 'Home' : modules.find(item => item.id === event.module)?.title || 'Modulo';
      return <li key={event.id}><span className="dw-activity-avatar" aria-hidden="true">{event.actor?.email === 'demo@weave.it' ? <img src="/illustrations/profile-avatar.webp" alt="" /> : initials}</span><div className="dw-activity-entry"><div className="dw-activity-meta"><strong title={event.actor?.email}>{name}</strong><time>{event.time.split(/[·,]/).at(-1).trim()}</time></div><p>{event.text}</p><button className="dw-activity-module" onClick={() => [1,2,3,4,5,6,7,9,10,11,12,13,19,21,22].includes(event.module) ? onNavigate(event.module) : onService(event.module)}>{module}<Icon name="arrow" size={12} /></button></div></li>;
    })}</ol></section>)}
    {!events.length && <Empty>Nessuna attività per questo utente e questa vista.</Empty>}
  </section>;
}
