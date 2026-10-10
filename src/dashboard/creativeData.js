export const trendSources = [
  { id: 'cos', name: 'COS · Autumn Winter 2026', label: 'Sartorialità essenziale', note: 'Linee precise e capispalla lunghi: un riferimento per proporzioni e struttura.', url: 'https://www.cos.com/en-gb/runway/autumn-winter-2026' },
  { id: 'lemaire', name: 'LEMAIRE · Autumn/Winter 2026', label: 'Ricerca di silhouette', note: 'Una collezione da osservare per volumi, sovrapposizioni e interpretazione del guardaroba.', url: 'https://www.lemaire.fr/pages/runway-fall-winter-2026' },
  { id: 'woolmark', name: 'Woolmark · Incomparable', label: 'Tailoring morbido', note: 'Blazer ampi, drappeggi e pantaloni fluidi: una direzione per una sartorialità più rilassata.', url: 'https://www.woolmark.com/industry/source-wool/the-wool-lab/themes/incomparable/' },
];
export const ideaLibrary = [
  { asset: 'regular', name: 'Equilibrio sartoriale', note: 'Rever classico, tre bottoni e una linea regolare.', traits: 'struttura · essenziale' },
  { asset: 'relaxed', name: 'Volume e movimento', note: 'Doppiopetto lungo, spalla morbida e volumi ampi.', traits: 'relaxed · fluido' },
  { asset: 'cropped', name: 'Proporzioni nuove', note: 'Giacca corta, collo pulito e silhouette architettonica.', traits: 'cropped · geometrico' },
  { asset: 'wrap', name: 'Un segno in vita', note: 'Chiusura asimmetrica e cintura sottile sul punto vita.', traits: 'avvolgente · definito' },
  { asset: 'combined', name: 'Struttura e proporzione', note: 'Dettagli sartoriali su una giacca corta dalla spalla ampia.', traits: 'ibrido · strutturato' },
  { asset: 'minimal', name: 'Un gesto essenziale', note: 'Un bottone, rever sottile e un contrasto avorio e grafite.', traits: 'minimal · preciso' },
  { asset: 'draped', name: 'Materia libera', note: 'Collo aperto e drappeggio leggero su una linea destrutturata.', traits: 'drappeggio · naturale' },
  { asset: 'fluid', name: 'Sartorialità leggera', note: 'Rever sottile, linea allungata e maniche arrotolate.', traits: 'morbido · quotidiano' },
];
export const ideaSrc = asset => `/images/dashboard/creative-${asset}.webp`;
export function collectionDefaults() {
  return { query: 'Tailoring contemporaneo, silhouette morbide, toni naturali', researched: false, sources: [], summary: '', paletteApproved: false,
    palette: [{ name: 'Cammello', color: '#B89A73' }, { name: 'Sabbia', color: '#D5C5AC' }, { name: 'Avorio', color: '#EFEAE1' }, { name: 'Grafite', color: '#393936' }],
    moodboard: [],
  };
}
export function creativeDefaults() {
  return { inputs: { request: 'Una giacca versatile per il quotidiano, riconoscibile ma senza eccessi.', brand: 'Atelier · essenzialità, materia e sartorialità contemporanea', history: 'AI 2026 · Giacca Core: sell-through 82%. I clienti apprezzano la mano della lana e la vestibilità regular. Dati demo.', target: 'Contemporary · 30–45 anni' }, stage: 1, hasProposal: false, proposalApproved: false, round: 0, ideas: [], votes: {}, history: [], selectedRefs: ['material', 'silhouette', 'detail', 'cos', 'lemaire', 'woolmark'], concept: null };
}
// shortcut: a prepared illustration library simulates generation; replace with the AI service when connected.
export function makeIdeas(creative, combine = []) {
  const liked = creative.ideas.filter(idea => creative.votes[idea.id] === 'like');
  const discarded = new Set(creative.ideas.filter(idea => creative.votes[idea.id] === 'discard').map(idea => idea.asset));
  const round = creative.round + 1;
  const pool = ideaLibrary.filter(idea => !discarded.has(idea.asset) && !liked.some(item => item.asset === idea.asset));
  const ordered = pool.length ? [...pool.slice((round - 1) % pool.length), ...pool.slice(0, (round - 1) % pool.length)] : ideaLibrary;
  const chosen = combine.length ? [{ ...ideaLibrary[4], name: `Combinazione ${combine.map(item => item.number).join(' + ')}`, note: `Studio dimostrativo dei dettagli di ${combine.map(item => item.name).join(' e ')}.` }, ...liked.filter(item => item.asset !== 'combined')] : liked;
  for (const item of ordered) if (chosen.length < 4 && !chosen.some(idea => idea.asset === item.asset)) chosen.push(item);
  return chosen.slice(0, 4).map((idea, index) => ({ ...idea, id: crypto.randomUUID(), number: index + 1, origin: combine.length && index === 0 ? combine.map(item => ({ id: item.id, name: item.name })) : [] }));
}

export const preparedMoodboard = [{ id: 'material', src: '/images/dashboard/fabric-camel.webp', name: 'Materia · lana a saia' }, { id: 'silhouette', src: '/images/dashboard/sketch.webp', name: 'Linee · studio sartoriale' }, { id: 'detail', src: '/images/dashboard/jacket-camel.webp', name: 'Dettagli · guardaroba Atelier' }];
