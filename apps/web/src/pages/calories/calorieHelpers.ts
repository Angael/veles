import { addDays, format, isMatch, parseISO, startOfWeek } from 'date-fns';
import { todayLocalDate } from '@/lib/dateOnly';
import type { NavbarTarget, NavbarTargetMatch } from '@/lib/routing/staticRouteData';
import { type Localized, pluralEn, pluralPl } from '@/lib/i18n/locale';

export const CALORIE_DATE_FORMAT = 'yyyy-MM-dd';
/** Upper bound for scaling selected logs; keeps hundredths far from integer overflow. */
export const MAX_FOOD_LOG_MULTIPLIER = 20;

export function normalizeCalorieDate(value: string | undefined) {
  return value && isMatch(value, CALORIE_DATE_FORMAT) ? value : todayLocalDate();
}

/** Back fallback for calorie flows: the diary day the flow was opened for. */
export function caloriesDayTarget({ search }: NavbarTargetMatch): NavbarTarget {
  return {
    search: typeof search.date === 'string' ? { date: search.date } : {},
    to: '/calories',
  };
}

export function calorieWeekStart(selectedDate: string) {
  return format(startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), CALORIE_DATE_FORMAT);
}

export function calorieWeekDates(selectedDate: string) {
  const monday = parseISO(calorieWeekStart(selectedDate));
  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(monday, index), CALORIE_DATE_FORMAT),
  );
}

/** "3 products" in every locale, for selection dialogs and toasts. */
export function productCountText(count: number): Localized {
  return {
    en: `${count} ${pluralEn(count, 'product', 'products')}`,
    pl: `${count} ${pluralPl(count, 'produkt', 'produkty', 'produktów')}`,
  };
}

/** Catalog product name per locale; products without a Polish name show their only name. */
export function foodProductNames(product: { name: string; namePl: string | null }): Localized {
  return { en: product.name, pl: product.namePl ?? product.name };
}

export function isWithinKcalGoal(kcalHundredths: number, goalKcalHundredths: number) {
  return Math.abs(kcalHundredths - goalKcalHundredths) * 10 <= goalKcalHundredths;
}
