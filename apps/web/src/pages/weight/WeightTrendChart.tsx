import { ClientOnly } from '@tanstack/react-router';
import { format, parseISO, subMonths } from 'date-fns';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '../../components/skeleton/Skeleton';
import { SelectInput } from '../../components/select-input/SelectInput';
import { useLocalStorageState } from '../../lib/hooks/useLocalStorageState';
import css from './WeightTrendChart.module.css';
import {
  getWeightChartRange,
  WEIGHT_CHART_RANGE_MONTHS,
  type WeightChartRange,
} from './weightCalculations';
import type { WeightEntry } from './weight.api';

type WeightTrendChartProps = {
  entries: WeightEntry[];
};

const rangeOptions = [
  { label: '1 month', value: '1m' },
  { label: '3 months', value: '3m' },
  { label: '6 months', value: '6m' },
  { label: '1 year', value: '1y' },
  { label: '2 years', value: '2y' },
  { label: '3 years', value: '3y' },
  { label: 'All time', value: 'all' },
] satisfies { label: string; value: WeightChartRange }[];

const longDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
});

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

export function WeightTrendChart({ entries }: WeightTrendChartProps) {
  const [range, setRange] = useLocalStorageState<WeightChartRange>('weight-chart-range', '1m');
  const [chartWidth, setChartWidth] = useState(0);
  const visibleEntries = getWeightChartRange(entries, range);
  const chartEntries = visibleEntries.map((entry) => ({
    ...entry,
    timestamp: parseISO(entry.date).getTime(),
  }));
  const weights = visibleEntries.map((entry) => entry.weightKg);
  const domain = [Math.floor(Math.min(...weights)), Math.ceil(Math.max(...weights))];
  const rangeLabel = rangeOptions.find((option) => option.value === range)!.label;
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
    <section aria-label={`Weight over ${rangeLabel.toLowerCase()}`} className={css.hero}>
      <div className={css.header}>
        <SelectInput
          aria-label='Chart time range'
          className={css.rangeSelect}
          items={rangeOptions}
          onValueChange={(value) => value && setRange(value)}
          value={range}
        />
      </div>

      <div className={css.chartFrame}>
        <ClientOnly fallback={<Skeleton className={css.chartSkeleton} />}>
          <ResponsiveContainer
            height='100%'
            minWidth={0}
            onResize={(width) => setChartWidth(width)}
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
                scale='time'
                tick={{ className: css.dateTick }}
                tickFormatter={(value: number) =>
                  format(value, usesLongRangeTicks ? 'MM.yyyy' : 'dd.MM')
                }
                tickLine={false}
                ticks={xTicks}
                type='number'
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={domain}
                tickFormatter={(value: number) => `${value} kg`}
                tickLine={false}
                width={58}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--c-surface-solid)',
                  border: '1px solid var(--c-border-strong)',
                  borderRadius: 'var(--radius-xs)',
                }}
                formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Weight']}
                labelFormatter={(label) => longDateFormatter.format(Number(label))}
              />
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
