import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useDemo } from './DemoContext.jsx';
import { euro, qualityLabel } from './domain.js';
import { download } from './exportFiles.js';
import { Lifecycle } from './services.jsx';
import { Badge, Button, Card, Icon, Metrics, Tabs } from './ui.jsx';
import { productMedia, productSizes, productSpec } from './productData.js';
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
              ...(role === 'Brand' ? { unitCost: cost, wholesale: data.wholesale, retail: data.retail } : { evidence: fabric.certificate, eur1: 'IT-DOG-2026-0428' })
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
      {role === 'Consumatore' && 'Vista pubblica del consumatore: tracciabilità delle fibre naturali, certificazioni etiche, impatto ambientale e cura. I costi industriali e i margini del brand sono protetti.'}
      {role === 'Brand' && 'Vista riservata atelier: scomposizione analitica del costo primo di produzione, margini commerciali wholesale/retail e bilancio quantitativo del lotto.'}
      {role === 'Autorità' && 'Dossier ufficiale di vigilanza del mercato: conformità al Regolamento UE ESPR 2024/1781, test chimico REACH (assenza PFAS), certificato doganale EUR.1 e marcatura eIDAS.'}
    </p>

    <div className="dw-passport-layout">
      {/* Left Column */}
      <div className="dw-stack">
        <Card
          className="dw-passport-profile"
          title={data.title}
          note={`${data.styleId} · ${data.collection}`}
          actions={<Badge tone="good">{data.passportPublished ? 'Pubblicato · ESPR' : 'Bozza'}</Badge>}
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
          note="Collegamento univoco al passaporto pubblico"
          actions={<Badge tone="good">DPP UE Attivo</Badge>}
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
              title="Clicca per aprire la vera pagina del passaporto pubblico"
              onClick={() => navigateTo(publicPassportPath(data.styleId))}
              dangerouslySetInnerHTML={{ __html: qrSvg || '<svg width="80" height="80"></svg>' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: 13.5 }}>{data.styleId} · {data.title}</strong>
              <p style={{ margin: '3px 0 2px', fontSize: 12, color: 'var(--text-2)' }}>Passaporto Digitale di Prodotto (ESPR)</p>
              <small style={{ color: 'var(--text-3)', fontSize: 11, display: 'block', lineHeight: 1.4 }}>
                Inquadra il QR con la fotocamera dello smartphone per consultare il passaporto pubblico.
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
              <Card title="Composizione e materiali" note="OEKO-TEX Standard 100 · Mulesing-Free">
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

              <Card title="Indicatori ambientali & circolarità" note="Valori certificati a norma ESPR">
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
                        <td>{data.consumption} m × {euro(data.fabricPrice)}/m</td>
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
                  <dt>Capi approvati a stock</dt><dd><strong style={{ color: 'var(--green, #16a34a)' }}>{data.produced} / {data.quantity}</strong> ({Math.round((data.produced / data.quantity) * 100)}%)</dd>
                  <dt>Scarto reale vs teorico</dt><dd><strong>{data.actualWaste}%</strong> (teorico piazzamento: {data.waste}%)</dd>
                  <dt>Fornitore riservato</dt><dd>{fabric.supplier} ({data.fabricLot})</dd>
                  <dt>Collaudo qualità</dt><dd>Score {qualityLabel(data)}</dd>
                </dl>
              </Card>
            </>
          )}

          {role === 'Autorità' && (
            <>
              <Card
                title="Dossier normativo UE (Autorità & Dogana)"
                note="Regolamento ESPR 2024/1781"
                actions={<Badge tone="good">Audit Conforme</Badge>}
              >
                <dl className="dw-kv">
                  <dt>Regolamento UE</dt><dd><strong>ESPR 2024/1781</strong> (Digital Product Passport Textiles)</dd>
                  <dt>ID Univoco URN</dt><dd><code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>urn:dpp:eu:it:weave:{data.styleId}:{data.lotId}</code></dd>
                  <dt>Operatore responsabile</dt><dd>Atelier WEAVE Prato (EORI IT08912340489)</dd>
                  <dt>Registro Doganale</dt><dd>EUR.1 / Made in Italy certificato</dd>
                  <dt>Ente Validatore</dt><dd>Camera di Commercio & Registro Imprese Tessili IT</dd>
                </dl>
              </Card>

              <Card title="Conformità Chimica REACH (Reg. CE 1907/2006)" note="Rapporto analitico LAB-CHEM-IT-2026-9041">
                <div className="dw-table-wrap">
                  <table className="dw-table">
                    <thead>
                      <tr><th>Sostanza / Parametro</th><th>Limite normativo</th><th>Esito test</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>PFAS (Sostanze perfluoroalchiliche)</strong></td><td>&lt; 0.025 mg/kg</td><td><Badge tone="good">Assenti (&lt; 0.01)</Badge></td></tr>
                      <tr><td><strong>Coloranti azoici (EN ISO 14362-1)</strong></td><td>&lt; 20 mg/kg</td><td><Badge tone="good">Conforme (&lt; 5)</Badge></td></tr>
                      <tr><td><strong>Metalli pesanti estraibili</strong></td><td>OEKO-TEX Classe II</td><td><Badge tone="good">Conforme</Badge></td></tr>
                      <tr><td><strong>Formaldeide libera</strong></td><td>&lt; 75 mg/kg</td><td><Badge tone="good">Non rilevata</Badge></td></tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Origine Doganale Preferenziale (Made in Italy)" note="Certificato EUR.1">
                <dl className="dw-kv">
                  <dt>Classificazione TARIC</dt><dd><strong>{taricCode}</strong></dd>
                  <dt>Certificato Doganale</dt><dd><strong>EUR.1 n. IT-DOG-2026-0428</strong></dd>
                  <dt>Lavorazione qualificata</dt><dd>100% Made in Italy (Tessitura, Taglio e Confezione completi)</dd>
                  <dt>Collaudo finale</dt><dd>Scheda {spec.quality.id} · Score {qualityLabel(data)}</dd>
                </dl>
              </Card>
            </>
          )}
        </>}

        {tab === 'Tracciabilità' && <Card title="Da dove arriva (Filiera Tracciata)">
          <div className="dw-trace-path">
            {[
              ['Materia prima', fabric.origin, `${spec.materialLabel} ${data.fabricLot}`],
              ['Filatura / Fornitore', fabric.supplier, `Certificato ${fabric.certificate}`],
              ['Confezione', data.factory, `Lotto ${data.lotId}`],
              ['Controllo qualità', 'Laboratorio accreditato', data.qualityResolved ? `${spec.quality.id} chiusa` : `${spec.quality.id} in verifica`],
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
              <Badge>{role === 'Brand' ? 'Dati di fornitura riservati' : 'Attestati di conformità doganale'}</Badge>
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
                <p className="dw-muted">Per riparazioni o rigenerazione del capo, conservare il codice {data.styleId} e rivolgersi al circuito certificato WEAVE.</p>
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
