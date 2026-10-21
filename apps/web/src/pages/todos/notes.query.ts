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
import type { createNoteInputType } from './notes.validation';
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

/** A new checklist may arrive with items, so the list items collection refetches too. */
export function useCreateNoteMutation() {
  const { t } = useI18n();
  const listItems = useListItemsCollection();
  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Note could not be created', pl: 'Nie udało się utworzyć notatki' }),
      },
      invalidateQueryKey: notesQueryKey,
    },
    mutationFn: (variables: typeof createNoteInputType.inferIn) => createNote({ data: variables }),
    onSuccess: (_data, variables) =>
      variables.items?.length ? listItems.utils.refetch() : undefined,
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

export function useUpdateNoteMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Note could not be saved', pl: 'Nie udało się zapisać notatki' }) },
      invalidateQueryKey: notesQueryKey,
    },
    mutationFn: (variables: { id: string; title?: string; content?: string }) =>
      updateNote({ data: variables }),
  });
}
