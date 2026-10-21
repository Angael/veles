import { ClientOnly } from '@tanstack/react-router';
import { parseISO, subMonths } from 'date-fns';
import { useState } from 'react';
import { useCookieState } from './useCookieState';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import css from './WeightTrendChart.module.css';
import {
  getWeightChartRange,
  WEIGHT_CHART_RANGE_COOKIE,
  WEIGHT_CHART_RANGE_MONTHS,
  type WeightChartRange,
} from './weightCalculations';
import type { WeightEntry } from './weight.api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

type WeightTrendChartProps = {
  entries: WeightEntry[];
  initialRange: WeightChartRange;
};

const rangeOptions = [
  { label: { en: '1 month', pl: '1 miesiąc' }, value: '1m' },
  { label: { en: '3 months', pl: '3 miesiące' }, value: '3m' },
  { label: { en: '6 months', pl: '6 miesięcy' }, value: '6m' },
  { label: { en: '1 year', pl: '1 rok' }, value: '1y' },
  { label: { en: '2 years', pl: '2 lata' }, value: '2y' },
  { label: { en: '3 years', pl: '3 lata' }, value: '3y' },
  { label: { en: 'All time', pl: 'Cały okres' }, value: 'all' },
] satisfies { label: Localized; value: WeightChartRange }[];

const DAY_IN_MS = 24 * 60 * 60 * 1_000;
const YEAR_IN_MS = 365 * DAY_IN_MS;
const MAX_X_TICKS = 6;
const SHORT_TICK_SPACING = 64;
const LONG_TICK_SPACING = 80;
const X_AXIS_INSET = 80;

/** Creates width-limited ticks instead of relying on Recharts' browser text measurement. */
function getXAxisTicks(domain: [number, number], chartWidth: number, usesLongRangeTicks: boolean) {
  const availableWidth = Math.max(0, chartWidth - X_AXIS_INSET);
  const tickSpacing = usesLongRangeTicks ? LONG_TICK_SPACING : SHORT_TICK_SPACING;
  const tickCount = Math.max(
    2,
    Math.min(MAX_X_TICKS, Math.floor(availableWidth / tickSpacing) + 1),
  );
  const step = (domain[1] - domain[0]) / (tickCount - 1);

  return Array.from({ length: tickCount }, (_, index) => domain[0] + step * index);
}

function WeightTooltip({ active, payload }: TooltipContentProps) {
  const { formatNumber } = useI18n();
  const value = payload[0]?.value;

  if (!active || value === undefined) {
    return null;
  }

  return (
    <div className={css.tooltip}>{formatNumber(Number(value), { maximumFractionDigits: 1 })}kg</div>
  );
}

export function WeightTrendChart({ entries, initialRange }: WeightTrendChartProps) {
  const { formatDate, formatNumber, t } = useI18n();
  const rangeItems = rangeOptions.map((option) => ({ ...option, label: t(option.label) }));
  const [range, setRange] = useCookieState(WEIGHT_CHART_RANGE_COOKIE, initialRange);
  const [chartWidth, setChartWidth] = useState(0);
  const visibleEntries = getWeightChartRange(entries, range);
  const chartEntries = visibleEntries.map((entry) => ({
    ...entry,
    timestamp: parseISO(entry.date).getTime(),
  }));
  const weights = visibleEntries.map((entry) => entry.weightKg);
  const domain = [Math.floor(Math.min(...weights)), Math.ceil(Math.max(...weights))];
  // oxlint-disable-next-line typescript/no-non-null-assertion -- every WeightChartRange has a chart option.
  const rangeLabel = rangeItems.find((option) => option.value === range)!.label;
  const firstTimestamp = chartEntries.at(0)?.timestamp;
  const lastTimestamp = chartEntries.at(-1)?.timestamp;
  const months = WEIGHT_CHART_RANGE_MONTHS[range];
  const xDomain: [number, number] = (() => {
    if (lastTimestamp === undefined) {
      return [0, 1];
    }

    if (months !== undefined) {
      return [subMonths(lastTimestamp, months).getTime(), lastTimestamp];
    }

    if (firstTimestamp === undefined || firstTimestamp === lastTimestamp) {
      return [lastTimestamp - DAY_IN_MS, lastTimestamp + DAY_IN_MS];
    }

    return [firstTimestamp, lastTimestamp];
  })();
  const usesLongRangeTicks = xDomain[1] - xDomain[0] >= YEAR_IN_MS;
  const xTicks = getXAxisTicks(xDomain, chartWidth, usesLongRangeTicks);

  return (
    <section
      aria-label={t({
        en: `Weight over ${rangeLabel.toLowerCase()}`,
        pl: `Waga – ${rangeLabel.toLowerCase()}`,
      })}
      className={css.hero}
    >
      <div className={css.header}>
        <SelectInput
          aria-label={t({ en: 'Chart time range', pl: 'Zakres czasu wykresu' })}
          className={css.rangeSelect}
          items={rangeItems}
          onValueChange={(value) => {
            if (value) {
              setRange(value);
            }
          }}
          value={range}
        />
      </div>

      <div className={css.chartFrame}>
        <ClientOnly fallback={<Skeleton className={css.chartSkeleton} />}>
          <ResponsiveContainer
            height='100%'
            minWidth={0}
            onResize={(width: number) => setChartWidth(width)}
            width='100%'
          >
            <AreaChart
              accessibilityLayer={false}
              data={chartEntries}
              margin={{ bottom: 0, left: 4, right: 18, top: 8 }}
            >
              <defs>
                <linearGradient id='weight-chart-fill' x1='0' x2='0' y1='0' y2='1'>
                  <stop offset='0%' stopColor='var(--c-accent)' stopOpacity={0.24} />
                  <stop offset='100%' stopColor='var(--c-accent)' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke='var(--c-border)' strokeDasharray='3 7' vertical={false} />
              <XAxis
                axisLine={false}
                dataKey='timestamp'
                domain={xDomain}
                interval={0}
                padding={{ right: 24 }}
                scale='time'
                tick={{ className: css.dateTick }}
                tickFormatter={(value: number) =>
                  formatDate(
                    new Date(value),
                    usesLongRangeTicks
                      ? { month: 'short', year: 'numeric' }
                      : { day: 'numeric', month: 'short' },
                  )
                }
                tickMargin={8}
                tickLine={false}
                ticks={xTicks}
                type='number'
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={domain}
                tickFormatter={(value: number) => `${formatNumber(value)} kg`}
                tickLine={false}
                width={58}
              />
              <Tooltip animationDuration={0} content={(props) => <WeightTooltip {...props} />} />
              <Area
                dataKey='weightKg'
                dot={false}
                fill='url(#weight-chart-fill)'
                isAnimationActive={false}
                stroke='var(--c-accent)'
                strokeWidth={2.5}
                type='monotone'
              />
            </AreaChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
    </section>
  );
}
