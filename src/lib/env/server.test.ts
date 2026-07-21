import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let getServerEnv: (typeof import('@/lib/env/server'))['getServerEnv'];

describe('getServerEnv', () => {
  beforeEach(async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/veles_test');
    vi.stubEnv('BETTER_AUTH_SECRET', 'abcdefghijklmnopqrstuvwxyz123456');
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    vi.stubEnv('AUTH_ALLOWED_EMAILS', '');
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    vi.stubEnv('VITE_CF_CDN_URL', 'https://cdn.example.com');
    vi.stubEnv('R2_ACCOUNT_ID', 'account-id');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'access-key-id');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'secret-access-key');
    vi.stubEnv('R2_BUCKET_NAME', 'bucket-name');
    vi.resetModules();
    ({ getServerEnv } = await import('@/lib/env/server'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses a local URL and a fail-closed signup allowlist outside production', () => {
    const env = getServerEnv();

    expect(env.appUrl).toBe('http://localhost:3000');
    expect(env.allowedAuthEmails).toEqual([]);
  });

  it('reuses the first validated environment', () => {
    const env = getServerEnv();
    vi.stubEnv('DATABASE_URL', 'postgresql://changed');

    expect(getServerEnv()).toBe(env);
    expect(getServerEnv().databaseUrl).not.toBe('postgresql://changed');
  });

  it('parses and validates allowed auth emails', () => {
    vi.stubEnv('AUTH_ALLOWED_EMAILS', 'owner@example.com,friend@example.com');

    expect(getServerEnv().allowedAuthEmails).toEqual(['owner@example.com', 'friend@example.com']);
  });

  it('normalizes a valid production origin', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', 'https://veles.example.com/path');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'google-client-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'google-client-secret');

    expect(getServerEnv().appUrl).toBe('https://veles.example.com');
  });
});
