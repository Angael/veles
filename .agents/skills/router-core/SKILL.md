---
name: router-core
description: >-
  TanStack Router core: route trees, createRouter/createRoute, file naming, route matching.
  Entry point for router work; references cover search/path params, navigation, loaders,
  code splitting, not-found/errors, type safety, and SSR.
type: core
library: tanstack-router
library_version: '1.166.2'
---

# TanStack Router Core

TanStack Router is a type-safe router for React and Solid with built-in SWR caching, JSON-first search params, file-based route generation, and end-to-end type inference. The core is framework-agnostic; React and Solid bindings layer on top.

> **CRITICAL**: TanStack Router types are FULLY INFERRED. Never cast, never annotate inferred values. This is the #1 AI agent mistake.

> **CRITICAL**: TanStack Router is CLIENT-FIRST. Loaders run on the client by default, NOT server-only like Remix/Next.js. Do not confuse TanStack Router APIs with Next.js or React Router.

## References

Read the matching file before working in that area:

- `skill://router-core/references/search-params.md` — validateSearch, reading/writing/transforming search params (patterns: `references/search-params-validation-patterns.md`)
- `skill://router-core/references/path-params.md` — dynamic segments, splats, optional params
- `skill://router-core/references/navigation.md` — Link, useNavigate, preloading, navigation blocking
- `skill://router-core/references/data-loading.md` — loaders, loaderDeps, SWR caching, deferred data
- `skill://router-core/references/code-splitting.md` — automatic/manual code splitting, `.lazy.tsx`
- `skill://router-core/references/not-found-and-errors.md` — notFound(), notFoundComponent, error boundaries
- `skill://router-core/references/type-safety.md` — inference, Register, `from` narrowing, TS perf
- `skill://router-core/references/ssr.md` — streaming/non-streaming SSR, hydration, head management

Separate skills: `router-core-auth-and-guards` (route protection), `compositions-router-query` (TanStack Query as loader cache), `react-router` (React bindings).

## Minimal Working Example

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <Outlet />,
})
```

```tsx
// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <h1>Home</h1>,
})
```

```tsx
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

// REQUIRED for type safety — without this, Link/useNavigate have no autocomplete
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default router
```

```tsx
// src/main.tsx
import { RouterProvider } from '@tanstack/react-router'
import router from './router'

function App() {
  return <RouterProvider router={router} />
}
```

## Common Mistakes

### HIGH: createFileRoute path string must match the file path

The Vite plugin manages the path string in `createFileRoute`. Do not change it manually — it must match the file's location under `src/routes/`:

```tsx
// File: src/routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  // ✅ matches file path
  component: PostPage,
})

export const Route = createFileRoute('/post/$postId')({
  // ❌ silent mismatch
  component: PostPage,
})
```

The plugin auto-generates this string. If you rename a route file, the plugin updates it. Never edit the path string by hand.

## Version Note

This skill targets `@tanstack/router-core` v1.166.2 and `@tanstack/react-router` v1.166.2. APIs are stable. Splat routes use `$` (not `*`); the `*` compat alias will be removed in v2.
