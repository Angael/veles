---
name: tanstack-routing-conventions
description: Use when creating, renaming, or reviewing TanStack Router/TanStack Start route files under src/routes, especially file naming, nesting, pathless layouts, dynamic params, and non-nested underscore routes.
---

# TanStack Routing Conventions

Use this skill before adding or renaming files in `src/routes`.

Source basis: TanStack Router file naming conventions at `https://raw.githubusercontent.com/tanstack/router/main/docs/router/routing/file-naming-conventions.md`.

## Core Rules

- `__root.tsx` is the root route and must live at the route directory root.
- `.` in filenames denotes route nesting, e.g. `posts.$postId.edit.tsx` nests `edit` under `$postId`.
- `$` denotes a dynamic path param, e.g. `$postId.tsx` creates `/posts/$postId` and exposes `params.postId`.
- `_` prefix creates a pathless layout route, e.g. `_app.tsx` wraps children without adding a URL segment.
- `_` suffix excludes a route segment from parent nesting while preserving the URL path.
- `-` prefix excludes files/folders from the route tree; use it for colocated route helpers.
- `(folder)` creates a route group folder that does not affect the URL path.
- `[x]` escapes routing special characters, e.g. `script[.]js.tsx` maps to `/script.js`.
- `index.tsx` matches the parent route exactly.
- `route.tsx` is the directory route file for a directory path, e.g. `account/route.tsx` maps to `/account`.

## Non-Nested Replacement Pages

Use the `_` suffix when a URL is conceptually under another route but should replace the parent UI instead of rendering inside the parent's `<Outlet />`.

Example:

```txt
src/routes/recipes/view.$id.tsx
src/routes/recipes/view.$id_.edit.tsx
```

This keeps the edit URL as:

```txt
/recipes/view/$id/edit
```

But prevents `edit` from nesting under `/recipes/view/$id` in the component tree.

Without the suffix:

```txt
src/routes/recipes/view.$id.edit.tsx
```

TanStack Router treats edit as a child of `view.$id`; the parent must render `<Outlet />` or the child will not appear.

## Route Metadata

For app shell concerns like labels, breadcrumbs, layout visibility, or app-level “up” navigation, prefer route-owned `staticData` over global route maps.

In this repo, use `appFrameChrome` from `src/lib/routing/appFrameChrome.ts` for AppFrame metadata.

## Before Creating A Route

- Decide whether the new UI should nest visually inside a parent route or replace it.
- If it replaces the parent UI, use the `_` suffix on the parent segment.
- Keep route files small; move route-specific UI into `src/pages` when the route grows.
- Put reusable, cross-route code in `src/lib` or `src/components` only when it is genuinely reusable.
- For route-specific server functions, place `.api.ts` files near usage and follow repo server-function middleware/validation rules.

## Common Patterns

```txt
src/routes/index.tsx                         -> /
src/routes/recipes/index.tsx                 -> /recipes
src/routes/recipes/add.tsx                   -> /recipes/add
src/routes/recipes/view.$id.tsx              -> /recipes/view/$id
src/routes/recipes/view.$id.edit.tsx         -> /recipes/view/$id/edit nested under view.$id
src/routes/recipes/view.$id_.edit.tsx        -> /recipes/view/$id/edit not nested under view.$id
src/routes/_authenticated.tsx                -> pathless authenticated layout
src/routes/_authenticated.account.tsx        -> /account wrapped by _authenticated
src/routes/(marketing)/about.tsx             -> /about with grouping only
src/routes/recipes/-helpers.ts               -> excluded helper file
```
