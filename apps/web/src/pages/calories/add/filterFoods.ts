import type { CalorieFood } from '../calories.api';
import { foodProductNames } from '../calorieHelpers';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';

/** Checks that the term's characters appear in order; this also covers plain substrings. */
function fuzzyTermMatches(value: string, term: string) {
  let valueIndex = 0;
  for (const character of term) {
    const matchIndex = value.indexOf(character, valueIndex);
    if (matchIndex < 0) return false;
    valueIndex = matchIndex + 1;
  }
  return true;
}

function foodMatches(food: CalorieFood, terms: string[]) {
  return [food.name, food.namePl].some((name) => {
    if (!name) return false;
    const value = name.toLocaleLowerCase();
    return terms.every((term) => fuzzyTermMatches(value, term));
  });
}

/** Orders recently logged foods first, then by shown name and ID so ties stay stable. */
function compareFoods(first: CalorieFood, second: CalorieFood, locale: Locale) {
  const firstLoggedAt = first.lastLoggedAt ?? '';
  const secondLoggedAt = second.lastLoggedAt ?? '';
  if (firstLoggedAt !== secondLoggedAt) return firstLoggedAt > secondLoggedAt ? -1 : 1;

  return (
    foodProductNames(first)[locale].localeCompare(foodProductNames(second)[locale], locale) ||
    first.id.localeCompare(second.id)
  );
}

/** Finds matching foods, most recently logged first, retaining only the requested result count. */
export function filterFoods(
  foods: CalorieFood[],
  query: string,
  limit: number,
  locale: Locale = DEFAULT_LOCALE,
) {
  if (limit <= 0) return [];

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const terms = normalizedQuery ? normalizedQuery.split(/\s+/) : [];
  const matches: CalorieFood[] = [];

  for (const food of foods) {
    if (!foodMatches(food, terms)) continue;

    let insertionIndex = 0;
    for (const match of matches) {
      if (compareFoods(food, match, locale) < 0) break;
      insertionIndex += 1;
    }

    if (insertionIndex >= limit) continue;
    matches.splice(insertionIndex, 0, food);
    if (matches.length > limit) matches.pop();
  }

  return matches;
}
