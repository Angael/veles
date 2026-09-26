# Preview controller

`@veles/preview` is a standalone app in this pnpm workspace. It builds from `apps/preview/Dockerfile` and runs in its **own Dokploy application**, not the Veles `compose.yaml`. Node 26 executes `.ts` source directly with type stripping; no compiled JS or runtime TypeScript loader is needed.

- `pnpm --filter @veles/preview typecheck` checks the app; root `pnpm typecheck` includes it.
- `pnpm --filter @veles/preview start` runs it with the controller variables in the root `.env.example` supplied by the shell/Dokploy. Never commit credentials.
- Hono serves `POST /webhook` (signed GitHub App pull-request events) and `GET /health`. Webhooks and a five-minute timer reconcile live GitHub PRs with fixed Dokploy slots.
- SQLite at `PREVIEW_DB_PATH` (default `/data/preview.sqlite`) owns reservations; mount a persistent writable `/data` volume and run **one replica**. Dokploy builds PR branches; this app never runs database migrations or resets shared dev data.

For slot configuration, OAuth domains, takeover, and the live rollout checklist, see [PR previews](../../docs/2026-09-25-pr-previews.md).
