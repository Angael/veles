import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { isVersionConflictError } from '@/lib/errors/VersionConflictError';
import type { NoteSummary } from './notes.api';
import { notesQueryKey, useToggleNoteTypeMutation, useUpdateNoteMutation } from './notes.query';

type NoteText = { content: string; title: string };

/**
 * Saves a note card's uncontrolled inputs against the version they show. When a newer version
 * arrives (polling, or after a rejected stale save) the card switches to it at once, also while the
 * user is typing; text the user had not saved moves to `unsavedText` to copy from. While a rejected
 * save waits for the latest version, `stale` locks the card, so nobody keeps editing an old version.
 */
export function useNoteSave(note: NoteSummary) {
  const queryClient = useQueryClient();
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  // The text and version the inputs are based on; the next save or type change must match it.
  const shownRef = useRef({ content: note.content, title: note.title, version: note.version });
  const [stale, setStale] = useState(false);
  const [unsavedText, setUnsavedText] = useState<string | null>(null);
  const getVersion = () => shownRef.current.version;

  const onError = (error: Error) => {
    if (!isVersionConflictError(error)) return;
    setStale(true);
    void queryClient.invalidateQueries({ queryKey: notesQueryKey });
  };
  const mutation = useUpdateNoteMutation(note.id, getVersion, {
    onError,
    onSuccess: (saved, changes) => {
      shownRef.current = { ...shownRef.current, ...changes, version: saved.version };
    },
  });
  const toggleType = useToggleNoteTypeMutation(note.id, getVersion, onError);
  const busy = mutation.isPending || toggleType.isPending;

  useEffect(() => {
    const shown = shownRef.current;
    if (busy || note.version <= shown.version) return;
    const typed: NoteText = {
      content: contentRef.current?.value ?? shown.content,
      title: titleRef.current?.value.trim() ?? shown.title,
    };
    const unsaved = [
      typed.title !== shown.title && typed.title,
      typed.content !== shown.content && typed.content,
    ]
      .filter(Boolean)
      .join('\n\n');
    if (unsaved) setUnsavedText(unsaved);
    if (titleRef.current) titleRef.current.value = note.title;
    if (contentRef.current) contentRef.current.value = note.content;
    shownRef.current = { content: note.content, title: note.title, version: note.version };
    setStale(false);
  }, [busy, note.content, note.title, note.version]);

  const save = (changes: Partial<NoteText>) => {
    if (!stale) mutation.mutate(changes);
  };

  return {
    contentRef,
    dismissUnsavedText: () => setUnsavedText(null),
    stale,
    titleRef,
    togglingType: toggleType.isPending,
    unsavedText,
    saveContent: (input: HTMLTextAreaElement) => {
      if (input.value !== shownRef.current.content) save({ content: input.value });
    },
    /** An empty title is not allowed, so blanking it restores the shown title. */
    saveTitle: (input: HTMLInputElement) => {
      const title = input.value.trim();
      if (!title) input.value = shownRef.current.title;
      else if (title !== shownRef.current.title) save({ title });
    },
    toggleType: () => {
      if (!stale) toggleType.mutate();
    },
  };
}
