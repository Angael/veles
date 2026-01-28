import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
    DATABASE_URL: z.string().min(1),
    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_TEST: z.string().optional(),
    VITE_CF_CDN_URL: z.url(),
    VITE_BASE_URL: z.url(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   *
   * For TanStack Start, we need to merge both sources:
   * - Server vars come from process.env (available at runtime in production)
   * - Client vars come from import.meta.env (baked in at build time)
   */
  runtimeEnv: {
    // Server variables from process.env
    SERVER_URL: process.env.SERVER_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // Client variables from import.meta.env
    VITE_CF_CDN_URL: import.meta.env.VITE_CF_CDN_URL,
    VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
    VITE_TEST: import.meta.env.VITE_TEST,
    VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
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
