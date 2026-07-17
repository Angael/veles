import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

const expectedDatabaseName = 'veles_dev';
const databaseUrl = process.env.DATABASE_URL;
const devUser = {
  id: 'qG07LJs8rynlLrMLsXLX7pdUskIbfHGw',
  name: 'Krzysztof Widacki',
  email: 'krzysztofwidacki@gmail.com',
  emailVerified: true,
  image:
    'https://lh3.googleusercontent.com/a/ACg8ocKZn5-2SPNdDEDK81bb4eBtRbn8K_cXFMJe-xXvdvTpcy6B3AP-=s96-c',
  createdAt: '2026-05-23T08:23:25.039Z',
  updatedAt: '2026-05-23T08:23:25.039Z',
};
const devAccount = {
  id: 'gmRClvZqFGhm8EJgMfNIPWBCGebKz5FB',
  accountId: '115846091622187499143',
  providerId: 'google',
  userId: devUser.id,
  scope:
    'https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/userinfo.email,openid',
  createdAt: '2026-05-23T08:23:25.075Z',
  updatedAt: '2026-07-15T21:22:28.896Z',
};

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
  await seedDatabase(connectionString);

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

/** Seeds the fixed dev identity and deterministic application fixtures. */
async function seedDatabase(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await assertDevDatabase(client);
    await client.query('BEGIN');
    await seedIdentity(client);
    await seedRecipes(client, devUser.id);
    await seedDiaryEntries(client, devUser.id);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function seedIdentity(client) {
  await client.query(
    `INSERT INTO "user"
      (id, name, email, email_verified, image, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       email = EXCLUDED.email,
       email_verified = EXCLUDED.email_verified,
       image = EXCLUDED.image,
       created_at = EXCLUDED.created_at,
       updated_at = EXCLUDED.updated_at`,
    [
      devUser.id,
      devUser.name,
      devUser.email,
      devUser.emailVerified,
      devUser.image,
      devUser.createdAt,
      devUser.updatedAt,
    ],
  );
  await client.query(
    `INSERT INTO account
      (id, account_id, provider_id, user_id, scope, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       account_id = EXCLUDED.account_id,
       provider_id = EXCLUDED.provider_id,
       user_id = EXCLUDED.user_id,
       scope = EXCLUDED.scope,
       created_at = EXCLUDED.created_at,
       updated_at = EXCLUDED.updated_at`,
    [
      devAccount.id,
      devAccount.accountId,
      devAccount.providerId,
      devAccount.userId,
      devAccount.scope,
      devAccount.createdAt,
      devAccount.updatedAt,
    ],
  );
}

async function seedRecipes(client, userId) {
  const recipes = [
    {
      id: '01900000-0000-7000-8000-000000000001',
      name: 'Weeknight tomato pasta',
      description: 'A quick pantry pasta for testing recipe views.',
      ingredients: ['200 g pasta', '400 g tomatoes', '2 garlic cloves', 'olive oil'],
      tags: ['quick', 'vegetarian'],
      portions: 2,
      rating: 4,
      kcal: 620,
      protein: 20,
      carbs: 98,
      fats: 16,
    },
    {
      id: '01900000-0000-7000-8000-000000000002',
      name: 'Oatmeal with berries',
      description: 'A deterministic breakfast fixture without uploaded images.',
      ingredients: ['80 g oats', '250 ml milk', '100 g berries'],
      tags: ['breakfast', 'quick'],
      portions: 1,
      rating: 5,
      kcal: 480,
      protein: 18,
      carbs: 72,
      fats: 12,
    },
  ];

  for (const recipe of recipes) {
    await client.query(
      `INSERT INTO recipe
        (id, user_id, name, description, ingredients, tags, portions, rating, kcal, protein, carbs, fats)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         ingredients = EXCLUDED.ingredients,
         tags = EXCLUDED.tags,
         portions = EXCLUDED.portions,
         rating = EXCLUDED.rating,
         kcal = EXCLUDED.kcal,
         protein = EXCLUDED.protein,
         carbs = EXCLUDED.carbs,
         fats = EXCLUDED.fats,
         updated_at = now()`,
      [
        recipe.id,
        userId,
        recipe.name,
        recipe.description,
        recipe.ingredients,
        recipe.tags,
        recipe.portions,
        recipe.rating,
        recipe.kcal,
        recipe.protein,
        recipe.carbs,
        recipe.fats,
      ],
    );
  }
}

async function seedDiaryEntries(client, userId) {
  const entries = [
    {
      id: '01900000-0000-7000-8000-000000000101',
      title: 'First seeded entry',
      markdown: 'A stable fixture for checking the diary list and detail views.',
      entryDate: '2026-01-12',
    },
    {
      id: '01900000-0000-7000-8000-000000000102',
      title: 'Markdown playground',
      markdown: '## Things to verify\n\n- headings\n- lists\n- **formatting**',
      entryDate: '2026-02-08',
    },
  ];

  for (const entry of entries) {
    await client.query(
      `INSERT INTO diary_entry (id, user_id, title, markdown, entry_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         title = EXCLUDED.title,
         markdown = EXCLUDED.markdown,
         entry_date = EXCLUDED.entry_date,
         updated_at = now()`,
      [entry.id, userId, entry.title, entry.markdown, entry.entryDate],
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
