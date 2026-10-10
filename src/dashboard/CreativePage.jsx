import React, { useRef, useState } from 'react';
import { download, useDemo } from './DemoContext.jsx';
import { Badge, Button, Card, Dialog, Field, Icon } from './ui.jsx';
import { creativeDefaults, prepareDirection, directionPresets } from './creativeData.js';
import { readSketchFile as readFile, sketchHandoff } from './sketchHandoff.js';
import './creative.css';
import './technical.css';

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
  const [resultView, setResultView] = useState('Moodboard');
  const [fileView, setFileView] = useState('Schizzo');
  const [studioView, setStudioView] = useState(hasDirection ? 'Spunti' : 'Brief');
  const [moodPage, setMoodPage] = useState(0);
  const activeMoodPage = Math.max(0, Math.min(moodPage, Math.ceil(c.moodboard.length / 2) - 1));
  const [opened, setOpened] = useState(null);
  const [drag, setDrag] = useState(false);
  const finalInput = useRef(null); const referenceInput = useRef(null); const moodInput = useRef(null);
  function update(patch, message) { commit(previous => ({ creative: { ...(previous.creative || creativeDefaults()), ...patch } }), message, 1); }
  function generate() {
    const revisionPrompt = hasDirection ? prompt.trim() : '';
    const next = prepareDirection(inputs, revisionPrompt, c);
    commitCollection({ ...next, directionHistory: [] }, hasDirection ? 'Spunti sostituiti con una nuova generazione · demo' : 'Moodboard e palette preparati · demo');
    update({ round: creative.round + 1, inputSnapshot: { ...inputs }, lastPrompt: revisionPrompt });
    setPrompt('');
    setResultView('Moodboard'); setStudioView('Spunti'); setMoodPage(0);
  }
  function uploadFinal(file) {
    readFile(file, sketch => {
      commit(previous => sketchHandoff(previous, sketch), `Schizzo caricato · Style ID ${data.styleId}`, 1);
      setFileView('Schizzo');
    }, notify);
  }
  function updateConcept(patch, message) { commit(previous => ({ creative: { ...previous.creative, concept: { ...previous.creative.concept, ...patch } } }), message, 1); }
  function attachPalette() { updateConcept({ palette: structuredClone(c.palette), paletteOrigin: 'Spunti' }, 'Palette degli spunti collegata allo schizzo'); }
  function manualPalette() { updateConcept({ palette: Array.from({ length: 6 }, (_, i) => ({ name: `Colore ${i + 1}`, color: '#EFEAE1' })), paletteOrigin: 'Manuale' }, 'Palette manuale da compilare'); }
  function conceptColor(index, patch) { updateConcept({ palette: concept.palette.map((color, i) => i === index ? { ...color, ...patch } : color), paletteOrigin: 'Manuale' }); }
  function manualMood(file) { readFile(file, ref => {
    if (ref.type === 'application/pdf') { notify('Per il moodboard scegli un’immagine.'); return; }
    updateConcept({ moodboard: [...concept.moodboard, { ...ref, caption: '' }], moodboardOrigin: 'Manuale' }, 'Riferimento collegato allo schizzo');
  }, notify); }
  function setColor(index, patch) { commitCollection({ palette: c.palette.map((color, i) => i === index ? { ...color, ...patch } : color) }); }
  function replaceMood(file) { readFile(file, ref => {
    if (ref.type === 'application/pdf') { notify('Per il moodboard scegli un’immagine JPG, PNG o WebP.'); return; }
    commitCollection(previous => ({ moodboard: replacing ? previous.moodboard.map(item => item.id === replacing ? { ...item, src: ref.src, type: ref.type } : item) : [...previous.moodboard, { ...ref, atmosphere: true, caption: '' }] }), replacing ? 'Riferimento del moodboard sostituito' : 'Riferimento aggiunto al moodboard');
    setReplacing(null);
  }, notify); }
  function editReference(id, patch) { commitCollection(previous => ({ moodboard: previous.moodboard.map(ref => ref.id === id ? { ...ref, ...patch } : ref) })); }
  function chooseReference(id = null) { setReplacing(id); moodInput.current.click(); }
  return <div className="dw-creative">
    <div className="dw-creative-context"><span><Icon name="shirt" size={16} /><strong>{data.title}</strong><span className="dw-code">{concept ? data.styleId : 'Bozza'}</span></span><Badge>{concept ? 'Schizzo caricato' : 'Disegno da caricare'}</Badge></div>
    <div className="dw-creative-routes" role="group" aria-label="Come vuoi iniziare?">
      <button type="button" aria-pressed={route === 'upload'} onClick={() => update({ route: 'upload' })}><Icon name="file" /><span>Carica il tuo schizzo</span></button>
      <button type="button" aria-pressed={route === 'inspire'} onClick={() => update({ route: 'inspire' })}><Icon name="spark" /><span>Genera spunti</span></button>
    </div>
    {route === 'inspire' && <><div className="dw-creative-mobile-switch" role="group" aria-label="Area creativa">{['Brief', 'Spunti'].map(name => <button key={name} type="button" aria-pressed={studioView === name} onClick={() => setStudioView(name)}>{name}</button>)}</div><div className="dw-creative-studio" data-area={studioView}>
      <div className="dw-creative-inputs">
        <Card title="Brief creativo" note="Da quale idea vuoi partire?"><div className="dw-stack">
          <Field label="Richiesta del cliente"><textarea rows={4} maxLength={1500} value={inputs.request} onChange={e => update({ inputs: { ...inputs, request: e.target.value } })} placeholder="Che capo desidera? Per quale occasione?" /></Field>
          <Button primary icon="spark" disabled={!(inputs.request.trim() || inputs.brand.trim() || refs.length)} onClick={generate}>{hasDirection ? 'Rigenera dagli input' : 'Genera moodboard e palette'}</Button>
          <details className="dw-creative-more"><summary>Brand, storico e target <span>Facoltativi</span></summary><div className="dw-stack">
          <Field label="Identità del brand"><textarea rows={2} maxLength={600} value={inputs.brand} onChange={e => update({ inputs: { ...inputs, brand: e.target.value } })} /></Field>
          <Field label="Collezioni e vendite passate"><textarea rows={3} maxLength={1000} value={inputs.history} onChange={e => update({ inputs: { ...inputs, history: e.target.value } })} /></Field>
          <Field label="Target"><input maxLength={150} value={inputs.target} onChange={e => update({ inputs: { ...inputs, target: e.target.value } })} /></Field>
          </div></details>
          <div className="dw-creative-season"><Icon name="calendar" size={15} />{data.collection}</div>
        </div></Card>
        <Card title="Schizzo provvisorio e riferimenti" note="Facoltativi · anche un disegno parziale"><input ref={referenceInput} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => { readFile(e.target.files[0], ref => commit(previous => ({ creative: { ...previous.creative, referenceFiles: [...(previous.creative.referenceFiles || []), ref] } }), 'Riferimento creativo caricato', 1), notify); e.target.value = ''; }} /><Button icon="plus" onClick={() => referenceInput.current.click()}>Carica riferimento</Button><div className="dw-creative-input-refs">{refs.map(ref => <div className="dw-creative-ref" key={ref.id}><button type="button" onClick={() => setOpened(ref)}>{ref.type === 'application/pdf' ? <Icon name="file" /> : <img src={ref.src} alt={ref.name} />}<span>{ref.name}</span></button><Button icon="close" aria-label={`Rimuovi ${ref.name}`} onClick={() => update({ referenceFiles: refs.filter(item => item.id !== ref.id) }, 'Riferimento creativo rimosso')} /></div>)}</div><p className="dw-creative-note">JPG, PNG, WebP o PDF · fino a 8 MB.</p></Card>
        <p className="dw-creative-note">La ricerca di contesto avviene dietro le quinte. In questa demo la generazione è simulata.</p>
      </div>
      <div className="dw-creative-results">
        {!hasDirection ? <Card title="Moodboard e palette" note="Il tuo spazio di ricerca"><div className="dw-creative-empty"><Icon name="spark" size={24} /><strong>Inizia dal brief creativo</strong><p>Descrivi la richiesta e premi “Genera moodboard e palette”. Qui potrai scegliere e modificare i riferimenti.</p></div></Card> : <>
          <div className="dw-creative-result-toolbar"><div className="dw-creative-result-switch" role="group" aria-label="Risultati creativi" style={{ '--selected-view': ['Moodboard', 'Palette', 'Rivedi'].indexOf(resultView) }}><span className="dw-creative-result-indicator" aria-hidden="true" />{[['Moodboard', 'grid'], ['Palette', 'layers'], ['Rivedi', 'pencil']].map(([name, icon]) => <button type="button" key={name} aria-pressed={resultView === name} onClick={() => setResultView(name)}><Icon name={icon} size={16} /><span>{name}</span></button>)}</div><Button icon="file" onClick={() => update({ route: 'upload' })}>Disegno finale</Button></div>
          <section className="dw-creative-result-panel" aria-label="Moodboard" hidden={resultView !== 'Moodboard'}>
          <Card title="Moodboard" note={`Riferimenti visivi · ${data.collection}`} actions={<Button icon="plus" onClick={() => chooseReference()}>Aggiungi immagine</Button>}>
            <input ref={moodInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { replaceMood(e.target.files[0]); e.target.value = ''; }} />
            <div className="dw-mood-grid">{c.moodboard.map((ref, index) => <article className={`dw-mood-reference ${Math.floor(index / 2) === activeMoodPage ? '' : 'dw-mood-mobile-hidden'}`} key={ref.id}>
              <Button icon="close" className="dw-mood-remove" aria-label={`Rimuovi dal moodboard ${ref.name}`} onClick={() => commitCollection(previous => ({ moodboard: previous.moodboard.filter(item => item.id !== ref.id) }), 'Riferimento rimosso dal moodboard')} />
              <button className="dw-creative-atmosphere" type="button" onClick={() => setOpened(ref)} aria-label={`Ingrandisci ${ref.name}`}><img src={ref.src} alt={ref.caption || ref.name} loading="lazy" decoding="async" /></button>
              <div className="dw-mood-info">
                <strong className="dw-mood-title">{ref.name}</strong>
                {ref.caption && <p className="dw-mood-caption">{ref.caption}</p>}
                <details className="dw-mood-edit"><summary>Modifica testo</summary><div className="dw-stack"><Field label={`Titolo riferimento ${index + 1}`}><input aria-label={`Titolo riferimento ${index + 1}`} value={ref.name} maxLength={80} onChange={e => editReference(ref.id, { name: e.target.value })} /></Field><Field label={`Didascalia riferimento ${index + 1}`}><textarea aria-label={`Didascalia riferimento ${index + 1}`} rows={2} maxLength={500} value={ref.caption || ''} onChange={e => editReference(ref.id, { caption: e.target.value })} /></Field></div></details>
                <div className="dw-mood-actions"><Button icon="pencil" aria-label={`Cambia foto: ${ref.name}`} onClick={() => chooseReference(ref.id)}>Cambia foto</Button></div>
              </div>
            </article>)}</div>
            {c.moodboard.length > 2 && <div className="dw-mood-pagination"><Button icon="back" aria-label="Riferimenti precedenti" disabled={activeMoodPage === 0} onClick={() => setMoodPage(activeMoodPage - 1)} /><span>{activeMoodPage * 2 + 1}–{Math.min(activeMoodPage * 2 + 2, c.moodboard.length)} di {c.moodboard.length}</span><Button icon="arrow" aria-label="Riferimenti successivi" disabled={(activeMoodPage + 1) * 2 >= c.moodboard.length} onClick={() => setMoodPage(activeMoodPage + 1)} /></div>}
            {!c.moodboard.length && <div className="dw-creative-empty"><Icon name="plus" /><p>Aggiungi i tuoi riferimenti oppure rigenera dagli input.</p></div>}
          </Card>
          </section>
          <section className="dw-creative-result-panel" aria-label="Palette" hidden={resultView !== 'Palette'}>
          <Card title="Palette di direzione" note="Sei colori indicativi · codici approssimativi"><div className="dw-creative-colors">{c.palette.map((color, index) => <div key={index}><input type="color" aria-label={`Colore ${index + 1}`} value={color.color} onChange={e => setColor(index, { color: e.target.value.toUpperCase() })} /><Field label={`Nome colore ${index + 1}`}><input value={color.name} maxLength={50} onChange={e => setColor(index, { name: e.target.value })} /></Field><span className="dw-code">≈ {color.color}</span></div>)}</div><p className="dw-creative-note">Cambia i colori e i nomi a mano. Sono una direzione visiva, non codici tessili definitivi.</p></Card>
          </section>
          <section className="dw-creative-result-panel" aria-label="Rivedi" hidden={resultView !== 'Rivedi'}>
          <Card title="Rivedi la direzione" note="Puoi chiedere modifiche quante volte vuoi"><form className="dw-stack" onSubmit={e => { e.preventDefault(); generate(); }}><Field label="Cosa vuoi cambiare?"><textarea rows={3} maxLength={800} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Più freddo, accenti salvia, un’atmosfera più urbana…" /></Field><div className="dw-actions"><Button primary type="submit" icon="spark" disabled={!prompt.trim()}>Applica modifica</Button></div></form></Card>

          </section>
        </>}
      </div>
    </div></>}
    {route === 'upload' && <Card title={concept ? 'Scheda del capo' : 'Carica il tuo schizzo'} note="Foto, file dal tablet o PDF" actions={concept && <Button primary icon="arrow" onClick={() => onNavigate(2)}>Disegno tecnico</Button>}>
      <input ref={finalInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={e => { uploadFinal(e.target.files[0]); e.target.value = ''; }} />
      {concept && <div className="dw-sketch-toolbar"><div className="dw-creative-result-switch" role="group" aria-label="Scheda del capo" style={{ '--selected-view': ['Schizzo', 'Moodboard', 'Palette'].indexOf(fileView) }}><span className="dw-creative-result-indicator" aria-hidden="true" />{['Schizzo', 'Moodboard', 'Palette'].map(name => <button type="button" key={name} aria-pressed={fileView === name} onClick={() => setFileView(name)}>{name}</button>)}</div><span className="dw-code">{data.styleId}</span></div>}
      {(!concept || fileView === 'Schizzo') && <div className="dw-creative-handoff"><div className={`dw-creative-drop ${drag ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); uploadFinal(e.dataTransfer.files[0]); }}>
        {concept ? <>{concept.sketch.type === 'application/pdf' ? <span className="dw-creative-pdf"><Icon name="file" size={38} />PDF</span> : <button type="button" onClick={() => setOpened(concept.sketch)} aria-label="Apri disegno finale"><img src={concept.sketch.src} alt="Schizzo dello stilista" /></button>}<strong>{concept.sketch.name}</strong><a className="dw-btn" href={concept.sketch.src} download={concept.sketch.name}>Scarica schizzo</a></> : <><Icon name="pencil" size={30} /><strong>Trascina il tuo schizzo</strong><p>Il caricamento crea l’identità del capo.</p></>}
        <Button primary={!concept} icon="plus" onClick={() => finalInput.current.click()}>{concept ? 'Cambia schizzo' : 'Carica schizzo'}</Button><small>JPG, PNG, WebP o PDF · fino a 8 MB</small>
      </div><div className="dw-creative-deliverables"><h3>{concept ? data.title : 'Il tuo capo'}</h3><dl><dt>Product / Style ID</dt><dd className="dw-code">{concept ? data.styleId : 'Assegnato al caricamento'}</dd><dt>Collezione</dt><dd>{data.collection}</dd>{concept && <><dt>Moodboard</dt><dd>{concept.moodboardOrigin}</dd><dt>Palette</dt><dd>{concept.paletteOrigin}</dd></>}</dl>
        {concept ? <><p>Lo schizzo è pronto per il modulo 2. Moodboard e palette sono facoltativi.</p><Field label="Scenario di verifica demo"><select value={concept.sketchKind} onChange={e => updateConcept({ sketchKind: e.target.value })}><option>Matita</option><option>A colori</option><option>PDF non analizzato</option></select></Field><div className="dw-sketch-notice"><Icon name="eye" size={16} /><div><strong>Verifica demo · scelta dello stilista</strong><p>{concept.sketchKind === 'A colori' ? 'Puoi provare la palette simulata dallo schizzo e verificarla. Il moodboard non è ricavabile dal disegno.' : 'Palette non ricavabile in questo scenario. Il moodboard non si deduce dal disegno.'}</p><Button onClick={() => setFileView('Palette')}>Scegli la palette</Button><Button onClick={() => setFileView('Moodboard')}>Scegli i riferimenti</Button></div></div><Button icon="download" onClick={() => download(`${data.styleId}-concept.json`, JSON.stringify({ styleId: data.styleId, title: data.title, collection: data.collection, ...concept }, null, 2), 'application/json')}>Scarica scheda capo</Button></> : <p>Puoi proseguire senza moodboard e senza palette. I colori precisi si definiscono nel disegno tecnico.</p>}
      </div></div>}
      {concept && fileView === 'Moodboard' && <div className="dw-stack"><div className="dw-sketch-notice"><div><strong>Moodboard · {concept.moodboardOrigin}</strong><p>Il disegno non contiene abbastanza informazioni per ricavare le atmosfere. Puoi collegare gli spunti, caricare riferimenti o lasciarlo vuoto.</p></div></div><div className="dw-actions">{c.moodboard.length > 0 && <Button onClick={() => updateConcept({ moodboard: structuredClone(c.moodboard), moodboardOrigin: 'Spunti' }, 'Moodboard degli spunti collegato')}>Usa moodboard degli spunti</Button>}<Button icon="plus" onClick={() => moodInput.current.click()}>Carica immagine</Button><Button onClick={() => updateConcept({ moodboard: [], moodboardOrigin: 'Vuoto' }, 'Moodboard lasciato vuoto')}>Lascia vuoto</Button></div><input ref={moodInput} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => { manualMood(e.target.files[0]); e.target.value = ''; }} /><div className="dw-sketch-refs">{concept.moodboard.map(ref => <button type="button" key={ref.id} onClick={() => setOpened(ref)}><img src={ref.src} alt={ref.caption || ref.name} /><span>{ref.name}</span></button>)}</div></div>}
      {concept && fileView === 'Palette' && <div className="dw-stack"><div className="dw-sketch-notice"><div><strong>Palette · {concept.paletteOrigin}</strong><p>{concept.sketchKind === 'A colori' ? 'La lettura dei colori è simulata: applica e verifica la palette di esempio oppure scegli un’altra origine.' : 'La palette non è ricavabile in questo scenario. Usa gli spunti, compilala a mano o completala nel modulo 2.'}</p></div></div><div className="dw-actions">{concept.sketchKind === 'A colori' && <Button onClick={() => updateConcept({ palette: structuredClone(directionPresets.warm.palette), paletteOrigin: 'Ricavata dallo schizzo · demo' }, 'Palette simulata dallo schizzo scelta dallo stilista')}>Prova estrazione demo</Button>}{c.palette.length > 0 && <Button onClick={attachPalette}>Usa palette degli spunti</Button>}<Button onClick={manualPalette}>Compila a mano</Button><Button onClick={() => updateConcept({ palette: [], paletteOrigin: 'Vuota' }, 'Palette lasciata vuota')}>Lascia vuota</Button></div><div className="dw-creative-colors">{concept.palette.map((color, i) => <div key={i}><input type="color" aria-label={`Colore allegato ${i + 1}`} value={color.color} onChange={e => conceptColor(i, { color: e.target.value.toUpperCase() })} /><Field label={`Nome colore allegato ${i + 1}`}><input value={color.name} onChange={e => conceptColor(i, { name: e.target.value })} maxLength={50} /></Field><span className="dw-code">≈ {color.color}</span></div>)}</div></div>}

    </Card>}
    {opened && <Dialog wide title={opened.name} note="Anteprima" onClose={() => setOpened(null)}>{opened.type === 'application/pdf' ? <div className="dw-creative-pdf"><Icon name="file" size={38} /><strong>{opened.name}</strong></div> : <img className="dw-creative-preview" src={opened.src} alt={opened.name} />}<a className="dw-btn" href={opened.src} download={opened.name}>Scarica file</a></Dialog>}
  </div>;
}
