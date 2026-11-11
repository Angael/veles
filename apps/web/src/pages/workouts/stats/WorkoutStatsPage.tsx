import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/card/Card';
import { BarChart } from './BarChart';
import { StatsHero } from './StatsHero';
import { StatsHighlights } from './StatsHighlights';
import { workoutStatsQueryOptions } from './stats.query';
import type { StatsPeriod, WorkoutStats } from './stats.server';
import { TimeOfDay } from './TimeOfDay';
import { TopExercises } from './TopExercises';
import css from './WorkoutStats.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Replay-style summary of the user's training for a chosen year or all time. */
export function WorkoutStatsPage({ period }: { period: StatsPeriod }) {
  const { t } = useI18n();
  const { data: stats } = useSuspenseQuery(workoutStatsQueryOptions(period));

  return (
    <main className={css.page}>
      <PeriodPicker period={period} years={stats.years} />
      {stats.sessions === 0 ? (
        <Card as='section' className={css.empty}>
          <h1>{t({ en: 'Nothing to replay yet', pl: 'Na razie nie ma czego podsumować' })}</h1>
          <p>
            {t({
              en: 'Log a few workouts in this period and your highlights show up here.',
              pl: 'Zapisz kilka treningów w tym okresie, a ich podsumowanie pojawi się tutaj.',
            })}
          </p>
        </Card>
      ) : (
        <StatsSections stats={stats} />
      )}
    </main>
  );
}

function StatsSections({ stats }: { stats: WorkoutStats }) {
  const { formatDate, t } = useI18n();
  const isYear = stats.period !== 'all';
  // Monday-first labels from a week that starts on Monday, 2024-01-01.
  const weekdayLabels = stats.weekdays.map((_, index) =>
    formatDate(`2024-01-0${index + 1}`, { weekday: 'short' }),
  );

  return (
    <>
      <StatsHero stats={stats} />
      <TopExercises exercises={stats.topExercises} />
      <BarChart
        data-appear='3'
        detail={(index) => formatDate(`2024-01-0${index + 1}`, { weekday: 'long' })}
        labels={weekdayLabels}
        title={(index) =>
          t({
            en: `${formatDate(`2024-01-0${index + 1}`, { weekday: 'long' })}s are your day`,
            pl: `Twój dzień to ${formatDate(`2024-01-0${index + 1}`, { weekday: 'long' })}`,
          })
        }
        values={stats.weekdays}
      />
      <TimeOfDay startedAt={stats.startedAt} />
      <BarChart
        data-appear='5'
        detail={(index) => timelineLabel(stats.timeline[index]?.key ?? '', 'long')}
        labels={stats.timeline.map((entry) => timelineLabel(entry.key, 'narrow'))}
        title={(index) =>
          isYear
            ? t({
                en: `${timelineLabel(stats.timeline[index]?.key ?? '', 'long')} was your busiest month`,
                pl: `Najaktywniejszy miesiąc: ${timelineLabel(stats.timeline[index]?.key ?? '', 'long')}`,
              })
            : t({
                en: `${stats.timeline[index]?.key} was your busiest year`,
                pl: `Najaktywniejszy rok: ${stats.timeline[index]?.key}`,
              })
        }
        values={stats.timeline.map((entry) => entry.sessions)}
      />
      <StatsHighlights stats={stats} />
    </>
  );

  /** `YYYY-MM` as a month name; `YYYY` stays as is. */
  function timelineLabel(key: string, month: 'long' | 'narrow') {
    return key.length === 7 ? formatDate(`${key}-01`, { month }) : key;
  }
}

/** Year chips, newest first, then all time. Switching replaces history like other view pickers. */
function PeriodPicker({ period, years }: { period: StatsPeriod; years: number[] }) {
  const { t } = useI18n();
  const shown =
    years.includes(Number(period)) || period === 'all' ? years : [Number(period), ...years];

  return (
    <nav aria-label={t({ en: 'Period', pl: 'Okres' })} className={css.periods}>
      {shown.map((year) => (
        <Link
          aria-current={period === year ? 'page' : undefined}
          className={css.period}
          key={year}
          replace
          search={{ year }}
          to='/workouts/stats'
        >
          {year}
        </Link>
      ))}
      <Link
        aria-current={period === 'all' ? 'page' : undefined}
        className={css.period}
        replace
        search={{ year: 'all' }}
        to='/workouts/stats'
      >
        {t({ en: 'All time', pl: 'Cały czas' })}
      </Link>
    </nav>
  );
}
