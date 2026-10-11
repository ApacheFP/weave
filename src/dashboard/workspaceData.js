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
  const elena = { name: 'Elena Conti', email: 'elena@atelier.demo' };
  const date = days => {
    const next = new Date(now);
    next.setDate(next.getDate() + days);
    return localDate(next);
  };
  const at = minutes => new Date(now.getTime() - minutes * 60000).toISOString();
  const [atelier, studio] = items;
  const tasks = [
    ['task-1', 'Confermare la nuova consegna dei bottoni', atelier.styleId, 11, 'In corso', 'Alta', -1, alex, 'Accessori F deve confermare una data per BOT-003 prima di aggiornare il piano.'],
    ['task-2', 'Caricare lo schizzo finale della Giacca Atelier', atelier.styleId, 1, 'Da fare', 'Alta', 0, alex, 'Aggiungere il disegno dello stilista e confermare le scelte per moodboard e palette.'],
    ['task-3', 'Rivedere i 12 capi della NC-018', atelier.styleId, 13, 'In corso', 'Alta', 0, alex, 'Confrontarsi con Marta dopo il ricontrollo della cucitura spalla.'],
    ['task-4', 'Confermare le proporzioni della Giacca Studio', studio.styleId, 2, 'Da fare', 'Media', 2, alex, 'Verificare lunghezza, spalla e volume prima di preparare la tavola tecnica.'],
    ['task-5', 'Rivedere i costi della variante Sabbia', studio.styleId, 9, 'Da fare', 'Media', 4, alex, 'Confrontare la lana vergine TES-024 con il prezzo wholesale proposto.'],
    ['task-6', 'Allineare le date con Laboratorio B', atelier.styleId, 10, 'Da fare', 'Media', 6, alex, 'Controllare l’impatto degli accessori in ritardo sulla chiusura del lotto.'],
    ['task-7', 'Verificare la distinta base iniziale', atelier.styleId, 3, 'Completata', 'Bassa', -2, alex, 'Verificati codici e quantità di fodera, tela e bottoni.'],
    ['task-8', 'Ricontrollare la cucitura della spalla', atelier.styleId, 13, 'In corso', 'Alta', 1, marta, 'Eseguire il ricontrollo sul lotto L-0421-A e aggiornare Alex.'],
    ['task-9', 'Richiedere la scheda della lana vergine', studio.styleId, 3, 'Da fare', 'Media', 3, luca, 'Chiedere al Lanificio C la scheda aggiornata per TES-024.'],
  ].map(([id, title, styleId, moduleId, status, priority, days, assignee, note]) => ({ id, title, styleId, moduleId, status, priority, due: date(days), assignee, note, demo: true }));
  const inbox = [
    ['inbox-1', 'mention', atelier.styleId, 13, 'Marta ti ha menzionato nella NC-018', 'Ho separato i 12 capi da ricontrollare. Alex, puoi confermare il controllo della spalla prima di chiudere la segnalazione?', marta, 20, false],
    ['inbox-2', 'assign', atelier.styleId, 1, 'Elena ti ha assegnato lo schizzo finale', 'Il brief della Giacca Atelier è pronto. Carica il disegno finale e conferma le scelte creative per passare al disegno tecnico.', elena, 45, false],
    ['inbox-3', 'comment', studio.styleId, 2, 'Marta ha commentato le proporzioni', 'Per Giacca Studio terrei la spalla morbida e una lunghezza leggermente maggiore. Possiamo rivedere insieme le misure base?', marta, 80, false],
    ['inbox-4', 'update', atelier.styleId, 11, 'Nuova data dei bottoni da confermare', 'Accessori F non ha ancora confermato la nuova consegna di BOT-003. L’ordine resta in ritardo.', luca, 125, false],
    ['inbox-5', 'mention', studio.styleId, 9, 'Elena ti ha menzionato nei costi', 'Alex, controlliamo l’incidenza della lana vergine sul costo della variante Sabbia prima della prossima riunione?', elena, 210, true],
    ['inbox-6', 'update', atelier.styleId, 12, 'Lotto L-0421-A aggiornato', 'Laboratorio B ha comunicato 320 capi completati su 500. Restano da ricontrollare 12 capi.', luca, 1440, true],
    ['inbox-7', 'comment', atelier.styleId, 6, 'Marta ha aggiornato i controlli del campione', 'La costruzione delle tasche è verificata. Vestibilità e cucitura spalla sono ancora da confermare.', marta, 1550, true],
    ['inbox-8', 'assign', studio.styleId, 2, 'Elena ti ha assegnato la revisione delle proporzioni', 'Conferma lunghezza, spalla e volume della Giacca Studio entro la prossima revisione.', elena, 2880, true],
  ].map(([id, type, styleId, moduleId, title, body, actor, minutes, read]) => ({ id, type, styleId, moduleId, title, body, actor, at: at(minutes), read, replies: [], demo: true }));
  return { tasks, inbox, preferences: { theme: 'light', accent: 'indigo', sideDensity: 'comfortable', taskDensity: 'comfortable', motion: 'system', moduleAlerts: true, productNews: false } };
}
