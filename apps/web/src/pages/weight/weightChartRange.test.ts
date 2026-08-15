import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEIGHT_CHART_RANGE,
  parseWeightChartRange,
  WEIGHT_CHART_RANGES,
} from './weightChartRange';

describe('parseWeightChartRange', () => {
  it.each(WEIGHT_CHART_RANGES)('accepts the supported %s range', (range) => {
    expect(parseWeightChartRange(range)).toBe(range);
  });

  it.each([undefined, '', '30d', 'ALL', '1m; Path=/'])(
    'falls back to one month for invalid persisted input (%s)',
    (value) => {
      expect(parseWeightChartRange(value)).toBe(DEFAULT_WEIGHT_CHART_RANGE);
    },
  );
});
