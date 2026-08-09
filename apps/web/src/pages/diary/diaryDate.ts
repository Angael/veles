import { type } from 'arktype';
import { format, isMatch, parseISO } from 'date-fns';

const dateOnlyFormat = 'yyyy-MM-dd';

export const diaryEntryDateType = type('string.date.iso').narrow((value, ctx) =>
  isMatch(value, dateOnlyFormat) ? true : ctx.mustBe('a valid date in YYYY-MM-DD format'),
);

/** Formats valid diary dates without letting legacy invalid data crash rendering. */
export function formatDiaryDate(value: string) {
  if (!isMatch(value, dateOnlyFormat)) {
    return 'Invalid date';
  }

  return format(parseISO(value), 'MMMM d, yyyy');
}
