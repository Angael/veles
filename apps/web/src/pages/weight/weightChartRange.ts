export const WEIGHT_CHART_RANGE_COOKIE = 'weight-chart-range';
export const DEFAULT_WEIGHT_CHART_RANGE = '1m' as const;
export const WEIGHT_CHART_RANGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const WEIGHT_CHART_RANGES = ['1m', '3m', '6m', '1y', '2y', '3y', 'all'] as const;

export type WeightChartRange = (typeof WEIGHT_CHART_RANGES)[number];

/** Converts persisted input into a supported range, retaining the established one-month fallback. */
export function parseWeightChartRange(value: string | undefined): WeightChartRange {
  return WEIGHT_CHART_RANGES.find((range) => range === value) ?? DEFAULT_WEIGHT_CHART_RANGE;
}

/** Persists a non-sensitive chart preference for both future SSR and browser navigation. */
export function persistWeightChartRange(range: WeightChartRange) {
  const secureAttribute = location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `${WEIGHT_CHART_RANGE_COOKIE}=${range}; Max-Age=${WEIGHT_CHART_RANGE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secureAttribute}`;
}
