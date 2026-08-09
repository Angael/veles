import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useNavigate } from '@tanstack/react-router';
import type { CalorieDashboard } from './calories.api';
import { CalorieOverview } from './CalorieOverview';
import { calorieWeekDates } from './calorieDate';
import { Btn } from '@/components/btn/Btn';
import css from './CaloriesPage.module.css';

type CaloriesPageProps = { dashboard: CalorieDashboard; date: string };

export function CaloriesPage({ dashboard, date }: CaloriesPageProps) {
  const navigate = useNavigate();
  const open = (to: '/calories/add' | '/calories/scan' | '/calories/quick-add') =>
    void navigate({ to, search: { date } });
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
        {calorieWeekDates(date).map((day) => (
          <Toggle className={css.day} key={day} value={day}>
            <span className={css.compactDay}>
              {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </span>
            <span className={css.expandedDay}>
              {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' })}
            </span>
            <strong className={css.compactDay}>{new Date(`${day}T12:00:00`).getDate()}</strong>
            <strong className={css.expandedDay}>
              {new Date(`${day}T12:00:00`)
                .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
                .replace('/', '.')}
            </strong>
          </Toggle>
        ))}
      </ToggleGroup>
      <CalorieOverview goal={dashboard.goal} logs={dashboard.logs} totals={dashboard.totals} />
      <section aria-label='Add to diary' className={css.entryActions}>
        <Btn onClick={() => open('/calories/add')}>Add food</Btn>
        <Btn onClick={() => open('/calories/scan')} variant='outlineMain'>
          Scan barcode
        </Btn>
        <Btn onClick={() => open('/calories/quick-add')} variant='ghost'>
          Quick add
        </Btn>
      </section>
    </main>
  );
}
