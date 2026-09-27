# PR preview architecture

## Context

PRs need isolated, predictable URLs without granting a public GitHub Actions workflow production deployment credentials. Preview builds may fail or be delayed; a URL must not imply a successful deployment.

## Decision

- Run a standalone `apps/preview` controller in its own Dokploy application, outside the production Compose stack. A signed GitHub App webhook and periodic reconciliation drive a fixed pool of preconfigured Dokploy Compose slots; no GitHub Actions deployment workflow.
- Assign the oldest eligible open, non-draft, same-repository PR without `preview:off` to a free slot. Do not evict an owner when the pool is full. Persist ownership in SQLite on a persistent volume with a single controller replica so restarts do not reshuffle slots.
- On assignment, select the PR branch and request a deploy; Dokploy auto-deploy handles later commits. The controller does not inspect build results: failed builds retain their slot, and the PR comment identifies the URL as possibly still building or failed.
- On close, draft, or opt-out, disable auto-deploy, stop the slot, remove its preview link, and free the reservation. Idle slots remain stopped on their last branch until reassigned. Reconciliation retries failed transitions.

## Boundaries and consequences

- Only explicitly configured slot IDs may be mutated, after checking their environment, repository, and HTTPS routing. Slot order is persistent identity and must not be reordered after activation.
- Preview PR code can access shared **development** database and R2 resources; never supply production data or credentials to slots. The controller does not run migrations or reset shared data.
- The controller needs a Dokploy token with broad privileges, so it must be isolated and its network access restricted. Capacity is fixed: extra PRs wait rather than taking an existing preview's URL.
