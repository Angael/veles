import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { addDays, format, parseISO } from 'date-fns';
import { WorkoutContextMenu } from '../../WorkoutContextMenu';
import type { WorkoutSummary } from '../../workouts.server';
import { workoutCalendarQueryOptions } from '../dashboard.query';
import calendarCss from './Calendar.module.css';
import { CalendarHeader, usePeriodSummary } from './CalendarHeader';
import { CalendarPager } from './CalendarPager';
import {
  formatCompactDuration,
  groupByDay,
  heatLevel,
  monthAt,
  monthGridDays,
  MONTH_PAGES,
  monthPage,
  sameMonth,
} from './calendarDates';
import css from './MonthView.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export type CalendarViewProps = {
  anchor: string;
  onSelect: (date: string) => void;
  origin: string;
  today: string;
};

/** Google Calendar style month: each workout is a named block on its day. */
export function MonthView({ anchor, onSelect, origin, today }: CalendarViewProps) {
  const { dateLocale, t } = useI18n();
  const page = monthPage(origin, anchor);
  const month = monthAt(origin, page);
  const { data } = useQuery(workoutCalendarQueryOptions(month));
  const summary = usePeriodSummary(data?.filter((workout) => sameMonth(workout.date, month)));
  const monday = monthGridDays(today)[0] ?? today;

  const goTo = (target: number) => {
    const next = monthAt(origin, target);
    if (sameMonth(next, anchor)) return onSelect(anchor);
    onSelect(sameMonth(next, today) ? today : next);
  };

  return (
    <div className={calendarCss.monthView}>
      <CalendarHeader
        nextLabel={t({ en: 'Next month', pl: 'Następny miesiąc' })}
        onNext={page < MONTH_PAGES - 1 ? () => goTo(page + 1) : undefined}
        onPrevious={page > 0 ? () => goTo(page - 1) : undefined}
        onToday={sameMonth(anchor, today) ? undefined : () => onSelect(today)}
        previousLabel={t({ en: 'Previous month', pl: 'Poprzedni miesiąc' })}
        summary={summary}
        title={format(parseISO(month), 'LLLL yyyy', { locale: dateLocale })}
      />
      <div aria-hidden='true' className={css.weekdays}>
        {Array.from({ length: 7 }, (_, day) => (
          <span key={day}>
            {format(addDays(parseISO(monday), day), 'EEE', { locale: dateLocale })}
          </span>
        ))}
      </div>
      <CalendarPager
        count={MONTH_PAGES}
        index={page}
        label={t({ en: 'Months', pl: 'Miesiące' })}
        onIndexChange={goTo}
        overscan={1}
        renderPage={(target) => <MonthGrid month={monthAt(origin, target)} today={today} />}
      />
    </div>
  );
}

function MonthGrid({ month, today }: { month: string; today: string }) {
  const { data } = useQuery(workoutCalendarQueryOptions(month));
  const byDay = groupByDay(data ?? []);

  return (
    <ol className={css.grid}>
      {monthGridDays(month).map((date) => (
        <li
          className={clsx(
            css.day,
            !sameMonth(date, month) && css.outside,
            date === today && css.today,
          )}
          key={date}
        >
          <time dateTime={date}>{Number(date.slice(8))}</time>
          {byDay.get(date)?.map((workout) => (
            <WorkoutBlock key={workout.id} workout={workout} />
          ))}
        </li>
      ))}
    </ol>
  );
}

function WorkoutBlock({ workout }: { workout: WorkoutSummary }) {
  const { t } = useI18n();
  const open = workout.endedAt === null;
  const seconds = workout.durationSeconds ?? 0;
  const exercises = t({
    en: `${workout.exerciseCount} ex`,
    pl: `${workout.exerciseCount} ćw.`,
  });

  return (
    <WorkoutContextMenu
      trigger={
        <Link
          className={clsx(
            css.block,
            calendarCss[`level${heatLevel(seconds)}`],
            open && calendarCss.live,
          )}
          params={{ id: workout.id }}
          title={workout.name}
          to='/workouts/$id'
        />
      }
      workout={workout}
    >
      <strong>{workout.name}</strong>
      <span>
        {open
          ? t({ en: 'In progress', pl: 'W trakcie' })
          : [exercises, seconds > 0 ? formatCompactDuration(seconds) : null]
              .filter(Boolean)
              .join(' · ')}
      </span>
    </WorkoutContextMenu>
  );
}
