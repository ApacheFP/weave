import React, { useEffect, useId, useRef, useState } from 'react';
import { Button, Dialog, Icon } from './ui.jsx';
import './workspace-storage.css';

const labels = {
  loading: 'Caricamento dati…',
  saving: 'Salvataggio…',
  saved: 'Salvato su questo dispositivo',
  error: 'Modifiche non salvate',
  temporary: 'Sessione temporanea',
};
const descriptions = {
  loading: 'Recupero dei dati salvati su questo dispositivo.',
  saving: 'Le ultime modifiche sono in corso di salvataggio. Attendi la conferma prima di chiudere la pagina.',
  saved: 'I dati sono conservati in questo browser, su questo dispositivo.',
  temporary: 'Le modifiche rimangono in memoria durante questa sessione. Scarica una copia per conservarle prima di chiudere la pagina.',
};

export default function WorkspaceStorageStatus({ storage, onRetry, onReload, onExport }) {
  const status = storage?.status || 'temporary';
  const error = storage?.error;
  const conflict = status === 'error' && error?.code === 'conflict';
  const [open, setOpen] = useState(status === 'error');
  const [confirmReload, setConfirmReload] = useState(false);
  const trigger = useRef(null);
  const panelId = useId();
  const label = labels[status] || labels.temporary;
  const savedDate = storage?.savedAt ? new Date(storage.savedAt) : null;
  const savedTime = savedDate && Number.isFinite(savedDate.getTime()) ? savedDate.toLocaleString('it-IT') : '';

  useEffect(() => {
    setOpen(status === 'error');
    setConfirmReload(false);
  }, [status, error?.code, error?.message]);

  function closePanel() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  return <div className="dw-storage-status" data-state={status}>
    <button ref={trigger} className="dw-storage-trigger" type="button" aria-label={label} aria-expanded={open} aria-controls={open ? panelId : undefined} title={savedTime && status === 'saved' ? `${label} · ${savedTime}` : label} onClick={() => setOpen(value => !value)}>
      <Icon name={status === 'error' || status === 'temporary' ? 'triangle-alert' : status === 'saved' ? 'check' : 'clock'} size={14} />
      <span className="dw-storage-label" role="status" aria-live="polite">{label}</span>
    </button>
    {open && <section id={panelId} className="dw-storage-panel" aria-label="Salvataggio locale" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closePanel(); } }}>
      <header><strong>{label}</strong><button className="dw-icon-btn" type="button" aria-label="Chiudi dettagli del salvataggio" onClick={closePanel}><Icon name="close" size={16} /></button></header>
      {status === 'error' ? <div role="alert"><p>{error?.message || 'Non è stato possibile salvare le ultime modifiche.'}</p><p>Le modifiche rimangono disponibili in questa sessione. Scarica una copia prima di chiudere la pagina.</p></div> : <p>{descriptions[status] || descriptions.temporary}</p>}
      {savedTime && <p className="dw-storage-time">Ultimo salvataggio: <time dateTime={savedDate.toISOString()}>{savedTime}</time></p>}
      <div className="dw-storage-actions">
        {status === 'error' && !conflict && onRetry && <Button primary onClick={onRetry}>Riprova salvataggio</Button>}
        {conflict && onReload && <Button primary onClick={() => setConfirmReload(true)}>Ricarica dati salvati</Button>}
        {onExport && status !== 'loading' && <Button icon="download" onClick={onExport}>Scarica una copia</Button>}
      </div>
    </section>}
    {confirmReload && <Dialog title="Ricaricare i dati salvati?" onClose={() => setConfirmReload(false)} className="dw-storage-reload-dialog">
      <p>Le modifiche di questa sessione non ancora salvate saranno scartate. Verranno aperti i dati salvati dall’altra scheda.</p>
      <p>Scarica una copia delle tue modifiche prima di continuare se vuoi conservarle.</p>
      <div className="dw-storage-actions">
        <Button data-autofocus onClick={() => setConfirmReload(false)}>Annulla</Button>
        {onExport && <Button icon="download" onClick={onExport}>Scarica una copia</Button>}
        <Button primary onClick={() => { setConfirmReload(false); onReload?.(); }}>Ricarica e scarta modifiche</Button>
      </div>
    </Dialog>}
  </div>;
}
