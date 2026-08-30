import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

const expectedDatabaseName = 'veles_dev';
const databaseUrl = process.env.DATABASE_URL;
const devUser = {
  id: 'qG07LJs8rynlLrMLsXLX7pdUskIbfHGw',
  name: 'Krzysztof Widacki',
  email: 'dev-user@example.test',
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
const devCalorieGoal = {
  kcal: 1_900,
  protein: 160,
  fat: 60,
  carbs: 180,
};
const foodProducts = [
  {
    id: '01900000-0000-7000-8000-000000000201',
    name: 'Banana',
    kcalPer100gHundredths: 8_900,
    proteinPer100gHundredths: 110,
    fatPer100gHundredths: 30,
    carbsPer100gHundredths: 2_280,
  },
  {
    id: '01900000-0000-7000-8000-000000000202',
    name: 'Apple',
    kcalPer100gHundredths: 5_200,
    proteinPer100gHundredths: 30,
    fatPer100gHundredths: 20,
    carbsPer100gHundredths: 1_380,
  },
  {
    id: '01900000-0000-7000-8000-000000000203',
    name: 'Orange',
    kcalPer100gHundredths: 4_700,
    proteinPer100gHundredths: 90,
    fatPer100gHundredths: 10,
    carbsPer100gHundredths: 1_180,
  },
  {
    id: '01900000-0000-7000-8000-000000000204',
    name: 'White bread',
    kcalPer100gHundredths: 26_600,
    proteinPer100gHundredths: 890,
    fatPer100gHundredths: 320,
    carbsPer100gHundredths: 4_940,
  },
  {
    id: '01900000-0000-7000-8000-000000000205',
    name: 'Whole-grain bread',
    kcalPer100gHundredths: 24_700,
    proteinPer100gHundredths: 1_300,
    fatPer100gHundredths: 420,
    carbsPer100gHundredths: 4_140,
  },
  {
    id: '01900000-0000-7000-8000-000000000206',
    name: 'Oatmeal with berries',
    kcalPer100gHundredths: 13_500,
    proteinPer100gHundredths: 450,
    fatPer100gHundredths: 380,
    carbsPer100gHundredths: 2_050,
  },
  {
    id: '01900000-0000-7000-8000-000000000207',
    name: 'Chicken rice bowl',
    kcalPer100gHundredths: 16_500,
    proteinPer100gHundredths: 1_350,
    fatPer100gHundredths: 420,
    carbsPer100gHundredths: 1_850,
  },
  {
    id: '01900000-0000-7000-8000-000000000208',
    name: 'Salmon with potatoes',
    kcalPer100gHundredths: 17_800,
    proteinPer100gHundredths: 1_120,
    fatPer100gHundredths: 720,
    carbsPer100gHundredths: 1_420,
  },
  {
    id: '01900000-0000-7000-8000-000000000209',
    name: 'Greek yogurt with granola',
    kcalPer100gHundredths: 14_200,
    proteinPer100gHundredths: 850,
    fatPer100gHundredths: 480,
    carbsPer100gHundredths: 1_620,
  },
  {
    id: '01900000-0000-7000-8000-000000000210',
    name: 'Pasta bolognese',
    kcalPer100gHundredths: 15_700,
    proteinPer100gHundredths: 820,
    fatPer100gHundredths: 510,
    carbsPer100gHundredths: 2_180,
  },
];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

if (process.env.PROD_DATABASE_URL && databaseUrl === process.env.PROD_DATABASE_URL) {
  throw new Error('DATABASE_URL matches PROD_DATABASE_URL; refusing to reset it.');
}

await resetDatabase(databaseUrl);

/** Rebuilds the disposable dev database from migrations, current schema, and fixed seed data. */
async function resetDatabase(connectionString: string) {
  await resetSchemas(connectionString);

  runPnpmScript('db:migrate');
  runPnpmScript('db:push');
  await seedDatabase(connectionString);

  console.info(`Reset and seeded ${expectedDatabaseName}.`);
}

async function resetSchemas(connectionString: string) {
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

async function assertDevDatabase(client: Client) {
  const result = await client.query<{ name: string }>('SELECT current_database() AS name');
  const databaseName = result.rows[0]?.name;

  if (databaseName !== expectedDatabaseName) {
    throw new Error(
      `Connected to ${JSON.stringify(databaseName)}, expected ${expectedDatabaseName}; refusing destructive operation.`,
    );
  }
}

/** Seeds the fixed dev identity and deterministic application fixtures. */
async function seedDatabase(connectionString: string) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await assertDevDatabase(client);
    await client.query('BEGIN');
    await seedIdentity(client);
    await seedCalorieGoal(client, devUser.id);
    await seedFoodProducts(client);
    await seedFoodLogs(client, devUser.id);
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

async function seedIdentity(client: Client) {
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

/** Seeds an 80 kg lifter's balanced cutting targets, effective across the dashboard history. */
async function seedCalorieGoal(client: Client, userId: string) {
  const effectiveDate = new Date();
  effectiveDate.setUTCHours(0, 0, 0, 0);
  effectiveDate.setUTCDate(effectiveDate.getUTCDate() - 13);

  await client.query(
    `INSERT INTO calorie_goal (
      user_id,
      effective_date,
      kcal_limit_hundredths,
      protein_limit_hundredths,
      fat_limit_hundredths,
      carbs_limit_hundredths
    )
    VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      effectiveDate.toISOString().slice(0, 10),
      devCalorieGoal.kcal * 100,
      devCalorieGoal.protein * 100,
      devCalorieGoal.fat * 100,
      devCalorieGoal.carbs * 100,
    ],
  );
}

/** Seeds the shared staple catalog without assigning products to any user. */
async function seedFoodProducts(client: Client) {
  for (const product of foodProducts) {
    await client.query(
      `INSERT INTO food_product
        (id, name, kcal_per_100g_hundredths, protein_per_100g_hundredths, fat_per_100g_hundredths, carbs_per_100g_hundredths)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         barcode = NULL,
         name = EXCLUDED.name,
         brand = NULL,
         image_url = NULL,
         product_size_grams_hundredths = NULL,
         kcal_per_100g_hundredths = EXCLUDED.kcal_per_100g_hundredths,
         protein_per_100g_hundredths = EXCLUDED.protein_per_100g_hundredths,
         fat_per_100g_hundredths = EXCLUDED.fat_per_100g_hundredths,
         carbs_per_100g_hundredths = EXCLUDED.carbs_per_100g_hundredths,
         updated_at = now()`,
      [
        product.id,
        product.name,
        product.kcalPer100gHundredths,
        product.proteinPer100gHundredths,
        product.fatPer100gHundredths,
        product.carbsPer100gHundredths,
      ],
    );
  }
}

/**
 * Seeds a rolling two-week dashboard history with one deliberately unlogged day.
 * Daily totals vary around a 1,900 kcal goal while meal size and timing remain plausible.
 */
async function seedFoodLogs(client: Client, userId: string) {
  const dailyKcalTargets = [
    1_900,
    2_500,
    1_750,
    2_050,
    1_820,
    2_200,
    1_680,
    null,
    1_940,
    2_350,
    1_760,
    2_100,
    1_880,
    1_900,
  ];
  const mealPlans = [
    [foodProducts[5], foodProducts[6], foodProducts[8], foodProducts[7]],
    [foodProducts[8], foodProducts[9], foodProducts[1], foodProducts[6]],
    [foodProducts[5], foodProducts[7], foodProducts[0], foodProducts[9]],
  ];
  const mealShares = [0.22, 0.34, 0.1, 0.34];
  const mealHours = [8, 13, 16, 19];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const [dayIndex, dailyKcal] of dailyKcalTargets.entries()) {
    if (dailyKcal === null) continue;

    const logDate = new Date(today);
    logDate.setUTCDate(today.getUTCDate() - (dailyKcalTargets.length - dayIndex - 1));
    const date = logDate.toISOString().slice(0, 10);
    const mealPlan = mealPlans[dayIndex % mealPlans.length];

    if (!mealPlan) {
      throw new Error(`Missing meal plan for day ${dayIndex}.`);
    }

    let assignedKcalHundredths = 0;

    for (const [mealIndex, product] of mealPlan.entries()) {
      const mealShare = mealShares[mealIndex];
      const mealHour = mealHours[mealIndex];

      if (!product || mealShare === undefined || mealHour === undefined) {
        throw new Error(`Incomplete meal fixture at day ${dayIndex}, meal ${mealIndex}.`);
      }

      const kcalHundredths =
        mealIndex === mealPlan.length - 1
          ? dailyKcal * 100 - assignedKcalHundredths
          : Math.round(dailyKcal * 100 * mealShare);
      assignedKcalHundredths += kcalHundredths;
      const gramsHundredths = Math.round(
        (kcalHundredths * 100 * 100) / product.kcalPer100gHundredths,
      );
      const scaleMacro = (value: number) => Math.round((value * gramsHundredths) / (100 * 100));
      const consumedAt = new Date(logDate);
      consumedAt.setUTCHours(mealHour, 15 + ((dayIndex * 7 + mealIndex * 3) % 30));

      await client.query(
        `INSERT INTO food_log
          (user_id, product_id, name, grams_hundredths, log_date, kcal_hundredths,
           protein_hundredths, fat_hundredths, carbs_hundredths, consumed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          product.id,
          product.name,
          gramsHundredths,
          date,
          kcalHundredths,
          scaleMacro(product.proteinPer100gHundredths),
          scaleMacro(product.fatPer100gHundredths),
          scaleMacro(product.carbsPer100gHundredths),
          consumedAt,
        ],
      );
    }
  }
}

async function seedRecipes(client: Client, userId: string) {
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
      fat: 16,
      carbs: 98,
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
      fat: 12,
      carbs: 72,
    },
  ];

  for (const recipe of recipes) {
    await client.query(
      `INSERT INTO recipe
        (id, user_id, name, description, ingredients, tags, portions, rating, kcal, protein, fats, carbs)
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
         fats = EXCLUDED.fats,
         carbs = EXCLUDED.carbs,
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
        recipe.fat,
        recipe.carbs,
      ],
    );
  }
}

async function seedDiaryEntries(client: Client, userId: string) {
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

function runPnpmScript(script: string) {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(command, [script], { env: process.env, stdio: 'inherit' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`pnpm ${script} failed with exit code ${result.status}.`);
  }
}
