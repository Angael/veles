import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';
import { WorkoutList } from '../../WorkoutList';
import { workoutCalendarQueryOptions } from '../dashboard.query';
import { CalendarHeader, usePeriodSummary } from './CalendarHeader';
import { CalendarPager } from './CalendarPager';
import {
  dayForMonth,
  groupByDay,
  monthAt,
  monthGridDays,
  MONTH_PAGES,
  monthPage,
  sameMonth,
} from './calendarDates';
import { MonthDay } from './MonthDay';
import css from './MonthView.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type MonthViewProps = {
  anchor: string;
  onSelect: (date: string) => void;
  origin: string;
  today: string;
};

/**
 * Swipeable month. Wide screens show each workout as a named block on its day. Phone cells only
 * fit totals, so tapping a day lists its workouts below the grid.
 */
export function MonthView({ anchor, onSelect, origin, today }: MonthViewProps) {
  const { dateLocale, t } = useI18n();
  const queryClient = useQueryClient();
  const page = monthPage(origin, anchor);
  const month = monthAt(origin, page);
  const { data } = useQuery(workoutCalendarQueryOptions(month));
  const summary = usePeriodSummary(data?.filter((workout) => sameMonth(workout.date, month)));
  const monday = monthGridDays(today)[0] ?? today;

  const goTo = (target: number) => {
    const next = monthAt(origin, target);
    const cached = queryClient.getQueryData(workoutCalendarQueryOptions(next).queryKey);
    onSelect(dayForMonth(next, anchor, today, cached ?? []));
  };

  return (
    <>
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
        renderPage={(target) => (
          <MonthGrid
            month={monthAt(origin, target)}
            onSelect={onSelect}
            selected={anchor}
            today={today}
          />
        )}
      />
      <DayAgenda date={anchor} month={month} today={today} />
    </>
  );
}

type MonthGridProps = {
  month: string;
  onSelect: (date: string) => void;
  selected: string;
  today: string;
};

function MonthGrid({ month, onSelect, selected, today }: MonthGridProps) {
  const { data } = useQuery(workoutCalendarQueryOptions(month));
  const byDay = groupByDay(data ?? []);

  return (
    <ol className={css.grid}>
      {monthGridDays(month).map((date) => (
        <MonthDay
          date={date}
          key={date}
          month={month}
          onSelect={onSelect}
          selected={date === selected}
          today={date === today}
          workouts={byDay.get(date) ?? []}
        />
      ))}
    </ol>
  );
}

/** The chosen day's workouts on phones, with the names and details that do not fit in a cell. */
function DayAgenda({ date, month, today }: { date: string; month: string; today: string }) {
  const { formatDate, t } = useI18n();
  const { data, isPending } = useQuery(workoutCalendarQueryOptions(month));
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
