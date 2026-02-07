# AGENTS.md

This file provides guidance to Codex agents working in this repository.

## Project Overview

Veles is a full-stack TypeScript application built with TanStack Start (React meta-framework), using TanStack Router for file-based routing, TanStack Query for data fetching, Drizzle ORM with PostgreSQL, and styled with Tailwind CSS v4.

## Common Commands

```bash
# Development
pnpm dev              # Start dev server on port 3000
pnpm worker           # Start background worker (separate process)

# Docker (Local Development)
pnpm compose:dev      # Start database only (with sudo)
# Or manually:
sudo docker compose -f docker-compose.dev.yml up -d

# Production
pnpm build            # Build for production
pnpm start            # Run production build

# Testing
pnpm test             # Run tests with Vitest

# Linting & Formatting (Biome)
pnpm lint             # Lint code
pnpm format           # Format code
pnpm check            # Run both lint and format checks

# Database (Drizzle)
pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Run migrations (local dev)
pnpm db:migrate:prod  # Run migrations (production, uses drizzle-prod.config.ts)
pnpm db:push          # Push schema directly (dev only)
pnpm db:studio        # Open Drizzle Studio GUI (local dev)
pnpm db:studio:prod   # Open Drizzle Studio GUI (production)
```

## Architecture

### Docker Setup

- `docker-compose.yml`: Production config (used by Dokploy) - exposes ports internally only
  - `app` service: Main TanStack Start application
  - `bg-worker` service: Background worker for async jobs
- `docker-compose.dev.yml`: Dev database setup for local development
- For local development: Use `pnpm compose:dev` or run docker compose with sudo
- Database credentials are hardcoded in `docker-compose.dev.yml` (postgres/postgres/veles_dev)

### Background Worker

- Location: `src/bg-worker/` directory with its own Dockerfile
- Purpose: Handles async tasks (file processing, scheduled jobs) separate from HTTP requests
- Dependency Direction: Worker can use app utilities (DB, R2 client, etc.), but app CANNOT import worker code
- Running Locally: `pnpm worker` (separate from `pnpm dev`)
- Production: Runs as separate Docker service alongside main app
- Configuration: `WORKER_INTERVAL_MS` env var (default: 5000ms)
- Documentation: See `.docs/4-background-worker.md` for details

### Routing (TanStack Start)

- File-based routing: Routes are in `src/routes/` and auto-generate `src/routeTree.gen.ts`
- API routes: Files named `api.*.ts` create API endpoints
- Root layout: `src/routes/__root.tsx` provides the app shell with header and devtools

#### Route Structure Rule

Use directories for routes with siblings/children. Avoid dot notation:

```
src/routes/
  media/
    index.tsx      → /media
    $id.tsx        → /media/:id
```

### Data Layer

- TanStack Query: Provider in `src/integrations/tanstack-query/`, integrated with SSR via `@tanstack/react-router-ssr-query`
- Drizzle ORM: Schema in `src/db/schema.ts`, connection in `src/db/index.ts`

### Environment Variables

- Application: Defined and validated with T3 Env in `env.ts`
  - Server vars: `DATABASE_URL` (required for local dev), `SERVER_URL` (optional)
  - Client vars must be prefixed with `VITE_`
- Local Development:
  - `DATABASE_URL` in `.env` or `.env.local` (for app and migrations)
  - Database credentials hardcoded in `docker-compose.dev.yml`
- Production Migrations:
  - `PROD_DATABASE_URL` in `.env.prod` (committed to repo)
  - Used by `drizzle-prod.config.ts` for `:prod` scripts
- Production App:
  - Environment variables managed in Dokploy UI
  - Dokploy sets `DATABASE_URL` for the running app
- Sync Checklist: When adding/modifying environment variables, update all three:
  1. `env.ts` - validation schema and runtimeEnv
  2. `Dockerfile` - ARG/ENV for build-time vars (VITE_*)
  3. `docker-compose.yml` - build args (VITE_*) and environment (runtime vars)

## Code Style

- Uses Biome for linting/formatting
- Indent style: tabs
- Quote style: double quotes
- Path alias: `@/*` maps to `./src/*`

### TypeScript Editing Practices

- Write only non-obvious comments, or function jsdoc comments (avoid redundant type info)
- Follow existing codebase patterns and conventions
- Use `@/*` imports for `src/`
- TanStack Query: `useMutation` for mutations (POST/PUT/DELETE), `useQuery` for client fetching
- After TypeScript changes, prefer running `pnpm fix` to apply Biome fixes and check TS errors

## Design System

Theme: Dark theme only (no light mode)

Color palette (Tailwind):

- Background:
  - Primary: `zinc-950`
  - Secondary: `zinc-900`
- Primary (Violet):
  - Main: `violet-600`
  - Hover: `violet-700`
  - Light: `violet-400`
  - Border: `violet-900/20`
- Accent (Fuchsia):
  - Main: `fuchsia-600`
  - Used for: Private indicators, special status
- Text:
  - Primary: `white`
  - Secondary: `gray-300`
  - Tertiary: `gray-400`
- Interactive States:
  - Hover backgrounds: `violet-900/20`
  - Focus rings: `ring-violet-500`
  - Overlays: `bg-black bg-opacity-60`

Usage guidelines:

- Use violet for primary actions and active states
- Use fuchsia sparingly for accents and special indicators
- Maintain consistent border styling with `border-violet-900/20`
- Avoid gradients (solid colors only)

## Docs

Big features require documentation/planning.
Docs are in `.docs/` as markdown files, named by feature, prefixed with a number for ordering.
When working on a feature, check for an existing doc to follow.
