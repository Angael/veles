# Background Worker Architecture

## Overview

The background worker (`src/bg-worker/`) is a separate process that runs alongside the main TanStack Start application. It handles asynchronous tasks that don't belong in the request/response cycle, such as:

- Syncing file upload statuses with Cloudflare R2
- Processing uploaded files
- Scheduled maintenance tasks
- Any long-running background jobs

## Architecture Principles

### Separation of Concerns
- **Main App**: Handles HTTP requests, SSR, client interactions
- **Background Worker**: Handles scheduled jobs, async processing, no HTTP server

### Dependency Direction
- ✅ **Worker → App**: Worker can import and use utilities from the main app (`src/db/`, `src/lib/`, etc.)
- ❌ **App → Worker**: Main app should NOT import anything from `src/bg-worker/`

This one-way dependency ensures:
- The worker can leverage existing database connections, R2 clients, and utilities
- The main app bundle doesn't include worker code
- Clear separation between user-facing and background processes

## Project Structure

```
src/bg-worker/
├── Dockerfile          # Worker-specific Docker build
├── index.ts           # Main entry point, job scheduler
└── jobs/              # Individual job implementations
    └── sync-uploads.ts # Example: sync R2 uploads with DB
```

## Running Locally

### Start the worker:
```bash
pnpm worker
```

The worker runs independently from the main dev server. You'll typically run both:
```bash
# Terminal 1: Main app
pnpm dev

# Terminal 2: Background worker
pnpm worker
```

### Configuration
Set the interval via environment variable:
```bash
WORKER_INTERVAL_MS=10000 pnpm worker  # Run every 10 seconds
```

Default: 5000ms (5 seconds)

## Production Deployment

### Docker Compose
The worker runs as a separate service in `docker-compose.yml`:

```yaml
services:
  app:
    # Main TanStack Start app
    build:
      dockerfile: Dockerfile

  bg-worker:
    # Background worker
    build:
      dockerfile: src/bg-worker/Dockerfile
    environment:
      WORKER_INTERVAL_MS: 5000
```

Both services:
- Share the same database
- Use the same R2 credentials
- Run independently with separate logs
- Can be scaled independently (if needed in the future)

### Environment Variables
The worker uses the same `env.ts` as the main app, but only needs server-side variables:
- `DATABASE_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `WORKER_INTERVAL_MS` (optional, defaults to 5000ms)

Note: **No VITE_ variables** are needed since the worker doesn't use Vite.

## Adding New Jobs

### 1. Create a job file
```typescript
// src/bg-worker/jobs/my-job.ts
export async function myJob() {
  console.log('[my-job] Starting...');

  // Use shared utilities
  const records = await db.query.myTable.findMany();

  // Do work...

  console.log('[my-job] Completed');
}
```

### 2. Register in index.ts
```typescript
// src/bg-worker/index.ts
import { syncUploads } from './jobs/sync-uploads.ts';
import { myJob } from './jobs/my-job.ts';

async function runWorker() {
  try {
    await syncUploads();
    await myJob();  // Add your job
  } catch (error) {
    console.error('[bg-worker] Job failed:', error);
  }
}
```

## Current Jobs

### sync-uploads.ts
Syncs file upload records between the database and Cloudflare R2.

**Purpose**: Detect and handle orphaned uploads, verify file existence, update statuses.

**Frequency**: Every 5 seconds (configurable)

**What it does**:
1. Lists objects in the R2 bucket
2. Queries database for uploads with status = 'PENDING'
3. Logs which uploads exist/are missing in R2
4. (Future) Automatically update statuses, retry failed uploads, cleanup orphans

## Monitoring

### Logs
The worker logs all activity with `[job-name]` prefixes:
```
[bg-worker] Starting background worker (interval: 5000ms)
[sync-uploads] Starting sync job...
[sync-uploads] Found 42 files in R2
[sync-uploads] Found 3 PENDING uploads in DB
[sync-uploads] Upload ID 123: uploads/abc.jpg - EXISTS in R2
[sync-uploads] Sync job completed
```

### Health Checks (Future)
Consider adding:
- Prometheus metrics endpoint
- Health check endpoint (HTTP server for k8s probes)
- Sentry error tracking
- Database logging of job runs

## Scaling Considerations

### Current: Single Instance
The worker is designed to run as a single instance with a simple interval-based scheduler.

### Future: Multiple Instances
If you need to scale:
- Add distributed locking (Redis, PostgreSQL advisory locks)
- Use a proper job queue (BullMQ, Inngest, Trigger.dev)
- Implement leader election for scheduled tasks

For now, the simple approach is sufficient for most use cases.

## Troubleshooting

### Worker not starting
- Check `DATABASE_URL` is set correctly
- Verify R2 credentials in environment variables
- Look for TypeScript errors: `pnpm ts`

### Jobs not running
- Check logs for errors
- Verify `WORKER_INTERVAL_MS` is set (defaults to 5000)
- Ensure the worker process is actually running (`ps aux | grep worker`)

### High resource usage
- Increase `WORKER_INTERVAL_MS` to reduce frequency
- Add delays between operations in jobs
- Batch database queries instead of individual lookups

## Design Philosophy

The worker is intentionally simple:
- No complex scheduling library
- No HTTP server (unless needed for health checks)
- Uses existing app infrastructure (DB, R2 client, env config)
- Easy to understand and modify

If your needs outgrow this design, consider dedicated job queue solutions like BullMQ or Trigger.dev.
