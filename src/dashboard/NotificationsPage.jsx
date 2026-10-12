import { styleLabel } from './productData.js';
import React, { useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { Icon } from './ui.jsx';
import { actorStyle } from './workspaceData.js';
import { sameActor } from './workspaceIdentity.js';
import './notifications.css';

const actorName = actor => actor?.name || 'Team Atelier';
const timestamp = value => new Date(value).getTime() || 0;
function relativeTime(value) {
  const parsed = timestamp(value);
  if (!parsed) return '';
  const minutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));
  if (minutes < 1) return 'Ora';
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h fa`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} g fa`;
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(new Date(parsed));
}
function dayBucket(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Precedenti';
  const now = new Date();
  const days = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  if (days >= 0) return 'Oggi';
  if (days === -1) return 'Ieri';
  if (days > -7) return 'Questa settimana';
  return 'Precedenti';
}
function titleParts(item) {
  const firstName = actorName(item.actor).split(' ')[0];
  return item.title.startsWith(`${firstName} `) ? <><strong>{actorName(item.actor)}</strong> <span>{item.title.slice(firstName.length + 1)}</span></> : <strong>{item.title}</strong>;
}
function NotificationAvatar({ actor, profile }) {
  const name = actorName(actor);
  return <span className="dw-notification-avatar" style={actorStyle(actor)} aria-hidden="true">{sameActor(actor, profile) ? <img src={profile.avatar || '/illustrations/profile-avatar.webp'} alt="" /> : name.split(' ').filter(Boolean).map(word => word[0]).slice(0, 2).join('')}</span>;
}

// Prova1 pageNotifications: compact header, day labels and bordered notification rows.
export function NotificationsPage({ onSelectMessage, onOpenPage }) {
  const { data, workspaceItems, inbox, markInboxRead, markAllInboxRead } = useDemo();
  const [filter, setFilter] = useState('all');
  const unread = inbox.filter(item => !item.read).length;
  const visible = [...inbox].sort((a, b) => timestamp(b.at) - timestamp(a.at)).filter(item => filter !== 'unread' || !item.read);
  const buckets = visible.reduce((groups, item) => { (groups[dayBucket(item.at)] ||= []).push(item); return groups; }, {});
  const styleName = id => styleLabel(workspaceItems.find(item => item.styleId === id)) || id;

  function select(item) {
    markInboxRead(item.id);
    onSelectMessage(item.id);
  }

  return <section className="dw-notifications-page" aria-labelledby="dw-notifications-heading">
    <header className="dw-notifications-heading">
      <div><h2 id="dw-notifications-heading">Notifiche{unread > 0 && <span className="dw-notifications-count">{unread} da leggere</span>}</h2><p>Aggiornamenti sui capi e sulle attività che segui.</p></div>
      <div className="dw-notifications-actions">
        <div className="dw-notifications-filter" role="group" aria-label="Filtra notifiche">{[['all', 'Tutte'], ['unread', 'Da leggere']].map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
        <button type="button" className="dw-btn dw-notifications-mark-all" disabled={!unread} onClick={markAllInboxRead}><Icon name="check-check" size={14} />Segna tutte come lette</button>
        {onOpenPage && <button type="button" className="dw-notifications-preferences" onClick={() => onOpenPage('settings?section=email')} aria-label="Preferenze notifiche" title="Preferenze notifiche"><Icon name="settings" size={16} /></button>}
      </div>
    </header>
    {visible.length ? Object.entries(buckets).map(([bucket, list]) => <section className="dw-notifications-group" key={bucket} aria-label={bucket}>
      <h3>{bucket}</h3>
      <div className="dw-notifications-panel">{list.map(item => <div className={`dw-notification-row${item.read ? '' : ' unread'}`} key={item.id}>
        <button type="button" className="dw-notification-open" onClick={() => select(item)}>
          <NotificationAvatar actor={item.actor} profile={data.profile} />
          <span className="dw-notification-copy"><span className="dw-notification-title">{titleParts(item)}</span><span className="dw-notification-snippet">{item.body}</span><span className="dw-notification-meta">{styleName(item.styleId)} · <time dateTime={item.at}>{relativeTime(item.at)}</time></span></span>
        </button>
        {!item.read && <span className="dw-notification-dot" aria-label="Da leggere" />}
        <button type="button" className="dw-notification-toggle" onClick={() => markInboxRead(item.id, !item.read)} aria-label={`${item.read ? 'Segna come da leggere' : 'Segna come letto'}: ${item.title}`} title={item.read ? 'Segna come da leggere' : 'Segna come letto'}><Icon name={item.read ? 'inbox' : 'check'} size={14} /></button>
      </div>)}</div>
    </section>) : <div className="dw-notifications-panel dw-notifications-empty"><Icon name="bell" size={22} /><h3>Sei in pari.</h3><p>{filter === 'unread' ? 'Nessuna notifica da leggere.' : 'Gli aggiornamenti dello spazio appariranno qui.'}</p>{filter === 'unread' && <button type="button" className="dw-notifications-mark-all" onClick={() => setFilter('all')}>Mostra tutte</button>}</div>}
  </section>;
}

export default NotificationsPage;
