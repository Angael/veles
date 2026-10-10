import { useEffect, useState } from 'react';
import type { EncryptedDiaryEntry } from './diary.api';
import { decryptDiaryEntry, type DiaryEntryContent } from './diaryCrypto';

export type DiaryEntrySummary = DiaryEntryContent & {
  entryDate: string;
  id: string;
};

type DecryptionResult = { entries: DiaryEntrySummary[]; error: boolean } | null;

/** Decrypts server entries in the browser; null while decrypting. */
export function useDecryptedEntries(key: CryptoKey, entries: EncryptedDiaryEntry[]) {
  const [result, setResult] = useState<DecryptionResult>(null);

  useEffect(() => {
    let active = true;
    Promise.all(
      entries.map(async (entry) => ({
        ...(await decryptDiaryEntry(key, entry.id, entry.ciphertext)),
        entryDate: entry.entryDate,
        id: entry.id,
      })),
    ).then(
      (decrypted) => {
        if (active) setResult({ entries: decrypted, error: false });
      },
      () => {
        if (active) setResult({ entries: [], error: true });
      },
    );
    return () => {
      active = false;
    };
  }, [key, entries]);

  return result;
}
