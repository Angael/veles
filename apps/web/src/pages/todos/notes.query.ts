import { queryOptions, useMutation } from '@tanstack/react-query';
import { useListItemsCollection } from './listItems.collection';
import {
  createNote,
  deleteNote,
  getNotes,
  setNoteShared,
  toggleNoteType,
  updateNote,
} from './notes.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

export const notesQueryKey = ['notes'] as const;

/** Notes are shared between users, so keep them fresh: refetch on focus and poll while visible. */
export function notesQueryOptions() {
  return queryOptions({
    queryFn: () => getNotes(),
    queryKey: notesQueryKey,
    refetchInterval: 30_000,
    refetchOnWindowFocus: 'always',
    staleTime: 5_000,
  });
}

export function useCreateNoteMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { content: string; title: string; type: 'note' | 'shopping_list' }) =>
      createNote({ data: variables }),
  });
}

/** Converting a note creates or removes list items on the server, so the collection refetches. */
export function useToggleNoteTypeMutation() {
  const listItems = useListItemsCollection();
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string }) => toggleNoteType({ data: variables }),
    onSuccess: () => listItems.utils.refetch(),
  });
}

/** Deleting a note cascades to its list items on the server, so the collection refetches. */
export function useDeleteNoteMutation() {
  const listItems = useListItemsCollection();
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string }) => deleteNote({ data: variables }),
    onSuccess: () => listItems.utils.refetch(),
  });
}

export function useSetNoteSharedMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string; shared: boolean }) => setNoteShared({ data: variables }),
  });
}

/**
 * Saves note text against the version the editor holds. Saves of one note run in order, and the
 * next one starts after `onSuccess` stored the new version, so an editor's consecutive saves never
 * conflict with each other.
 */
export function useUpdateNoteMutation(
  noteId: string,
  getVersion: () => number,
  callbacks: {
    onError: (error: Error) => void;
    onSuccess: (saved: { content?: string; title?: string; version: number }) => void;
  },
) {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Note could not be saved', pl: 'Nie udało się zapisać notatki' }) },
      invalidateQueryKey: notesQueryKey,
    },
    mutationFn: async (variables: { content?: string; title?: string }) => {
      const saved = await updateNote({ data: { ...variables, id: noteId, version: getVersion() } });
      return { ...variables, version: saved.version };
    },
    // Hook-level callbacks run for every save; `mutate` callbacks would skip all but the last.
    ...callbacks,
    scope: { id: `note-${noteId}` },
  });
}
