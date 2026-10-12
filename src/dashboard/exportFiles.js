import { totals } from './domain.js';
import { materialUnit, productSizes, productSpec } from './productData.js';

export function download(name, contents, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvContents(rows) {
  // Spreadsheet formula markers remain dangerous after leading control/space characters.
  const safe = value => {
    const text = String(value);
    const literal = /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? "'" + text : text;
    return `"${literal.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + rows.map(row => row.map(safe).join(';')).join('\r\n');
}
export function csv(name, rows) {
  download(name, csvContents(rows), 'text/csv;charset=utf-8');
}

// A small real PDF for the demo, without adding a document library.
export async function techPack(data, drawings = []) {
  const t = totals(data);
  const version = data.technical?.exportVersion || data.technical?.versions.find(v => v.id === data.technical.approvedId) || data.technical?.versions.at(-1);
  const spec = version?.snapshot;
  const colors = spec?.colors || [];
  const category = productSpec(data), unit = materialUnit(data);
  const sections = [
    ['01 / IDENTITA E DISEGNO', `WEAVE - TECH PACK ${data.styleId}`, data.title, `Collezione ${data.collection} - ${spec?.fit || 'Regular'} fit`, `Disegno v${version?.number || 1} - ${version && version.id === data.technical?.approvedId ? 'APPROVATO' : 'BOZZA'}`, spec?.requirements || data.brief, 'Schizzo: ' + (data.sketchName || 'Non caricato'), ...colors.map(c => `Variante ${c.name}: ${c.code} / ${c.color}`), 'Documento dimostrativo'],
    [`02 / MISURE BASE - TAGLIA ${category.baseSize}`, ...(spec?.measurements || data.measurements).map(row => `${row.point}: ${row.value} cm / tolleranza +/-${spec?.tolerance || category.tolerance} cm`), ...Object.entries(category.partLabels).map(([key, label]) => `${label}: ${spec?.parts[key] ?? category.parts[key]} cm`), 'Taglie: ' + productSizes(data).join(' - '), category.gradeIndex === null ? 'Dimensione unica; nessuno sviluppo anatomico' : data.measurements[category.gradeIndex].point + ': +' + data.gradingChest + ' cm per taglia'],
    ['03 / MATERIALI E DISTINTA BASE', t.fabric.name, t.fabric.composition, 'Origine: ' + t.fabric.origin, `${category.materialLabel}: ${data.consumption.toFixed(2)} ${unit} x ${data.fabricPrice.toFixed(2)} EUR`, ...data.trims.map(row => `${row.name}: ${row.qty} ${row.unit} x ${row.price.toFixed(2)} EUR`), `Totale materiali: ${t.materials.toFixed(2)} EUR`, 'Disponibilita e colori da confermare nel modulo 3'],
    ['04 / COSTRUZIONE E NOTE', spec?.constraints || category.requirements, ...(spec?.notes || []).map((n, i) => `Nota ${i + 1}: ${n.text} / punto ${n.x}%, ${n.y}%`), `Margine ${data.category === 'knit' ? 'rimaglio' : 'cucitura'}: ${spec?.parts.seam || data.seam} cm`, `Tempo standard: ${data.laborMinutes} minuti`, 'Macchine: ' + [...new Set(category.operations.map(row => row[1]))].join(', '), `Ordine: ${data.orderId} / ${data.quantity} articoli`, 'Revisione: ' + (version?.note || 'Base demo'), 'Approvazione campione: ' + (data.sampleApproved ? 'Approvato' : 'Da completare')],
  ];
  const images = await Promise.all(drawings.map(async source => {
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
    try {
      const image = new Image(); image.src = url; await image.decode();
      const viewBox = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement.getAttribute('viewBox').split(' ').map(Number);
      const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = Math.round(900 * viewBox[3] / viewBox[2]);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const hex = Array.from(atob(canvas.toDataURL('image/jpeg', .9).split(',')[1]), c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('') + '>';
      return { width: canvas.width, height: canvas.height, hex };
    } finally { URL.revokeObjectURL(url); }
  }));
  const ascii = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, ' ').replace(/[\\()]/g, '\\$&');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [4 0 R 6 0 R 8 0 R 10 0 R] /Count 4 >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  sections.forEach((lines, index) => {
    const wrapped = lines.flatMap(line => String(line).match(/.{1,76}(?:\s|$)|.{1,76}/g) || ['']);
    const figureIds = images.length === 3 ? index === 1 ? [0, 1] : index === 3 ? [2] : [] : [];
    const textHeight = figureIds.length ? index === 1 ? 335 : 435 : 650;
    const leading = Math.min(20, textHeight / wrapped.length), font = Math.min(12, leading * .8);
    const figures = figureIds.map((id, n) => {
      const image = images[id], width = figureIds.length === 2 ? 245 : 340;
      const height = Math.min(figureIds.length === 2 ? 310 : 210, width * image.height / image.width);
      const w = height * image.width / image.height, x = figureIds.length === 2 ? 42 + n * 260 : (595 - w) / 2;
      return `q ${w} 0 0 ${height} ${x} 65 cm /I${id} Do Q`;
    }).join('\n');
    const stream = `0.93 0.89 0.82 rg 0 780 595 62 re f\n0.15 0.15 0.15 rg\nBT /F1 ${font} Tf 42 746 Td ${leading} TL\n${wrapped.map((line, i) => `${i ? 'T* ' : ''}(${ascii(line)}) Tj`).join('\n')}\nET\n${figures}\nBT /F1 9 Tf 42 36 Td (${ascii(data.styleId)} | WEAVE | ${index + 1}/4 | Demo) Tj ET`;
    const resources = figureIds.map(id => `/I${id} ${12 + id} 0 R`).join(' ');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> /XObject << ${resources} >> >> /Contents ${5 + index * 2} 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  images.forEach(image => objects.push(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${image.hex.length} >>\nstream\n${image.hex}\nendstream`));
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  download(`WEAVE-${data.styleId}-tech-pack.pdf`, pdf, 'application/pdf');
}
