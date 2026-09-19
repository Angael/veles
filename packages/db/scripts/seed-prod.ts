import { and, inArray, isNull } from 'drizzle-orm';
import { createDatabaseConnection } from '../src/index.ts';
import { foodProducts } from '../src/schema/calories.schema.ts';
import { foodProductSeeds, retiredFoodProductNames } from '../src/seed/food-products.ts';

const prodDatabaseUrl = process.env.PROD_DATABASE_URL;

if (!prodDatabaseUrl) {
  throw new Error('PROD_DATABASE_URL is required.');
}

await seedProductionFoodProducts(prodDatabaseUrl);

/**
 * Replaces the previous shared catalog with the Poland-focused Polish catalog atomically.
 *
 * Rows are matched by known seed names so barcode-less foods created by users are left intact.
 */
async function seedProductionFoodProducts(connectionString: string) {
  const connection = createDatabaseConnection({
    connectionString,
    maxConnections: 1,
  });

  try {
    const seedNames = foodProductSeeds.flatMap((seed) => [seed.name_en, seed.name_pl]);
    const previousRenamedSeedNames = [
      'All-purpose flour, unbleached',
      'Rye flour, medium',
      'Squash, zucchini',
    ];
    const namesToReplace = [
      ...new Set([...seedNames, ...previousRenamedSeedNames, ...retiredFoodProductNames]),
    ];
    const polishFoodProducts = foodProductSeeds.map(({ name_en: _nameEn, name_pl, ...seed }) => ({
      ...seed,
      name: name_pl,
    }));

    await connection.db.transaction(async (tx) => {
      await tx
        .delete(foodProducts)
        .where(and(isNull(foodProducts.barcode), inArray(foodProducts.name, namesToReplace)));
      await tx.insert(foodProducts).values(polishFoodProducts);
    });
    console.info(`Synchronized ${foodProductSeeds.length} food products in production.`);
  } finally {
    await connection.close();
  }
}
