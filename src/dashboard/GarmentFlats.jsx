import React, { lazy, Suspense } from 'react';

const ink = '#403d37';
const muted = '#827e76';
const accent = 'var(--accent,#4b5bd6)';
const details = {
  knit: [
    ['neckband', 'GIROCOLLO', 'Costa 1×1 · rimaglio piatto'],
    ['rib', 'COSTA', 'Polso e fondo · ritorno elastico'],
    ['seam', 'SPALLA', 'Rimaglio · nastro di rinforzo'],
  ],
  trousers: [
    ['pocket', 'TASCA', 'Paramontura · fermapunto'],
    ['waistband', 'CINTURA', 'Passanti · rinforzo interno'],
    ['seam', 'ORLO', 'Punto invisibile · piega pressata'],
  ],
  bag: [
    ['handle', 'MANICO', 'Pelle · travetta passante'],
    ['zipper', 'APERTURA', 'Zip incassata · cursore ottone'],
    ['seam', 'FONDO', 'Rinforzo e angoli in pelle'],
  ],
};
const markers = {
  knit: [[340, 550], [340, 145], [340, 306], [468, 438]],
  trousers: [[463, 573], [340, 138], [340, 296], [340, 500]],
  bag: [[480, 453], [340, 525], [477, 535], [340, 145]],
};
const title = { knit: 'Maglia · girocollo', trousers: 'Pantalone · gamba dritta', bag: 'Borsa · tote strutturata' };
const dimensionNames = {
  knit: ['Lunghezza centro dietro', 'Larghezza spalle', 'Circonferenza torace', 'Lunghezza manica'],
  trousers: ['Lunghezza fianco', 'Circonferenza vita', 'Circonferenza bacino', 'Lunghezza interno gamba'],
  bag: ['Larghezza corpo', 'Altezza corpo', 'Profondità fondo', 'Lunghezza manico'],
};

