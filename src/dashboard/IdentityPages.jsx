import React, { useState } from 'react';
import { useDemo } from './DemoContext.jsx';
import { euro } from './domain.js';
import { download } from './exportFiles.js';
import { Lifecycle } from './services.jsx';
import { Badge, Button, Card, Icon, Metrics, Tabs } from './ui.jsx';
import { productMedia, productSizes, productSpec } from './productData.js';
import { MediaImage, ProductPhoto, ReferenceFile, fabricAsset } from './Media.jsx';
import Assistant from './Assistant.jsx';

export function PassportPage() {
  const { data, fabric, cost, commit, notify } = useDemo();
  const spec = productSpec(data);
  const [role, setRole] = useState('Consumatore'); const [tab, setTab] = useState('Identità');
  const exportPassport = () => {
    download(`${data.styleId}-passaporto.json`, JSON.stringify({ demo: true, role, styleId: `${data.styleId}`, name: data.title, variant: data.variant, collection: data.collection, material: { composition: fabric.composition, origin: fabric.origin, supplier: role === 'Consumatore' ? undefined : fabric.supplier }, care: spec.care, sizes: productSizes(data), dimensions: data.measurements, lifecycle: data.lifecycle, ...(role !== 'Consumatore' ? { lot: `${data.lotId}`, qualityScore: data.qualityScore, ...(role === 'Brand' ? { unitCost: cost } : { evidence: fabric.certificate }) } : {}) }, null, 2), 'application/json');
    notify('Passaporto esportato per la vista ' + role.toLowerCase());
  };
  return <>
    <div className="dw-passport-roles">
      <div><Icon name="eye" size={16} /><span>Guarda il passaporto come</span></div>
      <Tabs items={['Consumatore', 'Brand', 'Autorità']} selected={role} onChange={setRole} label="Ruolo del lettore del passaporto" />
    </div>
    <div className="dw-passport-layout">
      <div className="dw-stack">
        <Card className="dw-passport-profile" title={data.title} note={`${data.styleId} · ${data.collection}`} actions={<Badge>{data.passportPublished ? 'Pubblicato · demo' : 'Anteprima'}</Badge>}>
          <div className="dw-passport-photo"><ProductPhoto sizes="240px" /></div>
          <dl className="dw-kv"><dt>Variante</dt><dd>{data.variant}</dd><dt>Vestibilità</dt><dd>{data.technical?.fit || spec.fit}</dd></dl>
        </Card>
        <Card title="Etichetta del capo">
          <div className="dw-qr-label">
            <a href="#/moduli/19" aria-label={`Apri il passaporto digitale ${data.styleId}`}><img src="/illustrations/dpp-qr.svg" width="72" height="72" alt={`QR del passaporto locale dimostrativo ${data.styleId}`} /></a>
            <div><strong>{data.styleId}</strong><p>Passaporto digitale</p><small>QR per la demo locale sulla porta 5174.</small></div>
          </div>
          <div className="dw-actions"><Button icon="download" onClick={exportPassport}>Esporta passaporto</Button>{role === 'Brand' && <Button primary disabled={data.passportPublished} onClick={() => commit({ passportPublished: true }, `Passaporto ${data.styleId} pubblicato nella demo`, 19)}>{data.passportPublished ? 'Pubblicato' : 'Pubblica demo'}</Button>}</div>
        </Card>
      </div>
      <div className="dw-stack">
        <Tabs items={['Identità', 'Tracciabilità', 'Cura e vita']} selected={tab} onChange={setTab} label="Sezioni del passaporto" variant="underline" />
        {tab === 'Identità' && <>
          <Card title="Composizione e materiali">
            <ReferenceFile asset={fabricAsset(data.fabricId)} note={`${fabric.code} · ${fabric.supplier}`} />
            <div className="dw-composition"><span style={{ flex: fabric.wool }} /><span style={{ flex: 100 - fabric.wool }} /></div>
            <p className="dw-composition-text">{fabric.composition}</p>
            <dl className="dw-kv"><dt>Materiale principale</dt><dd>{fabric.name}</dd><dt>Fodera</dt><dd>{spec.lining}</dd><dt>Origine</dt><dd>{fabric.origin}</dd><dt>Confezione</dt><dd>{data.factory} · Italia</dd><dt>Taglie</dt><dd>{productSizes(data).join(' / ')}</dd></dl>
          </Card>
          <Card title="Indicatori ambientali" note="Valori di esempio, non misurazioni certificate"><Metrics items={[["CO₂ stimata", spec.co2, 'Scenario demo / capo'], ['Scarto materiale', `${data.waste}%`, data.category === 'knit' ? 'Piano filato teorico' : 'Piazzamento teorico'], ['Riparabilità', 'Alta', spec.repair]]} /></Card>
          {role === 'Brand' && <Card title="Dati riservati al brand"><dl className="dw-kv"><dt>Costo industriale</dt><dd>{euro(cost)}</dd><dt>Wholesale / Retail</dt><dd>{euro(data.wholesale)} / {euro(data.retail)}</dd><dt>Qualità lotto</dt><dd>{data.qualityScore}/100</dd><dt>Prodotti</dt><dd>{data.produced} / {data.quantity}</dd></dl></Card>}
        </>}
        {tab === 'Tracciabilità' && <Card title="Da dove arriva">
          <div className="dw-trace-path">{[['Materia', fabric.origin, `${spec.materialLabel} ${data.fabricLot}`], ['Confezione', data.factory, `Lotto ${data.lotId}`], ['Controllo', 'Laboratorio qualità', data.qualityResolved ? `${spec.quality.id} chiusa` : `${spec.quality.id} in verifica`], ['Distribuzione', 'Hub Firenze', `Tracking ${data.shipments[0]?.id || 'Da creare'}`]].map(([name, location, meta]) => <div key={name}><span className="dw-trace-node"><Icon name="layers" /></span><div><small>{name}</small><strong>{location}</strong><p>{meta}</p></div></div>)}</div>
          {role !== 'Consumatore' && <div className="dw-evidence"><Badge>Evidenze demo</Badge><p>{fabric.certificate}</p><p>Registro di confezione {data.orderId} · Modello v{data.modelVersion}</p><p>Rapporto qualità {spec.quality.id} · {data.qualityScore}/100</p><Button icon="download" onClick={exportPassport}>Esporta evidenze</Button></div>}
        </Card>}
        {tab === 'Cura e vita' && <>
          <Card title="Fallo durare"><div className="dw-care"><MediaImage asset={productMedia(data, 'trims')} /><div><h3>Una buona cura fa la differenza.</h3><p>{spec.care}</p><p className="dw-muted">Per riparazioni, conservare il codice {data.styleId} e rivolgersi a un laboratorio qualificato.</p></div></div></Card>
          <Lifecycle />
        </>}
      </div>
    </div>
  </>;
}

export function DecisionPage({ onNavigate }) {
  const { data, cost } = useDemo();
  return <div className="dw-decision-layout"><Assistant /><aside className="dw-stack"><Card title="Il contesto della conversazione"><div className="dw-mini-product"><ProductPhoto sizes="80px" /><div><strong>{data.title}</strong><small>{data.styleId} · {data.collection}</small></div></div><dl className="dw-kv"><dt>Costo / capo</dt><dd>{euro(cost)}</dd><dt>Avanzamento</dt><dd>{data.produced}/{data.quantity}</dd><dt>Scarto teorico</dt><dd>{data.waste}%</dd><dt>Qualità</dt><dd>{data.qualityScore}/100</dd></dl><Button onClick={() => onNavigate(21)}>Apri Home del capo</Button></Card><Card title="Decisioni assistite"><p>L’assistente legge i dati della demo e confronta scenari. Le proposte di tessuto, prezzo, piazzamento e consegna hanno un pulsante di approvazione.</p><p className="dw-muted">Le decisioni approvate aggiornano i moduli e compaiono nella cronologia del capo.</p></Card></aside></div>;
}
