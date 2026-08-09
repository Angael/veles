import { type } from 'arktype';
import { describe, expect, it } from 'vitest';
import { dateOnlyType } from './dateOnly';

const composedDateOnlyType = type(dateOnlyType);
const datedObjectType = type({ date: dateOnlyType });

describe('dateOnlyType', () => {
  it.each(['2026-02-12', '2024-02-29', '9999-12-31'])(
    'accepts real date-only value %s',
    (value) => {
      expect(dateOnlyType(value)).toBe(value);
      expect(composedDateOnlyType(value)).toBe(value);
      expect(datedObjectType.allows({ date: value })).toBe(true);
    },
  );

  it.each(['122324-02-12', '2026-02-29', '2026-02-30', '2026-2-12', '2026-02-12T00:00:00Z'])(
    'rejects invalid date-only value %s',
    (value) => {
      expect(dateOnlyType(value)).toBeInstanceOf(type.errors);
      expect(dateOnlyType.allows(value)).toBe(false);
    },
  );
});
