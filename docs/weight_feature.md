# Weight Entries and Progress Photos

This document preserves the useful product and technical context from the abandoned Wayfinder planning pass. It is the working brief for the weight feature, not a complete implementation specification.

## Goal

Add Weight Entries with optional Progress Photos. The feature should work well on mobile and desktop and support creating, reviewing, comparing, editing, and deleting entries.

Use these terms consistently:

- **Weight Entry**: a dated record of a user's weight.
- **Progress Photo**: an image belonging to exactly one Weight Entry. It never exists as an independent domain record.

Progress Photos may be intimate or nude self-photos. Treat every Progress Photo as sensitive regardless of its contents.

## Product decisions

- Weight Entries and their Progress Photos belong to their owner.
- Progress Photos will use the existing public Cloudflare R2 delivery approach, including a custom-domain URL.
- Object keys must contain enough cryptographically secure randomness to make discovery by guessing virtually infeasible. Do not derive keys from user IDs, entry IDs, dates, filenames, counters, or other predictable values.
- Knowledge of the full URL grants access to the photo. This is intentional: an owner may share that URL with another person.
- The URL is a durable bearer capability, not authenticated application access. The UI and product copy must not claim that a shared photo is owner-only, access-controlled, or retractable after another person has received it.
- The app is intentionally accepting URL leakage and redistribution risk in exchange for a simpler architecture appropriate to its expected small user base.
- The app cannot prevent a recipient from downloading, copying, or taking a screenshot of a photo.
- Uploading a Progress Photo does not require an adult confirmation or any other pre-upload acknowledgement.
- Deleting a Progress Photo deletes its database record and R2 object. Deleting a Weight Entry also deletes every attached Progress Photo from the database and R2.

## Public URL security model

Random object keys prevent practical guessing when generated with sufficient entropy, but they do not protect a URL after it leaks. URLs may be retained in browser history or sync, messaging previews, logs, copied messages, and caches. Anyone holding the URL can use it without a Veles session.

Use at least 128 bits of randomness from a cryptographically secure generator. A conventional UUID v4 provides 122 random bits and is likely sufficient for this app; a 128-bit random value encoded as 22 unpadded base64url characters or 32 hexadecimal characters is a straightforward alternative. Adding a friendly filename is unnecessary and may reveal information.

Do not:

- treat CORS as access control;
- rely on an unlisted bucket root to provide privacy;
- expose original filenames or user information in object keys;
- log full Progress Photo URLs or object keys intentionally;
- embed sensitive information in query parameters or predictable path prefixes.

Deleting or moving the R2 object invalidates the public URL at the origin. It cannot delete copies already downloaded by recipients, and a custom-domain cache may continue serving a deleted object until it expires or is purged. The deletion UX must explain the guarantee accurately.

## Decisions still needed before implementation

### Weight Entry rules

Define:

- required fields and whether notes or other metadata are supported;
- canonical stored weight unit and display-unit conversion;
- accepted value range and precision;
- date versus timestamp semantics and the user's timezone;
- whether multiple entries may exist on the same date;
- backdating and future-date rules;
- editing behavior and whether historical values are audited.

### Upload and processing rules

Choose:

- camera, photo-library, drag-and-drop, and clipboard sources;
- accepted input formats, including whether HEIC/HEIF is supported;
- maximum source size, decoded dimensions, output dimensions, and photo count per entry;
- whether originals are discarded after normalization;
- output format and quality;
- EXIF and other metadata removal, including GPS and capture-device data;
- orientation and color-profile handling;
- partial-failure behavior when an entry or one of several photos fails to save.

Progress Photos are expected to be small enough for a single-part upload. Existing server-side limits, actual image decoding, normalization with Sharp, generated keys, and failed-upload cleanup are useful patterns from recipe uploads. A request's declared content type is not proof of its contents.

### Privacy and deletion behavior

- Deleting one Progress Photo deletes its database record and R2 object.
- Deleting a Weight Entry deletes the entry, all attached Progress Photo records, and their R2 objects.
- Account deletion behavior still needs to be specified.

