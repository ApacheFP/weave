import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collectionDefaults, creativeDefaults } from './creativeData.js';
import { profileActor, seedWorkspaceData, validTask } from './workspaceData.js';
import { groupProducts, newDemoProducts } from './productData.js';
import { applyProductPatch, fabrics, totals, validStyleInput } from './domain.js';
import { demoDefaults } from './demoDefaults.js';

const activityTime = () => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());
const initial = newDemoProducts(demoDefaults)[0];

const Context = createContext(null);
export function DemoProvider({ children }) {
  const [workspace, setWorkspace] = useState(() => {
    const items = newDemoProducts(demoDefaults);
    return { activeId: items[0].styleId, hasSelectedStyle: false, selectedVariants: {}, collections: { [initial.collection]: collectionDefaults() }, items, ...seedWorkspaceData(items, initial.profile) };
  });
  const data = workspace.items.find(item => item.styleId === workspace.activeId);
  const products = groupProducts(workspace.items, workspace.activeId, workspace.selectedVariants, fabrics);
  const [notice, setNotice] = useState('');
  const timeout = useRef(null);
  useEffect(() => () => clearTimeout(timeout.current), []);
  function notify(message) {
    setNotice(message);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setNotice(''), 3600);
  }
  function commit(patch, message, module = 21) {
    setWorkspace(current => {
      const previous = current.items.find(item => item.styleId === workspace.activeId);
      const changes = typeof patch === 'function' ? patch(previous) : patch;
      if (!changes || !Object.keys(changes).length) return current;
      const next = applyProductPatch(previous, changes);
      const actor = profileActor(next.profile);
      const at = new Date().toISOString();
      if (message) next.events = [{ id: crypto.randomUUID(), text: message, module, time: activityTime(), at, actor }, ...previous.events].slice(0, 40);
      const updatedActor = oldActor => changes.profile && oldActor.email === previous.profile.email ? actor : oldActor;
      const inbox = changes.profile ? current.inbox.map(item => ({ ...item, actor: updatedActor(item.actor), replies: item.replies.map(reply => ({ ...reply, actor: updatedActor(reply.actor) })) })) : current.inbox;
      const update = message && current.preferences.moduleAlerts && !changes.profile ? { id: crypto.randomUUID(), type: 'update', styleId: next.styleId, moduleId: module, title: `${next.title} · aggiornamento`, body: message, actor, at, read: false, replies: [], demo: true } : null;
      return { ...current, tasks: changes.profile ? current.tasks.map(task => ({ ...task, assignee: updatedActor(task.assignee) })) : current.tasks, inbox: update ? [update, ...inbox] : inbox, items: current.items.map(item => item.styleId === workspace.activeId ? next : changes.profile ? { ...item, profile: changes.profile } : item) };
    });
    if (message) notify(message);
  }
  const collectionData = workspace.collections[data.collection] || collectionDefaults();
  function commitCollection(patch, message) {
    setWorkspace(current => {
      const previous = current.items.find(item => item.styleId === workspace.activeId);
      const collection = current.collections[previous.collection] || collectionDefaults();
      const changes = typeof patch === 'function' ? patch(collection) : patch;
      const actor = profileActor(previous.profile);
      const at = new Date().toISOString();
      const event = message && { id: crypto.randomUUID(), text: message, module: 1, time: activityTime(), at, actor };
      const update = event && current.preferences.moduleAlerts ? { id: crypto.randomUUID(), type: 'update', styleId: previous.styleId, moduleId: 1, title: `${previous.collection} · direzione creativa`, body: message, actor, at, read: false, replies: [], demo: true } : null;
      return { ...current, inbox: update ? [update, ...current.inbox] : current.inbox, collections: { ...current.collections, [previous.collection]: { ...collection, ...changes } }, items: event ? current.items.map(item => item.styleId === previous.styleId ? { ...item, events: [event, ...item.events].slice(0, 40) } : item) : current.items };
    });
    if (message) notify(message);
  }
  function selectStyle(styleId) {
    setWorkspace(current => {
      const item = current.items.find(item => item.styleId === styleId);
      return item ? { ...current, activeId: styleId, hasSelectedStyle: true, selectedVariants: { ...current.selectedVariants, [item.productId || item.styleId]: styleId } } : current;
    });
  }
  function createStyle(input) {
    if (!validStyleInput(input, workspace.items, data)) return false;
    const { title, styleId, collection, quantity, copy } = input;
    const code = styleId.trim().toUpperCase();
    const suffix = code.replace(/^[A-Z]+-/, '');
    const item = { ...structuredClone(copy ? data : initial), title: title.trim(), productId: undefined, aliasTitle: undefined, styleId: code, orderId: 'OP-' + suffix, lotId: 'L-' + suffix + '-A', fabricLot: 'T-' + suffix, sampleId: 'CAMP-' + suffix + '-01', collection: collection.trim(), quantity: Number(quantity), references: [], creative: creativeDefaults(), conceptApproved: false, identityAssigned: false, technical: null, techGenerated: false, sketch: null, sketchFile: null, sketchName: null, chats: {}, aiRuns: {}, phaseReviews: {}, passportPublished: false,
      profile: data.profile, qualityNote: copy ? data.qualityNote.replaceAll(data.lotId, 'L-' + suffix + '-A') : 'Nessuna non conformità registrata sul nuovo capo.',
      ...(copy ? {} : { brief: '', techGenerated: false, sampleApproved: false, sampleChecks: [false, false, false], produced: 0, reworks: 0, qualityScore: 100, qualityResolved: true, productionDays: [], purchaseOrders: [], wholesaleOrders: [], retailSold: 0, shipments: [], lifecycle: [] }),
      events: [{ id: crypto.randomUUID(), text: 'Creato il capo ' + title.trim(), module: 21, time: activityTime(), at: new Date().toISOString(), actor: profileActor(data.profile) }] };
    setWorkspace(current => ({ ...current, activeId: code, hasSelectedStyle: true, items: [...current.items, item] }));
    notify('Capo creato: ' + item.title);
    return true;
  }
  function updateTask(id, patch) {
    const previous = workspace.tasks.find(task => task.id === id);
    if (!previous || !patch || typeof patch !== 'object') return false;
    const changes = Object.fromEntries(['title', 'styleId', 'moduleId', 'status', 'priority', 'due', 'note'].filter(key => Object.hasOwn(patch, key)).map(key => [key, patch[key]]));
    if (!Object.keys(changes).length) return false;
    const next = { ...previous, ...changes };
    if (!validTask(next, workspace.items)) return false;
    next.title = next.title.trim();
    setWorkspace(current => ({ ...current, tasks: current.tasks.map(task => task.id === id ? { ...task, ...changes, title: next.title } : task) }));
    notify(next.status !== previous.status ? `Attività ${next.status === 'Completata' ? 'completata' : 'aggiornata'}` : 'Attività aggiornata');
    return true;
  }
  function createTask(input) {
    if (!input || typeof input !== 'object') return false;
    const task = { id: crypto.randomUUID(), title: input.title, styleId: input.styleId, moduleId: input.moduleId, due: input.due, priority: input.priority ?? 'Media', note: input.note ?? '', status: input.status ?? 'Da fare', assignee: profileActor(data.profile), demo: true };
    if (!validTask(task, workspace.items)) return false;
    task.title = task.title.trim();
    setWorkspace(current => {
      const profile = current.items.find(item => item.styleId === current.activeId).profile;
      const actor = profileActor(profile);
      const assignment = { id: crypto.randomUUID(), type: 'assign', styleId: task.styleId, moduleId: task.moduleId, title: `Nuova attività: ${task.title}`, body: task.note || 'Attività aggiunta alla tua lista.', actor, at: new Date().toISOString(), read: false, replies: [], demo: true };
      return { ...current, tasks: [{ ...task, assignee: actor }, ...current.tasks], inbox: current.preferences.pushAssignments === false ? current.inbox : [assignment, ...current.inbox] };
    });
    notify('Attività creata');
    return true;
  }
  function markInboxRead(id, read = true) {
    setWorkspace(current => ({ ...current, inbox: current.inbox.map(item => item.id === id ? { ...item, read: Boolean(read) } : item) }));
  }
  function markAllInboxRead() {
    setWorkspace(current => ({ ...current, inbox: current.inbox.map(item => ({ ...item, read: true })) }));
    notify('Inbox segnata come letta');
  }
  function replyInbox(id, body) {
    if (typeof body !== 'string' || !body.trim() || body.trim().length > 2000 || !workspace.inbox.some(item => item.id === id)) return false;
    const reply = { id: crypto.randomUUID(), body: body.trim(), actor: profileActor(data.profile), at: new Date().toISOString() };
    setWorkspace(current => ({ ...current, inbox: current.inbox.map(item => item.id === id ? { ...item, read: true, replies: [...item.replies, reply] } : item) }));
    notify('Risposta salvata nella demo');
    return true;
  }
  function updatePreferences(patch) {
    const booleanPreferences = ['moduleAlerts', 'productNews', 'emailDigest', 'emailMentions', 'pushAssignments', 'pushDeadlines', 'mentionComments', 'assignmentReminders', 'twoFactorEnabled'];
    const changes = Object.fromEntries(booleanPreferences.filter(key => typeof patch?.[key] === 'boolean').map(key => [key, patch[key]]));
    const choices = { theme: ['light', 'dark', 'system'], accent: ['indigo', 'blue', 'violet', 'teal', 'rose', 'graphite'], sideDensity: ['comfortable', 'compact'], taskDensity: ['comfortable', 'compact'], motion: ['system', 'reduce'] };
    choices.language = ['it', 'en'];
    choices.contentLanguage = ['it', 'en'];
    choices.timezone = ['Europe/Rome', 'Europe/Paris', 'Europe/London', 'America/New_York'];
    choices.dateFormat = ['local', 'iso'];
    choices.timeFormat = ['24h', '12h'];
    choices.weekStartsOn = ['monday', 'sunday'];
    choices.defaultLanding = ['home', 'my-tasks', 'inbox'];
    for (const [key, values] of Object.entries(choices)) if (values.includes(patch?.[key])) changes[key] = patch[key];
    if (typeof patch?.workspaceName === 'string' && patch.workspaceName.trim().length > 0 && patch.workspaceName.trim().length <= 60) changes.workspaceName = patch.workspaceName.trim();
    setWorkspace(current => ({ ...current, preferences: { ...current.preferences, ...changes } }));
    notify('Preferenze salvate');
  }
  return <Context.Provider value={{ data, notice, hasSelectedStyle: workspace.hasSelectedStyle, products, workspaceItems: workspace.items, tasks: workspace.tasks, inbox: workspace.inbox, preferences: workspace.preferences, updateTask, createTask, markInboxRead, markAllInboxRead, replyInbox, updatePreferences, styles: workspace.items.map(({ styleId, title, collection, variant, identityAssigned, category }) => ({ styleId, title, collection, variant, identityAssigned, category })), selectStyle, createStyle, commit, notify, collectionData, commitCollection, ...totals(data) }}>{children}</Context.Provider>;
}
export const useDemo = () => useContext(Context);
