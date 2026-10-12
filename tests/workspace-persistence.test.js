import test from 'node:test';
import assert from 'node:assert/strict';
import { flushLatestWorkspace } from '../src/dashboard/useWorkspacePersistence.js';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const nextTurn = () => new Promise(resolve => setImmediate(resolve));

test('flush waits for a mutation that arrives during the first save before React queues it', async () => {
  const original = {}, first = { title: 'A' }, latest = { title: 'B' };
  const current = { current: first }, saved = { current: original };
  const gates = [deferred(), deferred()], snapshots = [];
  const save = async snapshot => {
    const gate = gates[snapshots.length];
    snapshots.push(snapshot);
    await gate.promise;
    saved.current = snapshot;
    return true;
  };
  let settled = false;
  const flushing = flushLatestWorkspace(current, saved, save).then(success => { settled = true; return success; });
  assert.deepEqual(snapshots, [first]);
  current.current = latest;
  gates[0].resolve();
  await nextTurn();
  assert.deepEqual(snapshots, [first, latest]);
  assert.equal(settled, false);
  gates[1].resolve();
  assert.equal(await flushing, true);
  assert.equal(saved.current, latest);
});

test('flush reports failure when the newer mutation cannot be saved', async () => {
  const first = { title: 'A' }, latest = { title: 'B' };
  const current = { current: first }, saved = { current: {} };
  const gate = deferred(), snapshots = [];
  const save = async snapshot => {
    snapshots.push(snapshot);
    if (snapshots.length > 1) return false;
    await gate.promise;
    saved.current = snapshot;
    return true;
  };
  const flushing = flushLatestWorkspace(current, saved, save);
  current.current = latest;
  gate.resolve();
  assert.equal(await flushing, false);
  assert.deepEqual(snapshots, [first, latest]);
  assert.equal(saved.current, first);
  assert.equal(current.current, latest);
});

test('flush stops on the first save failure and leaves the latest workspace available', async () => {
  const original = {}, latest = { title: 'A' };
  const current = { current: latest }, saved = { current: original };
  let calls = 0;
  assert.equal(await flushLatestWorkspace(current, saved, async () => { calls++; return false; }), false);
  assert.equal(calls, 1);
  assert.equal(current.current, latest);
  assert.equal(saved.current, original);
});

test('flush succeeds without a write when the current workspace is already saved', async () => {
  const workspace = {}, current = { current: workspace }, saved = { current: workspace };
  assert.equal(await flushLatestWorkspace(current, saved, () => assert.fail('No write is required')), true);
});
