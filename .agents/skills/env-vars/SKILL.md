---
name: env-vars
description: Use when modyfing env files
---

# Environment Variables

Classify each variable before changing it. A `VITE_` prefix makes a value public and available to Vite code; it does not make the value available to the production build or server container automatically.

## Contexts and Access

### Client and shared SSR modules

- Access public build-time variables as `import.meta.env.VITE_*`.
- Treat every `VITE_*` value as public: Vite can compile it into browser assets.
- Declare its type in `apps/web/src/env.d.ts` under `ImportMetaEnv`.
- Code imported by routes may execute during SSR module loading. A missing build-time value must not cause module-scope initialization to throw.
- Do not access secrets through `import.meta.env` or give them a `VITE_` prefix.

### Web server

- Access application runtime configuration through `getServerEnv()` from `apps/web/src/server/env.server.ts`.
- Add or change validation in `serverEnvType`, expose the normalized field returned by its pipe, and update `apps/web/src/server/env.server.test.ts` when validation behavior changes.
- Declare raw Node environment types in `apps/web/src/env.d.ts` under `NodeJS.ProcessEnv`.
- Direct `process.env` access is reserved for bootstrap concerns such as `NODE_ENV`; feature code should use `getServerEnv()`.

### Worker

- Access worker runtime variables through `process.env` in `apps/worker`.
- Validate required values at the worker entry point before use.
- Supply them through the worker service's `environment` section in `compose.yaml`. They do not need web Docker build arguments.

### Database tooling and repository scripts

- Drizzle configs and Node scripts access variables through `process.env`.
- Check `packages/db/drizzle.config.ts`, `packages/db/drizzle-prod.config.ts`, and the relevant file under `packages/db/scripts` when changing database variables.
- Follow the repository rule: agents never run Drizzle commands.

## Required Change Review

For every added, removed, renamed, or behaviorally changed variable, inspect the applicable path end to end:

1. `.env.example` — document the variable, context, and safe example value. Never add secrets from `.env`.
2. `.env` — local source only; do not overwrite or commit user secrets.
3. `apps/web/src/env.d.ts` — keep client and Node declarations honest about optionality.
4. `apps/web/src/server/env.server.ts` and `env.server.test.ts` — web runtime validation and normalized access.
5. `apps/web/vite.config.ts` — root env loading; `envDir` feeds `import.meta.env`, while `loadEnv` is copied into the build process environment.
6. `apps/web/Dockerfile` — client build variables need builder-stage `ARG` and `ENV`; server-only secrets must not be build arguments.
7. `compose.yaml` — client build variables belong under `web.build.args`; web/worker runtime variables belong under the owning service's `environment`.
8. `apps/worker/Dockerfile` — check only when the variable affects the worker image itself rather than container runtime configuration.
9. Database configs and scripts — check when the variable is used by Drizzle or maintenance commands.
10. Every code access and test stub — migrate all callers on rename or removal; do not leave aliases.

## Production Build Invariant

A client variable needed in production must traverse the complete build-time chain:

`Dokploy/Compose value -> compose.yaml web.build.args -> apps/web/Dockerfile ARG -> builder ENV -> Vite import.meta.env`

Runtime `web.environment` is too late for values compiled by Vite. If the server also reads the same public variable at runtime, configure both the build argument and runtime environment explicitly.

## Verification

- Build the web app with the expected production environment, including the missing-value case when the variable is optional or has a default.
- For variables read by route modules, import or exercise the emitted SSR router/entry so module initialization is verified, not only compilation.
- Run `docker compose config --quiet` after changing Compose wiring.
- Run `pnpm check:fix` before finishing.
- Do not launch the dev server or perform browser/computer-use smoke tests.
