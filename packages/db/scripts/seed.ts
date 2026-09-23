import { and, inArray, isNull, sql } from 'drizzle-orm';
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

/** Appends missing bilingual catalog entries without changing existing products or logs. */
async function seedFoodProducts(connectionString: string) {
  const connection = createDatabaseConnection({
    connectionString,
    maxConnections: 1,
  });

  try {
    const insertedCount = await connection.db.transaction(async (tx) => {
      // Serialize simultaneous seed runs; names have no unique constraint for barcode-less foods.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(18522, 1)`);
      const existing = await tx
        .select({ name: foodProducts.name })
        .from(foodProducts)
        .where(
          and(
            isNull(foodProducts.barcode),
            inArray(
              foodProducts.name,
              foodProductSeeds.flatMap((seed) => [seed.name_en, seed.name_pl]),
            ),
          ),
        );
      const existingNames = new Set(existing.map((product) => product.name));
      const products = foodProductSeeds
        .filter((seed) => !existingNames.has(seed.name_en) && !existingNames.has(seed.name_pl))
        .map(({ name_en, name_pl, ...seed }) => ({
          ...seed,
          name: name_en,
          namePl: name_pl,
        }));

      if (products.length > 0) {
        await tx.insert(foodProducts).values(products);
      }
      return products.length;
    });
    console.info(
      `Inserted ${insertedCount} food products into ${databaseName}; existing products untouched.`,
    );
  } finally {
    await connection.close();
  }
}
