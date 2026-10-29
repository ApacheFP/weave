import React, { useState } from 'react';
import reference from '../../examples/technical/camicia-riferimento.png';
import example from '../../examples/technical/camicia-programma.json';
import { createDemoProposal, renameDemoPart, summarizeDemoProposal } from '../technical/demoPipeline.js';
import { renderProgram } from '../technical/drawingProgram.js';
import { Badge, Button, Card, Dialog, Tabs } from './ui.jsx';

export default function DemoDrawingPipeline({ view, hasArtwork, onApply, onOpenProgram }) {
  const [proposal, setProposal] = useState(null), [names, setNames] = useState([]);
  const [stage, setStage] = useState(0), [error, setError] = useState(''), [confirm, setConfirm] = useState(false);
  const [scenario, setScenario] = useState('Foto o schizzo');
  const summary = proposal && summarizeDemoProposal(proposal);
  function prepare() {
    const next = createDemoProposal(example);
    setProposal(next); setNames(next.parts.map(part => part.name)); setStage(1); setError('');
  }
  function review() {
    try {
      let next = proposal;
      names.forEach((name, index) => { next = renameDemoPart(next, index, name); });
      setProposal(next); setStage(2); setError('');
    } catch (cause) { setError(cause.message); }
  }
  function apply() { if (onApply(proposal, { demo: true }) !== false) setConfirm(false); }
  return <div className="dw-demo-pipeline">
    <div className="dw-demo-pipeline-intro"><div><strong>Dal riferimento al programma</strong><p>Prova il percorso con una camicia di esempio. È una simulazione: non viene analizzato un file Illustrator né avviato un modello AI.</p></div><Badge>Demo</Badge></div>
    <div className="dw-demo-pipeline-steps" aria-label="Fasi del percorso demo">{['1 · Riferimento', '2 · Parti', '3 · Revisione'].map((label, i) => <span key={label} data-current={stage === i}>{label}</span>)}</div>
    {stage === 0 && <div className="dw-demo-pipeline-grid"><Card title="Riferimento di esempio" note="Immagine sintetica · camicia frontale"><img className="dw-demo-reference" src={reference} alt="Riferimento sintetico della camicia di esempio" /></Card><Card title="Cosa succederà" note="Scenario preparato per la demo"><div className="dw-stack"><Tabs items={['Foto o schizzo', 'Disegno Illustrator']} selected={scenario} onChange={setScenario} label="Scenario di partenza" /><p className="dw-muted">{scenario === 'Foto o schizzo' ? 'Il modello proporrà un programma di parti e tracciati a partire dall’immagine.' : 'L’estrattore ricaverà un programma dai tracciati del file Illustrator.'} Potrai controllare i nomi, confrontare la tavola e creare una revisione.</p><p className="dw-muted">Per questa prova il risultato è già preparato: non legge il file del capo e non importa un vero file Illustrator.</p>{view !== 'Fronte' && <p className="dw-muted">La proposta resta una camicia frontale di esempio anche se la salvi nella vista {view}; questa vista non viene ricostruita automaticamente.</p>}<Button primary onClick={prepare}>{scenario === 'Foto o schizzo' ? 'Simula la proposta' : 'Simula estrazione Illustrator'}</Button></div></Card></div>}
    {stage === 1 && <div className="dw-demo-pipeline-grid"><Card title="Tavola proposta" note="Camicia sintetica · anteprima senza scala"><div className="dw-program-drawing" dangerouslySetInnerHTML={{ __html: renderProgram(proposal) }} /></Card><Card title="Controlla le parti" note="I nomi sono modificabili prima della revisione"><div className="dw-stack">{names.map((name, index) => <label className="dw-demo-part" key={index}><span>Parte {index + 1}</span><input aria-label={`Nome parte ${index + 1}`} maxLength={100} value={name} onChange={event => setNames(previous => previous.map((value, i) => i === index ? event.target.value : value))} /><small>{proposal.parts[index].description}</small></label>)}{error && <p className="dw-program-error" role="alert">{error}</p>}<div className="dw-actions"><Button onClick={() => setStage(0)}>Indietro</Button><Button primary onClick={review}>Continua alla revisione</Button></div></div></Card></div>}
    {stage === 2 && <div className="dw-demo-pipeline-grid"><Card title="Confronto visivo" note="Esempio sintetico: il riferimento proviene dallo stesso disegno"><div className="dw-demo-compare"><div><span>Riferimento</span><img src={reference} alt="Riferimento sintetico della camicia" /></div><div><span>Proposta</span><div className="dw-program-drawing" dangerouslySetInnerHTML={{ __html: renderProgram(proposal) }} /></div></div></Card><Card title="Revisione della proposta" note="Le metriche descrivono il programma di esempio"><div className="dw-stack"><dl className="dw-kv"><dt>Parti</dt><dd>{summary.parts}</dd><dt>Operazioni</dt><dd>{summary.operations}</dd><dt>Forme SVG</dt><dd>{summary.elements}</dd><dt>Fedeltà rispetto a un file esperto</dt><dd>Non valutata</dd></dl><p className="dw-muted">Il controllo copre solo alcune intersezioni rettilinee. Non certifica la qualità della tavola né il confronto geometrico.</p>{summary.warnings.map(warning => <p className="dw-program-error" key={warning}>{warning}</p>)}<div className="dw-actions"><Button onClick={() => setStage(1)}>Modifica nomi</Button><Button onClick={() => onOpenProgram(proposal)}>Apri programma JSON</Button><Button primary onClick={() => setConfirm(true)}>Usa nella tavola</Button></div></div></Card></div>}
    {confirm && <Dialog title={`Usare la proposta sulla vista ${view}?`} onClose={() => setConfirm(false)}><p>Verrà creata una nuova revisione con la camicia di esempio. {hasArtwork ? 'La tavola manuale della vista sarà sostituita nella nuova revisione; quella precedente resterà nella cronologia.' : 'Le revisioni precedenti resteranno nella cronologia.'}</p><div className="dw-dialog-actions"><Button data-autofocus onClick={() => setConfirm(false)}>Annulla</Button><Button primary onClick={apply}>Crea revisione demo</Button></div></Dialog>}
  </div>;
}
