import { useMutation } from '@tanstack/react-query';
import { toastManager } from '@/components/ui/toast/toastManager';
import { saveDiaryKey } from '@/lib/diaryKeyVault';
import {
  createDiaryEntry,
  deleteDiaryEntry,
  getLegacyDiaryEntries,
  setupDiaryKey,
  updateDiaryEntry,
} from './diary.api';
import { parseDiaryBackup, selectNewBackupEntries } from './diaryBackup';
import { importDiaryEntries } from './diaryBackup.api';
import {
  createDiaryKey,
  type DiaryEntryContent,
  type DiaryKeyRecord,
  encryptDiaryEntry,
  unlockDiaryKey,
} from './diaryCrypto';
import type { DiaryEntrySummary } from './useDecryptedEntries';

type DiaryEntryDraft = DiaryEntryContent & {
  entryDate: string;
  id: string;
};

type PassphraseInput = {
  passphrase: string;
  remember: boolean;
};

export function useCreateDiaryEntryMutation() {
  return useMutation({ mutationFn: createDiaryEntry });
}

export function useDeleteDiaryEntryMutation() {
  return useMutation({ mutationFn: deleteDiaryEntry });
}

/** Encrypts the draft in the browser before it is sent to the server. */
export function useUpdateDiaryEntryMutation(key: CryptoKey) {
  return useMutation({
    mutationFn: async ({ entryDate, id, markdown, title }: DiaryEntryDraft) =>
      updateDiaryEntry({
        data: { ciphertext: await encryptDiaryEntry(key, id, { markdown, title }), entryDate, id },
      }),
  });
}

/**
 * Unlocks the diary with an existing key record, or, when there is none, creates a key and
 * encrypts every legacy plaintext entry before the server stores the wrapped key.
 */
export function useDiaryPassphraseMutation(keyRecord: DiaryKeyRecord | null) {
  return useMutation({
    mutationFn: async ({ passphrase, remember }: PassphraseInput) => {
      if (keyRecord) {
        const key = await unlockDiaryKey(passphrase, keyRecord);
        await saveDiaryKey(keyRecord.wrappedKey, key, remember);
        return key;
      }

      const { key, record } = await createDiaryKey(passphrase);
      const legacyEntries = await getLegacyDiaryEntries();
      const entries = await Promise.all(
        legacyEntries.map(async ({ id, markdown, title }) => ({
          ciphertext: await encryptDiaryEntry(key, id, { markdown, title }),
          id,
        })),
      );
      await setupDiaryKey({ data: { entries, key: record } });
      await saveDiaryKey(record.wrappedKey, key, remember);
      return key;
    },
  });
}

/** Parses a backup file, skips entries that already exist, and encrypts the rest before upload. */
export function useImportDiaryEntriesMutation(key: CryptoKey, existing: DiaryEntrySummary[]) {
  return useMutation({
    mutationFn: async (json: string) => {
      const backup = parseDiaryBackup(json);
      const entries = await Promise.all(
        selectNewBackupEntries(existing, backup.entries).map(
          async ({ markdown, title, ...entry }) => {
            const id = crypto.randomUUID();
            return {
              ...entry,
              ciphertext: await encryptDiaryEntry(key, id, { markdown, title }),
              id,
            };
          },
        ),
      );
      await importDiaryEntries({ data: { entries } });
      return {
        importedCount: entries.length,
        skippedCount: backup.entries.length - entries.length,
      };
    },
    onError: (error) => {
      toastManager.add({
        description: error.message,
        priority: 'high',
        title: 'Diary could not be imported',
        type: 'error',
      });
    },
    onSuccess: ({ importedCount, skippedCount }) => {
      toastManager.add({
        description: skippedCount > 0 ? `Skipped ${skippedCount} existing.` : undefined,
        title: `Imported ${importedCount} ${importedCount === 1 ? 'entry' : 'entries'}`,
        type: 'success',
      });
    },
  });
}
