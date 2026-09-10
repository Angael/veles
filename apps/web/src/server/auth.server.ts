import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { accounts, sessions, users, verifications } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { getServerEnv } from '@/server/env.server';

const env = getServerEnv();

export const auth = betterAuth({
  baseURL: env.appUrl,
  secret: env.betterAuthSecret,
  onAPIError: {
    errorURL: new URL('/auth/error', env.appUrl).toString(),
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  plugins: [tanstackStartCookies()],
  advanced: {
    useSecureCookies: env.isProduction,
  },
  account: {
    encryptOAuthTokens: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Enforce the allowlist at the persistence boundary so every signup flow is covered.
          if (!env.allowedAuthEmails.includes(user.email)) {
            throw new APIError('BAD_REQUEST', {
              message: 'This account is not authorized to use Veles',
            });
          }

          return { data: user };
        },
      },
    },
  },
  socialProviders:
    env.googleClientId && env.googleClientSecret
      ? {
          google: {
            clientId: env.googleClientId,
            clientSecret: env.googleClientSecret,
          },
        }
      : {},
  rateLimit: {
    enabled: true,
    // Better Auth defaults to 100 client requests per 60-second window.
    // window: 60,
    // max: 100,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },
});
