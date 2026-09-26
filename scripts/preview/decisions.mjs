export const slots = [1, 2, 3];
export const labelFor = (slot) => `preview:slot-${slot}`;

export function classify(pr) {
  const labels = pr.labels.map((label) => label.name);
  const requested = slots.filter((slot) => labels.includes(labelFor(slot)));
  if (labels.includes('preview:off')) return { mode: 'off' };
  if (
    labels.some(
      (label) => label.startsWith('preview:slot-') && !/^preview:slot-[123]$/.test(label),
    ) ||
    requested.length > 1
  )
    return { mode: 'invalid' };
  return requested.length ? { mode: 'pinned', slot: requested[0] } : { mode: 'auto' };
}

export function plan(prs, records, availableSlots = slots) {
  const decisions = new Map();
  const open = prs
    .filter(
      (pr) =>
        pr.state === 'open' &&
        !pr.draft &&
        !pr.head.repo.fork &&
        pr.head.repo.full_name === pr.base.repo.full_name,
    )
    .toSorted((a, b) => a.number - b.number);
  const owners = new Map();
  for (const slot of availableSlots) {
    const record = records.get(slot);
    if (record?.owner) owners.set(slot, record.owner);
  }
  for (const pr of open) {
    const request = classify(pr);
    if (
      request.mode !== 'off' &&
      request.mode !== 'invalid' &&
      [...owners.values()].filter((owner) => owner === pr.number).length > 1
    )
      decisions.set(pr.number, { mode: 'invalid' });
    else if (request.mode === 'invalid' || request.mode === 'off')
      decisions.set(pr.number, request);
    else if (request.mode === 'pinned') {
      if (!availableSlots.includes(request.slot)) {
        decisions.set(pr.number, { mode: 'unavailable', slot: request.slot });
        continue;
      }
      const owner = owners.get(request.slot);
      const other = availableSlots.find(
        (slot) => slot !== request.slot && owners.get(slot) === pr.number,
      );
      let choice = request;
      if (other) choice = { mode: 'busy', slot: other, owner: pr.number };
      else if (owner && owner !== pr.number) choice = { mode: 'busy', slot: request.slot, owner };
      decisions.set(pr.number, choice);
      if (!other && !owner) owners.set(request.slot, pr.number);
    } else {
      const current = availableSlots.find((slot) => owners.get(slot) === pr.number);
      const free = availableSlots.find((slot) => !owners.has(slot));
      decisions.set(
        pr.number,
        current || free ? { mode: 'assigned', slot: current || free } : { mode: 'busy' },
      );
      if (current || free) owners.set(current || free, pr.number);
    }
  }
  return decisions;
}

/** Trust only a completed deployment for this operation and commit; never a prior healthy stack. */
export function deploymentStatus(deployments, record) {
  const recent = deployments
    .filter((item) => Date.parse(item.createdAt) >= record.requestedAt - 5000)
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const latest = recent[0];
  if (!latest) return 'pending';
  if (latest.title !== `veles-preview:${record.operationId}`) return 'conflict';
  if (latest.status === 'error') return 'failed';
  if (latest.status !== 'done') return 'pending';
  return latest.description?.includes(`Commit: ${record.targetSha}`) ? 'ready' : 'conflict';
}
