import { collectionDefaults, prepareDirection } from './creativeData.js';
import { applyProductPatch } from './domain.js';
import { findProduct, ProductActionError } from './productActions.js';
import { profileActor } from './workspaceData.js';
import { sameActor } from './workspaceIdentity.js';

export const productSections = {
  saveCreative: [1, ['creative', 'conceptApproved', 'identityAssigned', 'techGenerated', 'sketch', 'sketchFile', 'sketchName', 'technical', 'phaseReviews']],
  saveTechnical: [2, ['technical', 'techGenerated', 'measurements', 'seam', 'variant', 'sketch', 'sketchFile', 'sketchName', 'identityAssigned', 'conceptApproved', 'creative', 'phaseReviews']],
  saveMaterials: [3, ['fabricId', 'fabricPrice', 'consumption', 'trims']],
  savePattern: [4, ['seam', 'modelVersion', 'grain', 'notches', 'modelHistory']],
  saveGrading: [5, ['gradingChest', 'measurements']],
  saveSampleChecks: [6, ['sampleChecks', 'sampleApproved', 'sampleRevisions']],
  saveMarker: [7, ['markerWidth', 'optimized', 'consumption', 'waste']],
  savePricing: [9, ['fabricId', 'fabricPrice', 'margin', 'hourlyRate', 'wholesale', 'retail']],
  savePlan: [10, ['factory', 'priority', 'start', 'end', 'delivery']],
  savePurchases: [11, ['purchaseOrders']],
  saveProductionDetails: [12, ['actualWaste', 'productionPaused']],
  saveQuality: [13, ['qualityResolved', 'qualityScore', 'reworks', 'qualityNote']],
  savePassport: [19, ['passportPublished']],
  savePhaseReview: [21, ['phaseReviews']],
  saveIndustrialCycle: [8, ['laborMinutes']],
  saveInventoryLocation: [14, ['location']],
  saveRetailPrice: [17, ['retail']],
  generateDemoOutput: [20, ['aiRuns', 'markerWidth', 'optimized', 'consumption', 'waste']],
  saveChat: [22, ['chats', 'activeChats']],
  applyDecision: [22, ['fabricId', 'fabricPrice', 'markerWidth', 'optimized', 'consumption', 'waste', 'wholesale', 'retail', 'purchaseOrders', 'qualityResolved', 'qualityScore', 'reworks', 'chats']],
};
function eventFor(profile, text, module) {
  const now = new Date();
  return { id: crypto.randomUUID(), text, module, at: now.toISOString(), time: new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(now), actor: profileActor(profile) };
}
export function saveProductSection(workspace, identity, section, patch, message, module = productSections[section]?.[0]) {
  const previous = findProduct(workspace, identity);
  const allowed = productSections[section]?.[1];
  const changes = typeof patch === 'function' ? patch(previous) : patch;
  if (!changes || !Object.keys(changes).length) return workspace;
  if (!allowed || Array.isArray(changes) || Object.keys(changes).some(key => !allowed.includes(key))) throw new ProductActionError('INVALID_SECTION', 'Questa modifica non è consentita in questa sezione.');
  const next = applyProductPatch(previous, changes);
  const event = message && eventFor(next.profile, message, module);
  if (event) next.events = [event, ...previous.events].slice(0, 40);
  const update = event && workspace.preferences.moduleAlerts && { id: crypto.randomUUID(), type: 'update', styleId: next.styleId, moduleId: module, title: `${next.title} · aggiornamento`, body: message, actor: event.actor, at: event.at, read: false, replies: [], demo: true };
  return { ...workspace, items: workspace.items.map(item => item.id === previous.id ? next : item), inbox: update ? [update, ...workspace.inbox] : workspace.inbox };
}
export function updateProfile(workspace, input) {
  if (!input || !['firstName', 'lastName', 'email'].every(key => typeof input[key] === 'string' && input[key].trim()) || input.firstName.trim().length > 80 || input.lastName.trim().length > 80 || input.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || (input.avatar != null && typeof input.avatar !== 'string')) throw new ProductActionError('INVALID_PROFILE', 'Verifica nome, cognome ed email del profilo.');
  const previous = workspace.items[0].profile;
  const profile = { ...previous, firstName: input.firstName.trim(), lastName: input.lastName.trim(), email: input.email.trim(), avatar: Object.hasOwn(input, 'avatar') ? input.avatar : previous.avatar };
  const actor = profileActor(profile);
  const updateActor = value => sameActor(value, previous) ? actor : value;
  return { ...workspace, items: workspace.items.map(item => ({ ...item, profile })), tasks: workspace.tasks.map(task => ({ ...task, assignee: updateActor(task.assignee) })), inbox: workspace.inbox.map(item => ({ ...item, actor: updateActor(item.actor), replies: item.replies.map(reply => ({ ...reply, actor: updateActor(reply.actor) })) })) };
}
export const collectionFor = (workspace, name) => Object.hasOwn(workspace.collections, name) ? workspace.collections[name] : collectionDefaults();
export function saveCollectionDirection(workspace, identity, patch, message) {
  const product = findProduct(workspace, identity), previous = collectionFor(workspace, product.collection);
  const changes = typeof patch === 'function' ? patch(previous) : patch;
  if (!changes || Object.keys(changes).some(key => !['palette', 'moodboard', 'directionRevision', 'directionCaption', 'directionHistory'].includes(key))) throw new ProductActionError('INVALID_COLLECTION', 'Verifica la direzione della collezione.');
  const event = message && eventFor(product.profile, message, 1);
  const update = event && workspace.preferences.moduleAlerts && { id: crypto.randomUUID(), type: 'update', styleId: product.styleId, moduleId: 1, title: `${product.collection} · direzione creativa`, body: message, actor: event.actor, at: event.at, read: false, replies: [], demo: true };
  return { ...workspace, collections: { ...workspace.collections, [product.collection]: { ...previous, ...changes } }, inbox: update ? [update, ...workspace.inbox] : workspace.inbox, items: event ? workspace.items.map(item => item.id === product.id ? { ...item, events: [event, ...item.events].slice(0, 40) } : item) : workspace.items };
}
export function saveProductDirection(workspace, identity, patch, message) {
  const product = findProduct(workspace, identity), previous = product.creative.direction?.styleId === product.styleId ? product.creative.direction : prepareDirection(product.creative.inputs, '', null, product);
  const changes = typeof patch === 'function' ? patch(previous) : patch;
  if (!changes || Object.keys(changes).some(key => !['styleId', 'palette', 'moodboard', 'directionRevision', 'directionCaption', 'directionHistory'].includes(key))) throw new ProductActionError('INVALID_PRODUCT_DIRECTION', 'Verifica la direzione creativa del capo.');
  return saveProductSection(workspace, identity, 'saveCreative', { creative: { ...product.creative, direction: { ...previous, ...changes } } }, message, 1);
}
