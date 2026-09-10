import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { eq } from 'drizzle-orm';
import { accounts, connectionInvitations, sessions, users, verifications } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { getServerEnv } from '@/server/env.server';

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
          const normalizedEmail = user.email.toLowerCase();
          const isAllowedAdmin = env.allowedAuthEmails.some(
            (email) => email.toLowerCase() === normalizedEmail,
          );
          const invitations = isAllowedAdmin
            ? []
            : await db
                .select({ id: connectionInvitations.id })
                .from(connectionInvitations)
                .where(eq(connectionInvitations.recipientEmail, normalizedEmail))
                .limit(1);

          if (!isAllowedAdmin && invitations.length === 0) {
            throw new APIError('BAD_REQUEST', {
              message: 'This account needs a connection invitation to use Veles',
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
