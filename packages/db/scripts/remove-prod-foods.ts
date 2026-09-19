import { and, inArray, isNull } from 'drizzle-orm';
import { createDatabaseConnection } from '../src/index.ts';
import { foodProducts } from '../src/schema/calories.schema.ts';
import { foodProductSeeds, retiredFoodProductNames } from '../src/seed/food-products.ts';

const prodDatabaseUrl = process.env.PROD_DATABASE_URL;

if (!prodDatabaseUrl) {
  throw new Error('PROD_DATABASE_URL is required.');
}

await removeProductionFoodProducts(prodDatabaseUrl);

/** Removes only known current and legacy shared-catalog rows from production. */
async function removeProductionFoodProducts(connectionString: string) {
  const connection = createDatabaseConnection({
    connectionString,
    maxConnections: 1,
  });

  try {
    const previousRenamedSeedNames = [
      'All-purpose flour, unbleached',
      'Rye flour, medium',
      'Squash, zucchini',
    ];
    const seedNames = foodProductSeeds.flatMap((seed) => [seed.name_en, seed.name_pl]);
    const namesToRemove = [
      ...new Set([...seedNames, ...previousRenamedSeedNames, ...retiredFoodProductNames]),
    ];

    const removedProducts = await connection.db
      .delete(foodProducts)
      .where(and(isNull(foodProducts.barcode), inArray(foodProducts.name, namesToRemove)))
      .returning({ id: foodProducts.id });
    console.info(`Removed ${removedProducts.length} shared food products from production.`);
  } finally {
    await connection.close();
  }
}
