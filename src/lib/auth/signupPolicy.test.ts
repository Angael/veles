import { describe, expect, it } from 'vitest';
import {
  canCreateAuthUser,
  normalizeAuthEmail,
  parseAllowedAuthEmails,
} from '@/lib/auth/signupPolicy';

describe('signup policy', () => {
  it('normalizes and deduplicates allowlisted addresses', () => {
    expect([...parseAllowedAuthEmails(' Owner@Example.com,owner@example.com ')]).toEqual([
      'owner@example.com',
    ]);
  });

  it('fails closed for an empty allowlist', () => {
    expect(
      canCreateAuthUser(
        { email: 'owner@example.com', emailVerified: true },
        parseAllowedAuthEmails(undefined),
      ),
    ).toBe(false);
  });

  it('requires both a matching address and verified Google email', () => {
    const allowedEmails = parseAllowedAuthEmails('owner@example.com');

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

  it('rejects malformed addresses', () => {
    expect(() => parseAllowedAuthEmails('not-an-email')).toThrow(
      'AUTH_ALLOWED_EMAILS contains an invalid email address',
    );
  });

  it('normalizes surrounding whitespace and casing', () => {
    expect(normalizeAuthEmail(' Owner@Example.COM ')).toBe('owner@example.com');
  });
});
