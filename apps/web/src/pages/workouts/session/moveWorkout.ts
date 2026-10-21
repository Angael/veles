/**
 * Columns that move a session to another local day, or null when the day stays the same. Only the
 * session row changes, so exercises, sets and notes move with it. A name still matching the old
 * day's default ("Monday workout") follows the new day; a custom name stays.
 */
export function workoutMovePatch(
  current: { date: string; name: string },
  date: string,
  defaultName: (date: string) => string,
) {
  if (date === current.date) return null;
  return current.name === defaultName(current.date) ? { date, name: defaultName(date) } : { date };
}
