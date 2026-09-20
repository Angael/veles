import { and, inArray, isNull } from 'drizzle-orm';
import { createDatabaseConnection } from '../src/index.ts';
import { foodProducts } from '../src/schema/calories.schema.ts';
import { foodProductSeeds, retiredFoodProductNames } from '../src/seed/food-products.ts';

const isProduction = process.argv.includes('--prod');
const databaseUrlName = isProduction ? 'PROD_DATABASE_URL' : 'DATABASE_URL';
const databaseUrl = process.env[databaseUrlName];

if (!databaseUrl) {
  throw new Error(`${databaseUrlName} is required.`);
}

await removeFoodProducts(databaseUrl);

/** Removes only known current and legacy shared-catalog rows from the selected database. */
async function removeFoodProducts(connectionString: string) {
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
    console.info(
      `Removed ${removedProducts.length} shared food products from ${isProduction ? 'production' : 'development'}.`,
    );
  } finally {
    await connection.close();
  }
}
