import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { isVersionConflictError } from '@/lib/errors/VersionConflictError';
import type { NoteSummary } from './notes.api';
import { notesQueryOptions, useUpdateNoteMutation } from './notes.query';

type NoteChanges = { content?: string; title?: string };

/**
 * Saves a note card's uncontrolled inputs against the version the card shows. A stale save keeps
 * the rejected changes and blocks more saves until the user loads the latest note (remounts the
 * inputs via `inputsKey` and keeps the rejected text in `unsavedText` to copy from) or keeps
 * theirs (saves them again against the latest version, then remounts the inputs with the result).
 * Newer polled versions replace the inputs only while the user is not editing the card.
 */
export function useNoteSave(note: NoteSummary) {
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  // The version the next save must match: the shown one, then each saved one.
  const versionRef = useRef(note.version);
  const [inputsKey, setInputsKey] = useState(note.version);
  const [rejected, setRejected] = useState<NoteChanges | null>(null);
  const [unsavedText, setUnsavedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mutation = useUpdateNoteMutation(note.id, () => versionRef.current, {
    onError: (error, changes) => {
      if (isVersionConflictError(error)) setRejected((current) => ({ ...current, ...changes }));
    },
    onSuccess: (saved) => {
      versionRef.current = saved.version;
    },
  });

  const showVersion = (version: number) => {
    versionRef.current = version;
    setInputsKey(version);
  };

  useEffect(() => {
    const editing = cardRef.current?.contains(document.activeElement);
    if (!rejected && !editing && !mutation.isPending && note.version > versionRef.current) {
      showVersion(note.version);
    }
  }, [mutation.isPending, note.version, rejected]);

  const fetchLatest = () => queryClient.fetchQuery({ ...notesQueryOptions(), staleTime: 0 });

  /** Fetches the newest note and resolves the conflict with it; a failed fetch keeps the conflict. */
  const resolveWith = (resolve: (latest: NoteSummary) => void) => {
    setLoading(true);
    void fetchLatest()
      .then((notes) => {
        const latest = notes.find((item) => item.id === note.id);
        if (latest) resolve(latest);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  return {
    cardRef,
    conflicted: rejected !== null,
    dismissUnsavedText: () => setUnsavedText(null),
    inputsKey,
    loading: loading || mutation.isPending,
    unsavedText,
    save: (changes: NoteChanges) => {
      if (rejected) setRejected({ ...rejected, ...changes });
      else mutation.mutate(changes);
    },
    loadLatest: () =>
      resolveWith((latest) => {
        if (rejected) {
          setUnsavedText([rejected.title, rejected.content].filter(Boolean).join('\n\n'));
        }
        setRejected(null);
        showVersion(latest.version);
      }),
    keepMine: () =>
      resolveWith((latest) => {
        versionRef.current = latest.version;
        // Fields the user did not change still show the old text, so show the saved note in all.
        if (rejected) {
          mutation.mutate(rejected, {
            onSuccess: (saved) =>
              void fetchLatest()
                .then(() => setInputsKey(saved.version))
                .catch(() => undefined),
          });
        }
        setRejected(null);
      }),
  };
}
