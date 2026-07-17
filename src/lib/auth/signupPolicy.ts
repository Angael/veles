import { type } from 'arktype';

const emailType = type('string.email');

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Parses the server-only comma-separated allowlist and rejects malformed addresses. */
export function parseAllowedAuthEmails(value: string | undefined) {
  const emails = (value ?? '').split(',').map(normalizeAuthEmail).filter(Boolean);

  for (const email of emails) {
    const validation = emailType(email);

    if (validation instanceof type.errors) {
      throw new Error('AUTH_ALLOWED_EMAILS contains an invalid email address');
    }
  }

  return new Set(emails);
}

export function canCreateAuthUser(
  user: { email: string; emailVerified: boolean },
  allowedEmails: ReadonlySet<string>,
) {
  return user.emailVerified && allowedEmails.has(normalizeAuthEmail(user.email));
}
