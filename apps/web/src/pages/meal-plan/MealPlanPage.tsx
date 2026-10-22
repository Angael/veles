import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { addDays, format, parseISO } from 'date-fns';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { calorieWeekDates, calorieWeekStart } from '@/pages/calories/calorieHelpers';
import { todayLocalDate } from '@/lib/dateOnly';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { MealPlanWeek } from './mealPlan.api';
import { mealPlanWeekQueryOptions } from './mealPlan.query';
import type { MealPlanItem } from './mealPlanEstimate';
import { MealPlanDay } from './MealPlanDay';
import { MealPlanItemDialog } from './MealPlanItemDialog';
import css from './MealPlanPage.module.css';

type Props = {
  /** Any day of the shown week; scrolled into view when `focusDate` is set. */
  date: string;
  focusDate: boolean;
  week: MealPlanWeek;
};

type DialogState = { open: boolean; date: string; item: MealPlanItem | null };

/** Week agenda of planned meals: one section per day, each with its own add/edit actions. */
export function MealPlanPage({ date, focusDate, week }: Props) {
  const { formatDate, t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = todayLocalDate();
  const days = calorieWeekDates(week.weekStart);
  const [dialog, setDialog] = useState<DialogState>({ open: false, date, item: null });

  useEffect(() => {
    if (focusDate) document.getElementById(dayAnchor(date))?.scrollIntoView({ block: 'start' });
  }, [date, focusDate]);

  function adjacentWeek(direction: -1 | 1) {
    return format(addDays(parseISO(week.weekStart), direction * 7), 'yyyy-MM-dd');
  }

  function prefetchWeek(direction: -1 | 1) {
    void queryClient.prefetchQuery(mealPlanWeekQueryOptions(adjacentWeek(direction)));
  }

  function weekNavProps(direction: -1 | 1) {
    return {
      iconOnly: true,
      onClick: () =>
        void navigate({
          replace: true,
          search: { date: adjacentWeek(direction) },
          to: '/meal-plan',
        }),
      onFocus: () => prefetchWeek(direction),
      onPointerEnter: () => prefetchWeek(direction),
      size: 'sm' as const,
      variant: 'ghost' as const,
    };
  }

  const weekLabel = `${formatDate(days[0] ?? week.weekStart, { day: 'numeric', month: 'short' })} – ${formatDate(days[6] ?? week.weekStart, { day: 'numeric', month: 'short' })}`;

  return (
    <main className={css.page}>
      <div className={css.weekControls} data-appear>
        <Btn
          aria-label={t({ en: 'Previous week', pl: 'Poprzedni tydzień' })}
          icon={<ChevronLeftIcon aria-hidden='true' />}
          {...weekNavProps(-1)}
        />
        <h2 className={css.weekLabel}>{weekLabel}</h2>
        <Btn
          aria-label={t({ en: 'Next week', pl: 'Następny tydzień' })}
          icon={<ChevronRightIcon aria-hidden='true' />}
          {...weekNavProps(1)}
        />
        <Btn
          className={css.thisWeek}
          disabled={week.weekStart === calorieWeekStart(today)}
          icon={<CalendarDaysIcon aria-hidden='true' />}
          onClick={() => void navigate({ replace: true, search: {}, to: '/meal-plan' })}
          size='sm'
          variant='outlineMain'
        >
          {t({ en: 'This week', pl: 'Ten tydzień' })}
        </Btn>
      </div>

      <div className={css.days}>
        {days.map((day, index) => (
          <MealPlanDay
            anchorId={dayAnchor(day)}
            date={day}
            items={week.items.filter((item) => item.date === day)}
            key={day}
            onAdd={() => setDialog({ open: true, date: day, item: null })}
            onEdit={(item) => setDialog({ open: true, date: item.date, item })}
            order={index}
            today={today}
          />
        ))}
      </div>

      <MealPlanItemDialog
        date={dialog.date}
        item={dialog.item}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        open={dialog.open}
        recipes={week.recipes}
      />
    </main>
  );
}

function dayAnchor(date: string) {
  return `day-${date}`;
}
