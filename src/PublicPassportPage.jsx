import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useDemo } from './dashboard/DemoContext.jsx';
import { euro, qualityLabel, totals, fabrics } from './dashboard/domain.js';
import { productSizes, productSpec } from './dashboard/productData.js';
import { MediaImage, productAsset } from './dashboard/Media.jsx';
import { Badge, Button, Card, Icon, Metrics, Tabs } from './dashboard/ui.jsx';
import { navigateTo, modulePath } from './routes.js';

export default function PublicPassportPage({ styleId: initialStyleId, entered = false, onBack }) {
  const demo = useDemo();
  const items = demo?.workspaceItems || [];
  const [selectedStyleId, setSelectedStyleId] = useState(() => initialStyleId || demo?.data?.styleId || 'MG-0425');
  const [role, setRole] = useState('Consumatore');
  const [repairRequested, setRepairRequested] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState('');

  // Find target garment
  const targetItem = items.find(item => item.styleId === selectedStyleId) || demo?.data || items[0];

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/passaporto/${targetItem?.styleId || 'MG-0425'}`
    : `/passaporto/${targetItem?.styleId || 'MG-0425'}`;

  useEffect(() => {
    let active = true;
    QRCode.toString(currentUrl, {
      type: 'svg',
      margin: 1,
      width: 76,
      color: { dark: '#1c1914', light: '#ffffff' }
    })
      .then(res => { if (active) setQrSvg(res); })
      .catch(() => {});
    return () => { active = false; };
  }, [currentUrl]);

  if (!targetItem) {
    return (
      <div className="dw-app">
        <main className="dw-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h2>Passaporto non trovato</h2>
          <p className="dw-muted">Il codice stile specificato non è presente nell’Atelier.</p>
          <div style={{ marginTop: 20 }}>
            <Button primary onClick={() => onBack ? onBack() : navigateTo('/atelier')}>
              Torna all'Atelier
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const spec = productSpec(targetItem);
  const fabric = fabrics.find(item => item.id === targetItem.fabricId) || fabrics[0];
  const { cost } = totals(targetItem);
  const trimsCost = targetItem.trims?.reduce((sum, row) => sum + row.qty * row.price, 0) || 0;
  const fabricCost = targetItem.consumption * targetItem.fabricPrice;
  const laborCost = (targetItem.laborMinutes * targetItem.hourlyRate) / 60;

  function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const taricCode = targetItem.category === 'knit'
    ? '6110.12.90 (Maglieria in lana/cashmere)'
    : targetItem.category === 'trousers'
      ? '6204.62.31 (Pantaloni in lana pettinata)'
      : '4202.22.10 (Borse con superficie in tessuto)';

  return (
    <div className="dw-app">
      <div className="dw-main" style={{ height: '100svh', overflowY: 'auto' }}>
        <header className="dw-header">
          <button
            type="button"
            className="dw-brand"
            onClick={() => { if (onBack) onBack(); else navigateTo('/atelier'); }}
            title="Torna all'Atelier"
          >
            WEAVE
          </button>
          <div className="dw-breadcrumb">
            <span>Passaporto Digitale di Prodotto (ESPR)</span>
            <span>/</span>
            <strong className="dw-breadcrumb-product">{targetItem.title}</strong>
            <Badge tone="good">DPP UE Conforme</Badge>
          </div>
          <div className="dw-actions">
            <Button
              onClick={() => {
                if (onBack) onBack();
                else navigateTo(entered ? modulePath(19) : '/atelier');
              }}
            >
              ← Torna all'Atelier
            </Button>
          </div>
        </header>

        <main className="dw-page" style={{ maxWidth: 1120 }}>
          {/* Page Head */}
          <div className="dw-page-head">
            <div>
              <div className="dw-page-kicker">
                <span className="dw-eyebrow">Digital Product Passport UE 2024/1781</span>
                <span>·</span>
                <span>Lotto {targetItem.lotId}</span>
              </div>
              <h1>{targetItem.title}</h1>
              <p>{targetItem.variant} · {targetItem.collection} · Stile {targetItem.styleId}</p>
            </div>
            <div className="dw-actions">
              <Button onClick={handleCopy}>
                {copied ? '✓ Link copiato' : 'Copia link'}
              </Button>
            </div>
          </div>

          {/* Capsule selector if multiple items */}
          {items.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              <span className="dw-eyebrow" style={{ flexShrink: 0 }}>Capsule:</span>
              {items.map(item => (
                <button
                  key={item.styleId}
                  type="button"
                  className={`dw-btn ${item.styleId === targetItem.styleId ? 'dw-primary' : ''}`}
                  style={{ height: 28, fontSize: 12, borderRadius: 14, padding: '0 12px' }}
                  onClick={() => setSelectedStyleId(item.styleId)}
                >
                  {item.title} · {item.variant} ({item.styleId})
                </button>
              ))}
            </div>
          )}

          {/* Role Selector Card */}
          <Card
            className="dw-role-selector-card"
            style={{ marginBottom: 20, background: 'var(--surface-2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="eye" size={16} />
                <strong style={{ fontSize: 13 }}>Livello di consultazione DPP:</strong>
              </div>
              <Tabs
                items={['Consumatore', 'Brand & Atelier', 'Autorità & Dogana']}
                selected={role}
                onChange={setRole}
                label="Livello di accesso DPP"
              />
            </div>
            <p className="dw-muted" style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5 }}>
              {role === 'Consumatore' && 'Vista pubblica del consumatore finale: trasparenza delle fibre nobili certificate, sostenibilità ambientale, tracciabilità e cura. I costi industriali e i margini del brand sono protetti.'}
              {role === 'Brand & Atelier' && 'Vista riservata atelier: distinta analitica del costo primo di produzione, margini commerciali wholesale/retail e bilancio quantitativo del lotto.'}
              {role === 'Autorità & Dogana' && 'Dossier ufficiale di vigilanza del mercato: conformità al Regolamento UE ESPR 2024/1781, test chimico REACH (assenza PFAS), certificato doganale EUR.1 Made in Italy e marcatura eIDAS.'}
            </p>
          </Card>

          {/* Main Two-Column Layout */}
          <div className="dw-passport-layout">
            {/* Left Column: Product summary & certifications */}
            <div className="dw-stack">
              <Card
                className="dw-passport-profile"
                title={targetItem.title}
                note={`${targetItem.styleId} · ${targetItem.collection}`}
                actions={<Badge tone="good">Attivo & Conforme</Badge>}
              >
                <div className="dw-passport-photo">
                  <MediaImage asset={productAsset(targetItem, false)} alt={targetItem.title} />
                </div>
                <dl className="dw-kv">
                  <dt>Variante</dt>
                  <dd>{targetItem.variant}</dd>
                  <dt>Manifattura</dt>
                  <dd>{targetItem.factory} · Italia</dd>
                  <dt>Taglie</dt>
                  <dd>{productSizes(targetItem).join(' / ')}</dd>
                  <dt>Lotto produzione</dt>
                  <dd>{targetItem.lotId}</dd>
                  <dt>Vestibilità</dt>
                  <dd>{targetItem.technical?.fit || spec.fit}</dd>
                </dl>
              </Card>

              <Card title="Certificazioni del capo">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone="good">OEKO-TEX Standard 100</Badge>
                    <small className="dw-muted">Assenza sostanze nocive</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone="good">Mulesing-Free</Badge>
                    <small className="dw-muted">Benessere animale tracciato</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone="good">100% Made in Italy</Badge>
                    <small className="dw-muted">EUR.1 Dogane Prato/Biella</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone="good">ESPR Conforme</Badge>
                    <small className="dw-muted">Reg. UE 2024/1781</small>
                  </div>
                </div>
              </Card>

              <Card title="QR Identificativo">
                <div className="dw-qr-label" style={{ display: 'flex', gap: 12, alignItems: 'center', margin: 0 }}>
                  <div
                    style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 4, background: '#fff', flexShrink: 0 }}
                    dangerouslySetInnerHTML={{ __html: qrSvg || '<svg width="76" height="76"></svg>' }}
                  />
                  <div>
                    <strong style={{ fontSize: 13, display: 'block' }}>{targetItem.styleId}</strong>
                    <small className="dw-muted" style={{ display: 'block', margin: '2px 0 8px' }}>Scansiona per riaprire questo passaporto</small>
                    <Button onClick={handleCopy} style={{ height: 26, fontSize: 11, padding: '0 8px' }}>
                      {copied ? '✓ Copiato' : 'Copia link'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Dynamic Role-Specific Content */}
            <div className="dw-stack">
              {/* ROLE: CONSUMATORE */}
              {role === 'Consumatore' && (
                <>
                  <Card title="Composizione & Fibre Certificate" note="OEKO-TEX Standard 100 · Mulesing-Free">
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-2)' }}>
                      {fabric.composition}. {targetItem.category === 'knit' ? 'Filato ritorto di pregio con finissaggio naturale a vapore.' : 'Materia prima selezionata da filiera italiana tracciata.'}
                    </p>
                    <div className="dw-composition" style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'var(--surface-3)', margin: '12px 0' }}>
                      <span style={{ width: `${fabric.wool || 90}%`, background: 'var(--accent)', height: '100%' }} />
                      <span style={{ width: `${100 - (fabric.wool || 90)}%`, background: 'var(--accent-soft)', height: '100%' }} />
                    </div>
                    <dl className="dw-kv" style={{ marginTop: 12 }}>
                      <dt>Origine materia prima</dt><dd><strong>{fabric.origin}</strong></dd>
                      <dt>Filatura / Tessitura</dt><dd><strong>{fabric.supplier}</strong></dd>
                      <dt>Confezione sartoriale</dt><dd><strong>{targetItem.factory} · Italia</strong></dd>
                      <dt>Certificazione etica</dt><dd>Assenza sostanze nocive · Pascolo certificato</dd>
                    </dl>
                  </Card>

                  <Card title="Impronta Ambientale & Circolarità" note="Indicatori certificati secondo standard ESPR">
                    <Metrics items={[
                      ['CO₂ Stimata / Capo', spec.co2, '–28% rispetto a media settore'],
                      ['Indice Riparabilità', '9.4 / 10', spec.repair],
                      ['Scarto Recuperato', '100%', 'Ritagli re-immessi in filiera']
                    ]} />
                  </Card>

                  <Card title="Tracciabilità della Filiera" note="5 passaggi verificati lungo la filiera">
                    <div className="dw-trace-path">
                      {[
                        ['1. Materia prima & fibre', fabric.origin, `${fabric.name} tracciato. Pascolo certificato e controllo qualità della fibra.`],
                        ['2. Filatura e tintura ecologica', fabric.supplier, `Lotto ${targetItem.fabricLot}. Tintura a circuito chiuso con recupero del 92% delle acque.`],
                        ['3. Taglio e confezione sartoriale', targetItem.factory, `Commessa ${targetItem.orderId}. Manifattura artigianale con maestranze specializzate.`],
                        ['4. Controllo qualità capo per capo', 'Laboratorio accreditato', `Ispezione superata con score ${qualityLabel(targetItem)}. Tolleranze conformi al mm.`],
                        ['5. Passaporto Digitale attivato', 'Piattaforma WEAVE', 'Identità digitale registrata in conformità con la normativa europea ESPR.']
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
                  </Card>

                  <Card title="Cura & Longevità" note="Istruzioni per preservare il capo nel tempo">
                    <div className="dw-care">
                      <MediaImage asset={productAsset(targetItem, 'trims')} />
                      <div>
                        <h3 style={{ margin: '0 0 6px', fontSize: 14 }}>Fallo durare nel tempo</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{spec.care}</p>
                        <p className="dw-muted" style={{ marginTop: 10 }}>
                          💡 <strong>Consiglio dell'artigiano:</strong> riponi sempre il capo piegato su un ripiano asciutto (evita la gruccia se in maglia). Una corretta manutenzione garantisce decenni di vestibilità.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card title="Servizio Seconda Vita & Garanzia Circolare" note="Riparazione artigianale garantita da WEAVE">
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Se nel tempo questo capo necessita di un rammendo, sostituzione bottoni o rigenerazione delle fibre, puoi attivare il servizio circolare WEAVE con ritiro a domicilio.
                    </p>
                    {repairRequested ? (
                      <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }}>
                        ✓ <strong>Richiesta di assistenza registrata per {targetItem.styleId}.</strong> Riceverai le istruzioni di spedizione all'indirizzo associato al profilo.
                      </div>
                    ) : (
                      <Button primary onClick={() => setRepairRequested(true)}>
                        Richiedi servizio di rammendo o riciclo
                      </Button>
                    )}
                  </Card>
                </>
              )}

              {/* ROLE: BRAND & ATELIER */}
              {role === 'Brand & Atelier' && (
                <>
                  <Card
                    title="Scomposizione Analitica Costo Industriale"
                    note="Distinta analitica franco fabbrica (Dato Riservato Atelier)"
                    actions={<Badge tone="warn">Confidenziale</Badge>}
                  >
                    <div className="dw-table-wrap">
                      <table className="dw-table">
                        <thead>
                          <tr>
                            <th>Voce di costo</th>
                            <th>Parametro di calcolo</th>
                            <th style={{ textAlign: 'right' }}>Importo unitario</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Materia prima principale</strong></td>
                            <td>{targetItem.consumption} {fabric.unit || 'm'} × {euro(targetItem.fabricPrice)}/{fabric.unit || 'm'}</td>
                            <td style={{ textAlign: 'right' }}><strong>{euro(fabricCost)}</strong></td>
                          </tr>
                          <tr>
                            <td><strong>Fodere, bottoni e accessori</strong></td>
                            <td>{targetItem.trims?.length || 0} componenti da distinta base</td>
                            <td style={{ textAlign: 'right' }}><strong>{euro(trimsCost)}</strong></td>
                          </tr>
                          <tr>
                            <td><strong>Confezione e manodopera</strong></td>
                            <td>{targetItem.laborMinutes} min @ {euro(targetItem.hourlyRate)}/h</td>
                            <td style={{ textAlign: 'right' }}><strong>{euro(laborCost)}</strong></td>
                          </tr>
                          <tr>
                            <td><strong>Logistica protetta & packaging</strong></td>
                            <td>Corriere espresso e imballaggio certificato</td>
                            <td style={{ textAlign: 'right' }}><strong>{euro(targetItem.logisticsCost)}</strong></td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <th colSpan={2}>Costo Industriale Unitario Finito</th>
                            <th style={{ textAlign: 'right', fontSize: 15 }}>{euro(cost)}</th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </Card>

                  <Card title="Politica di Pricing & Margini Commerciali" note="Ricarichi all'ingrosso e al dettaglio">
                    <Metrics items={[
                      ['Listino Wholesale (B2B)', euro(targetItem.wholesale), `Margine atelier: ${targetItem.margin}%`],
                      ['Listino Retail (B2C)', euro(targetItem.retail), 'Moltiplicatore 2.0x su wholesale'],
                      ['Markup su Costo', `${(targetItem.retail / cost).toFixed(2)}x`, 'Redditività su costo industriale']
                    ]} />
                  </Card>

                  <Card title="Avanzamento Produzione & Bilancio Resa" note={`Manifattura ${targetItem.factory}`}>
                    <dl className="dw-kv">
                      <dt>Ordine di produzione</dt><dd><strong>{targetItem.orderId}</strong></dd>
                      <dt>Lotto di confezione</dt><dd><strong>{targetItem.lotId}</strong></dd>
                      <dt>Capi approvati a stock</dt><dd><strong style={{ color: 'var(--green, #16a34a)' }}>{targetItem.produced} / {targetItem.quantity} capi</strong> ({Math.round((targetItem.produced / targetItem.quantity) * 100)}%)</dd>
                      <dt>Scarto reale vs teorico</dt><dd><strong>{targetItem.actualWaste}%</strong> (scarto teorico da piazzamento: {targetItem.waste}%)</dd>
                      <dt>Fornitore di tessuto riservato</dt><dd>{fabric.supplier} · Lotto pezza {targetItem.fabricLot}</dd>
                      <dt>Collaudo finale qualità</dt><dd>Score {qualityLabel(targetItem)}</dd>
                    </dl>
                  </Card>
                </>
              )}

              {/* ROLE: AUTORITÀ & DOGANA */}
              {role === 'Autorità & Dogana' && (
                <>
                  <Card
                    title="Fascicolo di Conformità ESPR (Reg. UE 2024/1781)"
                    note="Accesso autorizzato per autorità di vigilanza del mercato e dogane"
                    actions={<Badge tone="good">Depositato e Conforme</Badge>}
                  >
                    <dl className="dw-kv">
                      <dt>Regolamento applicabile</dt>
                      <dd><strong>ESPR 2024/1781</strong> (Ecodesign for Sustainable Products - Digital Product Passport Textiles)</dd>
                      <dt>ID Univoco URN europeo</dt>
                      <dd><code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>urn:dpp:eu:it:weave:{targetItem.styleId}:{targetItem.lotId}</code></dd>
                      <dt>Operatore responsabile</dt>
                      <dd>Atelier WEAVE Prato / Biella (P.IVA IT-08912340489 · Codice EORI IT08912340489)</dd>
                      <dt>Ente di notifica / Registro</dt>
                      <dd>Camera di Commercio & Registro Nazionale Imprese Tessili IT</dd>
                    </dl>
                  </Card>

                  <Card title="Conformità Sostanze Chimiche REACH (Reg. CE 1907/2006)" note="Report analitico di laboratorio accreditato">
                    <div className="dw-table-wrap">
                      <table className="dw-table">
                        <thead>
                          <tr>
                            <th>Parametro analizzato</th>
                            <th>Metodo di prova</th>
                            <th>Limite normativo</th>
                            <th>Esito</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>PFAS (Sostanze perfluoroalchiliche)</strong></td>
                            <td>CEN/TS 15968</td>
                            <td>&lt; 0.025 mg/kg</td>
                            <td><Badge tone="good">Assenti (&lt;0.01)</Badge></td>
                          </tr>
                          <tr>
                            <td><strong>Coloranti azoici e ammine</strong></td>
                            <td>EN ISO 14362-1</td>
                            <td>&lt; 20 mg/kg</td>
                            <td><Badge tone="good">Conforme (&lt;5)</Badge></td>
                          </tr>
                          <tr>
                            <td><strong>Metalli pesanti estraibili</strong></td>
                            <td>EN ISO 105-E04</td>
                            <td>OEKO-TEX Classe II</td>
                            <td><Badge tone="good">Conforme</Badge></td>
                          </tr>
                          <tr>
                            <td><strong>Formaldeide libera</strong></td>
                            <td>EN ISO 14184-1</td>
                            <td>&lt; 75 mg/kg</td>
                            <td><Badge tone="good">Non rilevata</Badge></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="dw-muted" style={{ margin: '12px 0 0' }}>
                      Rapporto di prova ufficiale: <strong>LAB-CHEM-IT-2026-9041</strong> rilasciato da Laboratorio Chimico Certificato Accredia.
                    </p>
                  </Card>

                  <Card title="Origine Doganale Preferenziale (Made in Italy Integrale)" note="Certificazione EUR.1">
                    <dl className="dw-kv">
                      <dt>Codice TARIC</dt>
                      <dd><strong>{taricCode}</strong></dd>
                      <dt>Certificato di Origine</dt>
                      <dd><strong>EUR.1 n. IT-DOG-2026-0428</strong> (Ufficio delle Dogane di Prato)</dd>
                      <dt>Lavorazione qualificata</dt>
                      <dd>100% Made in Italy (Tessitura, Taglio e Confezione completi in territorio nazionale)</dd>
                      <dt>Collaudo e tolleranze</dt>
                      <dd>Scheda collaudo {spec.quality.id} · Score {qualityLabel(targetItem)}</dd>
                    </dl>
                  </Card>

                  <Card title="Integrità Crittografica & Marcatura Temporale eIDAS" note="Immutabilità del record registrata su registro elettronico">
                    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', padding: 12, borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.6, color: 'var(--text)' }}>
                      <div><strong>HASH_SHA256:</strong> d8a7f4e9102b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012345678abcdef0123</div>
                      <div><strong>TIMESTAMP_EIDAS:</strong> 2026-10-27T10:00:00.000Z</div>
                      <div><strong>ISSUER:</strong> CN=WEAVE Trust Authority, O=WEAVE Platform, C=IT</div>
                      <div><strong>STATUS:</strong> VALID_AUTHENTIC_RECORD</div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>

          <footer style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
            Passaporto Digitale di Prodotto conforme al Regolamento Europeo ESPR 2024/1781.<br />
            Piattaforma di tracciabilità della filiera tessile WEAVE © {new Date().getFullYear()}.
          </footer>
        </main>
      </div>
    </div>
  );
}
