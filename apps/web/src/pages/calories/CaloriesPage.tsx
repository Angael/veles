import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { addDays, format, isAfter, parseISO } from 'date-fns';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { CalorieDashboard } from './calories.api';
import { calorieDashboardQueryOptions } from './calorieQueries';
import { CalorieOverview } from './CalorieOverview';
import { CALORIE_DATE_FORMAT, calorieWeekDates, todayLocalDate } from './calorieDate';
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
  return (
    <main className={css.page}>
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

            return (
              <Toggle
                className={clsx(css.day, isFuture && css.futureDay, isToday && css.todayDay)}
                key={day}
                value={day}
              >
                <span className={css.compactDay}>{format(parsedDay, 'EEEEE')}</span>
                <span className={css.expandedDay}>{format(parsedDay, 'EEEE')}</span>
                <strong className={css.compactDay}>{format(parsedDay, 'd')}</strong>
                <strong className={css.expandedDay}>{format(parsedDay, 'dd.MM')}</strong>
                {dayStatus?.hasLogs ? (
                  <CheckIcon
                    aria-hidden='true'
                    className={clsx(css.dayStatus, dayStatus.withinKcalGoal && css.dayStatusGood)}
                  />
                ) : null}
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
      <CalorieOverview
        date={date}
        goal={selectedDay.goal}
        logs={selectedDay.logs}
        totals={selectedDay.totals}
      />
      <section aria-label='Diary actions' className={css.entryActions}>
        <Btn isLink render={<Link search={{ date }} to='/calories/add' />}>
          Add food
        </Btn>
        <Btn isLink render={<Link search={{ date }} to='/calories/scan' />} variant='outlineMain'>
          Scan barcode
        </Btn>
        <Btn isLink render={<Link search={{ date }} to='/calories/quick-add' />} variant='ghost'>
          Quick add
        </Btn>
        <Btn isLink render={<Link search={{ date }} to='/calories/foods/new' />} variant='ghost'>
          New food
        </Btn>
        <Btn isLink render={<Link to='/calories/goals' />} variant='ghost'>
          Set daily goals
        </Btn>
      </section>
    </main>
  );
}
