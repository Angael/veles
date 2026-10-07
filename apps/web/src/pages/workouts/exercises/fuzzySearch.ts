/** Lowercase, strip accents ("wyciskanie łąka" → "wyciskanie laka") and punctuation. */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim();
}

/** Optimal string alignment distance: Levenshtein plus swapped neighbours ("bnech" → "bench"). */
function editDistance(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_row, i) =>
    Array.from({ length: b.length + 1 }, (_cell, j) => (i === 0 || j === 0 ? i + j : 0)),
  );
  const at = (i: number, j: number) => rows[i]?.[j] ?? Infinity;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, at(i - 2, j - 2) + 1);
      }
      const row = rows[i];
      if (row) row[j] = best;
    }
  }
  return at(a.length, b.length);
}

function isSubsequence(needle: string, haystack: string) {
  let index = 0;
  for (const char of haystack) if (char === needle[index]) index++;
  return index === needle.length;
}

/** Score one typed word against one name word; 0 means no match. */
function scoreToken(token: string, word: string) {
  if (word.startsWith(token)) return 4;
  if (word.includes(token)) return 3;
  // Typo tolerance grows with length; compare to a same-length prefix so half-typed words work.
  const allowed = Math.min(2, Math.floor(token.length / 3.5));
  if (allowed > 0 && editDistance(token, word.slice(0, token.length)) <= allowed) return 2;
  if (allowed > 0 && editDistance(token, word) <= allowed) return 2;
  if (token.length >= 3 && isSubsequence(token, word)) return 1;
  return 0;
}

/**
 * Scores a user-typed query against an exercise name; null when any typed word finds no match.
 * Handles typos, swapped letters, accents, word order and missing spaces ("benchpress").
 */
export function fuzzyScore(query: string, name: string): number | null {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;
  const words = normalize(name).split(' ');
  const joined = words.join('');
  let total = 0;
  for (const token of tokens) {
    const best = Math.max(
      scoreToken(token, joined),
      ...words.map((word) => scoreToken(token, word)),
    );
    if (best === 0) return null;
    total += best;
  }
  return total;
}

/** Filters and ranks items by `fuzzyScore`, breaking ties with `weight` (e.g. how often used). */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  name: (item: T) => string,
  weight: (item: T) => number,
) {
  return items
    .map((item) => ({ item, score: fuzzyScore(query, name(item)) }))
    .filter((entry): entry is { item: T; score: number } => entry.score !== null)
    .toSorted((a, b) => b.score - a.score || weight(b.item) - weight(a.item))
    .map((entry) => entry.item);
}