function parseSvg(source) {
  const [, width, height] = source.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  return { width: Number(width), height: Number(height), markup: source.slice(source.indexOf('>') + 1, source.lastIndexOf('</svg>')) };
}
function drawing(source, x, y, width, height) {
  const scale = Math.min(width / source.width, height / source.height);
  const offsetX = x + (width - source.width * scale) / 2;
  const offsetY = y + (height - source.height * scale) / 2;
  return <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`} dangerouslySetInnerHTML={{ __html: source.markup }} />;
}

function activate(event, onSelect, value) {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(value); }
}
function buttonProps(selected, value, label, onSelect) {
  if (!onSelect) return {};
  return {
    role: 'button', tabIndex: 0, 'aria-label': label, 'aria-pressed': selected === value,
    onClick: () => onSelect(value), onKeyDown: event => activate(event, onSelect, value),
    style: { cursor: 'pointer' },
  };
}

function header(name, view, baseSize) {
  return <g fontFamily="system-ui,sans-serif" fill={ink}>
    <text x="40" y="34" fontSize="11" fontWeight="600" letterSpacing="1.8" fill={muted}>WEAVE  /  SVILUPPO PRODOTTO</text>
    <text x="40" y="62" fontSize="18" fontWeight="650" letterSpacing=".25">{name.toUpperCase()}</text>
    <text x="640" y="38" fontSize="10" fontWeight="600" letterSpacing="1.2" textAnchor="end" fill={muted}>{view.toUpperCase()}  ·  BASE {baseSize}</text>
    <path d="M40 78H640" fill="none" stroke="#dedbd5" />
  </g>;
}

function measurementCard(row, index, selected, onSelect) {
  const x = 40 + index * 151;
  const active = selected === index;
  const words = (dimensionNames[row.category]?.[index] || row.point).split(' ');
  const firstLine = [];
  let secondLine = [];
  for (const word of words) {
    if (firstLine.join(' ').length + word.length < 19 && !secondLine.length) firstLine.push(word);
    else secondLine.push(word);
  }
  return <g key={`${row.point}-${index}`} data-label={`Scheda: ${row.point}`} {...buttonProps(selected, index, `${row.point}: ${row.value} centimetri`, onSelect)}>
    <rect x={x} y="609" width="143" height="57" rx="7" fill={active ? '#f2f1fd' : '#fff'} stroke={active ? accent : '#dedbd5'} strokeWidth={active ? 1.8 : 1} />
    <text x={x + 11} y="627" fontFamily="system-ui,sans-serif" fontSize="14" fontWeight="600" fill={active ? accent : ink}>{firstLine.join(' ')}</text>
    {secondLine.length > 0 && <text x={x + 11} y="641" fontFamily="system-ui,sans-serif" fontSize="14" fill={active ? accent : ink}>{secondLine.join(' ')}</text>}
    <text x={x + 11} y="658" fontFamily="system-ui,sans-serif" fontSize="14" fill={muted}>{row.value} cm</text>
  </g>;
}

function MainView({ snapshot, view, selected, onSelect, color, category, source }) {
  const name = snapshot.title || title[category];
  const baseSize = snapshot.baseSize || 'M';
  return <svg className="dw-technical-vector dw-garment-flat" viewBox="0 0 680 700" role="group" aria-label={`${view} · ${name}`} style={{ '--garment-color': color }}>
    <title>{`${view} · ${name} · disegno tecnico`}</title>
    {header(title[category], view, baseSize)}
    {drawing(source, 130, 84, 420, 516)}
    {snapshot.measurements.map((row, index) => {
      const [x, y] = markers[category][index];
      const active = selected === index;
      return <g key={`marker-${index}`} data-label={`Marcatore: ${row.point}`} {...buttonProps(selected, index, `Seleziona ${row.point}`, onSelect)}>
        <circle cx={x} cy={y} r="13" fill={active ? accent : ink} stroke="#fff" strokeWidth="2" />
        <text x={x} y={y + 3.5} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="700" fill="#fff">{String.fromCharCode(65 + index)}</text>
      </g>;
    })}
    {snapshot.measurements.map((row, index) => measurementCard({ ...row, category }, index, selected, onSelect))}
  </svg>;
}

function DetailView({ snapshot, selected, onSelect, color, category, source }) {
  const name = snapshot.title || title[category];
  const baseSize = snapshot.baseSize || 'M';
  return <svg className="dw-technical-vector dw-garment-flat" viewBox="0 0 680 700" role="group" aria-label={`Dettagli costruttivi · ${name}`} style={{ '--garment-color': color }}>
    <title>Dettagli costruttivi · {name}</title>
    {header(`${name} · particolari costruttivi`, 'Dettagli', baseSize)}
    {drawing(source, 40, 91, 600, 225)}
    {details[category].map(([key, heading, note], index) => {
      const x = 40 + index * 201;
      const active = selected === key;
      const value = snapshot.parts?.[key];
      const [noteLead, noteTail] = note.split(' · ');
      return <g key={key} data-label={`Dettaglio: ${heading}`} {...buttonProps(selected, key, `${heading}: ${value ?? '—'} centimetri`, onSelect)}>
        <rect x={x} y="339" width="190" height="293" rx="8" fill={active ? '#f7f6ff' : '#fff'} stroke={active ? accent : '#dedbd5'} strokeWidth={active ? 1.8 : 1} />
        <circle cx={x + 17} cy="359" r="9" fill={active ? accent : '#fff'} stroke={active ? accent : '#c9c5bd'} />
        <text x={x + 17} y="362" textAnchor="middle" fill={active ? '#fff' : ink} fontFamily="system-ui,sans-serif" fontSize="8">{String.fromCharCode(65 + index)}</text>
        <text x={x + 16} y="401" fill={active ? accent : ink} fontFamily="system-ui,sans-serif" fontSize="16" fontWeight="700" letterSpacing=".5">{heading}</text>
        <text x={x + 16} y="424" fill={muted} fontFamily="system-ui,sans-serif" fontSize="14"><tspan>{noteLead}</tspan>{noteTail && <tspan x={x + 16} dy="16">· {noteTail}</tspan>}</text>
        <path d={`M${x + 16} 458H${x + 174}`} stroke="#dedbd5" />
        <text x={x + 16} y="482" fill={ink} fontFamily="system-ui,sans-serif" fontSize="13">{snapshot.partLabels?.[key] || heading} · {value ?? '—'} cm</text>
        <text x={x + 16} y="604" fill={muted} fontFamily="system-ui,sans-serif" fontSize="10">PARTICOLARE {String.fromCharCode(65 + index)}</text>
      </g>;
    })}
    <text x="40" y="672" fill={muted} fontFamily="system-ui,sans-serif" fontSize="9">DETTAGLI DIMOSTRATIVI  ·  CAMPIONATURA E TOLLERANZE DA VALIDARE SUL PROTOTIPO</text>
  </svg>;
}

function UnsupportedCategory() {
  return <svg className="dw-technical-vector dw-garment-flat" viewBox="0 0 680 180" role="img" aria-label="Categoria non disponibile">
    <text x="340" y="86" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="14" fill={muted}>Tavola non disponibile per questa categoria.</text>
  </svg>;
}

function loadView(category, view, load) {
  return lazy(() => load().then(({ default: raw }) => {
    const source = parseSvg(raw);
    return { default: props => {
      const Component = view === 'Dettagli' ? DetailView : MainView;
      return <Component {...props} category={category} view={view} source={source} />;
    } };
  }));
}

const artworkViews = {
  knit: {
    Fronte: loadView('knit', 'Fronte', () => import('./garment-flats/knit-front.svg?raw')),
    Retro: loadView('knit', 'Retro', () => import('./garment-flats/knit-back.svg?raw')),
    Dettagli: loadView('knit', 'Dettagli', () => import('./garment-flats/knit-details.svg?raw')),
  },
  trousers: {
    Fronte: loadView('trousers', 'Fronte', () => import('./garment-flats/trousers-front.svg?raw')),
    Retro: loadView('trousers', 'Retro', () => import('./garment-flats/trousers-back.svg?raw')),
    Dettagli: loadView('trousers', 'Dettagli', () => import('./garment-flats/trousers-details.svg?raw')),
  },
  bag: {
    Fronte: loadView('bag', 'Fronte', () => import('./garment-flats/bag-front.svg?raw')),
    Retro: loadView('bag', 'Retro', () => import('./garment-flats/bag-back.svg?raw')),
    Dettagli: loadView('bag', 'Dettagli', () => import('./garment-flats/bag-details.svg?raw')),
  },
};

export default function GarmentFlats(props) {
  const { snapshot, view = 'Fronte' } = props;
  const category = snapshot.category;
  const Artwork = artworkViews[category]?.[view];
  if (!Artwork) return <UnsupportedCategory />;
  return <Suspense fallback={<UnsupportedCategory />}><Artwork {...props} category={category} /></Suspense>;
}
