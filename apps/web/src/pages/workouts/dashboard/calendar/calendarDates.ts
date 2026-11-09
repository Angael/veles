import {
  addDays,
  addMonths,
  differenceInCalendarMonths,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { WorkoutSummary } from '../../workouts.server';

const WEEK = { weekStartsOn: 1 } as const;
const MONTHS_BACK = 60;
const MONTHS_AHEAD = 3;
const GRID_DAYS = 42;
/** Full brightness from this much training in a day; longer days are usually a forgotten Finish. */
const FULL_SECONDS = 2 * 60 * 60;

export const MONTH_PAGES = MONTHS_BACK + 1 + MONTHS_AHEAD;

const toDateOnly = (date: Date) => format(date, 'yyyy-MM-dd');
const clampPage = (page: number, pages: number) => Math.min(Math.max(page, 0), pages - 1);

export const monthAt = (origin: string, page: number) =>
  toDateOnly(addMonths(startOfMonth(parseISO(origin)), page - MONTHS_BACK));

export const monthPage = (origin: string, date: string) =>
  clampPage(
    MONTHS_BACK + differenceInCalendarMonths(parseISO(date), parseISO(origin)),
    MONTH_PAGES,
  );

export const sameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);

/** The 1st of the date's month, which is also the key of its calendar page. */
export const monthOf = (date: string) => `${date.slice(0, 7)}-01`;

/** Always six weeks, so paging months never moves the content below the calendar. */
export const monthGridDays = (month: string) =>
  Array.from({ length: GRID_DAYS }, (_, index) =>
    toDateOnly(addDays(startOfWeek(parseISO(month), WEEK), index)),
  );

export function calendarRange(month: string) {
  const days = monthGridDays(month);
  return { from: days[0] ?? month, to: days.at(-1) ?? month };
}

/** Workouts per local day, earliest first within a day. */
export function groupByDay(workouts: WorkoutSummary[]) {
  const days = new Map<string, WorkoutSummary[]>();
  for (const workout of workouts.toReversed()) {
    days.set(workout.date, [...(days.get(workout.date) ?? []), workout]);
  }
  return days;
}

export function totalsOf(workouts: WorkoutSummary[]) {
  return {
    exercises: workouts.reduce((sum, workout) => sum + workout.exerciseCount, 0),
    open: workouts.some((workout) => workout.endedAt === null),
    seconds: workouts.reduce((sum, workout) => sum + (workout.durationSeconds ?? 0), 0),
  };
}

/** 1–4: how brightly a day is lit, in quarters of the two-hour scale. */
export const heatLevel = (seconds: number) =>
  Math.max(1, Math.min(4, Math.ceil((Math.min(seconds, FULL_SECONDS) / FULL_SECONDS) * 4)));

/** `45m`, `2h`, `1h 12m`: short enough for a month cell on a phone. */
export function formatCompactDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes % 60 === 0 ? `${hours}h` : `${hours}h ${minutes % 60}m`;
}

/**
 * The day to show after moving to another month: the current choice or today when that month holds
 * them, otherwise its latest workout, so the list below the calendar is not needlessly empty.
 */
export function dayForMonth(
  month: string,
  anchor: string,
  today: string,
  workouts: WorkoutSummary[],
) {
  if (sameMonth(anchor, month)) return anchor;
  if (sameMonth(today, month)) return today;
  return workouts.find((workout) => sameMonth(workout.date, month))?.date ?? month;
}
