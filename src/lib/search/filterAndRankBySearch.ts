type SearchableValue = string | readonly string[];

export type RankedSearchFields<T> = readonly [
  (item: T) => SearchableValue,
  ...Array<(item: T) => SearchableValue>,
];

/**
 * Filters by a case-insensitive substring and ranks matches by field priority,
 * while preserving the original order within each priority.
 */
export function filterAndRankBySearch<T>(
  items: readonly T[],
  search: string,
  fields: RankedSearchFields<T>,
) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return items;
  }

  const rankedMatches = fields.map((getValue) => ({ getValue, matches: [] as T[] }));

  for (const item of items) {
    for (const rank of rankedMatches) {
      const value = rank.getValue(item);
      const values = typeof value === 'string' ? [value] : value;

      if (values.some((candidate) => candidate.toLowerCase().includes(normalizedSearch))) {
        rank.matches.push(item);
        break;
      }
    }
  }

  return rankedMatches.flatMap((rank) => rank.matches);
}
