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

/** Rebuilds the disposable dev database from migrations and fixed seed data. */
async function resetDatabase(connectionString) {
  await resetSchemas(connectionString);

  runPnpmScript('db:migrate');
  runPnpmScript('db:seed');

  console.info(`Reset and seeded ${expectedDatabaseName}.`);
}

async function resetSchemas(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await assertDevDatabase(client);
    await client.query('BEGIN');
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO PUBLIC');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
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
