import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { WorkoutSummary } from '../../workouts.server';

const WEEK = { weekStartsOn: 1 } as const;
const MONTHS_BACK = 60;
const MONTHS_AHEAD = 3;
const WEEKS_BACK = 261;
const WEEKS_AHEAD = 13;
const GRID_DAYS = 42;
/** Full brightness from this much training in a day; longer days are usually a forgotten Finish. */
const FULL_SECONDS = 2 * 60 * 60;

export const MONTH_PAGES = MONTHS_BACK + 1 + MONTHS_AHEAD;
export const WEEK_PAGES = WEEKS_BACK + 1 + WEEKS_AHEAD;

const toDateOnly = (date: Date) => format(date, 'yyyy-MM-dd');
const clampPage = (page: number, pages: number) => Math.min(Math.max(page, 0), pages - 1);

export const monthAt = (origin: string, page: number) =>
  toDateOnly(addMonths(startOfMonth(parseISO(origin)), page - MONTHS_BACK));

export const monthPage = (origin: string, date: string) =>
  clampPage(
    MONTHS_BACK + differenceInCalendarMonths(parseISO(date), parseISO(origin)),
    MONTH_PAGES,
  );

export const weekAt = (origin: string, page: number) =>
  toDateOnly(addWeeks(startOfWeek(parseISO(origin), WEEK), page - WEEKS_BACK));

export const weekPage = (origin: string, date: string) =>
  clampPage(
    WEEKS_BACK + differenceInCalendarWeeks(parseISO(date), parseISO(origin), WEEK),
    WEEK_PAGES,
  );

export const sameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);

/** The month grid that holds a whole week, because it always covers the week of its last Monday. */
export const monthOfWeek = (monday: string) => `${monday.slice(0, 7)}-01`;

export const monthOfDate = (date: string) =>
  monthOfWeek(toDateOnly(startOfWeek(parseISO(date), WEEK)));

const daysFrom = (start: Date, count: number) =>
  Array.from({ length: count }, (_, index) => toDateOnly(addDays(start, index)));

export const weekDays = (monday: string) => daysFrom(parseISO(monday), 7);

/** Always six weeks, so paging months never moves the content below the calendar. */
export const monthGridDays = (month: string) =>
  daysFrom(startOfWeek(parseISO(month), WEEK), GRID_DAYS);

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

/** `45m`, `2h`, `1h 12m`: short enough for a week column on a phone. */
export function formatCompactDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes % 60 === 0 ? `${hours}h` : `${hours}h ${minutes % 60}m`;
}

/**
 * The day to show after moving to another week: the current choice or today when that week holds
 * them, otherwise its latest workout, so the list below the week is not needlessly empty.
 */
export function dayForWeek(
  monday: string,
  anchor: string,
  today: string,
  workouts: WorkoutSummary[],
) {
  const days = weekDays(monday);
  if (days.includes(anchor)) return anchor;
  if (days.includes(today)) return today;
  const trained = new Set(workouts.map((workout) => workout.date));
  const weekday = (parseISO(anchor).getDay() + 6) % 7;
  return days.findLast((day) => trained.has(day)) ?? days[weekday] ?? monday;
}
