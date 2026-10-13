import { useEffect, useRef, useState } from 'react';
import { createDemoWorkspace, migrateDemoWorkspace } from './demoDefaults.js';
import { loadWorkspace, saveWorkspace } from './workspaceStore.js';
import { assertWorkspace } from './workspaceSchema.js';

const storageError = error => ({ code: error?.code || 'save-failed', message: error?.code ? error.message : 'Il browser non ha completato il salvataggio. Le modifiche sono ancora disponibili.' });

export async function flushLatestWorkspace(current, saved, save) {
  // A mutation can arrive before React has queued its autosave effect.
  while (current.current !== saved.current) {
    if (!await save(current.current)) return false;
  }
  return true;
}

export default function useWorkspacePersistence() {
  const [workspace, setWorkspace] = useState(null);
  const [storage, setStorage] = useState({ status: 'loading' });
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const current = useRef(null), saved = useRef(null), revision = useRef(0), pending = useRef(null);
  const reloading = useRef(false);
  const enabled = useRef(false), mounted = useRef(true), writer = useRef(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setLoadError(null);
    setStorage({ status: 'loading' });
    loadWorkspace().then(record => {
      if (!active) return;
      const stored = record?.workspace;
      const next = stored ? migrateDemoWorkspace(stored) : createDemoWorkspace();
      if (stored && next !== stored) assertWorkspace(next);
      current.current = next;
      saved.current = stored && next === stored ? stored : null;
      revision.current = record?.revision || 0;
      enabled.current = true;
      setWorkspace(next);
      setStorage(record && next === stored ? { status: 'saved', savedAt: record.savedAt } : { status: 'saving' });
    }).catch(error => {
      if (!active) return;
      enabled.current = false;
      setLoadError(error);
      setStorage({ status: 'error', error: storageError(error) });
    });
    return () => { active = false; };
  }, [loadAttempt]);

  function queueSave(snapshot) {
    if (!enabled.current || !snapshot) return Promise.resolve(false);
    if (saved.current === snapshot && !writer.current) return Promise.resolve(true);
    pending.current = snapshot;
    setStorage(previous => ({ ...previous, status: 'saving', error: null }));
    if (!writer.current) {
      writer.current = (async () => {
        let success = true;
        while (pending.current && enabled.current) {
          const next = pending.current;
          pending.current = null;
          try {
            const record = await saveWorkspace(next, revision.current);
            revision.current = record.revision;
            saved.current = next;
            if (mounted.current && !pending.current && current.current === next) setStorage({ status: 'saved', savedAt: record.savedAt });
          } catch (error) {
            enabled.current = false;
            pending.current = null;
            success = false;
            if (mounted.current) setStorage(previous => ({ ...previous, status: 'error', error: storageError(error) }));
          }
        }
        return success;
      })().finally(() => { writer.current = null; });
    }
    return writer.current;
  }
  useEffect(() => { if (workspace && enabled.current) queueSave(workspace); }, [workspace]);
  useEffect(() => {
    const leave = event => {
      if (current.current && current.current !== saved.current) {
        event.preventDefault(); event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, []);
  function mutate(action) {
    if (reloading.current) throw new Error('Attendi la riapertura dei dati salvati.');
    if (!current.current) return false;
    const next = action(current.current);
    if (next === current.current) return true;
    assertWorkspace(next);
    current.current = next;
    setWorkspace(next);
    return true;
  }
  function retrySave() {
    if (storage.error?.code === 'conflict') return Promise.resolve(false);
    enabled.current = true;
    return queueSave(current.current);
  }
  async function reloadSavedWorkspace() {
    reloading.current = true;
    setStorage(previous => ({ ...previous, status: 'loading' }));
    if (writer.current) await writer.current;
    enabled.current = false;
    pending.current = null;
    try {
      const record = await loadWorkspace();
      if (!record) throw new Error('No saved workspace');
      const next = migrateDemoWorkspace(record.workspace);
      if (next !== record.workspace) assertWorkspace(next);
      revision.current = record.revision;
      current.current = next;
      saved.current = next === record.workspace ? record.workspace : null;
      enabled.current = true;
      setWorkspace(next);
      setStorage(next === record.workspace ? { status: 'saved', savedAt: record.savedAt } : { status: 'saving' });
      return true;
    } catch (error) { setStorage(previous => ({ ...previous, status: 'error', error: storageError(error) })); return false; }
    finally { reloading.current = false; }
  }
  function openTemporary() {
    enabled.current = false;
    current.current = createDemoWorkspace();
    saved.current = current.current;
    setLoadError(null);
    setWorkspace(current.current);
    setStorage({ status: 'temporary' });
  }
  return { workspace, mutate, storage, loadError, retryLoad: () => setLoadAttempt(value => value + 1), openTemporary, retrySave, reloadSavedWorkspace, flushWorkspace: () => storage.status === 'temporary' ? Promise.resolve(current.current === saved.current) : flushLatestWorkspace(current, saved, queueSave) };
}
