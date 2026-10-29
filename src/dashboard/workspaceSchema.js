export const preferenceBooleans = ['moduleAlerts', 'productNews', 'emailDigest', 'emailMentions', 'pushAssignments', 'pushDeadlines', 'mentionComments', 'assignmentReminders', 'twoFactorEnabled'];
export const preferenceChoices = { theme: ['light', 'dark', 'system'], accent: ['indigo', 'blue', 'violet', 'teal', 'rose', 'graphite'], sideDensity: ['comfortable', 'compact'], taskDensity: ['comfortable', 'compact'], motion: ['system', 'reduce'], language: ['it', 'en'], contentLanguage: ['it', 'en'], timezone: ['Europe/Rome', 'Europe/Paris', 'Europe/London', 'America/New_York'], dateFormat: ['local', 'iso'], timeFormat: ['24h', '12h'], weekStartsOn: ['monday', 'sunday'], defaultLanding: ['home', 'my-tasks', 'inbox'] };
import { categorySpecs, additionalFabrics } from './productData.js';
import { validTask } from './workspaceData.js';
import { validArtwork, vectorViews } from './vectorDocument.js';
import { validProgram } from '../technical/drawingProgram.js';
import { validProportions } from './proportions.js';

export const workspaceSchemaVersion = 1;
export class WorkspaceDataError extends Error {
  constructor(message, code = 'invalid-data') { super(message); this.name = 'WorkspaceDataError'; this.code = code; }
}
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = (value, keys) => object(value) && keys.every(key => typeof value[key] === 'string');
const finite = value => typeof value === 'number' && Number.isFinite(value);
const nonnegative = value => finite(value) && value >= 0;
const integer = value => Number.isSafeInteger(value) && value >= 0;
const array = (value, check) => Array.isArray(value) && value.every(check);
const uniqueIds = rows => rows.every(row => typeof row.id === 'string' && row.id) && new Set(rows.map(row => row.id)).size === rows.length;
const actor = value => strings(value, ['id', 'name', 'email']) && Boolean(value.id);
const measurements = value => array(value, row => strings(row, ['point']) && nonnegative(row.value)) && value.length === 4;
const colors = value => array(value, row => strings(row, ['name', 'color', 'code']));
const notes = value => array(value, row => strings(row, ['text']) && finite(row.x) && finite(row.y));
const references = value => array(value, row => object(row) && typeof (row.src || row.asset) === 'string' && typeof row.name === 'string');
const date = value => { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(value + 'T12:00:00'); return Number.isFinite(parsed.getTime()) && parsed.getFullYear() === Number(value.slice(0,4)) && parsed.getMonth()+1 === Number(value.slice(5,7)) && parsed.getDate() === Number(value.slice(8,10)); };
const file = value => value == null || strings(value, ['id', 'src', 'name', 'type']) && integer(value.size) && value.size > 0 && value.size <= 8 * 1024 * 1024;
const inputs = value => strings(value, ['request', 'brand', 'history', 'target']);
function technical(value, category) {
  if (value === null) return true;
  if (!strings(value, ['requirements', 'constraints', 'fit']) || !nonnegative(value.tolerance) || !colors(value.colors) || !notes(value.notes)) return false;
  if (!array(value.versions, version => {
    if (!object(version)) return false;
    const snapshot = version.snapshot;
    return strings(version, ['id', 'note']) && finite(version.number) && strings(snapshot, ['fit', 'requirements', 'constraints']) && snapshot.category === category && measurements(snapshot.measurements) && object(snapshot.parts) && Object.keys(categorySpecs[category].parts).every(key => nonnegative(snapshot.parts[key])) && colors(snapshot.colors) && notes(snapshot.notes) && nonnegative(snapshot.tolerance) && (snapshot.proportions == null || validProportions(snapshot.proportions)) && validArtwork(snapshot.artwork) && (snapshot.programs == null || object(snapshot.programs) && Object.entries(snapshot.programs).every(([view, program]) => vectorViews.includes(view) && validProgram(program)));
  }) || !uniqueIds(value.versions)) return false;
  return ['approvedId', 'currentId'].every(key => value[key] == null || value.versions.some(version => version.id === value[key]));
}
function product(item) {
  if (!strings(item, ['id', 'modelId', 'styleId', 'title', 'collection', 'category', 'variant', 'brief', 'modelVersion', 'qualityNote', 'orderId', 'lotId', 'sampleId', 'fabricLot', 'factory', 'priority', 'start', 'end', 'delivery'])) return false;
  if (!Object.hasOwn(categorySpecs, item.category) || !additionalFabrics.some(fabric => fabric.id === item.fabricId && fabric.category === item.category)) return false;
  if (!strings(item.profile, ['id', 'firstName', 'lastName', 'email']) || !item.profile.id || (item.profile.avatar != null && typeof item.profile.avatar !== 'string')) return false;
  if (!['start','end','delivery'].every(key => date(item[key])) || item.start > item.end || item.end > item.delivery || !file(item.sketchFile) || (item.sketch != null && typeof item.sketch !== 'string') || (item.modelHistory != null && !array(item.modelHistory, row => strings(row, ['version', 'note'])))) return false;
  if (!['quantity', 'produced', 'reworks', 'retailSold'].every(key => integer(item[key])) || item.quantity < 1 || item.quantity > 10000 || item.produced > item.quantity || item.reworks > item.produced) return false;
  if (!['consumption', 'fabricPrice', 'laborMinutes', 'hourlyRate', 'logisticsCost', 'margin', 'wholesale', 'retail', 'retailAverage', 'qualityScore', 'seam', 'gradingChest', 'markerWidth', 'waste', 'actualWaste'].every(key => nonnegative(item[key])) || item.margin >= 100) return false;
  if (!['sampleApproved', 'optimized', 'productionPaused', 'qualityResolved'].every(key => typeof item[key] === 'boolean')) return false;
  if (!measurements(item.measurements) || !array(item.trims, row => strings(row, ['id', 'name', 'unit', 'supplier']) && nonnegative(row.qty) && nonnegative(row.price)) || !uniqueIds(item.trims)) return false;
  if (!array(item.wholesaleOrders, row => strings(row, ['id', 'client', 'status']) && integer(row.qty) && integer(row.shipped) && row.shipped <= row.qty) || !uniqueIds(item.wholesaleOrders)) return false;
  const ordered = item.wholesaleOrders.reduce((sum, row) => sum + row.qty, 0), shipped = item.wholesaleOrders.reduce((sum, row) => sum + row.shipped, 0);
  if (ordered + item.retailSold > item.quantity || shipped + item.retailSold > item.produced - item.reworks) return false;
  if (!array(item.purchaseOrders, row => strings(row, ['id', 'material', 'supplier', 'status', 'date']) && date(row.date)) || !uniqueIds(item.purchaseOrders)) return false;
  if (!array(item.shipments, row => strings(row, ['id', 'client', 'status']) && integer(row.qty)) || !uniqueIds(item.shipments)) return false;
  if (!array(item.lifecycle, row => strings(row, ['id', 'type', 'note', 'date']) && date(row.date)) || !uniqueIds(item.lifecycle)) return false;
  if (!array(item.productionDays, integer) || !array(item.sampleChecks, value => typeof value === 'boolean') || item.sampleChecks.length !== 3 || !references(item.references)) return false;
  if (item.sampleRevisions != null && (!array(item.sampleRevisions, row => strings(row, ['id', 'note', 'at', 'modelVersion']) && array(row.values, nonnegative) && row.values.length === 3) || !uniqueIds(item.sampleRevisions))) return false;
  if (!array(item.events, row => strings(row, ['id', 'text', 'time', 'at']) && integer(row.module) && actor(row.actor)) || !uniqueIds(item.events)) return false;
  if (!object(item.phaseReviews) || !Object.values(item.phaseReviews).every(value => typeof value === 'boolean') || !object(item.chats) || !Object.values(item.chats).every(rows => array(rows, row => strings(row, ['id', 'role', 'text'])))) return false;
  if (!object(item.aiRuns) || !Object.values(item.aiRuns).every(integer) || !object(item.creative) || !inputs(item.creative.inputs) || !references(item.creative.referenceFiles)) return false;
  const direction = item.creative.direction;
  if (direction != null && (!object(direction) || !strings(direction, ['styleId', 'directionCaption']) || !integer(direction.directionRevision) || !array(direction.palette, row => strings(row, ['name', 'color'])) || !references(direction.moodboard))) return false;
  const concept = item.creative.concept;
  if (concept != null && (!object(concept) || !array(concept.palette, row => strings(row, ['name', 'color'])) || !references(concept.moodboard) || !references(concept.references))) return false;
  return technical(item.technical, item.category);
}

