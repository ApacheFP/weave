export const directionPresets = {
  warm: { src: '/images/dashboard/moodboard-fashion-warm.webp', caption: 'Lana a saia, tele naturali, rever puliti e proporzioni morbide. Riferimenti per una giacca quotidiana nei toni cammello, sabbia e avorio.', palette: [{ name: 'Avorio', color: '#EFEAE1' }, { name: 'Sabbia', color: '#D5C5AC' }, { name: 'Cammello', color: '#B89A73' }, { name: 'Argilla', color: '#A58A78' }, { name: 'Pietra', color: '#92918A' }, { name: 'Grafite', color: '#393936' }] },
  cool: { src: '/images/dashboard/moodboard-fashion-cool.webp', caption: 'Lane grigie, cotone chiaro, spalle morbide e dettagli essenziali. Riferimenti di tailoring urbano con accenti salvia e ardesia.', palette: [{ name: 'Gesso', color: '#F1F0EA' }, { name: 'Grigio perla', color: '#CECFCA' }, { name: 'Salvia', color: '#A3AEA1' }, { name: 'Ardesia', color: '#7B9098' }, { name: 'Fumo', color: '#687477' }, { name: 'Carbone', color: '#343B3D' }] },
};
export function collectionDefaults() { return { palette: [], moodboard: [], directionHistory: [], directionRevision: 0 }; }
export function creativeDefaults() {
  return { route: 'upload', inputs: { request: 'Una giacca versatile per il quotidiano, riconoscibile ma senza eccessi.', brand: 'Atelier · essenzialità, materia e sartorialità contemporanea', history: 'AI 2026 · Giacca Core: sell-through 82%. I clienti apprezzano la mano della lana e la vestibilità regular. Dati demo.', target: 'Contemporary · 30–45 anni' }, referenceFiles: [], concept: null, round: 0 };
}
// shortcut: two prepared fashion moodboards simulate AI; connect web context and image generation when a backend is available.
export function prepareDirection(inputs, prompt = '', previous = null) {
  const text = `${inputs.request} ${inputs.brand} ${inputs.history} ${inputs.target} ${prompt}`;
  const cool = /fredd|fresc|blu|azzurr|salvia|grigi|cool/i.test(text);
  const preset = directionPresets[cool ? 'cool' : 'warm'];
  const caption = `${preset.caption}${inputs.request.trim() ? ` Brief: ${inputs.request.trim()}` : ''}${prompt.trim() ? ` Revisione: ${prompt.trim()}` : ''}`;
  return { moodboard: [{ id: 'atmosphere', src: preset.src, name: 'Moodboard della collezione', caption, atmosphere: true }], palette: structuredClone(preset.palette), directionRevision: (previous?.directionRevision || 0) + 1 };
}
