import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { db } from '@/db';
import { accounts, sessions, users, verifications } from '@/db/schema';
import { getServerEnv } from '@/lib/env/server';
import { canCreateAuthUser } from '@/lib/auth/signupPolicy';

const env = getServerEnv();

export const auth = betterAuth({
  baseURL: env.appUrl,
  secret: env.betterAuthSecret,
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
          if (
            !canCreateAuthUser(
              { email: user.email, emailVerified: user.emailVerified },
              env.allowedAuthEmails,
            )
          ) {
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

export type AuthInstance = typeof auth;
