import { classify, deploymentStatus, plan, slots } from './decisions.mjs';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const enabled = process.env.PREVIEW_ENABLED === 'true';
const config = enabled ? JSON.parse(process.env.PREVIEW_CONFIG || '{}') : {};
const api = 'https://api.github.com';
const marker = '<!-- veles-preview-controller -->';
const recordMarker = '<!-- veles-preview-slot:';

function requireConfig() {
  if (!repo || !token) throw new Error('GitHub repository and token required');
  if (!enabled) return;
  if (
    !Array.isArray(config.slots) ||
    config.slots.length < 1 ||
    config.slots.length > 3 ||
    !config.dokployUrl?.startsWith('https://') ||
    !config.sharedDatabaseUrl ||
    !config.sharedR2Bucket ||
    config.sharedDevConfirmed !== true ||
    !process.env.DOKPLOY_API_KEY
  )
    throw new Error('Preview disabled: shared dev resource or Dokploy configuration incomplete');
  const configuredSlots = config.slots.map((entry) => entry.slot);
  if (
    new Set(configuredSlots).size !== configuredSlots.length ||
    configuredSlots.some((slot) => !slots.includes(slot))
  )
    throw new Error('Preview disabled: slot numbers must be distinct and between 1 and 3');
  const seen = new Set();
  for (const entry of config.slots) {
    if (
      !entry.composeId ||
      !entry.url ||
      !entry.repository ||
      entry.repository !== repo ||
      !entry.environmentId ||
      !entry.idleBranch ||
      entry.domainConfirmed !== true
    )
      throw new Error(
        `Preview disabled: slot ${entry.slot} Compose, domain, or repository not confirmed`,
      );
    for (const value of [entry.composeId, entry.url]) {
      if (seen.has(value)) throw new Error('Preview disabled: duplicate slot Compose or URL');
      seen.add(value);
    }
    const url = new URL(entry.url);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash)
      throw new Error(`Slot ${entry.slot} requires a distinct HTTPS origin`);
  }
}
async function request(url, options = {}) {
  const response = await fetch(url.startsWith('https:') ? url : `${api}${url}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!response.ok)
    throw new Error(
      `GitHub API ${response.status} ${url}: ${(await response.text()).slice(0, 300)}`,
    );
  return response.status === 204 ? null : response.json();
}
async function list(path) {
  const items = [];
  for (let page = 1; ; page++) {
    const batch = await request(
      `/repos/${repo}/${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`,
    );
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}
async function github(path, method, data) {
  return request(`/repos/${repo}/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
async function dokploy(path, data) {
  const url = `${config.dokployUrl.replace(/\/$/, '')}/api/compose.${path}`;
  const response = await fetch(
    path === 'one' ? `${url}?composeId=${encodeURIComponent(data.composeId)}` : url,
    {
      method: path === 'one' ? 'GET' : 'POST',
      headers: { 'x-api-key': process.env.DOKPLOY_API_KEY, 'Content-Type': 'application/json' },
      ...(path === 'one' ? {} : { body: JSON.stringify(data) }),
    },
  );
  if (!response.ok) throw new Error(`Dokploy ${path} failed (${response.status})`);
  return response.json();
}
async function deployments(composeId) {
  const url = `${config.dokployUrl.replace(/\/$/, '')}/api/deployment.allByCompose?composeId=${encodeURIComponent(composeId)}`;
  const response = await fetch(url, { headers: { 'x-api-key': process.env.DOKPLOY_API_KEY } });
  if (!response.ok) throw new Error(`Dokploy deployments failed (${response.status})`);
  const history = await response.json();
  if (!Array.isArray(history)) throw new Error('Dokploy deployment history unavailable');
  return history;
}
function decode(issue, slot) {
  const match = issue.body?.match(
    new RegExp(`<!-- veles-preview-slot:${slot} ([A-Za-z0-9_-]+) -->`),
  );
  if (!match) throw new Error(`Slot ${slot} issue has no valid controller record`);
  const record = JSON.parse(Buffer.from(match[1], 'base64url').toString());
  if (
    record.slot !== slot ||
    !['free', 'deploying', 'awaiting-verification', 'ready', 'failed', 'releasing'].includes(
      record.state,
    )
  )
    throw new Error(`Corrupt slot ${slot} record`);
  if (record.owner === null) {
    if (record.state !== 'free' || record.generation !== null || record.deployedSha !== null)
      throw new Error(`Corrupt free slot ${slot} record`);
  } else if (
    !Number.isSafeInteger(record.owner) ||
    record.owner < 1 ||
    typeof record.generation !== 'string' ||
    !record.generation ||
    typeof record.branch !== 'string' ||
    !record.branch ||
    (record.deployedSha !== null && !/^[0-9a-f]{40}$/.test(record.deployedSha)) ||
    (record.targetSha !== null &&
      record.targetSha !== undefined &&
      !/^[0-9a-f]{40}$/.test(record.targetSha)) ||
    (record.operationId !== null &&
      record.operationId !== undefined &&
      typeof record.operationId !== 'string')
  ) {
    throw new Error(`Corrupt occupied slot ${slot} record`);
  }
  return record;
}
async function save(issue, record) {
  const body = `${recordMarker}${record.slot} ${Buffer.from(JSON.stringify(record)).toString('base64url')} -->\nSlot ${record.slot}: ${record.owner ? `reserved for #${record.owner} (${record.state})` : 'free'}.\nExpected commit: ${record.targetSha ?? 'none'}. Operation: ${record.operationId ?? 'none'}. Shared dev database and R2 are never reset, migrated, or cleaned by this controller.\nAdmin retry after investigating a failure: \`preview-retry-confirmed:${record.slot}:${record.owner}:${record.generation}:${record.retryCount ?? 0}\`.\n`;
  return github(`issues/${issue.number}`, 'PATCH', { body });
}
async function comment(pr, text) {
  const comments = await list(`issues/${pr.number}/comments`);
  const existing = comments.find(
    (item) => item.body?.startsWith(marker) && item.user?.type === 'Bot',
  );
  const body = `${marker}\n${text}`;
  if (existing?.body === body) return;
  if (existing) await github(`issues/comments/${existing.id}`, 'PATCH', { body });
  else await github(`issues/${pr.number}/comments`, 'POST', { body });
}
async function current(pr) {
  const value = await request(`/repos/${repo}/pulls/${pr.number}`);
  return value.state === 'open' &&
    !value.draft &&
    !value.head.repo.fork &&
    value.head.repo.full_name === repo
    ? value
    : null;
}
async function checked(issue, record, pr, expectedState) {
  const fresh = decode(await request(`/repos/${repo}/issues/${issue.number}`), record.slot);
  const actual = await current(pr);
  if (
    !actual ||
    fresh.owner !== pr.number ||
    fresh.generation !== record.generation ||
    fresh.state !== expectedState
  )
    throw new Error(`Slot ${record.slot} reservation changed; manual review needed`);
  return actual;
}
async function inspect(entry, permittedBranches) {
  const compose = await dokploy('one', { composeId: entry.composeId });
  if (
    compose.composeId !== entry.composeId ||
    compose.environmentId !== entry.environmentId ||
    compose.sourceType !== 'github' ||
    compose.owner !== repo.split('/')[0] ||
    compose.repository !== repo.split('/')[1] ||
    compose.autoDeploy !== false ||
    !permittedBranches.includes(compose.branch)
  )
    throw new Error(`Slot ${entry.slot} Dokploy source/branch differs from expected ownership`);
  if (
    !compose.domains?.some(
      (domain) =>
        domain.host === new URL(entry.url).hostname &&
        domain.https === true &&
        domain.enabled === true &&
        domain.serviceName === 'nginx' &&
        domain.port === 80,
    )
  )
    throw new Error(`Slot ${entry.slot} HTTPS domain is not routed to nginx:80`);
  if (typeof compose.env !== 'string')
    throw new Error(`Slot ${entry.slot} Dokploy environment unavailable`);
  const lines = new Map(
    compose.env
      .split(/\r?\n/)
      .filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  );
  if (
    lines.get('DATABASE_URL') !== config.sharedDatabaseUrl ||
    lines.get('R2_BUCKET_NAME') !== config.sharedR2Bucket ||
    lines.get('APP_URL') !== entry.url
  )
    throw new Error(`Slot ${entry.slot} Dokploy environment differs from shared dev configuration`);
  return compose;
}
async function retryConfirmed(issue, record) {
  const comments = await list(`issues/${issue.number}/comments`);
  const key = `preview-retry-confirmed:${record.slot}:${record.owner}:${record.generation}:${record.retryCount ?? 0}`;
  for (const item of comments) {
    if (item.body?.trim() !== key || item.user?.type === 'Bot') continue;
    const access = await request(
      `/repos/${repo}/collaborators/${encodeURIComponent(item.user.login)}/permission`,
    );
    if (access.permission === 'admin') return true;
  }
  return false;
}
async function healthy(url) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const response = await fetch(`${url.replace(/\/$/, '')}/api/health`, {
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    if (response?.ok) return true;
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  return false;
}
/** Reconciles current GitHub ownership with trusted Dokploy state; never changes shared data. */
async function main() {
  requireConfig();
  if (!enabled) {
    console.log('Preview deployment disabled (PREVIEW_ENABLED != true)');
    return;
  }
  const active = config.slots.map((entry) => entry.slot).toSorted((a, b) => a - b);
  const issues = await list('issues?state=all');
  const records = new Map();
  for (const slot of active) {
    const matches = issues.filter(
      (issue) => issue.title === `[preview-slot-${slot}]` && !issue.pull_request,
    );
    if (matches.length !== 1 || matches[0].state !== 'open')
      throw new Error(`Slot ${slot} requires exactly one open durable issue`);
    records.set(slot, { issue: matches[0], value: decode(matches[0], slot) });
  }
  const occupied = active
    .map((slot) => records.get(slot).value.owner)
    .filter((owner) => owner !== null);
  if (new Set(occupied).size !== occupied.length)
    throw new Error('A PR owns multiple slot records; refusing destructive reconciliation');
  const prs = await list('pulls?state=open');
  const decisions = plan(
    prs,
    new Map(active.map((slot) => [slot, records.get(slot).value])),
    active,
  );
  const byNumber = new Map(prs.map((pr) => [pr.number, pr]));
  const buildInFlight = active.some((slot) => {
    const record = records.get(slot).value;
    return record.operationId && ['deploying', 'awaiting-verification'].includes(record.state);
  });
  let buildStarted = false;
  for (const slot of active) {
    const { issue } = records.get(slot);
    let record = records.get(slot).value;
    const entry = config.slots.find((item) => item.slot === slot);
    try {
      const owner = record.owner && byNumber.get(record.owner);
      const decision = owner && decisions.get(owner.number);
      const keep =
        owner && decision?.slot === slot && ['assigned', 'pinned'].includes(decision.mode);
      if (record.owner && !keep) {
        if (record.state === 'failed' && !(await retryConfirmed(issue, record))) {
          await comment(
            { number: record.owner },
            `Preview slot ${slot} remains reserved after failure; admin retry required. URL withheld.`,
          );
          continue;
        }
        const actual = await request(`/repos/${repo}/pulls/${record.owner}`);
        const intent = classify(actual);
        if (
          actual.state === 'open' &&
          !actual.draft &&
          !actual.head.repo.fork &&
          actual.head.repo.full_name === repo &&
          (intent.mode === 'auto' || (intent.mode === 'pinned' && intent.slot === slot))
        )
          throw new Error('PR still requests this slot; refusing stale release');
        await inspect(entry, [record.branch, entry.idleBranch]);
        if (
          record.operationId &&
          record.deployedSha !== record.targetSha &&
          record.state !== 'releasing'
        ) {
          const status = deploymentStatus(await deployments(entry.composeId), record);
          if (status === 'pending') {
            if (Date.now() - record.requestedAt > 30 * 60 * 1000)
              throw new Error('Outstanding preview build could not be verified before release');
            await comment(
              actual,
              `Preview slot ${slot} release waiting for the in-flight build; URL withheld.`,
            );
            continue;
          }
          if (status === 'conflict')
            throw new Error('Unexpected Dokploy deployment; refusing release');
        }
        if (record.state !== 'releasing') {
          record = { ...record, state: 'releasing' };
          await save(issue, record);
        }
        const fresh = decode(await request(`/repos/${repo}/issues/${issue.number}`), slot);
        if (
          fresh.owner !== record.owner ||
          fresh.generation !== record.generation ||
          fresh.state !== 'releasing'
        )
          throw new Error('Reservation changed before stop');
        const latest = await request(`/repos/${repo}/pulls/${record.owner}`);
        const latestIntent = classify(latest);
        if (
          latest.state === 'open' &&
          !latest.draft &&
          !latest.head.repo.fork &&
          latest.head.repo.full_name === repo &&
          (latestIntent.mode === 'auto' ||
            (latestIntent.mode === 'pinned' && latestIntent.slot === slot))
        )
          throw new Error('PR reclaimed slot before stop');
        await dokploy('stop', { composeId: entry.composeId });
        await inspect(entry, [record.branch, entry.idleBranch]);
        await dokploy('update', {
          composeId: entry.composeId,
          branch: entry.idleBranch,
          autoDeploy: false,
        });
        await inspect(entry, [entry.idleBranch]);
        await save(issue, {
          slot,
          owner: null,
          generation: null,
          state: 'free',
          deployedSha: null,
        });
        await comment(
          actual,
          `Preview stopped; slot ${slot} is free. URL removed. Shared dev DB and R2 were not changed.`,
        );
        continue;
      }
      if (!record.owner) {
        const choice = prs.find(
          (pr) =>
            decisions.get(pr.number)?.slot === slot &&
            ['assigned', 'pinned'].includes(decisions.get(pr.number)?.mode),
        );
        if (!choice) continue;
        const actual = await current(choice);
        if (!actual) continue;
        const intent = classify(actual);
        if (intent.mode !== 'auto' && !(intent.mode === 'pinned' && intent.slot === slot)) continue;
        await inspect(entry, [entry.idleBranch]);
        record = {
          slot,
          owner: actual.number,
          branch: actual.head.ref,
          generation: `${Date.now()}-${actual.number}`,
          state: 'deploying',
          deployedSha: null,
        };
        await save(issue, record); // Reserve before changing Dokploy.
      }
      let pr = await checked(issue, record, { number: record.owner }, record.state);
      const intent = classify(pr);
      if (intent.mode !== 'auto' && !(intent.mode === 'pinned' && intent.slot === slot)) continue; // Next reconciliation releases it after verifying current intent.
      if (record.state === 'releasing')
        throw new Error('Slot release interrupted; admin review required');
      if (record.state === 'failed') {
        if (!(await retryConfirmed(issue, record))) {
          await comment(
            pr,
            `Preview slot ${slot} failed; reservation retained. Admin retry required. URL withheld.`,
          );
          continue;
        }
        record = {
          ...record,
          state: 'deploying',
          retryCount: (record.retryCount ?? 0) + 1,
          operationId: null,
          targetSha: null,
          requestedAt: null,
        };
        await save(issue, record);
      }
      if (record.operationId && ['deploying', 'awaiting-verification'].includes(record.state)) {
        await inspect(entry, [record.branch]);
        const status = deploymentStatus(await deployments(entry.composeId), record);
        if (status === 'conflict' || status === 'failed')
          throw new Error(`Dokploy deployment ${status}; ownership retained`);
        if (status === 'pending') {
          if (Date.now() - record.requestedAt > 30 * 60 * 1000)
            throw new Error('Dokploy deployment not verified within 30 minutes');
          await comment(
            pr,
            `Preview slot ${slot} deploying ${record.targetSha}; URL withheld. Workflow logs: ${process.env.GITHUB_SERVER_URL}/${repo}/actions/runs/${record.runId}.`,
          );
          continue;
        }
        pr = await checked(issue, record, pr, record.state);
        if (record.targetSha === pr.head.sha) {
          if (!(await healthy(entry.url))) throw new Error('Preview health check timed out');
          pr = await checked(issue, record, pr, record.state);
        }
        record = { ...record, state: 'ready', deployedSha: record.targetSha };
        await save(issue, record);
        if (record.deployedSha === pr.head.sha) {
          await comment(
            pr,
            `Preview ready: ${entry.url} (slot ${slot}, commit ${record.deployedSha}). Workflow logs: ${process.env.GITHUB_SERVER_URL}/${repo}/actions/runs/${record.runId}.`,
          );
          continue;
        }
      }
      if (record.state === 'ready' && record.deployedSha === pr.head.sha) {
        await inspect(entry, [record.branch]);
        if (deploymentStatus(await deployments(entry.composeId), record) !== 'ready')
          throw new Error('Dokploy deployment changed since preview became ready');
        continue;
      }
      if (buildInFlight || buildStarted) {
        await comment(
          pr,
          `Preview slot ${slot} reserved for ${pr.head.sha}; waiting for another preview build. URL withheld.`,
        );
        continue;
      }
      const compose = await inspect(entry, [record.branch, entry.idleBranch]);
      if (compose.branch !== record.branch && compose.branch !== entry.idleBranch)
        throw new Error('Dokploy branch drift');
      pr = await checked(issue, record, pr, record.state);
      if (compose.branch !== pr.head.ref)
        await dokploy('update', {
          composeId: entry.composeId,
          branch: pr.head.ref,
          autoDeploy: false,
        });
      await checked(issue, record, pr, record.state);
      const operationId = `${record.generation}-${Date.now()}`;
      record = {
        ...record,
        state: 'deploying',
        branch: pr.head.ref,
        targetSha: pr.head.sha,
        operationId,
        requestedAt: Date.now(),
        runId: process.env.GITHUB_RUN_ID,
      };
      await save(issue, record);
      buildStarted = true;
      await dokploy('deploy', {
        composeId: entry.composeId,
        title: `veles-preview:${operationId}`,
      });
      record = { ...record, state: 'awaiting-verification' };
      await save(issue, record);
      await comment(
        pr,
        `Preview slot ${slot} deployment requested for ${pr.head.sha}; URL withheld until the commit and health are verified.`,
      );
    } catch (error) {
      console.error(`Slot ${slot}: ${error.message}`);
      if (record.owner && record.state !== 'failed') {
        try {
          const fresh = decode(await request(`/repos/${repo}/issues/${issue.number}`), slot);
          if (
            fresh.owner !== record.owner ||
            fresh.generation !== record.generation ||
            fresh.state !== record.state
          )
            throw new Error('Reservation changed; refusing to overwrite issue');
          await save(issue, { ...record, state: 'failed' });
          await comment(
            { number: record.owner },
            `Preview slot ${slot} failed and remains reserved. URL withheld. Reason: ${error.message}`,
          );
        } catch (followup) {
          console.error(`Unable to record failure: ${followup.message}`);
        }
      }
      process.exitCode = 1;
    }
  }
  for (const pr of prs) {
    const decision = decisions.get(pr.number);
    if (decision?.mode === 'invalid')
      await comment(pr, 'Preview unavailable: invalid or conflicting slot labels.');
    else if (decision?.mode === 'unavailable')
      await comment(pr, `Preview slot ${decision.slot} is not configured yet.`);
    else if (decision?.mode === 'busy')
      await comment(
        pr,
        `Preview unavailable: ${decision.slot ? `slot ${decision.slot} is reserved` : 'all configured slots are reserved'}.`,
      );
    else if (
      decision?.mode === 'off' &&
      !active.some((slot) => records.get(slot).value.owner === pr.number)
    )
      await comment(pr, 'Preview disabled by preview:off; no URL.');
  }
}
try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
