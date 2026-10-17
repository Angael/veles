import type { CalorieFood, CalorieFoodSuggestion } from '../calories.api';

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

function foodNameScore(food: CalorieFood, terms: string[]) {
  let bestScore: number | null = null;
  for (const name of [food.name, food.namePl]) {
    if (!name) continue;
    const value = name.toLocaleLowerCase();
    let score = 0;
    for (const term of terms) {
      const termScore = fuzzyTermScore(value, term);
      if (termScore === null) {
        score = -1;
        break;
      }
      score += termScore;
    }
    if (score >= 0 && (bestScore === null || score < bestScore)) bestScore = score;
  }
  return bestScore;
}

type RankedFood = { food: CalorieFoodSuggestion; score: number };

/** Orders recently logged matches first, then by name relevance, with a stable name/ID tie-break. */
function compareRankedFoods(a: RankedFood, b: RankedFood) {
  const aLoggedAt = a.food.lastLoggedAt;
  const bLoggedAt = b.food.lastLoggedAt;
  if (aLoggedAt !== bLoggedAt) {
    if (aLoggedAt === null) return 1;
    if (bLoggedAt === null) return -1;
    return aLoggedAt < bLoggedAt ? 1 : -1;
  }
  const order = a.score - b.score || a.food.name.localeCompare(b.food.name);
  if (order !== 0 || a.food.id === b.food.id) return order;
  return a.food.id < b.food.id ? -1 : 1;
}

/**
 * Finds the best catalog matches in one pass while retaining only the requested result count.
 * An empty query keeps the server order, which already lists recently logged foods first.
 */
export function filterFoods(foods: CalorieFoodSuggestion[], query: string, limit: number) {
  if (limit <= 0) return [];

  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return foods.slice(0, limit);

  const terms = normalizedQuery.split(/\s+/);
  const rankedFoods: RankedFood[] = [];

  for (const food of foods) {
    const score = foodNameScore(food, terms);
    if (score === null) continue;

    const candidate = { food, score };
    let insertionIndex = 0;
    for (const rankedFood of rankedFoods) {
      if (compareRankedFoods(candidate, rankedFood) < 0) break;
      insertionIndex += 1;
    }

    if (insertionIndex >= limit) continue;
    rankedFoods.splice(insertionIndex, 0, candidate);
    if (rankedFoods.length > limit) rankedFoods.pop();
  }

  const matches: CalorieFoodSuggestion[] = [];
  for (const rankedFood of rankedFoods) matches.push(rankedFood.food);
  return matches;
}
