import { createDatabaseConnection } from '../src/index.ts';
import { foodProducts } from '../src/schema/calories.schema.ts';
import { foodProductSeeds } from '../src/seed/food-products.ts';

const isProduction = process.argv.includes('--prod');
const databaseUrlName = isProduction ? 'PROD_DATABASE_URL' : 'DATABASE_URL';
const databaseUrl = process.env[databaseUrlName];
const databaseName = isProduction ? 'production' : 'development';

if (!databaseUrl) {
  throw new Error(`${databaseUrlName} is required.`);
}

await seedFoodProducts(databaseUrl);

/** Inserts the shared bilingual food catalog into the selected database atomically. */
async function seedFoodProducts(connectionString: string) {
  const connection = createDatabaseConnection({
    connectionString,
    maxConnections: 1,
  });

  try {
    const products = foodProductSeeds.map(({ name_en, name_pl, ...seed }) => ({
      ...seed,
      name: name_en,
      namePl: name_pl,
    }));

    await connection.db.transaction(async (tx) => {
      await tx.insert(foodProducts).values(products);
    });
    console.info(`Inserted ${foodProductSeeds.length} food products into ${databaseName}.`);
  } finally {
    await connection.close();
  }
}
