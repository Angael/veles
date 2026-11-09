import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { limitFoodUploadRequestMiddleware, nonEmptyPhotoType } from '../calories.api';
import {
  deleteFoodPhotoScanRecord,
  enqueueFoodPhotoScanRecord,
  getFoodPhotoScansRecord,
  retryFoodPhotoScanRecord,
} from './foodPhotoScans.server';
import {
  FOOD_PHOTO_SCAN_MAX_PHOTOS,
  foodPhotoScanIdInputType,
  foodPhotoScansInputType,
  foodPhotoScanValuesType,
} from './foodPhotoScans.validation';

const enqueueMultipartType = type('FormData.parse').to({
  values: type('string.json.parse').to(foodPhotoScanValuesType),
  // FormData.parse returns one value for a single entry and an array for several.
  photos: nonEmptyPhotoType.or(nonEmptyPhotoType.array().atMostLength(FOOD_PHOTO_SCAN_MAX_PHOTOS)),
});

export const enqueueFoodPhotoScan = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('enqueueFoodPhotoScan'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(enqueueMultipartType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return enqueueFoodPhotoScanRecord(session.user.id, data.values, [data.photos].flat());
  });

export const getFoodPhotoScans = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getFoodPhotoScans')])
  .validator(arkTypeValidator(foodPhotoScansInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return getFoodPhotoScansRecord(session.user.id, data.date);
  });

export const retryFoodPhotoScan = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('retryFoodPhotoScan')])
  .validator(arkTypeValidator(foodPhotoScanIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await retryFoodPhotoScanRecord(session.user.id, data.id);
  });

export const deleteFoodPhotoScan = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteFoodPhotoScan')])
  .validator(arkTypeValidator(foodPhotoScanIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await deleteFoodPhotoScanRecord(session.user.id, data.id);
  });
