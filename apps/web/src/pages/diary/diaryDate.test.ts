import { type } from 'arktype';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/getSession', () => ({ requireSession: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {} }));

import { diaryEntryDateType, formatDiaryDate } from './diary.api';

describe('diaryEntryDateType', () => {
  it('accepts a valid date-only value', () => {
    expect(diaryEntryDateType('2026-02-12')).toBe('2026-02-12');
  });

  it.each(['122324-02-12', '2026-02-30', '2026-2-12'])('rejects invalid date %s', (value) => {
    expect(diaryEntryDateType(value)).toBeInstanceOf(type.errors);
  });
});

describe('formatDiaryDate', () => {
  it('formats a valid diary date', () => {
    expect(formatDiaryDate('2026-02-12')).toBe('February 12, 2026');
  });

  it('does not throw for a legacy invalid date', () => {
    expect(formatDiaryDate('122324-02-12')).toBe('Invalid date');
  });
});
