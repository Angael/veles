import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { asc, eq, sql } from 'drizzle-orm';
import { weightEntries } from '@veles/db/schema';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/getSession';
import { logMiddleware } from '@/lib/middleware/logMiddleware';

export type WeightEntry = {
  date: string;
  weightKg: number;
};

export const MAX_WEIGHT_IMPORT_ENTRIES = 3_000;

const saveWeightInputType = type({
  date: 'string.date',
  weightKg: '30 <= number <= 300',
});

const saveWeightsInputType = type({
  entries: saveWeightInputType.array().atLeastLength(1).atMostLength(MAX_WEIGHT_IMPORT_ENTRIES),
});

export const getWeightEntries = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWeightEntries')])
  .handler(async () => {
    const session = await requireSession();
    const entries = await db
      .select({
        date: weightEntries.date,
        weightGrams: weightEntries.weightGrams,
      })
      .from(weightEntries)
      .where(eq(weightEntries.userId, session.user.id))
      .orderBy(asc(weightEntries.date));

    return entries.map((entry) => ({
      date: entry.date,
      weightKg: entry.weightGrams / 1_000,
    }));
  });

export const saveWeight = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('saveWeight')])
  .validator(arkTypeValidator(saveWeightInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const weightGrams = Math.round(data.weightKg * 1_000);

    await db
      .insert(weightEntries)
      .values({
        date: data.date,
        userId: session.user.id,
        weightGrams,
      })
      .onConflictDoUpdate({
        set: { weightGrams },
        target: [weightEntries.userId, weightEntries.date],
      });
  });

export const saveWeights = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('saveWeights')])
  .validator(arkTypeValidator(saveWeightsInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    await db
      .insert(weightEntries)
      .values(
        data.entries.map((entry) => ({
          date: entry.date,
          userId: session.user.id,
          weightGrams: Math.round(entry.weightKg * 1_000),
        })),
      )
      .onConflictDoUpdate({
        set: { weightGrams: sql`excluded.${sql.identifier(weightEntries.weightGrams.name)}` },
        target: [weightEntries.userId, weightEntries.date],
      });
  });
