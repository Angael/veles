## Veles

Veles is a pnpm monorepo with two deployable applications and one shared database package:

- `apps/web` — the TanStack Start application.
- `apps/worker` — a background worker. Its placeholder job currently checks PostgreSQL every ten seconds.
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

The Notes page stores private text notes and checklists. Titles, note bodies, and checklist item names are edited in place and saved when the field loses focus; checklist items can also be checked off. Items are plain text, without quantity or unit fields. Sharing is not available.

If an existing development database contains shopping lists with `NULL` content, backfill them with `UPDATE note SET content = '' WHERE content IS NULL;` before running `pnpm db:push`; a column default does not fill existing rows.

Before deploying the notes schema, generate and review its migration with `pnpm db:generate -- --name=add-notes-shopping-lists`, then apply the migration before merging into `main`.

### Compose

```bash
docker compose up --build
```

Compose starts three independently logged and restarted services:

- `nginx` is the only published service (port 3000 by default). It enforces the upload-size ceiling, buffers accepted request bodies, and forwards proxy metadata.
- `web` runs TanStack Start and exposes an internal health endpoint.
- `worker` runs independently and receives only its database configuration.

Set `NGINX_PORT` to publish a different local port. In production, Dokploy can route to the nginx service while nginx reaches web over the private Compose network.

Authentication and application-aware rate limiting remain Better Auth's responsibility. Nginx preserves `X-Forwarded-*` metadata from Dokploy and appends its own forwarding hop; it does not attempt to duplicate authentication policy.
