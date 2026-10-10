/** Code shown on the TanStack DB demo page. Kept short and close to the real Veles code. */

export const rqFetchSnippet = `
// notes.query.ts: describe the request once
export function listItemsQueryOptions() {
  return queryOptions({
    queryKey: ['list-items'],          // the cache "address"
    queryFn: () => getListItems(),     // server function, runs on the server
    refetchInterval: 30_000,
  });
}

// routes/todos.tsx: start the request before the page renders
loader: ({ context }) => context.queryClient.ensureQueryData(listItemsQueryOptions()),

// CheckedNoteCard.tsx: read the cached answer
const { data: items } = useSuspenseQuery(listItemsQueryOptions());
const mine = items.filter((item) => item.noteId === note.id);
`;

export const rqMutateSnippet = `
// notes.query.ts: one hook per kind of write
export function useSetListItemCheckedMutation() {
  return useMutation({
    meta: { invalidateQueryKey: ['list-items'] },   // refetch after success
    mutationFn: (variables: { checked: boolean; id: string }) =>
      setListItemChecked({ data: variables }),
  });
}

// CheckedNoteItem.tsx
const setChecked = useSetListItemCheckedMutation();
<input
  checked={item.checked}                 // still the OLD value until refetch ends
  disabled={setChecked.isPending}
  onChange={(event) => setChecked.mutate({ checked: event.currentTarget.checked, id: item.id })}
/>
`;

export const rqOptimisticSnippet = `
// The "make it feel instant" version Veles had before PR #227
const [checked, setChecked] = useState(item.checked);       // copy of server data
useEffect(() => setChecked(item.checked), [item.checked]);  // keep the copy in sync

onChange={(event) => {
  const next = event.currentTarget.checked;
  setChecked(next);                                         // 1. show it now
  setItemChecked.mutate(
    { checked: next, id: item.id },
    { onError: () => setChecked(!next) },                   // 2. undo by hand
  );
}}
// Only THIS checkbox sees the new value. Search, counters, other cards
// still read the old cache until the refetch ends.
`;

export const dbCollectionSnippet = `
// listItems.collection.ts
function createListItemsCollection(queryClient: QueryClient) {
  return createCollection(
    queryCollectionOptions({
      // --- reading: the same options you know from React Query ---
      queryClient,
      queryKey: ['list-items'],
      queryFn: () => getListItems(),          // must return FLAT rows
      getKey: (item: NoteListItem) => item.id, // every row needs a stable id
      refetchInterval: 30_000,

      // --- writing: called AFTER the UI already changed ---
      onInsert: ({ transaction }) => createListItem({ data: pick(transaction) }),
      onUpdate: ({ transaction }) => updateListItem({ data: pick(transaction) }),
      onDelete: ({ transaction }) => deleteListItem({ data: pick(transaction) }),
    }),
  );
}

// One collection per QueryClient (never at module scope, never in render)
const collections = new WeakMap<QueryClient, ListItemsCollection>();
export const useListItemsCollection = () => getListItemsCollection(useQueryClient());
`;

export const dbRouteSnippet = `
// routes/_authenticated/todos.tsx
export const Route = createFileRoute('/_authenticated/todos')({
+ ssr: false,                                       // collections live only in the browser
+ codeSplitGroupings: [['loader'], ['component']],  // keep TanStack DB out of the main bundle
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(notesQueryOptions()),
+     getListItemsCollection(queryClient).preload(), // start sync, wait for first rows
    ]),
  component: TodosPage,
});
`;

export const dbLiveQuerySnippet = `
// CheckedNoteCard.tsx: "SELECT * FROM items WHERE noteId = ? ORDER BY createdAt"
const listItems = useListItemsCollection();
const { data: items } = useLiveQuery(
  (q) =>
    q
      .from({ item: listItems })
      .where(({ item }) => eq(item.noteId, note.id))
      .orderBy(({ item }) => item.createdAt),
  [listItems, note.id],   // deps, like useMemo
);

// TodosPage.tsx: search reads the SAME rows, so a rename shows up here at once
const { data: allItems } = useLiveQuery((q) => q.from({ item: listItems }), [listItems]);
`;

export const dbMutateSnippet = `
// CheckedNoteItem.tsx: no useState, no useEffect, no isPending, no onError
const listItems = useListItemsCollection();

<input
  checked={item.checked}                     // already the optimistic value
  onChange={(event) => {
    const { checked } = event.currentTarget;
    listItems.update(item.id, (draft) => {   // Immer-style draft
      draft.checked = checked;
    });
  }}
/>

// Adding: the client makes the id, so the row exists before the server answers
const id = crypto.randomUUID();
listItems.insert({ checked: false, createdAt: new Date().toISOString(), id, name: 'New item', noteId });
setNewItemId(id);   // focus it right away
`;

export const dbErrorSnippet = `
// Throwing inside a handler = "roll this change back"
async function withErrorToast(title: string, requests: Promise<unknown>[]) {
  try {
    await Promise.all(requests);
  } catch (error) {
    toastManager.add({ priority: 'high', title, type: 'error' });
    throw error;   // do NOT swallow it, or the wrong value stays on screen
  }
}
`;

export const dbSideEffectSnippet = `
// notes.query.ts: a normal React Query mutation that changes list items on the server
export function useDeleteNoteMutation() {
  return useMutation({
    meta: { invalidateQueryKey: notesQueryKey },
    mutationFn: (variables: { id: string }) => deleteNote({ data: variables }),
+   // The server also deleted this note's items. Tell the collection to refetch.
+   onSuccess: (_data, _variables, _result, context) =>
+     getListItemsCollection(context.client).utils.refetch(),
  });
}
`;
