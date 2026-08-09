import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, ilike, lte } from 'drizzle-orm';
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
  productSizeGrams: number | null;
  source: FoodProductSource;
};

export type CalorieLog = {
  carbs: number | null;
  consumedAt: string;
  date: string;
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
  carbs: number | null;
  fat: number | null;
  kcal: number;
  protein: number | null;
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
  'productSizeGrams?': type('number > 0'),
});
const recordFoodInputType = type({
  date: localDateType,
  grams: nonNegativeAmountType,
  productId: 'string.uuid',
});
const recordCustomCaloriesInputType = type({
  'carbs?': nonNegativeAmountType,
  date: localDateType,
  'fat?': nonNegativeAmountType,
  'grams?': nonNegativeAmountType,
  kcal: nonNegativeAmountType,
  name: nonEmptyTextType,
  'protein?': nonNegativeAmountType,
});
const setDailyCalorieGoalInputType = type({
  'carbs?': type('number > 0'),
  date: localDateType,
  'fat?': type('number > 0'),
  kcal: type('number > 0'),
  'protein?': type('number > 0'),
});
const searchFoodsInputType = type({ query: 'string.trim' });
const foodIdInputType = type({ id: 'string.uuid' });
const updateFoodProductInputType = createFoodProductInputType.merge(foodIdInputType);

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
  productSizeGrams: number | null;
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

function productValues(data: typeof createFoodProductInputType.infer) {
  return {
    barcode: data.barcode?.trim() ?? null,
    brand: data.brand?.trim() ?? null,
    carbsPer100gHundredths: optionalHundredths(data.carbsPer100g),
    fatPer100gHundredths: optionalHundredths(data.fatPer100g),
    imageUrl: data.imageUrl ?? null,
    kcalPer100gHundredths: toHundredths(data.kcalPer100g),
    name: data.name.trim(),
    productSizeGramsHundredths: optionalHundredths(data.productSizeGrams),
    proteinPer100gHundredths: optionalHundredths(data.proteinPer100g),
  };
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
    productSizeGrams: fromHundredths(product.productSizeGramsHundredths),
    source: sourceFromDatabase(product.source),
  };
}

function toCalorieLog(log: typeof foodLogs.$inferSelect): CalorieLog {
  return {
    carbs: fromHundredths(log.carbsHundredths),
    date: log.logDate,
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
    carbs: fromHundredths(goal.carbsLimitHundredths),
    fat: fromHundredths(goal.fatLimitHundredths),
    kcal: goal.kcalLimitHundredths / HUNDREDTHS,
    protein: fromHundredths(goal.proteinLimitHundredths),
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

  const quantityUnit = normalizeText(product.product_quantity_unit)?.toLowerCase();
  const productSizeGrams =
    quantityUnit === 'g' ? parseOpenFoodFactsNumber(product.product_quantity) : null;

  return {
    barcode,
    brand: normalizeText(product.brands),
    carbsPer100g: parseOpenFoodFactsNumber(product.nutriments?.carbohydrates_100g),
    fatPer100g: parseOpenFoodFactsNumber(product.nutriments?.fat_100g),
    imageUrl: normalizeText(product.image_url),
    kcalPer100g,
    name,
    proteinPer100g: parseOpenFoodFactsNumber(product.nutriments?.proteins_100g),
    productSizeGrams,
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
      productSizeGramsHundredths: optionalHundredths(product.productSizeGrams ?? undefined),
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
      .where(and(eq(foodLogs.userId, session.user.id), eq(foodLogs.logDate, data.date)))
      .orderBy(desc(foodLogs.consumedAt));
    const recentFoods = await db
      .select()
      .from(foodProducts)
      .orderBy(desc(foodProducts.createdAt), desc(foodProducts.id))
      .limit(20);
    const totals = logs.reduce(
      (result, log) => ({
        carbs:
          result.carbs === null || log.carbsHundredths === null
            ? null
            : result.carbs + log.carbsHundredths,
        fat:
          result.fat === null || log.fatHundredths === null ? null : result.fat + log.fatHundredths,
        kcal: result.kcal + log.kcalHundredths,
        protein:
          result.protein === null || log.proteinHundredths === null
            ? null
            : result.protein + log.proteinHundredths,
      }),
      { carbs: 0 as number | null, fat: 0 as number | null, kcal: 0, protein: 0 as number | null },
    );

    return {
      date: data.date,
      goal: goal ? toCalorieGoal(goal) : null,
      logs: logs.map(toCalorieLog),
      recentFoods: recentFoods.map(toFoodProduct),
      totals: {
        carbs: fromHundredths(totals.carbs),
        fat: fromHundredths(totals.fat),
        kcal: totals.kcal / HUNDREDTHS,
        protein: fromHundredths(totals.protein),
      },
    } satisfies CalorieDashboard;
  });

export const searchFoods = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('searchFoods')])
  .validator(arkTypeValidator(searchFoodsInputType))
  .handler(async ({ data }) => {
    await requireSession();
    const query = data.query.trim();
    const foods = await db
      .select()
      .from(foodProducts)
      .where(query ? ilike(foodProducts.name, `%${query}%`) : undefined)
      .orderBy(desc(foodProducts.updatedAt))
      .limit(30);
    return foods.map(toFoodProduct);
  });

