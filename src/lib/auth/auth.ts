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
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },
});

export type AuthInstance = typeof auth;
