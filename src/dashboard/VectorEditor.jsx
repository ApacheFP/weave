import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect, Ellipse, Line, Path, IText, Group, PencilBrush, Point, Color, controlsUtils, loadSVGFromString } from 'fabric';
import { Button, Field } from './ui.jsx';
import { artboardSize, validVectorScene } from './vectorDocument.js';
import './vector-editor.css';

const tools = [['select', 'Seleziona'], ['nodes', 'Nodi'], ['hand', 'Sposta tavola'], ['pen', 'Penna'], ['pencil', 'Matita'], ['line', 'Linea'], ['rect', 'Rettangolo'], ['ellipse', 'Ellisse'], ['text', 'Testo']];
const paint = { fill: '#eee4d3', stroke: '#34332f', strokeWidth: 2, originX: 'left', originY: 'top' };
const hex = value => { try { return '#' + new Color(typeof value === 'string' && value !== 'none' ? value : '#ffffff').toHex(); } catch { return '#ffffff'; } };
const svgExporters = new WeakMap();
const escapeXmlAttribute = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export default function VectorEditor({ initialScene, sourceSvg, quoteOptions = [], onSave, onDirty }) {
  const element = useRef(null), stage = useRef(null), canvas = useRef(null);
  const history = useRef([]), position = useRef(-1), baseline = useRef(''), suspended = useRef(true);
  const toolRef = useRef('select'), drag = useRef(null), pen = useRef([]), penPreview = useRef(null);
  const restoring = useRef(false);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [tool, setTool] = useState('select'), [layers, setLayers] = useState([]), [selection, setSelection] = useState(null);
  const [historyState, setHistoryState] = useState({ undo: false, redo: false, dirty: false });
  const [zoom, setZoom] = useState(100), [penCount, setPenCount] = useState(0);
  const dirtyCallback = useRef(onDirty);
  const dirtyRef = useRef(false);
  dirtyCallback.current = onDirty;
  function reportDirty(value) { dirtyRef.current = value; dirtyCallback.current(value); }

  function scene() {
    const c = canvas.current;
    const bounds = c.getObjects().filter(object => !object.excludeFromExport && object.visible).map(object => object.getBoundingRect());
    const left = bounds.length ? Math.floor(Math.min(...bounds.map(rect => rect.left)) - 24) : 0, top = bounds.length ? Math.floor(Math.min(...bounds.map(rect => rect.top)) - 24) : 0;
    const right = bounds.length ? Math.ceil(Math.max(...bounds.map(rect => rect.left + rect.width)) + 24) : artboardSize.width, bottom = bounds.length ? Math.ceil(Math.max(...bounds.map(rect => rect.top + rect.height)) + 24) : artboardSize.height;
    const width = Math.max(1, right - left), height = Math.max(1, bottom - top);
    return { schemaVersion: 1, ...artboardSize, json: c.toObject(['id', 'name', 'measurementBinding']), svg: c.toSVG({ suppressPreamble: true, width: String(width), height: String(height), viewBox: { x: left, y: top, width, height } }) };
  }
  function refresh() {
    const c = canvas.current;
    setLayers(c.getObjects().filter(object => !object.excludeFromExport).map(object => ({ id: object.id, name: object.name || object.type, visible: object.visible, locked: !object.selectable })).reverse());
    const object = c.getActiveObject();
    setSelection(object ? { id: object.id, name: object.name || 'Selezione', type: object.type, left: object.left, top: object.top, width: object.getScaledWidth(), height: object.getScaledHeight(), angle: object.angle, fill: hex(object.fill), stroke: hex(object.stroke), strokeWidth: object.strokeWidth, text: object.text, opacity: object.opacity, measurementBinding: object.measurementBinding ? { ...object.measurementBinding } : null } : null);
  }
  function commit() {
    if (suspended.current) return;
    const value = scene();
    if (!validVectorScene(value)) { reportDirty(true); setError('La tavola contiene dati non validi o supera il limite di 500 elementi / 2 MB. Rimuovi gli elementi interessati prima di salvare.'); refresh(); return; }
    const serialized = JSON.stringify(value.json);
    if (history.current[position.current] !== serialized) {
      history.current = history.current.slice(0, position.current + 1);
      history.current.push(serialized);
      if (history.current.length > 40) history.current.shift();
      position.current = history.current.length - 1;
    }
    const dirty = serialized !== baseline.current;
    setHistoryState({ undo: position.current > 0, redo: position.current < history.current.length - 1, dirty });
    reportDirty(dirty);
    setError(''); refresh();
  }
  function decorate(object) {
    object.id ||= crypto.randomUUID();
    if (!svgExporters.has(object)) {
      const toSVG = object.toSVG.bind(object);
      svgExporters.set(object, toSVG);
      // The same stable layer ID lets quote revisions keep SVG and Fabric JSON aligned.
      object.toSVG = reviver => toSVG(reviver).replace(/<g\b/, `<g data-weave-id="${escapeXmlAttribute(object.id)}"`);
    }
    // Fabric's default textarea is outside the modal and cannot receive focus.
    if (object instanceof IText) object.hiddenTextareaContainer = stage.current;
    object.set({ cornerColor: '#4b5bd6', borderColor: '#4b5bd6', cornerStrokeColor: '#fff', transparentCorners: false, cornerSize: 10, touchCornerSize: 28 });
    if (object.type === 'path') object.controls = toolRef.current === 'nodes' ? controlsUtils.createPathControls(object, { pointStyle: { controlFill: '#4b5bd6', controlStroke: '#ffffff' }, controlPointStyle: { controlFill: '#ffffff', controlStroke: '#4b5bd6' } }) : Path.createControls().controls;
    if (object instanceof Group) object.getObjects().forEach(decorate);
    object.setCoords();
  }
  function guide() {
    const c = canvas.current;
    const frame = new Rect({ ...artboardSize, left: 0, top: 0, fill: 'transparent', stroke: '#d8d8d8', strokeWidth: 1, originX: 'left', originY: 'top', selectable: false, evented: false, excludeFromExport: true });
    c.add(frame); c.sendObjectToBack(frame);
  }
  function fit(content = false) {
    const c = canvas.current;
    if (!c) return;
    const bounds = content ? c.getObjects().filter(object => !object.excludeFromExport).map(object => object.getBoundingRect()) : [];
    const left = bounds.length ? Math.min(...bounds.map(r => r.left)) - 60 : 0;
    const top = bounds.length ? Math.min(...bounds.map(r => r.top)) - 60 : 0;
    const width = bounds.length ? Math.max(...bounds.map(r => r.left + r.width)) - left + 60 : artboardSize.width;
    const height = bounds.length ? Math.max(...bounds.map(r => r.top + r.height)) - top + 60 : artboardSize.height;
    const scale = Math.min(c.width / width, c.height / height, 2);
    c.setViewportTransform([scale, 0, 0, scale, (c.width - width * scale) / 2 - left * scale, (c.height - height * scale) / 2 - top * scale]);
    setZoom(Math.round(scale * 100)); c.requestRenderAll();
  }
  function selectTool(next) {
    const c = canvas.current;
    if (pen.current.length && next !== 'pen') {
      c.remove(penPreview.current); pen.current = []; penPreview.current = null; setPenCount(0);
      reportDirty(JSON.stringify(scene().json) !== baseline.current);
    }
    toolRef.current = next; setTool(next);
    c.isDrawingMode = next === 'pencil';
    c.selection = next === 'select';
    c.defaultCursor = next === 'hand' ? 'grab' : ['pen', 'line', 'rect', 'ellipse'].includes(next) ? 'crosshair' : 'default';
    c.getObjects().forEach(decorate);
    if (!['select', 'nodes'].includes(next)) c.discardActiveObject();
    c.skipTargetFind = !['select', 'nodes'].includes(next);
    c.requestRenderAll(); refresh();
  }
  function add(object, name) {
    if (canvas.current.getObjects().filter(row => !row.excludeFromExport).length >= 500) { setError('La tavola può contenere al massimo 500 elementi.'); return; }
    object.name = name; decorate(object); canvas.current.add(object); return object;
  }
  function finishPen(close = false) {
    if (pen.current.length < 2) return;
    canvas.current.remove(penPreview.current);
    const path = pen.current.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ') + (close ? ' Z' : '');
    add(new Path(path, { ...paint, fill: close ? paint.fill : 'transparent' }), close ? 'Forma a penna' : 'Tracciato a penna');
    pen.current = []; penPreview.current = null; setPenCount(0); commit();
  }
  async function restore(index) {
    if (restoring.current || index < 0 || index >= history.current.length) return;
    restoring.current = true;
    setBusy(true); suspended.current = true;
    try {
      await canvas.current.loadFromJSON(history.current[index]);
      canvas.current.getObjects().forEach(decorate); guide(); position.current = index;
      const dirty = history.current[index] !== baseline.current;
      setHistoryState({ undo: index > 0, redo: index < history.current.length - 1, dirty }); reportDirty(dirty);
      canvas.current.requestRenderAll(); refresh();
    } catch { setError('Non è stato possibile ripristinare questa modifica.'); }
    finally { suspended.current = false; restoring.current = false; setBusy(false); }
  }
  function modify(key, value) {
    const object = canvas.current.getActiveObject();
    if (!object || busy) return;
    if (['left', 'top', 'angle', 'strokeWidth', 'width', 'height', 'opacity'].includes(key)) {
      value = Number(value);
      if (!Number.isFinite(value) || Math.abs(value) > 10000 || ['width', 'height'].includes(key) && value < 1 || key === 'strokeWidth' && (value < 0 || value > 50)) return;
    }
    if (key === 'width' || key === 'height') {
      const size = key === 'width' ? object.getScaledWidth() / object.scaleX : object.getScaledHeight() / object.scaleY;
      if (!size) return;
      object.set(key === 'width' ? 'scaleX' : 'scaleY', value / size);
    } else object.set(key, value);
    object.setCoords(); canvas.current.requestRenderAll(); commit();
  }
  function bindQuote(quoteKey, axis = selection?.measurementBinding?.axis || 'x') {
    const object = canvas.current.getActiveObject();
    if (!object) return;
    if (quoteKey) object.measurementBinding = { quoteKey, axis };
    else delete object.measurementBinding;
    commit();
  }
  function removeSelection() { const c = canvas.current; const objects = c.getActiveObjects(); c.discardActiveObject(); c.remove(...objects); commit(); }
  async function duplicate() {
    const c = canvas.current, object = c.getActiveObject();
    if (!object || layers.length >= 500) return;
    try {
      const copy = await object.clone(['name']);
      copy.set({ left: object.left + 20, top: object.top + 20 });
      add(copy, (object.name || 'Elemento') + ' copia'); c.setActiveObject(copy); commit();
    } catch { setError('Duplicazione non riuscita.'); }
  }
  function groupSelection() {
    const c = canvas.current, objects = c.getActiveObjects();
    if (objects.length < 2) return;
    c.discardActiveObject(); c.remove(...objects);
    const group = add(new Group(objects), 'Gruppo'); c.setActiveObject(group); commit();
  }
  function ungroup() {
    const c = canvas.current, object = c.getActiveObject();
    if (!(object instanceof Group)) return;
    c.discardActiveObject(); const children = object.removeAll(); c.remove(object); c.add(...children); children.forEach(decorate); commit();
  }

  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    const c = new Canvas(element.current, { backgroundColor: '#ffffff', preserveObjectStacking: true, selection: true, svgViewportTransformation: false, enableRetinaScaling: true });
    canvas.current = c;
    c.upperCanvasEl.setAttribute('aria-label', 'Tavola vettoriale: seleziona, ridimensiona e disegna gli elementi');
    c.upperCanvasEl.tabIndex = 0;
    c.freeDrawingBrush = new PencilBrush(c); c.freeDrawingBrush.color = paint.stroke; c.freeDrawingBrush.width = 2;
    const resize = new ResizeObserver(() => { c.setDimensions({ width: stage.current.clientWidth, height: stage.current.clientHeight }); if (!suspended.current) fit(true); else c.requestRenderAll(); });
    resize.observe(stage.current);
    const onSelection = () => refresh();
    c.on('selection:created', onSelection); c.on('selection:updated', onSelection); c.on('selection:cleared', onSelection);
    c.on('object:modified', commit); c.on('text:changed', commit);
    c.on('path:created', ({ path }) => { path.name = 'Disegno a mano libera'; decorate(path); commit(); });
    c.on('mouse:wheel', ({ e }) => { e.preventDefault(); e.stopPropagation(); const scale = Math.max(.1, Math.min(8, c.getZoom() * Math.pow(.999, e.deltaY))); c.zoomToPoint(c.getViewportPoint(e), scale); setZoom(Math.round(scale * 100)); });
    c.on('mouse:down', ({ e }) => {
      if (suspended.current || toolRef.current === 'pencil') return;
      const currentTool = toolRef.current, point = c.getScenePoint(e);
      const pointer = e.touches?.[0] || e;
      if (currentTool === 'hand' || e.altKey) { drag.current = { pan: true, x: pointer.clientX, y: pointer.clientY }; return; }
      if (currentTool === 'pen') {
        pen.current.push({ x: point.x, y: point.y });
        if (penPreview.current) c.remove(penPreview.current);
        penPreview.current = new Path(pen.current.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' '), { ...paint, fill: 'transparent', stroke: '#4b5bd6', selectable: false, evented: false, excludeFromExport: true });
        c.add(penPreview.current); reportDirty(true); setPenCount(pen.current.length); c.requestRenderAll(); return;
      }
      if (currentTool === 'text') {
        const text = add(new IText('Nuovo testo', { left: point.x, top: point.y, fontFamily: 'system-ui', fontSize: 22, fill: paint.stroke, originX: 'left', originY: 'top' }), 'Testo');
        if (text) { selectTool('select'); c.setActiveObject(text); commit(); text.enterEditing(); text.selectAll(); } return;
      }
      const shape = currentTool === 'rect' ? new Rect({ ...paint, left: point.x, top: point.y, width: 1, height: 1 }) : currentTool === 'ellipse' ? new Ellipse({ ...paint, left: point.x, top: point.y, rx: .5, ry: .5 }) : currentTool === 'line' ? new Line([point.x, point.y, point.x, point.y], { ...paint, fill: 'transparent' }) : null;
      if (shape && c.getObjects().filter(object => !object.excludeFromExport).length < 500) { shape.name = tools.find(([id]) => id === currentTool)[1]; decorate(shape); c.add(shape); drag.current = { shape, point, tool: currentTool }; }
    });
    c.on('mouse:move', ({ e }) => {
      const currentDrag = drag.current;
      if (!currentDrag) return;
      if (currentDrag.pan) { const pointer = e.touches?.[0] || e; const v = c.viewportTransform; v[4] += pointer.clientX - currentDrag.x; v[5] += pointer.clientY - currentDrag.y; currentDrag.x = pointer.clientX; currentDrag.y = pointer.clientY; c.requestRenderAll(); return; }
      const point = c.getScenePoint(e), { shape, point: start, tool: kind } = currentDrag;
      if (kind === 'line') shape.set({ x2: point.x, y2: point.y });
      else {
        const width = Math.max(1, Math.abs(point.x - start.x)), height = Math.max(1, Math.abs(point.y - start.y));
        shape.set({ left: Math.min(point.x, start.x), top: Math.min(point.y, start.y), ...(kind === 'ellipse' ? { rx: width / 2, ry: height / 2 } : { width, height }) });
      }
      shape.setCoords(); c.requestRenderAll();
    });
    c.on('mouse:up', () => { if (!drag.current) return; if (drag.current.pan) c.setViewportTransform(c.viewportTransform); else commit(); drag.current = null; });
    async function load() {
      try {
        if (initialScene) {
          if (!validVectorScene(initialScene)) throw new Error('La tavola salvata non è valida.');
          await c.loadFromJSON(initialScene.json, undefined, { signal: abort.signal });
        } else {
          const result = await loadSVGFromString(sourceSvg, (node, object) => {
            if (node.tagName.toLowerCase() === 'rect' && node.parentElement?.tagName.toLowerCase() === 'svg') object.excludeFromExport = true;
            object.name = node.closest('[data-label]')?.getAttribute('data-label') || (object.text ? 'Quota: ' + object.text : 'Tracciato');
          }, { signal: abort.signal });
          if (!active) return;
          const parts = new Map(), details = [];
          result.objects.filter(object => object && !object.excludeFromExport).forEach(object => {
            object.set({ left: object.left + 500, top: object.top + 275 });
            const key = object.name;
            if (key === 'Tracciato') details.push(object);
            else if (key && !key.startsWith('Quota:')) { if (!parts.has(key)) parts.set(key, []); parts.get(key).push(object); }
            else c.add(object);
          });
          if (details.length) parts.set('Dettagli grafici', details);
          for (const [name, members] of parts) { const part = members.length === 1 ? members[0] : new Group(members); part.name = name; c.add(part); }
        }
        if (!active) return;
        c.getObjects().forEach(decorate); guide();
        c.setDimensions({ width: stage.current.clientWidth, height: stage.current.clientHeight }); fit(true);
        baseline.current = JSON.stringify(scene().json); history.current = [baseline.current]; position.current = 0;
        suspended.current = false; setReady(true); refresh(); reportDirty(false);
      } catch (cause) { if (active) setError(cause.message || 'Impossibile aprire la tavola vettoriale.'); }
    }
    load();
    return () => { active = false; suspended.current = true; abort.abort(); resize.disconnect(); c.dispose(); canvas.current = null; };
  }, []);

  useEffect(() => {
    const warn = event => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  useEffect(() => {
    const key = event => {
      if (!ready || busy || pen.current.length || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || canvas.current.getActiveObject()?.isEditing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); restore(position.current + (event.shiftKey ? 1 : -1)); return; }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelection(); return; }
      if (event.key.startsWith('Arrow') && selection) { event.preventDefault(); const step = event.shiftKey ? 10 : 1; modify(['ArrowLeft','ArrowRight'].includes(event.key) ? 'left' : 'top', (['ArrowLeft','ArrowRight'].includes(event.key) ? selection.left : selection.top) + (['ArrowLeft','ArrowUp'].includes(event.key) ? -step : step)); }
    };
    stage.current.closest('dialog').addEventListener('keydown', key);
    const dialog = stage.current.closest('dialog');
    return () => dialog.removeEventListener('keydown', key);
  }, [ready, busy, selection]);

  function save() {
    try { const value = scene(); if (!validVectorScene(value)) throw new Error('La tavola non può essere salvata: controlla i limiti degli elementi.'); if (onSave(value) === false) throw new Error('Salvataggio non riuscito. La tavola resta aperta: riprova dopo aver corretto i dati.'); }
    catch (cause) { setError(cause.message); }
  }
  return <div className="dw-vector-editor">
    <div className="dw-vector-toolbar" role="toolbar" aria-label="Strumenti vettoriali">{tools.map(([id, label]) => <Button key={id} disabled={!ready || busy} aria-pressed={tool === id} onClick={() => selectTool(id)}>{label}</Button>)}<span className="dw-vector-toolbar-divider" /><Button disabled={!historyState.undo || busy || penCount > 0} onClick={() => restore(position.current - 1)}>Annulla</Button><Button disabled={!historyState.redo || busy || penCount > 0} onClick={() => restore(position.current + 1)}>Ripeti</Button></div>
    {tool === 'pen' && <div className="dw-vector-pen-bar"><span>{penCount} punti · clicca sulla tavola per aggiungere vertici</span><Button disabled={penCount < 2} onClick={() => finishPen()}>Concludi tracciato</Button><Button disabled={penCount < 3} onClick={() => finishPen(true)}>Chiudi forma</Button></div>}
    <div className="dw-vector-main"><div className="dw-vector-stage" ref={stage}><canvas ref={element} />{!ready && <p role="status">{error || 'Apertura della tavola…'}</p>}</div><aside className="dw-vector-inspector" aria-label="Proprietà e livelli"><h3>Proprietà</h3>{selection ? <>
      <strong>{selection.name}</strong><p>Dimensioni grafiche in pixel</p><div className="dw-vector-properties">{[['left','X'],['top','Y'],['width','Larghezza'],['height','Altezza'],['angle','Rotazione °']].map(([key, label]) => <Field key={key} label={label}><input key={`${selection.id}-${selection[key]}`} type="number" step=".1" defaultValue={Number(selection[key].toFixed(1))} onBlur={e => modify(key, e.target.value)} /></Field>)}</div>
      <Field label="Riempimento"><input type="color" value={selection.fill} onChange={e => modify('fill', e.target.value)} /></Field><Button onClick={() => modify('fill', 'transparent')}>Senza riempimento</Button><Field label="Tratto"><input type="color" value={selection.stroke} onChange={e => modify('stroke', e.target.value)} /></Field><Field label="Spessore tratto · px"><input key={`${selection.id}-${selection.strokeWidth}`} type="number" min="0" max="50" step=".5" defaultValue={selection.strokeWidth} onBlur={e => modify('strokeWidth', e.target.value)} /></Field>{selection.text !== undefined && <Field label="Contenuto testo"><textarea key={`${selection.id}-${selection.text}`} maxLength={2000} defaultValue={selection.text} onBlur={e => modify('text', e.target.value)} /></Field>}
      <section className="dw-vector-binding" aria-label="Collegamento alle quote"><h4>Quota associata</h4><p>La quota aggiorna questo livello. Il disegno libero non modifica i centimetri.</p><Field label="Misura"><select value={selection.measurementBinding?.quoteKey || ''} onChange={e => bindQuote(e.target.value)}><option value="">Nessun collegamento</option>{quoteOptions.map(option => <option key={option.key} value={option.key}>{option.label} · {option.value} cm</option>)}</select></Field><Field label="Asse di ridimensionamento"><select value={selection.measurementBinding?.axis || 'x'} disabled={!selection.measurementBinding} onChange={e => bindQuote(selection.measurementBinding.quoteKey, e.target.value)}><option value="x">Orizzontale · X</option><option value="y">Verticale · Y</option></select></Field></section>
      <div className="dw-vector-object-actions"><Button onClick={duplicate}>Duplica</Button><Button onClick={removeSelection}>Elimina</Button><Button onClick={() => { canvas.current.bringObjectForward(canvas.current.getActiveObject()); commit(); }}>Avanti</Button><Button onClick={() => { canvas.current.sendObjectBackwards(canvas.current.getActiveObject()); commit(); }}>Indietro</Button><Button onClick={groupSelection}>Raggruppa</Button><Button onClick={ungroup}>Separa gruppo</Button></div>{tool === 'nodes' && selection.type !== 'path' && <p>Seleziona un tracciato per modificare i nodi; separa prima gli eventuali gruppi.</p>}
    </> : <p>Seleziona un elemento sulla tavola o nella lista dei livelli. Trascina gli angoli per ridimensionare; usa il controllo superiore per ruotare.</p>}<h3>Livelli · {layers.length}</h3><ol className="dw-vector-layers">{layers.map(layer => <li key={layer.id}><button aria-pressed={selection?.id === layer.id} onClick={() => { selectTool('select'); const object = canvas.current.getObjects().find(row => row.id === layer.id); canvas.current.setActiveObject(object); canvas.current.requestRenderAll(); refresh(); }}>{layer.name}</button><button aria-label={`${layer.visible ? 'Nascondi' : 'Mostra'} ${layer.name}`} onClick={() => { const object = canvas.current.getObjects().find(row => row.id === layer.id); object.set('visible', !object.visible); canvas.current.requestRenderAll(); commit(); }}>{layer.visible ? '◉' : '○'}</button></li>)}</ol></aside></div>
    <footer className="dw-vector-footer"><div className="dw-actions"><Button disabled={!ready} onClick={() => { const c=canvas.current; const scale=Math.max(.1,c.getZoom()/1.25); c.zoomToPoint(new Point(c.width/2,c.height/2),scale); setZoom(Math.round(scale*100)); }}>−</Button><span>{zoom}%</span><Button disabled={!ready} onClick={() => { const c=canvas.current; const scale=Math.min(8,c.getZoom()*1.25); c.zoomToPoint(new Point(c.width/2,c.height/2),scale); setZoom(Math.round(scale*100)); }}>+</Button><Button disabled={!ready} onClick={() => fit(true)}>Adatta disegno</Button><Button disabled={!ready} onClick={() => fit()}>Adatta tavola</Button></div><span>1600×1200 · quote modificabili nella vista Misure</span><Button primary disabled={!ready || busy || penCount > 0 || initialScene && !historyState.dirty} onClick={save}>Salva nuova revisione</Button></footer>
    {error && <p className="dw-vector-error" role="alert">{error}</p>}
  </div>;
}
