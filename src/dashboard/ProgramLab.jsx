import React, { useEffect, useState } from 'react';
import example from '../../examples/technical/camicia-programma.json?raw';
import { renderProgram } from '../technical/drawingProgram.js';
import { quantizeProgram, reviewProgram } from '../technical/programReview.js';
import { extractSvg } from '../technical/extractSvg.js';
import { download } from './exportFiles.js';
import { Button, Card, Field, Tabs } from './ui.jsx';

export default function ProgramLab({ initialProgram, hasArtwork, view, onViewChange, onApply }) {
  const [source, setSource] = useState(() => initialProgram ? JSON.stringify(initialProgram, null, 2) : example);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  useEffect(() => { setSource(initialProgram ? JSON.stringify(initialProgram, null, 2) : example); setPreview(null); setError(''); }, [initialProgram, view]);
  function parse() {
    try {
      if (source.length > 200000) throw Error('Il programma supera il limite di 200 KB.');
      const program = JSON.parse(source);
      const svg = renderProgram(program);
      setError('');
      return { program, svg };
    } catch (cause) { setError(cause.message || 'Il programma non è valido.'); return null; }
  }
  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error('Il file supera 1 MB.');
      const text = await file.text();
      const program = file.name.toLowerCase().endsWith('.svg') ? extractSvg(text) : JSON.parse(text);
      const svg = renderProgram(program);
      setSource(JSON.stringify(program, null, 2)); setPreview({ program, svg }); setError('');
    } catch (cause) { setError(cause.message || 'Impossibile leggere il file.'); }
  }
  function show() { const result = parse(); if (result) setPreview(result); }
  function quantize() {
    try { const result = parse(); if (!result) return; const program = quantizeProgram(result.program); setSource(JSON.stringify(program, null, 2)); setPreview({ program, svg: renderProgram(program) }); setError(''); }
    catch (cause) { setError(cause.message || 'Impossibile quantizzare il programma.'); }
  }
  function apply() { const result = parse(); if (result) onApply(result.program); }
  const inspection = preview && reviewProgram(preview.program);
  return <div className="dw-program-layout">
    <Card title="Programma di disegno" note="Parti e operazioni vettoriali · formato JSON" actions={<Tabs items={['Fronte', 'Retro', 'Dettagli']} selected={view} onChange={onViewChange} label="Vista da modificare" />}>
      <p className="dw-program-help">Scrivi o incolla un programma, controlla il risultato e salvalo come nuova revisione della vista selezionata. L’esempio iniziale è una camicia sintetica. L’importazione SVG supporta i file normalizzati esportati da WEAVE.</p>
      {hasArtwork && <p className="dw-program-help">La tavola è stata modificata nell’editor: il programma mostra la versione precedente. Salvarlo crea una nuova revisione e sostituisce la tavola manuale per questa vista.</p>}
      <Field label="Programma"><textarea className="dw-program-source" spellCheck={false} value={source} onChange={event => { setSource(event.target.value); setPreview(null); setError(''); }} /></Field>
      {error && <p className="dw-program-error" role="alert">{error}</p>}
      <div className="dw-program-actions"><label className="dw-btn dw-program-import">Importa JSON o SVG<input type="file" accept=".json,.svg,application/json,image/svg+xml" onChange={importFile} /></label><Button onClick={() => { setSource(example); setPreview(null); setError(''); }}>Usa esempio camicia</Button><Button onClick={show}>Verifica e visualizza</Button><Button onClick={quantize}>Prova passo 2</Button><Button onClick={() => { const result = parse(); if (result) download('programma-disegno.json', JSON.stringify(result.program, null, 2), 'application/json'); }}>Esporta JSON</Button><Button primary onClick={apply}>Salva sulla tavola</Button></div>
    </Card>
    <Card title="Anteprima vettoriale" note={preview ? `${preview.program.garment} · ${preview.program.parts.length} parti` : 'Verifica il programma per vedere il risultato'}>
      {preview ? <><div className="dw-program-drawing" dangerouslySetInnerHTML={{ __html: preview.svg }} /><p className="dw-muted">{inspection.operations} operazioni · {inspection.svgElements} forme disegnate · {inspection.characters} caratteri JSON. I controlli sulle autointersezioni coprono solo segmenti rettilinei.</p>{inspection.warnings.map(warning => <p className="dw-program-error" key={warning}>{warning}</p>)}</> : <div className="dw-program-placeholder">L’anteprima apparirà qui.</div>}
    </Card>
  </div>;
}
