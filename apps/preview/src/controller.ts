import type { DokployClient, GithubClient, Pull, Slot, SlotRecord, SlotStore } from './types.ts';

const eligible = (pr: Pull, repository: string) =>
  pr.state === 'open' &&
  !pr.draft &&
  pr.head.repo?.full_name === repository &&
  pr.base.repo.full_name === repository &&
  !pr.labels.some((label) => label.name === 'preview:off');

const idle = (slot: number): SlotRecord => ({ slot, owner: null, branch: null, phase: 'idle' });

/** Serial reconciliation treats SQLite as ownership; Dokploy handles build outcomes. */
export function createController({
  repository,
  slots,
  github,
  dokploy,
  store,
  logger = console,
}: {
  repository: string;
  slots: Slot[];
  github: GithubClient;
  dokploy: DokployClient;
  store: SlotStore;
  logger?: Pick<Console, 'error'>;
}) {
  const byNumber = new Map(slots.map((slot) => [slot.number, slot]));
  const getSlot = (number: number) => {
    const slot = byNumber.get(number);
    if (!slot) throw new Error(`Unknown preview slot ${number}`);
    return slot;
  };

  async function release(row: SlotRecord) {
    if (row.owner === null || row.branch === null) throw new Error('Cannot release an idle slot');
    const owner = row.owner;
    const slot = getSlot(row.slot);
    if (row.phase !== 'releasing') {
      row = { ...row, phase: 'releasing' };
      store.save(row);
    }
    const compose = await dokploy.inspect(row.slot);
    if (compose.branch !== row.branch && compose.branch !== slot.idleBranch)
      throw new Error(`Slot ${row.slot} branch changed outside the controller`);
    await dokploy.update(row.slot, { autoDeploy: false });
    await dokploy.stop(row.slot);
    await dokploy.update(row.slot, { branch: slot.idleBranch, autoDeploy: false });
    await github.comment(owner, `Preview stopped; ${slot.url} is no longer assigned to this PR.`);
    store.save(idle(row.slot));
  }

  /** First use of an unowned slot stops legacy previews before assigning its URL. */
  async function prepareIdle(slot: Slot) {
    const compose = await dokploy.inspect(slot.number);
    if (compose.autoDeploy !== false) await dokploy.update(slot.number, { autoDeploy: false });
    await dokploy.stop(slot.number);
    if (compose.branch !== slot.idleBranch)
      await dokploy.update(slot.number, { branch: slot.idleBranch, autoDeploy: false });
  }

  /** Resume an interrupted assignment; API errors retain ownership for a later retry. */
  async function activate(row: SlotRecord) {
    if (row.owner === null || row.branch === null) throw new Error('Cannot deploy an idle slot');
    const owner = row.owner;
    const slot = getSlot(row.slot);
    if (row.phase === 'assigned') {
      await dokploy.inspect(row.slot);
      await dokploy.update(row.slot, { branch: row.branch, autoDeploy: false });
      row = { ...row, phase: 'configured' };
      store.save(row);
    }
    if (row.phase === 'configured') {
      const compose = await dokploy.inspect(row.slot);
      if (compose.branch !== row.branch || compose.autoDeploy !== false)
        throw new Error(`Slot ${row.slot} branch or auto-deploy changed unexpectedly`);
      await dokploy.deploy(row.slot);
      row = { ...row, phase: 'deployed' };
      store.save(row);
    }
    if (row.phase === 'deployed') {
      const compose = await dokploy.inspect(row.slot);
      if (compose.branch !== row.branch)
        throw new Error(`Slot ${row.slot} branch changed unexpectedly`);
      await dokploy.update(row.slot, { autoDeploy: true });
      row = { ...row, phase: 'active' };
      store.save(row);
    }
    const compose = await dokploy.inspect(row.slot);
    if (compose.branch !== row.branch || compose.autoDeploy !== true)
      throw new Error(`Slot ${row.slot} branch or auto-deploy changed unexpectedly`);
    await github.comment(
      owner,
      `Preview slot ${row.slot} assigned: ${slot.url}\n\nDokploy builds this branch; the preview may still be building or may have failed. This link is not a readiness check.`,
    );
  }

  /** Refresh live PR intent on every run; closed and opted-out owners release first. */
  async function reconcile() {
    const prs = await github.pulls();
    const candidates = prs
      .filter((pr) => eligible(pr, repository))
      .toSorted((a, b) => a.created_at.localeCompare(b.created_at) || a.number - b.number);
    const byPr = new Map(candidates.map((pr) => [pr.number, pr]));
    let rows = store.list();
    for (const row of rows) {
      if (row.owner === null || (byPr.has(row.owner) && row.phase !== 'releasing')) continue;
      try {
        await release(row);
      } catch (error) {
        logger.error(`Cannot release slot ${row.slot}:`, error);
      }
    }
    rows = store.list();
    const owners = new Set(rows.filter((row) => row.owner !== null).map((row) => row.owner));
    for (const row of rows) {
      if (row.owner !== null) continue;
      try {
        await prepareIdle(getSlot(row.slot));
      } catch (error) {
        logger.error(`Cannot prepare slot ${row.slot}:`, error);
        continue;
      }
      const choice = candidates.find((pr) => !owners.has(pr.number));
      if (!choice) continue;
      const reserved: SlotRecord = {
        slot: row.slot,
        owner: choice.number,
        branch: choice.head.ref,
        phase: 'assigned',
      };
      store.save(reserved);
      owners.add(choice.number);
    }
    for (const row of store.list()) {
      if (row.owner === null || row.phase === 'releasing') continue;
      try {
        const pr = byPr.get(row.owner);
        if (!pr) continue; // Release on the next reconciliation.
        const current: SlotRecord =
          pr.head.ref === row.branch ? row : { ...row, branch: pr.head.ref, phase: 'assigned' };
        if (current !== row) store.save(current);
        await activate(current);
      } catch (error) {
        logger.error(`Cannot activate slot ${row.slot}:`, error);
      }
    }
    for (const pr of candidates) {
      if (!owners.has(pr.number)) {
        try {
          await github.comment(pr.number, 'Preview waiting for a free slot.');
        } catch (error) {
          logger.error(`Cannot comment on PR #${pr.number}:`, error);
        }
      }
    }
  }
  return { reconcile };
}
