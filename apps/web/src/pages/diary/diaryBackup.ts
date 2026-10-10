import { type } from 'arktype';
import { dateOnlyType } from '@/lib/dateOnly';
import type { DiaryEntrySummary } from './useDecryptedEntries';

// Backups are plaintext JSON files built and read in the browser; the server only sees ciphertext.

const DIARY_BACKUP_VERSION = 1;
export const MAX_DIARY_IMPORT_ENTRIES = 5_000;

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

type DiaryBackup = typeof diaryBackupType.infer;
type DiaryBackupEntry = typeof diaryBackupEntryType.infer;

/** Builds an export file from decrypted entries, oldest first. */
export function createDiaryBackup(entries: DiaryEntrySummary[]): DiaryBackup {
  return {
    entries: entries
      .toSorted(
        (a, b) =>
          a.entryDate.localeCompare(b.entryDate) || a.createdAt.valueOf() - b.createdAt.valueOf(),
      )
      .map((entry) => ({
        createdAt: entry.createdAt.toISOString(),
        entryDate: entry.entryDate,
        markdown: entry.markdown,
        title: entry.title,
        updatedAt: entry.updatedAt.toISOString(),
      })),
    version: DIARY_BACKUP_VERSION,
  };
}

/** Parses and validates a diary export file, with messages safe to show in a toast. */
export function parseDiaryBackup(json: string) {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error('The file is not valid JSON.');
  }

  const backup = diaryBackupType(value);
  if (backup instanceof type.errors) {
    throw new Error(`The file is not a Veles diary export: ${backup.summary}`);
  }
  return backup;
}

/**
 * Drops backup entries that already exist or repeat in the file.
 * An entry is a duplicate when its date, title, and text all match, so re-importing an export is a no-op.
 */
export function selectNewBackupEntries(
  existing: DiaryEntrySummary[],
  backupEntries: DiaryBackupEntry[],
) {
  const seenKeys = new Set(existing.map(getDiaryEntryKey));
  return backupEntries.filter((entry) => {
    const key = getDiaryEntryKey(entry);
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}

function getDiaryEntryKey(entry: { entryDate: string; markdown: string; title: string }) {
  return JSON.stringify([entry.entryDate, entry.title, entry.markdown]);
}
