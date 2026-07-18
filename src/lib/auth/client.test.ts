import { describe, expect, it, vi } from 'vitest';

const createAuthClient = vi.fn(() => ({
  getSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock('better-auth/react', () => ({ createAuthClient }));

describe('auth client', () => {
  it('creates the client without an explicit baseURL override', async () => {
    await import('@/lib/auth/client');

    expect(createAuthClient).toHaveBeenCalledWith();
  });

  it('re-exports the supported auth actions and hides the removed signUp action', async () => {
    const client = await import('@/lib/auth/client');

    expect(client.authClient).toBeDefined();
    expect(client.getSession).toBeDefined();
    expect(client.signIn).toBeDefined();
    expect(client.signOut).toBeDefined();
    expect(client.useSession).toBeDefined();
    expect(client).not.toHaveProperty('signUp');
  });
});