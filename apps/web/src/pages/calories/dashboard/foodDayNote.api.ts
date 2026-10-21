import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { setFoodDayNoteInputType } from '../calories.validation';
import { setFoodDayNoteRecord } from '../foodDayNotes.server';

export const setFoodDayNote = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setFoodDayNote')])
  .validator(arkTypeValidator(setFoodDayNoteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return setFoodDayNoteRecord(session.user.id, data);
  });
