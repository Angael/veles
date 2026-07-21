import { describe, expect, it } from 'vitest';
import { canCreateAuthUser, normalizeAuthEmail } from '@/lib/auth/signupPolicy';

describe('signup policy', () => {
  it('fails closed for an empty allowlist', () => {
    expect(canCreateAuthUser({ email: 'owner@example.com', emailVerified: true }, [])).toBe(false);
  });

  it('requires both a matching address and verified Google email', () => {
    const allowedEmails = ['owner@example.com'];

    expect(
      canCreateAuthUser({ email: ' OWNER@example.com ', emailVerified: true }, allowedEmails),
    ).toBe(true);
    expect(
      canCreateAuthUser({ email: 'owner@example.com', emailVerified: false }, allowedEmails),
    ).toBe(false);
    expect(
      canCreateAuthUser({ email: 'stranger@example.com', emailVerified: true }, allowedEmails),
    ).toBe(false);
  });

  it('normalizes surrounding whitespace and casing', () => {
    expect(normalizeAuthEmail(' Owner@Example.COM ')).toBe('owner@example.com');
  });
});
