import { type } from 'arktype';
import { describe, expect, it } from 'vitest';
import { diaryEntryDateType, isCalendarDate } from './diaryEntryValidation';

describe('diary entry date validation', () => {
  it.each(['0001-01-01', '2000-02-29', '2024-02-29', '9999-12-31'])(
    'accepts real canonical date %s',
    (value) => {
      expect(isCalendarDate(value)).toBe(true);
      expect(diaryEntryDateType(value)).not.toBeInstanceOf(type.errors);
    },
  );

  it.each([
    '0000-01-01',
    '1900-02-29',
    '2023-02-29',
    '2024-02-30',
    '2024-04-31',
    '2024-00-01',
    '2024-13-01',
    '2024-01-00',
    '2024-01-32',
    '2024-1-01',
    '2024-01-1',
    '2024-01-01T00:00:00Z',
    ' 2024-01-01',
    '0',
    '',
  ])('rejects malformed or impossible date %j', (value) => {
    expect(isCalendarDate(value)).toBe(false);
    expect(diaryEntryDateType(value)).toBeInstanceOf(type.errors);
  });
});
