import { ClientOnly } from '@tanstack/react-router';
import { parseISO, subMonths } from 'date-fns';
import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import css from './WeightTrendChart.module.css';
import {
  getWeightAtDate,
  WEIGHT_CHART_RANGE_MONTHS,
  type WeightChartRange,
} from './weightCalculations';
import type { WeightEntry } from './weight.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

type WeightTrendChartProps = {
  /** Smoothed trend over all entries; looked up by date for the visible points. */
  trend: WeightEntry[];
  range: WeightChartRange;
  visibleEntries: WeightEntry[];
};

type ChartPoint = { timestamp: number; trendKg?: number; weightKg: number };

const KG_DIGITS = { maximumFractionDigits: 1, minimumFractionDigits: 1 };
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

function WeightTooltip({ active, label, points }: TooltipContentProps & { points: ChartPoint[] }) {
  const { formatDate, formatNumber, t } = useI18n();
  const point = points.find((entry) => entry.timestamp === Number(label));

  if (!active || !point) {
    return null;
  }

  const kg = (value: number) => `${formatNumber(value, KG_DIGITS)} kg`;

  return (
    <div className={css.tooltip}>
      <span className={css.tooltipDate}>
        {formatDate(new Date(point.timestamp), { day: 'numeric', month: 'short' })}
      </span>
      <strong>{kg(point.weightKg)}</strong>
      {point.trendKg === undefined ? null : (
        <span className={css.tooltipTrend}>
          {t({ en: 'Trend', pl: 'Trend' })} {kg(point.trendKg)}
        </span>
      )}
    </div>
  );
}

export function WeightTrendChart({ range, trend, visibleEntries }: WeightTrendChartProps) {
  const { formatDate, formatNumber } = useI18n();
  const [chartWidth, setChartWidth] = useState(0);
  const chartEntries: ChartPoint[] = visibleEntries.map((entry) => ({
    timestamp: parseISO(entry.date).getTime(),
    trendKg: getWeightAtDate(trend, entry.date),
    weightKg: entry.weightKg,
  }));
  const weights = chartEntries.flatMap((entry) => [
    entry.weightKg,
    entry.trendKg ?? entry.weightKg,
  ]);
  const domain = [Math.floor(Math.min(...weights)), Math.ceil(Math.max(...weights))];
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
    <div className={css.chartFrame}>
      <ClientOnly fallback={<Skeleton className={css.chartSkeleton} />}>
        <ResponsiveContainer
          height='100%'
          minWidth={0}
          onResize={(width: number) => setChartWidth(width)}
          width='100%'
        >
          <ComposedChart
            accessibilityLayer={false}
            data={chartEntries}
            margin={{ bottom: 0, left: 4, right: 18, top: 8 }}
          >
            <defs>
              <linearGradient id='weight-chart-fill' x1='0' x2='0' y1='0' y2='1'>
                <stop offset='0%' stopColor='var(--c-accent)' stopOpacity={0.16} />
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
            <Tooltip
              animationDuration={0}
              content={(props) => <WeightTooltip {...props} points={chartEntries} />}
              cursor={{ stroke: 'var(--c-border-strong)' }}
            />
            <Area
              activeDot={{ fill: 'var(--c-accent)', r: 4, strokeWidth: 0 }}
              dataKey='weightKg'
              dot={false}
              fill='url(#weight-chart-fill)'
              isAnimationActive={false}
              stroke='var(--c-accent)'
              strokeOpacity={0.45}
              strokeWidth={1.5}
              type='linear'
            />
            <Line
              activeDot={false}
              dataKey='trendKg'
              dot={false}
              isAnimationActive={false}
              stroke='var(--c-accent)'
              strokeLinecap='round'
              strokeWidth={3}
              type='monotone'
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}
