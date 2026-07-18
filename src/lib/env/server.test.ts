import { afterEach, describe, expect, it, vi } from 'vitest';
import { getServerEnv } from './server';

afterEach(() => {
  vi.unstubAllEnvs();
});

function stubValidRequiredEnv() {
  vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/veles_dev');
  vi.stubEnv('BETTER_AUTH_SECRET', 'abcdefghijklmnopqrstuvwxyz123456');
}

describe('getServerEnv', () => {
  it.each(['DATABASE_URL', 'BETTER_AUTH_SECRET'] as const)(
    'rejects missing, empty, and whitespace-only %s',
    (key) => {
      for (const value of [undefined, '', '   ']) {
        stubValidRequiredEnv();
        vi.stubEnv(key, value);
        expect(() => getServerEnv()).toThrow(`Missing required environment variable: ${key}`);
      }
    },
  );

  it('enforces the authentication secret length boundary without leaking its value', () => {
    stubValidRequiredEnv();
    const weakSecret = 's'.repeat(31);
    vi.stubEnv('BETTER_AUTH_SECRET', weakSecret);

    expect(() => getServerEnv()).toThrow('BETTER_AUTH_SECRET must be at least 32 characters');
    try {
      getServerEnv();
    } catch (error) {
      expect(String(error)).not.toContain(weakSecret);
    }

    vi.stubEnv('BETTER_AUTH_SECRET', 's'.repeat(32));
    expect(getServerEnv().betterAuthSecret).toBe('s'.repeat(32));
  });

  it('uses explicit values and documented optional fallbacks', () => {
    stubValidRequiredEnv();
    vi.stubEnv('VITE_APP_URL', '');
    vi.stubEnv('VITE_CF_CDN_URL', '');
    expect(getServerEnv()).toMatchObject({
      appUrl: 'http://localhost:3000',
      cdnUrl: '',
    });

    vi.stubEnv('VITE_APP_URL', 'https://app.example.com');
    vi.stubEnv('VITE_CF_CDN_URL', 'https://cdn.example.com');
    expect(getServerEnv()).toMatchObject({
      appUrl: 'https://app.example.com',
      cdnUrl: 'https://cdn.example.com',
    });
  });
});
