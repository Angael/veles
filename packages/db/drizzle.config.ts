/// <reference types="node" />

import { createDrizzleConfig } from './drizzle-config.shared.ts';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Drizzle operations');
}

export default createDrizzleConfig(process.env.DATABASE_URL);
