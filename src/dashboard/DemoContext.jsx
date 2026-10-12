import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { profileActor, validTask } from './workspaceData.js';
import { groupProducts } from './productData.js';
import { fabrics, totals } from './domain.js';
import { createDemoWorkspace } from './demoDefaults.js';
import * as productActions from './productActions.js';
import { productSections, saveProductSection, saveCollectionDirection as saveDirection, collectionFor, updateProfile as saveProfile } from './workspaceCommands.js';
import useWorkspacePersistence from './useWorkspacePersistence.js';
import { download } from './exportFiles.js';
import { preferenceBooleans, preferenceChoices, workspaceSchemaVersion } from './workspaceSchema.js';
import { Button, Card } from './ui.jsx';

const initial = createDemoWorkspace().items[0];
const Context = createContext(null);
export function DemoProvider({ children }) {
  const persistence = useWorkspacePersistence();
  const { workspace, mutate, storage, loadError } = persistence;
  const [notice, setNotice] = useState('');
  const timeout = useRef(null);
  useEffect(() => () => clearTimeout(timeout.current), []);
  function notify(message) {
    setNotice(message);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setNotice(''), 3600);
  }
  function run(action, message) {
    try { const success = mutate(action); if (success && message) notify(message); return success; }
    catch (error) { notify(error.message || 'La modifica non è stata applicata.'); return false; }
  }
  if (!workspace || storage.status === 'loading') return <div className="dw-app"><main className="dw-page"><Card title={loadError ? 'Non è stato possibile aprire i dati salvati' : 'Apertura dello spazio di lavoro'}>
    {loadError ? <><p role="alert">{loadError.code ? loadError.message : 'Il browser non ha reso disponibili i dati salvati.'} I dati originali sono conservati.</p><p>Puoi riprovare oppure aprire una sessione temporanea. Le modifiche temporanee non sostituiscono il salvataggio esistente.</p><div className="dw-actions"><Button onClick={persistence.retryLoad}>Riprova</Button><Button onClick={persistence.openTemporary}>Apri sessione temporanea</Button>{loadError.record && <Button onClick={() => download('weave-dati-da-recuperare.json', JSON.stringify(loadError.record, null, 2), 'application/json')}>Scarica dati originali</Button>}</div></> : <p role="status">Caricamento dei capi e delle modifiche salvate su questo dispositivo…</p>}
  </Card></main></div>;
  const data = workspace.items.find(item => item.id === workspace.activeProductId) || workspace.items.find(item => item.styleId === workspace.activeId);
  const targetId = data.id;
  const products = groupProducts(workspace.items, workspace.activeId, workspace.selectedVariants, fabrics);
  const collectionData = collectionFor(workspace, data.collection);
  const setWorkspace = updater => run(updater);
  const editorialActions = Object.fromEntries(Object.keys(productSections).map(section => [section, (patch, message, module) => run(current => saveProductSection(current, targetId, section, patch, message, module), message)]));
  const selectStyle = identity => run(current => productActions.selectStyle(current, identity));
  const createStyle = input => run(current => productActions.createStyle(current, input, targetId, { template: initial }), 'Capo creato: ' + (input?.title || ''));
  const updateProductMetadata = input => run(current => productActions.updateProductMetadata(current, targetId, input));
  const recordRetailSale = () => run(current => productActions.recordRetailSale(current, targetId), 'Vendita retail registrata');
  const recordProduction = quantity => run(current => productActions.recordProduction(current, targetId, quantity), 'Avanzamento produzione registrato');
  const approveSample = () => run(current => productActions.approveSample(current, targetId), 'Campione approvato');
  const createWholesaleOrder = input => run(current => productActions.createWholesaleOrder(current, targetId, input), 'Ordine wholesale creato');
  const createPurchaseOrder = input => run(current => productActions.createPurchaseOrder(current, targetId, input), 'Ordine di acquisto creato');
  const recordLifecycleEvent = input => run(current => productActions.recordLifecycleEvent(current, targetId, input), 'Evento del ciclo di vita registrato');
  const createShipment = input => run(current => productActions.createShipment(current, targetId, input), 'Spedizione creata');
  const confirmShipment = identity => run(current => productActions.confirmShipment(current, targetId, identity), 'Consegna confermata');
  const updateProfile = input => run(current => saveProfile(current, input));
  const saveCollectionDirection = (patch, message) => run(current => saveDirection(current, targetId, patch, message), message);
  const exportWorkspace = () => download('weave-spazio-locale.json', JSON.stringify({ version: workspaceSchemaVersion, workspace }, null, 2), 'application/json');
  function updateTask(id, patch) {
    if (!patch || typeof patch !== 'object') return false;
    const changes = Object.fromEntries(['title', 'styleId', 'moduleId', 'status', 'priority', 'due', 'note'].filter(key => Object.hasOwn(patch, key)).map(key => [key, patch[key]]));
    if (!Object.keys(changes).length) return false;
    let message;
    const success = run(current => {
      const previous = current.tasks.find(task => task.id === id);
      const next = previous && { ...previous, ...changes };
      if (!validTask(next, current.items)) throw new Error('Verifica i dati dell’attività.');
      next.title = next.title.trim();
      message = next.status !== previous.status && next.status === 'Completata' ? 'Attività completata' : 'Attività aggiornata';
      return { ...current, tasks: current.tasks.map(task => task.id === id ? next : task) };
    });
    if (success) notify(message);
    return success;
  }
  function createTask(input) {
    if (!input || typeof input !== 'object') return false;
    const task = { id: crypto.randomUUID(), title: input.title, styleId: input.styleId, moduleId: input.moduleId, due: input.due, priority: input.priority ?? 'Media', note: input.note ?? '', status: input.status ?? 'Da fare', assignee: profileActor(data.profile), demo: true };
    return run(current => {
      if (!validTask(task, current.items)) throw new Error('Verifica i dati dell’attività.');
      task.title = task.title.trim();
      const profile = current.items.find(item => item.styleId === current.activeId).profile;
      const actor = profileActor(profile);
      const assignment = { id: crypto.randomUUID(), type: 'assign', styleId: task.styleId, moduleId: task.moduleId, title: `Nuova attività: ${task.title}`, body: task.note || 'Attività aggiunta alla tua lista.', actor, at: new Date().toISOString(), read: false, replies: [], demo: true };
      return { ...current, tasks: [{ ...task, assignee: actor }, ...current.tasks], inbox: current.preferences.pushAssignments === false ? current.inbox : [assignment, ...current.inbox] };
    }, 'Attività creata');
  }
  function markInboxRead(id, read = true) {
    setWorkspace(current => current.inbox.some(item => item.id === id && item.read !== Boolean(read))
      ? { ...current, inbox: current.inbox.map(item => item.id === id ? { ...item, read: Boolean(read) } : item) }
      : current);
  }
  function markAllInboxRead() {
    setWorkspace(current => ({ ...current, inbox: current.inbox.map(item => ({ ...item, read: true })) }));
    notify('Inbox segnata come letta');
  }
  function replyInbox(id, body) {
    if (typeof body !== 'string' || !body.trim() || body.trim().length > 2000) return false;
    return run(current => {
      if (!current.inbox.some(item => item.id === id)) throw new Error('La conversazione non è più disponibile.');
      const profile = current.items.find(item => item.styleId === current.activeId).profile;
      const reply = { id: crypto.randomUUID(), body: body.trim(), actor: profileActor(profile), at: new Date().toISOString() };
      return { ...current, inbox: current.inbox.map(item => item.id === id ? { ...item, read: true, replies: [...item.replies, reply] } : item) };
    }, 'Risposta aggiunta');
  }
  function updatePreferences(patch) {
    const changes = Object.fromEntries(preferenceBooleans.filter(key => typeof patch?.[key] === 'boolean').map(key => [key, patch[key]]));
    const choices = preferenceChoices;
    for (const [key, values] of Object.entries(choices)) if (values.includes(patch?.[key])) changes[key] = patch[key];
    if (typeof patch?.workspaceName === 'string' && patch.workspaceName.trim().length > 0 && patch.workspaceName.trim().length <= 60) changes.workspaceName = patch.workspaceName.trim();
    if (!Object.keys(changes).length) return false;
    return run(current => ({ ...current, preferences: { ...current.preferences, ...changes } }), 'Preferenze aggiornate');
  }
  return <Context.Provider value={{ data, notice, hasSelectedStyle: workspace.hasSelectedStyle, products, workspaceItems: workspace.items, tasks: workspace.tasks, inbox: workspace.inbox, preferences: workspace.preferences, updateTask, createTask, markInboxRead, markAllInboxRead, replyInbox, updatePreferences, styles: workspace.items.map(({ styleId, title, collection, variant, identityAssigned, category }) => ({ styleId, title, collection, variant, identityAssigned, category })), selectStyle, createStyle, updateProductMetadata, recordRetailSale, recordProduction, approveSample, createWholesaleOrder, createPurchaseOrder, recordLifecycleEvent, createShipment, confirmShipment, updateProfile, ...editorialActions, saveCollectionDirection, notify, collectionData, storage, retrySave: persistence.retrySave, reloadSavedWorkspace: persistence.reloadSavedWorkspace, flushWorkspace: persistence.flushWorkspace, exportWorkspace, ...totals(data) }}>{children}</Context.Provider>;
}
export const useDemo = () => useContext(Context);
