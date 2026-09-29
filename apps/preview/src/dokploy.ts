import { type } from 'arktype';
import type { DokployClient, Slot } from './types.ts';

type DokployOptions = {
  url: string;
  apiKey: string;
  repository: string;
  environmentId: string;
  slots: Slot[];
  fetcher?: typeof fetch;
};

const composeType = type({
  composeId: 'string',
  environmentId: 'string',
  sourceType: 'string',
  owner: 'string',
  repository: 'string',
  branch: 'string',
  autoDeploy: 'boolean',
  domains: type({
    host: 'string',
    https: 'boolean',
    enabled: 'boolean',
    serviceName: 'string',
    port: 'number',
  }).array(),
});

export function createDokploy({
  url,
  apiKey,
  repository,
  environmentId,
  slots,
  fetcher = fetch,
}: DokployOptions): DokployClient {
  const [owner, repositoryName, extra] = repository.split('/');
  if (!owner || !repositoryName || extra || !environmentId || !apiKey) {
    throw new Error('Invalid Dokploy client configuration');
  }
  const origin = new URL(url);
  if (origin.protocol !== 'https:') throw new Error('Dokploy API must use HTTPS');
  const configured = new Map<number, Slot>();
  const composeIds = new Set<string>();
  for (const slot of slots) {
    const target = new URL(slot.url);
    if (
      !Number.isInteger(slot.number) ||
      slot.number < 1 ||
      !slot.composeId ||
      configured.has(slot.number) ||
      composeIds.has(slot.composeId) ||
      target.protocol !== 'https:' ||
      target.username ||
      target.password ||
      target.pathname !== '/' ||
      target.search ||
      target.hash
    )
      throw new Error('Invalid Dokploy preview slot configuration');
    configured.set(slot.number, slot);
    composeIds.add(slot.composeId);
  }

  function selected(number: number): Slot {
    const slot = configured.get(number);
    if (!slot) throw new Error(`Unknown preview slot: ${number}`);
    return slot;
  }

  async function request(action: 'one', slot: Slot): Promise<unknown>;
  async function request(
    action: 'update' | 'deploy' | 'stop',
    slot: Slot,
    fields?: { branch?: string; autoDeploy?: boolean },
  ): Promise<void>;
  async function request(
    action: 'one' | 'update' | 'deploy' | 'stop',
    slot: Slot,
    fields?: { branch?: string; autoDeploy?: boolean },
  ): Promise<unknown> {
    const endpoint = new URL(`api/compose.${action}`, `${origin.href.replace(/\/$/, '')}/`);
    if (action === 'one') endpoint.searchParams.set('composeId', slot.composeId);
    const response = await fetcher(endpoint, {
      method: action === 'one' ? 'GET' : 'POST',
      headers: {
        'x-api-key': apiKey,
        ...(action === 'one' ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(action === 'one'
        ? {}
        : { body: JSON.stringify({ composeId: slot.composeId, ...fields }) }),
    });
    if (!response.ok) throw new Error(`Dokploy compose.${action} failed (${response.status})`);
    return action === 'one' ? response.json() : undefined;
  }

  /** Verify the immutable source, environment and public routing before returning a slot. */
  async function inspect(number: number): Promise<{ branch: string; autoDeploy: boolean }> {
    const slot = selected(number);
    const compose = composeType(await request('one', slot));
    if (compose instanceof type.errors)
      throw new Error(`Slot ${number} Dokploy response is invalid: ${compose.summary}`);
    const target = new URL(slot.url);
    if (
      compose.composeId !== slot.composeId ||
      compose.environmentId !== environmentId ||
      compose.sourceType !== 'github' ||
      compose.owner !== owner ||
      compose.repository !== repositoryName
    )
      throw new Error(`Slot ${number} Dokploy source or environment differs from configuration`);
    if (
      !compose.domains.some(
        (domain) =>
          domain.host === target.hostname &&
          domain.https === true &&
          domain.enabled === true &&
          domain.serviceName === 'nginx' &&
          domain.port === 80,
      )
    )
      throw new Error(`Slot ${number} HTTPS domain is not routed to nginx:80`);
    return { branch: compose.branch, autoDeploy: compose.autoDeploy };
  }

  return {
    inspect,
    update(number, fields) {
      const slot = selected(number);
      if (
        Object.keys(fields).length === 0 ||
        Object.keys(fields).some((key) => !['branch', 'autoDeploy'].includes(key)) ||
        (fields.branch !== undefined && !fields.branch)
      )
        throw new Error('Dokploy update accepts only branch and autoDeploy');
      return request('update', slot, fields);
    },
    deploy(number) {
      return request('deploy', selected(number));
    },
    stop(number) {
      return request('stop', selected(number));
    },
  };
}
