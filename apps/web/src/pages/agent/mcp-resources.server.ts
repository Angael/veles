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
  /** Attaches related rows so agents get one nested result instead of joining ids themselves. */
  nest?: (rows: Row[]) => Promise<Row[]>;
}

type Row = Record<string, unknown>;

/** Loads items of the given shopping lists in one query and nests them under each list. */
async function nestListItems(rows: Row[]) {
  const listIds = rows.filter((row) => row.type === 'shopping_list').map((row) => String(row.id));
  const items = listIds.length
    ? await db
        .select({
          id: listItems.id,
          noteId: listItems.noteId,
          name: listItems.name,
          checked: listItems.checked,
        })
        .from(listItems)
        .where(inArray(listItems.noteId, listIds))
        .orderBy(listItems.id)
    : [];
  return rows.map((row) =>
    row.type === 'shopping_list'
      ? {
          ...row,
          items: items
            .filter((item) => item.noteId === row.id)
            .map(({ noteId: _noteId, ...item }) => item),
        }
      : row,
  );
}

/** Converts stored fixed-point fields (`*Hundredths`, `weightGrams`) into plain numbers agents can read. */
function toReadable(row: Row): Row {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (key === 'weightGrams')
        return ['weightKg', typeof value === 'number' ? value / 1000 : value];
      if (key.endsWith('Hundredths')) {
        return [
          key.slice(0, -'Hundredths'.length),
          typeof value === 'number' ? value / 100 : value,
        ];
      }
      return [key, value];
    }),
  );
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
    description:
      'Notes and shopping lists (type "shopping_list"). Shopping lists include their items (id, name, checked) in creation order.',
    scope: ownedBy(notes.ownerId),
    nest: nestListItems,
  },
  weights: {
    feature: 'weight',
    table: weightEntries,
    id: weightEntries.id,
    description: 'Weight history in kg.',
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
    description: 'Food diary by logDate. kcal is energy; grams, protein, fat, carbs in grams.',
    scope: ownedBy(foodLogs.userId),
  },
  calorie_goals: {
    feature: 'calorie_goals',
    table: calorieGoals,
    id: calorieGoals.id,
    description:
      'Nutrition goals by effectiveDate: kcal limit, then protein, fat, carbs limits in grams.',
    scope: ownedBy(calorieGoals.userId),
  },
  food_products: {
    feature: 'food_products',
    table: foodProducts,
    id: foodProducts.id,
    description: 'Shared food catalog; kcal and macros are per 100 g, product size in grams.',
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

/** Reads one owner-scoped page in creation order, with owner columns omitted, relations nested, and units converted. */
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
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? String(page.at(-1)?.id) : null;
  const items = (resource.nest ? await resource.nest(page) : page).map(toReadable);
  return { items, nextCursor };
}
