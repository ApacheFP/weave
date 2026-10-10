import { creativeDefaults } from './creativeData.js';

export function readSketchFile(file, done, notify) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) { notify('Scegli un file JPG, PNG, WebP o PDF fino a 8 MB.'); return; }
  const reader = new FileReader();
  reader.onload = () => done({ id: crypto.randomUUID(), src: reader.result, name: file.name, type: file.type, size: file.size });
  reader.onerror = () => notify('Non è stato possibile leggere il file. Riprova.');
  reader.readAsDataURL(file);
}

// shortcut: extraction and coherence checks are explicit demo scenarios, not image analysis.
export function sketchHandoff(previous, sketch, module = 1) {
  const creative = previous.creative || creativeDefaults();
  return {
    identityAssigned: true, conceptApproved: false, techGenerated: false,
    sketch: sketch.type === 'application/pdf' ? null : sketch.src, sketchFile: sketch, sketchName: sketch.name,
    technical: null, phaseReviews: { ...previous.phaseReviews, 1: false, 2: false },
    creative: { ...creative, concept: { sketch, palette: [], moodboard: [], references: structuredClone(creative.referenceFiles || []), paletteOrigin: 'Vuota', moodboardOrigin: 'Vuoto', sketchKind: sketch.type === 'application/pdf' ? 'PDF non analizzato' : 'Matita', receivedAt: new Date().toISOString(), sourceModule: module, inputs: { ...creative.inputs } } },
  };
}
