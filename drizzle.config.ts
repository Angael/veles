/// <reference types="node" />

import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Drizzle operations');
}

export function createDrizzleConfig(url: string) {
  return defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
      url,
    },
  });
}

export default createDrizzleConfig(process.env.DATABASE_URL);
