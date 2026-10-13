import React, { useRef, useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { download } from './exportFiles.js';
import { Badge, Button, Card, Dialog, Field, Icon, Tabs } from './ui.jsx';
import { creativeDefaults, prepareDirection, directionPresets } from './creativeData.js';
import { readSketchFile as readFile, sketchHandoff } from './sketchHandoff.js';
import { productMedia } from './productData.js';
import { mediaSrc } from './Media.jsx';
import './creative.css';
import './technical.css';

export default function CreativePage({ onNavigate }) {
  const { data, saveCreative, notify, productDirection, saveProductDirection } = useDemo();
  const creative = data.creative || creativeDefaults();
  const c = productDirection;
  const inputs = creative.inputs;
  const route = creative.route || 'upload';
  const refs = creative.referenceFiles || [];
  const hasDirection = c.directionRevision > 0;
  const [replacing, setReplacing] = useState(null);
  const concept = creative.concept?.moodboardOrigin === 'Spunti' ? { ...creative.concept, moodboard: c.moodboard } : creative.concept;
  const paletteChosen = Boolean(concept?.paletteChosen || concept?.palette.length);
  const moodboardChosen = Boolean(concept?.moodboardChosen || concept?.moodboard.length);
  const canContinue = Boolean(concept?.sketch?.src && data.identityAssigned && paletteChosen && moodboardChosen);
  const pendingChoices = !concept ? ['Carica lo schizzo finale'] : [!paletteChosen && 'Scegli la palette o lasciala vuota', !moodboardChosen && 'Scegli il moodboard o lascialo vuoto'].filter(Boolean);
  const [prompt, setPrompt] = useState('');
  const [resultView, setResultView] = useState('Moodboard');
  const [fileView, setFileView] = useState('Schizzo');
  const [studioView, setStudioView] = useState(hasDirection ? 'Spunti' : 'Brief');
  const [moodPage, setMoodPage] = useState(0);
  const activeMoodPage = Math.max(0, Math.min(moodPage, Math.ceil(c.moodboard.length / 2) - 1));
  const [opened, setOpened] = useState(null);
  const [drag, setDrag] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const finalInput = useRef(null); const referenceInput = useRef(null); const moodInput = useRef(null);
  function update(patch, message) { saveCreative(previous => ({ creative: { ...(previous.creative || creativeDefaults()), ...patch } }), message, 1); }
  function generate() {
    const revisionPrompt = hasDirection ? prompt.trim() : '';
    const next = prepareDirection(inputs, revisionPrompt, c, data);
    saveProductDirection({ ...next, directionHistory: [] }, hasDirection ? 'Spunti sostituiti con una nuova generazione · demo' : 'Moodboard e palette preparati · demo');
    update({ round: creative.round + 1, inputSnapshot: { ...inputs }, lastPrompt: revisionPrompt });
    setPrompt('');
    setResultView('Moodboard'); setStudioView('Spunti'); setMoodPage(0);
  }
  function uploadFinal(file) {
    readFile(file, sketch => {
      saveCreative(previous => sketchHandoff(previous, sketch), `Schizzo caricato · Style ID ${data.styleId}`, 1);
      setFileView('Schizzo');
    }, notify);
  }
  async function uploadDemo() {
    setDemoLoading(true);
    try {
      const response = await fetch(mediaSrc(productMedia(data, 'sketch')));
      if (!response.ok) throw new Error('Demo sketch unavailable');
      const blob = await response.blob();
      uploadFinal(new File([blob], `${data.styleId}-schizzo-demo.webp`, { type: 'image/webp' }));
    } catch {
      notify('Non è stato possibile caricare lo schizzo demo. Riprova.');
    } finally {
      setDemoLoading(false);
    }
  }
  function updateConcept(patch, message) { saveCreative(previous => ({ creative: { ...previous.creative, concept: { ...previous.creative.concept, ...patch, ...('palette' in patch ? { paletteChosen: true } : {}), ...('moodboard' in patch ? { moodboardChosen: true } : {}) } } }), message, 1); }
  function attachPalette() { updateConcept({ palette: structuredClone(c.palette), paletteOrigin: 'Spunti' }, 'Palette degli spunti collegata allo schizzo'); }
  function manualPalette() { updateConcept({ palette: Array.from({ length: 6 }, (_, i) => ({ name: `Colore ${i + 1}`, color: '#EFEAE1' })), paletteOrigin: 'Manuale' }, 'Palette manuale da compilare'); }
  function conceptColor(index, patch) { updateConcept({ palette: concept.palette.map((color, i) => i === index ? { ...color, ...patch } : color), paletteOrigin: 'Manuale' }); }
  function manualMood(file) { readFile(file, ref => {
    if (ref.type === 'application/pdf') { notify('Per il moodboard scegli un’immagine.'); return; }
    updateConcept({ moodboard: [...concept.moodboard, { ...ref, caption: '' }], moodboardOrigin: 'Manuale' }, 'Riferimento collegato allo schizzo');
  }, notify); }
  function setColor(index, patch) { saveProductDirection({ palette: c.palette.map((color, i) => i === index ? { ...color, ...patch } : color) }); }
  function replaceMood(file) { readFile(file, ref => {
    if (ref.type === 'application/pdf') { notify('Per il moodboard scegli un’immagine JPG, PNG o WebP.'); return; }
    saveProductDirection(previous => ({ moodboard: replacing ? previous.moodboard.map(item => item.id === replacing ? { ...item, src: ref.src, type: ref.type } : item) : [...previous.moodboard, { ...ref, atmosphere: true, caption: '' }] }), replacing ? 'Riferimento del moodboard sostituito' : 'Riferimento aggiunto al moodboard');
    setReplacing(null);
  }, notify); }
  function editReference(id, patch) { saveProductDirection(previous => ({ moodboard: previous.moodboard.map(ref => ref.id === id ? { ...ref, ...patch } : ref) })); }
  function chooseReference(id = null) { setReplacing(id); moodInput.current.click(); }
  return <div className="dw-creative">
    <div className="dw-tabs dw-tabs-underline dw-creative-routes" role="group" aria-label="Come vuoi iniziare?">
      <button type="button" aria-pressed={route === 'upload'} onClick={() => update({ route: 'upload' })}>Carica il tuo schizzo</button>
      <button type="button" aria-pressed={route === 'inspire'} onClick={() => update({ route: 'inspire' })}>Genera spunti</button>
    </div>
    {route === 'inspire' && <><div className="dw-creative-mobile-switch" role="group" aria-label="Area creativa">{['Brief', 'Spunti'].map(name => <button key={name} type="button" aria-pressed={studioView === name} onClick={() => setStudioView(name)}>{name}</button>)}</div><div className="dw-creative-studio" data-area={studioView}>
      <div className="dw-creative-inputs">
        <Card title="Brief creativo" note={data.collection}><div className="dw-stack">
          <Field label="Richiesta del cliente"><textarea rows={3} maxLength={1500} value={inputs.request} onChange={e => update({ inputs: { ...inputs, request: e.target.value } })} placeholder="Che capo desidera? Per quale occasione?" /></Field>
          <details className="dw-creative-more"><summary>Brand, storico e target <span>Facoltativi</span></summary><div className="dw-stack">
          <Field label="Identità del brand"><textarea rows={2} maxLength={600} value={inputs.brand} onChange={e => update({ inputs: { ...inputs, brand: e.target.value } })} /></Field>
          <Field label="Collezioni e vendite passate"><textarea rows={3} maxLength={1000} value={inputs.history} onChange={e => update({ inputs: { ...inputs, history: e.target.value } })} /></Field>
          <Field label="Target"><input maxLength={150} value={inputs.target} onChange={e => update({ inputs: { ...inputs, target: e.target.value } })} /></Field>
          </div></details>
          <details className="dw-creative-more" open={refs.length > 0 || undefined}><summary>Schizzo e riferimenti <span>{refs.length ? `${refs.length} allegati` : 'Facoltativi'}</span></summary><input ref={referenceInput} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => { readFile(e.target.files[0], ref => saveCreative(previous => ({ creative: { ...previous.creative, referenceFiles: [...(previous.creative.referenceFiles || []), ref] } }), 'Riferimento creativo caricato', 1), notify); e.target.value = ''; }} /><div className="dw-creative-reference-tools"><Button icon="plus" onClick={() => referenceInput.current.click()}>Carica riferimento</Button><span>JPG, PNG, WebP o PDF · 8 MB</span></div><div className="dw-creative-input-refs">{refs.map(ref => <div className="dw-creative-ref" key={ref.id}><button type="button" onClick={() => setOpened(ref)}>{ref.type === 'application/pdf' ? <Icon name="file" /> : <img src={ref.src} alt={ref.name} />}<span>{ref.name}</span></button><Button icon="close" aria-label={`Rimuovi ${ref.name}`} onClick={() => update({ referenceFiles: refs.filter(item => item.id !== ref.id) }, 'Riferimento creativo rimosso')} /></div>)}</div></details>
          <div className="dw-creative-brief-footer"><span className="dw-creative-note">Generazione simulata · demo</span><Button primary disabled={!(inputs.request.trim() || inputs.brand.trim() || refs.length)} onClick={generate}>{hasDirection ? 'Rigenera dagli input' : 'Genera moodboard e palette'}</Button></div>
        </div></Card>
      </div>
      <div className="dw-creative-results">
        {!hasDirection ? <Card title="Moodboard e palette" note="Il tuo spazio di ricerca"><div className="dw-creative-empty"><strong>Inizia dal brief creativo</strong><p>Descrivi la richiesta e premi “Genera moodboard e palette”. Qui potrai scegliere e modificare i riferimenti.</p></div></Card> : <>
          <div className="dw-creative-result-toolbar"><Tabs items={['Moodboard', 'Palette', 'Rivedi']} selected={resultView} onChange={setResultView} label="Risultati creativi" variant="underline" /><Button icon="file" onClick={() => update({ route: 'upload' })}>Disegno finale</Button></div>
          <section className="dw-creative-result-panel" aria-label="Moodboard" hidden={resultView !== 'Moodboard'}>
          <Card title="Moodboard" note={`Atmosfera astratta · ${data.title} · ${data.variant}`} actions={<Button icon="plus" onClick={() => chooseReference()}>Aggiungi immagine</Button>}>
            <input ref={moodInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { replaceMood(e.target.files[0]); e.target.value = ''; }} />
            <div className="dw-mood-grid">{c.moodboard.map((ref, index) => <article className={`dw-mood-reference ${Math.floor(index / 2) === activeMoodPage ? '' : 'dw-mood-mobile-hidden'}`} key={ref.id}>
              <Button icon="close" className="dw-mood-remove" aria-label={`Rimuovi dal moodboard ${ref.name}`} onClick={() => saveProductDirection(previous => ({ moodboard: previous.moodboard.filter(item => item.id !== ref.id) }), 'Riferimento rimosso dal moodboard')} />
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
          <Card title="Rivedi la direzione" note="Puoi chiedere modifiche quante volte vuoi"><form className="dw-stack" onSubmit={e => { e.preventDefault(); generate(); }}><Field label="Cosa vuoi cambiare?"><textarea rows={3} maxLength={800} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Più freddo, accenti salvia, un’atmosfera più urbana…" /></Field><div className="dw-actions"><Button primary type="submit" disabled={!prompt.trim()}>Applica modifica</Button></div></form></Card>

          </section>
        </>}
      </div>
    </div></>}
    {route === 'upload' && <Card className="dw-concept-card" title="Scheda del capo" actions={<Badge>{concept ? data.styleId : 'Bozza'}</Badge>}>
      <input ref={finalInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={e => { uploadFinal(e.target.files[0]); e.target.value = ''; }} />
      {concept && <div className="dw-sketch-toolbar"><Tabs items={['Schizzo', 'Moodboard', 'Palette']} selected={fileView} onChange={setFileView} label="Scheda del capo" variant="underline" /></div>}
      {(!concept || fileView === 'Schizzo') && <div className="dw-creative-handoff"><div className={`dw-creative-drop ${concept ? 'has-file' : ''} ${drag ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); uploadFinal(e.dataTransfer.files[0]); }}>
        {concept ? <>{concept.sketch.type === 'application/pdf' ? <span className="dw-creative-pdf"><Icon name="file" size={38} />PDF</span> : <button type="button" onClick={() => setOpened(concept.sketch)} aria-label="Apri disegno finale"><img src={concept.sketch.src} alt="Schizzo dello stilista" /></button>}<strong>{concept.sketch.name}</strong><div className="dw-concept-file-actions"><a className="dw-btn" href={concept.sketch.src} download={concept.sketch.name}><Icon name="download" size={16} />Scarica</a><Button icon="pencil" onClick={() => finalInput.current.click()}>Cambia schizzo</Button></div></> : <><Icon name="pencil" size={30} /><strong>Trascina il tuo schizzo</strong><p>Foto, file dal tablet o PDF.</p><div className="dw-concept-file-actions"><Button icon="plus" onClick={() => finalInput.current.click()}>Carica schizzo</Button><Button icon="file" disabled={demoLoading} onClick={uploadDemo}>{demoLoading ? 'Caricamento…' : 'Carica schizzo demo'}</Button></div></>}
        <small>JPG, PNG, WebP o PDF · fino a 8 MB</small>
      </div><div className="dw-creative-deliverables"><h3>{concept ? 'Riepilogo' : 'Prima di proseguire'}</h3><dl><dt>Collezione</dt><dd>{data.collection}</dd><dt>Product / Style ID</dt><dd className="dw-code">{concept ? data.styleId : 'Assegnato al caricamento'}</dd></dl>
        {concept ? <><details className="dw-concept-verification"><summary>Verifica dello schizzo <Badge>Demo</Badge></summary><Field label="Scenario di verifica demo"><select value={concept.sketchKind} onChange={e => updateConcept({ sketchKind: e.target.value })}><option>Matita</option><option>A colori</option><option>PDF non analizzato</option></select></Field><p>La lettura dello schizzo è simulata. Lo stilista decide gli allegati del capo.</p></details><div className="dw-sketch-notice"><Icon name={paletteChosen && moodboardChosen ? 'check' : 'eye'} size={16} /><div className="dw-sketch-attachment-list"><strong>{paletteChosen && moodboardChosen ? 'Scelte salvate' : 'Allegati facoltativi'}</strong><div className="dw-sketch-attachment"><div><strong>Palette</strong><p>{concept.palette.length ? `${concept.palette.length} ${concept.palette.length === 1 ? 'colore' : 'colori'} · ${concept.paletteOrigin}` : paletteChosen ? 'Lasciata vuota' : 'Non collegata'}</p></div><Button aria-label={paletteChosen ? 'Modifica palette' : 'Scegli la palette'} onClick={() => setFileView('Palette')}>{paletteChosen ? 'Modifica' : 'Scegli'}</Button></div><div className="dw-sketch-attachment"><div><strong>Moodboard</strong><p>{concept.moodboard.length ? `${concept.moodboard.length} ${concept.moodboard.length === 1 ? 'immagine' : 'immagini'} · ${concept.moodboardOrigin}` : moodboardChosen ? 'Lasciato vuoto' : 'Non collegato'}</p></div><Button aria-label={moodboardChosen ? 'Modifica moodboard' : 'Scegli il moodboard'} onClick={() => setFileView('Moodboard')}>{moodboardChosen ? 'Modifica' : 'Scegli'}</Button></div></div></div></> : <p>Carica lo schizzo, poi decidi se collegare moodboard e palette o lasciarli vuoti. Non serve generare spunti.</p>}
      </div></div>}
      {concept && fileView === 'Moodboard' && <div className="dw-stack"><div className="dw-sketch-notice"><div><strong>Moodboard · {concept.moodboardOrigin}</strong><p>{concept.moodboard.length ? 'Queste immagini sono già collegate al capo. Puoi aggiungere altri riferimenti o cambiare la tua scelta.' : moodboardChosen ? 'Hai scelto di lasciare il moodboard vuoto. Puoi aggiungere immagini quando vuoi.' : 'Il disegno non contiene abbastanza informazioni per ricavare le atmosfere. Puoi collegare gli spunti, caricare riferimenti o lasciarlo vuoto.'}</p></div></div><div className="dw-actions">{c.moodboard.length > 0 && <Button onClick={() => updateConcept({ moodboard: structuredClone(c.moodboard), moodboardOrigin: 'Spunti' }, 'Moodboard degli spunti collegato')}>Usa moodboard degli spunti</Button>}<Button icon="plus" onClick={() => moodInput.current.click()}>Carica immagine</Button><Button onClick={() => updateConcept({ moodboard: [], moodboardOrigin: 'Vuoto' }, 'Moodboard lasciato vuoto')}>Lascia vuoto</Button></div><input ref={moodInput} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => { manualMood(e.target.files[0]); e.target.value = ''; }} /><div className="dw-sketch-refs">{concept.moodboard.map(ref => <button type="button" key={ref.id} onClick={() => setOpened(ref)}><img src={ref.src} alt={ref.caption || ref.name} /><span>{ref.name}</span></button>)}</div></div>}
      {concept && fileView === 'Palette' && <div className="dw-stack"><div className="dw-sketch-notice"><div><strong>Palette · {concept.paletteOrigin}</strong><p>{concept.palette.length ? 'Questa palette è già collegata al capo. Puoi modificare i colori o cambiare la tua scelta.' : paletteChosen ? 'Hai scelto di lasciare la palette vuota. Puoi definirla qui o nel modulo 2.' : concept.sketchKind === 'A colori' ? 'La lettura dei colori è simulata: applica e verifica la palette di esempio oppure scegli un’altra origine.' : 'La palette non è ricavabile in questo scenario. Usa gli spunti, compilala a mano o completala nel modulo 2.'}</p></div></div><div className="dw-actions">{concept.sketchKind === 'A colori' && <Button onClick={() => updateConcept({ palette: structuredClone(directionPresets.warm.palette), paletteOrigin: 'Ricavata dallo schizzo · demo' }, 'Palette simulata dallo schizzo scelta dallo stilista')}>Prova estrazione demo</Button>}{c.palette.length > 0 && <Button onClick={attachPalette}>Usa palette degli spunti</Button>}<Button onClick={manualPalette}>Compila a mano</Button><Button onClick={() => updateConcept({ palette: [], paletteOrigin: 'Vuota' }, 'Palette lasciata vuota')}>Lascia vuota</Button></div><div className="dw-creative-colors">{concept.palette.map((color, i) => <div key={i}><input type="color" aria-label={`Colore allegato ${i + 1}`} value={color.color} onChange={e => conceptColor(i, { color: e.target.value.toUpperCase() })} /><Field label={`Nome colore allegato ${i + 1}`}><input value={color.name} onChange={e => conceptColor(i, { name: e.target.value })} maxLength={50} /></Field><span className="dw-code">≈ {color.color}</span></div>)}</div></div>}

      <footer className="dw-concept-footer">
        <div className="dw-concept-next"><p id="concept-next-status"><Icon name={canContinue ? 'check' : 'clock'} size={16} />{canContinue ? 'Pronto per la fase 2' : pendingChoices.join(' · ')}</p>{concept && <Button icon="download" onClick={() => download(`${data.styleId}-concept.json`, JSON.stringify({ styleId: data.styleId, title: data.title, collection: data.collection, ...concept }, null, 2), 'application/json')}>Scarica scheda capo</Button>}</div>
        <Button primary className="dw-concept-continue" disabled={!canContinue} aria-describedby="concept-next-status" onClick={() => onNavigate(2)}>Vai al disegno tecnico <Icon name="arrow" size={16} /></Button>
      </footer>
    </Card>}
    {opened && <Dialog wide title={opened.name} note="Anteprima" onClose={() => setOpened(null)}>{opened.type === 'application/pdf' ? <div className="dw-creative-pdf"><Icon name="file" size={38} /><strong>{opened.name}</strong></div> : <img className="dw-creative-preview" src={opened.src} alt={opened.name} />}<a className="dw-btn" href={opened.src} download={opened.name}>Scarica file</a></Dialog>}
  </div>;
}
