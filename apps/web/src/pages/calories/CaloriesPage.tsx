import { Link } from '@tanstack/react-router';
import { AppleIcon, ScanBarcodeIcon, SparklesIcon, TargetIcon } from 'lucide-react';
import type { CalorieDashboard } from './calories.api';
import { CalorieOverview } from './CalorieOverview';
import { recentCalorieDates } from './calorieDate';
import css from './CaloriesPage.module.css';

type CaloriesPageProps = { dashboard: CalorieDashboard; date: string };

export function CaloriesPage({ dashboard, date }: CaloriesPageProps) {
  return (
    <main className={css.page}>
      <header className={css.pageHeader}>
        <div>
          <h1>Your food diary</h1>
          <p>What you ate, how it adds up, and what is left today.</p>
        </div>
        <Link className={css.goalLink} to='/calories/goals'>
          <TargetIcon aria-hidden='true' /> Goals
        </Link>
      </header>
      <nav aria-label='Recent diary days' className={css.dayStrip}>
        {recentCalorieDates().map((day) => (
          <Link
            className={day === date ? css.dayActive : css.day}
            key={day}
            search={{ date: day }}
            to='/calories'
          >
            <span>
              {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            <strong>{new Date(`${day}T12:00:00`).getDate()}</strong>
          </Link>
        ))}
      </nav>
      <section aria-label='Add to diary' className={css.entryActions}>
        <Link search={{ date }} to='/calories/add'>
          <AppleIcon aria-hidden='true' />
          <span>
            <strong>Add food</strong>
            <small>Search or create</small>
          </span>
        </Link>
        <Link search={{ date }} to='/calories/scan'>
          <ScanBarcodeIcon aria-hidden='true' />
          <span>
            <strong>Scan barcode</strong>
            <small>Use your camera</small>
          </span>
        </Link>
        <Link search={{ date }} to='/calories/quick-add'>
          <SparklesIcon aria-hidden='true' />
          <span>
            <strong>Quick add</strong>
            <small>Calories and macros</small>
          </span>
        </Link>
      </section>
      <CalorieOverview goal={dashboard.goal} logs={dashboard.logs} totals={dashboard.totals} />
    </main>
  );
}
