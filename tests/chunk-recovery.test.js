import test from 'node:test';
import assert from 'node:assert/strict';
import { installChunkRecovery } from '../src/chunkRecovery.js';

function setup(now = 1_000) {
  const values = new Map();
  const listeners = new Map();
  const browserWindow = {
    sessionStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    location: { reloads: 0, reload() { this.reloads += 1; } },
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: type => listeners.delete(type),
  };
  const uninstall = installChunkRecovery(browserWindow, () => now);
  return {
    browserWindow,
    emit() {
      let prevented = false;
      listeners.get('vite:preloadError')({ preventDefault() { prevented = true; } });
      return prevented;
    },
    uninstall,
    advance(milliseconds) { now += milliseconds; },
  };
}

test('reloads once after a dynamic chunk failure, then allows one retry after cooldown', () => {
  const recovery = setup();
  assert.equal(recovery.emit(), true);
  assert.equal(recovery.browserWindow.location.reloads, 1);
  assert.equal(recovery.emit(), false);
  assert.equal(recovery.browserWindow.location.reloads, 1);

  recovery.advance(15_000);
  assert.equal(recovery.emit(), true);
  assert.equal(recovery.browserWindow.location.reloads, 2);
  recovery.uninstall();
});

test('leaves the error visible when session storage is unavailable', () => {
  const recovery = setup();
  recovery.browserWindow.sessionStorage.getItem = () => { throw new Error('storage disabled'); };
  assert.equal(recovery.emit(), false);
  assert.equal(recovery.browserWindow.location.reloads, 0);
  recovery.uninstall();
});
