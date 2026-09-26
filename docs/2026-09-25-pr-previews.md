# PR preview slots — live decisions and status

**Status (2026-09-25): controller prepared on `feat/pr-preview-controller`, disabled; no live preview trial or Dokploy mutation performed.** `vars.PREVIEW_ENABLED` must be the literal `true` to run it. Do not enable it until the takeover checks below pass.

## Confirmed inventory (read-only Dokploy MCP)

| Slot | Veles / dev Compose      | Compose ID              | HTTPS domain                                                        | Current branch             | Current autoDeploy |
| ---- | ------------------------ | ----------------------- | ------------------------------------------------------------------- | -------------------------- | ------------------ |
| 1    | compose preview 1        | `d2yuEVuvQBlK3Q0mHb9WL` | `veles-dev1.widacki.me` → `nginx:80`                                | `redesign-kcal-circle`     | **on**             |
| 2    | compose preview 2        | `pj67Bs9tSK6iYkbwr62RM` | `veles-dev2.widacki.me` → `nginx:80`                                | `feat/calories-week-swipe` | **on**             |
| 3    | Not provisioned/verified | —                       | `veles-dev3.widacki.me` is only shown as a Google JavaScript origin | —                          | —                  |

`compose.search` omitted both previews, but `project.all`, `compose.one`, and `domain.byComposeId` found them. Dokploy's MCP redacts `env`; no database URL, bucket name, or OAuth callback can be inferred from its response. The owner says previews share the **dev database and R2 bucket**; this is intentional. Confirm neither shared resource is production before enabling. The currently assigned branches and auto-deploy must not be commandeered by this controller: an owner must approve a slot takeover, stop/reassign current usage as appropriate, disable Dokploy `autoDeploy`, and set a known idle branch. The controller refuses a branch mismatch and never changes production Compose.

