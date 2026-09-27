import { queryOptions, useMutation } from '@tanstack/react-query';
import {
  createListItem,
  createNote,
  deleteListItem,
  deleteNote,
  getNotes,
  setListItemChecked,
  setNoteShared,
  updateListItem,
  toggleNoteType,
  updateNote,
} from './notes.api';

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
    mutationFn: (variables: { name: string; noteId: string }) =>
      createListItem({ data: variables }),
  });
}

export function useDeleteListItemMutation() {
  return useMutation({
    meta: { error: { title: 'Item could not be deleted' }, invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string }) => deleteListItem({ data: variables }),
  });
}

export function useSetListItemCheckedMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { checked: boolean; id: string }) =>
      setListItemChecked({ data: variables }),
  });
}

export function useToggleNoteTypeMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string }) => toggleNoteType({ data: variables }),
  });
}

export function useDeleteNoteMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string }) => deleteNote({ data: variables }),
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

export function useUpdateListItemMutation() {
  return useMutation({
    meta: { error: { title: 'Product could not be saved' }, invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string; name: string }) => updateListItem({ data: variables }),
  });
}
