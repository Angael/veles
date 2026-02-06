import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

// Vite bakes VITE_ vars at build time via import.meta.env.
// Outside Vite (bg-worker, scripts) they live in process.env instead.
const clientEnv = import.meta.env ?? process.env

export const env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
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

  clientPrefix: 'VITE_',

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_CF_CDN_URL: z.url(),
    VITE_BASE_URL: z.url(),
  },

  runtimeEnv: {
    // Server
    SERVER_URL: process.env.SERVER_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    // Client
    VITE_CF_CDN_URL: clientEnv.VITE_CF_CDN_URL,
    VITE_APP_TITLE: clientEnv.VITE_APP_TITLE,
    VITE_BASE_URL: clientEnv.VITE_BASE_URL,
  },

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
})
