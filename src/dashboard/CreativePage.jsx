import React, { useRef, useState } from 'react';
import { download, useDemo } from './DemoContext.jsx';
import { Badge, Button, Card, Dialog, Field, Icon } from './ui.jsx';
import { creativeDefaults, prepareDirection } from './creativeData.js';
import './creative.css';

function readFile(file, done, notify) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) { notify('Scegli un file JPG, PNG, WebP o PDF fino a 8 MB.'); return; }
  const reader = new FileReader();
  reader.onload = () => done({ id: crypto.randomUUID(), src: reader.result, name: file.name, type: file.type, size: file.size });
  reader.onerror = () => notify('Non è stato possibile leggere il file. Riprova.');
  reader.readAsDataURL(file);
}
export default function CreativePage({ onNavigate }) {
  const { data, commit, notify, collectionData: c, commitCollection } = useDemo();
  const creative = data.creative || creativeDefaults();
  const inputs = creative.inputs;
  const route = creative.route || 'upload';
  const refs = creative.referenceFiles || [];
  const hasDirection = c.directionRevision > 0;
  const [replacing, setReplacing] = useState(null);
  const concept = creative.concept;
  const [prompt, setPrompt] = useState('');
  const [opened, setOpened] = useState(null);
  const [drag, setDrag] = useState(false);
  const finalInput = useRef(null); const referenceInput = useRef(null); const moodInput = useRef(null);
  function update(patch, message) { commit(previous => ({ creative: { ...(previous.creative || creativeDefaults()), ...patch } }), message, 1); }
  function generate() {
    const revisionPrompt = hasDirection ? prompt.trim() : '';
    const next = prepareDirection(inputs, revisionPrompt, c);
    commitCollection(previous => ({ ...next, directionHistory: [...(previous.directionHistory || []), ...(previous.moodboard.length ? [{ moodboard: structuredClone(previous.moodboard), palette: structuredClone(previous.palette), revision: previous.directionRevision }] : [])].slice(-12) }), hasDirection ? 'Direzione creativa rivista · demo' : 'Moodboard e palette di direzione preparati · demo');
    update({ round: creative.round + 1, inputSnapshot: { ...inputs }, lastPrompt: revisionPrompt });
    setPrompt('');
  }
  function uploadFinal(file) {
    readFile(file, sketch => {
      const concept = { sketch, palette: hasDirection ? structuredClone(c.palette) : [], references: structuredClone(refs), moodboard: hasDirection ? structuredClone(c.moodboard) : [], approvedAt: new Date().toISOString(), inputs: { ...inputs }, directionRevision: hasDirection ? c.directionRevision : null };
      commit(previous => ({ creative: { ...(previous.creative || creativeDefaults()), concept }, conceptApproved: true, brief: inputs.request.trim() || inputs.brand.trim(), sketch: sketch.type === 'application/pdf' ? null : sketch.src, sketchFile: sketch, sketchName: sketch.name, techGenerated: false }), `Disegno finale caricato · concept approvato ${data.styleId}`, 1);
    }, notify);
  }
  function setColor(index, patch) { commitCollection({ palette: c.palette.map((color, i) => i === index ? { ...color, ...patch } : color) }); }
  function replaceMood(file) { readFile(file, ref => {
    if (ref.type === 'application/pdf') { notify('Per il moodboard scegli un’immagine JPG, PNG o WebP.'); return; }
    commitCollection(previous => ({ moodboard: replacing ? previous.moodboard.map(item => item.id === replacing ? { ...item, src: ref.src, type: ref.type } : item) : [...previous.moodboard, { ...ref, atmosphere: true, caption: '' }] }), replacing ? 'Riferimento del moodboard sostituito' : 'Riferimento aggiunto al moodboard');
    setReplacing(null);
  }, notify); }
  function editReference(id, patch) { commitCollection(previous => ({ moodboard: previous.moodboard.map(ref => ref.id === id ? { ...ref, ...patch } : ref) })); }
  function chooseReference(id = null) { setReplacing(id); moodInput.current.click(); }
  return <div className="dw-creative">
    <div className="dw-creative-context"><span><Icon name="shirt" size={16} /><strong>{data.title}</strong><span className="dw-code">{data.styleId}</span></span><Badge>{concept ? 'Concept approvato' : 'Disegno da caricare'}</Badge></div>
    <div className="dw-creative-routes" role="group" aria-label="Come vuoi iniziare?">
      <button type="button" aria-pressed={route === 'upload'} onClick={() => update({ route: 'upload' })}><Icon name="file" /><span><strong>Ho già il disegno</strong><small>Carica lo schizzo finale e prosegui</small></span><Icon name="arrow" size={16} /></button>
      <button type="button" aria-pressed={route === 'inspire'} onClick={() => update({ route: 'inspire' })}><Icon name="spark" /><span><strong>Cerco ispirazione</strong><small>Moodboard e palette · facoltativo</small></span><Icon name="arrow" size={16} /></button>
    </div>
    {route === 'inspire' && <div className="dw-creative-studio">
      <div className="dw-creative-inputs">
        <Card title="Il punto di partenza" note="La richiesta del cliente e il contesto del brand"><div className="dw-stack">
          <Field label="Richiesta del cliente"><textarea rows={4} maxLength={1500} value={inputs.request} onChange={e => update({ inputs: { ...inputs, request: e.target.value } })} placeholder="Che capo desidera? Per quale occasione?" /></Field>
          <Field label="Identità del brand"><textarea rows={2} maxLength={600} value={inputs.brand} onChange={e => update({ inputs: { ...inputs, brand: e.target.value } })} /></Field>
          <Field label="Collezioni e vendite passate"><textarea rows={3} maxLength={1000} value={inputs.history} onChange={e => update({ inputs: { ...inputs, history: e.target.value } })} /></Field>
          <Field label="Target"><input maxLength={150} value={inputs.target} onChange={e => update({ inputs: { ...inputs, target: e.target.value } })} /></Field>
          <div className="dw-creative-season"><Icon name="calendar" size={15} />{data.collection}</div>
        </div></Card>
        <Card title="Schizzo provvisorio e riferimenti" note="Facoltativi · anche un disegno parziale"><input ref={referenceInput} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => { readFile(e.target.files[0], ref => commit(previous => ({ creative: { ...previous.creative, referenceFiles: [...(previous.creative.referenceFiles || []), ref] } }), 'Riferimento creativo caricato', 1), notify); e.target.value = ''; }} /><Button icon="plus" onClick={() => referenceInput.current.click()}>Carica riferimento</Button><div className="dw-creative-input-refs">{refs.map(ref => <div className="dw-creative-ref" key={ref.id}><button type="button" onClick={() => setOpened(ref)}>{ref.type === 'application/pdf' ? <Icon name="file" /> : <img src={ref.src} alt={ref.name} />}<span>{ref.name}</span></button><Button icon="close" aria-label={`Rimuovi ${ref.name}`} onClick={() => update({ referenceFiles: refs.filter(item => item.id !== ref.id) }, 'Riferimento creativo rimosso')} /></div>)}</div><p className="dw-creative-note">JPG, PNG, WebP o PDF · fino a 8 MB.</p></Card>
        <Button primary icon="spark" disabled={!(inputs.request.trim() || inputs.brand.trim() || refs.length)} onClick={generate}>{hasDirection ? 'Rigenera dagli input' : 'Genera moodboard e palette'}</Button>
        <p className="dw-creative-note">La ricerca di contesto avviene dietro le quinte. In questa demo la generazione è simulata.</p>
      </div>
      <div className="dw-creative-results">
        {!hasDirection ? <Card title="La tua direzione creativa" note="Condivisa con la collezione"><div className="dw-creative-empty"><Icon name="spark" size={28} /><strong>Da un’idea a un’atmosfera.</strong><p>Inserisci il contesto e genera moodboard e palette. Potrai rivederli liberamente.</p></div></Card> : <>
          <Card title="Moodboard" note={`Riferimenti visivi · ${data.collection}`} actions={<Button icon="plus" onClick={() => chooseReference()}>Aggiungi immagine</Button>}>
            <input ref={moodInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { replaceMood(e.target.files[0]); e.target.value = ''; }} />
            <div className="dw-mood-grid">{c.moodboard.map((ref, index) => <article className="dw-mood-reference" key={ref.id}>
              <button className="dw-creative-atmosphere" type="button" onClick={() => setOpened(ref)} aria-label={`Ingrandisci ${ref.name}`}><img src={ref.src} alt={ref.caption || ref.name} loading="lazy" decoding="async" /></button>
              <div className="dw-mood-info"><Field label={`Titolo riferimento ${index + 1}`}><input value={ref.name} maxLength={80} onChange={e => editReference(ref.id, { name: e.target.value })} /></Field><Field label={`Didascalia riferimento ${index + 1}`}><textarea rows={3} maxLength={500} value={ref.caption || ''} onChange={e => editReference(ref.id, { caption: e.target.value })} /></Field><div className="dw-mood-actions"><Button icon="pencil" aria-label={`Sostituisci ${ref.name}`} onClick={() => chooseReference(ref.id)}>Sostituisci</Button><Button icon="close" aria-label={`Rimuovi dal moodboard ${ref.name}`} onClick={() => commitCollection(previous => ({ moodboard: previous.moodboard.filter(item => item.id !== ref.id) }), 'Riferimento rimosso dal moodboard')} /></div></div>
            </article>)}</div>
            {!c.moodboard.length && <div className="dw-creative-empty"><Icon name="plus" /><p>Aggiungi i tuoi riferimenti oppure rigenera dagli input.</p></div>}
          </Card>
          <Card title="Palette di direzione" note="Sei colori indicativi · codici approssimativi"><div className="dw-creative-colors">{c.palette.map((color, index) => <div key={index}><input type="color" aria-label={`Colore ${index + 1}`} value={color.color} onChange={e => setColor(index, { color: e.target.value.toUpperCase() })} /><Field label={`Nome colore ${index + 1}`}><input value={color.name} maxLength={50} onChange={e => setColor(index, { name: e.target.value })} /></Field><span className="dw-code">≈ {color.color}</span></div>)}</div><p className="dw-creative-note">Cambia i colori e i nomi a mano. Sono una direzione visiva, non codici tessili definitivi.</p></Card>
          <Card title="Rivedi la direzione" note="Puoi chiedere modifiche quante volte vuoi"><form className="dw-stack" onSubmit={e => { e.preventDefault(); generate(); }}><Field label="Cosa vuoi cambiare?"><textarea rows={3} maxLength={800} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Più freddo, accenti salvia, un’atmosfera più urbana…" /></Field><div className="dw-actions"><Button primary type="submit" icon="spark" disabled={!prompt.trim()}>Applica modifica</Button><Button icon="file" onClick={() => update({ route: 'upload' })}>Carica il disegno finale</Button></div></form></Card>
          {(c.directionHistory || []).length > 0 && <details className="dw-creative-history"><summary>Versioni precedenti · {c.directionHistory.length}</summary><div className="dw-stack">{[...c.directionHistory].reverse().map((version, index) => <Button key={index} onClick={() => commitCollection({ moodboard: structuredClone(version.moodboard), palette: structuredClone(version.palette), directionRevision: version.revision }, 'Direzione precedente ripristinata')}>Ripristina versione {version.revision}</Button>)}</div></details>}
        </>}
      </div>
    </div>}
    {route === 'upload' && <Card title={concept ? 'Il tuo disegno finale' : 'Carica il disegno finale'} note="Puoi partire direttamente da qui, senza generare spunti" actions={concept && <Badge>Pronto per il modulo 2</Badge>}>
      <input ref={finalInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={e => { uploadFinal(e.target.files[0]); e.target.value = ''; }} />
      <div className="dw-creative-handoff"><div className={`dw-creative-drop ${drag ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); uploadFinal(e.dataTransfer.files[0]); }}>
        {concept ? <>{concept.sketch.type === 'application/pdf' ? <span className="dw-creative-pdf"><Icon name="file" size={38} />PDF</span> : <button type="button" onClick={() => setOpened(concept.sketch)} aria-label="Apri disegno finale"><img src={concept.sketch.src} alt="Disegno finale dello stilista" /></button>}<strong>{concept.sketch.name}</strong><a className="dw-btn" href={concept.sketch.src} download={concept.sketch.name}><Icon name="download" size={15} />Scarica disegno</a></> : <><Icon name="pencil" size={30} /><strong>Il disegno è il tuo.</strong><p>Trascina una foto, il file dal tablet o un PDF.</p></>}
        <Button primary icon="plus" onClick={() => finalInput.current.click()}>{concept ? 'Sostituisci disegno' : 'Carica disegno finale'}</Button><small>JPG, PNG, WebP o PDF · fino a 8 MB</small>
      </div><div className="dw-creative-deliverables"><h3>{concept ? 'Concept approvato' : 'Il capo nasce dal tuo disegno'}</h3><dl><dt>Product / Style ID</dt><dd className="dw-code">{data.styleId}</dd><dt>Collezione</dt><dd>{data.collection}</dd><dt>Stato</dt><dd>{concept ? 'Concept approvato' : 'In attesa del disegno'}</dd>{concept && <><dt>Palette allegata</dt><dd>{concept.palette.length ? `${concept.palette.length} colori` : 'Non utilizzata'}</dd><dt>Riferimenti</dt><dd>{concept.references.length}</dd></>}</dl><p>Il disegno viene collegato al Product / Style ID del capo. Moodboard e palette, se utilizzati, vengono conservati con il concept. La ricerca facoltativa non è un requisito per proseguire.</p>{concept && <><Button primary icon="arrow" onClick={() => onNavigate(2)}>Vai al disegno tecnico</Button><Button icon="download" onClick={() => download(`${data.styleId}-concept.json`, JSON.stringify({ styleId: data.styleId, title: data.title, collection: data.collection, ...concept }, null, 2), 'application/json')}>Scarica dossier concept</Button></>}</div></div>
    </Card>}
    {opened && <Dialog wide title={opened.name} note="Anteprima" onClose={() => setOpened(null)}>{opened.type === 'application/pdf' ? <div className="dw-creative-pdf"><Icon name="file" size={38} /><strong>{opened.name}</strong></div> : <img className="dw-creative-preview" src={opened.src} alt={opened.name} />}<a className="dw-btn" href={opened.src} download={opened.name}>Scarica file</a></Dialog>}
  </div>;
}