// Validate the data consumed by pages before hydration; invalid snapshots are never overwritten.
export function assertWorkspace(workspace) {
  if (!object(workspace) || typeof workspace.id !== 'string' || !workspace.id || !Array.isArray(workspace.items) || !workspace.items.length || !workspace.items.every(product) || !uniqueIds(workspace.items) || new Set(workspace.items.map(item => item.styleId)).size !== workspace.items.length) throw new WorkspaceDataError('I dati dei capi salvati non sono validi.');
  if (workspace.activeProductId != null && !workspace.items.some(item => item.id === workspace.activeProductId && item.styleId === workspace.activeId)) throw new WorkspaceDataError('Il capo selezionato non è valido.');
  const owner = workspace.items[0].profile.id;
  if (!workspace.items.every(item => item.profile.id === owner) || !workspace.items.some(item => item.styleId === workspace.activeId) || typeof workspace.hasSelectedStyle !== 'boolean' || !object(workspace.selectedVariants)) throw new WorkspaceDataError('Il capo selezionato o il profilo salvato non sono validi.');
  if (!Object.entries(workspace.selectedVariants).every(([model, code]) => workspace.items.some(item => (item.modelId === model || (item.productId || item.styleId) === model) && item.styleId === code))) throw new WorkspaceDataError('Le varianti salvate non sono valide.');
  if (!array(workspace.tasks, task => validTask(task, workspace.items) && actor(task.assignee)) || !uniqueIds(workspace.tasks)) throw new WorkspaceDataError('Le attività salvate non sono valide.');
  if (!array(workspace.inbox, row => strings(row, ['id', 'title', 'body', 'at', 'type']) && workspace.items.some(item => item.styleId === row.styleId) && actor(row.actor) && typeof row.read === 'boolean' && array(row.replies, reply => strings(reply, ['id', 'body', 'at']) && actor(reply.actor))) || !uniqueIds(workspace.inbox)) throw new WorkspaceDataError('Le conversazioni salvate non sono valide.');
  if (!object(workspace.collections) || !Object.values(workspace.collections).every(collection => object(collection) && array(collection.palette, row => strings(row, ['name', 'color'])) && references(collection.moodboard) && (collection.phase == null || ['Passata', 'Attuale', 'Futura', 'Programmata'].includes(collection.phase)))) throw new WorkspaceDataError('Le collezioni salvate non sono valide.');
  const preferences = workspace.preferences;
  if (!object(preferences) || !['light','dark','system'].includes(preferences.theme) || !['system','reduce'].includes(preferences.motion) || !Object.entries(preferenceChoices).every(([key, values]) => preferences[key] == null || values.includes(preferences[key])) || !preferenceBooleans.every(key => preferences[key] == null || typeof preferences[key] === 'boolean') || (preferences.workspaceName != null && (typeof preferences.workspaceName !== 'string' || !preferences.workspaceName.trim() || preferences.workspaceName.length > 60))) throw new WorkspaceDataError('Le preferenze salvate non sono valide.');
  return workspace;
}
export function readWorkspaceRecord(record) {
  if (!object(record) || record.version !== workspaceSchemaVersion) throw new WorkspaceDataError('Questa versione dei dati richiede un aggiornamento.', 'unsupported-version');
  if (!integer(record.revision) || typeof record.savedAt !== 'string' || !Number.isFinite(Date.parse(record.savedAt))) throw new WorkspaceDataError('Il salvataggio non è leggibile.');
  return { ...record, workspace: assertWorkspace(record.workspace) };
}
