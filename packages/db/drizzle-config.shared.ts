import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

const rootEnvFile = new URL('../../.env', import.meta.url);

// Local commands share the root env; deployed commands keep using injected variables.
if (existsSync(rootEnvFile)) {
  console.log('Loading .env from repo root');
  loadEnvFile(rootEnvFile);
}

export function createDrizzleConfig(url: string) {
  return defineConfig({
    out: './drizzle',
    schema: './src/schema/index.ts',
    dialect: 'postgresql',
    dbCredentials: {
      url,
    },
  });
}
