import { parseISO } from 'date-fns';
import type { Locale, Localized } from '@/lib/i18n/locale';

const WEEKDAY_NAMES: Localized<string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  pl: ['Niedzielny', 'Poniedziałkowy', 'Wtorkowy', 'Środowy', 'Czwartkowy', 'Piątkowy', 'Sobotni'],
};

/** Exercises named in a derived name; the rest show as "+N" so the name stays one short line. */
const MAX_NAMED_EXERCISES = 3;

function weekdayName(locale: Locale, weekday: number) {
  const day = WEEKDAY_NAMES[locale][weekday];
  return locale === 'pl' ? `${day} trening` : `${day} workout`;
}

const DEFAULT_NAMES = new Set(
  (['en', 'pl'] as const).flatMap((locale) =>
    WEEKDAY_NAMES[locale].map((_, weekday) => weekdayName(locale, weekday)),
  ),
);

/**
 * "Monday workout" / "Poniedziałkowy trening" for the session's local day. Stored on new sessions
 * as the marker of an untouched name.
 */
export function defaultWorkoutName(date: string, locale: Locale) {
  return weekdayName(locale, parseISO(date).getDay());
}

/** "Bench press · Squat · Row +2" from the session's exercises in order, repeats shown once. */
function exercisesName(exerciseNames: string[]) {
  const unique = [...new Set(exerciseNames)];
  const named = unique.slice(0, MAX_NAMED_EXERCISES).join(' · ');
  const rest = unique.length - MAX_NAMED_EXERCISES;
  return rest > 0 ? `${named} +${rest}` : named;
}

/**
 * Name to show for a session. An untouched default name is rebuilt at display time from the
 * session's current exercises, or from its day and the current locale while it has none; a
 * renamed session keeps its name.
 */
export function workoutName(
  workout: { date: string; name: string },
  exerciseNames: string[],
  locale: Locale,
) {
  if (!DEFAULT_NAMES.has(workout.name)) return workout.name;
  return exerciseNames.length
    ? exercisesName(exerciseNames)
    : defaultWorkoutName(workout.date, locale);
}
