import { inArray } from 'drizzle-orm';
import { foodProducts } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import type { changeFoodLogsInputType, logFoodEntriesInputType } from './calories.validation';
import {
  copyFoodLogsRecord,
  deleteFoodLogsRecord,
  moveFoodLogsRecord,
  multiplyFoodLogsRecord,
  recordCustomCaloriesRecord,
  recordFoodRecord,
} from './foodLogs.server';

/**
 * Logs several foods on one date, e.g. a whole meal from one message. Checks every product first
 * so a wrong id fails before anything is logged. Returns the entries in input order.
 */
export async function logFoodEntriesRecord(
  userId: string,
  { date, entries }: typeof logFoodEntriesInputType.infer,
) {
  const productIds = entries.flatMap((entry) => (entry.productId ? [entry.productId] : []));
  if (productIds.length) {
    const found = await db
      .select({ id: foodProducts.id })
      .from(foodProducts)
      .where(inArray(foodProducts.id, productIds));
    const missing = productIds.filter((id) => !found.some((product) => product.id === id));
    if (missing.length) throw new ClientSafeError(`Unknown productId: ${missing.join(', ')}.`);
  }
  for (const entry of entries) {
    if (
      entry.productId ? typeof entry.grams !== 'number' : !entry.name || entry.kcal === undefined
    ) {
      throw new ClientSafeError('Each entry needs productId and grams, or name and kcal.');
    }
  }
  const logged = [];
  for (const { productId, grams, name, kcal, ...macros } of entries) {
    logged.push(
      productId
        ? await recordFoodRecord(userId, { date, grams: grams ?? 0, productId })
        : await recordCustomCaloriesRecord(userId, {
            ...macros,
            date,
            grams,
            kcal: kcal ?? 0,
            name: name ?? '',
          }),
    );
  }
  return logged;
}

/** Deletes, moves, copies, or multiplies the user's selected logs, like the diary's bulk actions. */
export async function changeFoodLogsRecord(
  userId: string,
  { action, date, factor, ids }: typeof changeFoodLogsInputType.infer,
) {
  if (action === 'delete') return deleteFoodLogsRecord(userId, { ids });
  if (action === 'multiply') {
    if (factor === undefined) throw new ClientSafeError('multiply needs a factor.');
    return multiplyFoodLogsRecord(userId, { factor, ids });
  }
  if (!date) throw new ClientSafeError(`${action} needs a date.`);
  return action === 'move'
    ? moveFoodLogsRecord(userId, { date, ids })
    : copyFoodLogsRecord(userId, { date, ids });
}
