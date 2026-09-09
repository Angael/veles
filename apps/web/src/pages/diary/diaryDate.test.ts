import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/getSession.server', () => ({ requireSession: vi.fn() }));
vi.mock('@/server/db.server', () => ({ db: {} }));

import { formatDiaryDate } from './diary.api';

describe('formatDiaryDate', () => {
  it('formats a valid diary date', () => {
    expect(formatDiaryDate('2026-02-12')).toBe('February 12, 2026');
  });
});
