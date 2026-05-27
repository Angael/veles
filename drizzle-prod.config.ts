import { createDrizzleConfig } from './drizzle.config';

if (!process.env.PROD_DATABASE_URL) {
  throw new Error('PROD_DATABASE_URL is required for prod Drizzle operations');
}

export default createDrizzleConfig(process.env.PROD_DATABASE_URL);
