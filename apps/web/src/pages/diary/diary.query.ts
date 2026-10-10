import { useMutation } from '@tanstack/react-query';
import { saveDiaryKey } from '@/lib/diaryKeyVault';
import {
  createDiaryEntry,
  deleteDiaryEntry,
  getLegacyDiaryEntries,
  setupDiaryKey,
  updateDiaryEntry,
} from './diary.api';
import {
  createDiaryKey,
  type DiaryEntryContent,
  type DiaryKeyRecord,
  encryptDiaryEntry,
  unlockDiaryKey,
} from './diaryCrypto';

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
