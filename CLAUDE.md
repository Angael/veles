# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Veles is a full-stack TypeScript application built with TanStack Start (React meta-framework), using TanStack Router for file-based routing, TanStack Query for data fetching, Drizzle ORM with PostgreSQL, and styled with Tailwind CSS v4.

## Common Commands

```bash
# Development
pnpm dev              # Start dev server on port 3000

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
- **`docker-compose.yml`**: Production config (used by Dokploy) - exposes ports internally only
- **`docker-compose.dev.yml`**: Dev database setup for local development
- For local development: Use `pnpm compose:dev` or run docker compose with sudo
- Database credentials are hardcoded in `docker-compose.dev.yml` (postgres/postgres/veles_dev)

### Routing
- **File-based routing**: Routes are in `src/routes/` and auto-generate `src/routeTree.gen.ts`
- **API routes**: Files named `api.*.ts` create API endpoints (e.g., `src/routes/demo/api.names.ts` → `/demo/api/names`)
- **Root layout**: `src/routes/__root.tsx` provides the app shell with header and devtools

### Data Layer
- **TanStack Query**: Provider in `src/integrations/tanstack-query/`, integrated with SSR via `@tanstack/react-router-ssr-query`
- **Drizzle ORM**: Schema in `src/db/schema.ts`, connection in `src/db/index.ts`

### Authentication
Google OAuth only, using Arctic library for OAuth flow.

**Files**:
- `src/lib/auth/` - Auth module (session, user, google, middleware)
- `src/routes/login/` - Login page and OAuth routes
- `src/routes/logout.tsx` - Logout handler

**Flow**: `/login` → `/login/google` (redirect to Google) → `/login/google/callback` (handle response, create session)

**Database**: `user` table stores `googleId`, `email`, `name`, `picture`; `user_session` table stores sessions with 30-day expiry

**Usage**:
```typescript
// Protect a route
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/protected')({
  beforeLoad: async () => {
    await requireAuth(); // Redirects to /login if not authenticated
  },
});

// Access user in root context
const { user } = Route.useRouteContext(); // Available in all routes via __root.tsx
```

**Env vars**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (server-side)

### Environment Variables
- **Application**: Defined and validated with T3 Env in `env.ts`
  - Server vars: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (required), `SERVER_URL` (optional)
  - Client vars must be prefixed with `VITE_`
- **Local Development**:
  - `DATABASE_URL` in `.env` or `.env.local` (for app and migrations)
  - Database credentials hardcoded in `docker-compose.dev.yml`
- **Production Migrations**:
  - `PROD_DATABASE_URL` in `.env.prod` (committed to repo)
  - Used by `drizzle-prod.config.ts` for `:prod` scripts
- **Production App**:
  - Environment variables managed in Dokploy UI
  - Dokploy sets `DATABASE_URL` for the running app

### Code Style
- Uses Biome for linting/formatting
- Indent style: tabs
- Quote style: double quotes
- Path alias: `@/*` maps to `./src/*`

### Design System

**Theme**: Dark theme only (no light mode)

**Color Palette** (Tailwind colors):
- **Background**:
  - Primary: `zinc-950` (main background)
  - Secondary: `zinc-900` (cards, panels)
- **Primary (Violet)**:
  - Main: `violet-600` (buttons, active states)
  - Hover: `violet-700`
  - Light: `violet-400` (headings, links)
  - Border: `violet-900/20` (subtle borders)
- **Accent (Fuchsia)**:
  - Main: `fuchsia-600` (badges, highlights)
  - Used for: Private indicators, special status
- **Text**:
  - Primary: `white` (headings, important text)
  - Secondary: `gray-300` (body text)
  - Tertiary: `gray-400` (muted text, descriptions)
- **Interactive States**:
  - Hover backgrounds: `violet-900/20`
  - Focus rings: `ring-violet-500`
  - Overlays: `bg-black bg-opacity-60`

**Usage Guidelines**:
- Use violet for primary actions and active states
- Use fuchsia sparingly for accents and special indicators
- Maintain consistent border styling with `border-violet-900/20`
- Avoid gradients (solid colors only)

### Tailwind & shadcn Guidance
User is learning Tailwind and shadcn. When you see inefficient patterns or verbose solutions:
- Proactively suggest better Tailwind utilities and patterns
- Recommend shadcn components when applicable
- Teach reusable approaches, not just fixes
