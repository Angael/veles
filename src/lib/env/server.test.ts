import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerEnv } from '@/lib/env/server';

describe('getServerEnv', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/veles_test');
    vi.stubEnv('BETTER_AUTH_SECRET', 'abcdefghijklmnopqrstuvwxyz123456');
    vi.stubEnv('APP_URL', '');
    vi.stubEnv('AUTH_ALLOWED_EMAILS', '');
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses a local URL and a fail-closed signup allowlist outside production', () => {
    const env = getServerEnv();

    expect(env.appUrl).toBe('http://localhost:3000');
    expect(env.allowedAuthEmails.size).toBe(0);
  });

  it('rejects the public example secret', () => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'replace-with-a-random-32-plus-char-secret');

    expect(() => getServerEnv()).toThrow(
      'BETTER_AUTH_SECRET must be a private random value of at least 32 characters',
    );
  });

  it('requires an HTTPS canonical URL and Google credentials in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', 'http://veles.example.com');

    expect(() => getServerEnv()).toThrow('Google OAuth credentials are required in production');

    vi.stubEnv('GOOGLE_CLIENT_ID', 'google-client-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'google-client-secret');

    expect(() => getServerEnv()).toThrow('APP_URL must use HTTPS in production');
  });

  it('normalizes a valid production origin', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', 'https://veles.example.com/path');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'google-client-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'google-client-secret');

    expect(getServerEnv().appUrl).toBe('https://veles.example.com');
  });
});
