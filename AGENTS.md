# Rules
- This is a solo hobby app; prefer low-friction solutions
- Run `pnpm check:fix` before finishing

## CI/CD
- Avoid GitHub Actions and GitHub CI/CD for sensitive prod workflows; this repo is public
- Pushing to `main` makes Dokploy pull, install, and deploy to prod
- Never run Drizzle commands yourself; leave them to the human user
- DB migrations need to be run before pushing/merging to `main`

 ## UI
 - Prefer css modules to global css, prefer syntax `import css from ...`
 - This app uses global reset.css and theme.css
 - Components generally should not have more than ~250 lines of code. It's a code smell that file does too much.
- `src/routes/*.tsx` files should stay minimal and preferably import their full UI from `src/components`.
 - Final UI needs to use emil-design-eng skill, it needs to give good user experience.
