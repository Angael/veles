import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { I18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

/** Whole local calendar days from the `YYYY-MM-DD` date to today; negative for future dates. */
export function daysAgo(date: string) {
  return differenceInCalendarDays(new Date(), parseISO(date));
}

/** Turns a `YYYY-MM-DD` date into "Today", "Yesterday", "3 days ago" or "In 2 days". */
export function formatDaysAgo(date: string, { t }: Pick<I18n, 't'>) {
  const days = daysAgo(date);
  if (days === 0) return t({ en: 'Today', pl: 'Dzisiaj' });
  if (days === 1) return t({ en: 'Yesterday', pl: 'Wczoraj' });
  if (days === -1) return t({ en: 'Tomorrow', pl: 'Jutro' });
  const count = Math.abs(days);
  const en = pluralEn(count, 'day', 'days');
  const pl = pluralPl(count, 'dzień', 'dni', 'dni');
  return days > 0
    ? t({ en: `${count} ${en} ago`, pl: `${count} ${pl} temu` })
    : t({ en: `In ${count} ${en}`, pl: `Za ${count} ${pl}` });
}
