import { assertWorkspace, readWorkspaceRecord, WorkspaceDataError, workspaceSchemaVersion } from './workspaceSchema.js';

const databaseName = 'weave-workspace';
const storeName = 'workspaces';
const workspaceKey = 'atelier-local';
let database;
function openDatabase() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new WorkspaceDataError('Il salvataggio locale non è disponibile.', 'unavailable')); return; }
    const request = indexedDB.open(databaseName, 1);
    let rejected = false;
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      rejected = true;
      reject(new WorkspaceDataError('Un’altra scheda impedisce di aprire i dati. Chiudila e riprova.', 'blocked'));
    };
    request.onsuccess = () => {
      const db = request.result;
      if (rejected) { db.close(); return; }
      db.onversionchange = () => { db.close(); database = null; };
      resolve(db);
    };
  }).catch(error => { database = null; throw error; });
  return database;
}
export async function loadWorkspace() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).get(workspaceKey);
    transaction.onabort = () => reject(transaction.error);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      try { resolve(request.result == null ? null : readWorkspaceRecord(request.result)); }
      catch (error) { error.record = request.result; reject(error); }
    };
  });
}
export async function saveWorkspace(workspace, expectedRevision) {
  assertWorkspace(workspace);
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    let record, failure;
    transaction.oncomplete = () => resolve(record);
    transaction.onabort = () => reject(failure || transaction.error || new WorkspaceDataError('Salvataggio non riuscito.'));
    const request = store.get(workspaceKey);
    request.onsuccess = () => {
      try {
        const current = request.result == null ? null : readWorkspaceRecord(request.result);
        if ((current?.revision || 0) !== expectedRevision) throw new WorkspaceDataError('Un’altra scheda ha aggiornato lo spazio. Riapri i dati salvati per continuare.', 'conflict');
        record = { version: workspaceSchemaVersion, revision: expectedRevision + 1, savedAt: new Date().toISOString(), workspace };
        store.put(record, workspaceKey);
      } catch (error) { failure = error; transaction.abort(); }
    };
  });
}
