import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { env } from 'env.ts';

export const auth = betterAuth({
	baseURL: env.VITE_BASE_URL,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema,
	}),
	plugins: [tanstackStartCookies()],
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
});

export type Session = typeof auth.$Infer.Session;
