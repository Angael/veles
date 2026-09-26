import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, deploymentStatus, plan } from './decisions.mjs';

function pr(number, labels = [], fork = false) {
  return {
    number,
    state: 'open',
    draft: false,
    labels: labels.map((name) => ({ name })),
    head: { repo: { fork, full_name: fork ? 'outsider/repo' : 'owner/repo' } },
    base: { repo: { full_name: 'owner/repo' } },
  };
}
function records(owners = {}) {
  return new Map([1, 2, 3].map((slot) => [slot, { owner: owners[slot] ?? null }]));
}
test('automatic assignment reserves lowest free slots deterministically and denies forks', () => {
  const result = plan([pr(4), pr(2), pr(1, [], true), pr(3)], records());
  assert.deepEqual(
    [...result],
    [
      [2, { mode: 'assigned', slot: 1 }],
      [3, { mode: 'assigned', slot: 2 }],
      [4, { mode: 'assigned', slot: 3 }],
    ],
  );
});
test('off overrides pins, invalid pins reject, busy pin never falls back', () => {
  assert.deepEqual(classify(pr(1, ['preview:off', 'preview:slot-1'])), { mode: 'off' });
  assert.deepEqual(classify(pr(1, ['preview:slot-1', 'preview:slot-2'])), { mode: 'invalid' });
  assert.deepEqual(classify(pr(1, ['preview:slot-4'])), { mode: 'invalid' });
  assert.deepEqual(plan([pr(2, ['preview:slot-1'])], records({ 1: 9 })).get(2), {
    mode: 'busy',
    slot: 1,
    owner: 9,
  });
});
test('existing ownership wins, pinned move cannot acquire second slot', () => {
  assert.deepEqual(plan([pr(2)], records({ 2: 2 })).get(2), { mode: 'assigned', slot: 2 });
  assert.deepEqual(plan([pr(2, ['preview:slot-3'])], records({ 2: 2 })).get(2), {
    mode: 'busy',
    slot: 2,
    owner: 2,
  });
  assert.deepEqual(plan([pr(2)], records({ 1: 2, 2: 2 })).get(2), { mode: 'invalid' });
});
test('a failed or interrupted reservation is not reused by a concurrent PR', () => {
  const result = plan([pr(12), pr(13), pr(14)], records({ 1: 11, 2: 12, 3: 13 }));
  assert.deepEqual(result.get(12), { mode: 'assigned', slot: 2 });
  assert.deepEqual(result.get(13), { mode: 'assigned', slot: 3 });
  assert.deepEqual(result.get(14), { mode: 'busy' });
});
test('off retains the reservation until the Compose is stopped; then waiting PR can acquire it', () => {
  const stopped = plan([pr(2, ['preview:off']), pr(3)], records({ 1: 2, 2: 8, 3: 9 }));
  assert.deepEqual(stopped.get(2), { mode: 'off' });
  assert.deepEqual(stopped.get(3), { mode: 'busy' });
  const cleaned = plan([pr(2, ['preview:off']), pr(3)], records({ 2: 8, 3: 9 }));
  assert.deepEqual(cleaned.get(3), { mode: 'assigned', slot: 1 });
});
test('closed old PR has no claim on newly reassigned slot', () => {
  assert.deepEqual(plan([pr(10)], records({ 1: 9, 2: 8, 3: 7 })).get(10), { mode: 'busy' });
  assert.deepEqual(plan([pr(10)], records({ 2: 8, 3: 7 })).get(10), { mode: 'assigned', slot: 1 });
});
test('only configured slots are assignable, and a pin to slot 3 waits for provisioning', () => {
  const result = plan([pr(2), pr(3), pr(4, ['preview:slot-3'])], records(), [1, 2]);
  assert.deepEqual(result.get(2), { mode: 'assigned', slot: 1 });
  assert.deepEqual(result.get(3), { mode: 'assigned', slot: 2 });
  assert.deepEqual(result.get(4), { mode: 'unavailable', slot: 3 });
});
test('only a completed matching operation and actual SHA can publish a URL', () => {
  const record = {
    operationId: 'op-1',
    targetSha: 'a'.repeat(40),
    requestedAt: Date.parse('2026-09-25T16:00:00Z'),
  };
  const deployed = {
    title: 'veles-preview:op-1',
    description: `Commit: ${record.targetSha}`,
    status: 'done',
    createdAt: '2026-09-25T16:00:20Z',
  };
  assert.equal(deploymentStatus([deployed], record), 'ready');
  assert.equal(deploymentStatus([{ ...deployed, status: 'running' }], record), 'pending');
  assert.equal(deploymentStatus([{ ...deployed, status: 'error' }], record), 'failed');
  assert.equal(
    deploymentStatus([{ ...deployed, description: `Commit: ${'b'.repeat(40)}` }], record),
    'conflict',
  );
  assert.equal(deploymentStatus([{ ...deployed, title: 'another build' }], record), 'conflict');
  assert.equal(
    deploymentStatus([{ ...deployed, createdAt: '2026-09-25T15:59:00Z' }], record),
    'pending',
  );
  assert.equal(
    deploymentStatus(
      [deployed, { ...deployed, title: 'another build', createdAt: '2026-09-25T16:00:30Z' }],
      record,
    ),
    'conflict',
  );
});
