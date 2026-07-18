import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('clientEnv', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to defaults when VITE_ variables are unset', async () => {
    vi.stubEnv('VITE_APP_NAME', '');
    vi.stubEnv('VITE_CF_CDN_URL', '');

    const { clientEnv } = await import('./client');

    expect(clientEnv.appName).toBe('Veles');
    expect(clientEnv.cdnUrl).toBe('');
  });

  it('uses configured VITE_ variables when present', async () => {
    vi.stubEnv('VITE_APP_NAME', 'Custom App');
    vi.stubEnv('VITE_CF_CDN_URL', 'https://cdn.example.com');

    const { clientEnv } = await import('./client');

    expect(clientEnv.appName).toBe('Custom App');
    expect(clientEnv.cdnUrl).toBe('https://cdn.example.com');
  });

  it('no longer exposes the removed appUrl field', async () => {
    const { clientEnv } = await import('./client');

    expect(clientEnv).not.toHaveProperty('appUrl');
  });
});