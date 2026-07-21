export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export function canCreateAuthUser(
  user: { email: string; emailVerified: boolean },
  allowedEmails: readonly string[],
) {
  return user.emailVerified && allowedEmails.includes(normalizeAuthEmail(user.email));
}
