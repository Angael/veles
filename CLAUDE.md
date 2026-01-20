# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Veles is a full-stack TypeScript application built with TanStack Start (React meta-framework), using TanStack Router for file-based routing, TanStack Query for data fetching, Drizzle ORM with PostgreSQL, and styled with Tailwind CSS v4.

## Common Commands

```bash
# Development
pnpm dev              # Start dev server on port 3000

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
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly (dev only)
pnpm db:studio        # Open Drizzle Studio GUI
```

## Architecture

### Routing
- **File-based routing**: Routes are in `src/routes/` and auto-generate `src/routeTree.gen.ts`
- **API routes**: Files named `api.*.ts` create API endpoints (e.g., `src/routes/demo/api.names.ts` → `/demo/api/names`)
- **Root layout**: `src/routes/__root.tsx` provides the app shell with header and devtools

### Data Layer
- **TanStack Query**: Provider in `src/integrations/tanstack-query/`, integrated with SSR via `@tanstack/react-router-ssr-query`
- **Drizzle ORM**: Schema in `src/db/schema.ts`, connection in `src/db/index.ts`

### Environment Variables
- Defined and validated with T3 Env in `env.ts`
- Server vars: `DATABASE_URL` (required), `SERVER_URL` (optional)
- Client vars must be prefixed with `VITE_`

### Code Style
- Uses Biome for linting/formatting
- Indent style: tabs
- Quote style: double quotes
- Path alias: `@/*` maps to `./src/*`
