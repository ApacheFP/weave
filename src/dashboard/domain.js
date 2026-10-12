import { additionalFabrics } from './productData.js';

export const euro = value => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
export const number = (value, digits = 0) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: digits }).format(value);
export const fabrics = additionalFabrics;
export const minQuantity = data => Math.max(data.produced, data.retailSold + data.wholesaleOrders.reduce((sum, order) => sum + order.qty, 0));
export const wholesaleAvailable = data => Math.max(0, data.quantity - data.retailSold - data.wholesaleOrders.reduce((sum, order) => sum + order.qty, 0));

export function totals(data) {
  const materials = data.consumption * data.fabricPrice + data.trims.reduce((sum, row) => sum + row.qty * row.price, 0);
  const labor = data.laborMinutes * data.hourlyRate / 60;
  const cost = materials + labor + data.logisticsCost;
  const shipped = data.wholesaleOrders.reduce((sum, row) => sum + row.shipped, 0);
  const approved = Math.max(0, data.produced - data.reworks);
  return { materials, labor, cost, approved, shipped, stock: Math.max(0, approved - shipped - data.retailSold), fabric: fabrics.find(item => item.id === data.fabricId), suggestedWholesale: Math.ceil(cost / (1 - data.margin / 100) / 5) * 5 };
}

export const retailAvailable = data => Math.min(totals(data).stock, wholesaleAvailable(data));

export function retailSale(data) {
  if (retailAvailable(data) < 1) return {};
  return { retailSold: data.retailSold + 1, retailAverage: Number(((data.retailAverage * data.retailSold + data.retail) / (data.retailSold + 1)).toFixed(2)) };
}

export function validStyleInput(input, items, source) {
  if (!input || typeof input !== 'object') return false;
  if (input.copy !== undefined && typeof input.copy !== 'boolean') return false;
  for (const key of ['title', 'collection']) {
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].trim().length > 80) return false;
  }
  if (typeof input.styleId !== 'string' || input.styleId.trim().length > 24 || !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(input.styleId.trim())) return false;
  if (items.some(item => item.styleId === input.styleId.trim().toUpperCase())) return false;
  if (!['number', 'string'].includes(typeof input.quantity) || (typeof input.quantity === 'string' && !input.quantity.trim())) return false;
  const quantity = Number(input.quantity);
  return Number.isInteger(quantity) && quantity >= (input.copy ? minQuantity(source) : 1) && quantity <= 10000;
}

const reviewInputs = {
  3: ['fabricId', 'fabricPrice', 'consumption', 'trims'],
  4: ['modelVersion', 'measurements', 'seam', 'grain', 'notches'],
  5: ['gradingChest', 'measurements'],
  7: ['markerWidth', 'consumption', 'waste', 'optimized'],
  9: ['fabricId', 'fabricPrice', 'consumption', 'trims', 'laborMinutes', 'hourlyRate', 'logisticsCost', 'margin', 'wholesale', 'retail'],
  10: ['quantity', 'factory', 'priority', 'start', 'end', 'delivery'],
};

export function applyProductPatch(previous, changes) {
  const next = { ...previous, ...changes };
  const changed = key => Object.hasOwn(changes, key) && JSON.stringify(changes[key]) !== JSON.stringify(previous[key]);
  if (changed('fabricId')) {
    const fabric = fabrics.find(item => item.id === next.fabricId);
    if (fabric) next.purchaseOrders = next.purchaseOrders.map(row => row.materialId === 'main' || row.id === 'ACQ-0271' ? { ...row, supplier: fabric.supplier, material: fabric.name } : row);
  }
  if (!Object.hasOwn(changes, 'phaseReviews')) {
    next.phaseReviews = { ...previous.phaseReviews };
    for (const [id, keys] of Object.entries(reviewInputs)) {
      if (next.phaseReviews[id] && keys.some(changed)) next.phaseReviews[id] = false;
    }
  }
  // A fitting approval belongs to the checked material and model dimensions.
  const approvedDrawing = product => product.technical?.versions?.find(version => version.id === product.technical.approvedId)?.snapshot?.artwork;
  const drawingChanged = next.technical?.approvedId && changed('technical') && JSON.stringify(approvedDrawing(previous)) !== JSON.stringify(approvedDrawing(next));
  if (changes.sampleApproved !== true && (drawingChanged || ['fabricId', 'measurements', 'seam', 'modelVersion'].some(changed))) {
    next.sampleApproved = false;
    next.sampleChecks = previous.sampleChecks.map(() => false);
  }
  return next;
}
