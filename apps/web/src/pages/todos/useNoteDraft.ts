import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { isVersionConflictError } from '@/lib/errors/VersionConflictError';
import type { NoteSummary } from './notes.api';
import { notesQueryOptions, useUpdateNoteMutation } from './notes.query';

type NoteText = { content: string; title: string };

const textOf = ({ content, title }: NoteText): NoteText => ({ content, title });

/**
 * Holds a note card's editable text and its base version. Polled changes apply only without unsaved
 * edits. After a conflict, `loadLatest` loads the newer note and keeps the draft in `recovered`.
 */
export function useNoteDraft(note: NoteSummary) {
  const queryClient = useQueryClient();
  const [base, setBase] = useState({ ...textOf(note), version: note.version });
  const [draft, setDraft] = useState(textOf(note));
  const [seenVersion, setSeenVersion] = useState(note.version);
  const [conflicted, setConflicted] = useState(false);
  const [recovered, setRecovered] = useState<NoteText | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const versionRef = useRef(note.version);
  const mutation = useUpdateNoteMutation(note.id, () => versionRef.current, {
    onError: (error) => {
      if (isVersionConflictError(error)) setConflicted(true);
    },
    onSuccess: (saved) => {
      versionRef.current = saved.version;
      setBase((current) => ({ ...current, ...saved }));
    },
  });
  const dirty = draft.title !== base.title || draft.content !== base.content;

  if (note.version !== seenVersion) {
    setSeenVersion(note.version);
    if (!dirty && !conflicted && note.version > base.version) {
      versionRef.current = note.version;
      setBase({ ...textOf(note), version: note.version });
      setDraft(textOf(note));
    }
  }

  const save = (changes: Partial<NoteText>) => {
    if (!conflicted) mutation.mutate(changes);
  };

  const applyLatest = (latest: NoteSummary) => {
    versionRef.current = latest.version;
    setSeenVersion(latest.version);
    setBase({ ...textOf(latest), version: latest.version });
    setDraft(textOf(latest));
    setConflicted(false);
  };

  return {
    conflicted,
    draft,
    loadingLatest: loadingLatest || mutation.isPending,
    recovered,
    setDraft,
    discardRecovered: () => setRecovered(null),
    /** Fetches the newest note into the editor and keeps the rejected draft for reconciling. */
    loadLatest: () => {
      setRecovered(draft);
      setLoadingLatest(true);
      void queryClient
        .fetchQuery({ ...notesQueryOptions(), staleTime: 0 })
        .then((notes) => {
          const latest = notes.find((item) => item.id === note.id);
          if (latest) applyLatest(latest);
        })
        .catch(() => undefined)
        .finally(() => setLoadingLatest(false));
    },
    saveContent: () => {
      if (draft.content !== base.content) save({ content: draft.content });
    },
    /** Saves a changed title; an empty title falls back to the saved one. */
    saveTitle: () => {
      const title = draft.title.trim() || base.title;
      setDraft((current) => ({ ...current, title }));
      if (title !== base.title) save({ title });
    },
    /** Puts the rejected draft back and saves it over the latest version, at the user's request. */
    restoreRecovered: () => {
      if (!recovered) return;
      const title = recovered.title.trim() || base.title;
      setDraft({ content: recovered.content, title });
      setRecovered(null);
      save({ content: recovered.content, title });
    },
  };
}
