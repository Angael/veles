import { createHmac, createSign, timingSafeEqual } from 'node:crypto';
import { type, type ArkErrors } from 'arktype';
import type { GithubClient, Pull } from './types.ts';

const marker = '<!-- veles-preview-controller -->';
const installationResponse = type({ token: 'string', expires_at: 'string' });
const appResponse = type({ slug: 'string' });
const pullResponse = type({
  number: 'number',
  state: 'string',
  draft: 'boolean',
  created_at: 'string',
  head: { ref: 'string', repo: type({ full_name: 'string' }).or('null') },
  base: { repo: { full_name: 'string' } },
  labels: type({ name: 'string' }).array(),
});
const commentResponse = type({
  id: 'number',
  'body?': 'string | null',
  'user?': type({ login: 'string' }).or('null'),
});
const apiErrorResponse = type({ message: 'string' });

type Options = {
  repository: string;
  appId: string | number;
  installationId: string | number;
  privateKey: string;
  webhookSecret: string;
  apiUrl?: string;
  fetcher?: typeof fetch;
};

function parseResponse<T>(
  schema: (value: unknown) => T | ArkErrors,
  value: unknown,
  description: string,
): T {
  const parsed = schema(value);
  if (parsed instanceof type.errors) throw new Error(`${description} is invalid`);
  return parsed;
}

export function createGithub({
  repository,
  appId,
  installationId,
  privateKey,
  webhookSecret,
  apiUrl = 'https://api.github.com',
  fetcher = fetch,
}: Options): GithubClient {
  if (!/^[^/]+\/[^/]+$/.test(repository)) throw new Error('GitHub repository must be owner/name');
  const base = apiUrl.replace(/\/$/, '');
  const repoPath = repository.split('/').map(encodeURIComponent).join('/');
  let installationToken: string | undefined;
  let expiresAt = 0;
  let botLogin: string | undefined;

  function verify(rawBody: Uint8Array, signature: string | undefined): boolean {
    if (!(rawBody instanceof Uint8Array)) return false;
    if (typeof signature !== 'string' || !/^sha256=[0-9a-fA-F]{64}$/.test(signature)) return false;
    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest();
    return timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'));
  }

  function appJwt(): string {
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const input = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: now - 60, exp: now + 540, iss: String(appId) })}`;
    const signer = createSign('RSA-SHA256');
    signer.update(input);
    signer.end();
    return `${input}.${signer.sign(privateKey, 'base64url')}`;
  }

  /** Request an installation token before expiry; concurrent callers reuse the same refresh. */
  let refreshing: Promise<string> | undefined;
  async function token(): Promise<string> {
    if (installationToken && Date.now() < expiresAt - 60_000) return installationToken;
    refreshing ??= (async () => {
      const result = parseResponse(
        installationResponse,
        await request(`/app/installations/${encodeURIComponent(installationId)}/access_tokens`, {
          method: 'POST',
          authorization: appJwt(),
        }),
        'GitHub installation token response',
      );
      if (!result.token || !Number.isFinite(Date.parse(result.expires_at)))
        throw new Error('GitHub installation token response is invalid');
      const fresh = result.token;
      installationToken = fresh;
      expiresAt = Date.parse(result.expires_at);
      return fresh;
    })().finally(() => {
      refreshing = undefined;
    });
    return refreshing;
  }

  /** Keep API errors actionable without leaking authorization or response credentials. */
  async function request(
    path: string,
    {
      method = 'GET',
      body,
      authorization,
    }: {
      method?: string;
      body?: { body: string };
      authorization?: string;
    } = {},
  ): Promise<unknown> {
    const response = await fetcher(`${base}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${authorization ?? (await token())}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const error = apiErrorResponse(await response.json().catch(() => null));
      const message = error instanceof type.errors ? '' : `: ${error.message}`;
      const permissions = response.headers.get('x-accepted-github-permissions');
      throw new Error(
        `GitHub API ${method} ${path} failed (${response.status})${message}${permissions ? `; accepted permissions: ${permissions}` : ''}`,
      );
    }
    return response.status === 204 ? null : response.json();
  }

  /** Fetch all pages, including an exact multiple of 100 entries. */
  async function list<T>(path: string, schema: (value: unknown) => T[] | ArkErrors): Promise<T[]> {
    const all: T[] = [];
    for (let page = 1; ; page++) {
      const separator = path.includes('?') ? '&' : '?';
      const batch = parseResponse(
        schema,
        await request(`${path}${separator}per_page=100&page=${page}`),
        `GitHub API ${path} response`,
      );
      all.push(...batch);
      if (batch.length < 100) return all;
    }
  }

  async function pulls(): Promise<Pull[]> {
    return list(`/repos/${repoPath}/pulls?state=open`, pullResponse.array());
  }

  async function ownBotLogin(): Promise<string> {
    if (botLogin) return botLogin;
    const app = parseResponse(
      appResponse,
      await request('/app', { authorization: appJwt() }),
      'GitHub App identity',
    );
    if (!app.slug) throw new Error('GitHub App identity is invalid');
    botLogin = `${app.slug}[bot]`;
    return botLogin;
  }

  async function comment(prNumber: number, text: string): Promise<void> {
    if (!Number.isSafeInteger(prNumber) || prNumber < 1)
      throw new Error('Invalid pull request number');
    const comments = await list(
      `/repos/${repoPath}/issues/${prNumber}/comments`,
      commentResponse.array(),
    );
    const login = await ownBotLogin();
    const existing = comments.find(
      (item) => item.body?.startsWith(marker) && item.user?.login === login,
    );
    const body = `${marker}\n${text}`;
    if (existing?.body === body) return;
    if (existing) {
      await request(`/repos/${repoPath}/issues/comments/${existing.id}`, {
        method: 'PATCH',
        body: { body },
      });
    } else {
      await request(`/repos/${repoPath}/issues/${prNumber}/comments`, {
        method: 'POST',
        body: { body },
      });
    }
  }

  return { verify, pulls, comment };
}
