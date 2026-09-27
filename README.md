## Veles

Veles is a pnpm monorepo with three deployable applications and one shared database package:

- `apps/web` — the TanStack Start application.
- `apps/worker` — a background worker. Its placeholder job currently checks PostgreSQL every ten seconds.
- `apps/preview` — the standalone PR preview controller.
- `packages/db` — the shared Drizzle client, schema, migrations, and migration tooling.
- `infra/nginx` — the small reverse-proxy image used by Compose.

### Develop

```bash
pnpm install
cp .env.example .env

# Run these in separate terminals.
pnpm dev:web
pnpm dev:worker
```

Local configuration has one source of truth: the repository-root `.env`. Vite is
configured to load it for the web app, while the worker requires it through
Node's env-file loader, and the Drizzle config loads it for database commands.
Compose also uses the same file for variable interpolation; workspace directories do
not need their own copies.

Run repository-wide checks with:

```bash
pnpm check
pnpm check:fix
```

Database commands remain available from the repository root. Migrations are an explicit deployment step and are never run by the web or worker containers.

```bash
pnpm db:push
pnpm db:generate -- --name=<migration-name>
pnpm db:migrate:prod
```

### Notes

The Notes page stores text notes and checklists in creation order. Search matches note titles, bodies, and checklist item names; the ownership filter shows all accessible notes or only your own. Titles, note bodies, and checklist item names are edited in place and saved when the field loses focus. The icon beside each title converts between a text note and a checklist: each nonempty line becomes an unchecked item, and checklist items become plain text lines without their checked state. The plus button adds an editable checklist item. Every checklist item owned by you has a delete button; pressing Backspace or Delete in any empty checklist item also removes it. Items are plain text, without quantity or unit fields. Owners can delete a note after browser confirmation or toggle sharing with their connected friends. Friends see shared notes read-only; turning sharing off removes their access.

If an existing development database contains shopping lists with `NULL` content, backfill them with `UPDATE note SET content = '' WHERE content IS NULL;` before running `pnpm db:push`; a column default does not fill existing rows.

Before deploying the notes schema, generate and review its migration with `pnpm db:generate -- --name=add-notes-shopping-lists`, then apply the migration before merging into `main`.

### Compose

The web and worker Dockerfiles install only their own workspace dependency trees (including `packages/db`); the preview controller has a separate filtered image build. A root `pnpm install` still installs the whole workspace.

```bash
docker compose up --build
```

Compose starts three independently logged and restarted services:

- `nginx` is the only published service (port 3000 by default). It enforces the upload-size ceiling, buffers accepted request bodies, and forwards proxy metadata.
- `web` runs TanStack Start and exposes an internal health endpoint.
- `worker` runs independently and receives only its database configuration.

Set `NGINX_PORT` to publish a different local port. In production, Dokploy can route to the nginx service while nginx reaches web over the private Compose network.

Authentication and application-aware rate limiting remain Better Auth's responsibility. Nginx preserves `X-Forwarded-*` metadata from Dokploy and appends its own forwarding hop; it does not attempt to duplicate authentication policy.
