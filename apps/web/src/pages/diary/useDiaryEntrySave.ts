import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { isVersionConflictError } from '@/lib/errors/VersionConflictError';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import { getDiaryEntryById, updateDiaryEntry } from './diary.api';
import { type DiaryEntryContent, encryptDiaryEntry } from './diaryCrypto';
import type { DiaryEntrySummary } from './useDecryptedEntries';

export type DiaryEntryDraft = DiaryEntryContent & {
  entryDate: string;
  id: string;
};

/**
 * Autosaves diary drafts one at a time against the version the editor loaded. A conflict stops
 * saving, with no retry, and keeps the draft in the editor until the user loads the latest entry
 * (the draft stays readable in `unsavedText`) or keeps the draft and saves it over the latest.
 */
export function useDiaryEntrySave(key: CryptoKey, entry: DiaryEntrySummary) {
  const router = useRouter();
  const { markDirty, markSaved } = useUnsavedChangesGuard();
  // The version the next save must match: the loaded one, then each saved one.
  const versionRef = useRef(entry.version);
  const [conflicted, setConflicted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unsavedText, setUnsavedText] = useState<string | null>(null);

  useEffect(() => {
    versionRef.current = entry.version;
  }, [entry.version]);

  useEffect(() => {
    if (conflicted) markDirty();
    else markSaved();
  }, [conflicted, markDirty, markSaved]);

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
      if (isVersionConflictError(error)) setConflicted(true);
    },
    // Runs saves in order, so each one sends the version the previous save returned.
    scope: { id: `diary-entry-${entry.id}` },
  });

  /** Runs a conflict resolution; when it fails, the conflict stays. */
  const resolve = (action: () => Promise<void>) => {
    setLoading(true);
    void action()
      .then(() => setConflicted(false))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  return {
    conflicted,
    dismissUnsavedText: () => setUnsavedText(null),
    isError: mutation.isError && !isVersionConflictError(mutation.error),
    isPending: mutation.isPending,
    loading: loading || mutation.isPending,
    unsavedText,
    save: (draft: DiaryEntryDraft) => {
      if (!conflicted) mutation.mutate(draft);
    },
    /** Reloads the route; the new `entry.version` resets the editor to the latest entry. */
    loadLatest: (draft: DiaryEntryDraft) =>
      resolve(async () => {
        await router.invalidate();
        setUnsavedText([draft.title, draft.markdown].filter(Boolean).join('\n\n'));
      }),
    /** Saves the kept draft over the latest version, at the user's request. */
    keepMine: (draft: DiaryEntryDraft) =>
      resolve(async () => {
        const latest = await getDiaryEntryById({ data: { id: entry.id } });
        versionRef.current = latest.entry.version;
        await mutation.mutateAsync(draft);
      }),
  };
}
