import { type } from 'arktype';
import { and, eq, getTableColumns, gt, inArray, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import {
  calorieGoals,
  diaryEntries,
  foodLogs,
  foodProducts,
  listItems,
  notes,
  recipes,
  weightEntries,
} from '@veles/db/schema';
import type { AgentFeature } from '@/lib/agentAccess';
import { db } from '@/server/db.server';

interface AgentResource {
  feature: AgentFeature;
  table: PgTable;
  id: PgColumn;
  description: string;
  /** Rows the user may read; `undefined` means the collection is global. */
  scope: (userId: string) => SQL | undefined;
}

const ownedBy = (column: PgColumn) => (userId: string) => eq(column, userId);

export const resources = {
  diary_entries: {
    feature: 'diary',
    table: diaryEntries,
    id: diaryEntries.id,
    description: 'Diary entries with Markdown content.',
    scope: ownedBy(diaryEntries.userId),
  },
  notes: {
    feature: 'notes',
    table: notes,
    id: notes.id,
    description: 'Notes and shopping lists (type "shopping_list"); list items live in list_items.',
    scope: ownedBy(notes.ownerId),
  },
  list_items: {
    feature: 'notes',
    table: listItems,
    id: listItems.id,
    description: 'Shopping list items, linked by noteId.',
    scope: (userId) =>
      inArray(
        listItems.noteId,
        db.select({ id: notes.id }).from(notes).where(eq(notes.ownerId, userId)),
      ),
  },
  weights: {
    feature: 'weight',
    table: weightEntries,
    id: weightEntries.id,
    description: 'Weight history; weightGrams / 1000 = kg.',
    scope: ownedBy(weightEntries.userId),
  },
  recipes: {
    feature: 'recipes',
    table: recipes,
    id: recipes.id,
    description: 'Recipes. kcal is energy; protein, fats, carbs are grams for all portions.',
    scope: ownedBy(recipes.userId),
  },
  food_logs: {
    feature: 'calories',
    table: foodLogs,
    id: foodLogs.id,
    description: 'Food diary by logDate. Divide *Hundredths by 100 (kcal or grams).',
    scope: ownedBy(foodLogs.userId),
  },
  calorie_goals: {
    feature: 'calorie_goals',
    table: calorieGoals,
    id: calorieGoals.id,
    description: 'Nutrition goals by effectiveDate. Divide *Hundredths by 100.',
    scope: ownedBy(calorieGoals.userId),
  },
  food_products: {
    feature: 'food_products',
    table: foodProducts,
    id: foodProducts.id,
    description: 'Shared food catalog, per 100 g. Divide *Hundredths by 100.',
    scope: () => undefined,
  },
} satisfies Record<string, AgentResource>;

type ResourceName = keyof typeof resources;

const resourceName = type.enumerated(...(Object.keys(resources) as ResourceName[]));
export const listInput = type({
  resource: resourceName,
  'cursor?': type('string.uuid').describe('nextCursor from the previous page'),
  'limit?': '1 <= number.integer <= 100',
});
export const getInput = type({ resource: resourceName, id: 'string.uuid' });

/** Reads one owner-scoped page, ordered by uuidv7 id (creation order); owner columns are omitted. */
export async function readRecords(
  userId: string,
  resource: AgentResource,
  { cursor, id, limit }: { cursor?: string; id?: string; limit: number },
) {
  const columns = Object.fromEntries(
    Object.entries(getTableColumns(resource.table)).filter(
      ([key]) => key !== 'userId' && key !== 'ownerId',
    ),
  );
  const rows = await db
    .select(columns)
    .from(resource.table)
    .where(
      and(
        resource.scope(userId),
        cursor ? gt(resource.id, cursor) : undefined,
        id ? eq(resource.id, id) : undefined,
      ),
    )
    .orderBy(resource.id)
    .limit(limit + 1);
  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? String(items.at(-1)?.id) : null;
  return { items, nextCursor };
}
