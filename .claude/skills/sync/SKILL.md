---
name: sync
description: Manual PR sync flow. "sync down" = merge main, regenerate migrations, db:reset, check:fix, push, verify PR. "sync up" = sync down + migrate prod DB + squash-merge PR. Use only when the user says "sync down" or "sync up".
disable-model-invocation: true
argument-hint: down | up
---

# Sync

Argument: `down` or `up`. Typing "sync up" counts as approval for the prod migration and the merge. Do not ask for confirmation except where this file says **stop and ask**.

## Sync down

1. **Prepare the checkout (worktrees too).**
   - Main checkout dir: `dirname "$(git rev-parse --path-format=absolute --git-common-dir)"`.
   - If `.env` is missing in the current root, symlink it from the main checkout (`ln -s <main>/.env .env`). Same for `.env.prod` if `up`. If the main checkout has none either, **stop and ask**.
   - If `node_modules` is missing, run `pnpm install --frozen-lockfile`.
   - Refuse to run on `main`.
2. **Commit local work.** Commit all working tree changes with a conventional message. Never commit `.claude/worktrees/` or env files. If a file looks unrelated to the branch's work, **stop and ask**.
3. **Merge main.** `git fetch origin && git merge origin/main`. History shape does not matter (PRs are squash-merged).
   - Code conflicts: resolve trivial ones; otherwise **stop and ask**.
   - Migration conflicts (`packages/db/drizzle/**`): branch migrations not on main get dropped and regenerated. Save the branch's SQL first, delete those `.sql` files and their `meta/*_snapshot.json`, take main's `meta/_journal.json`, finish the merge, then go to step 4. If the regenerated SQL differs in meaning from the saved SQL, **stop and ask**.
   - Also do this when there is no textual conflict but main and the branch both added a migration with the same number.
4. **Generate migrations.** `pnpm db:generate`. If it creates files, commit them (`chore(db): add migration for ...`). If drizzle-kit prompts interactively (rename vs. create), **stop and ask**.
5. **Reset dev DB.** `pnpm db:reset`.
6. **Gate.** `pnpm check:fix`. Fix failures and commit the fixes. Repeat until green.
7. **Push.** `git push` (set upstream if needed).
8. **PR.** `gh pr view` for the branch. If none, create one: body starts with `# TL;DR`, ASD-STE100 style, short. Then check `gh pr checks`; if a check failed, investigate and fix. Do not wait on pending checks in sync down.
9. **Report** what each step did or skipped.

## Sync up

Run all of sync down, then:

10. **Review pending prod migrations.** List migrations added by this branch versus `origin/main` and show their SQL. If any is destructive (`DROP`, `ALTER ... TYPE`, `SET NOT NULL` / `NOT NULL` column without default, `TRUNCATE`, data-deleting `DELETE`/`UPDATE`), **stop and ask**.
11. **Migrate prod.** `pnpm db:migrate:prod`. On failure, stop. Do not merge.
12. **Squash-merge.** `gh pr merge --squash --delete-branch`. No AI attribution in the commit message. If GitHub refuses (failing required checks, conflicts), stop and report.
13. **Report** the merge commit and PR URL. Pushing to `main` deploys to prod; this skill ends here.
