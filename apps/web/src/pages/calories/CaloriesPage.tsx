import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useNavigate } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import type { CalorieDashboard } from './calories.api';
import { CalorieOverview } from './CalorieOverview';
import { calorieWeekDates } from './calorieDate';
import { Btn } from '@/components/btn/Btn';
import css from './CaloriesPage.module.css';

type CaloriesPageProps = { dashboard: CalorieDashboard; date: string };

export function CaloriesPage({ dashboard, date }: CaloriesPageProps) {
  const navigate = useNavigate();
  return (
    <main className={css.page}>
      <ToggleGroup
        aria-label='Diary week'
        className={css.dayStrip}
        onValueChange={(values) => {
          const selected = values[0];
          if (selected) void navigate({ to: '/calories', search: { date: selected } });
        }}
        value={[date]}
      >
        {calorieWeekDates(date).map((day) => {
          const parsedDay = parseISO(day);
          return (
            <Toggle className={css.day} key={day} value={day}>
              <span className={css.compactDay}>{format(parsedDay, 'EEEEE')}</span>
              <span className={css.expandedDay}>{format(parsedDay, 'EEEE')}</span>
              <strong className={css.compactDay}>{format(parsedDay, 'd')}</strong>
              <strong className={css.expandedDay}>{format(parsedDay, 'dd.MM')}</strong>
            </Toggle>
          );
        })}
      </ToggleGroup>
      <CalorieOverview goal={dashboard.goal} logs={dashboard.logs} totals={dashboard.totals} />
      <section aria-label='Diary actions' className={css.entryActions}>
        <Btn onClick={() => void navigate({ to: '/calories/add', search: { date } })}>Add food</Btn>
        <Btn
          onClick={() => void navigate({ to: '/calories/scan', search: { date } })}
          variant='outlineMain'
        >
          Scan barcode
        </Btn>
        <Btn onClick={() => void navigate({ to: '/calories/quick-add', search: { date } })} variant='ghost'>
          Quick add
        </Btn>
        <Btn
          onClick={() => void navigate({ to: '/calories/foods/new', search: { date } })}
          variant='ghost'
        >
          New food
        </Btn>
        <Btn onClick={() => void navigate({ to: '/calories/goals' })} variant='ghost'>
          Set daily goals
        </Btn>
      </section>
    </main>
  );
}
