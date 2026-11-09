import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { DumbbellIcon } from 'lucide-react';
import { WorkoutList } from '../../WorkoutList';
import { workoutCalendarQueryOptions } from '../dashboard.query';
import calendarCss from './Calendar.module.css';
import { CalendarHeader, usePeriodSummary } from './CalendarHeader';
import { CalendarPager } from './CalendarPager';
import {
  dayForWeek,
  formatCompactDuration,
  groupByDay,
  heatLevel,
  monthOfDate,
  monthOfWeek,
  totalsOf,
  weekAt,
  weekDays,
  WEEK_PAGES,
  weekPage,
} from './calendarDates';
import type { CalendarViewProps } from './MonthView';
import css from './WeekView.module.css';
import { type I18n, useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

function weekTitle(monday: string, dateLocale: I18n['dateLocale']) {
  const start = parseISO(monday);
  const end = parseISO(weekDays(monday).at(-1) ?? monday);
  const startLabel = format(start, start.getMonth() === end.getMonth() ? 'd' : 'd MMM', {
    locale: dateLocale,
  });
  return `${startLabel} – ${format(end, 'd MMM', { locale: dateLocale })}`;
}

/** Swipeable week on phones: a day column shows how much was done, the list below shows what. */
export function WeekView({ anchor, onSelect, origin, today }: CalendarViewProps) {
  const { dateLocale, t } = useI18n();
  const queryClient = useQueryClient();
  const page = weekPage(origin, anchor);
  const monday = weekAt(origin, page);
  const { data } = useQuery(workoutCalendarQueryOptions(monthOfWeek(monday)));
  const week = new Set(weekDays(monday));
  const summary = usePeriodSummary(data?.filter((workout) => week.has(workout.date)));

  const goTo = (target: number) => {
    const nextMonday = weekAt(origin, target);
    const cached = queryClient.getQueryData(
      workoutCalendarQueryOptions(monthOfWeek(nextMonday)).queryKey,
    );
    onSelect(dayForWeek(nextMonday, anchor, today, cached ?? []));
  };

  return (
    <div className={calendarCss.weekView}>
      <CalendarHeader
        nextLabel={t({ en: 'Next week', pl: 'Następny tydzień' })}
        onNext={page < WEEK_PAGES - 1 ? () => goTo(page + 1) : undefined}
        onPrevious={page > 0 ? () => goTo(page - 1) : undefined}
        onToday={week.has(today) ? undefined : () => onSelect(today)}
        previousLabel={t({ en: 'Previous week', pl: 'Poprzedni tydzień' })}
        summary={summary}
        title={weekTitle(monday, dateLocale)}
      />
      <CalendarPager
        count={WEEK_PAGES}
        index={page}
        label={t({ en: 'Weeks', pl: 'Tygodnie' })}
        onIndexChange={goTo}
        overscan={2}
        renderPage={(target) => (
          <WeekStrip
            monday={weekAt(origin, target)}
            onSelect={onSelect}
            selected={anchor}
            today={today}
          />
        )}
      />
      <DayAgenda date={anchor} today={today} />
    </div>
  );
}

type WeekStripProps = {
  monday: string;
  onSelect: (date: string) => void;
  selected: string;
  today: string;
};

function WeekStrip({ monday, onSelect, selected, today }: WeekStripProps) {
  const { dateLocale, formatDate, t } = useI18n();
  const { data } = useQuery(workoutCalendarQueryOptions(monthOfWeek(monday)));
  const byDay = groupByDay(data ?? []);

  return (
    <ol className={css.strip}>
      {weekDays(monday).map((date) => {
        const workouts = byDay.get(date) ?? [];
        const { exercises, open, seconds } = totalsOf(workouts);
        const duration = seconds > 0 ? formatCompactDuration(seconds) : null;
        const label = [
          formatDate(date, { day: 'numeric', month: 'long', weekday: 'long' }),
          workouts.length > 0
            ? t({
                en: `${exercises} ${pluralEn(exercises, 'exercise', 'exercises')}`,
                pl: `${exercises} ${pluralPl(exercises, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}`,
              })
            : null,
          duration,
        ]
          .filter(Boolean)
          .join(', ');

        return (
          <li key={date}>
            <button
              aria-label={label}
              aria-pressed={date === selected}
              className={clsx(css.day, date === selected && css.selected)}
              onClick={() => onSelect(date)}
              type='button'
            >
              <span className={css.weekday}>
                {format(parseISO(date), 'EEEEEE', { locale: dateLocale })}
              </span>
              <span className={clsx(css.number, date === today && css.today)}>
                {Number(date.slice(8))}
              </span>
              {workouts.length > 0 ? (
                <span
                  className={clsx(
                    css.tile,
                    calendarCss[`level${heatLevel(seconds)}`],
                    open && calendarCss.live,
                  )}
                >
                  <span className={css.exercises}>
                    <DumbbellIcon aria-hidden='true' />
                    {exercises}
                  </span>
                  {duration ? <span>{duration}</span> : null}
                </span>
              ) : (
                <span className={css.emptyTile} />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** The chosen day's workouts, with the names and details that do not fit in a week column. */
function DayAgenda({ date, today }: { date: string; today: string }) {
  const { formatDate, t } = useI18n();
  const { data, isPending } = useQuery(workoutCalendarQueryOptions(monthOfDate(date)));
  const workouts = groupByDay(data ?? []).get(date) ?? [];

  if (isPending) return <div className={css.agenda} />;
  return (
    <div className={css.agenda}>
      {workouts.length > 0 ? (
        <WorkoutList workouts={workouts} />
      ) : (
        <p className={css.rest}>
          {date === today
            ? t({ en: 'No workout yet today', pl: 'Dziś jeszcze bez treningu' })
            : `${formatDate(date, { day: 'numeric', month: 'long', weekday: 'long' })} · ${t({
                en: 'no workout',
                pl: 'bez treningu',
              })}`}
        </p>
      )}
    </div>
  );
}
