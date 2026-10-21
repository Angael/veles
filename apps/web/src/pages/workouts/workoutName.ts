import { parseISO } from 'date-fns';
import type { Locale, Localized } from '@/lib/i18n/locale';

const WEEKDAY_NAMES: Localized<string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  pl: ['Niedzielny', 'Poniedziałkowy', 'Wtorkowy', 'Środowy', 'Czwartkowy', 'Piątkowy', 'Sobotni'],
};

function weekdayName(locale: Locale, weekday: number) {
  const day = WEEKDAY_NAMES[locale][weekday];
  return locale === 'pl' ? `${day} trening` : `${day} workout`;
}

const DEFAULT_NAMES = new Set(
  (['en', 'pl'] as const).flatMap((locale) =>
    WEEKDAY_NAMES[locale].map((_, weekday) => weekdayName(locale, weekday)),
  ),
);

/** "Monday workout" / "Poniedziałkowy trening" for the session's local day. */
export function defaultWorkoutName(date: string, locale: Locale) {
  return weekdayName(locale, parseISO(date).getDay());
}

/**
 * Name to show for a session. Untouched default names are stored in the language and on the day
 * of creation, so they are rebuilt from the current day and locale; a renamed session keeps its
 * name.
 */
export function workoutName(workout: { date: string; name: string }, locale: Locale) {
  return DEFAULT_NAMES.has(workout.name) ? defaultWorkoutName(workout.date, locale) : workout.name;
}
