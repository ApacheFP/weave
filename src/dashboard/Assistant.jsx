import React, { useEffect, useRef, useState } from 'react';
import { modules } from '../modules.js';
import { euro, fabrics, totals, useDemo } from './DemoContext.jsx';
import { Badge, Button, Icon } from './ui.jsx';

const prompts = {
  1: ['Confronta gli spunti creativi', 'Come preparo il mio schizzo definitivo?'],
  2: ['Controlla le misure del tech pack', 'Quali dettagli mancano?'],
  3: ['Cosa succede se cambio tessuto?', 'Controlla la tracciabilità dei materiali'],
  4: ['Controlla il modello e i margini', 'Qual è la prossima versione?'],
  5: ['Confronta le taglie 38 e 48', 'Controlla le regole di sviluppo'],
  6: ['Posso approvare il campione?', 'Riassumi le modifiche di fitting'],
  7: ['Quanto risparmio ottimizzando?', 'Confronta consumo e scarto'],
  9: ['Cosa succede se cambio tessuto?', 'Quale prezzo mantiene il margine?'],
  10: ['La consegna è a rischio?', 'Confronta la capacità dei laboratori'],
  11: ['Quali materiali sono in ritardo?', 'Come sblocchiamo i bottoni?'],
  12: ['Riassumi l’avanzamento del lotto', 'Quali rischi rallentano la produzione?'],
  13: ['Come risolviamo la non conformità?', 'Riassumi il controllo del lotto'],
  19: ['Quali dati contiene il passaporto?', 'Come gestiamo la seconda vita?'],
  21: ['Quali sono i rischi della filiera?', 'Cosa succede se cambio tessuto?'],
  22: ['Cosa succede se cambio tessuto?', 'Quali sono i rischi della filiera?', 'Quanto risparmio ottimizzando?'],
};

