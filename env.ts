import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		// Better Auth
		BETTER_AUTH_SECRET: z.string().min(32),
		// Google OAuth
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		// Cloudflare R2
		R2_ACCOUNT_ID: z.string().min(1),
		R2_ACCESS_KEY_ID: z.string().min(1),
		R2_SECRET_ACCESS_KEY: z.string().min(1),
		R2_BUCKET_NAME: z.string().min(1),
	},

	runtimeEnv: process.env,

	emptyStringAsUndefined: true,
})
