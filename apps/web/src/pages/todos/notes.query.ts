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

export function useUpdateNoteMutation() {
  return useMutation({
    meta: { error: { title: 'Note could not be saved' }, invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string; title?: string; content?: string }) =>
      updateNote({ data: variables }),
  });
}
