import { inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { foodProducts } from '../schema/calories.schema.ts';
import type * as schema from '../schema/index.ts';
import { foodProductSeeds, retiredFoodProductSeedKeys } from './food-products.ts';

/**
 * Makes the shared catalog match `foodProductSeeds`: adds missing seeds and deletes retired ones.
 * Existing seeded rows are not changed, so user edits stay. Safe to run on every deploy.
 */
export async function syncFoodProductSeeds(db: NodePgDatabase<typeof schema>) {
  return db.transaction(async (tx) => {
    // Serialize simultaneous syncs, for example two worker containers during a deploy.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(18522, 1)`);

    const adopted = await adoptUnkeyedSeedRows(tx);

    const inserted = await tx
      .insert(foodProducts)
      .values(
        foodProductSeeds.map(({ category: _category, name_en, name_pl, ...seed }) => ({
          ...seed,
          name: name_en,
          namePl: name_pl,
        })),
      )
      .onConflictDoNothing({ target: foodProducts.seedKey })
      .returning({ id: foodProducts.id });

    const removed =
      retiredFoodProductSeedKeys.length > 0
        ? await tx
            .delete(foodProducts)
            .where(inArray(foodProducts.seedKey, retiredFoodProductSeedKeys))
            .returning({ id: foodProducts.id })
        : [];

    return { adopted: adopted.rowCount ?? 0, inserted: inserted.length, removed: removed.length };
  });
}

/**
 * Gives a seed key to rows seeded before keys existed, matched by English or Polish name.
 * Without this the first sync would insert duplicates. Remove it once prod rows have keys.
 */
function adoptUnkeyedSeedRows(tx: Pick<NodePgDatabase<typeof schema>, 'execute'>) {
  const seeds = sql.join(
    foodProductSeeds.map((seed) => sql`(${seed.seedKey}, ${seed.name_en}, ${seed.name_pl})`),
    sql`, `,
  );

  return tx.execute(sql`
    WITH seed (seed_key, name_en, name_pl) AS (VALUES ${seeds}),
    candidate AS (
      SELECT DISTINCT ON (seed.seed_key) seed.seed_key, product.id
      FROM seed
      JOIN food_product product
        ON product.seed_key IS NULL
        AND product.barcode IS NULL
        AND product.name IN (seed.name_en, seed.name_pl)
      WHERE NOT EXISTS (SELECT 1 FROM food_product keyed WHERE keyed.seed_key = seed.seed_key)
      ORDER BY seed.seed_key, product.id
    )
    UPDATE food_product
    SET seed_key = candidate.seed_key
    FROM candidate
    WHERE food_product.id = candidate.id
  `);
}