function answer(question, id, data) {
  const t = totals(data);
  const lower = question.toLowerCase();
  if (/tessuto|material|tracciabil/.test(lower) && [3, 9, 19, 21, 22].includes(id)) {
    const alternative = fabrics.find(f => f.id !== data.fabricId && f.id === 'premium') || fabrics[0];
    const delta = (alternative.price - data.fabricPrice) * data.consumption;
    return { text: `Il tessuto attuale è ${t.fabric.name}: ${data.consumption.toFixed(2)} m a ${euro(data.fabricPrice)}/m. Il costo industriale è ${euro(t.cost)} per capo.\n\nCon ${alternative.name}, il costo cambia di ${euro(delta)} per capo (${euro(delta * data.quantity)} sull’ordine). La composizione diventa ${alternative.composition}; distinta base e DPP seguiranno la scelta.\n\nTi suggerisco di confrontare campione e prezzo prima di approvare. Puoi applicare lo scenario alla demo.`, action: 'fabric', payload: alternative.id, actionLabel: 'Approva tessuto alternativo' };
  }
  if (/ottimizz|risparm|scarto|consumo/.test(lower) && [7, 9, 12, 21, 22].includes(id)) {
    const optimizedConsumption = data.consumption * .86 / .89;
    return { text: data.optimized ? `Il piazzamento è già ottimizzato: consumo ${data.consumption.toFixed(2)} m, scarto teorico ${data.waste}% e tessuto ${euro(data.consumption * data.fabricPrice)} per capo. Lo scarto reale registrato in produzione resta ${data.actualWaste}% e va confrontato a fine lotto.` : `Per ${data.quantity} capi, lo scenario porta lo scarto teorico dal ${data.waste}% al ${Math.round(11 + (150 - data.markerWidth) * .12)}% e il consumo da ${data.consumption.toFixed(2)} a ${optimizedConsumption.toFixed(2)} m per capo.\n\nIl risparmio stimato sul tessuto è ${euro((data.consumption - optimizedConsumption) * data.fabricPrice * data.quantity)}. È una simulazione: verifica vincoli di drittofilo prima di confermare.`, ...(data.optimized ? {} : { action: 'marker', actionLabel: 'Approva piazzamento ottimizzato' }) };
  }
  if (/margine|prezzo/.test(lower) && [9, 22].includes(id)) return { text: `Con costo ${euro(t.cost)} e margine obiettivo ${data.margin}%, il wholesale arrotondato ai 5 € è ${euro(t.suggestedWholesale)}. Il listino attuale è ${euro(data.wholesale)} e il retail è ${euro(data.retail)}.\n\nPosso allineare il listino allo scenario, mantenendo un rapporto retail/wholesale di 2.`, action: 'price', actionLabel: 'Approva nuovo listino' };
  const delayed = data.purchaseOrders.filter(row => row.status === 'In ritardo');
  if (/ritardo|bottoni|risch|consegna|sblocch/.test(lower) && [10, 11, 12, 21, 22].includes(id)) return { text: `Ordine ${data.orderId}: ${data.produced}/${data.quantity} capi completati. ${delayed.length ? `${delayed.map(row => row.supplier + ' · ' + row.material).join(', ')} in ritardo.` : 'Nessun acquisto risulta in ritardo.'}\n\n${data.qualityResolved ? 'La non conformità è chiusa.' : 'NC-018 è aperta: 12 capi sono da ricontrollare.'} ${data.factory} pianifica la consegna entro il ${new Date(data.delivery + 'T12:00:00').toLocaleDateString('it-IT')}.\n\n${delayed.length ? 'Propongo una consegna prioritaria dei bottoni: nella demo la conferma aggiorna l’ordine di acquisto.' : 'Mantieni il controllo giornaliero su capacità e qualità.'}`, ...(delayed.length ? { action: 'purchase', actionLabel: 'Approva consegna prioritaria' } : {}) };
  if (id === 13 || /non conform|difett/.test(lower)) return { text: data.qualityResolved ? `NC-018 è stata chiusa. Quality score ${data.qualityScore}/100, ${t.approved} capi approvati. La correzione è registrata nel contesto e nel DPP.` : `La cucitura della spalla sinistra non rispetta lo standard visivo. Le misure ammettono ±1 cm, ma il difetto è costruttivo.\n\nAzione proposta: ${data.qualityNote}\n\nDopo il ricontrollo puoi approvare la chiusura simulata di NC-018 e rilasciare i 12 capi.`, ...(data.qualityResolved ? {} : { action: 'quality', actionLabel: 'Approva esito del ricontrollo' }) };
  const context = {
    1: `Il capo ${data.title}, ${data.styleId}, parte da trend, riferimenti e richiesta del cliente. Il modulo propone quattro figurini di ispirazione: scegli, scarta e combina gli spunti, poi disegna a mano o su tablet. ${data.conceptApproved ? 'Lo schizzo definitivo è stato caricato: concept approvato, pronto per il disegno tecnico.' : 'Approva la palette e carica il tuo schizzo definitivo per approvare il concept.'} Lo Style ID resta ${data.styleId}. Ricerca e rigenerazione sono simulate nella demo; le fonti si aprono dai link del modulo.`,
    2: `Il tech pack contiene ${data.measurements.length} punti di misura. Base 42: ${data.measurements.map(row => `${row.point.toLowerCase()} ${row.value} cm`).join(', ')}. Tolleranza ±1 cm. Verifica fronte, retro e dettagli costruttivi prima di esportare.`,
    4: `Il modello v${data.modelVersion} comprende 11 pezzi in 6 gruppi. Margine ${data.seam} cm, tacche ${data.notches ? 'visibili' : 'nascoste'}, drittofilo ${data.grain ? 'visibile' : 'nascosto'}. La prossima versione si crea salvando una revisione; l’approvazione del campione la collega alla produzione.`,
    5: `Sviluppo su 6 taglie, 38–48. La base 42 ha torace ${data.measurements[2].value} cm; con incremento ${data.gradingChest} cm, la 38 misura ${data.measurements[2].value - 2 * data.gradingChest} cm e la 48 ${data.measurements[2].value + 3 * data.gradingChest} cm. Controlla sempre la vestibilità sulle taglie estreme.`,
    6: `Fitting: spalle +0,8 cm, manica da accorciare di 1 cm. ${data.sampleChecks.filter(Boolean).length}/3 verifiche completate. ${data.sampleApproved ? 'Campione approvato, modello v' + data.modelVersion + '.' : 'Completa le tre verifiche prima di approvare il campione.'}`,
    12: `${data.orderId} è ${data.productionPaused ? 'in pausa' : 'in lavorazione'}: ${data.produced}/${data.quantity} capi, scarto reale ${data.actualWaste}%, ${data.reworks} rilavorazioni. Il lotto ${data.fabricLot} alimenta ${data.lotId}. Registra la prossima sessione per aggiornare avanzamento, stock e contesto.`,
    19: `${data.styleId} conserva composizione ${t.fabric.composition}, origine ${t.fabric.origin}, lotto ${data.lotId} e istruzioni di cura. La vista consumatore protegge prezzi e dati commerciali; il brand vede costi e qualità, l’autorità vede evidenze di tracciabilità. Riparazione e seconda vita si registrano nella cronologia del capo.`,
    21: `La filiera collega il concept alla vendita attraverso ${data.styleId}. Costo ${euro(t.cost)}, avanzamento ${Math.round(data.produced / data.quantity * 100)}%, quality score ${data.qualityScore}/100. Gli eventi recenti mostrano quali dati sono cambiati; apri un nodo per lavorare nel modulo interessato.`,
  };
  return { text: (context[id] || `Il capo ${data.title}, ${data.styleId}, appartiene alla collezione ${data.collection}. Posso confrontare tessuti e prezzi, controllare ritardi, leggere qualità e piazzamento. Prova una delle domande suggerite.`) + '\n\nRisposta simulata sui dati correnti della demo.' };
}

