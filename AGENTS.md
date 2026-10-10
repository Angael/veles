# Rules
- This is a solo hobby app; prefer low-friction solutions
- Run `pnpm check:fix` before finishing
- Always use exact pinned package versions
- skip "computer use"/"browser smoke tests" checks and launching dev server.
- Display kcal as a distinct energy metric, never grouped on the same row with macros; group macros together in this order: protein, fat, carbs.
- Generated files are exempt and must not be hand-edited.
- Skip adding tests unless user tells you to write them

## Commands
- Fresh checkout or worktree: run `pnpm install --frozen-lockfile` first; `pnpm check:fix` fails without `node_modules`.
- Full gate: `pnpm check:fix` (format, lint, CSS lint, typecheck, tests).
- Single web test file: `pnpm --filter @veles/web test -- <path relative to apps/web>`. Vitest is not installed at the root, so root `pnpm exec vitest` fails.
- Typecheck one package: `pnpm --filter <@veles/web|@veles/worker|@veles/db|@veles/preview> typecheck`.

## CI/CD
- Avoid GitHub Actions and GitHub CI/CD for sensitive prod workflows; this repo is public
- Pushing to `main` makes Dokploy pull, install, and deploy to prod
- Never run Drizzle commands yourself; leave them to the human user
- DB migrations need to be run before pushing/merging to `main`

## Pull Requests
- Start each PR description with a `# TL;DR` section.
- When writing PRs, follow ASD-STE100 (Simplified Technical English) and keep it short.

## Database Scripts
- `pnpm db:seed` inserts only the shared food products into the development database at `DATABASE_URL`.
- `pnpm db:seed:prod` inserts only the shared food products into the production database at `PROD_DATABASE_URL`.
- `pnpm db:reset` rebuilds the development database and seeds the development user/account, calorie goal, food products, food logs and weights, recipes, and diary entries.

## Structure
- There is no root `src/`. Code lives in `apps/web/src`, `apps/worker/src`, `apps/preview/src`, and `packages/db/src`; paths in this section are repository-root-relative.
- `apps/web/src/routes` owns URLs, guards, loaders, and tiny adapters. Route implementation belongs in `apps/web/src/pages`.
- `apps/web/src/pages` owns product features. Small features flat; split large features by workflows.
- Keep feature-specific code beside the owning page or workflow. Features shouldn't import other feature's page components.
- `apps/web/src/components/ui` contains reusable controls and primitives. It must not import pages or feature APIs.
- `apps/web/src/components/app` contains only global application composition
- `apps/web/src/lib` contains shared client-safe utilities and capabilities. Prefer a descriptive flat file over a directory containing one file.
- `apps/web/src/server` contains shared server-only infrastructure, no page-specific stuff
- `apps/web/src/server/email` contains email templates
- `apps/web/src/styles` contains global styles, theme
- Dependencies flow `apps/web/src/routes -> apps/web/src/pages -> apps/web/src/components` and shared `apps/web/src/lib` capabilities.
- File conventions:
  - `.api.ts`: For server functions / api routes
  - `.query.ts`: For useMutation and queryOptions
  - `.server.ts`: Other server-only stuff
  - `.client.ts`: Client-only code
- No barrel files, DTO, re-export files

## Server Functions
- Feature callable server functions use `.middleware([logMiddleware('<name>')])`; session reads and framework-only handlers may omit it.
- If a server function accepts input, use `.validator(arkTypeValidator(...))` with `arktype` and `@tanstack/arktype-adapter`.

## Queries and Mutations
- Consumers use extracted hooks/options rather than duplicating pending state or invalidation wiring.
- For toast notifications after mutation, prefer `useMutation` `meta`.
- For simple static invalidation, prefer `meta.invalidateQueryKey`; use lifecycle callbacks for data-dependent or dynamic keys.

## Navigation
- Every "saved, now leave" navigation uses `replace: true`, so back never reopens a submitted form. Same for in-page view changes (week/day pickers) that shouldn't pile up history.
- Route chrome comes from `staticData`: `layout: 'task'` (sticky back + title, no primary nav), `layout: 'immersive'` (page renders `RouteBackButton` itself), or omitted (section root). Task/immersive routes need `navbar.backFallback`.
- Back goes through `RouteBackButton`: previous in-app history entry first, `navbar.backFallback` otherwise. Don't add ad-hoc Cancel/close links.
- Forms that take effort to fill in use `useUnsavedChangesGuard`; call `markSaved()` right before the post-save navigation.

## UI
- Prefer css modules, prefer syntax `import css from ...`
- In css modules, prefer nested selectors when it keeps related styles together.
- This app uses css reset and theme.css
- Shared responsive breakpoints live in `apps/web/src/styles/breakpoints.css`; use its custom media names instead of repeating raw width queries.
- Respect the css reset first: margins for text blocks, base font inheritance, and default line-height are already normalized there, so only restyle them when a component intentionally needs to diverge.
- Avoid decorative eyebrow/kicker UI text that only repeats context without adding clarity.
- Components should not have more than soft cap 200 lines of code, hard cap 300 lines. It's a code smell that file does too much.
- `apps/web/src/routes/**/*.tsx` files should stay small. They can contain up to soft cap ~200, hard cap 300 lines. Beyond that export the feature implementation from `apps/web/src/pages`.
- Keep demo route code outside reusable `apps/web/src/components`.
- For icons use `lucide-react`, always renaming imports with an `Icon` suffix to avoid naming conflicts.

## Agent MCP
- The MCP server (`apps/web/src/pages/agent`) must cover every user-facing feature: agents can read it, and modify it once its writes ship.
- When you add, rename, or change a feature or its data, update the MCP in the same change:
  - `apps/web/src/lib/agentAccess.ts`: add the feature, its label, and `writeAvailable`.
  - `mcp-resources.server.ts`: add or update its read resource and field description (units, scaling).
  - Write tools: add them beside `mcp-notes.server.ts`; wrap each in `runAgentTool(userId, feature, 'write', ...)` so live consent is checked per call.
- Every MCP query must filter by the key owner's `userId`. Shared data (e.g. food catalog) stays read-only unless the user says otherwise.

## TS
- Avoid `as any`, `as unknown`, and `as never`; if one is necessary, ask the user for approval.
- Medium to longer functions that contain logic should have a tl;dr short JSDoc that explains what they do and why they are needed.
- In browser use `TypedFormData` instead of reading `FormData` values.
