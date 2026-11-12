import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useCookieState } from './useCookieState';
import css from './WeightOverview.module.css';
import { WEIGHT_RANGE_OPTIONS, WeightRangePicker } from './WeightRangePicker';
import { WeightTrendChart } from './WeightTrendChart';
import {
  getChangeDirection,
  getRangeChange,
  getWeightChartRange,
  getWeightTrend,
  WEIGHT_CHART_RANGE_COOKIE,
  type WeightChartRange,
} from './weightCalculations';
import type { WeightHistoryEntry } from './weight.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

const KG_DIGITS = { maximumFractionDigits: 1, minimumFractionDigits: 1 };

type WeightOverviewProps = {
  entries: WeightHistoryEntry[];
  initialRange: WeightChartRange;
};

/** Headline weight, the change over the picked range and its weekly pace, above the trend chart. */
export function WeightOverview({ entries, initialRange }: WeightOverviewProps) {
  const { formatDate, formatNumber, t } = useI18n();
  const [range, setRange] = useCookieState(WEIGHT_CHART_RANGE_COOKIE, initialRange);
  const trend = useMemo(() => getWeightTrend(entries), [entries]);
  const visibleEntries = getWeightChartRange(entries, range);
  const change = getRangeChange(visibleEntries);
  const latest = entries.at(-1);
  // oxlint-disable-next-line typescript/no-non-null-assertion -- every WeightChartRange has an option.
  const rangeLabel = t(WEIGHT_RANGE_OPTIONS.find((option) => option.value === range)!.label);
  const signed = (value: number) =>
    formatNumber(value, { ...KG_DIGITS, signDisplay: 'exceptZero' });
  const TrendIcon = change && change.changeKg > 0 ? TrendingUpIcon : TrendingDownIcon;

  if (!latest) {
    return null;
  }

  return (
    <section
      aria-label={t({
        en: `Weight over ${rangeLabel.toLowerCase()}`,
        pl: `Waga – ${rangeLabel.toLowerCase()}`,
      })}
      className={css.overview}
    >
      <div className={css.headline}>
        <div className={css.current}>
          <strong>
            {formatNumber(latest.weightKg, KG_DIGITS)}
            <span className={css.unit}> kg</span>
          </strong>
          <span className={css.caption}>
            {formatDate(latest.date, { day: 'numeric', month: 'short', weekday: 'short' })}
          </span>
        </div>

        {change ? (
          <div className={css.change} data-direction={getChangeDirection(change.changeKg)}>
            <strong>
              {change.changeKg === 0 ? null : <TrendIcon aria-hidden='true' />}
              {signed(change.changeKg)} kg
            </strong>
            <span className={css.caption}>
              {t({
                en: `${signed(change.perWeekKg)} kg / week`,
                pl: `${signed(change.perWeekKg)} kg / tydz.`,
              })}
            </span>
          </div>
        ) : null}
      </div>

      <WeightTrendChart range={range} trend={trend} visibleEntries={visibleEntries} />
      <WeightRangePicker onChange={setRange} value={range} />
    </section>
  );
}
