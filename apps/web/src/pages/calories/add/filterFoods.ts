import type { CalorieFood } from '../calories.api';

function fuzzyTermScore(value: string, term: string) {
  const substringIndex = value.indexOf(term);
  if (substringIndex >= 0) return substringIndex === 0 ? 0 : substringIndex + 1;

  let valueIndex = 0;
  let firstMatch = -1;
  let gaps = 0;
  for (const character of term) {
    const matchIndex = value.indexOf(character, valueIndex);
    if (matchIndex < 0) return null;
    if (firstMatch < 0) firstMatch = matchIndex;
    gaps += matchIndex - valueIndex;
    valueIndex = matchIndex + 1;
  }

  return 20 + firstMatch + gaps;
}

/** Filters a client-side food catalog with token-aware substring and ordered-character matching. */
export function filterFoods(foods: CalorieFood[], query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return foods;

  return foods
    .map((food) => {
      const value = `${food.name} ${food.brand ?? ''}`.toLocaleLowerCase();
      const scores = terms.map((term) => fuzzyTermScore(value, term));
      if (scores.some((score) => score === null)) return null;

      return { food, score: scores.reduce<number>((total, score) => total + (score ?? 0), 0) };
    })
    .filter((result): result is { food: CalorieFood; score: number } => result !== null)
    .sort(
      (left, right) => left.score - right.score || left.food.name.localeCompare(right.food.name),
    )
    .map(({ food }) => food);
}
