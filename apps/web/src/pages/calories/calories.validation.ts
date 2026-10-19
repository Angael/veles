import { type } from 'arktype';
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

export const createFoodProductValuesType = type({
  name: nonEmptyTextType,
  'barcode?': optionalNonEmptyTextType,
  'productSizeGrams?': optionalPositiveAmountType,
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
