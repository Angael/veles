import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { asc, eq } from 'drizzle-orm';
import { diaryEntries } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { dateOnlyType } from '@/lib/dateOnly';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';

const DIARY_BACKUP_VERSION = 1;
const MAX_DIARY_IMPORT_ENTRIES = 5_000;

const diaryBackupEntryType = type({
  'createdAt?': 'string.date.iso',
  entryDate: dateOnlyType,
  markdown: 'string <= 16000',
  title: 'string <= 160',
  'updatedAt?': 'string.date.iso',
});

const diaryBackupType = type({
  entries: diaryBackupEntryType.array().atMostLength(MAX_DIARY_IMPORT_ENTRIES),
  version: type.unit(DIARY_BACKUP_VERSION),
});

const importDiaryEntriesInputType = type({ json: 'string <= 100000000' });

export type DiaryBackup = typeof diaryBackupType.infer;

export const exportDiaryEntries = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('exportDiaryEntries')])
  .handler(async (): Promise<DiaryBackup> => {
    const session = await requireSession();
    const entries = await db
      .select({
        createdAt: diaryEntries.createdAt,
        entryDate: diaryEntries.entryDate,
        markdown: diaryEntries.markdown,
        title: diaryEntries.title,
        updatedAt: diaryEntries.updatedAt,
      })
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, session.user.id))
      .orderBy(asc(diaryEntries.entryDate), asc(diaryEntries.createdAt));

    return {
      entries: entries.map((entry) => ({
        createdAt: entry.createdAt.toISOString(),
        entryDate: entry.entryDate,
        markdown: entry.markdown,
        title: entry.title,
        updatedAt: entry.updatedAt.toISOString(),
      })),
      version: DIARY_BACKUP_VERSION,
    };
  });

/**
 * Imports a diary backup file and skips entries that already exist.
 * An entry is a duplicate when its date, title, and text all match, so re-importing an export is a no-op.
 */
export const importDiaryEntries = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('importDiaryEntries')])
  .validator(arkTypeValidator(importDiaryEntriesInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const backup = parseDiaryBackup(data.json);

    const existing = await db
      .select({
        entryDate: diaryEntries.entryDate,
        markdown: diaryEntries.markdown,
        title: diaryEntries.title,
      })
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, session.user.id));
    const seenKeys = new Set(existing.map(getDiaryEntryKey));

    const newEntries = backup.entries.filter((entry) => {
      const key = getDiaryEntryKey(entry);
      if (seenKeys.has(key)) {
        return false;
      }
      seenKeys.add(key);
      return true;
    });

    if (newEntries.length > 0) {
      await db.insert(diaryEntries).values(
        newEntries.map((entry) => ({
          createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
          entryDate: entry.entryDate,
          markdown: entry.markdown,
          title: entry.title,
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
          userId: session.user.id,
        })),
      );
    }

    return {
      importedCount: newEntries.length,
      skippedCount: backup.entries.length - newEntries.length,
    };
  });

function parseDiaryBackup(json: string) {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ClientSafeError('The file is not valid JSON.');
  }

  const backup = diaryBackupType(value);
  if (backup instanceof type.errors) {
    throw new ClientSafeError(`The file is not a Veles diary export: ${backup.summary}`);
  }
  return backup;
}

function getDiaryEntryKey(entry: { entryDate: string; markdown: string; title: string }) {
  return JSON.stringify([entry.entryDate, entry.title, entry.markdown]);
}
