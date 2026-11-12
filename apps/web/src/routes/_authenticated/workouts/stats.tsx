import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { statsPeriodType } from '@/pages/workouts/stats/stats.api';
import { workoutStatsQueryOptions } from '@/pages/workouts/stats/stats.query';
import type { StatsPeriod } from '@/pages/workouts/stats/stats.server';
import { WorkoutStatsPage } from '@/pages/workouts/stats/WorkoutStatsPage';
import { translate } from '@/lib/i18n/getLocale';

const searchType = type({ 'year?': 'unknown' });

/** A missing or hand-edited `?year=` falls back to the current year. */
const toPeriod = (year: unknown): StatsPeriod =>
  statsPeriodType.allows(year) ? year : new Date().getFullYear();

export const Route = createFileRoute('/_authenticated/workouts/stats')({
  validateSearch: searchType,
  loaderDeps: ({ search }) => ({ period: toPeriod(search.year) }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(workoutStatsQueryOptions(deps.period)),
  component: RouteComponent,
  head: () => ({
    meta: [{ title: translate({ en: 'Training replay', pl: 'Podsumowanie treningów' }) }],
  }),
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: { to: '/workouts' },
      label: { en: 'Training replay', pl: 'Podsumowanie treningów' },
    },
  },
});

function RouteComponent() {
  const { year } = Route.useSearch();
  return <WorkoutStatsPage period={toPeriod(year)} />;
}
