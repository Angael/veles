import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { diaryEntries } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { dateOnlyType } from '@/lib/dateOnly';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { MAX_DIARY_IMPORT_ENTRIES } from './diaryBackup';

const importDiaryEntriesInputType = type({
  entries: type({
    ciphertext: 'string <= 200000',
    'createdAt?': 'string.date.iso',
    entryDate: dateOnlyType,
    id: 'string.uuid',
    'updatedAt?': 'string.date.iso',
  })
    .array()
    .atMostLength(MAX_DIARY_IMPORT_ENTRIES),
});

/** Inserts imported entries that the browser already deduplicated and encrypted. */
export const importDiaryEntries = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('importDiaryEntries')])
  .validator(arkTypeValidator(importDiaryEntriesInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    if (data.entries.length === 0) return;

    await db
      .insert(diaryEntries)
      .values(
        data.entries.map((entry) => ({
          ciphertext: entry.ciphertext,
          createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
          entryDate: entry.entryDate,
          id: entry.id,
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
          userId: session.user.id,
        })),
      )
      .onConflictDoNothing();
  });