export default function Assistant({ moduleId = 22, embedded = false }) {
  const { data, commit } = useDemo();
  const module = modules.find(m => m.id === moduleId);
  const key = String(moduleId);
  const messages = data.chats[key] || [];
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const end = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }, [messages.length, busy]);
  function send(value = input) {
    const question = value.trim().slice(0, 1500);
    if (!question || busy) return;
    const reply = answer(question, moduleId, data);
    setInput(''); setBusy(true);
    commit(previous => ({ chats: { ...previous.chats, [key]: [...(previous.chats[key] || []), { id: crypto.randomUUID(), role: 'user', text: question }] } }));
    timer.current = setTimeout(() => {
      commit(previous => ({ chats: { ...previous.chats, [key]: [...(previous.chats[key] || []), { id: crypto.randomUUID(), role: 'assistant', ...reply }] } }));
      setBusy(false);
    }, 650);
  }
  function approve(message) {
    commit(previous => {
      const patch = {};
      if (message.action === 'fabric') { const f = fabrics.find(f => f.id === message.payload); patch.fabricId = f.id; patch.fabricPrice = f.price; }
      if (message.action === 'marker' && !previous.optimized) { patch.optimized = true; patch.waste = Math.round(11 + (150 - previous.markerWidth) * .12); patch.consumption = Number((previous.consumption * .86 / .89).toFixed(4)); }
      if (message.action === 'price') { patch.wholesale = totals(previous).suggestedWholesale; patch.retail = patch.wholesale * 2; }
      if (message.action === 'purchase') patch.purchaseOrders = previous.purchaseOrders.map(row => row.status === 'In ritardo' ? { ...row, status: 'Confermato' } : row);
      if (message.action === 'quality') { patch.qualityResolved = true; patch.qualityScore = 96; patch.reworks = 0; }
      return { ...patch, chats: { ...previous.chats, [key]: previous.chats[key].map(row => row.id === message.id ? { ...row, applied: true } : row) } };
    }, 'Decisione approvata: ' + message.actionLabel.toLowerCase(), moduleId);
  }
  return <div className={`dw-chat ${embedded ? 'embedded' : ''}`}>
    <div className="dw-chat-top"><span className="dw-assistant-mark"><Icon name="spark" /></span><div><strong>Assistente weave</strong><p>{moduleId === 22 ? 'Contesto completo del capo selezionato.' : module.title + ` · ${data.styleId}`}</p></div><Badge>Assistente demo</Badge></div>
    <div className="dw-chat-messages" aria-live="polite" aria-relevant="additions">
      {!messages.length && <div className="dw-chat-welcome"><Icon name="chat" size={32} /><h2>Da dove iniziamo?</h2><p>{moduleId === 22 ? 'Confrontiamo scenari, leggiamo i segnali e decidiamo il prossimo passo.' : `Ragioniamo su ${module.title.toLowerCase()}, usando i dati del tuo capo.`}</p><div className="dw-chat-prompts">{(prompts[moduleId] || prompts[22]).map(prompt => <button key={prompt} onClick={() => send(prompt)} disabled={busy}>{prompt}<Icon name="arrow" size={16} /></button>)}</div></div>}
      {messages.map(message => <div className={`dw-message ${message.role}`} key={message.id}><small>{message.role === 'user' ? 'Tu' : 'weave · assistente'}</small><p>{message.text}</p>{message.action && <Button primary={!message.applied} disabled={message.applied || busy} icon={message.applied ? 'check' : 'spark'} onClick={() => approve(message)}>{message.applied ? 'Decisione applicata' : message.actionLabel}</Button>}</div>)}
      {busy && <p className="dw-typing" role="status">Sto collegando i dati<span>…</span></p>}<div ref={end} />
    </div>
    <form className="dw-chat-compose" onSubmit={event => { event.preventDefault(); send(); }}><label className="sr-only" htmlFor={`chat-input-${key}`}>Messaggio all’assistente</label><textarea id={`chat-input-${key}`} value={input} onChange={e => setInput(e.target.value)} placeholder={embedded ? 'Chiedi qualcosa su questo modulo…' : 'Chiedi qualcosa alla tua filiera…'} maxLength={1500} rows={2} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} /><button type="submit" disabled={busy || !input.trim()} aria-label="Invia messaggio"><Icon name="arrow" /></button></form>
    <p className="dw-chat-note">Scenari simulati. Ogni modifica richiede la tua approvazione.</p>
  </div>;
}
