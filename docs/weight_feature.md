# Weight Entries and Progress Photos

## Scope

A **Weight Entry** records one user's weight on a date. A sensitive **Progress Photo** belongs to exactly one entry.

## Weight rules

- Store kilograms as integer grams; validate acceptable limits in the API, not PostgreSQL.
- Store a date without a time. Past and present dates are allowed; future dates are rejected.
- A user has at most one entry per date. Saving the same date upserts its weight and appends new photos.
- No notes, timestamps, or audit history are stored for Weight Entries.
- An entry supports up to eight photos, enforced by the API and UI.
- Photos have no user-controlled order. Store their normalized width, height, and creation time.

## Photo processing and storage

Validate image contents rather than trusting MIME declarations. Use Sharp to correct orientation, remove metadata, convert to WebP, and discard the original. Size, dimension, and quality limits remain undecided.

Use a distinct key namespace and at least 128 random bits. Keys must not contain identifying or predictable data. Do not log keys or full URLs.

Photos use public custom-domain URLs. Anyone with a URL can access or redistribute the image without a Veles session. CORS and obscurity are not access controls. Copy must describe bearer access and never promise retraction. Downloads and CDN caches may survive deletion.

Hide photos until intentionally revealed. Sharing and deletion must explain their privacy consequences. Do not add an adult-confirmation gate.

## Deletion

Deleting a photo or entry commits its database deletion and an `upload_object_deletion_job` containing the bucket and key together, then attempts R2 deletion. Success removes the job; failure leaves it for retry.

This PR creates the durable general-purpose queue. Feature deletion paths must append jobs; processing them is deferred to another PR. A database cascade cannot delete R2 objects.

## Page experience

`/weight` shows a minimal one-month graph, then side-by-side cards for current weight, two-week change, and one-month change, stacking only when necessary. Weight creation stays inline. History must avoid exposing thumbnails unexpectedly and support intentional reveal, comparison, editing, individual photo deletion, entry deletion, and honest failure states.

Follow the repository's ArkType validation, Drizzle migration, UI-polish, and accessibility conventions.
