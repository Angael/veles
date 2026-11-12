import { Card } from '@/components/ui/card/Card';
import type { WorkoutStats } from './stats.server';
import css from './WorkoutStats.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

/** The headline: how many workouts, on how many days, for how many hours. */
export function StatsHero({ stats }: { stats: WorkoutStats }) {
  const { formatNumber, t } = useI18n();
  const hours = Math.round(stats.totalSeconds / 3600);
  const heading =
    stats.period === 'all'
      ? t({ en: 'Your training so far', pl: 'Twoje treningi do tej pory' })
      : t({ en: `Your ${stats.period} in training`, pl: `Twój rok ${stats.period} w treningach` });

  return (
    <Card as='section' className={css.hero} data-appear='1' tone='primary'>
      <h1>{heading}</h1>
      <p className={css.heroNumber}>
        <strong>{formatNumber(stats.sessions)}</strong>
        <span>
          {t({
            en: pluralEn(stats.sessions, 'workout', 'workouts'),
            pl: pluralPl(stats.sessions, 'trening', 'treningi', 'treningów'),
          })}
        </span>
      </p>
      <dl className={css.heroFacts}>
        <div>
          <dt>{t({ en: 'Active days', pl: 'Aktywne dni' })}</dt>
          <dd>{formatNumber(stats.activeDays)}</dd>
        </div>
        <div>
          <dt>{t({ en: 'Hours trained', pl: 'Godziny treningu' })}</dt>
          <dd>{formatNumber(hours)}</dd>
        </div>
        <div>
          <dt>{t({ en: 'Exercises', pl: 'Ćwiczenia' })}</dt>
          <dd>{formatNumber(stats.exercises)}</dd>
        </div>
      </dl>
    </Card>
  );
}
