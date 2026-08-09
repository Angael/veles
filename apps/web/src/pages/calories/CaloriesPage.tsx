import type { CalorieDashboard } from './calories.api';
import { CalorieOverview } from './CalorieOverview';
import { DailyControls } from './DailyControls';
import { FoodCapture } from './FoodCapture';
import css from './CaloriesPage.module.css';

type CaloriesPageProps = {
  dashboard: CalorieDashboard;
  date: string;
};

export function CaloriesPage({ dashboard, date }: CaloriesPageProps) {
  return (
    <main className={css.page}>
      <header className={css.pageHeader}>
        <div>
          <h1>Daily calories</h1>
          <p>Track what you eat without turning lunch into data entry.</p>
        </div>
        <time dateTime={date}>{formatDate(date)}</time>
      </header>

      <div className={css.layout}>
        <CalorieOverview
          goalKcal={dashboard.goal?.kcal ?? null}
          logs={dashboard.logs}
          totals={dashboard.totals}
        />
        <aside aria-label='Calorie entry tools' className={css.tools}>
          <DailyControls date={date} goalKcal={dashboard.goal?.kcal ?? null} />
          <FoodCapture recentFoods={dashboard.recentFoods} />
        </aside>
      </div>
    </main>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}
