export const directionPresets = {
  warm: { palette: [{ name: 'Avorio', color: '#EFEAE1' }, { name: 'Sabbia', color: '#D5C5AC' }, { name: 'Cammello', color: '#B89A73' }, { name: 'Argilla', color: '#A58A78' }, { name: 'Pietra', color: '#92918A' }, { name: 'Grafite', color: '#393936' }] },
  cool: { palette: [{ name: 'Gesso', color: '#F1F0EA' }, { name: 'Grigio perla', color: '#CECFCA' }, { name: 'Salvia', color: '#A3AEA1' }, { name: 'Ardesia', color: '#7B9098' }, { name: 'Fumo', color: '#687477' }, { name: 'Carbone', color: '#343B3D' }] },
};
const atmosphericReferences = {
  'MG-0425': [
    { name: 'Maglia Luce · Avorio', caption: 'Luce diffusa, curve morbide e toni avorio per un’atmosfera quieta e avvolgente.', asset: 'moodboard-luce-avorio' },
    { name: 'Carta e luce', caption: 'Superfici traslucide e ombre sottili, leggere e raccolte.', asset: 'moodboard-luce-avorio-riflessi' },
    { name: 'Riflessi chiari', caption: 'Riflessi caldi su piani minerali e forme morbide.', asset: 'moodboard-luce-avorio-luce' },
  ],
  'MG-0426': [
    { name: 'Maglia Luce · Salvia', caption: 'Toni salvia attenuati e ombre leggere per un’atmosfera naturale e serena.', asset: 'moodboard-luce-salvia' },
    { name: 'Piani salvia', caption: 'Piani sovrapposti e luce filtrata in toni salvia e pietra.', asset: 'moodboard-luce-salvia-piani' },
    { name: 'Ombre leggere', caption: 'Un’ombra morbida attraversa superfici minerali grigio-verdi.', asset: 'moodboard-luce-salvia-ombra' },
  ],
  'MG-0427': [
    { name: 'Maglia Luce · Grafite', caption: 'Contrasti misurati e geometrie silenziose per un’atmosfera raccolta e sofisticata.', asset: 'moodboard-luce-grafite' },
    { name: 'Riflesso d’argento', caption: 'Un riflesso freddo separa il grafite dalla pietra chiara.', asset: 'moodboard-luce-grafite-riflessi' },
    { name: 'Luce nel carbone', caption: 'Forme minerali scure emergono piano da una luce fumosa.', asset: 'moodboard-luce-grafite-nebbia' },
  ],
  'PT-0423': [
    { name: 'Pantalone Riva · Pietra', caption: 'Spazi essenziali e ombre diagonali per un’eleganza composta e dinamica.', asset: 'moodboard-riva-pietra' },
    { name: 'Scale di pietra', caption: 'Una sequenza architettonica scandisce ritmo e proporzioni.', asset: 'moodboard-riva-pietra-geometrie' },
    { name: 'Tagli di luce', caption: 'Linee d’ombra nette attraversano piani in pietra e taupe.', asset: 'moodboard-riva-pietra-ombre' },
  ],
  'BG-0424': [
    { name: 'Borsa Trama · Argilla', caption: 'Volumi color argilla e luce calda per un’atmosfera materica e artigianale.', asset: 'moodboard-trama-argilla' },
    { name: 'Superfici d’argilla', caption: 'Una curva morbida e una parete materica nei toni della terra.', asset: 'moodboard-trama-argilla-ombre' },
    { name: 'Archi caldi', caption: 'Piani color terracotta raccolgono la luce del pomeriggio.', asset: 'moodboard-trama-argilla-luce' },
  ],
};
const referenceByCategory = { knit: 'MG-0425', trousers: 'PT-0423', bag: 'BG-0424' };
export function collectionDefaults() { return { palette: [], moodboard: [], directionRevision: 0 }; }
export function creativeDefaults() {
  return { route: 'upload', inputs: { request: 'Una maglia girocollo versatile in merino e cashmere, con volumi rilassati e finiture curate.', brand: 'Atelier · essenzialità, materia e sartorialità contemporanea', history: 'Capsule Autunno/Inverno 2027 · Maglia Luce, Pantalone Riva e Borsa Trama. Materie naturali e proporzioni morbide. Dati demo.', target: 'Contemporary · 30–45 anni' }, referenceFiles: [], concept: null, round: 0 };
}
// shortcut: prepared individual references simulate AI; connect contextual image generation when a backend is available.
export function prepareDirection(inputs, prompt = '', previous = null, product = null) {
  const text = `${inputs.request} ${inputs.brand} ${inputs.history} ${inputs.target} ${prompt}`;
  const cool = /fredd|fresc|blu|azzurr|salvia|grigi|grafite|cool/i.test(`${text} ${product?.variant || ''}`);
  const preset = directionPresets[cool ? 'cool' : 'warm'];
  const key = atmosphericReferences[product?.styleId] ? product.styleId : referenceByCategory[product?.category] || 'MG-0425';
  const references = atmosphericReferences[key];
  const directionRevision = (previous?.directionRevision || 0) + 1;
  const caption = `${references[0].caption}${prompt.trim() ? ` Revisione: ${prompt.trim()}` : ''}`;
  return { styleId: product?.styleId || '', moodboard: references.map((reference, index) => ({ ...reference, id: `${product?.styleId || 'draft'}-atmosphere-${directionRevision}-${index + 1}`, src: `/images/dashboard/${reference.asset}.webp`, atmosphere: true })), directionCaption: caption, palette: structuredClone(preset.palette), directionRevision };
}
