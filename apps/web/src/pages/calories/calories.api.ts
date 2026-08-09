import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, lte, sql } from 'drizzle-orm';
import { isMatch } from 'date-fns';
import { calorieGoals, foodLogs, foodProducts, type FoodProductSource } from '@veles/db/schema';
import { requireSession } from '@/lib/auth/getSession';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/lib/db';
import { logMiddleware } from '@/lib/middleware/logMiddleware';

const HUNDREDTHS = 100;
const MAX_TEXT_LENGTH = 500;

export type CalorieFood = {
  barcode: string | null;
  brand: string | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  id: string;
  imageUrl: string | null;
  kcalPer100g: number;
  name: string;
  proteinPer100g: number | null;
  servingSize: string | null;
  source: FoodProductSource;
};

export type CalorieLog = {
  carbs: number | null;
  consumedAt: string;
  fat: number | null;
  grams: number | null;
  id: string;
  kcal: number;
  kind: 'product' | 'custom';
  name: string;
  productId: string | null;
  protein: number | null;
};

export type CalorieTotals = {
  carbs: number | null;
  fat: number | null;
  kcal: number;
  protein: number | null;
};

export type CalorieGoal = {
  date: string;
  id: string;
  kcal: number;
};

export type CalorieDashboard = {
  date: string;
  goal: CalorieGoal | null;
  logs: CalorieLog[];
  recentFoods: CalorieFood[];
  totals: CalorieTotals;
};

export type BarcodeLookupResult = { food: CalorieFood; status: 'found' } | { status: 'notFound' };

const localDateType = type('string.date.iso').narrow((value, ctx) =>
  isMatch(value, 'yyyy-MM-dd') ? true : ctx.mustBe('a valid YYYY-MM-DD calendar date'),
);

const nonNegativeAmountType = type('number >= 0').narrow((value, ctx) =>
  Number.isFinite(value) && Number.isSafeInteger(Math.round(value * HUNDREDTHS))
    ? true
    : ctx.mustBe('a finite number with at most two decimal places'),
);

const nonEmptyTextType = type(`string.trim |> 1 <= string <= ${MAX_TEXT_LENGTH}`);
const timestampType = type('Date | string').narrow((value, ctx) => {
  const timestamp = value instanceof Date ? value : new Date(value);
  return Number.isFinite(timestamp.getTime()) ? true : ctx.mustBe('a valid timestamp');
});

const dashboardInputType = type({ date: localDateType });
const barcodeInputType = type({ barcode: nonEmptyTextType });
const createFoodProductInputType = type({
  'barcode?': nonEmptyTextType,
  'brand?': nonEmptyTextType,
  'carbsPer100g?': nonNegativeAmountType,
  'fatPer100g?': nonNegativeAmountType,
  'imageUrl?': type('string.url'),
  kcalPer100g: nonNegativeAmountType,
  name: nonEmptyTextType,
  'proteinPer100g?': nonNegativeAmountType,
  'servingSize?': nonEmptyTextType,
});
const recordFoodInputType = type({
  'consumedAt?': timestampType,
  grams: nonNegativeAmountType,
  productId: 'string.uuid',
});
const recordCustomCaloriesInputType = type({
  'carbs?': nonNegativeAmountType,
  'consumedAt?': timestampType,
  'fat?': nonNegativeAmountType,
  'grams?': nonNegativeAmountType,
  kcal: nonNegativeAmountType,
  name: nonEmptyTextType,
  'protein?': nonNegativeAmountType,
});
const setDailyCalorieGoalInputType = type({
  date: localDateType,
  kcal: type('number > 0').narrow((value, ctx) =>
    Number.isSafeInteger(Math.round(value * HUNDREDTHS))
      ? true
      : ctx.mustBe('a finite number with at most two decimal places'),
  ),
});

type TimestampInput = Date | string;
type OpenFoodFactsNumber = number | string | null | undefined;

type OpenFoodFactsProduct = {
  brands?: string | null;
  image_url?: string | null;
  nutriments?: {
    carbohydrates_100g?: OpenFoodFactsNumber;
    'energy-kcal_100g'?: OpenFoodFactsNumber;
    fat_100g?: OpenFoodFactsNumber;
    proteins_100g?: OpenFoodFactsNumber;
  };
  product_name?: string | null;
  product_quantity?: string | null;
  product_quantity_unit?: string | null;
};

