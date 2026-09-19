import { queryOptions, useMutation } from '@tanstack/react-query';
import { createListItem, createNote, getNotes, setListItemChecked } from './notes.api';

export const notesQueryKey = ['notes'] as const;

export function notesQueryOptions() {
  return queryOptions({
    queryFn: () => getNotes(),
    queryKey: notesQueryKey,
  });
}

export function useCreateNoteMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { content: string; title: string; type: 'note' | 'shopping_list' }) =>
      createNote({ data: variables }),
  });
}

export function useCreateListItemMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { name: string; noteId: string; quantity: string; unit: string }) =>
      createListItem({ data: variables }),
  });
}

export function useSetListItemCheckedMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { checked: boolean; id: string }) =>
      setListItemChecked({ data: variables }),
  });
}
