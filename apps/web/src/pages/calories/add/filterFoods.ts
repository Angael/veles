import type { CalorieFood } from '../calories.api';
import { foodProductNames } from '../calorieHelpers';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';

/** At most this many recently logged foods are boosted to the top. */
const MAX_RECENT_FOODS = 5;

/** Match quality, lower is better. `Substring` and better count as strong matches. */
const MatchTier = { Exact: 0, Prefix: 1, WordPrefix: 2, Substring: 3, Fuzzy: 4 } as const;
type MatchTier = (typeof MatchTier)[keyof typeof MatchTier];

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

function termTier(value: string, term: string): MatchTier | null {
  if (value === term) return MatchTier.Exact;
  if (value.startsWith(term)) return MatchTier.Prefix;
  const index = value.indexOf(term);
  if (index > 0) {
    const previous = value[index - 1] ?? '';
    return /[\p{L}\p{N}]/u.test(previous) ? MatchTier.Substring : MatchTier.WordPrefix;
  }
  return fuzzyTermMatches(value, term) ? MatchTier.Fuzzy : null;
}

/** Scores one name by its weakest term, so every term must match. */
function nameTier(value: string, terms: string[]): MatchTier | null {
  let worst: MatchTier = MatchTier.Exact;
  for (const term of terms) {
    const tier = termTier(value, term);
    if (tier === null) return null;
    if (tier > worst) worst = tier;
  }
  return worst;
}

/** Returns the best match tier across the English and Polish names. */
function foodTier(food: CalorieFood, terms: string[]): MatchTier | null {
  let best: MatchTier | null = null;
  for (const name of [food.name, food.namePl]) {
    if (!name) continue;
    const tier = nameTier(name.toLocaleLowerCase(), terms);
    if (tier !== null && (best === null || tier < best)) best = tier;
  }
  return best;
}

function compareNames(first: CalorieFood, second: CalorieFood, locale: Locale) {
  return (
    foodProductNames(first)[locale].localeCompare(foodProductNames(second)[locale], locale) ||
    first.id.localeCompare(second.id)
  );
}

/**
 * Finds matching foods for the picker. Up to five recently logged foods come first, but only when
 * they match the query strongly (contiguous substring or better), so a loose fuzzy hit on a recent
 * food never pushes down a clearly better match. The rest is ordered by match quality, then name.
 */
export function filterFoods(
  foods: CalorieFood[],
  query: string,
  limit: number,
  locale: Locale = DEFAULT_LOCALE,
) {
  if (limit <= 0) return [];

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const terms = normalizedQuery ? normalizedQuery.split(/\s+/) : [];
  const matches: { food: CalorieFood; tier: MatchTier }[] = [];

  for (const food of foods) {
    const tier = foodTier(food, terms);
    if (tier !== null) matches.push({ food, tier });
  }

  const recent = matches
    .filter((match) => match.food.lastLoggedAt && match.tier <= MatchTier.Substring)
    .toSorted(
      (first, second) =>
        (second.food.lastLoggedAt ?? '').localeCompare(first.food.lastLoggedAt ?? '') ||
        compareNames(first.food, second.food, locale),
    )
    .slice(0, MAX_RECENT_FOODS);
  const recentIds = new Set(recent.map((match) => match.food.id));
  const rest = matches
    .filter((match) => !recentIds.has(match.food.id))
    .toSorted(
      (first, second) => first.tier - second.tier || compareNames(first.food, second.food, locale),
    );

  return [...recent, ...rest].slice(0, limit).map((match) => match.food);
}
