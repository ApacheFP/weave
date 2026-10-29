import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { download, techPack } from './exportFiles.js';
import { Badge, Button, Card, Dialog, Field, Icon, Tabs } from './ui.jsx';
import { readSketchFile, sketchHandoff } from './sketchHandoff.js';
import { technicalDefaults, versionSnapshot, previewColors, restoreTechnicalVersion, validColors } from './technicalData.js';
import TechnicalDrawing from './TechnicalDrawing.jsx';
import './technical.css';
import ProgramLab from './ProgramLab.jsx';
import { drawingSvg, vectorViews, withArtwork } from './vectorDocument.js';
import { defaultProportions } from './proportions.js';
const VectorEditor = lazy(() => import('./VectorEditor.jsx'));

export default function TechnicalPage({ onNavigate }) {
  const { data, products, saveTechnical, notify } = useDemo();
  const t = data.technical || technicalDefaults(data);
  const [area, setArea] = useState(t.versions.length ? 'Tavola' : 'Input');
  const [side, setSide] = useState('Fronte');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [proportions, setProportions] = useState(defaultProportions);
  const [note, setNote] = useState('');
  const [notePoint, setNotePoint] = useState(null);
  const [compareId, setCompareId] = useState('');
  const [previewColorKey, setPreviewColorKey] = useState('');
  const [editingColor, setEditingColor] = useState(0);
  const input = useRef(null);
  const exportRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState(null);
  const [generating, setGenerating] = useState(false);
  const generationTimer = useRef(null);
  const editorDirty = useRef(false);
  const concept = data.creative?.concept;
  const sketch = data.sketchFile;
  const version = t.versions.find(v => v.id === selectedVersion) || t.versions.find(v => v.id === t.currentId) || t.versions.at(-1);
  const snapshot = version?.snapshot || versionSnapshot(data, t);
  const savedProportions = snapshot.proportions || defaultProportions;
  const proportionsAvailable = side !== 'Dettagli' && !snapshot.artwork?.[side] && !snapshot.programs?.[side];
  const proportionsChanged = proportions.width !== savedProportions.width || proportions.height !== savedProportions.height;
  useEffect(() => { setProportions(snapshot.proportions || defaultProportions); }, [data.id, version?.id, side]);
  const approved = Boolean(version && t.approvedId === version.id);
  useEffect(() => { setGenerating(false); return () => { clearTimeout(generationTimer.current); generationTimer.current = null; }; }, [data.styleId]);
  function update(patch) { saveTechnical({ technical: { ...t, ...patch } }); }
  function addVersion(next, label) {
    const id = crypto.randomUUID();
    const created = { id, number: t.versions.length + 1, note: label, date: new Date().toISOString(), snapshot: structuredClone(next) };
    if (!saveTechnical(previous => {
      const current = previous.technical || technicalDefaults(previous);
      created.number = current.versions.length + 1;
      return { technical: { ...current, versions: [...current.versions, created], currentId: id, colors: next.colors, fit: next.fit, tolerance: next.tolerance }, techGenerated: true };
    }, `Disegno tecnico · ${label}`, 2)) return false;
    setSelectedVersion(id); setArea('Tavola');
    return true;
  }
  function openEditor() {
    editorDirty.current = false;
    const svg = exportRef.current.querySelectorAll('svg')[vectorViews.indexOf(side)];
    setEditor({ snapshot: structuredClone(snapshot), view: side, sourceSvg: drawingSvg(svg) });
  }
  function beforeCloseEditor() { if (!editorDirty.current) return true; setConfirmDiscard(true); return false; }
  function exportedDrawing(view) { return snapshot.artwork?.[view]?.svg || drawingSvg(exportRef.current.querySelectorAll('svg')[vectorViews.indexOf(view)]); }
  function upload(file) { readSketchFile(file, sketch => { clearTimeout(generationTimer.current); generationTimer.current = null; setGenerating(false); saveTechnical(previous => sketchHandoff(previous, sketch, 2), `Schizzo caricato nel modulo 2 · ${data.styleId}`, 2); setSelectedVersion(null); setArea('Input'); }, notify); }
  function generate() {
    if (!sketch || generationTimer.current) return;
    const next = { ...versionSnapshot(data, t), notes: structuredClone(t.notes) };
    setGenerating(true);
    // shortcut: this demo uses a prepared drawing for the selected garment until image generation is connected.
    generationTimer.current = setTimeout(() => {
      generationTimer.current = null;
      setGenerating(false);
      setSide('Fronte');
      addVersion(next, 'Disegno dal riferimento');
    }, 2200);
  }
  function saveMetadata(e) { e.preventDefault(); if (!validColors(t.colors)) { notify('Inserisci nomi e codici colore univoci.'); return; } addVersion({ ...structuredClone(snapshot), colors: structuredClone(t.colors), fit: t.fit, tolerance: Number(t.tolerance) }, 'Colori e specifiche aggiornati'); }
  function approve() {
    if (!version || !validColors(version.snapshot.colors)) { notify('Definisci almeno una variante con nome e codice univoco prima di approvare.'); setArea('Colori'); return; }
    const s = version.snapshot;
    saveTechnical({ technical: { ...t, approvedId: version.id, currentId: version.id, colors: structuredClone(s.colors), fit: s.fit, tolerance: s.tolerance, requirements: s.requirements, constraints: s.constraints, notes: structuredClone(s.notes) }, measurements: structuredClone(s.measurements), seam: s.parts.seam, variant: s.colors[0].name, techGenerated: true }, `Approvato disegno tecnico v${version.number}`, 2);
  }
  function restore() {
    const id = crypto.randomUUID();
    if (saveTechnical(previous => restoreTechnicalVersion(previous, restoreVersion.id, id, new Date().toISOString()), `Disegno tecnico · Ripristino da v${restoreVersion.number}`, 2)) {
      setSelectedVersion(id); setRestoreVersion(null); setArea('Tavola');
    }
  }
  const comparison = t.versions.find(v => v.id === compareId && v.id !== version?.id) || t.versions.find(v => v.id !== version?.id);
  const variants = products.find(product => product.variants.some(item => item.styleId === data.styleId))?.variants || [];
  const availableColors = previewColors(snapshot, data.styleId, variants);
  const previewColor = availableColors.find(color => color.key === previewColorKey) || availableColors[0];
  useEffect(() => { setPreviewColorKey(''); }, [data.styleId, version?.id]);
  return <div className="dw-technical-workspace">
    <div className="dw-tech-intro"><div><strong>Dal riferimento alla tavola</strong><p>Carica una foto o uno schizzo, rivedi il disegno e salva le tue modifiche.</p></div><span>Anteprima demo</span></div>
    <div className="dw-technical-toolbar"><Tabs items={['Input', 'Tavola', 'Programma', 'Colori', 'Versioni']} selected={area} onChange={setArea} label="Disegno tecnico" variant="underline" /><span className="dw-technical-status"><Button primary onClick={openEditor}>Apri editor vettoriale</Button>{version && <span className="dw-code">v{version.number}</span>}<Badge>{approved ? 'Approvata' : version ? 'In revisione' : 'Da generare'}</Badge></span></div>
    {area === 'Input' && <div className="dw-technical-input-layout">
      <Card title="Foto o schizzo di riferimento" note={sketch ? `${data.styleId} · ${concept?.sourceModule === 2 ? 'Caricato qui' : 'Dal modulo 1'}` : 'Dal modulo 1 oppure da file'} actions={<Button icon="plus" disabled={generating} onClick={() => input.current.click()}>{sketch ? 'Cambia file' : 'Carica riferimento'}</Button>}>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={e => { upload(e.target.files[0]); e.target.value = ''; }} />
        <div className="dw-tech-source">{sketch ? sketch.type === 'application/pdf' ? <><Icon name="file" size={36} /><strong>{sketch.name}</strong><a className="dw-btn" href={sketch.src} download={sketch.name}>Scarica PDF</a></> : <div className="dw-tech-sketch" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setNotePoint({ x: Math.round((e.clientX - r.left) / r.width * 100), y: Math.round((e.clientY - r.top) / r.height * 100) }); }}><img src={sketch.src} alt="Foto o schizzo di riferimento" />{t.notes.map((n, i) => <span key={n.id} className="dw-tech-pin" style={{ left: `${n.x}%`, top: `${n.y}%` }} title={n.text}>{i + 1}</span>)}</div> : <><Icon name="file" size={32} /><p>Carica una foto o uno schizzo per iniziare.</p><Button onClick={() => onNavigate(1)}>Apri ideazione</Button></>}</div>
        {sketch && <div className="dw-tech-source-foot"><span>{sketch.name}</span><Button onClick={() => onNavigate(1)}>Scheda del capo</Button></div>}
        {sketch?.type !== 'application/pdf' && sketch && <details className="dw-tech-note-editor"><summary>Didascalie sullo schizzo · {t.notes.length}</summary><p>Clicca un punto dello schizzo oppure scegli il centro, poi scrivi una nota.</p><Button onClick={() => setNotePoint({ x: 50, y: 50 })}>Usa il centro dello schizzo</Button><form className="dw-stack" onSubmit={e => { e.preventDefault(); if (!notePoint || !note.trim()) return; update({ notes: [...t.notes, { id: crypto.randomUUID(), ...notePoint, text: note.trim() }] }); setNote(''); setNotePoint(null); }}><Field label="Nota sul punto"><input maxLength={250} value={note} onChange={e => setNote(e.target.value)} /></Field><Button type="submit" disabled={!notePoint || !note.trim()}>Aggiungi nota {notePoint ? `(${notePoint.x}%, ${notePoint.y}%)` : ''}</Button></form>{t.notes.map((n, i) => <div className="dw-tech-note-row" key={n.id}><span>{i + 1}. {n.text}</span><Button icon="close" aria-label={`Rimuovi nota ${i + 1}`} onClick={() => update({ notes: t.notes.filter(row => row.id !== n.id) })} /></div>)}</details>}
      </Card>
      <Card title="Requisiti del prodotto" note="Forma, costruzione e vestibilità"><div className="dw-stack"><Field label="Requisiti"><textarea maxLength={1500} rows={4} disabled={generating} value={t.requirements} onChange={e => update({ requirements: e.target.value })} /></Field><Field label="Vincoli tecnici"><textarea maxLength={800} rows={2} disabled={generating} value={t.constraints} onChange={e => update({ constraints: e.target.value })} /></Field><details className="dw-tech-context"><summary>Dal modulo 1</summary><dl className="dw-kv"><dt>Moodboard</dt><dd>{concept?.moodboardOrigin || 'Vuoto'} · {concept?.moodboard.length || 0} riferimenti</dd><dt>Palette indicativa</dt><dd>{concept?.paletteOrigin || 'Vuota'} · {concept?.palette.length || 0} colori</dd></dl><p className="dw-muted">{concept?.palette.length ? 'I colori di direzione diventano varianti da precisare.' : 'La palette mancante si completa nella vista Colori.'}</p></details><div className="dw-tech-input-footer"><span>La demo usa una tavola preparata per il capo selezionato.</span><Button primary disabled={!sketch || generating} onClick={generate}>{generating ? 'Preparazione in corso…' : version ? 'Genera nuova tavola' : 'Genera disegno tecnico'}</Button></div>{generating && <div className="dw-tech-generating" role="status" aria-live="polite"><span className="dw-tech-spinner" aria-hidden="true" /><div><strong>Preparazione del disegno tecnico</strong><p>La tavola sarà pronta tra pochi istanti.</p></div></div>}</div></Card>
    </div>}
    {area === 'Tavola' && <div className="dw-tech-editor-layout"><Card title="Disegno tecnico" note={snapshot.artwork?.[side] ? "Tavola vettoriale manuale · senza scala" : snapshot.programs?.[side] ? "Tavola generata da programma vettoriale" : "Disegno senza scala · modifica le proporzioni nell’editor"} actions={<Tabs items={['Fronte', 'Retro', 'Dettagli']} selected={side} onChange={setSide} />}>
      {version ? <><div className="dw-tech-variant-preview">{availableColors.length > 0 && <Field label="Anteprima variante"><select disabled={Boolean(snapshot.artwork?.[side] || snapshot.programs?.[side])} value={previewColor.key} onChange={e => setPreviewColorKey(e.target.value)}>{availableColors.map(c => <option key={c.key} value={c.key}>{c.name} · {c.code}</option>)}</select>{(snapshot.artwork?.[side] || snapshot.programs?.[side]) && <small className="dw-tech-preview-note">I colori di questa tavola si modificano nell’editor.</small>}</Field>}</div><TechnicalDrawing snapshot={proportionsAvailable ? { ...snapshot, proportions } : snapshot} view={side} color={previewColor?.color} /><div className="dw-tech-source-foot"><span className="dw-code">{data.styleId} · v{version.number}{proportionsAvailable && proportionsChanged ? ' · anteprima non salvata' : ''}</span><span>Vettoriale · modificabile</span></div></> : <div className="dw-creative-empty"><Icon name="ruler" /><p>Carica un riferimento e genera la prima tavola.</p><Button onClick={() => setArea('Input')}>Vai agli input</Button></div>}
    </Card><Card title="Rivedi la tavola" note="Confronta il risultato e perfeziona i dettagli">
      {sketch && <details className="dw-tech-reference" open><summary>Riferimento</summary>{sketch.type === 'application/pdf' ? <a href={sketch.src} target="_blank" rel="noreferrer">Apri il PDF di riferimento</a> : <img src={sketch.src} alt="Foto o schizzo di riferimento" />}</details>}
      <p className="dw-muted">Il disegno descrive la forma del capo attraverso proporzioni, senza scala fisica.</p>
      {version && proportionsAvailable ? <div className="dw-stack dw-tech-proportions"><strong>Proporzioni generali</strong><p className="dw-muted">Anteprima demo: scala l’intera sagoma rispetto alla forma iniziale. Vale per fronte e retro preparati.</p>{[['width', 'Larghezza'], ['height', 'Altezza']].map(([key, label]) => <Field key={key} label={`${label} · ${proportions[key]}%`}><input type="range" min="80" max="120" step="1" value={proportions[key]} onChange={event => setProportions(previous => ({ ...previous, [key]: Number(event.target.value) }))} /></Field>)}<div className="dw-actions"><Button onClick={() => setProportions(defaultProportions)}>Ripristina 100%</Button><Button primary disabled={!proportionsChanged} onClick={() => addVersion({ ...structuredClone(snapshot), proportions: { ...proportions } }, 'Proporzioni generali')}>Salva nuova revisione</Button></div></div> : <p className="dw-muted">Per modificare questa vista usa l’editor vettoriale: l’anteprima delle proporzioni è disponibile sulle tavole preparate di fronte e retro.</p>}
      <Button onClick={openEditor}>Modifica il disegno</Button>
    </Card></div>}
    {area === 'Programma' && <ProgramLab initialProgram={snapshot.programs?.[side]} hasArtwork={Boolean(snapshot.artwork?.[side])} view={side} onViewChange={setSide} onApply={(program, options) => { const next = structuredClone(snapshot); next.programs = { ...next.programs, [side]: program }; if (next.artwork?.[side]) { delete next.artwork[side]; } return addVersion(next, `${options?.demo ? 'Proposta simulata' : 'Programma vettoriale'} · ${side}`); }} />}
    {area === 'Colori' && <Card title="Varianti colore" note="Codici di riferimento · materiali da verificare nel modulo 3"><form className="dw-stack" onSubmit={saveMetadata}>
      <div className="dw-tech-color-options">{t.colors.map((c, i) => <button type="button" key={i} aria-label={`Modifica variante ${i + 1}`} aria-pressed={editingColor === i} onClick={() => setEditingColor(i)}><span style={{ background: c.color }} /><strong>{c.name}</strong><small>{c.code}</small></button>)}</div>
      {t.colors[editingColor] && <div className="dw-tech-color-row"><input type="color" aria-label={`Colore variante ${editingColor + 1}`} value={t.colors[editingColor].color} onChange={e => update({ colors: t.colors.map((row, i) => i === editingColor ? { ...row, color: e.target.value.toUpperCase() } : row) })} /><Field label="Nome variante"><input required maxLength={60} value={t.colors[editingColor].name} onChange={e => update({ colors: t.colors.map((row, i) => i === editingColor ? { ...row, name: e.target.value } : row) })} /></Field><Field label="Codice variante"><input required maxLength={30} value={t.colors[editingColor].code} onChange={e => update({ colors: t.colors.map((row, i) => i === editingColor ? { ...row, code: e.target.value } : row) })} /></Field><Button icon="close" aria-label={`Rimuovi variante ${t.colors[editingColor].name}`} onClick={() => { update({ colors: t.colors.filter((_, i) => i !== editingColor) }); setEditingColor(Math.max(0, editingColor - 1)); }} /></div>}
      <div className="dw-actions"><Button icon="plus" onClick={() => { setEditingColor(t.colors.length); update({ colors: [...t.colors, { name: 'Nuova variante', color: '#D5C5AC', code: `C-${Math.max(100, ...t.colors.map(c => Number(c.code.replace(/^C-/, '')) || 0)) + 1}`, material: 'Da collegare nel modulo 3' }] }); }}>Aggiungi variante</Button>{!t.colors.length && <span className="dw-muted">Nessun colore assegnato automaticamente.</span>}</div>
      <Button primary type="submit" disabled={!version || !t.colors.length}>Salva nuova versione</Button>
    </form></Card>}
    {area === 'Versioni' && <div className="dw-stack"><Card className="dw-tech-history" title="Versioni del disegno" note="Seleziona una versione per confrontarla o ripristinarla"><div className="dw-tech-history-layout"><div className="dw-tech-history-nav"><div className="dw-tech-version-picker"><Field label="Versione da esaminare"><select value={version?.id || ''} onChange={e => { setSelectedVersion(e.target.value); }}><option value="">Seleziona versione</option>{t.versions.map(v => <option key={v.id} value={v.id}>v{v.number} · {v.note}{t.approvedId === v.id ? ' · Approvata' : ''}</option>)}</select></Field></div><div className="dw-tech-versions">{t.versions.map(v => <button type="button" aria-pressed={version?.id === v.id} key={v.id} onClick={() => { setSelectedVersion(v.id); }}><span><strong>v{v.number}</strong><small>{v.note}</small></span><span className="dw-tech-version-badges">{t.currentId === v.id && <Badge>In uso</Badge>}{t.approvedId === v.id && <Badge>Approvata</Badge>}</span></button>)}</div></div><div className="dw-tech-history-detail">{!version ? <p className="dw-muted">Nessuna versione. Parti dallo schizzo.</p> : <><div className="dw-tech-restore"><div><strong>Versione selezionata: v{version.number}</strong><p>Ripristinala come nuova versione approvata. Le altre versioni restano disponibili.</p></div><Button primary disabled={version.id === t.currentId && version.id === t.approvedId} onClick={() => setRestoreVersion(version)}>Ripristina v{version.number}</Button></div><Field label="Confronta con"><select value={comparison?.id || ''} onChange={e => setCompareId(e.target.value)}><option value="">Seleziona versione</option>{t.versions.filter(v => v.id !== version.id).map(v => <option key={v.id} value={v.id}>v{v.number} · {v.note}</option>)}</select></Field>{comparison && <><div className="dw-tech-comparison"><div><strong>v{comparison.number}</strong><TechnicalDrawing snapshot={comparison.snapshot} exportMode /></div><div><strong>v{version.number}</strong><TechnicalDrawing snapshot={snapshot} exportMode /></div></div><p className="dw-muted">Confronta forma, dettagli e proporzioni delle due tavole.</p></>}</>}</div></div></Card></div>}
    <div hidden ref={exportRef}>{vectorViews.map(view => <TechnicalDrawing key={view} snapshot={snapshot} view={view} exportMode baseOnly color={previewColor?.color} />)}</div>
    {version && <div className="dw-tech-finalbar"><span><strong>v{version.number}</strong> · {approved ? 'Versione ufficiale' : 'Da approvare'}</span><div className="dw-actions"><Button icon="download" onClick={() => download(`${data.styleId}-v${version.number}-${side.toLowerCase()}.svg`, exportedDrawing(side), 'image/svg+xml')}>Esporta SVG</Button><Button icon="download" onClick={async () => { try { await techPack({ ...data, measurements: snapshot.measurements, technical: { ...t, exportVersion: version } }, vectorViews.map(exportedDrawing)); } catch { notify('Esportazione non riuscita. Riprova.'); } }}>Tech pack PDF</Button>{approved ? <Button primary icon="arrow" onClick={() => onNavigate(3)}>Materiali e BOM</Button> : <Button primary icon="check" onClick={approve}>Approva v{version.number}</Button>}</div></div>}
    {editor && <Dialog className="dw-vector-dialog" title={`Editor vettoriale · ${editor.view}`} note="Modifica la tavola e salva una nuova revisione." beforeClose={beforeCloseEditor} onClose={() => setEditor(null)}><Suspense fallback={<p role="status">Caricamento editor vettoriale…</p>}><VectorEditor initialScene={editor.snapshot.artwork?.[editor.view]} sourceSvg={editor.sourceSvg} onDirty={value => { editorDirty.current = value; }} onSave={scene => { if (addVersion(withArtwork(editor.snapshot, editor.view, scene), `Modifica vettoriale manuale · ${editor.view}`)) { editorDirty.current = false; setEditor(null); return true; } return false; }} /></Suspense></Dialog>}
    {restoreVersion && <Dialog title={`Ripristinare la versione v${restoreVersion.number}?`} onClose={() => setRestoreVersion(null)}><p>Creerai una nuova versione approvata con il disegno e i dati tecnici collegati della v{restoreVersion.number}. La cronologia rimarrà disponibile; se il disegno o i dati tecnici cambiano, il fitting dovrà essere verificato di nuovo.</p><div className="dw-dialog-actions"><Button data-autofocus onClick={() => setRestoreVersion(null)}>Annulla</Button><Button primary onClick={restore}>Ripristina e approva</Button></div></Dialog>}
    {confirmDiscard && <Dialog title="Scartare le modifiche alla tavola?" onClose={() => setConfirmDiscard(false)}><p>Le modifiche manuali non sono ancora salvate in una revisione.</p><div className="dw-dialog-actions"><Button data-autofocus onClick={() => setConfirmDiscard(false)}>Continua a disegnare</Button><Button onClick={() => { editorDirty.current = false; setConfirmDiscard(false); setEditor(null); }}>Scarta modifiche</Button></div></Dialog>}
  </div>;
}