Retention and handling still need to be decided for database backups, application logs, R2/CDN caches, failed deletions, and disaster recovery. Product copy must distinguish removing access from Veles/R2 from retracting copies previously obtained through a public URL.

R2 object deletion is strongly consistent for direct R2 reads, but R2 and the database do not share a transaction. Deletion therefore needs retryable coordination or reconciliation. A database cascade alone cannot delete an R2 object. With custom-domain delivery, purge or cache-expiry behavior must also be defined.

### Safeguards for intimate photos

Decide:

- how the app communicates that photos may be sensitive and publicly accessible to anyone with their URL;
- how previews are concealed from shoulder-surfing and accidental exposure;
- whether photos should be hidden until intentionally revealed;
- confirmation and recovery behavior for destructive actions;
- whether URLs can be rotated to stop future use of an old link at the origin;
- how misuse and support incidents are handled in the invitation-only app.

Do not add adult confirmation, consent gates, or other acknowledgement steps before upload.

### Experience

The `/weight` page should use this structure:

- At the top, show a minimal graph of the user's weight over the last month. The time range can become configurable later.
- Below the graph, show three summary cards: current weight, two-week change, and one-month change. Keep them side by side whenever the available width allows, and only stack them when necessary on narrow screens.
- Keep adding a new weight inline on the page. Show the weight input without a "Daily entry" title or a "Mock only" chip.

Design and validate mobile and desktop flows for:

- creating an entry with or without photos;
- adding, ordering, replacing, and removing photos;
- browsing weight history without exposing thumbnails unexpectedly;
- intentionally revealing a sensitive image;
- comparing entries or photos;
- copying or sharing a photo URL with a clear warning about bearer access;
- editing dates or weights;
- deleting a photo or entry with an accurate explanation of what deletion can and cannot do;
- upload, processing, and deletion failure states.

The final UI should follow the repository's UI-polish guidance and accessibility expectations.

## Storage and implementation context

The existing storage layer already uses the AWS S3 client against R2 and implements object upload, read, and deletion. Its configuration currently assumes one bucket and one public URL, and recipe APIs convert stored object paths into CDN URLs. The public Progress Photo approach can reuse this overall delivery model, but should still use a distinct key namespace and explicit Progress Photo helpers so sensitive-media behavior is not accidentally coupled to recipe behavior.

The existing `upload_object` data records include bucket, key, MIME type, and user ID. The eventual domain model must associate a Progress Photo with exactly one Weight Entry and verify ownership for mutations. Public reads by URL are intentionally unauthenticated.

Schema changes must follow the repository's Drizzle migration workflow; migration commands are left to the human operator. Inputs accepted by server functions or API routes must follow the repository's ArkType validation rules.

## Delivery and cleanup alternatives considered

The discarded private-storage design considered two read mechanisms:

- an authenticated server proxy, which could check ownership on every read, hide the object key, control response headers, and revoke application access immediately at the cost of routing image bandwidth through Veles;
- a short-lived presigned R2 GET, which would avoid the application data hop but remain a reusable bearer token until expiry and require browser CORS configuration.

R2 presigned URLs use the S3 API domain rather than a custom domain. Sensitive private responses would normally use `Cache-Control: no-store`. These alternatives remain available if the public-URL security model is reconsidered later, but they are not the selected direction.

## Out of scope for the first implementation

- managed recipient lists, permissions, or relationship-based sharing;
- revocable per-recipient share links;
- family or friend account relationships;
- invitation-program and account-capacity design;
- monetization and general upload quotas beyond feature safeguards;
- sharing of recipes, weight journeys, diary entries, or products as a broader platform feature;
- barcode scanning and calorie-counting product sharing.

## Implementation readiness

Implementation should begin only after the Weight Entry rules, upload normalization, truthful deletion guarantees, sensitive-photo safeguards, and primary UX flows above are decided. The implementation plan should then cover schema work, storage behavior, validation, UI, cleanup/reconciliation, tests, rollout, and release checks.
