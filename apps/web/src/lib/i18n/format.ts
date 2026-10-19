import { parseISO } from 'date-fns';
import { enGB, pl } from 'date-fns/locale';
import type { Locale } from './locale';

const dateFnsLocales = { en: enGB, pl } as const;
/** English dates stay day-first (`06/10`), as the app showed them before translation. */
const intlDateLocales = { en: 'en-GB', pl: 'pl' } as const;

/** Locale object for date-fns functions such as `format` and `startOfWeek`. */
export function dateFnsLocale(locale: Locale) {
  return dateFnsLocales[locale];
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** Formats a `Date` or an ISO date string (`YYYY-MM-DD` stays a local calendar date). */
export function formatDate(
  locale: Locale,
  value: Date | string,
  options: Intl.DateTimeFormatOptions,
) {
  const date = typeof value === 'string' ? parseISO(value) : value;

  return new Intl.DateTimeFormat(intlDateLocales[locale], options).format(date);
}
