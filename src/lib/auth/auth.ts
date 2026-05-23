import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { db } from '@/db';
import { accounts, sessions, users, verifications } from '@/db/schema';
import { getServerEnv } from '@/lib/env/server';

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
  emailAndPassword: {
    enabled: true,
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
  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },
});

export type AuthInstance = typeof auth;
