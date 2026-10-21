import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { isVersionConflictError } from '@/lib/errors/VersionConflictError';
import { updateDiaryEntry } from './diary.api';
import { type DiaryEntryContent, encryptDiaryEntry } from './diaryCrypto';
import type { DiaryEntrySummary } from './useDecryptedEntries';

export type DiaryEntryDraft = DiaryEntryContent & {
  entryDate: string;
  id: string;
};

/**
 * Autosaves diary drafts in order against the loaded version. A conflict stops saving until the
 * latest entry is loaded, so a stale draft never overwrites newer text.
 */
export function useDiaryEntrySave(key: CryptoKey, entry: DiaryEntrySummary) {
  const versionRef = useRef(entry.version);
  const [conflictAt, setConflictAt] = useState<number | null>(null);

  useEffect(() => {
    versionRef.current = entry.version;
  }, [entry.version]);

  const mutation = useMutation({
    mutationFn: async (draft: DiaryEntryDraft) => {
      const { version } = await updateDiaryEntry({
        data: {
          ciphertext: await encryptDiaryEntry(key, draft.id, {
            markdown: draft.markdown,
            title: draft.title,
          }),
          entryDate: draft.entryDate,
          id: draft.id,
          version: versionRef.current,
        },
      });
      versionRef.current = version;
    },
    onError: (error) => {
      if (isVersionConflictError(error)) setConflictAt(entry.version);
    },
    scope: { id: `diary-entry-${entry.id}` },
  });

  // Loading the latest entry changes `entry.version`, which clears the conflict.
  const conflicted = conflictAt === entry.version;

  return {
    conflicted,
    isError: mutation.isError && !isVersionConflictError(mutation.error),
    isPending: mutation.isPending,
    save: (draft: DiaryEntryDraft) => {
      if (!conflicted) mutation.mutate(draft);
    },
  };
}
