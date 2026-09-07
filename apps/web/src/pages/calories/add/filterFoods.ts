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

type RankedFood = { food: CalorieFood; score: number };

/** Finds the best catalog matches in one pass while retaining only the requested result count. */
export function filterFoods(foods: CalorieFood[], query: string, limit: number) {
  if (limit <= 0) return [];

  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return foods.slice(0, limit);

  const terms = normalizedQuery.split(/\s+/);
  const rankedFoods: RankedFood[] = [];

  for (const food of foods) {
    const value = food.name.toLocaleLowerCase();
    let score = 0;
    let matches = true;

    for (const term of terms) {
      const termScore = fuzzyTermScore(value, term);
      if (termScore === null) {
        matches = false;
        break;
      }
      score += termScore;
    }

    if (!matches) continue;

    let insertionIndex = 0;
    for (const rankedFood of rankedFoods) {
      const scoreComparison = score - rankedFood.score;
      if (
        scoreComparison < 0 ||
        (scoreComparison === 0 && food.name.localeCompare(rankedFood.food.name) < 0)
      ) {
        break;
      }
      insertionIndex += 1;
    }

    if (insertionIndex >= limit) continue;
    rankedFoods.splice(insertionIndex, 0, { food, score });
    if (rankedFoods.length > limit) rankedFoods.pop();
  }

  const matches: CalorieFood[] = [];
  for (const rankedFood of rankedFoods) matches.push(rankedFood.food);
  return matches;
}
