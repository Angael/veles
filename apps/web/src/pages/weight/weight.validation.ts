import { type } from 'arktype';
import { dateOnlyType } from '@/lib/dateOnly';

export const MAX_WEIGHT_IMPORT_ENTRIES = 3_000;

export const saveWeightInputType = type({
  date: dateOnlyType,
  weightKg: '30 <= number <= 300',
});

export const saveWeightsInputType = type({
  entries: saveWeightInputType.array().atLeastLength(1).atMostLength(MAX_WEIGHT_IMPORT_ENTRIES),
});
