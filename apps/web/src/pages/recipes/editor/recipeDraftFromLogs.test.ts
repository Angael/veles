import { describe, expect, it } from 'vitest';
import { recipeDraftFromLogs, type RecipeSourceLog } from './recipeDraftFromLogs';

function log(overrides: Partial<RecipeSourceLog>): RecipeSourceLog {
  return { grams: null, name: 'Food', productId: null, ...overrides };
}

const rows = (logs: RecipeSourceLog[]) =>
  recipeDraftFromLogs(logs).ingredients.map(({ grams, name, productId }) => ({
    grams,
    name,
    productId,
  }));

describe('recipeDraftFromLogs', () => {
  it('links each selected product log as an ingredient with its grams', () => {
    const draft = recipeDraftFromLogs([
      log({ grams: 150, name: 'Chicken breast', productId: 'chicken' }),
      log({ grams: 80, name: 'Rice', productId: 'rice' }),
    ]);

    expect(draft.ingredients.map(({ productId, grams }) => [productId, grams])).toEqual([
      ['chicken', 150],
      ['rice', 80],
    ]);
    expect(draft.name).toBe('');
    expect(draft.portions).toBe(1);
  });

  it('combines repeated products while keeping their total grams', () => {
    expect(
      rows([
        log({ grams: 100, name: 'Rice', productId: 'rice' }),
        log({ grams: 20, name: 'Olive oil', productId: 'oil' }),
        log({ grams: 50, name: 'Rice', productId: 'rice' }),
      ]),
    ).toEqual([
      { grams: 150, name: 'Rice', productId: 'rice' },
      { grams: 20, name: 'Olive oil', productId: 'oil' },
    ]);
  });

  it('keeps custom entries separate as custom ingredients', () => {
    expect(rows([log({ name: 'Cookie' }), log({ grams: 30, name: 'Cookie' })])).toEqual([
      { grams: null, name: 'Cookie', productId: null },
      { grams: 30, name: 'Cookie', productId: null },
    ]);
  });
});
