import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray } from 'drizzle-orm';
import { foodLogs } from '@veles/db/schema';
import { fromHundredths, HUNDREDTHS } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import type { RecipeSourceLog } from './recipeDraftFromLogs';

export const recipeSourceLogIdsType = type('string.uuid[] <= 100');

/** Reads the user's own selected food logs, in selection order, to prefill a new recipe. */
export const getRecipeSourceLogs = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeSourceLogs')])
  .validator(arkTypeValidator(type({ ids: recipeSourceLogIdsType })))
  .handler(async ({ data }): Promise<RecipeSourceLog[]> => {
    const session = await requireSession();
    if (data.ids.length === 0) return [];

    const rows = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, session.user.id), inArray(foodLogs.id, data.ids)));
    const rowsById = new Map(rows.map((row) => [row.id, row]));

    return [...new Set(data.ids)].flatMap((id) => {
      const row = rowsById.get(id);
      if (!row) return [];
      return {
        carbs: fromHundredths(row.carbsHundredths),
        fat: fromHundredths(row.fatHundredths),
        grams: fromHundredths(row.gramsHundredths),
        kcal: row.kcalHundredths / HUNDREDTHS,
        name: row.name,
        productId: row.productId,
        protein: fromHundredths(row.proteinHundredths),
      };
    });
  });
