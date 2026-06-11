import { defineConfig } from 'drizzle-kit';

export function createDrizzleConfig(url: string) {
  return defineConfig({
    out: './drizzle',
    schema: './src/db/schema/index.ts',
    dialect: 'postgresql',
    dbCredentials: {
      url,
    },
  });
}
