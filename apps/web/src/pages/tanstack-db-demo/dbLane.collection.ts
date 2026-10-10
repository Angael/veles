import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { toastManager } from '@/components/ui/toast/toastManager';
import { type DemoItem, dbServer } from './fakeServer';

/** Same shape as `pages/todos/listItems.collection.ts`, but backed by the fake demo server. */
function createDemoItemsCollection(queryClient: QueryClient) {
  return createCollection(
    queryCollectionOptions({
      getKey: (item: DemoItem) => item.id,
      id: 'demo-db-items',
      queryClient,
      queryFn: () => dbServer.list(),
      queryKey: ['demo', 'db-items'],
      onInsert: ({ transaction }) =>
        withErrorToast(
          'Item could not be added',
          transaction.mutations.map(({ modified: { id, name } }) => dbServer.create({ id, name })),
        ),
      onUpdate: ({ transaction }) =>
        withErrorToast(
          'Item could not be saved',
          transaction.mutations.map(({ changes, key }) => dbServer.update(String(key), changes)),
        ),
      onDelete: ({ transaction }) =>
        withErrorToast(
          'Item could not be deleted',
          transaction.mutations.map(({ key }) => dbServer.remove(String(key))),
        ),
    }),
  );
}

/** Toasts once on failure and rethrows, because a throwing handler is what triggers rollback. */
async function withErrorToast(title: string, requests: Promise<unknown>[]) {
  try {
    await Promise.all(requests);
  } catch (error) {
    toastManager.add({ priority: 'high', title, type: 'error' });
    throw error;
  }
}

type DemoItemsCollection = ReturnType<typeof createDemoItemsCollection>;

const collections = new WeakMap<QueryClient, DemoItemsCollection>();

export function getDemoItemsCollection(queryClient: QueryClient) {
  let collection = collections.get(queryClient);
  if (!collection) {
    collection = createDemoItemsCollection(queryClient);
    collections.set(queryClient, collection);
  }
  return collection;
}

export function useDemoItemsCollection() {
  return getDemoItemsCollection(useQueryClient());
}
