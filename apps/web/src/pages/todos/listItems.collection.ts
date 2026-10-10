import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { toastManager } from '@/components/ui/toast/toastManager';
import {
  createListItem,
  deleteListItem,
  getListItems,
  type NoteListItem,
  setListItemChecked,
  updateListItem,
} from './notes.api';

/**
 * TanStack DB demo: shopping list items live in a client-side collection.
 *
 * - Reads: `queryFn` loads every accessible row once (and polls), like a normal query.
 * - Writes: components call `collection.insert/update/delete`. The change shows in every
 *   live query at once, then the matching handler below sends it to the server.
 * - If a handler throws, TanStack DB rolls the optimistic change back by itself.
 * - After a handler succeeds, the collection refetches, so server state stays the truth.
 */
function createListItemsCollection(queryClient: QueryClient) {
  return createCollection(
    queryCollectionOptions({
      getKey: (item: NoteListItem) => item.id,
      id: 'list-items',
      queryClient,
      queryFn: () => getListItems(),
      queryKey: ['list-items'],
      // Lists are shared between users, so keep the same freshness as the notes query.
      refetchInterval: 30_000,
      refetchOnWindowFocus: 'always',
      staleTime: 5_000,
      onInsert: ({ transaction }) =>
        withErrorToast(
          'Item could not be added',
          transaction.mutations.map(({ modified: { id, name, noteId } }) =>
            createListItem({ data: { id, name, noteId } }),
          ),
        ),
      onUpdate: ({ transaction }) =>
        withErrorToast(
          'Item could not be saved',
          transaction.mutations.flatMap(({ changes: { checked, name }, key: id }) => [
            ...(checked === undefined ? [] : [setListItemChecked({ data: { checked, id } })]),
            ...(name === undefined ? [] : [updateListItem({ data: { id, name } })]),
          ]),
        ),
      onDelete: ({ transaction }) =>
        withErrorToast(
          'Item could not be deleted',
          transaction.mutations.map(({ key: id }) => deleteListItem({ data: { id } })),
        ),
    }),
  );
}

/** Waits for all server calls, toasts once on failure, and rethrows so TanStack DB rolls back. */
async function withErrorToast(title: string, requests: Promise<unknown>[]) {
  try {
    await Promise.all(requests);
  } catch (error) {
    toastManager.add({ priority: 'high', title, type: 'error' });
    throw error;
  }
}

type ListItemsCollection = ReturnType<typeof createListItemsCollection>;

const collections = new WeakMap<QueryClient, ListItemsCollection>();

/** One collection per QueryClient, so loaders, hooks, and mutations share the same rows. */
export function getListItemsCollection(queryClient: QueryClient) {
  let collection = collections.get(queryClient);
  if (!collection) {
    collection = createListItemsCollection(queryClient);
    collections.set(queryClient, collection);
  }
  return collection;
}

export function useListItemsCollection() {
  return getListItemsCollection(useQueryClient());
}
