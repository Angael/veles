import { ClientOnly } from '@tanstack/react-router';
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
import css from './WeightTrendChart.module.css';

type ChartEntry = {
  date: string;
  weightKg: number;
};

type WeightTrendChartProps = {
  entries: ChartEntry[];
};

const shortDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function WeightTrendChart({ entries }: WeightTrendChartProps) {
  const visibleEntries = entries.slice(-30);
  const weights = visibleEntries.map((entry) => entry.weightKg);
  const domain = [Math.floor(Math.min(...weights)), Math.ceil(Math.max(...weights))];

  return (
    <section aria-label='Weight over the last month' className={css.hero}>
      <div className={css.header}>
        <span>1 month</span>
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
                tickFormatter={formatShortDate}
                tickLine={false}
              />
              <YAxis
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
                formatter={(value) => [formatWeight(Number(value)), 'Weight']}
                labelFormatter={(label) => formatLongDate(String(label))}
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

function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatWeight(value: number) {
  return `${value.toFixed(1)} kg`;
}
