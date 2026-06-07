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

# Server Functions
- they should live in `.api.ts` files near their usage.
- they should always use log middleware: `.middleware([logMiddleware('<name>')])`
- If it accepts input, use `inputValidator` with `arktype` and `@tanstack/arktype-adapter`.

# API Routes
- If an API route accepts input, validate the parsed input with `arktype` before using it.

## UI
- Prefer css modules to global css, prefer syntax `import css from ...`
- In css modules, prefer nested selectors when it keeps related styles together.
- This app uses css reset and theme.css
- Shared responsive breakpoints live in `src/styles/breakpoints.css`; use its custom media names instead of repeating raw width queries.
- Respect the css reset first: margins for text blocks, base font inheritance, and default line-height are already normalized there, so only restyle them when a component intentionally needs to diverge.
- Avoid decorative eyebrow/kicker UI text that only repeats context without adding clarity.
- Components should not have more than soft cap 200 lines of code, hard cap 300 lines. It's a code smell that file does too much.
- `src/routes/*.tsx` files should stay small. They can contain up to soft cap ~200, hard cap 300 lines. Beyond that start exporting/importing from `src/pages`.
- Keep demo route code outside reusable `src/components`.
- Final UI needs to use emil-design-eng skill, it needs to give good user experience.
- for icons use `lucide-react` package, always rename imported icons so they have 'Icon' suffix to avoid naming conflicts

## TS
- avoid `as any` `as unknown` `as never`, if you find yourself needing to use them - ask user for approval
