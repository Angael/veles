import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setResponseHeader = vi.fn();

vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}));

vi.mock('@tanstack/react-start/server', () => ({ setResponseHeader }));

describe('securityHeadersMiddleware', () => {
  beforeEach(() => {
    setResponseHeader.mockClear();
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets baseline security headers and forwards to the next handler', async () => {
    const { securityHeadersMiddleware } = await import('./securityHeadersMiddleware');
    const next = vi.fn().mockResolvedValue('next-result');

    const result = await securityHeadersMiddleware({ next });

    expect(result).toBe('next-result');
    expect(next).toHaveBeenCalledTimes(1);
    expect(setResponseHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
    expect(setResponseHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
    );
    expect(setResponseHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), geolocation=(), microphone=()',
    );
    expect(setResponseHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    );
    expect(setResponseHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(setResponseHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  it('does not set a Strict-Transport-Security header outside production', async () => {
    const { securityHeadersMiddleware } = await import('./securityHeadersMiddleware');

    await securityHeadersMiddleware({ next: vi.fn().mockResolvedValue(undefined) });

    expect(setResponseHeader).not.toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.anything(),
    );
  });

  it('sets a Strict-Transport-Security header in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { securityHeadersMiddleware } = await import('./securityHeadersMiddleware');

    await securityHeadersMiddleware({ next: vi.fn().mockResolvedValue(undefined) });

    expect(setResponseHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000',
    );
  });

  it('propagates errors thrown by the next handler without swallowing them', async () => {
    const { securityHeadersMiddleware } = await import('./securityHeadersMiddleware');
    const next = vi.fn().mockRejectedValue(new Error('downstream failure'));

    await expect(securityHeadersMiddleware({ next })).rejects.toThrow('downstream failure');
  });
});