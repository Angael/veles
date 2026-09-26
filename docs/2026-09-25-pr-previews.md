# PR previews

A standalone `apps/preview` Docker application in its own Dokploy project manages fixed Compose slots. It is **not** part of `compose.yaml` or GitHub Actions. This branch does not configure GitHub or change live Dokploy resources.

## Behavior

- A signed GitHub App `pull_request` webhook triggers reconciliation; startup and a five-minute timer recover missed events. Only open, non-draft, same-repository PRs without `preview:off` qualify. Oldest eligible PR gets the next free configured slot; no eviction.
- SQLite at `/data/preview.sqlite` retains slot ownership through restarts. On assignment, the controller selects the PR branch, requests one deploy, and enables Dokploy auto-deploy for later commits. Failed builds **still own** their slot. It does not inspect build results or claim the preview is ready.
- One edited PR comment gives the fixed URL once a deploy is requested, with a warning that it may be building or failed. Close, draft, or `preview:off` disables auto-deploy, stops the Compose, resets its branch to idle `main`, removes the link, and frees the slot. API failures retain the reservation for the next reconciliation.
- The controller does not run migrations or touch PostgreSQL/R2 data. Preview PR code does have access to the shared **dev** database and R2 bucket; never point these slots at production resources.

## Provisioning

1. In Dokploy, create a separate application/project from this repo with build context `.` and Dockerfile `apps/preview/Dockerfile`; mount a **persistent writable volume** at `/data`, one replica only, and expose port 3000 at a HTTPS webhook host. Set `PREVIEW_DB_PATH=/data/preview.sqlite`.
2. Register a GitHub App for `Angael/veles`: repository permissions **Pull requests: read**, **Issues: read/write** (PR comments), and **Metadata: read**. Subscribe to pull request events. Set its webhook URL to `https://<controller-host>/webhook` with a secret; the service also exposes `GET /health`.
3. Set the controller variables listed in `.env.example`: GitHub App ID, installation ID, private key, webhook secret, repository and `GITHUB_MAIN_BRANCH_NAME` (the idle branch); Dokploy HTTPS URL and API key; **dev** environment ID; `PREVIEW_SLOTS` JSON array (`composeId`, `url`). Array position determines slot number (first entry is slot 1). SQLite binds each position to its Compose ID and refuses reordering after activation. The global Dokploy token can modify production: keep it only in this controller and restrict network access where possible. Code permits mutations only of configured Compose IDs after checking environment, source repo and HTTPS nginx:80 domain.
4. Configure each fixed preview Compose with its own `APP_URL`, domain and Google authorized redirect URI (`https://veles-devN.widacki.me/api/auth/callback/google`). Verify the database and R2 bucket are dev-only. Add only provisioned slots to `PREVIEW_SLOTS`; the controller takes over existing slot branches at first reconciliation.

Slots 1 and 2 exist at `veles-dev1.widacki.me` (`d2yuEVuvQBlK3Q0mHb9WL`) and `veles-dev2.widacki.me` (`pj67Bs9tSK6iYkbwr62RM`), respectively. Slot 3 (`veles-dev3.widacki.me`) is **not provisioned**; do not configure it until its Compose, HTTPS domain, OAuth redirect and dev resources are verified.

## Rollout check

First deploy the controller with **only slot 1 configured**; activating it will stop/reassign the currently running preview. Exercise PR assignment, next commit via Dokploy auto-deploy, `preview:off`, close/reopen, a failed build retaining ownership, and an occupied-slot queue before adding slot 2. Check that setting the branch and explicitly deploying once does not trigger an unwanted second build in the installed Dokploy version. Then provision and verify slot 3. Do not run Drizzle or shared-data cleanup as part of this rollout.
