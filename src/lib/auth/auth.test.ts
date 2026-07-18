import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));

vi.mock('@better-auth/drizzle-adapter', () => ({
  drizzleAdapter: vi.fn(() => 'drizzle-adapter'),
}));

vi.mock('better-auth/tanstack-start', () => ({
  tanstackStartCookies: vi.fn(() => 'tanstack-start-cookies-plugin'),
}));

class MockAPIError extends Error {
  status: string;

  constructor(status: string, options?: { message?: string }) {
    super(options?.message);
    this.status = status;
  }
}

vi.mock('better-auth', () => ({
  APIError: MockAPIError,
  betterAuth: vi.fn((config: unknown) => config),
}));

vi.mock('@/lib/env/server', () => ({
  getServerEnv: vi.fn(),
}));

const baseEnv = {
  allowedAuthEmails: new Set(['owner@example.com']),
  appUrl: 'https://veles.example.com',
  betterAuthSecret: 'a-private-random-secret-value-2026',
  googleClientId: 'google-client-id',
  googleClientSecret: 'google-client-secret',
  isProduction: false,
};

type AuthConfig = {
  account: { encryptOAuthTokens: boolean };
  advanced: { useSecureCookies: boolean };
  baseURL: string;
  databaseHooks: {
    user: {
      create: {
        before: (user: {
          email: string;
          emailVerified: boolean;
        }) => Promise<{ data: unknown }>;
      };
    };
  };
  rateLimit: { enabled: boolean };
  secret: string;
  socialProviders: Record<string, { clientId: string; clientSecret: string }>;
};

async function loadAuth(envOverrides: Partial<typeof baseEnv> = {}) {
  vi.resetModules();
  const { getServerEnv } = await import('@/lib/env/server');
  vi.mocked(getServerEnv).mockReturnValue({ ...baseEnv, ...envOverrides } as never);

  const module = await import('@/lib/auth/auth');

  return module.auth as unknown as AuthConfig;
}

describe('auth config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('wires the resolved server environment into the better-auth config', async () => {
    const auth = await loadAuth();

    expect(auth.baseURL).toBe(baseEnv.appUrl);
    expect(auth.secret).toBe(baseEnv.betterAuthSecret);
    expect(auth.advanced.useSecureCookies).toBe(false);
    expect(auth.account.encryptOAuthTokens).toBe(true);
    expect(auth.rateLimit.enabled).toBe(true);
    expect(auth.socialProviders.google).toEqual({
      clientId: baseEnv.googleClientId,
      clientSecret: baseEnv.googleClientSecret,
    });
  });

  it('enables secure cookies in production', async () => {
    const auth = await loadAuth({ isProduction: true });

    expect(auth.advanced.useSecureCookies).toBe(true);
  });

  it('omits social providers when Google credentials are unavailable', async () => {
    const auth = await loadAuth({ googleClientId: undefined, googleClientSecret: undefined });

    expect(auth.socialProviders).toEqual({});
  });

  it('allows creating a user whose verified email is on the allowlist', async () => {
    const auth = await loadAuth();

    await expect(
      auth.databaseHooks.user.create.before({ email: 'owner@example.com', emailVerified: true }),
    ).resolves.toEqual({ data: { email: 'owner@example.com', emailVerified: true } });
  });

  it('rejects creating a user who is not on the allowlist', async () => {
    const auth = await loadAuth();

    await expect(
      auth.databaseHooks.user.create.before({
        email: 'stranger@example.com',
        emailVerified: true,
      }),
    ).rejects.toMatchObject({ status: 'BAD_REQUEST' });
  });

  it('rejects creating a user with an unverified email even if allowlisted', async () => {
    const auth = await loadAuth();

    await expect(
      auth.databaseHooks.user.create.before({ email: 'owner@example.com', emailVerified: false }),
    ).rejects.toBeInstanceOf(Error);
  });
});