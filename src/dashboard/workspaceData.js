import { productSpec } from './productData.js';
import { moduleGroups } from '../modules.js';

export const taskStatuses = ['Da fare', 'In corso', 'Completata'];
export const taskPriorities = ['Alta', 'Media', 'Bassa'];
export const actorTone = email => ({
  'marta@atelier.demo': 'rose',
  'luca@atelier.demo': 'green',
  'elena@atelier.demo': 'blue',
  'giulia@atelier.demo': 'violet',
  'sara@atelier.demo': 'orange',
  'paolo@atelier.demo': 'teal',
  'francesca@atelier.demo': 'amber',
  'demo@weave.it': 'violet',
}[email] || 'violet');
export const actorStyle = actor => ({ '--actor-color': `var(--${actorTone(actor?.email)})` });

export function profileActor(profile) {
  return { ...(profile.id ? { id: profile.id } : {}), name: `${profile.firstName} ${profile.lastName}`.trim(), email: profile.email };
}

export function validTask(task, items) {
  if (!task || typeof task !== 'object') return false;
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

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function seedWorkspaceData(items, profile, now = new Date()) {
  const alex = profileActor(profile);
  const marta = { name: 'Marta Bianchi', email: 'marta@atelier.demo' };
  const luca = { name: 'Luca Ferri', email: 'luca@atelier.demo' };
  const elena = { name: 'Elena Conti', email: 'elena@atelier.demo' };
  const giulia = { name: 'Giulia Neri', email: 'giulia@atelier.demo' };
  const sara = { name: 'Sara Moretti', email: 'sara@atelier.demo' };
  const paolo = { name: 'Paolo Ricci', email: 'paolo@atelier.demo' };
  const francesca = { name: 'Francesca Riva', email: 'francesca@atelier.demo' };
  const date = days => {
    const next = new Date(now);
    next.setDate(next.getDate() + days);
    return localDate(next);
  };
  const at = minutes => new Date(now.getTime() - minutes * 60000).toISOString();
  const when = minutes => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(now.getTime() - minutes * 60000));
  const peopleByModule = { 21: alex, 1: marta, 2: giulia, 3: marta, 4: giulia, 5: giulia, 6: marta, 7: marta, 9: alex, 10: alex, 11: paolo, 12: luca, 13: elena };
  const seededItems = items.map((item, itemIndex) => ({
    ...item,
    events: item.events.map((event, eventIndex) => {
      const age = 35 + itemIndex * 173 + (item.events.length - eventIndex - 1) * 257;
      return { ...event, actor: peopleByModule[event.module] || alex, at: at(age), time: when(age) };
    }),
  }));
  const tasks = [], inbox = [];
  for (const [index, item] of items.entries()) {
    const spec = productSpec(item), label = `${item.title} · ${item.variant}`;
    if (item.category === 'bag') {
      tasks.push({ id: `task-concept-${item.styleId}`, title: `Definire la direzione creativa · ${item.title}`, styleId: item.styleId, moduleId: 1, status: 'In corso', priority: 'Alta', due: date(1), assignee: alex, note: 'Allineare brief, riferimenti e schizzo prima di avviare il disegno tecnico.', demo: true });
      inbox.push({ id: `inbox-concept-${item.styleId}`, type: 'comment', styleId: item.styleId, moduleId: 1, title: `Feedback sul concept · ${label}`, body: 'Il brief è pronto. Prima di passare al disegno tecnico, scegliamo insieme la direzione dei manici e della finitura ottone.', actor: marta, at: at(32 + index * 13), read: false, replies: [], demo: true });
    } else if (item.category === 'trousers') {
      tasks.push({ id: `task-fitting-${item.styleId}`, title: `Chiudere il fitting del campione · ${item.variant}`, styleId: item.styleId, moduleId: 6, status: 'In corso', priority: 'Alta', due: date(0), assignee: alex, note: `${item.sampleId}: ${spec.checks.join('; ')}. Una verifica su tre è completata.`, demo: true });
      tasks.push({ id: `task-fitting-note-${item.styleId}`, title: `Verificare le misure campione · ${item.variant}`, styleId: item.styleId, moduleId: 6, status: 'Da fare', priority: 'Media', due: date(2), assignee: alex, note: 'Confrontare vita, bacino e lunghezza con la taglia base prima dell’approvazione.', demo: true });
      inbox.push({ id: `inbox-fitting-${item.styleId}`, type: 'assign', styleId: item.styleId, moduleId: 6, title: `Campione ${label} pronto per il fitting`, body: `${item.sampleId}: il primo controllo è registrato. Restano da verificare vestibilità e finitura prima dell’approvazione.`, actor: giulia, at: at(48), read: false, replies: [{ id: `reply-fitting-${item.styleId}`, body: 'Controllo il campione oggi e aggiorno le verifiche nel modulo.', actor: alex, at: at(34) }], demo: true });
    } else {
      const qualityActor = [elena, luca, francesca][index % 3];
      tasks.push({ id: `task-production-${item.styleId}`, title: `Proseguire il lotto · ${item.variant}`, styleId: item.styleId, moduleId: 12, status: 'In corso', priority: 'Media', due: date(index + 1), assignee: alex, note: `${item.produced} di ${item.quantity} capi registrati sul lotto ${item.lotId}.`, demo: true });
      tasks.push({ id: `task-quality-${item.styleId}`, title: `${spec.checks[2]} · ${item.variant}`, styleId: item.styleId, moduleId: 13, status: 'Da fare', priority: 'Alta', due: date(index), assignee: alex, note: `${spec.quality.id} · ${item.reworks} capi da ricontrollare: ${item.qualityNote}`, demo: true });
      inbox.push({ id: `inbox-quality-${item.styleId}`, type: 'mention', styleId: item.styleId, moduleId: 13, title: `${qualityActor.name.split(' ')[0]} ti ha menzionato nella ${spec.quality.id}`, body: `@${alex.name} ${item.reworks} capi da ricontrollare sul lotto ${item.lotId}. ${item.qualityNote}`, actor: qualityActor, at: at(20 + index * 19), read: index === 1, replies: [], demo: true });
    }
  }
  const primary = items[0];
  const trousers = items.find(item => item.category === 'trousers') || primary;
  const bag = items.find(item => item.category === 'bag') || primary;
  const knit = items.find(item => item.category === 'knit') || primary;
  inbox.push(
    { id: 'inbox-production-shift', type: 'update', styleId: knit.styleId, moduleId: 12, title: `Aggiornamento produzione · ${knit.variant}`, body: `Luca ha aggiornato il turno del lotto ${knit.lotId}: ${knit.produced} capi registrati su ${knit.quantity}.`, actor: luca, at: at(205), read: true, replies: [], demo: true },
    { id: 'inbox-supplier-delivery', type: 'update', styleId: knit.styleId, moduleId: 11, title: `Materiali consegnati · ${knit.variant}`, body: `La filatura e i fornitori accessori hanno completato le consegne per il lotto ${knit.lotId}.`, actor: paolo, at: at(870), read: true, replies: [], demo: true },
    { id: 'inbox-fit-comment', type: 'comment', styleId: trousers.styleId, moduleId: 6, title: `Nota sul fitting · ${trousers.title}`, body: 'La piega cade bene sul davanti. Al prossimo controllo verifichiamo la vita e la vestibilità con la maglia della capsule.', actor: marta, at: at(1510), read: true, replies: [], demo: true },
    { id: 'inbox-bag-reference', type: 'comment', styleId: bag.styleId, moduleId: 1, title: 'Riferimento per i manici della Borsa Trama', body: 'Ho aggiunto un riferimento in pelle testa moro al brief. La finitura si può confermare insieme alla direzione del concept.', actor: sara, at: at(2460), read: true, replies: [], demo: true },
  );
  inbox.push({ id: 'inbox-production', type: 'update', styleId: primary.styleId, moduleId: 12, title: `Lotto ${primary.lotId} aggiornato`, body: `${primary.factory}: ${primary.produced} articoli completati su ${primary.quantity}.`, actor: luca, at: at(1440), read: true, replies: [], demo: true });
  return { items: seededItems, tasks, inbox, preferences: { theme: 'light', accent: 'indigo', sideDensity: 'comfortable', taskDensity: 'comfortable', motion: 'system', language: 'it', timezone: 'Europe/Rome', dateFormat: 'local', timeFormat: '24h', weekStartsOn: 'monday', workspaceName: 'Atelier', moduleAlerts: true, productNews: false, emailDigest: true, emailMentions: true, pushAssignments: true, pushDeadlines: true, mentionComments: true, assignmentReminders: true, defaultLanding: 'home', twoFactorEnabled: false } };
}
