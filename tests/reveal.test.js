import test from 'node:test';
import assert from 'node:assert/strict';
import { observePageReveals } from '../src/dashboard/reveal.js';

test('reveals every visible item in order and handles items added later', () => {
  const originals = { IntersectionObserver: globalThis.IntersectionObserver, MutationObserver: globalThis.MutationObserver, Node: globalThis.Node, document: globalThis.document };
  let intersection, mutation;
  globalThis.Node = { DOCUMENT_POSITION_FOLLOWING: 4, DOCUMENT_POSITION_PRECEDING: 2 };
  globalThis.document = { activeElement: null };
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = new Set(); intersection = this; }
    observe(element) { this.targets.add(element); }
    unobserve(element) { this.targets.delete(element); }
    disconnect() { this.targets.clear(); }
  };
  globalThis.MutationObserver = class { constructor(callback) { this.callback = callback; mutation = this; } observe() {} disconnect() {} };
  const element = index => ({
    index, nodeType: 1, classList: { values: new Set(), add(value) { this.values.add(value); }, remove(value) { this.values.delete(value); } },
    style: { values: {}, setProperty(key, value) { this.values[key] = value; }, removeProperty(key) { delete this.values[key]; } },
    addEventListener() {}, removeEventListener() {},
    matches: () => false, contains: () => false,
    compareDocumentPosition(other) { return this.index < other.index ? 4 : 2; },
  });
  const children = Array.from({ length: 12 }, (_, index) => element(index));
  const root = { tagName: 'DIV', classList: [], parentElement: null, children, querySelectorAll: () => [], closest: () => null };
  try {
    let animate = true;
    const cleanup = observePageReveals(root, () => animate);
    assert.equal(intersection.targets.size, 12);
    intersection.callback(children.map(target => ({ target, isIntersecting: true })));
    assert.equal(children[8].style.values['--dw-reveal-delay'], '520ms');
    assert.equal(children[9].style.values['--dw-reveal-delay'], '585ms');
    assert.equal(children[11].style.values['--dw-reveal-delay'], '715ms');
    const added = element(12); children.push(added); mutation.callback([{ addedNodes: [added] }]);
    assert.ok(intersection.targets.has(added));
    intersection.callback([{ target: added, isIntersecting: true }]);
    assert.ok(added.classList.values.has('dw-reveal-active'));
    const resizing = element(13); children.push(resizing); mutation.callback([{ addedNodes: [resizing] }]);
    animate = false;
    intersection.callback([{ target: resizing, isIntersecting: true }]);
    assert.ok(!resizing.classList.values.has('dw-reveal-active'));
    assert.ok(!resizing.classList.values.has('dw-reveal-pending'));
    cleanup();
  } finally {
    for (const [key, value] of Object.entries(originals)) value === undefined ? delete globalThis[key] : globalThis[key] = value;
  }
});
