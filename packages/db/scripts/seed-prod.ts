import { createDatabaseConnection } from '../src/index.ts';
import { foodProducts } from '../src/schema/calories.schema.ts';
import { foodProductSeeds } from '../src/seed/food-products.ts';

const prodDatabaseUrl = process.env.PROD_DATABASE_URL;

if (!prodDatabaseUrl) {
  throw new Error('PROD_DATABASE_URL is required.');
}

await seedProductionFoodProducts(prodDatabaseUrl);

/** Inserts the shared bilingual food catalog into production as one atomic seed operation. */
async function seedProductionFoodProducts(connectionString: string) {
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
    console.info(`Inserted ${foodProductSeeds.length} food products into production.`);
  } finally {
    await connection.close();
  }
}
