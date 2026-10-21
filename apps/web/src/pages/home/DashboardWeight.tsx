import type { HomeDashboardData } from './home.api';
import css from './HomeDashboard.module.css';
import { type I18n, useI18n } from '@/lib/i18n/I18nProvider';

export function DashboardWeight({ entries }: { entries: HomeDashboardData['weightEntries'] }) {
  const i18n = useI18n();
  const { formatDate, formatNumber, t } = i18n;
  const latestWeight = entries.at(-1);
  const previousWeight = entries.at(-2);
  const delta =
    latestWeight && previousWeight ? latestWeight.weightKg - previousWeight.weightKg : null;
  const chartPoints = getChartPoints(entries);

  if (!latestWeight) {
    return (
      <div className={css.emptyWeight}>
        <strong>{t({ en: 'No weight logged yet', pl: 'Brak zapisanej wagi' })}</strong>
        <p>
          {t({
            en: 'Log your first weight to see your trend.',
            pl: 'Zapisz pierwszy pomiar, aby zobaczyć trend.',
          })}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={css.weightValue}>
        <strong>
          {formatNumber(latestWeight.weightKg, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          })}
        </strong>
        <span>kg</span>
      </div>
      <div className={css.chart}>
        {chartPoints ? (
          <svg
            aria-label={t({ en: 'Recent weight trend', pl: 'Ostatni trend wagi' })}
            role='img'
            viewBox='0 0 300 96'
          >
            <defs>
              <linearGradient id='dashboard-weight-fill' x1='0' x2='0' y1='0' y2='1'>
                <stop offset='0' stopColor='var(--c-accent)' stopOpacity='0.3' />
                <stop offset='1' stopColor='var(--c-accent)' stopOpacity='0' />
              </linearGradient>
            </defs>
            <polygon points={`0,96 ${chartPoints} 300,96`} />
            <polyline points={chartPoints} />
          </svg>
        ) : (
          <div className={css.singlePoint} />
        )}
      </div>
      <div className={css.weightMeta}>
        <span>{formatDate(latestWeight.date, { day: 'numeric', month: 'short' })}</span>
        <span>{formatDelta(delta, i18n)}</span>
      </div>
    </>
  );
}

/** Maps the recent series into points for the fixed bento sparkline view box. */
function getChartPoints(entries: HomeDashboardData['weightEntries']) {
  if (entries.length < 2) return '';
  const weights = entries.map((entry) => entry.weightKg);
  const min = Math.min(...weights);
  const spread = Math.max(Math.max(...weights) - min, 0.1);
  return weights
    .map(
      (weight, index) =>
        `${(index / (weights.length - 1)) * 300},${88 - ((weight - min) / spread) * 76}`,
    )
    .join(' ');
}

function formatDelta(delta: number | null, { formatNumber, t }: I18n) {
  if (delta === null) return t({ en: 'First point', pl: 'Pierwszy pomiar' });
  if (Math.abs(delta) < 0.05) return t({ en: 'Steady', pl: 'Bez zmian' });
  return `${formatNumber(delta, { maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: 'always' })} kg`;
}
