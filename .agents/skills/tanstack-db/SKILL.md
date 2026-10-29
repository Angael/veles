---
name: tanstack-db
description: Use when building or changing client data flows in apps/web that need instant (optimistic) writes, client-side live queries over shared rows, or offline-tolerant edits — CRUD lists, checklists, set logging — or when touching any `*.collection.ts` file, `useLiveQuery`, `DbClient`, or `@tanstack/react-db` / `@tanstack/query-db-collection` imports.
---

# TanStack DB in Veles

TanStack DB is a reactive in-browser store on top of TanStack Query. A **collection** holds typed rows keyed by id; **live queries** read them incrementally; `collection.insert/update/delete` apply optimistically, then call the collection's `onInsert/onUpdate/onDelete` handlers, which persist via server functions. A throwing handler rolls the change back.

Reference implementation: `apps/web/src/pages/todos/listItems.collection.ts` and its consumers (`CheckedNoteCard.tsx`, `TodosPage.tsx`, `notes.query.ts`, `routes/_authenticated/todos.tsx`). Copy its shape.

## When to use it

- Use it for small, frequently edited rows where waiting for a round trip feels slow (toggles, quick adds, reorder, rename), or when several components show the same rows.
- Keep plain React Query (`.query.ts`) for read-mostly pages, server-computed aggregates, and file uploads.

## Veles rules

- **SSR works.** `apps/web/src/router.tsx` creates one `DbClient({ queryClient })` per router (per request on the server, once in the browser) and wraps the router with `routerWithDbClient` from `@tanstack/react-router-with-db`. That adds `dbClient` to the router context, renders `DbProvider`, dehydrates collection rows on the server, and hydrates them in the browser. Do not add `ssr: false` for TanStack DB.
- **Descriptors, not instances.** Define collections with `collectionOptions('<id>', (client) => queryCollectionOptions({ ..., queryClient: client.requireDependency<QueryClient>('queryClient') }))` at module scope. Never call `createCollection` or keep module-level collection instances; they leak state between SSR requests.
- **Loaders:** `await context.dbClient.collection(xCollection).preload()`. On the server, the preloaded rows go into the HTML payload, so the first render has data.
- **Split the loader.** TanStack Router code-splits `component` but keeps `loader` in the main bundle. A loader that imports a `.collection.ts` file ships `@tanstack/query-db-collection` and the feature API to every page. Routes that preload a collection need `codeSplitGroupings: [['loader'], ['component']]`.
- **File:** `<feature>/<rows>.collection.ts` beside the owning page. It owns the descriptor, its handlers, and a `useXCollection()` hook: `useDbClient().collection<Row, string, QueryCollectionUtils<Row, string>>(xCollection)`. The explicit type arguments are necessary; without them the schema overload matches first and the rows are typed `never`.
- **Server stays the same.** Reads: a `GET` server function returning **flat rows** (no nesting; group/join in live queries). Writes: existing feature server functions with `logMiddleware` + arktype validators. Handlers call them; keep business rules and access checks on the server.
- **Refetch by hand.** Handlers return `Promise<void>` and do not refetch by themselves. They `await collection.utils.refetch()` before they return (see `persist` in `listItems.collection.ts`); otherwise the optimistic change reverts when the transaction settles.
- **Client-generated ids.** For optimistic inserts, generate UUIDv7 with `v7` from `uuid`, not `crypto.randomUUID()` (UUIDv4). Pass that same UUIDv7 to the create server function, validate it, and persist it unchanged as the database primary key. Keep the same id in the optimistic collection, backend insert, and refetched row; do not replace it with a second server-generated id or introduce temporary-id mapping. The database `uuidv7()` default remains a fallback for inserts that omit the id. The server must still enforce access checks and primary-key uniqueness; an id conflict must not overwrite another row. Keep authoritative timestamps server-generated, rather than trusting the client UUID's timestamp.
- **Errors:** a failed handler shows one toast and then rethrows; rethrowing triggers the rollback.
- **Components:** read with `useLiveQuery({ query: (q) => q.from({ row: xCollection }).where(...).orderBy(...) })`, using the descriptor in `from`. Do not pass a dependency array; the query identity comes from the query itself (add `queryKey` only for `.fn.*` queries). Write with `useXCollection().update(id, (draft) => { ... })`. Do not mirror rows into `useState`, add `isPending` guards, or write manual rollbacks.
- **Server-side side effects:** when a React Query mutation changes the collection's rows on the server (cascade delete, type conversion), take `useXCollection()` in the mutation hook and call `collection.utils.refetch()` in `onSuccess`.
- **Freshness:** shared data uses the same `refetchInterval` / `refetchOnWindowFocus` / `staleTime` as other shared queries.

## API details

Upgrade `@tanstack/db`, `@tanstack/react-db`, `@tanstack/react-router-with-db`, and `@tanstack/query-db-collection` together. `@tanstack/db` is a direct dependency because `@tanstack/query-db-collection` takes it as a peer; keep it on the same version as `@tanstack/react-db`. Do not rely on memory. Read the official docs for the installed version first:

- SSR and `DbClient`: https://github.com/TanStack/db/blob/main/docs/guides/ssr.md
- Query collection: https://github.com/TanStack/db/blob/main/docs/collections/query-collection.md
- Live queries: https://github.com/TanStack/db/blob/main/docs/guides/live-queries.md

The npm packages also ship guides:

```sh
find node_modules/.pnpm -path '*@tanstack/*/skills/*' -name '*.md' | grep -E '/(db|react-db|query-db-collection)/'
```

They can be out of date. For example, `meta-framework/SKILL.md` says SSR is not supported, but the docs and the installed packages support it. When they disagree, the docs win.

Useful: `db-core/live-queries` (operators, joins, aggregates), `db-core/mutations-optimistic` (transactions, `createOptimisticAction`), `db-core/collection-setup/references/query-adapter.md` (handlers, `utils.refetch`, `writeInsert`), `db-core/persistence` (offline / `@tanstack/offline-transactions`).
