import { type } from 'arktype';
import { foodProductUnits } from '@veles/db/seed/food-products';
import { dateOnlyType } from '@/lib/dateOnly';
import { HUNDREDTHS } from '@/lib/nutrition';
import { MAX_FOOD_LOG_MULTIPLIER } from './calorieHelpers';

const MAX_TEXT_LENGTH = 500;

const nonNegativeAmountType = type('number >= 0').narrow((value, ctx) =>
  Number.isFinite(value) && Number.isSafeInteger(Math.round(value * HUNDREDTHS))
    ? true
    : ctx.mustBe('a finite number with at most two decimal places'),
);

export const nonEmptyTextType = type(`string.trim |> 1 <= string <= ${MAX_TEXT_LENGTH}`);
const optionalNonEmptyTextType = nonEmptyTextType.or('null').or('undefined');
const optionalPositiveAmountType = type('number > 0 | null | undefined');
const optionalNonNegativeAmountType = nonNegativeAmountType.or('null').or('undefined');
export const imageActionType = type("'keep' | 'replace' | 'remove'");
const optionalFoodUnitType = type
  .enumerated(...foodProductUnits)
  .or('null')
  .or('undefined');

export const createFoodProductValuesType = type({
  name: nonEmptyTextType,
  'barcode?': optionalNonEmptyTextType,
  'productSizeGrams?': optionalPositiveAmountType,
  'unit?': optionalFoodUnitType,
  kcalPer100g: nonNegativeAmountType,
  'proteinPer100g?': optionalNonNegativeAmountType,
  'fatPer100g?': optionalNonNegativeAmountType,
  'carbsPer100g?': optionalNonNegativeAmountType,
  'imageAction?': imageActionType,
});

export const updateFoodProductValuesType = createFoodProductValuesType.merge({
  id: 'string.uuid',
  today: dateOnlyType,
});

export const barcodeInputType = type({ barcode: nonEmptyTextType });

export const recordFoodValuesType = type({
  date: dateOnlyType,
  grams: nonNegativeAmountType,
  productId: 'string.uuid',
});

export const recordCustomCaloriesValuesType = type({
  name: nonEmptyTextType,
  'grams?': optionalNonNegativeAmountType,
  kcal: nonNegativeAmountType,
  'protein?': optionalNonNegativeAmountType,
  'fat?': optionalNonNegativeAmountType,
  'carbs?': optionalNonNegativeAmountType,
  date: dateOnlyType,
  'imageAction?': imageActionType,
});

export const updateFoodLogValuesType = type({
  id: 'string.uuid',
  name: nonEmptyTextType,
  'grams?': optionalNonNegativeAmountType,
  kcal: nonNegativeAmountType,
  'protein?': optionalNonNegativeAmountType,
  'fat?': optionalNonNegativeAmountType,
  'carbs?': optionalNonNegativeAmountType,
  date: dateOnlyType,
  'imageAction?': imageActionType,
});

const foodLogIdsType = type('string.uuid[]').atLeastLength(1).atMostLength(200);

export const foodLogIdsInputType = type({ ids: foodLogIdsType });

export const foodLogsDateInputType = type({ date: dateOnlyType, ids: foodLogIdsType });

export const multiplyFoodLogsInputType = type({
  ids: foodLogIdsType,
  factor: `0 < number <= ${MAX_FOOD_LOG_MULTIPLIER}`,
});

/** One day of eaten food: catalog products by grams, or custom foods with their nutrition. */
export const logFoodEntriesInputType = type({
  date: dateOnlyType,
  // One flat shape: arktype cannot union these two because both may carry grams.
  entries: recordCustomCaloriesValuesType
    .omit('date', 'imageAction')
    .partial()
    .merge({ 'productId?': 'string.uuid' })
    .array()
    .atLeastLength(1)
    .atMostLength(50),
});

export const changeFoodLogsInputType = type({
  ids: foodLogIdsType,
  action: "'delete' | 'move' | 'copy' | 'multiply'",
  'date?': dateOnlyType,
  'factor?': `0 < number <= ${MAX_FOOD_LOG_MULTIPLIER}`,
});

/** Create without id, or replace all fields of the product with id; `today` is needed on update. */
export const saveFoodProductInputType = createFoodProductValuesType
  .omit('imageAction')
  .merge({ 'id?': 'string.uuid', 'today?': dateOnlyType });

/** Day note and off-plan flag; omitted fields stay, and an empty or null note clears it. */
export const setFoodDayNoteInputType = type({
  '+': 'reject',
  date: dateOnlyType,
  'offPlan?': 'boolean',
  'note?': type(`string.trim |> string <= ${MAX_TEXT_LENGTH}`).or('null'),
});
