# Rules
- This is a solo hobby app; prefer low-friction solutions
- Run `pnpm check:fix` before finishing
- Always use exact pinned package versions
- skip "computer use"/"browser smoke tests" checks and launching dev server.
- Correct order for macros is always: 1. kcal 2. protein 3. fat 4. carbs.
- Generated files are exempt and must not be hand-edited.
- Skip adding tests unless user tells you to write them

## CI/CD
- Avoid GitHub Actions and GitHub CI/CD for sensitive prod workflows; this repo is public
- Pushing to `main` makes Dokploy pull, install, and deploy to prod
- Never run Drizzle commands yourself; leave them to the human user
- DB migrations need to be run before pushing/merging to `main`

## Structure
- `src/routes` owns URLs, guards, loaders, and tiny adapters. Route implementation belongs in `src/pages`.
- `src/pages` owns product features. Small features flat; split large features by workflows.
- Keep feature-specific code beside the owning page or workflow. Features shouldn't import other feature's page components.
- `src/components/ui` contains reusable controls and primitives. It must not import pages or feature APIs.
- `src/components/app` contains only global application composition
- `src/lib` contains shared client-safe utilities and capabilities. Prefer a descriptive flat file over a directory containing one file.
- `src/server` contains shared server-only infrastructure, no page-specific stuff
- `src/styles` contains global styles, theme
- Dependencies flow `routes -> pages -> shared components/lib`
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

## UI
- Prefer css modules, prefer syntax `import css from ...`
- In css modules, prefer nested selectors when it keeps related styles together.
- This app uses css reset and theme.css
- Shared responsive breakpoints live in `src/styles/breakpoints.css`; use its custom media names instead of repeating raw width queries.
- Respect the css reset first: margins for text blocks, base font inheritance, and default line-height are already normalized there, so only restyle them when a component intentionally needs to diverge.
- Avoid decorative eyebrow/kicker UI text that only repeats context without adding clarity.
- Components should not have more than soft cap 200 lines of code, hard cap 300 lines. It's a code smell that file does too much.
- `src/routes/**/*.tsx` files should stay small. They can contain up to soft cap ~200, hard cap 300 lines. Beyond that export the feature implementation from `src/pages`.
- Keep demo route code outside reusable `src/components`.
- For icons use `lucide-react`, always renaming imports with an `Icon` suffix to avoid naming conflicts.

## TS
- Avoid `as any`, `as unknown`, and `as never`; if one is necessary, ask the user for approval.
- Medium to longer functions that contain logic should have a tl;dr short JSDoc that explains what they do and why they are needed.
- In browser use `TypedFormData` instead of reading `FormData` values.
