import { Card } from '@/components/card/Card';
import css from './WeightTrendChart.module.css';

type ChartEntry = {
  date: string;
  weightKg: number;
};

type WeightTrendChartProps = {
  entries: ChartEntry[];
};

const chartWidth = 1_000;
const chartHeight = 260;
const chartPadding = 18;
const shortDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function WeightTrendChart({ entries }: WeightTrendChartProps) {
  const visibleEntries = entries.slice(-30);
  const points = getChartPoints(visibleEntries);
  const linePath = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const areaPath = `${chartPadding},${chartHeight - chartPadding} ${linePath} ${chartWidth - chartPadding},${chartHeight - chartPadding}`;
  const firstEntry = visibleEntries[0]!;
  const lastEntry = visibleEntries[visibleEntries.length - 1]!;
  const lastPoint = points[points.length - 1]!;

  return (
    <Card as='section' className={css.card}>
      <div className={css.header}>
        <div>
          <h2>Weight trend</h2>
          <p>
            {formatShortDate(firstEntry.date)}–{formatShortDate(lastEntry.date)}
          </p>
        </div>
        <span>1 month</span>
      </div>

      <div className={css.chartFrame}>
        <svg
          aria-label={`Weight trend from ${firstEntry.weightKg.toFixed(1)} to ${lastEntry.weightKg.toFixed(1)} kilograms over the last month`}
          className={css.chart}
          preserveAspectRatio='none'
          role='img'
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          <defs>
            <linearGradient id='weight-chart-fill' x1='0' x2='0' y1='0' y2='1'>
              <stop offset='0%' stopColor='currentColor' stopOpacity='0.24' />
              <stop offset='100%' stopColor='currentColor' stopOpacity='0' />
            </linearGradient>
          </defs>
          {[0.2, 0.5, 0.8].map((position) => (
            <line
              className={css.gridLine}
              key={position}
              vectorEffect='non-scaling-stroke'
              x1={chartPadding}
              x2={chartWidth - chartPadding}
              y1={chartHeight * position}
              y2={chartHeight * position}
            />
          ))}
          <polygon className={css.area} fill='url(#weight-chart-fill)' points={areaPath} />
          <polyline
            className={css.line}
            fill='none'
            points={linePath}
            vectorEffect='non-scaling-stroke'
          />
          <circle
            className={css.endPoint}
            cx={lastPoint.x}
            cy={lastPoint.y}
            r='7'
            vectorEffect='non-scaling-stroke'
          />
        </svg>
      </div>
    </Card>
  );
}

/** Maps mock entries into a padded SVG coordinate system for the trend line. */
function getChartPoints(entries: ChartEntry[]) {
  const weights = entries.map((entry) => entry.weightKg);
  const minimum = Math.min(...weights) - 0.35;
  const maximum = Math.max(...weights) + 0.35;
  const range = maximum - minimum;
  const usableWidth = chartWidth - chartPadding * 2;
  const usableHeight = chartHeight - chartPadding * 2;

  return entries.map((entry, index) => ({
    x: chartPadding + (index / (entries.length - 1)) * usableWidth,
    y: chartPadding + ((maximum - entry.weightKg) / range) * usableHeight,
  }));
}

function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(`${value}T00:00:00Z`));
}
