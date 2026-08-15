---
name: pr-stack
description: Use when creating, updating, or restacking PR stacks
---

# PR Stacks

- Name branches `stack/<group-slug>/<two-digit-order>/<branch-title>`.
- Restack with `node scripts/restack-pr-stack.mjs <branches-in-order...>`.
- Resolve and stage conflicts, then rerun the command.
- Always sync every rewritten stack branch with GitHub.
