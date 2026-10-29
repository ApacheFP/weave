import { renderProgram } from './drawingProgram.js';
import { reviewProgram } from './programReview.js';

// The reference is a fixed synthetic example; no uploaded image or AI model is processed.
export function createDemoProposal(example) {
  const program = structuredClone(example);
  renderProgram(program);
  return program;
}

export function renameDemoPart(program, index, name) {
  if (!Number.isInteger(index) || index < 0 || index >= program.parts.length || typeof name !== 'string' || !name.trim() || name.trim().length > 100) throw Error('Inserisci un nome per ogni parte, fino a 100 caratteri.');
  const next = structuredClone(program);
  next.parts[index].name = name.trim();
  renderProgram(next);
  return next;
}

export function summarizeDemoProposal(program) {
  const result = reviewProgram(program);
  return { parts: result.parts, operations: result.operations, elements: result.svgElements, warnings: result.warnings };
}
