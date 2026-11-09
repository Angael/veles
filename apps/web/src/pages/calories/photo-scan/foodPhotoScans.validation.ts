import { type } from 'arktype';
import { dateOnlyType } from '@/lib/dateOnly';

export const foodPhotoScanValuesType = type({
  date: dateOnlyType,
  grams: 'number.integer > 0',
  'barcode?': type('/^\\d{6,14}$/').or('undefined'),
});

export const foodPhotoScanIdInputType = type({ id: 'string.uuid' });

export const foodPhotoScansInputType = type({ date: dateOnlyType });
