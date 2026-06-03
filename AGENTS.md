# Rules
- This is a solo hobby app; prefer low-friction solutions
- Run `pnpm check:fix` before finishing

## CI/CD
- Avoid GitHub Actions and GitHub CI/CD for sensitive prod workflows; this repo is public
- Pushing to `main` makes Dokploy pull, install, and deploy to prod
- Never run Drizzle commands yourself; leave them to the human user
- DB migrations need to be run before pushing/merging to `main`

## Structure
- Avoid barrel `index.ts` files; prefer importing the concrete file by full path.
- `src/components` is for reusable components only.
- `src/pages` is for route-specific components and their logic.
- `src/pages` components should accept mostly SSR-fetched data when data is needed.
- `src/lib` is for code reusable across the codebase.
- Server functions should live in `.api.ts` files near their usage.
- If a server function accepts input, use `inputValidator` with `arktype`.

## UI
- Prefer css modules to global css, prefer syntax `import css from ...`
- This app uses global reset.css and theme.css
- Components generally should not have more than ~250 lines of code. It's a code smell that file does too much.
- `src/routes/*.tsx` files should stay minimal. They can contain up to ~200 lines of JSX, but beyond that should always move into `src/pages`.
- Keep demo route code outside reusable `src/components`.
- Final UI needs to use emil-design-eng skill, it needs to give good user experience.
- for icons use `lucide-react` package, always rename imported icons so they have 'Icon' suffix to avoid naming conflicts