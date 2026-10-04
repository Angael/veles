## Veles

Veles is a pnpm monorepo with three deployable applications and one shared database package:

- `apps/web` — the TanStack Start application.
- `apps/worker` — a background worker. It checks PostgreSQL and cleans up unreferenced upload objects in independent loops every ten seconds.
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

### Compose

The web and worker Dockerfiles install the root shared dependencies and their own workspace dependency trees (including `packages/db`); the preview controller has a separate filtered image build. A root `pnpm install` still installs the whole workspace.

```bash
docker compose up --build
```

Compose starts three independently logged and restarted services:

- `nginx` is the only published service (port 3000 by default). It enforces the upload-size ceiling, buffers accepted request bodies, and forwards proxy metadata.
- `web` runs TanStack Start and exposes an internal health endpoint.
- `worker` runs independently and receives database configuration and R2 credentials. Cleanup sweeps every 6 hours, draining full batches back-to-back until the backlog is empty. It deletes each unreferenced R2 object using the bucket and key stored in `upload_object`, then deletes its database row. Food products, historical food logs, and recipe images all prevent deletion. Failed deletions are logged and retried in the next sweep.

Set `NGINX_PORT` to publish a different local port. In production, Dokploy can route to the nginx service while nginx reaches web over the private Compose network.

Authentication and application-aware rate limiting remain Better Auth's responsibility. Nginx preserves `X-Forwarded-*` metadata from Dokploy and appends its own forwarding hop; it does not attempt to duplicate authentication policy.
