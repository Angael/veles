# Preview controller

`@veles/preview` is a standalone app in this pnpm workspace. It builds from `apps/preview/Dockerfile` and runs in its **own Dokploy application**, not the Veles `compose.yaml`. Node 26 executes `.ts` source directly with type stripping; no compiled JS or runtime TypeScript loader is needed.

- `pnpm --filter @veles/preview typecheck` checks the app; root `pnpm typecheck` includes it.
- `pnpm --filter @veles/preview start` runs it with the controller variables in the root `.env.example` supplied by the shell/Dokploy. Never commit credentials.
- Hono serves `POST /webhook` (signed GitHub App pull-request events) and `GET /health`. Webhooks and a five-minute timer reconcile live GitHub PRs with fixed Dokploy slots.
- SQLite at `PREVIEW_DB_PATH` (default `/data/preview.sqlite`) owns reservations; mount a persistent writable `/data` volume and run **one replica**. Dokploy builds PR branches; this app never runs database migrations or resets shared dev data.
- Controller logs each reconciliation's eligible count and final slot owners/waiting PRs. Slot transition logs identify the Dokploy action underway; failures keep their reservation and are retried on the next run.

`PREVIEW_SLOTS` is an ordered array of `{ "composeId": "...", "url": "..." }` entries; slot numbers are derived from array position. Idle slots are stopped with auto-deploy disabled and keep their last branch until reassigned. SQLite rejects reordering after a slot has been configured.

Reconciliation keeps exactly one `preview-n` label on each PR owning slot `n` and removes it when the reservation ends. Create the numbered labels in GitHub before enabling slots; the GitHub App needs **Issues: read/write** to update labels and its existing PR comment.

For the rationale and safety boundaries behind fixed preview slots, see [PR preview architecture](../../docs/2026-09-25-pr-previews.md).
