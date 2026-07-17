import { type } from 'arktype';
import { parseAllowedAuthEmails } from '@/lib/auth/signupPolicy';

const nonEmptyStringType = type('string >= 1');
const authSecretType = type('string >= 32');
const PUBLIC_AUTH_SECRET_PLACEHOLDER = 'replace-with-a-random-32-plus-char-secret';

function requireNonEmptyEnv(name: string, value: string | undefined) {
  const validation = nonEmptyStringType(value ?? '');

  if (validation instanceof type.errors) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return validation;
}

function parseAuthSecret(value: string | undefined) {
  const validation = authSecretType(value ?? '');

  if (validation instanceof type.errors || validation === PUBLIC_AUTH_SECRET_PLACEHOLDER) {
    throw new Error('BETTER_AUTH_SECRET must be a private random value of at least 32 characters');
  }

  return validation;
}

/** Resolves the canonical server URL and requires HTTPS for production cookies and OAuth. */
function parseAppUrl(value: string | undefined, isProduction: boolean) {
  const rawUrl = value || (isProduction ? '' : 'http://localhost:3000');
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('APP_URL must be a valid absolute URL');
  }

  if (isProduction && url.protocol !== 'https:') {
    throw new Error('APP_URL must use HTTPS in production');
  }

  return url.origin;
}

export function getServerEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together');
  }

  if (isProduction && (!googleClientId || !googleClientSecret)) {
    throw new Error('Google OAuth credentials are required in production');
  }

  return {
    databaseUrl: requireNonEmptyEnv('DATABASE_URL', process.env.DATABASE_URL),
    betterAuthSecret: parseAuthSecret(process.env.BETTER_AUTH_SECRET),
    allowedAuthEmails: parseAllowedAuthEmails(process.env.AUTH_ALLOWED_EMAILS),
    googleClientId,
    googleClientSecret,
    appUrl: parseAppUrl(process.env.APP_URL, isProduction),
    cdnUrl: process.env.VITE_CF_CDN_URL || '',
    isProduction,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
    r2PublicUrl: process.env.R2_PUBLIC_URL,
  };
}
