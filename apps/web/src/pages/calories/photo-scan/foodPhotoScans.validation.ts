import { type } from 'arktype';
import { dateOnlyType } from '@/lib/dateOnly';

/** More photos cost more tokens and rarely add anything new. */
export const FOOD_PHOTO_SCAN_MAX_PHOTOS = 6;

export const foodPhotoScanValuesType = type({
  date: dateOnlyType,
  'grams?': 'number.integer > 0',
  'barcode?': type('/^\\d{6,14}$/').or('undefined'),
});

export const foodPhotoScanIdInputType = type({ id: 'string.uuid' });

export const foodPhotoScansInputType = type({ date: dateOnlyType });
