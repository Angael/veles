import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card/Card';
import { DashboardFood } from './DashboardFood';
import { DashboardMealPlan } from './DashboardMealPlan';
import { DashboardRecipes } from './DashboardRecipes';
import { DashboardWeight } from './DashboardWeight';
import type { HomeDashboardData } from './home.api';
import { type HomeFeatureId, homeFeatures } from './homeFeatures';
import css from './HomeDashboard.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { formatDaysAgo } from '@/lib/relativeDay';

type HomeDashboardProps = {
  data: HomeDashboardData;
};

/** Renders one card per app feature, with today's data where the feature has a summary. */
export function HomeDashboard({ data }: HomeDashboardProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const summaries: Record<HomeFeatureId, ReactNode> = {
    food: <DashboardFood nutrition={data.nutrition} />,
    weight: <DashboardWeight entries={data.weightEntries} />,
    mealPlan: <DashboardMealPlan days={data.mealPlan} />,
    recipes: <DashboardRecipes date={data.date} recipes={data.recipes} />,
    workouts: (
      <div className={css.readout}>
        {data.lastWorkout ? (
          <>
            <strong>{data.lastWorkout.name}</strong>
            <span>{formatDaysAgo(data.lastWorkout.date, i18n)}</span>
          </>
        ) : (
          <strong>{t({ en: 'No workouts yet', pl: 'Brak treningów' })}</strong>
        )}
      </div>
    ),
    notes: null,
    diary: (
      <div className={css.readout}>
        <strong>
          {data.lastDiaryEntryDate
            ? formatDaysAgo(data.lastDiaryEntryDate, i18n)
            : t({ en: 'No entries yet', pl: 'Brak wpisów' })}
        </strong>
        {data.lastDiaryEntryDate && <span>{t({ en: 'Last entry', pl: 'Ostatni wpis' })}</span>}
      </div>
    ),
    friends: null,
    agent: null,
  };

  return (
    <main className={css.page}>
      <div className={css.grid}>
        {homeFeatures.map((feature, index) => {
          const Icon = feature.icon;
          const summary = summaries[feature.id];
          const title = t(feature.title);

          return (
            <Card
              as='article'
              className={css[feature.id]}
              data-appear={String(Math.min(index, 6))}
              key={feature.id}
              shadow={false}
            >
              <div className={css.tileHeading}>
                <h2>{title}</h2>
                <Icon aria-hidden='true' />
              </div>
              {summary ?? <p className={css.description}>{t(feature.description)}</p>}
              <Link
                aria-label={t({ en: `Open ${title}`, pl: `Otwórz: ${title}` })}
                className={css.cardLink}
                hash={feature.hash}
                to={feature.to}
              />
            </Card>
          );
        })}
      </div>
    </main>
  );
}
