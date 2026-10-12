import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleGroups } from '../src/modules.js';
import { explorePath, modulePath, moduleSlugs, pagePath, pagePaths, settingsSlugs, resolveRoute, readCurrentRoute, navigateTo } from '../src/routes.js';

const read = address => resolveRoute(new URL(address, 'https://weave.example'));

test('all available modules have unique readable paths independent of labels and numeric IDs', () => {
  assert.deepEqual(Object.keys(moduleSlugs).map(Number), moduleGroups[0].items.map(module => module.id));
  const paths = Object.keys(moduleSlugs).map(modulePath);
  assert.equal(new Set(paths).size, paths.length);
  for (const id of Object.keys(moduleSlugs)) {
    const path = modulePath(id);
    assert.match(path, /^\/atelier\/[a-z]+(?:-[a-z]+)*$/);
    assert.equal(read(path).moduleId, Number(id));
    assert.equal(read(path).kind, 'module');
    assert.equal(read(`/#/moduli/${id}`).path, path);
    assert.equal(read(`/moduli/${id}`).path, path);
  }
  assert.throws(() => modulePath(8));
});

test('workspace and every settings section round trip with legacy bookmarks', () => {
  for (const page of Object.keys(pagePaths)) {
    assert.equal(read(pagePath(page)).page, page);
    assert.equal(read(`/#/${page}`).path, pagePath(page));
  }
  for (const [section, slug] of Object.entries(settingsSlugs)) {
    const path = pagePath(`settings?section=${section}`);
    assert.equal(path, `/atelier/impostazioni/${slug}`);
    assert.equal(read(path).settingsSection, section);
    assert.equal(read(`/#/settings?section=${section}`).path, path);
  }
  assert.equal(read('/atelier/impostazioni').path, '/atelier/impostazioni/aspetto');
  assert.equal(read('/atelier/impostazioni?section=email').path, '/atelier/impostazioni/email');
  assert.equal(read('/#/settings?section=notifications').settingsSection, 'email');
});

test('inbox links preserve encoded message identities including reserved characters', () => {
  for (const message of ['inbox-sample-MG-0425', 'a/b?c#d% +']) {
    const target = `inbox?message=${encodeURIComponent(message)}`;
    const path = pagePath(target);
    assert.equal(read(path).inboxId, message);
    assert.equal(read(`/#/${target}`).path, path);
    assert.equal(read(`/atelier/inbox?message=${encodeURIComponent(message)}`).path, path);
  }
  assert.equal(read('/atelier/inbox/%broken').kind, 'not-found');
});

test('aliases, casing and separators canonicalize without silently accepting unknown pages', () => {
  for (const path of ['/', '/moduli', '/esplora', '/#/moduli']) assert.equal(read(path).path, explorePath);
  assert.equal(read('/Atelier//Modellistica/').path, modulePath(4));
  for (const path of ['/atelier/sconosciuto', '/moduli/999', '/atelier/impostazioni/sconosciuto', '/atelier/inbox/a/b', '/#/settings?section=__proto__']) assert.equal(read(path).kind, 'not-found');
  assert.throws(() => pagePath('settings?section=__proto__'));
  assert.throws(() => pagePath('https://untrusted.example'));
});

test('canonicalization replaces legacy history and navigation uses push, replace and popstate correctly', () => {
  const previousWindow = globalThis.window;
  const calls = [], events = [];
  const location = new URL('https://weave.example/#/moduli/4');
  const change = (method, path) => { calls.push({ method, path }); location.href = new URL(path, location).href; };
  globalThis.window = { location, history: { replaceState: (_state, _unused, path) => change('replace', path), pushState: (_state, _unused, path) => change('push', path) }, dispatchEvent: event => events.push(event.type) };
  try {
    assert.equal(readCurrentRoute().moduleId, 4);
    assert.deepEqual(calls, [{ method: 'replace', path: modulePath(4) }]);
    navigateTo(modulePath(4));
    assert.equal(calls.length, 1);
    navigateTo(pagePath('capi'));
    navigateTo(explorePath, { replace: true });
    assert.deepEqual(calls.slice(1), [{ method: 'push', path: '/atelier/capi' }, { method: 'replace', path: '/esplora' }]);
    assert.deepEqual(events, ['popstate', 'popstate']);
    location.href = 'https://weave.example/atelier/modellistica#module-workspace';
    readCurrentRoute();
    assert.equal(location.hash, '#module-workspace');
  } finally { globalThis.window = previousWindow; }
});
