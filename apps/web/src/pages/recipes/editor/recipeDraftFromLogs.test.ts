import { describe, expect, it } from 'vitest';
import { recipeDraftFromLogs, type RecipeSourceLog } from './recipeDraftFromLogs';

const formatGrams = (grams: number) => String(Math.round(grams));

function log(overrides: Partial<RecipeSourceLog>): RecipeSourceLog {
  return {
    carbs: null,
    fat: null,
    grams: null,
    kcal: 0,
    name: 'Food',
    productId: null,
    protein: null,
    ...overrides,
  };
}

describe('recipeDraftFromLogs', () => {
  it('lists each selected log as an ingredient with its grams', () => {
    const draft = recipeDraftFromLogs(
      [
        log({ grams: 150, kcal: 165, name: 'Chicken breast', productId: 'chicken' }),
        log({ grams: 80, kcal: 104, name: 'Rice', productId: 'rice' }),
      ],
      formatGrams,
    );

    expect(draft.ingredients).toEqual(['Chicken breast – 150 g', 'Rice – 80 g']);
    expect(draft.name).toBe('');
    expect(draft.portions).toBe(1);
  });

  it('combines repeated products while keeping their total grams', () => {
    const draft = recipeDraftFromLogs(
      [
        log({ grams: 100, name: 'Rice', productId: 'rice' }),
        log({ grams: 20, name: 'Olive oil', productId: 'oil' }),
        log({ grams: 50, name: 'Rice', productId: 'rice' }),
      ],
      formatGrams,
    );

    expect(draft.ingredients).toEqual(['Rice – 150 g', 'Olive oil – 20 g']);
  });

  it('keeps custom entries separate and omits unknown grams', () => {
    const draft = recipeDraftFromLogs(
      [log({ kcal: 120, name: 'Cookie' }), log({ kcal: 120, name: 'Cookie' })],
      formatGrams,
    );

    expect(draft.ingredients).toEqual(['Cookie', 'Cookie']);
    expect(draft.kcal).toBe(240);
  });

  it('sums nutrition and leaves macros nobody tracked empty', () => {
    const draft = recipeDraftFromLogs(
      [
        log({ carbs: 10.4, kcal: 100.4, protein: 5.3, productId: 'a' }),
        log({ carbs: 20.3, kcal: 50.4, protein: null, productId: 'b' }),
      ],
      formatGrams,
    );

    expect(draft).toMatchObject({ carbs: 31, fats: null, kcal: 151, protein: 5 });
  });
});
