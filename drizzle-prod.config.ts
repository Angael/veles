/// <reference types="node" />

import { createDrizzleConfig } from './drizzle.config';

const prodDatabaseUrl = process.env.PROD_DATABASE_URL;

if (!prodDatabaseUrl) {
  throw new Error('PROD_DATABASE_URL is required for prod Drizzle operations');
}

export default createDrizzleConfig(prodDatabaseUrl);
