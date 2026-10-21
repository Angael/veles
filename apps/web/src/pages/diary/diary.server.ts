import { and, eq, sql } from 'drizzle-orm';
import { diaryEntries } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { VersionConflictError } from '@/lib/errors/VersionConflictError';
import { translate } from '@/lib/i18n/getLocale';
import { db } from '@/server/db.server';
import type { updateDiaryEntryInputType } from './diary.validation';

/**
 * Stores a re-encrypted entry only when `data.version` is still current. The check and increment
 * run in one UPDATE, so of two editors that loaded the same version exactly one wins; the other
 * gets a `VersionConflictError` and the stored entry stays unchanged.
 */
export async function updateDiaryEntryRecord(
  userId: string,
  data: typeof updateDiaryEntryInputType.infer,
) {
  const scope = and(eq(diaryEntries.id, data.id), eq(diaryEntries.userId, userId));
  const [updated] = await db
    .update(diaryEntries)
    .set({
      ciphertext: data.ciphertext,
      entryDate: data.entryDate,
      updatedAt: new Date(),
      version: sql`${diaryEntries.version} + 1`,
    })
    .where(and(scope, eq(diaryEntries.version, data.version)))
    .returning({ version: diaryEntries.version });

  if (updated) return updated;

  const [existing] = await db
    .select({ id: diaryEntries.id })
    .from(diaryEntries)
    .where(scope)
    .limit(1);
  if (existing) {
    throw new VersionConflictError(
      translate({
        en: 'This entry changed somewhere else. Load the latest version before you save again.',
        pl: 'Ten wpis zmienił się w innym miejscu. Wczytaj najnowszą wersję przed kolejnym zapisem.',
      }),
    );
  }
  throw new ClientSafeError(
    translate({ en: 'Diary entry not found.', pl: 'Nie znaleziono wpisu w dzienniku.' }),
  );
}
