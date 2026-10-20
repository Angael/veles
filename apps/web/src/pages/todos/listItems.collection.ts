import { collectionOptions, useDbClient } from '@tanstack/react-db';
import { queryCollectionOptions, type QueryCollectionUtils } from '@tanstack/query-db-collection';
import type { QueryClient } from '@tanstack/react-query';
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
 * Shopping list items live in a TanStack DB collection.
 *
 * - This is a descriptor. Each `DbClient` (one per SSR request, one in the browser) makes its
 *   own collection from it, with the `QueryClient` that was given to that `DbClient`.
 * - Reads: `queryFn` loads every accessible row once (and polls), like a normal query.
 * - Writes: components call `collection.insert/update/delete`. The change shows in every
 *   live query at once, then the matching handler below sends it to the server.
 * - If a handler throws, TanStack DB rolls the optimistic change back by itself.
 * - After a handler succeeds, it refetches, so server state stays the truth.
 */
export const listItemsCollection = collectionOptions('list-items', (client) =>
  queryCollectionOptions({
    getKey: (item: NoteListItem) => item.id,
    id: 'list-items',
    queryClient: client.requireDependency<QueryClient>('queryClient'),
    queryFn: () => getListItems(),
    queryKey: ['list-items'],
    // Lists are shared between users, so keep the same freshness as the notes query.
    refetchInterval: 30_000,
    refetchOnWindowFocus: 'always',
    staleTime: 5_000,
    onInsert: ({ collection, transaction }) =>
      persist(
        collection,
        'Item could not be added',
        transaction.mutations.map(({ modified: { id, name, noteId } }) =>
          createListItem({ data: { id, name, noteId } }),
        ),
      ),
    onUpdate: ({ collection, transaction }) =>
      persist(
        collection,
        'Item could not be saved',
        transaction.mutations.flatMap(({ changes: { checked, name }, key: id }) => [
          ...(checked === undefined ? [] : [setListItemChecked({ data: { checked, id } })]),
          ...(name === undefined ? [] : [updateListItem({ data: { id, name } })]),
        ]),
      ),
    onDelete: ({ collection, transaction }) =>
      persist(
        collection,
        'Item could not be deleted',
        transaction.mutations.map(({ key: id }) => deleteListItem({ data: { id } })),
      ),
  }),
);

/**
 * Waits for all server calls, toasts once on failure, and rethrows so TanStack DB rolls back.
 * On success it refetches by hand and turns off the deprecated automatic refetch (removed in 1.0).
 */
async function persist(
  collection: { utils: { refetch: () => Promise<unknown> } },
  errorTitle: string,
  requests: Promise<unknown>[],
) {
  try {
    await Promise.all(requests);
  } catch (error) {
    toastManager.add({ priority: 'high', title: errorTitle, type: 'error' });
    throw error;
  }
  await collection.utils.refetch();
  return { refetch: false };
}

/** The list items collection of the current `DbClient`, for writes and `utils.refetch()`. */
export function useListItemsCollection() {
  // Explicit types: otherwise the schema overload matches first and infers `never` rows.
  return useDbClient().collection<NoteListItem, string, QueryCollectionUtils<NoteListItem, string>>(
    listItemsCollection,
  );
}