const openFoodFactsNumberType = 'number | string | null';
const openFoodFactsNutrimentsType = type({
  'carbohydrates_100g?': openFoodFactsNumberType,
  'energy-kcal_100g?': openFoodFactsNumberType,
  'fat_100g?': openFoodFactsNumberType,
  'proteins_100g?': openFoodFactsNumberType,
});
const openFoodFactsProductType = type({
  'brands?': 'string | null',
  'image_url?': 'string | null',
  'nutriments?': openFoodFactsNutrimentsType,
  'product_name?': 'string | null',
  'product_quantity?': 'string | null',
  'product_quantity_unit?': 'string | null',
});
const openFoodFactsResponseType = type({ product: openFoodFactsProductType });

type ImportedFoodProduct = {
  barcode: string;
  brand: string | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  imageUrl: string | null;
  kcalPer100g: number;
  name: string;
  proteinPer100g: number | null;
  servingSize: string | null;
};

function toHundredths(value: number): number {
  const scaled = Math.round(value * HUNDREDTHS);

  if (!Number.isSafeInteger(scaled)) {
    throw new ClientSafeError('Nutrition values are outside the supported range.');
  }

  return scaled;
}

function fromHundredths(value: number | null): number | null {
  return value === null ? null : value / HUNDREDTHS;
}

function optionalHundredths(value: number | undefined): number | null {
  return value === undefined ? null : toHundredths(value);
}

function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeTimestamp(value: TimestampInput | undefined): Date {
  return value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
}

function sourceFromDatabase(value: string): FoodProductSource {
  if (value === 'open_food_facts') {
    return value;
  }

  if (value === 'veles') {
    return value;
  }

  throw new Error(`Unsupported food product source: ${value}`);
}

function toFoodProduct(product: typeof foodProducts.$inferSelect): CalorieFood {
  return {
    barcode: product.barcode,
    brand: product.brand,
    carbsPer100g: fromHundredths(product.carbsPer100gHundredths),
    fatPer100g: fromHundredths(product.fatPer100gHundredths),
    id: product.id,
    imageUrl: product.imageUrl,
    kcalPer100g: product.kcalPer100gHundredths / HUNDREDTHS,
    name: product.name,
    proteinPer100g: fromHundredths(product.proteinPer100gHundredths),
    servingSize: product.servingSize,
    source: sourceFromDatabase(product.source),
  };
}

function toCalorieLog(log: typeof foodLogs.$inferSelect): CalorieLog {
  return {
    carbs: fromHundredths(log.carbsHundredths),
    consumedAt: log.consumedAt.toISOString(),
    fat: fromHundredths(log.fatHundredths),
    grams: fromHundredths(log.gramsHundredths),
    id: log.id,
    kcal: log.kcalHundredths / HUNDREDTHS,
    kind: log.kind === 'product' ? 'product' : 'custom',
    name: log.name,
    productId: log.productId,
    protein: fromHundredths(log.proteinHundredths),
  };
}

function toCalorieGoal(goal: typeof calorieGoals.$inferSelect): CalorieGoal {
  return {
    date: goal.effectiveDate,
    id: goal.id,
    kcal: goal.kcalLimitHundredths / HUNDREDTHS,
  };
}

function parseOpenFoodFactsNumber(value: OpenFoodFactsNumber): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  return null;
}

function parseOpenFoodFactsProduct(
  product: OpenFoodFactsProduct,
  barcode: string,
): ImportedFoodProduct | null {
  const kcalPer100g = parseOpenFoodFactsNumber(product.nutriments?.['energy-kcal_100g']);
  const name = normalizeText(product.product_name);

  if (kcalPer100g === null || name === null) {
    return null;
  }

  const quantity = normalizeText(product.product_quantity);
  const quantityUnit = normalizeText(product.product_quantity_unit);
  const servingSize =
    quantity && quantityUnit ? `${quantity} ${quantityUnit}` : (quantity ?? quantityUnit);

  return {
    barcode,
    brand: normalizeText(product.brands),
    carbsPer100g: parseOpenFoodFactsNumber(product.nutriments?.carbohydrates_100g),
    fatPer100g: parseOpenFoodFactsNumber(product.nutriments?.fat_100g),
    imageUrl: normalizeText(product.image_url),
    kcalPer100g,
    name,
    proteinPer100g: parseOpenFoodFactsNumber(product.nutriments?.proteins_100g),
    servingSize,
  };
}

