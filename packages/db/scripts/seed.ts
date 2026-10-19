import { createDatabaseConnection } from '../src/index.ts';
import { syncFoodProductSeeds } from '../src/seed/sync-food-products.ts';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

const connection = createDatabaseConnection({ connectionString: databaseUrl, maxConnections: 1 });

try {
  const result = await syncFoodProductSeeds(connection.db);
  console.info('Synced food product seeds in development.', result);
} finally {
  await connection.close();
}
