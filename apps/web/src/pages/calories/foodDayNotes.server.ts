import { and, eq, isNull } from 'drizzle-orm';
import { calorieDayNotes } from '@veles/db/schema';
import { db } from '@/server/db.server';
import type { setFoodDayNoteInputType } from './calories.validation';

export type FoodDayNote = { date: string; offPlan: boolean; note: string | null };

/**
 * Sets the given fields of a day's note and off-plan flag; omitted fields stay. The row is removed
 * once both are empty, so only days with a note or flag have one.
 */
export async function setFoodDayNoteRecord(
  userId: string,
  data: typeof setFoodDayNoteInputType.infer,
): Promise<FoodDayNote> {
  const note = data.note === undefined ? undefined : data.note || null;
  const changes = {
    ...(data.offPlan === undefined ? {} : { offPlan: data.offPlan }),
    ...(note === undefined ? {} : { note }),
  };

  const [row] = await db
    .insert(calorieDayNotes)
    .values({ userId, date: data.date, ...changes })
    .onConflictDoUpdate({
      set: { ...changes, updatedAt: new Date() },
      target: [calorieDayNotes.userId, calorieDayNotes.date],
    })
    .returning();
  if (!row) throw new Error('Day note could not be saved.');

  if (!row.offPlan && row.note === null) {
    await db
      .delete(calorieDayNotes)
      .where(
        and(
          eq(calorieDayNotes.id, row.id),
          eq(calorieDayNotes.offPlan, false),
          isNull(calorieDayNotes.note),
        ),
      );
  }

  return { date: row.date, offPlan: row.offPlan, note: row.note };
}
