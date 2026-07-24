import { type } from 'arktype';

const allowedAuthEmailsType = type('string').pipe(
  (value) => (value ? value.split(',') : []),
  type('string.email[]'),
);
const appUrlType = type('string.url').pipe((value) => new URL(value).origin);

const serverEnvType = type({
  DATABASE_URL: 'string >= 1',
  BETTER_AUTH_SECRET: 'string',
  AUTH_ALLOWED_EMAILS: allowedAuthEmailsType,
  APP_URL: appUrlType,
  GOOGLE_CLIENT_ID: 'string',
  GOOGLE_CLIENT_SECRET: 'string',
  NODE_ENV: "'development' | 'production' | 'test'",
  VITE_CF_CDN_URL: 'string.url',
  R2_ACCOUNT_ID: 'string',
  R2_ACCESS_KEY_ID: 'string',
  R2_SECRET_ACCESS_KEY: 'string',
  R2_BUCKET_NAME: 'string',
}).pipe((env) => {
  const isProduction = env.NODE_ENV === 'production';

  return {
    databaseUrl: env.DATABASE_URL,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    allowedAuthEmails: env.AUTH_ALLOWED_EMAILS,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    appUrl: env.APP_URL,
    cdnUrl: env.VITE_CF_CDN_URL,
    isProduction,
    r2AccountId: env.R2_ACCOUNT_ID,
    r2AccessKeyId: env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: env.R2_SECRET_ACCESS_KEY,
    r2BucketName: env.R2_BUCKET_NAME,
  };
});

let serverEnv: typeof serverEnvType.infer | undefined;

/** Validates and normalizes the process environment once, then reuses the result. */
export function getServerEnv() {
  if (serverEnv) {
    return serverEnv;
  }

  const validation = serverEnvType(process.env);

  if (validation instanceof type.errors) {
    throw new Error(`Invalid server environment: ${validation.summary}`);
  }

  serverEnv = validation;
  return serverEnv;
}
