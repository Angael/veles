import { Client } from 'pg';

const expectedDatabaseName = 'veles_dev';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

if (process.env.PROD_DATABASE_URL && databaseUrl === process.env.PROD_DATABASE_URL) {
  throw new Error('DATABASE_URL matches PROD_DATABASE_URL; refusing to seed it.');
}

await seedDatabase(databaseUrl);

/** Seeds deterministic dev fixtures for the sole user and is safe to run repeatedly. */
async function seedDatabase(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const database = await client.query('SELECT current_database() AS name');
    const databaseName = database.rows[0]?.name;

    if (databaseName !== expectedDatabaseName) {
      throw new Error(
        `Connected to ${JSON.stringify(databaseName)}, expected ${expectedDatabaseName}; refusing to seed.`,
      );
    }

    const users = await client.query('SELECT id FROM "user" ORDER BY id LIMIT 2');

    if (users.rowCount !== 1) {
      throw new Error(`Expected exactly one dev user, found ${users.rowCount}.`);
    }

    await client.query('BEGIN');
    await seedRecipes(client, users.rows[0].id);
    await seedDiaryEntries(client, users.rows[0].id);
    await client.query('COMMIT');
    console.info('Seeded deterministic recipe and diary fixtures.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
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
