export const directionPresets = {
  warm: { caption: 'Merino e cashmere, lana a saia e canvas naturale. Volumi morbidi, girocollo essenziale e palette avorio, pietra, argilla e grafite.', palette: [{ name: 'Avorio', color: '#EFEAE1' }, { name: 'Sabbia', color: '#D5C5AC' }, { name: 'Cammello', color: '#B89A73' }, { name: 'Argilla', color: '#A58A78' }, { name: 'Pietra', color: '#92918A' }, { name: 'Grafite', color: '#393936' }] },
  cool: { caption: 'Filati salvia e grafite, cotone naturale e lana pietra. Maglieria essenziale e accessori funzionali con proporzioni rilassate.', palette: [{ name: 'Gesso', color: '#F1F0EA' }, { name: 'Grigio perla', color: '#CECFCA' }, { name: 'Salvia', color: '#A3AEA1' }, { name: 'Ardesia', color: '#7B9098' }, { name: 'Fumo', color: '#687477' }, { name: 'Carbone', color: '#343B3D' }] },
};
export function collectionDefaults() { return { palette: [], moodboard: [], directionRevision: 0 }; }
export function creativeDefaults() {
  return { route: 'upload', inputs: { request: 'Una maglia girocollo versatile in merino e cashmere, con volumi rilassati e finiture curate.', brand: 'Atelier · essenzialità, materia e sartorialità contemporanea', history: 'Capsule Autunno/Inverno 2027 · Maglia Luce, Pantalone Riva e Borsa Trama. Materie naturali e proporzioni morbide. Dati demo.', target: 'Contemporary · 30–45 anni' }, referenceFiles: [], concept: null, round: 0 };
}
// shortcut: prepared individual references simulate AI; connect contextual image generation when a backend is available.
export function prepareDirection(inputs, prompt = '', previous = null) {
  const text = `${inputs.request} ${inputs.brand} ${inputs.history} ${inputs.target} ${prompt}`;
  const cool = /fredd|fresc|blu|azzurr|salvia|grigi|cool/i.test(text);
  const preset = directionPresets[cool ? 'cool' : 'warm'];
  const caption = `${preset.caption}${inputs.request.trim() ? ` Brief: ${inputs.request.trim()}` : ''}${prompt.trim() ? ` Revisione: ${prompt.trim()}` : ''}`;
  const references = [
    { asset: cool ? 'knit-salvia-fabric' : 'knit-fabric', name: cool ? 'Merino e cashmere · Salvia' : 'Merino e cashmere · Avorio', caption: 'Maglia rasata finezza 7, mano morbida e materia naturale.' },
    { asset: cool ? 'knit-grafite-front' : 'knit-front', name: 'Girocollo e proporzioni', caption: 'Vestibilità relaxed, collo essenziale e bordi a costa.' },
    { asset: 'trousers-fabric', name: 'Lana stretch · Pietra', caption: 'Saia naturale e struttura leggera per la gamba dritta.' },
    { asset: 'bag-trims', name: 'Pelle e ottone', caption: 'Finiture riparabili, pelle testa moro e ottone spazzolato.' },
    { asset: 'knit-sample', name: 'Gesto artigianale', caption: 'Smacchinatura, rimaglio e stabilizzazione in atelier.' },
    { asset: 'trousers-front', name: 'Volumi in movimento', caption: 'Proporzioni rilassate per un guardaroba quotidiano.' },
  ];
  return { moodboard: references.map(ref => ({ ...ref, id: crypto.randomUUID(), src: `/images/dashboard/${ref.asset}.webp`, atmosphere: true })), directionCaption: caption, palette: structuredClone(preset.palette), directionRevision: (previous?.directionRevision || 0) + 1 };
}