export const getFoodProduct = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getFoodProduct')])
  .validator(arkTypeValidator(foodIdInputType))
  .handler(async ({ data }) => {
    await requireSession();
    const [food] = await db
      .select()
      .from(foodProducts)
      .where(eq(foodProducts.id, data.id))
      .limit(1);
    if (!food) throw new ClientSafeError('Food product not found.');
    return toFoodProduct(food);
  });

export const lookupFoodByBarcode = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('lookupFoodByBarcode')])
  .validator(arkTypeValidator(barcodeInputType))
  .handler(async ({ data }): Promise<BarcodeLookupResult> => {
    await requireSession();
    const barcode = data.barcode.trim();
    const existingProduct = await findFoodProductByBarcode(barcode);
    if (existingProduct) return { food: toFoodProduct(existingProduct), status: 'found' };
    const importedProduct = await importOpenFoodFactsProduct(barcode);
    if (importedProduct === null) return { status: 'notFound' };
    const product = await insertImportedFoodProduct(importedProduct);
    return product ? { food: toFoodProduct(product), status: 'found' } : { status: 'notFound' };
  });

export const createFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createFoodProduct')])
  .validator(arkTypeValidator(createFoodProductInputType))
  .handler(async ({ data }) => {
    await requireSession();
    const values = productValues(data);
    const [inserted] = await db
      .insert(foodProducts)
      .values({ ...values, source: 'veles' })
      .onConflictDoNothing({ target: foodProducts.barcode })
      .returning();
    const product =
      inserted ??
      (values.barcode === null ? undefined : await findFoodProductByBarcode(values.barcode));
    if (!product) throw new ClientSafeError('A food product with this barcode already exists.');
    return toFoodProduct(product);
  });

export const updateFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateFoodProduct')])
  .validator(arkTypeValidator(updateFoodProductInputType))
  .handler(async ({ data }) => {
    await requireSession();
    const [updated] = await db
      .update(foodProducts)
      .set({ ...productValues(data), source: 'veles', updatedAt: new Date() })
      .where(eq(foodProducts.id, data.id))
      .returning();
    if (!updated) throw new ClientSafeError('Food product not found.');
    return toFoodProduct(updated);
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
    if (!product) throw new ClientSafeError('The selected food product no longer exists.');
    const gramsHundredths = toHundredths(data.grams);
    const scale = (value: number | null) =>
      value === null ? null : Math.round((value * gramsHundredths) / (100 * HUNDREDTHS));
    const [inserted] = await db
      .insert(foodLogs)
      .values({
        carbsHundredths: scale(product.carbsPer100gHundredths),
        consumedAt: new Date(),
        fatHundredths: scale(product.fatPer100gHundredths),
        gramsHundredths,
        kcalHundredths: scale(product.kcalPer100gHundredths) ?? 0,
        kind: 'product',
        logDate: data.date,
        name: product.name,
        productId: product.id,
        proteinHundredths: scale(product.proteinPer100gHundredths),
        userId: session.user.id,
      })
      .returning();
    if (!inserted) throw new Error('Food log could not be created.');
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
        consumedAt: new Date(),
        fatHundredths: optionalHundredths(data.fat),
        gramsHundredths: optionalHundredths(data.grams),
        kcalHundredths: toHundredths(data.kcal),
        kind: 'custom',
        logDate: data.date,
        name: data.name.trim(),
        productId: null,
        proteinHundredths: optionalHundredths(data.protein),
        userId: session.user.id,
      })
      .returning();
    if (!inserted) throw new Error('Food log could not be created.');
    return toCalorieLog(inserted);
  });

export const setDailyCalorieGoal = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setDailyCalorieGoal')])
  .validator(arkTypeValidator(setDailyCalorieGoalInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const values = {
      carbsLimitHundredths: optionalHundredths(data.carbs),
      fatLimitHundredths: optionalHundredths(data.fat),
      kcalLimitHundredths: toHundredths(data.kcal),
      proteinLimitHundredths: optionalHundredths(data.protein),
    };
    const [goal] = await db
      .insert(calorieGoals)
      .values({ ...values, effectiveDate: data.date, userId: session.user.id })
      .onConflictDoUpdate({
        set: { ...values, updatedAt: new Date() },
        target: [calorieGoals.userId, calorieGoals.effectiveDate],
      })
      .returning();
    if (!goal) throw new Error('Daily calorie goal could not be saved.');
    return toCalorieGoal(goal);
  });
