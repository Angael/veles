---
name: drizzle-kit-flow
description: Use when changing Drizzle schemas or handling Drizzle Kit push, generate, migrations, snapshots, dev databases, or production database deployment in Veles.
---

# Drizzle Kit Flow

Keep experimental dev state separate from the migration history deployed to production.

## Agent Constraint

- Never run Drizzle commands. Tell the user which command must be run and when.
- Never modify or delete an existing migration unless it is confirmed to be unshipped branch-only work.

## Development Flow

While iterating on `src/db/schema`:

1. Change the schema.
2. Ask the user to run `pnpm db:push` against the disposable dev database.
3. Repeat as needed. Do not generate migrations for intermediate experiments.

When the schema is final:

1. Ask the user to run `pnpm db:generate -- --name=<feature>`.
2. Review the generated SQL and snapshot.
3. Ask the user to run `pnpm db:reset`; it resets the app and Drizzle schemas, migrates from scratch, and inserts the fixed dev identity and fixtures.
4. Verify the application against the fully migrated database.
5. Commit the schema and migration together.

Do not run `migrate` on a database already changed with `push`: its schema and `__drizzle_migrations` history can disagree.

## Replacing A Bad Migration

If a migration exists only on the current branch and has never been deployed or shared:

1. Restore the migration directory to the `main` state by removing only that branch's generated migration files.
2. Keep the final desired schema.
3. Generate one clean migration.
4. Ask the user to run `pnpm db:reset` to test all migrations from scratch.

Delete a generated migration and its snapshot as one unit. Do not hand-edit snapshots.

Multiple migrations in one PR are appropriate when they are intentional deployment stages, such as add nullable column, backfill data, then add `NOT NULL`. If a later migration only fixes an unshipped mistake, replace the branch-only sequence with one clean migration.

## Production Rules

- Never use `push` against production.
- `pnpm db:reset` is dev-only and must refuse any database other than `veles_dev`.
- Never edit or delete a migration that reached production. Add a forward-fix migration.
- Production flow is: schema change, generate, review SQL, commit, then `pnpm db:migrate:prod` as one controlled deployment step.
- The human must run required production migrations before pushing or merging to `main` because pushing `main` deploys the application.
- Back up before destructive changes.
- Use compatible staged deployments for rename, drop, and `NOT NULL`: add the new shape, migrate data and application usage, then remove the old shape later.
