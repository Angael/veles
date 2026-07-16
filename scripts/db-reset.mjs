import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

const expectedDatabaseName = 'veles_dev';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

if (process.env.PROD_DATABASE_URL && databaseUrl === process.env.PROD_DATABASE_URL) {
  throw new Error('DATABASE_URL matches PROD_DATABASE_URL; refusing to reset it.');
}

await resetDatabase(databaseUrl);

/** Preserves the sole dev identity, rebuilds the database, then restores identity and seed data. */
async function resetDatabase(connectionString) {
  const userEmail = await backUpIdentityAndResetSchemas(connectionString);

  runPnpmScript('db:migrate');
  await restoreIdentity(connectionString);
  runPnpmScript('db:seed');
  await removeIdentityBackup(connectionString);

  console.info(`Reset ${expectedDatabaseName}, restored ${userEmail}, and seeded dev data.`);
}

/** Backs up auth identity inside dev DB so a failed migration cannot permanently lose the login. */
async function backUpIdentityAndResetSchemas(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await assertDevDatabase(client);
    const backupExists = await client.query(
      `SELECT to_regclass('veles_reset_backup.user_identity') IS NOT NULL AS exists`,
    );

    if (backupExists.rows[0].exists) {
      const backupUsers = await client.query(
        'SELECT email FROM veles_reset_backup.user_identity LIMIT 2',
      );

      if (backupUsers.rowCount !== 1) {
        throw new Error('Existing reset backup does not contain exactly one user.');
      }

      await client.query('BEGIN');
      await resetSchemas(client);
      await client.query('COMMIT');
      return backupUsers.rows[0].email;
    }

    const users = await client.query('SELECT id, email FROM "user" ORDER BY id LIMIT 2');

    if (users.rowCount !== 1) {
      throw new Error(`Expected exactly one dev user, found ${users.rowCount}.`);
    }

    const user = users.rows[0];
    const accounts = await client.query('SELECT id FROM account WHERE user_id = $1 ORDER BY id', [
      user.id,
    ]);

    if (accounts.rowCount === 0) {
      throw new Error('The dev user has no account row; refusing to reset login data.');
    }

    await client.query('BEGIN');
    await client.query('CREATE SCHEMA veles_reset_backup');
    await client.query(
      `CREATE TABLE veles_reset_backup.user_identity AS
       SELECT id, name, email, email_verified, image, created_at, updated_at
       FROM "user"
       WHERE id = $1`,
      [user.id],
    );
    await client.query(
      `CREATE TABLE veles_reset_backup.account_identity AS
       SELECT id, account_id, provider_id, user_id, scope, password, created_at, updated_at
       FROM account
       WHERE user_id = $1`,
      [user.id],
    );
    await resetSchemas(client);
    await client.query('COMMIT');

    return user.email;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

/** Restores stable Better Auth identity fields while intentionally discarding sessions and OAuth tokens. */
async function restoreIdentity(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await assertDevDatabase(client);
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO "user"
        (id, name, email, email_verified, image, created_at, updated_at)
       SELECT id, name, email, email_verified, image, created_at, updated_at
       FROM veles_reset_backup.user_identity`,
    );
    await client.query(
      `INSERT INTO account
        (id, account_id, provider_id, user_id, scope, password, created_at, updated_at)
       SELECT id, account_id, provider_id, user_id, scope, password, created_at, updated_at
       FROM veles_reset_backup.account_identity`,
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function resetSchemas(client) {
  await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.query('GRANT ALL ON SCHEMA public TO PUBLIC');
}

async function removeIdentityBackup(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await assertDevDatabase(client);
    await client.query('DROP SCHEMA veles_reset_backup CASCADE');
  } finally {
    await client.end();
  }
}

async function assertDevDatabase(client) {
  const result = await client.query('SELECT current_database() AS name');
  const databaseName = result.rows[0]?.name;

  if (databaseName !== expectedDatabaseName) {
    throw new Error(
      `Connected to ${JSON.stringify(databaseName)}, expected ${expectedDatabaseName}; refusing destructive operation.`,
    );
  }
}

function runPnpmScript(script) {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(command, [script], { env: process.env, stdio: 'inherit' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`pnpm ${script} failed with exit code ${result.status}.`);
  }
}
