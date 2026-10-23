import { spawnSync } from 'node:child_process';
import { Client } from 'pg';
import { createDatabaseConnection } from '../src/index.ts';
import { syncFoodProductSeeds } from '../src/seed/sync-food-products.ts';

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
  await syncFoodProductCatalog(connectionString);

  console.info(`Reset and seeded ${expectedDatabaseName}.`);
}

/** Adds the shared food catalog the same way the worker does on deploy. */
async function syncFoodProductCatalog(connectionString: string) {
  const connection = createDatabaseConnection({ connectionString, maxConnections: 1 });
  try {
    console.info('Synced food product seeds.', await syncFoodProductSeeds(connection.db));
  } finally {
    await connection.close();
  }
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
    await seedCalorieDayNotes(client, devUser.id);
    await seedWeights(client, devUser.id);
    await seedNotes(client, devUser.id);
    await seedWorkouts(client, devUser.id);
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
/** Seeds one recipe of custom ingredients only and one that links catalog products. */
async function seedRecipes(client: Client, userId: string) {
  const recipes = [
    {
      id: '01900000-0000-7000-8000-000000000001',
      name: 'Weeknight tomato pasta',
      description: 'A quick pantry pasta for testing recipe views.',
      ingredients: [
        { name: 'Pasta', grams: 200, productId: null },
        { name: 'Tomatoes', grams: 400, productId: null },
        { name: '2 garlic cloves', grams: null, productId: null },
        { name: 'Olive oil', grams: null, productId: null },
      ],
      tags: ['quick', 'vegetarian'],
      portions: 2,
      rating: 4,
    },
    {
      id: '01900000-0000-7000-8000-000000000002',
      name: 'Fruity toast breakfast',
      description: 'A deterministic breakfast fixture with linked products and no images.',
      ingredients: [
        {
          name: 'Whole-grain bread',
          grams: 120,
          productId: '01900000-0000-7000-8000-000000000205',
        },
        { name: 'Banana', grams: 120, productId: '01900000-0000-7000-8000-000000000201' },
        { name: 'Apple', grams: 150, productId: '01900000-0000-7000-8000-000000000202' },
        { name: 'Cinnamon', grams: null, productId: null },
      ],
      tags: ['breakfast', 'quick'],
      portions: 2,
      rating: 5,
    },
  ];

  for (const recipe of recipes) {
    await client.query(
      `INSERT INTO recipe (id, user_id, name, description, tags, portions, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         tags = EXCLUDED.tags,
         portions = EXCLUDED.portions,
         rating = EXCLUDED.rating,
         updated_at = now()`,
      [
        recipe.id,
        userId,
        recipe.name,
        recipe.description,
        recipe.tags,
        recipe.portions,
        recipe.rating,
      ],
    );
    await client.query('DELETE FROM recipe_ingredient WHERE recipe_id = $1', [recipe.id]);
    for (const [position, ingredient] of recipe.ingredients.entries()) {
      await client.query(
        `INSERT INTO recipe_ingredient (recipe_id, position, product_id, name, grams_hundredths)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          recipe.id,
          position,
          ingredient.productId,
          ingredient.name,
          ingredient.grams === null ? null : ingredient.grams * 100,
        ],
      );
    }
  }
}

/** Returns the UTC calendar date `days` before today, so fixtures stay on the rolling dashboard. */
function daysAgo(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Seeds one off-plan day and a plain note on the food diary history. */
async function seedCalorieDayNotes(client: Client, userId: string) {
  const dayNotes = [
    { daysAgo: 12, offPlan: true, note: 'Birthday party, stopped logging after lunch.' },
    { daysAgo: 4, offPlan: false, note: 'Felt hungry all day, more protein tomorrow.' },
  ];

  for (const dayNote of dayNotes) {
    await client.query(
      `INSERT INTO calorie_day_note (user_id, date, off_plan, note) VALUES ($1, $2, $3, $4)`,
      [userId, dateKey(daysAgo(dayNote.daysAgo)), dayNote.offPlan, dayNote.note],
    );
  }
}

/** Seeds a slow cutting trend over five weeks, with a few skipped weigh-ins. */
async function seedWeights(client: Client, userId: string) {
  for (let day = 34; day >= 0; day--) {
    if (day % 6 === 3) continue;

    const trendGrams = 82_000 - (34 - day) * 60;
    const noiseGrams = ((day * 37) % 7) * 100 - 300;
    await client.query(
      `INSERT INTO weight_entry (user_id, weight_grams, date) VALUES ($1, $2, $3)`,
      [userId, trendGrams + noiseGrams, dateKey(daysAgo(day))],
    );
  }
}

/** Seeds a plain note and a partly checked shopping list. */
async function seedNotes(client: Client, userId: string) {
  const noteResult = await client.query<{ id: string }>(
    `INSERT INTO note (type, title, content, owner_id) VALUES ('note', $1, $2, $3) RETURNING id`,
    [
      'Meal prep ideas',
      'Chicken rice bowls for Monday to Wednesday.\nTry the salmon with potatoes on Friday.',
      userId,
    ],
  );

  if (!noteResult.rows[0]) {
    throw new Error('Failed to seed note.');
  }

  const listResult = await client.query<{ id: string }>(
    `INSERT INTO note (type, title, owner_id) VALUES ('shopping_list', $1, $2) RETURNING id`,
    ['Groceries', userId],
  );
  const listId = listResult.rows[0]?.id;

  if (!listId) {
    throw new Error('Failed to seed shopping list.');
  }

  const items = [
    { name: 'Chicken breast', checked: true },
    { name: 'Rice', checked: true },
    { name: 'Greek yogurt', checked: false },
    { name: 'Bananas', checked: false },
    { name: 'Oats', checked: false },
  ];

  for (const item of items) {
    await client.query(`INSERT INTO list_item (note_id, name, checked) VALUES ($1, $2, $3)`, [
      listId,
      item.name,
      item.checked,
    ]);
  }
}

type SeedSlot = { key: string; notes: string; sets: SeedSet[] };

type SeedSet = {
  type?: 'normal' | 'warmup' | 'drop' | 'failure';
  kg?: number;
  reps?: number;
  seconds?: number;
  meters?: number;
};

/**
 * Seeds exercises, two routines, and finished sessions over the last two weeks.
 * Working weights rise slightly between sessions, so progress views have a trend.
 */
async function seedWorkouts(client: Client, userId: string) {
  const exercises = [
    { key: 'bench', name: 'Bench press', measure: 'weight_reps', restSeconds: 150 },
    { key: 'ohp', name: 'Overhead press', measure: 'weight_reps', restSeconds: 120 },
    { key: 'pullup', name: 'Pull-up', measure: 'reps', restSeconds: 120 },
    { key: 'squat', name: 'Back squat', measure: 'weight_reps', restSeconds: 180 },
    { key: 'deadlift', name: 'Romanian deadlift', measure: 'weight_reps', restSeconds: 150 },
    { key: 'plank', name: 'Plank', measure: 'duration', restSeconds: 60 },
    { key: 'run', name: 'Running', measure: 'distance_duration', restSeconds: null },
  ] as const;
  const exerciseIds = new Map<string, string>();

  for (const exercise of exercises) {
    const result = await client.query<{ id: string }>(
      `INSERT INTO workout_exercise (user_id, name, measure, rest_seconds)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, exercise.name, exercise.measure, exercise.restSeconds],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new Error(`Failed to seed exercise ${exercise.name}.`);
    exerciseIds.set(exercise.key, id);
  }

  const exerciseId = (key: string) => {
    const id = exerciseIds.get(key);
    if (!id) throw new Error(`Unknown seed exercise ${key}.`);
    return id;
  };
  const routines = [
    {
      key: 'upper',
      name: 'Upper body',
      description: 'Push and pull, twice a week.',
      exercises: [
        { key: 'bench', setTypes: ['warmup', 'normal', 'normal', 'normal'] },
        { key: 'ohp', setTypes: ['normal', 'normal', 'normal'] },
        { key: 'pullup', setTypes: ['normal', 'normal', 'failure'] },
      ],
    },
    {
      key: 'lower',
      name: 'Lower body',
      description: '',
      exercises: [
        { key: 'squat', setTypes: ['warmup', 'normal', 'normal', 'normal'] },
        { key: 'deadlift', setTypes: ['normal', 'normal', 'normal'] },
        { key: 'plank', setTypes: ['normal', 'normal'] },
      ],
    },
  ] as const;
  const routineIds = new Map<string, string>();

  for (const routine of routines) {
    const result = await client.query<{ id: string }>(
      `INSERT INTO workout_routine (user_id, name, description) VALUES ($1, $2, $3) RETURNING id`,
      [userId, routine.name, routine.description],
    );
    const routineId = result.rows[0]?.id;
    if (!routineId) throw new Error(`Failed to seed routine ${routine.name}.`);
    routineIds.set(routine.key, routineId);

    for (const [position, slot] of routine.exercises.entries()) {
      await client.query(
        `INSERT INTO workout_routine_exercise (routine_id, exercise_id, position, set_types)
         VALUES ($1, $2, $3, $4)`,
        [routineId, exerciseId(slot.key), position, slot.setTypes],
      );
    }
  }

  const upper = (step: number): SeedSlot[] => [
    {
      key: 'bench',
      notes: step === 0 ? 'Pause on chest.' : '',
      sets: [
        { type: 'warmup', kg: 40, reps: 10 },
        { kg: 70 + step * 2.5, reps: 8 },
        { kg: 70 + step * 2.5, reps: 8 },
        { kg: 70 + step * 2.5, reps: 7 },
      ],
    },
    {
      key: 'ohp',
      notes: '',
      sets: [
        { kg: 40 + step * 1.25, reps: 8 },
        { kg: 40 + step * 1.25, reps: 8 },
        { kg: 40 + step * 1.25, reps: 6 },
      ],
    },
    {
      key: 'pullup',
      notes: '',
      sets: [{ reps: 8 + step }, { reps: 7 + step }, { type: 'failure', reps: 6 + step }],
    },
  ];
  const lower = (step: number): SeedSlot[] => [
    {
      key: 'squat',
      notes: step === 0 ? 'Knees out, belt on top sets.' : '',
      sets: [
        { type: 'warmup', kg: 60, reps: 8 },
        { kg: 100 + step * 5, reps: 5 },
        { kg: 100 + step * 5, reps: 5 },
        { kg: 100 + step * 5, reps: 5 },
      ],
    },
    {
      key: 'deadlift',
      notes: '',
      sets: [
        { kg: 90 + step * 5, reps: 8 },
        { kg: 90 + step * 5, reps: 8 },
        { kg: 90 + step * 5, reps: 8 },
      ],
    },
    { key: 'plank', notes: '', sets: [{ seconds: 60 + step * 15 }, { seconds: 60 + step * 15 }] },
  ];
  const sessions: {
    daysAgo: number;
    name: string;
    routineKey?: string;
    durationSeconds?: number;
    exercises: SeedSlot[];
  }[] = [
    { daysAgo: 13, name: 'Upper body', routineKey: 'upper', exercises: upper(0) },
    { daysAgo: 11, name: 'Lower body', routineKey: 'lower', exercises: lower(0) },
    {
      daysAgo: 9,
      name: 'Morning run',
      exercises: [{ key: 'run', notes: '', sets: [{ meters: 5_000, seconds: 1_620 }] }],
    },
    { daysAgo: 8, name: 'Upper body', routineKey: 'upper', exercises: upper(1) },
    { daysAgo: 6, name: 'Lower body', routineKey: 'lower', exercises: lower(1) },
    { daysAgo: 5, name: 'Football', durationSeconds: 90 * 60, exercises: [] },
    { daysAgo: 3, name: 'Upper body', routineKey: 'upper', exercises: upper(2) },
    { daysAgo: 1, name: 'Lower body', routineKey: 'lower', exercises: lower(2) },
  ];

  for (const session of sessions) {
    const startedAt = daysAgo(session.daysAgo);
    startedAt.setUTCHours(17, 30);
    let setTime = startedAt.getTime();
    const endedAt = new Date(startedAt.getTime() + (session.durationSeconds ?? 60 * 60) * 1000);
    const result = await client.query<{ id: string }>(
      `INSERT INTO workout_session (user_id, name, routine_id, date, started_at, ended_at, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        userId,
        session.name,
        session.routineKey ? routineIds.get(session.routineKey) : null,
        dateKey(daysAgo(session.daysAgo)),
        startedAt,
        endedAt,
        session.durationSeconds ?? null,
      ],
    );
    const sessionId = result.rows[0]?.id;
    if (!sessionId) throw new Error(`Failed to seed session ${session.name}.`);

    for (const [position, slot] of session.exercises.entries()) {
      const slotResult = await client.query<{ id: string }>(
        `INSERT INTO workout_session_exercise (session_id, exercise_id, position, notes)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [sessionId, exerciseId(slot.key), position, slot.notes],
      );
      const sessionExerciseId = slotResult.rows[0]?.id;
      if (!sessionExerciseId) throw new Error(`Failed to seed session exercise ${slot.key}.`);

      for (const [setPosition, set] of slot.sets.entries()) {
        setTime += 3 * 60 * 1000;
        await client.query(
          `INSERT INTO workout_set
            (session_exercise_id, position, type, weight_grams, reps, duration_seconds, distance_meters, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            sessionExerciseId,
            setPosition,
            set.type ?? 'normal',
            set.kg === undefined ? null : Math.round(set.kg * 1000),
            set.reps ?? null,
            set.seconds ?? null,
            set.meters ?? null,
            new Date(Math.min(setTime, endedAt.getTime())),
          ],
        );
      }
    }
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
