# Background Worker

## Overview

The background worker (`src/bg-worker/`) is a separate process that runs alongside the main TanStack Start app. It handles async tasks outside the request/response cycle — currently syncing file upload statuses with Cloudflare R2.

## Architecture

- **Main App**: HTTP requests, SSR, client interactions
- **Background Worker**: Scheduled jobs, async processing, no HTTP server
- **Dependency direction**: Worker imports app utilities (`src/db/`, `src/lib/`, `env.ts`). App must NOT import from `src/bg-worker/`.

```
src/bg-worker/
├── Dockerfile          # Worker-specific Docker build
├── index.ts            # Entry point, interval scheduler, graceful shutdown
└── jobs/
    └── sync-uploads.ts # Lists R2 files, queries PENDING uploads from DB
```

## Environment

The worker uses the shared `env.ts`. Since `import.meta.env` doesn't exist outside Vite, `env.ts` resolves client vars via a `clientEnv` fallback:
```ts
const clientEnv = import.meta.env ?? process.env
```
The worker doesn't need VITE_ vars, but this keeps `env.ts` importable from both contexts.

The worker script uses `--env-file-if-exists=.env` so it works with or without a `.env` file.

## Running

```bash
# Local development (two terminals)
pnpm dev       # Terminal 1: main app
pnpm worker    # Terminal 2: background worker

# Custom interval
WORKER_INTERVAL_MS=10000 pnpm worker
```

Default interval: 5000ms.

## Production

Runs as a separate Docker Compose service in `docker-compose.yml`:

```yaml
bg-worker:
  build:
    context: .
    dockerfile: src/bg-worker/Dockerfile
  environment:
    DATABASE_URL: ${DATABASE_URL}
    R2_ACCOUNT_ID: ${R2_ACCOUNT_ID}
    R2_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID}
    R2_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY}
    R2_BUCKET_NAME: ${R2_BUCKET_NAME}
    WORKER_INTERVAL_MS: ${WORKER_INTERVAL_MS:-5000}
```

## Adding Jobs

1. Create `src/bg-worker/jobs/my-job.ts` with an exported async function
2. Import and call it in `src/bg-worker/index.ts` inside `runWorker()`

## Current Job: sync-uploads

Every interval tick:
1. Lists objects in R2 bucket (max 100)
2. Queries DB for `file_upload` rows with status = `PENDING`
3. Logs which uploads exist or are missing in R2
