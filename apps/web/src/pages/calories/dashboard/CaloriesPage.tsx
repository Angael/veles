import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { addDays, format, isAfter, isBefore, parseISO } from 'date-fns';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { CalorieDashboard, CalorieDashboardDay } from '../calories.api';
import { calorieDashboardQueryOptions } from '../calories.query';
import { CalorieOverview } from './CalorieOverview';
import { LogFoodMenu } from './LogFoodMenu';
import { useWeekSwipe } from './useWeekSwipe';
import { CALORIE_DATE_FORMAT, calorieWeekDates, todayLocalDate } from '../calorieHelpers';
import { Btn } from '@/components/btn/Btn';
import css from './CaloriesPage.module.css';

type CaloriesPageProps = { dashboard: CalorieDashboard; date: string };

export function CaloriesPage({ dashboard, date }: CaloriesPageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const todayDate = todayLocalDate();
  const today = parseISO(todayDate);
  const selectedDay = dashboard.days.find((day) => day.date === date);

  if (!selectedDay) {
    throw new Error(`Calorie dashboard does not contain selected date ${date}.`);
  }

  function prefetchWeek(amount: number) {
    const nextDate = format(addDays(parseISO(date), amount * 7), CALORIE_DATE_FORMAT);
    void queryClient.prefetchQuery(calorieDashboardQueryOptions(nextDate));
  }

  function shiftWeek(amount: number) {
    const nextDate = format(addDays(parseISO(date), amount * 7), CALORIE_DATE_FORMAT);
    void navigate({ to: '/calories', search: { date: nextDate } });
  }

  const weekSwipe = useWeekSwipe({ onSwipe: shiftWeek });

  return (
    <main className={css.page} {...weekSwipe}>
      <LogFoodMenu date={date} />

      <div className={css.dateControls} data-appear>
        <Btn
          className={css.todayButton}
          disabled={date === todayDate}
          icon={<CalendarDaysIcon aria-hidden='true' />}
          onClick={() => void navigate({ to: '/calories', search: {} })}
          size='sm'
          variant='outlineMain'
        >
          Today
        </Btn>

        <div className={css.dayStrip}>
          <Btn
            aria-label='Previous week'
            className={css.dayNav}
            icon={<ChevronLeftIcon aria-hidden='true' />}
            iconOnly
            onClick={() => shiftWeek(-1)}
            onFocus={() => prefetchWeek(-1)}
            onPointerEnter={() => prefetchWeek(-1)}
            onTouchStart={() => prefetchWeek(-1)}
            size='sm'
            variant='ghost'
          />
          <ToggleGroup
            aria-label='Diary week'
            className={css.dayOptions}
            onValueChange={(values) => {
              const selected = values[0];
              if (selected) void navigate({ to: '/calories', search: { date: selected } });
            }}
            value={[date]}
          >
            {calorieWeekDates(date).map((day) => {
              const parsedDay = parseISO(day);
              const dayStatus = dashboard.days.find((status) => status.date === day);
              const isFuture = isAfter(parsedDay, today);
              const isToday = day === todayDate;
              const isPast = isBefore(parsedDay, today);
              const statusClass =
                isPast && dayStatus?.hasLogs
                  ? dayStatus.withinKcalGoal === true
                    ? css.dayWithinGoal
                    : dayStatus.overKcalGoal
                      ? css.dayOverGoal
                      : css.dayLogged
                  : undefined;

              return (
                <Toggle
                  className={clsx(
                    css.day,
                    isFuture && css.futureDay,
                    isToday && css.todayDay,
                    statusClass,
                  )}
                  key={day}
                  value={day}
                >
                  <span className={css.compactDay}>{format(parsedDay, 'EEEEE')}</span>
                  <span className={css.expandedDay}>{format(parsedDay, 'EEEE')}</span>
                  <strong className={css.compactDay}>{format(parsedDay, 'd')}</strong>
                  <strong className={css.expandedDay}>{format(parsedDay, 'dd.MM')}</strong>
                  <DayProgress
                    dayStatus={dayStatus}
                    isFuture={isFuture}
                    isPast={isPast}
                    isToday={isToday}
                  />
                </Toggle>
              );
            })}
          </ToggleGroup>
          <Btn
            aria-label='Next week'
            className={css.dayNav}
            icon={<ChevronRightIcon aria-hidden='true' />}
            iconOnly
            onClick={() => shiftWeek(1)}
            onFocus={() => prefetchWeek(1)}
            onPointerEnter={() => prefetchWeek(1)}
            onTouchStart={() => prefetchWeek(1)}
            size='sm'
            variant='ghost'
          />
        </div>
      </div>

      <CalorieOverview
        date={date}
        goal={selectedDay.goal}
        logs={selectedDay.logs}
        totals={selectedDay.totals}
      />
    </main>
  );
}

/** Shows kcal goal progress while keeping today's state neutral. */
function DayProgress({
  dayStatus,
  isFuture,
  isPast,
  isToday,
}: {
  dayStatus: CalorieDashboardDay | undefined;
  isFuture: boolean;
  isPast: boolean;
  isToday: boolean;
}) {
  if (!dayStatus?.goal) return null;

  const goalKcal = dayStatus.goal.kcal;
  const consumedKcal = dayStatus.totals.kcal;
  const progress = progressFor(consumedKcal, goalKcal);
  const overProgress =
    isPast && consumedKcal > goalKcal ? progressFor(consumedKcal - goalKcal, goalKcal) : null;
  const fillClass = isToday
    ? css.dayProgressToday
    : isFuture
      ? css.dayProgressFuture
      : dayStatus.withinKcalGoal
        ? css.dayProgressSuccess
        : css.dayProgressFill;

  return (
    <span
      aria-label={`${Math.round(consumedKcal)} of ${Math.round(goalKcal)} kcal`}
      aria-valuemax={goalKcal}
      aria-valuemin={0}
      aria-valuenow={Math.min(consumedKcal, goalKcal)}
      className={css.dayProgress}
      role='progressbar'
    >
      <span
        aria-hidden='true'
        className={clsx(css.dayProgressFill, fillClass)}
        style={{ width: `${progress}%` }}
      />
      {overProgress === null ? null : (
        <span
          aria-hidden='true'
          className={css.dayProgressOver}
          style={{ width: `${overProgress}%` }}
        />
      )}
    </span>
  );
}

function progressFor(value: number, goal: number) {
  if (goal <= 0) return value > 0 ? 100 : 0;
  return Math.min(Math.max((value / goal) * 100, 0), 100);
}
