import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { foodLogs, mealPlanItems } from '@veles/db/schema';

/** Rows the fake db returns per query, and every write it receives. */
const state = {
  ownedRecipes: [] as { name: string }[],
  writes: [] as { op: string; table: string; values?: Record<string, unknown> }[],
};

vi.mock('@/server/db.server', () => {
  const write = (op: string) => (table: PgTable) => {
    const entry: (typeof state.writes)[number] = { op, table: getTableName(table) };
    state.writes.push(entry);
    const chain = {
      set: (values: Record<string, unknown>) => {
        entry.values = values;
        return chain;
      },
      values: (values: Record<string, unknown>) => {
        entry.values = values;
        return chain;
      },
      where: () => chain,
      returning: async () => [{ id: 'saved' }],
    };
    return chain;
  };
  const select = () => {
    const chain = {
      from: () => chain,
      where: () => chain,
      limit: async () => state.ownedRecipes,
    };
    return chain;
  };
  return {
    db: { delete: write('delete'), insert: write('insert'), select, update: write('update') },
  };
});

vi.mock('@/lib/i18n/getLocale', () => ({
  translate: (text: { en: string }) => text.en,
}));

import { saveMealPlanItemRecord } from './mealPlan.server';

const recipeId = '00000000-0000-4000-8000-000000000001';

describe('saveMealPlanItemRecord', () => {
  beforeEach(() => {
    state.ownedRecipes = [];
    state.writes.length = 0;
  });

  it('plans a free-text meal without touching the food log', async () => {
    await saveMealPlanItemRecord('user-1', {
      date: '2026-10-23',
      name: 'Leftover soup',
      portions: 1,
      recipeId: null,
    });

    expect(state.writes).toEqual([
      {
        op: 'insert',
        table: getTableName(mealPlanItems),
        values: {
          date: '2026-10-23',
          name: 'Leftover soup',
          portionsHundredths: 100,
          recipeId: null,
          userId: 'user-1',
        },
      },
    ]);
    expect(state.writes.some((entry) => entry.table === getTableName(foodLogs))).toBe(false);
  });

  it("saves an owned recipe's name and portions in hundredths", async () => {
    state.ownedRecipes = [{ name: 'Chicken curry' }];
    await saveMealPlanItemRecord('user-1', {
      date: '2026-10-23',
      name: '',
      portions: 1.5,
      recipeId,
    });

    expect(state.writes[0]?.values).toMatchObject({
      name: 'Chicken curry',
      portionsHundredths: 150,
      recipeId,
    });
  });

  it("rejects another user's recipe", async () => {
    await expect(
      saveMealPlanItemRecord('user-1', { date: '2026-10-23', name: '', portions: 1, recipeId }),
    ).rejects.toThrow('Recipe not found.');
    expect(state.writes).toHaveLength(0);
  });

  it('rejects a free-text meal without a name', async () => {
    await expect(
      saveMealPlanItemRecord('user-1', {
        date: '2026-10-23',
        name: '',
        portions: 1,
        recipeId: null,
      }),
    ).rejects.toThrow('Enter a meal name.');
  });

  it('moves an existing meal by updating only its own row', async () => {
    await saveMealPlanItemRecord('user-1', {
      date: '2026-10-25',
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Leftover soup',
      portions: 1,
      recipeId: null,
    });

    expect(state.writes).toHaveLength(1);
    expect(state.writes[0]).toMatchObject({
      op: 'update',
      table: getTableName(mealPlanItems),
      values: { date: '2026-10-25' },
    });
  });
});
