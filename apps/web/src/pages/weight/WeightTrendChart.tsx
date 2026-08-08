import { ClientOnly } from '@tanstack/react-router';
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
import { getWeightChartRange, type WeightChartRange } from './weightCalculations';
import type { WeightEntry } from './weight.api';

type WeightTrendChartProps = {
  entries: WeightEntry[];
};

const rangeOptions = [
  { label: '1 month', value: '1m' },
  { label: '3 months', value: '3m' },
  { label: '6 months', value: '6m' },
  { label: '1 year', value: '1y' },
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

export function WeightTrendChart({ entries }: WeightTrendChartProps) {
  const [range, setRange] = useState<WeightChartRange>('1m');
  const visibleEntries = getWeightChartRange(entries, range);
  const weights = visibleEntries.map((entry) => entry.weightKg);
  const domain = [Math.floor(Math.min(...weights)), Math.ceil(Math.max(...weights))];
  const rangeLabel = rangeOptions.find((option) => option.value === range)!.label;

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
              data={visibleEntries}
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
                dataKey='date'
                minTickGap={28}
                padding={{ left: 18, right: 18 }}
                tickFormatter={(value: string) =>
                  shortDateFormatter.format(new Date(`${value}T00:00:00Z`))
                }
                tickLine={false}
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
                labelFormatter={(label) =>
                  longDateFormatter.format(new Date(`${String(label)}T00:00:00Z`))
                }
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