**2026-09-26 takeover decision:** the owner approved repurposing slot 1 from `redesign-kcal-circle`. GitHub PR [#170](https://github.com/Angael/veles/pull/170) remains open; its head SHA `a43852546fffc54765e6a4423ac676c6278f20f2` matches the latest completed deployment visible in Dokploy. No Dokploy mutation has been made. Slot 1 is **not free yet**: it is still serving PR #170 and has `autoDeploy: true`. Choose `main` as the idle branch when the controlled cutover happens, with `autoDeploy: false` and the Compose stopped. Do not bootstrap its issue as `free` or disable its current auto-deploy while the controller exists only on this local feature branch; that would misstate ownership or strand the active preview. Slot 2 is not approved for takeover.

The Google screenshot shows JavaScript **origins**, not authorized **redirect URIs**. Check `https://veles-dev1.widacki.me/api/auth/callback/google` and the equivalent for each active slot in Google Cloud before an OAuth trial. `APP_URL` must match each slot's HTTPS origin.

## Shared data contract

- The controller **never** runs Drizzle, SQL, `db:reset`, migrations, seed, R2 delete, or bucket cleanup. It changes only preview Compose branch, deploy and stop through Dokploy. The web/worker application code still has database/R2 access at runtime; a PR can change shared data or schema through its own code. Only deploy trusted branches of this repo. Apply compatible schema migrations manually, under owner control, before relying on PRs that require them.
- Both slots use the same dev database and R2 objects. Data, uploads, users, and Better Auth records survive release and can appear in later PRs. Do **not** promise clean data per PR. No R2 lifecycle rule may be enabled on a bucket shared with production; verify bucket ownership before setting any lifecycle policy. Each Compose retains its own `APP_URL`, HTTPS domain, and preferably per-slot `BETTER_AUTH_SECRET` (rotating a secret is a separate owner action, not controller behavior).
- Public repository code from an eligible same-repository PR runs on the VPS with the shared dev credentials. A scoped Dokploy token and a trusted-main GitHub workflow reduce CI exposure but do not sandbox that PR code. Do not grant the controller production Compose access; do not expose database maintenance credentials to it.

## Control plane

- One trusted-main `pull_request_target` workflow reacts to PR open/update/reopen/label/draft/close, `workflow_dispatch`, and a five-minute reconciliation schedule. Fork PRs are excluded; the privileged runner checks out **main**, never PR code. One shared concurrency group serializes controller runs without cancellation. The schedule reads live state after missed events and checks deployment completion; GitHub scheduling can be delayed.
- `preview:off` stops and releases an owned slot and blocks automatic reassignment while present. `preview:slot-1/2/3` asks for a specific configured free slot. Multiple slot labels are invalid; busy/unconfigured slots produce a PR comment. With no label, an eligible open, non-draft PR gets the lowest free configured slot. An old PR can be reopened; an open one can ask via a label. No automatic eviction or two-slot ownership.
- One **open** GitHub issue named `[preview-slot-N]` per configured slot persists PR owner, generation, state, target SHA, and operation ID. Reserve before changing Dokploy. `free`, `deploying`, `awaiting-verification`, `ready`, `releasing`, and `failed` are the allowed states. Failed or contradictory state remains reserved; an administrator can post the generation/attempt-scoped retry string printed in the slot issue after investigation. One bot PR comment is edited, not recreated or deleted. A link is marked ready only after a matching completed Dokploy deployment record and `/api/health`; closing or opting out removes it from the comment after stop.
- Builds are requested one at a time. Dokploy must report the **actual commit SHA** in its deployment history, not just the target SHA supplied by this controller; no target SHA is sent in the deployment description. The installed API's exact history/title behavior still needs a live one-slot trial. If its metadata cannot prove the commit, the controller keeps the URL withheld rather than guessing. Closing while a build is in flight waits for its outcome before stopping the slot.
- On release the controller rechecks PR intent, issue ownership, Compose source/branch/environment, and shared-resource configuration; it stops that Compose, resets **only its configured Git branch** to the idle branch with `autoDeploy: false`, then frees the issue. No database or R2 reset occurs. A failed stop/update keeps the reservation.

## Configuration and staged activation

`secrets.PREVIEW_CONFIG` is private JSON with `dokployUrl`, `sharedDatabaseUrl`, `sharedR2Bucket`, `sharedDevConfirmed: true`, and `slots` containing **one to three** distinct entries. Each slot entry needs `slot` (1–3), `composeId`, `repository` (`Angael/veles`), `environmentId` (the Veles **dev** environment ID), `url` (exact HTTPS origin), `idleBranch`, and `domainConfirmed: true`. The controller compares the real Compose environment (`DATABASE_URL`, `R2_BUCKET_NAME`, `APP_URL`) to those expected values; it refuses mismatches, active Dokploy `autoDeploy`, or a wrong branch/domain/source. Keep the JSON secret because it contains the DB URL. `secrets.DOKPLOY_API_KEY` must be restricted to preview Composes. Neither secret has been set by this change. Start with just slot 1 after owner-approved takeover, then add slot 2, then slot 3; do not invent a third Compose ID.

Create exactly one open GitHub issue per configured slot, initially free. With `N=1` (repeat for 2 only when that slot is ready), an administrator can bootstrap its controller marker:

```bash
N=1
RECORD=$(N="$N" node -e 'process.stdout.write(Buffer.from(JSON.stringify({slot:Number(process.env.N),owner:null,generation:null,state:"free",deployedSha:null})).toString("base64url"))')
gh issue create --repo Angael/veles --title "[preview-slot-$N]" --body "<!-- veles-preview-slot:$N $RECORD -->"
```

Do not duplicate or hand-edit a live slot issue. The controller refuses missing, duplicate, closed, malformed, or contradictory records.

## Next verification (not yet done)

1. Owner verifies that the shared database and bucket are **dev-only** and checks slot 1's actual `APP_URL`, Google OAuth redirect registration, and least-privilege Dokploy token. Do not run migrations/reset through this controller.
2. First land the trusted workflow on `main` with `PREVIEW_ENABLED` unset. Since pushing `main` deploys production, follow the normal production review/deployment process; no DB migration is required by these workflow-only changes. Then, as one controlled cutover for slot 1, stop the current PR #170 preview, disable Dokploy auto-deploy, set branch to idle `main`, create its initially-free issue, and set the verified one-slot configuration. Only then enable the gate. If any step fails, leave the slot unavailable; do not label the still-running PR #170 Compose as free.
3. With one configured slot, trial trusted PR → reservation → Dokploy deployment record with actual SHA → healthy HTTPS URL/comment → next commit (no database reset) → close → stopped/idle/free. Exercise busy pin, `preview:off`, missed-event dispatch, failure/retry, and a second PR. Check the shared dev services still work.
4. Only after that trial, enable slot 2, then provision and verify slot 3. Measure VPS memory during builds and runtime before running all three previews. Never use production Compose or destructive shared-bucket cleanup.

No live deployment, database operation, Drizzle command, or browser smoke check was run in preparing this branch.
