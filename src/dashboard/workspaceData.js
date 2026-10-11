import { productSpec, styleLabel } from './productData.js';
import { moduleGroups } from '../modules.js';

export const taskStatuses = ['Da fare', 'In corso', 'Completata'];
export const taskPriorities = ['Alta', 'Media', 'Bassa'];

export function profileActor(profile) {
  return { name: `${profile.firstName} ${profile.lastName}`.trim(), email: profile.email };
}

export function validTask(task, items) {
  if (typeof task.title !== 'string' || !task.title.trim() || task.title.trim().length > 120) return false;
  if (!items.some(item => item.styleId === task.styleId)) return false;
  if (!moduleGroups[0].items.some(module => module.id === task.moduleId)) return false;
  if (!taskStatuses.includes(task.status) || !taskPriorities.includes(task.priority)) return false;
  if (typeof task.note !== 'string' || task.note.length > 2000) return false;
  if (task.due === '') return true;
  if (typeof task.due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(task.due)) return false;
  const parsed = new Date(`${task.due}T12:00:00`);
  return Number.isFinite(parsed.getTime()) && localDate(parsed) === task.due;
}

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function seedWorkspaceData(items, profile, now = new Date()) {
  const alex = profileActor(profile);
  const marta = { name: 'Marta Bianchi', email: 'marta@atelier.demo' };
  const luca = { name: 'Luca Ferri', email: 'luca@atelier.demo' };
  const date = days => {
    const next = new Date(now);
    next.setDate(next.getDate() + days);
    return localDate(next);
  };
  const at = minutes => new Date(now.getTime() - minutes * 60000).toISOString();
  const tasks = [], inbox = [];
  for (const [index, item] of items.entries()) {
    const spec = productSpec(item), label = styleLabel(item);
    tasks.push({ id: `task-quality-${item.styleId}`, title: `${spec.checks[2]} · ${item.variant}`, styleId: item.styleId, moduleId: 13, status: index === 0 ? 'In corso' : 'Da fare', priority: index === 0 ? 'Alta' : 'Media', due: date(index), assignee: alex, note: `${spec.quality.id} · ${item.qualityNote}`, demo: true });
    tasks.push({ id: `task-sketch-${item.styleId}`, title: `Caricare lo schizzo finale · ${label}`, styleId: item.styleId, moduleId: 1, status: 'Da fare', priority: 'Media', due: date(index + 1), assignee: alex, note: 'Aggiungere il disegno dello stilista e confermare palette e moodboard.', demo: true });
    inbox.push({ id: `inbox-sample-${item.styleId}`, type: 'comment', styleId: item.styleId, moduleId: 6, title: `Campione ${label} da verificare`, body: `${item.sampleId}: ${spec.checks.join('; ')}.`, actor: marta, at: at(100 + index * 30), read: false, replies: [], demo: true });
    inbox.push({ id: `inbox-quality-${item.styleId}`, type: 'mention', styleId: item.styleId, moduleId: 13, title: `Marta ti ha menzionato nella ${spec.quality.id}`, body: `${item.reworks} articoli da ricontrollare sul lotto ${item.lotId}. ${item.qualityNote}`, actor: marta, at: at(20 + index * 30), read: false, replies: [], demo: true });
  }
  const primary = items[0];
  tasks.push({ id: 'task-planning', title: `Allineare le date con ${primary.factory}`, styleId: primary.styleId, moduleId: 10, status: 'Da fare', priority: 'Media', due: date(6), assignee: alex, note: `Verificare il piano dell’ordine ${primary.orderId}.`, demo: true });
  inbox.push({ id: 'inbox-production', type: 'update', styleId: primary.styleId, moduleId: 12, title: `Lotto ${primary.lotId} aggiornato`, body: `${primary.factory}: ${primary.produced} articoli completati su ${primary.quantity}.`, actor: luca, at: at(1440), read: true, replies: [], demo: true });
  return { tasks, inbox, preferences: { theme: 'light', accent: 'indigo', sideDensity: 'comfortable', taskDensity: 'comfortable', motion: 'system', moduleAlerts: true, productNews: false } };
}
