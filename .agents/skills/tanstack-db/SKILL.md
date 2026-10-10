---
name: tanstack-db
description: Use when building or changing client data flows in apps/web that need instant (optimistic) writes, client-side live queries over shared rows, or offline-tolerant edits — CRUD lists, checklists, set logging — or when touching any `*.collection.ts` file, `useLiveQuery`, or `@tanstack/react-db` / `@tanstack/query-db-collection` imports.
---

# TanStack DB in Veles

TanStack DB is a reactive in-browser store on top of TanStack Query. A **collection** holds typed rows keyed by id; **live queries** read them incrementally; `collection.insert/update/delete` apply optimistically, then call the collection's `onInsert/onUpdate/onDelete` handlers, which persist via server functions. A throwing handler rolls the change back. A successful one refetches the collection.

Reference implementation: `apps/web/src/pages/todos/listItems.collection.ts` and its consumers (`CheckedNoteCard.tsx`, `TodosPage.tsx`, `routes/_authenticated/todos.tsx`). Copy its shape. A guided walkthrough with a React Query vs TanStack DB playground lives at `/demo/tanstack-db` (`apps/web/src/pages/tanstack-db-demo`).

## When to use it

- Use it for small, frequently edited rows where waiting for a round trip feels slow (toggles, quick adds, reorder, rename), or when several components show the same rows.
- Keep plain React Query (`.query.ts`) for read-mostly pages, server-computed aggregates, file uploads, and pages that must SSR.

## Veles rules

- **Client-only.** Collections do not support SSR. The route needs `ssr: false`, and its loader must `await getXCollection(queryClient).preload()` so the first render has data.
- **Split the loader.** TanStack Router code-splits `component` but keeps `loader` in the main bundle, so a loader that imports a collection ships TanStack DB (~97 kB gzip) to every page. Routes that preload a collection need `codeSplitGroupings: [['loader'], ['component']]`.
- **Auto refetch is deprecated.** Query collection handlers still refetch after they resolve, but this goes away in v1.0. When you upgrade, `await collection.utils.refetch()` in the handler and return `{ refetch: false }`.
- **One collection per QueryClient.** Never `createCollection` at module scope or in render. Use a `WeakMap<QueryClient, Collection>` getter plus a `useXCollection()` hook (`useQueryClient()`), as in `listItems.collection.ts`.
- **File:** `<feature>/<rows>.collection.ts` beside the owning page. It owns the `queryCollectionOptions` config and handlers.
- **Server stays the same.** Reads: a `GET` server function returning **flat rows** (no nesting; group/join in live queries). Writes: existing feature server functions with `logMiddleware` + arktype validators. Handlers call them; keep business rules and access checks on the server.
- **Client-generated ids.** Inserts use `crypto.randomUUID()` and the create server function accepts `id: 'string.uuid'`, so new rows exist (and can be focused/navigated to) before the server answers.
- **Errors:** wrap handler calls so a failure shows one toast and then rethrows (see `withErrorToast`); rethrowing triggers the rollback.
- **Components:** read with `useLiveQuery((q) => q.from({ row: collection }).where(...).orderBy(...), [collection, ...deps])`; write with `collection.update(id, (draft) => { ... })`. Do not mirror rows into `useState`, add `isPending` guards, or write manual rollbacks.
- **Server-side side effects:** when a React Query mutation changes the collection's rows on the server (cascade delete, type conversion), call `getXCollection(context.client).utils.refetch()` in its `onSuccess`.
- **Freshness:** shared data uses the same `refetchInterval` / `refetchOnWindowFocus` / `staleTime` as other shared queries.

## API details

The API is pre-1.0 and changes between minors; do not rely on memory. The installed version ships its own guides. Read the relevant one before writing code:

```sh
find node_modules/.pnpm -path '*@tanstack/*/skills/*' -name '*.md' | grep -E '/(db|react-db|query-db-collection)/'
```

Useful: `db-core/live-queries` (operators, joins, aggregates), `db-core/mutations-optimistic` (transactions, `createOptimisticAction`), `db-core/collection-setup/references/query-adapter.md` (handlers, `utils.refetch`, `writeInsert`), `meta-framework` (Start loaders), `db-core/persistence` (offline / `@tanstack/offline-transactions`).
