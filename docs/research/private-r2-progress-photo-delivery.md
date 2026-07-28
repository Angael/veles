# Private R2 delivery for Progress Photos

Research for [Find a private R2 delivery design for Progress Photos](https://github.com/Angael/veles/issues/52). This report records decision inputs; it does **not** choose the final delivery architecture.

## Facts

### R2 access surfaces

- R2 buckets are private by default. Public access is an explicit bucket setting exposed through either an `r2.dev` hostname or a custom domain; `r2.dev` is for development, while custom-domain access is the production public-bucket path. [Cloudflare: Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- Connecting a custom domain exposes bucket objects to the Internet. Cloudflare Access and WAF token authentication can restrict that domain, but these are perimeter controls, not Veles's per-Weight-Entry owner check. Leaving both public access methods disabled avoids a second read path around application authorization. [Cloudflare: Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- Authenticated S3 API access uses an R2 Access Key ID and Secret Access Key at `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. Tokens can be limited to object access in selected buckets. [Cloudflare: R2 authentication](https://developers.cloudflare.com/r2/api/tokens/)

### Private read choices

| Property                | Server-proxied read                                                                                                                      | Presigned GET                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization           | Veles authenticates the request, loads the Progress Photo and its owner, then calls `GetObject`. Authorization is checked on every read. | Veles performs the same owner check before signing. R2 does not re-check the Veles session when the URL is used.                                                            |
| Client URL              | A Veles route can use an opaque application identifier and need not reveal bucket or object key.                                         | The S3 URL contains the bucket/object path and signature parameters.                                                                                                        |
| Lifetime and revocation | Access ends as soon as Veles denies the route or the object is deleted.                                                                  | The URL is a reusable bearer token until expiry (supported range: 1 second to 7 days), unless the object is deleted first. Anyone holding it has access during that window. |
| Data path               | R2 to Veles to browser, so the app handles response streaming and bandwidth.                                                             | R2 to browser, avoiding the app data hop. Browser use on a different origin needs an R2 CORS policy.                                                                        |
| Caching control         | Veles controls the response headers directly.                                                                                            | `PutObject` supports `Cache-Control` object metadata, which is returned with the object; the application has less control after issuing the URL.                            |

R2 supports presigned `GET`, `HEAD`, `PUT`, and `DELETE`, only on the S3 API domain, not custom domains. Its documentation explicitly says to treat a presigned URL as a bearer token and notes that it can be reused until expiry. [Cloudflare: Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) Cross-origin browser requests to presigned URLs require CORS even when the signature is valid. [Cloudflare: Configure CORS](https://developers.cloudflare.com/r2/buckets/cors/) R2 implements `GetObject`, and `PutObject` supports `Cache-Control` and `Content-Disposition` metadata. [Cloudflare: S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)

### Caching and deletion

- `Cache-Control: no-store` tells browser and intermediary caches not to store the response; `private` still permits a browser cache. Cloudflare identifies `no-store` as appropriate for highly sensitive data. [Cloudflare: Origin Cache Control](https://developers.cloudflare.com/cache/concepts/cache-control/)
- Cloudflare browser-cache settings can override a lower origin TTL unless configured to respect existing headers, and purging Cloudflare's cache does not remove copies already stored in a visitor's browser. [Cloudflare: Edge and Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/)
- R2 has strong global consistency for writes, reads, listings, and deletes. After a direct R2 delete completes, direct reads immediately return "does not exist." S3 API and Worker binding reads do not transit Cloudflare Cache. [Cloudflare: Consistency model](https://developers.cloudflare.com/r2/reference/consistency/)
- A custom-domain cache relaxes that guarantee: a deleted object can remain available from cache until expiry or purge. [Cloudflare: Consistency model](https://developers.cloudflare.com/r2/reference/consistency/) R2's S3 compatibility table implements `DeleteObject` but not bucket versioning or object locking, so the current API offers no version-history recovery layer to account for when deleting a key. [Cloudflare: S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)

No HTTP design can retract a photo that a permitted client has already downloaded, screenshotted, or stored contrary to caching instructions. The controllable guarantee is that Veles, R2, and conforming caches stop serving or retaining another copy.

### Upload relevance

Cloudflare recommends single-part `PUT` for small and medium files below about 100 MB; multipart upload is for large files or resumability. A single `PUT` supports objects up to 5 GiB. [Cloudflare: Upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/) Progress Photos should remain well below those thresholds after image limits and normalization, so multipart delivery is not a design driver. Presigned `PUT` is available for direct uploads, but it bypasses the Veles server and therefore requires a separate authenticated finalize/validation workflow; a signed `Content-Type` constrains the request header, not the actual image content. R2 advises signing `Content-Type` and configuring CORS for browser presigned uploads. [Cloudflare: Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

## Current Veles implications

- `src/lib/storage/r2.ts` already uses `@aws-sdk/client-s3` with R2's S3 endpoint and implements `PutObject`, `GetObject`, and `DeleteObject`. Either private-read choice can reuse this client; presigning would additionally require the AWS SDK v3 S3 request presigner.
- `src/lib/storage/config.ts` has one bucket and one `publicUrl`. `storagePathToUrl` deliberately turns recipe-image keys into CDN URLs, and `src/pages/recipes/recipes.api.ts` returns those URLs. Progress Photos must not use that conversion.
- If the existing bucket has public custom-domain or `r2.dev` access, any Progress Photo placed there would have an unauthenticated object-key URL. A separate private bucket is the simplest isolation candidate; sharing a bucket would require proving that every public access surface and rule excludes the private prefix. The final architecture ticket should choose this boundary.
- `upload_object` already stores `bucket`, `key`, `mimeType`, and `userId`, but a read must authorize through the Progress Photo's owning Weight Entry rather than trusting a supplied key or treating an unguessable key as authorization.
- Current recipe uploads are server-proxied, bounded, normalized with Sharp, and cleaned up from R2 on upload failure. The generic R2 delete helper is otherwise not connected to record deletion. Progress Photo deletion therefore needs an explicit object-and-database failure policy; a database cascade alone cannot delete an R2 object.

## Recommendations to carry forward

These are constraints and comparison points, not the reserved final architecture decision:

1. Keep Progress Photo storage private: disable both `r2.dev` and custom/public-domain delivery for its bucket or otherwise establish a demonstrably private bucket boundary.
2. Put authentication and ownership authorization in Veles before every proxied read or before issuing every presigned URL. Accept an application record ID, resolve the server-stored key only after authorization, and never accept an arbitrary object key from the client.
3. Return `Cache-Control: no-store` (and avoid cache rules that override it) for photo bytes and for responses containing presigned URLs. Store equivalent `Cache-Control` metadata if presigned GET remains a candidate. Do not rely on key entropy, CORS, CDN cache purge, or URL expiry as owner authorization.
4. Compare a server proxy's per-request authorization, hidden key, immediate application revocation, and simpler cache policy against presigned GET's lower app bandwidth but bearer-URL leakage window. If presigned GET is selected later, use the shortest usable expiry, never persist or log the full URL, and avoid placing it in durable page data.
5. Define deletion as a coordinated workflow: stop authorization first, issue `DeleteObject`, remove or tombstone metadata only under a stated failure policy, and retry/reconcile failed object deletes. Direct R2 deletion is strongly consistent, but database and object storage do not share a transaction.
6. Retain server-side byte limits, content decoding/normalization, generated keys, and failed-upload cleanup. Multipart upload is unnecessary at expected photo sizes; direct presigned upload should be considered only if its finalize and validation complexity is justified.

## Decision still open

The later architecture ticket must choose between server-proxied reads and short-lived presigned GETs, choose same-bucket prefix isolation versus a dedicated private bucket, and specify the cross-system deletion state machine. Both read mechanisms can enforce owner-only issuance; they differ primarily in bearer-URL exposure, per-request revocation, caching control, and application bandwidth.
