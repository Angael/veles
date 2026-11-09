# Food logging from photos

## Context

Logging a packaged product that is not in the catalog is slow. The user must create a product, type the name, the package size, kcal, protein, fat and carbs, then log it. After shopping or a meal with many products, this takes minutes.

Barcode scanning helps only when the product is in our catalog or in Open Food Facts. Many Polish and store-brand products are not.

Goal: the user takes photos of a product and continues to the next one. The app reads the photos and adds the product to the log without more input.

Requirements:

- The user does not wait for the AI. They can scan many products in a row.
- Low cost per product. This is a hobby app, so token use must stay small.
- Products without a label (fruit, bakery items) also work.
- No setup on the server beyond an API key. The worker runs in Docker on Dokploy.

## Options considered

### AI backend

- **Claude Agent SDK.** A full agent loop with tools. Too heavy for "read 2 photos, return JSON". It needs an Anthropic API key and cannot use a ChatGPT/Codex subscription.
- **Codex subscription through a community AI SDK provider.** Uses the owner's ChatGPT login. Rejected: the `codex` CLI must be installed and logged in inside the worker container, the provider is unofficial, and all users would share the owner's Codex quota.
- **Vercel AI SDK with OpenRouter.** Works, but the current version also needs `zod`, for what is a single request.
- **Plain `fetch` to an OpenAI-compatible chat API (chosen).** No new dependencies. OpenRouter, OpenAI, Z.ai and most other providers accept the same request, so a provider change is only a change of env vars.

### Model

The default is `z-ai/glm-5.3-flash` on OpenRouter. It accepts image input and is very cheap. Any vision model that returns JSON can replace it with `AI_MODEL`.

### Review step

- **Always review:** safe, but the user must come back and confirm each product.
- **Confidence gate:** auto-log only when the macros match the kcal.
- **Always auto-log (chosen):** the owner wants no extra steps. A wrong entry can be edited or deleted like any other log.

### Where the work runs

- **In the web server request:** the user waits, and a restart loses the work.
- **In the worker, from a database queue (chosen):** the request only stores the photos. The worker already runs interval jobs, so a polling job is the smallest change. The queue survives restarts.

## Decision

### User flow

1. Log food menu → **Log from photos** (`/calories/photo`).
2. The user types the eaten grams, takes a front photo and, optionally, a nutrition label photo.
3. **Send and scan next** clears the form at once. The upload runs in the background. A counter shows how many products were sent.
4. On the daily log page, the product shows with a spinner while the AI works. When it is done, it becomes a normal log entry. If it fails, it shows Retry and Delete.

### Pipeline

1. **Browser:** makes each photo smaller (max 1600 px JPEG) and looks for a barcode on the photos with the existing barcode decoder.
2. **Server (`enqueueFoodPhotoScan`):**
   - If a barcode was found and the product is in the catalog or in Open Food Facts, the server logs it at once. No AI call.
   - Otherwise it checks the daily limit, stores the photos in R2, and inserts a `food_photo_scan` row with status `pending`.
3. **Worker (`food-photo-scan.ts`, every 5 s):**
   - Locks the oldest `pending` scan (`FOR UPDATE SKIP LOCKED`) and sets it to `processing`.
   - Downloads the photos from R2 and sends one chat request with the photos as data URLs.
   - The prompt asks for name, package size, and kcal, protein, fat and carbs per 100 g, and to convert per-serving values. Without a label photo, OpenRouter web search is turned on so the model can look up typical values.
   - In one transaction: creates a shared catalog product (front photo as its image, the barcode if it is still free), creates the food log scaled to the grams, and sets the scan to `done`.
4. **Browser:** the pending list polls every 4 s while something is in progress. When a scan leaves the list, the day log reloads.

### Cost control

- Barcode match first, so known products cost nothing.
- Smaller photos, one request per product, `max_tokens: 400`.
- Web search only when there is no label photo.
- Each result becomes a catalog product, so the same barcode never needs AI again.
- Limit: 30 scans per user per 24 h (`FOOD_PHOTO_SCANS_PER_DAY`).

### Failures

- The worker tries a scan up to 3 times. If the model says the photos show no food, it stops at once.
- A scan left in `processing` for 5 minutes (worker crash) goes back to `pending`.
- On shutdown, the active scan goes back to `pending` without using an attempt.
- The model answer is parsed leniently (JSON inside text or code fences), because not all models follow JSON mode.

### Data and storage

- `food_photo_scan` stores the user, log date, grams, barcode, the photo references, status, attempts, error, and the created log.
- Rows stay after success, so the daily limit can count them.
- On success, the label photo reference is removed, so upload cleanup deletes the photo. The front photo stays as the product image.
- Upload cleanup treats photos referenced by a scan as used.

## Configuration

Worker env (also in `compose.yaml` and `.env.example`):

| Variable      | Default                        | Notes                                |
| ------------- | ------------------------------ | ------------------------------------ |
| `AI_API_KEY`  | none                           | Without it, scans stay in the queue. |
| `AI_BASE_URL` | `https://openrouter.ai/api/v1` | Any OpenAI-compatible API.           |
| `AI_MODEL`    | `z-ai/glm-5.3-flash`           | Must accept image input.             |

## Known limits

- Auto-logging means a misread label (per serving vs per 100 g) goes straight into the log. The user must fix it by hand.
- AI-created products are shared with all users.
- Photos are stored as 1080 px WebP. Very small label text may be hard to read, and not every model accepts WebP.
- No MCP tool: agents cannot send photos. Finished scans are normal food logs, so MCP reads them already.

## Code

- Worker: `apps/worker/src/food-photo-scan.ts`, `apps/worker/src/food-photo-ai.ts`
- Web: `apps/web/src/pages/calories/photo-scan/`, `apps/web/src/pages/calories/dashboard/PendingPhotoScans.tsx`
- Schema: `foodPhotoScans` in `packages/db/src/schema/calories.schema.ts`
