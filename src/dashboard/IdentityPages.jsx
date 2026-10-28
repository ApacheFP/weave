import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useDemo } from './DemoContext.jsx';
import { euro, qualityLabel } from './domain.js';
import { download } from './exportFiles.js';
import { Lifecycle } from './services.jsx';
import { Badge, Button, Card, Icon, Metrics, Tabs } from './ui.jsx';
import { materialUnit, productMedia, productSizes, productSpec } from './productData.js';
import { MediaImage, ProductPhoto, ReferenceFile, fabricAsset } from './Media.jsx';
import Assistant from './Assistant.jsx';
import { modulePath, navigateTo, publicPassportPath } from '../routes.js';

export function PassportPage() {
  const { data, fabric, cost, savePassport, notify } = useDemo();
  const spec = productSpec(data);
  const [role, setRole] = useState('Consumatore');
  const [tab, setTab] = useState('Identità');
  const [qrSvg, setQrSvg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/passaporto/${data.styleId}`
    : `/passaporto/${data.styleId}`;

  useEffect(() => {
    let active = true;
    QRCode.toString(publicUrl, {
      type: 'svg',
      margin: 1,
      width: 80,
      color: { dark: '#1c1914', light: '#ffffff' }
    })
      .then(res => { if (active) setQrSvg(res); })
      .catch(() => {});
    return () => { active = false; };
  }, [publicUrl]);

  const exportPassport = () => {
    download(
      `${data.styleId}-passaporto.json`,
      JSON.stringify({
        demo: true,
        role,
        styleId: `${data.styleId}`,
        name: data.title,
        variant: data.variant,
        collection: data.collection,
        material: {
          composition: fabric.composition,
          origin: fabric.origin,
          supplier: role === 'Consumatore' ? undefined : fabric.supplier
        },
        care: spec.care,
        sizes: productSizes(data),
        dimensions: data.measurements,
        lifecycle: data.lifecycle,
        ...(role !== 'Consumatore'
          ? {
              lot: `${data.lotId}`,
              qualityScore: qualityLabel(data),
              ...(role === 'Brand' ? { unitCost: cost, wholesale: data.wholesale, retail: data.retail } : { evidence: 'Dati dimostrativi non verificati' })
            }
          : {})
      }, null, 2),
      'application/json'
    );
    notify(`Passaporto esportato per la vista ${role.toLowerCase()}`);
  };

  const trimsCost = data.trims?.reduce((sum, row) => sum + row.qty * row.price, 0) || 0;
  const fabricCost = data.consumption * data.fabricPrice;
  const laborCost = (data.laborMinutes * data.hourlyRate) / 60;

  const taricCode = data.category === 'knit'
    ? '6110.12.90 (Maglieria in lana/cashmere)'
    : data.category === 'trousers'
      ? '6204.62.31 (Pantaloni in lana pettinata)'
      : '4202.22.10 (Borse con superficie in tessuto)';

  return <>
    <div className="dw-passport-roles">
      <div><Icon name="eye" size={16} /><span>Guarda il passaporto come</span></div>
      <Tabs items={['Consumatore', 'Brand', 'Autorità']} selected={role} onChange={setRole} label="Ruolo del lettore del passaporto" />
    </div>

    <p className="dw-muted" style={{ margin: '8px 0 16px', fontSize: 12 }}>
      {role === 'Consumatore' && 'Vista consumatore dimostrativa. I dati e i certificati sono esempi; il selettore non applica permessi di accesso.'}
      {role === 'Brand' && 'Vista brand dimostrativa: costi e margini di esempio. Non sono applicati permessi di accesso.'}
      {role === 'Autorità' && 'Vista autorità dimostrativa: non contiene certificazioni, risultati di laboratorio o autorizzazioni reali.'}
    </p>

    <div className="dw-passport-layout">
      {/* Left Column */}
      <div className="dw-stack">
        <Card
          className="dw-passport-profile"
          title={data.title}
          note={`${data.styleId} · ${data.collection}`}
          actions={<Badge tone="good">{data.passportPublished ? 'Pubblicato · demo' : 'Bozza'}</Badge>}
        >
          <div className="dw-passport-photo"><ProductPhoto sizes="240px" /></div>
          <dl className="dw-kv">
            <dt>Variante</dt><dd>{data.variant}</dd>
            <dt>Vestibilità</dt><dd>{data.technical?.fit || spec.fit}</dd>
            <dt>Lotto produzione</dt><dd>{data.lotId}</dd>
            <dt>Manifattura</dt><dd>{data.factory} · Italia</dd>
          </dl>
        </Card>

        <Card
          title="Etichetta del capo & QR Passaporto"
          note="Collegamento alla pagina dimostrativa su questo dispositivo"
          actions={<Badge tone="good">Anteprima demo</Badge>}
        >
          <div className="dw-qr-label" style={{ display: 'flex', alignItems: 'center', gap: 14, margin: 0 }}>
            <div
              style={{
                cursor: 'pointer',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 6,
                background: '#fff',
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center'
              }}
              title="Apri l’anteprima del passaporto"
              onClick={() => navigateTo(publicPassportPath(data.styleId))}
              dangerouslySetInnerHTML={{ __html: qrSvg || '<svg width="80" height="80"></svg>' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: 13.5 }}>{data.styleId} · {data.title}</strong>
              <p style={{ margin: '3px 0 2px', fontSize: 12, color: 'var(--text-2)' }}>Passaporto Digitale di Prodotto (ESPR)</p>
              <small style={{ color: 'var(--text-3)', fontSize: 11, display: 'block', lineHeight: 1.4 }}>
                Il QR punta a questa origine: su localhost è accessibile solo da questo dispositivo.
              </small>
            </div>
          </div>

          <div className="dw-actions" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--divider)', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(publicUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
              >
                {copiedLink ? '✓ Copiato!' : 'Copia link'}
              </Button>
              <Button icon="download" onClick={exportPassport}>
                Esporta JSON ({role.toLowerCase()})
              </Button>
            </div>
            <Button primary icon="arrow" onClick={() => navigateTo(publicPassportPath(data.styleId))}>
              Apri passaporto pubblico
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Column */}
      <div className="dw-stack">
        <Tabs items={['Identità', 'Tracciabilità', 'Cura e vita']} selected={tab} onChange={setTab} label="Sezioni del passaporto" variant="underline" />

        {tab === 'Identità' && <>
          {role === 'Consumatore' && (
            <>
              <Card title="Composizione e materiali" note="Dati di esempio, da verificare">
                <ReferenceFile asset={fabricAsset(data.fabricId)} note={`${fabric.code} · ${fabric.supplier}`} />
                <div className="dw-composition"><span style={{ flex: fabric.wool }} /><span style={{ flex: 100 - fabric.wool }} /></div>
                <p className="dw-composition-text">{fabric.composition}</p>
                <dl className="dw-kv">
                  <dt>Materiale principale</dt><dd>{fabric.name}</dd>
                  <dt>Fodera</dt><dd>{spec.lining}</dd>
                  <dt>Origine</dt><dd>{fabric.origin}</dd>
                  <dt>Confezione</dt><dd>{data.factory} · Italia</dd>
                  <dt>Taglie</dt><dd>{productSizes(data).join(' / ')}</dd>
                </dl>
              </Card>

              <Card title="Indicatori ambientali & circolarità" note="Valori dimostrativi, non certificati">
                <Metrics items={[
                  ["CO₂ stimata", spec.co2, 'Scenario demo / capo'],
                  ['Scarto materiale', `${data.waste}%`, data.category === 'knit' ? 'Piano filato teorico' : 'Piazzamento teorico'],
                  ['Riparabilità', '9.4 / 10', spec.repair]
                ]} />
              </Card>
            </>
          )}

          {role === 'Brand' && (
            <>
              <Card
                title="Scomposizione analitica costo industriale"
                note="Distinta analitica franco fabbrica (Dato Riservato Atelier)"
                actions={<Badge tone="warn">Confidenziale</Badge>}
              >
                <div className="dw-table-wrap">
                  <table className="dw-table">
                    <thead>
                      <tr>
                        <th>Voce di costo</th>
                        <th>Parametro di calcolo</th>
                        <th style={{ textAlign: 'right' }}>Importo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Materia prima principale</strong></td>
                        <td>{data.consumption} {materialUnit(data)} × {euro(data.fabricPrice)}/{materialUnit(data)}</td>
                        <td style={{ textAlign: 'right' }}><strong>{euro(fabricCost)}</strong></td>
                      </tr>
                      <tr>
                        <td><strong>Accessori e minuterie</strong></td>
                        <td>{data.trims?.length || 0} componenti da distinta</td>
                        <td style={{ textAlign: 'right' }}><strong>{euro(trimsCost)}</strong></td>
                      </tr>
                      <tr>
                        <td><strong>Manodopera sartoriale</strong></td>
                        <td>{data.laborMinutes} min @ {euro(data.hourlyRate)}/h</td>
                        <td style={{ textAlign: 'right' }}><strong>{euro(laborCost)}</strong></td>
                      </tr>
                      <tr>
                        <td><strong>Logistica e packaging</strong></td>
                        <td>Spedizione protetta e confezionamento</td>
                        <td style={{ textAlign: 'right' }}><strong>{euro(data.logisticsCost)}</strong></td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={2}>Costo Industriale Unitario Finito</th>
                        <th style={{ textAlign: 'right', fontSize: 14 }}>{euro(cost)}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>

              <Card title="Politica di Pricing & Marginalità" note="Margini wholesale e retail">
                <Metrics items={[
                  ['Listino Wholesale', euro(data.wholesale), `Margine brand: ${data.margin}%`],
                  ['Listino Retail', euro(data.retail), 'Moltiplicatore 2.0x'],
                  ['Markup su Costo', `${(data.retail / cost).toFixed(2)}x`, 'Redditività industriale']
                ]} />
              </Card>

              <Card title="Avanzamento Produzione & Resa Lotto" note={`Fabbrica ${data.factory}`}>
                <dl className="dw-kv">
                  <dt>Ordine / Lotto</dt><dd><strong>{data.orderId}</strong> · Lotto {data.lotId}</dd>
                  <dt>Capi approvati complessivi</dt><dd><strong style={{ color: 'var(--green, #16a34a)' }}>{data.produced - data.reworks} / {data.quantity}</strong> ({Math.round((data.produced / data.quantity) * 100)}%)</dd>
                  <dt>Scarto reale vs teorico</dt><dd><strong>{data.actualWaste}%</strong> (teorico piazzamento: {data.waste}%)</dd>
                  <dt>Fornitore riservato</dt><dd>{fabric.supplier} ({data.fabricLot})</dd>
                  <dt>Collaudo qualità</dt><dd>Score {qualityLabel(data)}</dd>
                </dl>
              </Card>
            </>
          )}

          {role === 'Autorità' && <Card title="Dossier di esempio" note="Anteprima dimostrativa, priva di documenti verificati"><p>I dati di conformità, analisi chimiche e documenti doganali richiedono fonti e verifiche reali. Questa demo non ne certifica la validità.</p><dl className="dw-kv"><dt>Capo</dt><dd>{data.styleId}</dd><dt>Lotto</dt><dd>{data.lotId}</dd><dt>Qualità demo</dt><dd>{qualityLabel(data)}</dd></dl></Card>}

        </>}

        {tab === 'Tracciabilità' && <Card title="Da dove arriva (Filiera Tracciata)">
          <div className="dw-trace-path">
            {[
              ['Materia prima', fabric.origin, `${spec.materialLabel} ${data.fabricLot}`],
              ['Filatura / Fornitore', fabric.supplier, `Riferimento demo: ${fabric.certificate}`],
              ['Confezione', data.factory, `Lotto ${data.lotId}`],
              ['Controllo qualità', 'Laboratorio demo', data.qualityResolved ? `${spec.quality.id} chiusa` : `${spec.quality.id} in verifica`],
              ['Distribuzione', 'Hub Firenze', `Tracking ${data.shipments[0]?.id || 'Da creare'}`]
            ].map(([name, location, meta]) => (
              <div key={name}>
                <span className="dw-trace-node"><Icon name="layers" /></span>
                <div>
                  <small>{name}</small>
                  <strong>{location}</strong>
                  <p>{meta}</p>
                </div>
              </div>
            ))}
          </div>
          {role !== 'Consumatore' && (
            <div className="dw-evidence" style={{ marginTop: 14 }}>
              <Badge>{role === 'Brand' ? 'Dati di fornitura demo' : 'Evidenze di esempio'}</Badge>
              <p>{fabric.certificate}</p>
              <p>Registro di confezione {data.orderId} · Modello v{data.modelVersion}</p>
              <p>Rapporto qualità {spec.quality.id} · Score {qualityLabel(data)}</p>
              <Button icon="download" onClick={exportPassport}>Esporta evidenze ({role})</Button>
            </div>
          )}
        </Card>}

        {tab === 'Cura e vita' && <>
          <Card title="Fallo durare (Istruzioni di cura)">
            <div className="dw-care">
              <MediaImage asset={productMedia(data, 'trims')} />
              <div>
                <h3>Una buona cura fa la differenza.</h3>
                <p>{spec.care}</p>
                <p className="dw-muted">Per riparazioni o rigenerazione del capo, conservare il codice {data.styleId} e rivolgersi al un laboratorio di fiducia.</p>
              </div>
            </div>
          </Card>
          <Lifecycle />
        </>}
      </div>
    </div>
  </>;
}

export function DecisionPage({ onNavigate }) {
  const { data, cost } = useDemo();
  return <div className="dw-decision-layout"><Assistant /><aside className="dw-stack"><Card title="Il contesto della conversazione"><div className="dw-mini-product"><ProductPhoto sizes="80px" /><div><strong>{data.title}</strong><small>{data.styleId} · {data.collection}</small></div></div><dl className="dw-kv"><dt>Costo / capo</dt><dd>{euro(cost)}</dd><dt>Avanzamento</dt><dd>{data.produced}/{data.quantity}</dd><dt>Scarto teorico</dt><dd>{data.waste}%</dd><dt>Qualità</dt><dd>{qualityLabel(data)}</dd></dl><Button onClick={() => onNavigate(21)}>Apri Home del capo</Button></Card><Card title="Decisioni assistite"><p>L’assistente legge i dati della demo e confronta scenari. Le proposte di tessuto, prezzo, piazzamento e consegna hanno un pulsante di approvazione.</p><p className="dw-muted">Le decisioni approvate aggiornano i moduli e compaiono nella cronologia del capo.</p></Card></aside></div>;
}
