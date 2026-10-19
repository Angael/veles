import { sql } from 'drizzle-orm';
import { weightEntries } from '@veles/db/schema';
import { db } from '@/server/db.server';
import type { saveWeightInputType, saveWeightsInputType } from './weight.validation';

/** Upserts the weight for one date; existing photos stay linked. */
export async function saveWeightRecord(userId: string, data: typeof saveWeightInputType.infer) {
  const weightGrams = Math.round(data.weightKg * 1_000);
  await db
    .insert(weightEntries)
    .values({ date: data.date, userId, weightGrams })
    .onConflictDoUpdate({
      set: { weightGrams },
      target: [weightEntries.userId, weightEntries.date],
    });
}

/** Upserts many dates at once, e.g. an import; existing photos stay linked. */
export async function saveWeightsRecord(userId: string, data: typeof saveWeightsInputType.infer) {
  await db
    .insert(weightEntries)
    .values(
      data.entries.map((entry) => ({
        date: entry.date,
        userId,
        weightGrams: Math.round(entry.weightKg * 1_000),
      })),
    )
    .onConflictDoUpdate({
      set: { weightGrams: sql`excluded.${sql.identifier(weightEntries.weightGrams.name)}` },
      target: [weightEntries.userId, weightEntries.date],
    });
}
