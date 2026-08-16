---
name: pr-stack
description: Use when creating, viewing, updating, restacking, or submitting PR stacks
---

# PR stacks

GitHub's `gh stack` extension is in public preview. Use this as a workflow lookup, then check `gh stack <command> --help` if behavior matters.

## Inspect first

Prefer OMP's PR resources over CLI calls when viewing state:

```text
pr://                         recent PRs
pr://42                      PR 42
pr://owner/repo/42           PR in another repository
pr://42?comments=0           omit comments when only metadata is needed
pr://?state=open&limit=20    filtered list
```

Use `gh stack view` only for local stack composition/order or when OMP's PR view cannot answer the question:

```sh
gh stack view
# --short: branches only; --json: structured output
```

## Model

- Bottom is closest to trunk; top is furthest away.
- Each PR targets the branch below it; the bottom PR targets trunk.
- Name branches `stack/<group-slug>/<two-digit-order>/<branch-title>`.
- Keep the worktree clean before rebasing or restructuring.
- Never merge through `gh`; merging is reserved for the human user.

## Create and submit

```sh
git switch main
gh stack init stack/auth/01-model
git add <files> && git commit -m "Add auth model"

gh stack add stack/auth/02-api # run from the current top
git add <files> && git commit -m "Add auth API"

gh stack view
gh stack submit                # push, create/update PRs, link stack
```

`init --base <trunk> branch-a branch-b` adopts existing branches or creates missing ones. Prefer interactive `submit` to review titles, bodies, and draft state. For automation, `submit --auto` creates drafts; add `--open` for ready-for-review PRs. `sync` never creates missing PRs.

## Update or restack

```sh
gh stack sync          # fetch, cascade-rebase if trunk moved, push, sync PR state
gh stack sync --prune  # also remove merged local branches
```

Use `sync` for routine updates. If local and remote compositions diverge, deliberately choose the authoritative side; non-interactive sync aborts without pushing.

For conflicts or explicit control:

```sh
gh stack rebase
# resolve conflicts and stage files
gh stack rebase --continue
# or restore all branches
gh stack rebase --abort
```

After rewritten history, update every affected remote branch. Use `submit` if PR/stack structure changed; use `push` only when structure is unchanged. Push uses per-branch `--force-with-lease` and is not atomic.

## Restructure

```sh
gh stack modify            # reorder, rename, insert, drop, or fold
gh stack modify --continue # after resolving and staging conflicts
gh stack modify --abort
gh stack submit            # after successful remote restructuring
```

`modify` requires a clean, linear stack and is an interactive TUI; apply staged changes with `Ctrl+S`. Do not drive it through a supervised PTY that cannot reliably deliver control keys. If a watcher keeps regenerating files, stop it before stashing or restructuring rather than repeatedly stashing the same patch. Dropping a layer preserves its branch and PR.

### Consolidate a stack into one PR

Keep the top branch because it already contains every layer. For a non-interactive clean cutover:

```sh
gh stack unstack <stack-number>
gh pr edit <top-pr> --base <trunk>
gh pr close <superseded-pr> --comment "Combined into #<top-pr>."

git fetch origin <trunk>
git rebase origin/<trunk>
git push --force-with-lease origin <top-branch>
```

Close every superseded PR, update the surviving PR's title and body to describe the complete change, then verify its live `baseRefName`, `headRefName`, `mergeable`, and `mergeStateStatus` with `gh pr view --json`. This preserves the full commit history without relying on `modify`. For a large rebuild that must remain a stack, use `gh stack unstack`, then `gh stack init <branches-bottom-to-top>` and `gh stack submit`.

## Check out and navigate

```sh
gh stack checkout <stack-number|PR-number|PR-URL> # fetch remote stack locally
gh stack checkout <branch>                       # locally tracked stacks only
gh stack bottom # also: top, trunk
gh stack down   # also: up, switch
```

Source: https://docs.github.com/en/pull-requests/reference/stacked-prs-cli-commands
