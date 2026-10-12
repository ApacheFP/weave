import { productSpec, styleLabel } from './productData.js';
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
  const peopleByModule = { 21: alex, 3: marta, 13: elena, 8: giulia, 14: luca, 20: sara };
  const seededItems = items.map((item, itemIndex) => ({
    ...item,
    events: item.events.map((event, eventIndex) => {
      const age = 35 + itemIndex * 173 + eventIndex * 257;
      return { ...event, actor: peopleByModule[event.module] || alex, at: at(age), time: when(age) };
    }),
  }));
  const tasks = [], inbox = [];
  for (const [index, item] of items.entries()) {
    const spec = productSpec(item), label = styleLabel(item);
    tasks.push({ id: `task-quality-${item.styleId}`, title: `${spec.checks[2]} · ${item.variant}`, styleId: item.styleId, moduleId: 13, status: index === 0 ? 'In corso' : 'Da fare', priority: index === 0 ? 'Alta' : 'Media', due: date(index), assignee: alex, note: `${spec.quality.id} · ${item.qualityNote}`, demo: true });
    tasks.push({ id: `task-sketch-${item.styleId}`, title: `Caricare lo schizzo finale · ${label}`, styleId: item.styleId, moduleId: 1, status: 'Da fare', priority: 'Media', due: date(index + 1), assignee: alex, note: 'Aggiungere il disegno dello stilista e confermare palette e moodboard.', demo: true });
    const sampleActor = [giulia, sara, marta][index % 3];
    const qualityActor = [elena, luca, francesca][index % 3];
    inbox.push({ id: `inbox-sample-${item.styleId}`, type: 'comment', styleId: item.styleId, moduleId: 6, title: `Campione ${label} da verificare`, body: `${item.sampleId}: ${spec.checks.join('; ')}.`, actor: sampleActor, at: at(100 + index * 43), read: false, replies: [], demo: true });
    inbox.push({ id: `inbox-quality-${item.styleId}`, type: 'mention', styleId: item.styleId, moduleId: 13, title: `${qualityActor.name.split(' ')[0]} ti ha menzionato nella ${spec.quality.id}`, body: `${item.reworks} articoli da ricontrollare sul lotto ${item.lotId}. ${item.qualityNote}`, actor: qualityActor, at: at(20 + index * 61), read: false, replies: [], demo: true });
  }
  const primary = items[0];
  const trousers = items.find(item => item.category === 'trousers') || primary;
  const bag = items.find(item => item.category === 'bag') || primary;
  const knit = items.find(item => item.category === 'knit') || primary;
  const alexFirst = alex.name.split(' ')[0];
  inbox.push(
    { id: 'inbox-pattern-review', type: 'assign', styleId: trousers.styleId, moduleId: 5, title: 'Nuovo incarico: confermare la curva taglie', body: `Ho caricato la revisione della vestibilità del ${trousers.title}. ${alexFirst}, puoi verificare la taglia campione prima del passaggio al prototipo?`, actor: giulia, at: at(48), read: false, replies: [{ id: 'reply-pattern-review', body: 'Controllo la scheda oggi pomeriggio e ti lascio una nota sulle misure.', actor: alex, at: at(39) }], demo: true },
    { id: 'inbox-material-alternative', type: 'comment', styleId: bag.styleId, moduleId: 3, title: 'Alternativa materiale per il prossimo riordino', body: `Pelletteria Toscana ha confermato disponibilità della pelle per ${bag.variant}. Il campione ha una grana più regolare; allego il codice PEL-052 per il confronto con la distinta.`, actor: sara, at: at(133), read: false, replies: [{ id: 'reply-material-alternative', body: 'La mano è coerente con il prototipo. Chiedo il campione colore prima di aggiornare la distinta.', actor: marta, at: at(119) }, { id: 'reply-material-alternative-2', body: 'Campione colore in partenza domani con il corriere.', actor: sara, at: at(107) }], demo: true },
    { id: 'inbox-production-shift', type: 'update', styleId: knit.styleId, moduleId: 12, title: `Turno di produzione aggiornato · ${knit.variant}`, body: `Luca ha registrato 42 pezzi sul lotto ${knit.lotId}. Il controllo di fine turno è previsto alle 16:30.`, actor: luca, at: at(205), read: true, replies: [], demo: true },
    { id: 'inbox-passport-copy', type: 'mention', styleId: bag.styleId, moduleId: 19, title: 'Francesca ti ha menzionato nella scheda di tracciabilità', body: `La provenienza dei manici è verificata. ${alexFirst}, manca solo la conferma della finitura ottone prima di pubblicare la scheda del lotto.`, actor: francesca, at: at(322), read: false, replies: [], demo: true },
    { id: 'inbox-quality-followup', type: 'comment', styleId: trousers.styleId, moduleId: 13, title: 'Verifica finale sui capi ricondizionati', body: `Ho ricontrollato i 6 pantaloni del lotto ${trousers.lotId}: tensione e orlo sono rientrati in tolleranza. Lascio il campione in qualità per l’ultima firma.`, actor: elena, at: at(610), read: true, replies: [], demo: true },
    { id: 'inbox-supplier-delivery', type: 'update', styleId: bag.styleId, moduleId: 11, title: 'Consegna accessori confermata', body: 'Accessori Firenze conferma la zip ottone e i rinforzi angolo entro mercoledì. Il fornitore ha aggiornato la data nell’ordine ACQ-0424-3.', actor: paolo, at: at(870), read: true, replies: [], demo: true },
    { id: 'inbox-fit-comment', type: 'comment', styleId: trousers.styleId, moduleId: 4, title: 'Nota sul prototipo · Pantalone Riva', body: 'La piega cade bene sul davanti. Sul prossimo fitting controlliamo la vestibilità in vita con la camicia inserita, così chiudiamo la revisione del cartamodello.', actor: marta, at: at(1510), read: true, replies: [], demo: true },
    { id: 'inbox-collection-approval', type: 'assign', styleId: knit.styleId, moduleId: 1, title: 'Rivedere la palette della capsule', body: `Ho aggiornato moodboard e riferimenti per ${knit.title}. Dai un’occhiata ai toni Avorio, Salvia e Grafite prima della revisione di collezione.`, actor: francesca, at: at(2460), read: true, replies: [], demo: true },
  );
  tasks.push({ id: 'task-planning', title: `Allineare le date con ${primary.factory}`, styleId: primary.styleId, moduleId: 10, status: 'Da fare', priority: 'Media', due: date(6), assignee: alex, note: `Verificare il piano dell’ordine ${primary.orderId}.`, demo: true });
  inbox.push({ id: 'inbox-production', type: 'update', styleId: primary.styleId, moduleId: 12, title: `Lotto ${primary.lotId} aggiornato`, body: `${primary.factory}: ${primary.produced} articoli completati su ${primary.quantity}.`, actor: luca, at: at(1440), read: true, replies: [], demo: true });
  return { items: seededItems, tasks, inbox, preferences: { theme: 'light', accent: 'indigo', sideDensity: 'comfortable', taskDensity: 'comfortable', motion: 'system', language: 'it', timezone: 'Europe/Rome', dateFormat: 'local', timeFormat: '24h', weekStartsOn: 'monday', workspaceName: 'Atelier', moduleAlerts: true, productNews: false, emailDigest: true, emailMentions: true, pushAssignments: true, pushDeadlines: true, mentionComments: true, assignmentReminders: true, defaultLanding: 'home', twoFactorEnabled: false } };
}
