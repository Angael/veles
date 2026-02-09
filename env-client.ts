import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

// Vite bakes VITE_ vars at build time via import.meta.env.
// Outside Vite (scripts) they live in process.env instead.
const viteEnv = import.meta.env ?? process.env

export const clientEnv = createEnv({
	clientPrefix: 'VITE_',

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
		VITE_CF_CDN_URL: z.url(),
		VITE_BASE_URL: z.url(),
	},

	runtimeEnv: {
		VITE_CF_CDN_URL: viteEnv.VITE_CF_CDN_URL,
		VITE_APP_TITLE: viteEnv.VITE_APP_TITLE,
		VITE_BASE_URL: viteEnv.VITE_BASE_URL,
	},

	emptyStringAsUndefined: true,
})
