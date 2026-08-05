import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { weightEntries } from '@/db/schema';
import { requireSession } from '@/lib/auth/getSession';
import { logMiddleware } from '@/lib/middleware/logMiddleware';

export type WeightEntry = {
  date: string;
  weightKg: number;
};

const saveWeightInputType = type({
  date: 'string.date',
  weightKg: '30 <= number <= 300',
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