async function importOpenFoodFactsProduct(barcode: string) {
  const requestedFields = [
    'product_name',
    'brands',
    'nutriments',
    'image_url',
    'product_quantity',
    'product_quantity_unit',
  ].join(',');
  const endpoints = [
    `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}.json?fields=${requestedFields}`,
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${requestedFields}`,
  ];

  for (const endpoint of endpoints) {
    let response: Response;

    try {
      response = await fetch(endpoint, { headers: { accept: 'application/json' } });
    } catch {
      continue;
    }

    if (!response.ok) {
      continue;
    }

    const parsedJson = await response.json();
    const parsedResponse = openFoodFactsResponseType(parsedJson);

    if (parsedResponse instanceof type.errors) {
      continue;
    }

    const parsedProduct = parseOpenFoodFactsProduct(parsedResponse.product, barcode);

    if (parsedProduct !== null) {
      return parsedProduct;
    }
  }

  return null;
}

async function findFoodProductByBarcode(barcode: string) {
  const [product] = await db
    .select()
    .from(foodProducts)
    .where(eq(foodProducts.barcode, barcode))
    .limit(1);

  return product;
}

async function insertImportedFoodProduct(product: ImportedFoodProduct) {
  const [inserted] = await db
    .insert(foodProducts)
    .values({
      barcode: product.barcode,
      brand: product.brand,
      carbsPer100gHundredths: optionalHundredths(product.carbsPer100g ?? undefined),
      fatPer100gHundredths: optionalHundredths(product.fatPer100g ?? undefined),
      imageUrl: product.imageUrl,
      kcalPer100gHundredths: toHundredths(product.kcalPer100g),
      name: product.name,
      proteinPer100gHundredths: optionalHundredths(product.proteinPer100g ?? undefined),
      servingSize: product.servingSize,
      source: 'open_food_facts',
    })
    .onConflictDoNothing({ target: foodProducts.barcode })
    .returning();

  return inserted ?? (await findFoodProductByBarcode(product.barcode));
}

export const getCalorieDashboard = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getCalorieDashboard')])
  .validator(arkTypeValidator(dashboardInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [goal] = await db
      .select()
      .from(calorieGoals)
      .where(
        and(eq(calorieGoals.userId, session.user.id), lte(calorieGoals.effectiveDate, data.date)),
      )
      .orderBy(desc(calorieGoals.effectiveDate))
      .limit(1);
    const logs = await db
      .select()
      .from(foodLogs)
      .where(
        and(
          eq(foodLogs.userId, session.user.id),
          sql`${foodLogs.consumedAt}::date = ${data.date}::date`,
        ),
      )
      .orderBy(desc(foodLogs.consumedAt));
    const recentFoods = await db
      .select()
      .from(foodProducts)
      .orderBy(desc(foodProducts.createdAt), desc(foodProducts.id))
      .limit(20);

    const totals = logs.reduce<{
      carbsHundredths: number | null;
      fatHundredths: number | null;
      kcalHundredths: number;
      proteinHundredths: number | null;
    }>(
      (result, log) => ({
        carbsHundredths:
          result.carbsHundredths === null || log.carbsHundredths === null
            ? null
            : result.carbsHundredths + log.carbsHundredths,
        fatHundredths:
          result.fatHundredths === null || log.fatHundredths === null
            ? null
            : result.fatHundredths + log.fatHundredths,
        kcalHundredths: result.kcalHundredths + log.kcalHundredths,
        proteinHundredths:
          result.proteinHundredths === null || log.proteinHundredths === null
            ? null
            : result.proteinHundredths + log.proteinHundredths,
      }),
      { carbsHundredths: 0, fatHundredths: 0, kcalHundredths: 0, proteinHundredths: 0 },
    );

    return {
      date: data.date,
      goal: goal ? toCalorieGoal(goal) : null,
      logs: logs.map(toCalorieLog),
      recentFoods: recentFoods.map(toFoodProduct),
      totals: {
        carbs: fromHundredths(totals.carbsHundredths),
        fat: fromHundredths(totals.fatHundredths),
        kcal: totals.kcalHundredths / HUNDREDTHS,
        protein: fromHundredths(totals.proteinHundredths),
      },
    } satisfies CalorieDashboard;
  });

export const lookupFoodByBarcode = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('lookupFoodByBarcode')])
  .validator(arkTypeValidator(barcodeInputType))
  .handler(async ({ data }): Promise<BarcodeLookupResult> => {
    await requireSession();
    const barcode = data.barcode.trim();
    const existingProduct = await findFoodProductByBarcode(barcode);

    if (existingProduct) {
      return { food: toFoodProduct(existingProduct), status: 'found' };
    }

    const importedProduct = await importOpenFoodFactsProduct(barcode);

    if (importedProduct === null) {
      return { status: 'notFound' };
    }

    const product = await insertImportedFoodProduct(importedProduct);

    return product ? { food: toFoodProduct(product), status: 'found' } : { status: 'notFound' };
  });

export const createFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createFoodProduct')])
  .validator(arkTypeValidator(createFoodProductInputType))
  .handler(async ({ data }) => {
    await requireSession();
    const barcode = data.barcode?.trim() ?? null;
    const [inserted] = await db
      .insert(foodProducts)
      .values({
        barcode,
        brand: data.brand?.trim() ?? null,
        carbsPer100gHundredths: optionalHundredths(data.carbsPer100g),
        fatPer100gHundredths: optionalHundredths(data.fatPer100g),
        imageUrl: data.imageUrl ?? null,
        kcalPer100gHundredths: toHundredths(data.kcalPer100g),
        name: data.name.trim(),
        proteinPer100gHundredths: optionalHundredths(data.proteinPer100g),
        servingSize: data.servingSize?.trim() ?? null,
        source: 'veles',
      })
      .onConflictDoNothing({ target: foodProducts.barcode })
      .returning();
    const product =
      inserted ?? (barcode === null ? undefined : await findFoodProductByBarcode(barcode));

    if (!product) {
      throw new ClientSafeError('A food product with this barcode already exists.');
    }

    return toFoodProduct(product);
  });

export const recordFood = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordFood')])
  .validator(arkTypeValidator(recordFoodInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [product] = await db
      .select()
      .from(foodProducts)
      .where(eq(foodProducts.id, data.productId))
      .limit(1);

    if (!product) {
      throw new ClientSafeError('The selected food product no longer exists.');
    }

    const gramsHundredths = toHundredths(data.grams);
    const [inserted] = await db
      .insert(foodLogs)
      .values({
        carbsHundredths:
          product.carbsPer100gHundredths === null
            ? null
            : Math.round((product.carbsPer100gHundredths * gramsHundredths) / (100 * HUNDREDTHS)),
        consumedAt: normalizeTimestamp(data.consumedAt),
        fatHundredths:
          product.fatPer100gHundredths === null
            ? null
            : Math.round((product.fatPer100gHundredths * gramsHundredths) / (100 * HUNDREDTHS)),
        gramsHundredths,
        kcalHundredths: Math.round(
          (product.kcalPer100gHundredths * gramsHundredths) / (100 * HUNDREDTHS),
        ),
        kind: 'product',
        name: product.name,
        productId: product.id,
        proteinHundredths:
          product.proteinPer100gHundredths === null
            ? null
            : Math.round((product.proteinPer100gHundredths * gramsHundredths) / (100 * HUNDREDTHS)),
        userId: session.user.id,
      })
      .returning();

    if (!inserted) {
      throw new Error('Food log could not be created.');
    }

    return toCalorieLog(inserted);
  });

export const recordCustomCalories = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordCustomCalories')])
  .validator(arkTypeValidator(recordCustomCaloriesInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [inserted] = await db
      .insert(foodLogs)
      .values({
        carbsHundredths: optionalHundredths(data.carbs),
        consumedAt: normalizeTimestamp(data.consumedAt),
        fatHundredths: optionalHundredths(data.fat),
        gramsHundredths: optionalHundredths(data.grams),
        kcalHundredths: toHundredths(data.kcal),
        kind: 'custom',
        name: data.name.trim(),
        productId: null,
        proteinHundredths: optionalHundredths(data.protein),
        userId: session.user.id,
      })
      .returning();

    if (!inserted) {
      throw new Error('Food log could not be created.');
    }

    return toCalorieLog(inserted);
  });

export const setDailyCalorieGoal = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setDailyCalorieGoal')])
  .validator(arkTypeValidator(setDailyCalorieGoalInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [goal] = await db
      .insert(calorieGoals)
      .values({
        effectiveDate: data.date,
        kcalLimitHundredths: toHundredths(data.kcal),
        userId: session.user.id,
      })
      .onConflictDoUpdate({
        set: { kcalLimitHundredths: toHundredths(data.kcal), updatedAt: new Date() },
        target: [calorieGoals.userId, calorieGoals.effectiveDate],
      })
      .returning();

    if (!goal) {
      throw new Error('Daily calorie goal could not be saved.');
    }

    return toCalorieGoal(goal);
  });
