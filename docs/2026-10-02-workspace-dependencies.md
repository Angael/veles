# Workspace dependency ownership

## Context

[Issue #174](https://github.com/Angael/veles/issues/174) asks whether the preview
controller's tooling and shared dependencies should move to the workspace root.
Veles has four workspace packages and independently built application images.
Keep dependency ownership explicit without adding configuration packages for this
solo hobby app.

## Decision

Keep the current dependency layout and exact version pins:

| Dependency or configuration                                         | Owner                                      | Reason                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| oxlint, oxfmt, oxlint-tsgolint, and ESLint plugins loaded by oxlint | Root `devDependencies`                     | Repository-wide commands and configuration use them.                                                  |
| `.oxlintrc.json`                                                    | Root                                       | `pnpm lint` already checks the whole repository with one configuration.                               |
| `typescript`                                                        | Root and each package's `devDependencies`  | Root tooling and each package's build/typecheck commands declare their own compiler requirement.      |
| `@types/node`                                                       | Each consuming package's `devDependencies` | These are compile-time inputs to the package, including the preview app's explicit `types: ["node"]`. |
| `arktype`, `drizzle-orm`, and other runtime imports                 | Each consuming package's `dependencies`    | Each application or library must carry its own runtime requirements.                                  |
| Web CSS tooling and `stylelint.config.mjs`                          | Web `devDependencies`; config at root      | Only the web app uses CSS linting; its package scripts run that tooling.                              |

No shared ESLint/oxlint package is needed: `.oxlintrc.json` already provides the
shared configuration, including the TanStack ESLint plugins through oxlint's
`jsPlugins`. Add overrides there if a package later needs different rules.

## Resolution and deployment

pnpm's [script environment](https://pnpm.io/cli/run#details) adds the workspace
root's `node_modules/.bin` to package script paths. A root-only compiler could
therefore make a package's typecheck work in a full checkout. That convenience
does not describe the package's own tool requirements, so keep its compiler
declaration too.

Likewise, ordinary Node module resolution can reach an ancestor's `node_modules`.
An import working in a full checkout is not sufficient evidence that the
consumer declares the dependency it needs. Keep runtime dependencies in the
consumer's manifest, even when another package uses the same version.

The Dockerfiles make this distinction concrete:

- The web builder copies root, web, and database manifests and installs with
  `pnpm --filter @veles/web... install --frozen-lockfile`. It needs development
  tooling to build. The runner copies only the generated `.output` directory.
- The worker copies root, worker, and database manifests and installs with
  `pnpm --filter @veles/worker... install --frozen-lockfile --prod`.
- The preview image copies root and preview manifests and installs with
  `pnpm install --frozen-lockfile --prod --filter @veles/preview`.

The worker and preview execute TypeScript source using Node's type stripping;
they do not need the TypeScript compiler or Node type definitions at runtime.
pnpm's [`--prod` option](https://pnpm.io/cli/install#--prod--p) excludes development
dependencies. Moving a runtime dependency such as `arktype` into root
`devDependencies` would therefore break the preview production install. Moving
it into root `dependencies` would instead couple applications to root runtime
requirements and ancestor resolution. Neither is a reason to remove the
consumer's declaration.

## Alternatives

- **Root-only build tools:** Fewer manifest entries, but package commands rely on
  the workspace root to supply their compiler and type inputs. Keep explicit
  package requirements for the filtered build environments.
- **pnpm catalogs:** [Catalogs](https://pnpm.io/catalogs) can centralize exact
  version pins while retaining each consumer's dependency declaration through
  `catalog:` references. They address version synchronization, not ownership.
  With four packages and matching shared pins, keep literal versions for now.
  Revisit catalogs if shared-version drift or repetitive upgrades become a
  recurring maintenance problem; any catalog entries must remain exactly pinned.
- **Shared configuration package:** Useful across repositories or with several
  package-specific configurations. One root oxlint configuration is sufficient
  here.

## Verification

Checked with pnpm 12.3.4 and Node 26.2.0 in temporary directories outside the
checkout. Each directory contained only the root manifest, lockfile, workspace
configuration, and package manifests copied by the corresponding Dockerfile.
All three frozen installs above passed. The web builder installed its declared
compiler, Node types, `arktype`, and database package; preview and worker retained
their declared runtime dependency links and omitted the compiler and Node types
from both the root and application `node_modules`.

This verifies the install layout, not Docker image execution or the web output
bundle. No dependency versions, manifests, lockfile, or Dockerfiles need changing
for this decision.
