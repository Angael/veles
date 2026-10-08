import css from './ExerciseProgressList.module.css';

type SparklineProps = {
  /** Plain-language summary for screen readers and the hover title. */
  label: string;
  values: number[];
};

const WIDTH = 96;
const HEIGHT = 28;
const PAD = 3;

/**
 * Tiny single-series trend line with a dot on the latest value. No axes: the list row next to it
 * carries the numbers, the line only shows the direction.
 */
export function Sparkline({ label, values }: SparklineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => [
    PAD + (index / (values.length - 1)) * (WIDTH - PAD * 2),
    // A flat line sits in the middle instead of on the floor.
    max === min ? HEIGHT / 2 : HEIGHT - PAD - ((value - min) / span) * (HEIGHT - PAD * 2),
  ]);
  const [lastX, lastY] = points.at(-1) ?? [0, 0];

  return (
    <svg aria-label={label} className={css.sparkline} role='img' viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <title>{label}</title>
      <polyline points={points.map((point) => point.join(',')).join(' ')} />
      <circle cx={lastX} cy={lastY} r='3' />
    </svg>
  );
}
