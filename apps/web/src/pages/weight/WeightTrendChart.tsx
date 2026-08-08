import { ClientOnly } from '@tanstack/react-router';
import { parseISO, subMonths } from 'date-fns';
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

const shortDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const longDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
});

const longRangeTickFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
});

const DAY_IN_MS = 24 * 60 * 60 * 1_000;
const YEAR_IN_MS = 365 * DAY_IN_MS;

export function WeightTrendChart({ entries }: WeightTrendChartProps) {
  const [range, setRange] = useState<WeightChartRange>('1m');
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
          <ResponsiveContainer height='100%' minWidth={0} width='100%'>
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
                interval='preserveStartEnd'
                minTickGap={28}
                scale='time'
                tickFormatter={(value: number) =>
                  (usesLongRangeTicks ? longRangeTickFormatter : shortDateFormatter).format(value)
                }
                tickLine={false}
                tickCount={range === '3m' ? 4 : undefined}
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
