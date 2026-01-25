# TanStack Start Routing

## Route Structure

### ❌ WRONG: Flat files
```
src/routes/
  media.tsx
  media.$id.tsx
  media.index.tsx
```
Creates parent-child relationship. Requires `<Outlet />`. Causes routing issues.

### ✅ CORRECT: Directory structure
```
src/routes/
  media/
    index.tsx      → /media
    $id.tsx        → /media/:id
```
Independent routes. No outlet needed. Works as expected.

## Patterns

- `folder/index.tsx` → `/folder` (default route)
- `folder/$id.tsx` → `/folder/:id` (dynamic param)
- `folder/route.tsx` → Layout with `<Outlet />` (only if shared layout needed)

## Rule
Use directories for routes with siblings/children. Avoid dot notation (`media.index.tsx`).
